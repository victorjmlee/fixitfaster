export type Submission = {
  id: string;
  challengeId: string;
  participantName: string;
  causeSummary: string;
  steps: string;
  docLinks: string;
  elapsedSeconds: number;
  submittedAt: string;
  score?: number;
  artifactScore?: number;
};

const KV_KEY = "submissions";

// --- KV (Redis) backend ---
let _kv: ReturnType<typeof import("@vercel/kv").createClient> | null | undefined;

async function getKv() {
  if (_kv !== undefined) return _kv;
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) { _kv = null; return null; }
  const { createClient } = await import("@vercel/kv");
  _kv = createClient({ url, token });
  return _kv;
}

// --- Read/Write with KV primary, file fallback ---
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
let memoryFallback: Submission[] | null = null;

function readSubmissionsFile(): Submission[] {
  if (memoryFallback !== null) return memoryFallback;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch { memoryFallback = memoryFallback ?? []; return memoryFallback; }
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8")); } catch { return []; }
}

function writeSubmissionsFile(list: Submission[]) {
  if (memoryFallback !== null) { memoryFallback = list; return; }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch { memoryFallback = list; }
}

async function readSubmissions(): Promise<Submission[]> {
  const kv = await getKv();
  if (kv) {
    try {
      const raw = await kv.get(KV_KEY);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch { return []; }
  }
  return readSubmissionsFile();
}

async function writeSubmissions(list: Submission[]) {
  const kv = await getKv();
  if (kv) {
    try { await kv.set(KV_KEY, JSON.stringify(list)); } catch {}
    return;
  }
  writeSubmissionsFile(list);
}

// --- Public API (async, same interface) ---

export async function addSubmission(s: Omit<Submission, "id" | "submittedAt">): Promise<Submission> {
  const list = await readSubmissions();
  const submission: Submission = {
    ...s,
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    submittedAt: new Date().toISOString(),
  };
  list.push(submission);
  await writeSubmissions(list);
  return submission;
}

export async function updateSubmission(
  id: string,
  patch: Partial<Pick<Submission, "score" | "artifactScore" | "causeSummary" | "steps">>
): Promise<Submission | null> {
  const list = await readSubmissions();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch };
  await writeSubmissions(list);
  return list[i];
}

export async function getLatestSubmissionByParticipantAndChallenge(
  participantName: string,
  challengeId: string
): Promise<Submission | null> {
  const name = participantName?.trim();
  if (!name) return null;
  const list = (await readSubmissions())
    .filter((s) => s.challengeId === challengeId && s.participantName.trim() === name)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return list[0] ?? null;
}

export async function getSubmissionsByChallenge(challengeId: string): Promise<Submission[]> {
  return (await readSubmissions()).filter((s) => s.challengeId === challengeId);
}

export async function getSubmissionChallengeIdsByParticipant(participantName: string): Promise<string[]> {
  const name = participantName?.trim();
  if (!name) return [];
  const set = new Set<string>();
  for (const s of await readSubmissions()) {
    if (s.participantName.trim() === name) set.add(s.challengeId);
  }
  return Array.from(set);
}

export async function getScoresByParticipant(participantName: string): Promise<Record<string, number>> {
  const name = participantName?.trim();
  if (!name) return {};
  const scores: Record<string, number> = {};
  for (const s of await readSubmissions()) {
    if (s.participantName.trim() !== name) continue;
    const prev = scores[s.challengeId] ?? -1;
    if ((s.score ?? 0) > prev) scores[s.challengeId] = s.score ?? 0;
  }
  return scores;
}

export async function getLeaderboard(challengeId?: string): Promise<Submission[]> {
  let list = await readSubmissions();
  if (challengeId) list = list.filter((s) => s.challengeId === challengeId);
  return list.sort((a, b) => {
    const scoreA = a.score ?? -1;
    const scoreB = b.score ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.elapsedSeconds - b.elapsedSeconds;
  });
}

export type LeaderboardRow = {
  participantName: string;
  totalScore: number;
  totalTime: number;
  submissionCount: number;
  lastSubmittedAt: string;
  scoresByChallenge: Record<string, number>;
};

export async function getLeaderboardAggregated(): Promise<LeaderboardRow[]> {
  const list = (await readSubmissions()).sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const byName = new Map<
    string,
    { totalTime: number; count: number; lastAt: string; scores: Record<string, number> }
  >();
  for (const s of list) {
    const key = s.participantName.trim() || "(anonymous)";
    const cur = byName.get(key) ?? { totalTime: 0, count: 0, lastAt: s.submittedAt, scores: {} };
    const nextScores = { ...cur.scores };
    if (s.score != null) nextScores[s.challengeId] = s.score;
    byName.set(key, {
      totalTime: cur.totalTime + s.elapsedSeconds,
      count: cur.count + 1,
      lastAt: s.submittedAt > cur.lastAt ? s.submittedAt : cur.lastAt,
      scores: nextScores,
    });
  }
  return Array.from(byName.entries())
    .map(([participantName, v]) => ({
      participantName,
      totalScore: Object.values(v.scores).reduce((a, b) => a + b, 0),
      totalTime: v.totalTime,
      submissionCount: v.count,
      lastSubmittedAt: v.lastAt,
      scoresByChallenge: v.scores,
    }))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTime - b.totalTime;
    });
}

export async function clearSubmissions(): Promise<void> {
  const kv = await getKv();
  if (kv) { try { await kv.set(KV_KEY, "[]"); } catch {} return; }
  writeSubmissionsFile([]);
}
