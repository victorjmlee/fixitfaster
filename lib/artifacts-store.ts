import fs from "fs";
import path from "path";

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const TTL_SEC = Math.floor(TTL_MS / 1000);

type ArtifactEntry = { artifacts: string; at: number };

function keyFile(challengeId: string, participantName: string): string {
  return `${challengeId}:${participantName.trim()}`;
}
function keyKv(challengeId: string, participantName: string): string {
  return `artifacts:${challengeId}:${participantName.trim()}`;
}

// --- File backend (local / no KV) with in-memory fallback for read-only FS (Vercel)
const DATA_DIR = path.join(process.cwd(), "data");
const ARTIFACTS_FILE = path.join(DATA_DIR, "artifacts.json");

let memoryFallback: Record<string, ArtifactEntry> | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    if (memoryFallback === null) {
      memoryFallback = {};
      console.warn("[artifacts] Filesystem read-only, using in-memory fallback. Configure KV (REDIS_URL or KV_REST_API_URL) for persistence.");
    }
  }
}

function readAllFile(): Record<string, ArtifactEntry> {
  if (memoryFallback !== null) return memoryFallback;
  ensureDataDir();
  if (memoryFallback !== null) return memoryFallback;
  if (!fs.existsSync(ARTIFACTS_FILE)) return {};
  try {
    const raw = fs.readFileSync(ARTIFACTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAllFile(data: Record<string, ArtifactEntry>) {
  if (memoryFallback !== null) {
    memoryFallback = data;
    return;
  }
  try {
    ensureDataDir();
    if (memoryFallback !== null) {
      memoryFallback = data;
      return;
    }
    fs.writeFileSync(ARTIFACTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    memoryFallback = data;
    console.warn("[artifacts] File write failed, using in-memory fallback.");
  }
}

// --- KV backend (Vercel: persists across serverless invocations)
// 1) REDIS_URL (Redis Cloud 등 redis:// 연결 문자열)
// 2) KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV)
// 3) UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash)
async function getKv() {
  // 1) TCP Redis (REDIS_URL)
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      const { createClient } = await import("redis");
      const client = createClient({ url: redisUrl });
      await client.connect();
      return {
        set: async (k: string, v: string, opts?: { ex?: number }) => {
          await client.set(k, v, opts?.ex ? { EX: opts.ex } : {});
        },
        get: async (k: string) => client.get(k),
        del: async (k: string) => client.del(k),
      };
    } catch (e) {
      console.warn("[artifacts] REDIS_URL connect failed, trying REST API fallback:", e instanceof Error ? e.message : String(e));
      // fall through to REST API
    }
  }
  // 2) REST API (Vercel KV / Upstash) — also used as fallback when REDIS_URL fails
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const { createClient } = await import("@vercel/kv");
  return createClient({ url, token });
}

/** Save artifacts (Codespace script). Overwrites previous. Use KV on Vercel so they persist. */
export async function saveArtifacts(
  challengeId: string,
  participantName: string,
  artifacts: string
): Promise<void> {
  const entry: ArtifactEntry = { artifacts: artifacts.slice(0, 50000), at: Date.now() };

  const kv = await getKv();
  if (kv) {
    await kv.set(keyKv(challengeId, participantName), JSON.stringify(entry), { ex: TTL_SEC });
    return;
  }
  const data = readAllFile();
  data[keyFile(challengeId, participantName)] = entry;
  writeAllFile(data);
}

/** Get and remove artifacts for this challenge+participant. One-time use for grading.
 *  Tries challengeId-specific key first, then falls back to "_auto" key (auto-push). */
export async function getAndConsumeArtifacts(
  challengeId: string,
  participantName: string
): Promise<string | null> {
  const kv = await getKv();
  if (kv) {
    for (const cid of [challengeId, "_auto"]) {
      const k = keyKv(cid, participantName);
      const raw = await kv.get<string>(k);
      if (!raw) continue;
      let entry: ArtifactEntry;
      try {
        entry = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        continue;
      }
      if (Date.now() - entry.at > TTL_MS) {
        await kv.del(k);
        continue;
      }
      await kv.del(k);
      return entry.artifacts;
    }
    return null;
  }

  const data = readAllFile();
  for (const cid of [challengeId, "_auto"]) {
    const k = keyFile(cid, participantName);
    const entry = data[k];
    if (!entry) continue;
    if (Date.now() - entry.at > TTL_MS) {
      delete data[k];
      writeAllFile(data);
      continue;
    }
    delete data[k];
    writeAllFile(data);
    return entry.artifacts;
  }
  return null;
}
