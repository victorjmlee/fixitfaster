import fs from "fs";
import path from "path";

export type Submission = {
  id: string;
  challengeId: string;
  participantName: string;
  causeSummary: string;
  steps: string;
  docLinks: string;
  elapsedSeconds: number;
  submittedAt: string;
  /** 0–100, Gemini 채점 결과. 없으면 미채점 */
  score?: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

let memoryFallback: Submission[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    memoryFallback = memoryFallback ?? [];
  }
}

function readSubmissions(): Submission[] {
  if (memoryFallback !== null) return memoryFallback;
  ensureDataDir();
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeSubmissions(list: Submission[]) {
  if (memoryFallback !== null) {
    memoryFallback = list;
    return;
  }
  try {
    ensureDataDir();
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    memoryFallback = list;
  }
}

export function addSubmission(s: Omit<Submission, "id" | "submittedAt">): Submission {
  const list = readSubmissions();
  const submission: Submission = {
    ...s,
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    submittedAt: new Date().toISOString(),
  };
  list.push(submission);
  writeSubmissions(list);
  return submission;
}

export function updateSubmission(
  id: string,
  patch: Partial<Pick<Submission, "score">>
): Submission | null {
  const list = readSubmissions();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch };
  writeSubmissions(list);
  return list[i];
}

export function getSubmissionsByChallenge(challengeId: string): Submission[] {
  return readSubmissions().filter((s) => s.challengeId === challengeId);
}

/** 참가자 이름으로 제출한 챌린지 ID 목록 (중복 제거) */
export function getSubmissionChallengeIdsByParticipant(participantName: string): string[] {
  const name = participantName?.trim();
  if (!name) return [];
  const set = new Set<string>();
  for (const s of readSubmissions()) {
    if (s.participantName.trim() === name) set.add(s.challengeId);
  }
  return Array.from(set);
}

export function getLeaderboard(challengeId?: string): Submission[] {
  let list = readSubmissions();
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
  /** 시나리오별 점수 (같은 시나리오 여러 제출 시 마지막 제출 점수) */
  scoresByChallenge: Record<string, number>;
};

/** 참가자별 점수 합산, 등수: 총점 높은 순 → 총 시간 짧은 순 */
export function getLeaderboardAggregated(): LeaderboardRow[] {
  const list = readSubmissions().sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const byName = new Map<
    string,
    { totalTime: number; count: number; lastAt: string; scores: Record<string, number> }
  >();
  for (const s of list) {
    const key = s.participantName.trim() || "(anonymous)";
    const cur = byName.get(key) ?? {
      totalTime: 0,
      count: 0,
      lastAt: s.submittedAt,
      scores: {},
    };
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
    .map(([participantName, v]) => {
      const totalScore = Object.values(v.scores).reduce((a, b) => a + b, 0);
      return {
        participantName,
        totalScore,
        totalTime: v.totalTime,
        submissionCount: v.count,
        lastSubmittedAt: v.lastAt,
        scoresByChallenge: v.scores,
      };
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTime - b.totalTime;
    });
}

export function clearSubmissions(): void {
  const empty: Submission[] = [];
  if (memoryFallback !== null) {
    memoryFallback = empty;
    return;
  }
  ensureDataDir();
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, "[]", "utf-8");
  } catch {
    memoryFallback = empty;
  }
}
