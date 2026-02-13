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

// --- File backend (local / no KV)
const DATA_DIR = path.join(process.cwd(), "data");
const ARTIFACTS_FILE = path.join(DATA_DIR, "artifacts.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function readAllFile(): Record<string, ArtifactEntry> {
  ensureDataDir();
  if (!fs.existsSync(ARTIFACTS_FILE)) return {};
  try {
    const raw = fs.readFileSync(ARTIFACTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAllFile(data: Record<string, ArtifactEntry>) {
  try {
    ensureDataDir();
    fs.writeFileSync(ARTIFACTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    /* ignore */
  }
}

// --- KV backend (Vercel: persists across serverless invocations)
async function getKv(): Promise<typeof import("@vercel/kv").kv | null> {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
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

/** Get and remove artifacts for this challenge+participant. One-time use for grading. */
export async function getAndConsumeArtifacts(
  challengeId: string,
  participantName: string
): Promise<string | null> {
  const kv = await getKv();
  if (kv) {
    const k = keyKv(challengeId, participantName);
    const raw = await kv.get<string>(k);
    if (!raw) return null;
    let entry: ArtifactEntry;
    try {
      entry = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
    if (Date.now() - entry.at > TTL_MS) {
      await kv.del(k);
      return null;
    }
    await kv.del(k);
    return entry.artifacts;
  }

  const k = keyFile(challengeId, participantName);
  const data = readAllFile();
  const entry = data[k];
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    delete data[k];
    writeAllFile(data);
    return null;
  }
  delete data[k];
  writeAllFile(data);
  return entry.artifacts;
}
