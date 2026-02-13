import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ARTIFACTS_FILE = path.join(DATA_DIR, "artifacts.json");
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

type ArtifactEntry = { artifacts: string; at: number };

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function readAll(): Record<string, ArtifactEntry> {
  ensureDataDir();
  if (!fs.existsSync(ARTIFACTS_FILE)) return {};
  try {
    const raw = fs.readFileSync(ARTIFACTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ArtifactEntry>) {
  try {
    ensureDataDir();
    fs.writeFileSync(ARTIFACTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    /* ignore */
  }
}

function key(challengeId: string, participantName: string): string {
  return `${challengeId}:${participantName.trim()}`;
}

/** Save artifacts for a participant's challenge (e.g. from Codespace script). Overwrites previous. */
export function saveArtifacts(
  challengeId: string,
  participantName: string,
  artifacts: string
): void {
  const data = readAll();
  data[key(challengeId, participantName)] = { artifacts: artifacts.slice(0, 50000), at: Date.now() };
  writeAll(data);
}

/** Get and remove artifacts for this challenge+participant if present and not expired. One-time use for grading. */
export function getAndConsumeArtifacts(
  challengeId: string,
  participantName: string
): string | null {
  const data = readAll();
  const k = key(challengeId, participantName);
  const entry = data[k];
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    delete data[k];
    writeAll(data);
    return null;
  }
  delete data[k];
  writeAll(data);
  return entry.artifacts;
}
