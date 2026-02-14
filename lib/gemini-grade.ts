import { REFERENCE_ANSWERS } from "./reference-answers";

const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro"];

export type GradeSkipReason = "no_key" | "no_ref" | "quota" | "api_error";

export type GradeOutcome =
  | { success: true; score: number; artifactScore?: number; feedback?: string }
  | { success: false; reason: GradeSkipReason };

/** 솔루션(원인/해결) 텍스트만 0~100으로 채점. */
function buildPromptForSolution(
  ref: { rootCause: string; resolution: string },
  causeSummary: string,
  steps: string
): string {
  return `You are a grader. Score ONLY the participant's written solution (root cause + resolution) from 0 to 100.
Reference (what we expect):
- Root cause: ${ref.rootCause}
- Resolution: ${ref.resolution}

Participant's written answer:
- Cause summary: ${causeSummary || "(empty)"}
- Resolution steps: ${steps || "(empty)"}

Give 0-100: 0 = wrong or empty, 50-70 = partial, 71-85 = good match, 86-100 = clear and accurate.
Respond with exactly two lines:
Line 1: A single integer 0-100.
Line 2: One-line feedback in Korean or "-"`;
}

function parseScoreFromText(text: string): { score: number; feedback?: string } {
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
  // Prompt asks "Line 1: single integer 0-100" — use first line; avoid taking "0" from "0-100"
  const firstLine = lines[0] ?? "";
  const numbersOnFirstLine = Array.from(firstLine.matchAll(/\b(\d{1,3})\b/g), (m) =>
    Math.min(100, Math.max(0, parseInt(m[1], 10)))
  );
  const scoreInRange = numbersOnFirstLine.find((n) => n >= 1 && n <= 100);
  const scoreFromFirstLine =
    scoreInRange ?? (numbersOnFirstLine[0] != null ? numbersOnFirstLine[0] : null);
  const score =
    scoreFromFirstLine != null
      ? scoreFromFirstLine
      : Math.min(100, Math.max(0, parseInt(text.match(/\b(\d{1,3})\b/)?.[1] ?? "0", 10) || 0));
  const feedback =
    lines[1] && lines[1] !== "-" && !/^\d+$/.test(lines[1]) ? lines[1] : undefined;
  return { score, feedback };
}

// --- AI Gateway (OpenAI-compatible) ---
const AI_GATEWAY_MODEL = "openai/gpt-4o-mini";

async function callAiGateway(prompt: string): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const baseUrl = process.env.AI_GATEWAY_BASE_URL?.trim()?.replace(/\/$/, "");
  const token = process.env.AI_GATEWAY_TOKEN?.trim();
  const source = process.env.AI_GATEWAY_SOURCE?.trim() || "fixitfaster-leaderboard";
  const orgId = process.env.AI_GATEWAY_ORG_ID?.trim() || "2";
  if (!baseUrl || !token) {
    if (!baseUrl) console.warn("[grade] AI Gateway: AI_GATEWAY_BASE_URL not set");
    if (!token) console.warn("[grade] AI Gateway: AI_GATEWAY_TOKEN not set");
    return { ok: false, status: 0 };
  }

  const url = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    source,
    "org-id": orgId,
  };
  if (process.env.AI_GATEWAY_EVAL === "true" || process.env.AI_GATEWAY_EVAL === "1") {
    headers["x-target-account"] = "eval";
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: AI_GATEWAY_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[grade] AI Gateway failed: ${res.status}`, err.slice(0, 400));
      return { ok: false, status: res.status };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.warn("[grade] AI Gateway: 200 but no content in choices[0].message.content", JSON.stringify(data).slice(0, 300));
      return { ok: false, status: 0 };
    }
    return { ok: true, text };
  } catch (e) {
    console.warn("[grade] AI Gateway request failed (network/unreachable):", e instanceof Error ? e.message : String(e));
    return { ok: false, status: 0 };
  }
}

// --- Gemini (direct) ---
async function callGemini(
  apiKey: string,
  modelId: string,
  prompt: string
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[grade] Gemini ${modelId} failed: ${res.status} ${err.slice(0, 200)}`);
      return { ok: false, status: res.status };
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text ? { ok: true, text } : { ok: false, status: 0 };
  } catch (e) {
    console.warn(`[grade] Gemini ${modelId} request failed (network):`, e instanceof Error ? e.message : String(e));
    return { ok: false, status: 0 };
  }
}

/** Word-boundary match: escapes regex special chars, then wraps with \b */
function wordMatch(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/** Extract the git diff section from the artifact blob. */
function extractDiffSection(artifacts: string): string {
  const diffStart = artifacts.indexOf("=== git diff");
  if (diffStart < 0) return "";
  const afterHeader = artifacts.indexOf("\n", diffStart);
  if (afterHeader < 0) return "";
  const nextSection = artifacts.indexOf("\n===", afterHeader);
  return nextSection < 0
    ? artifacts.slice(afterHeader)
    : artifacts.slice(afterHeader, nextSection);
}

/**
 * artifacts만 있을 때 정답지(artifactCheck)로 채점. 조건 하나라도 만족하면 점수 부여 (Gemini 호출 안 함).
 * git diff 섹션만 검사하여 변경 없는 제출로 점수 받는 것 방지.
 */
function gradeFromArtifactPatterns(
  challengeId: string,
  artifacts: string,
  ref: { artifactCheck?: string[][]; artifactScore?: number }
): number | null {
  const check = ref?.artifactCheck;
  if (!check?.length) return null;

  const diff = extractDiffSection(artifacts);
  if (!diff.trim()) {
    console.log("[grade] No git diff found in artifacts, skip pattern check challengeId=%s", challengeId);
    return null;
  }

  for (const condition of check) {
    if (condition.length === 0) continue;
    const allPresent = condition.every((s) => wordMatch(diff, s));
    if (allPresent) {
      const score = ref.artifactScore ?? 75;
      console.log("[grade] Artifact check pass challengeId=%s condition=%s score=%d", challengeId, condition.join(","), score);
      return score;
    }
  }
  console.log("[grade] Artifact check miss challengeId=%s diffLen=%d sample=%s", challengeId, diff.length, diff.slice(0, 400).replace(/\n/g, " "));
  return null;
}

const SOLUTION_MAX_POINTS = 20;

/**
 * 참가자 채점: 결과(artifact) 점수 + 솔루션(원인/해결 작성) 0~20점.
 * - artifact만: 패턴 통과 시 시나리오별 점수(50~80), 미통과 시 65.
 * - artifact + 솔루션 작성: 결과 점수 + Gemini로 솔루션 0~20점, 합산(캡 100).
 */
export async function gradeSubmission(
  challengeId: string,
  causeSummary: string,
  steps: string,
  artifacts?: string | null
): Promise<GradeOutcome> {
  const ref = REFERENCE_ANSWERS[challengeId];
  if (!ref) return { success: false, reason: "no_ref" };

  const textEmpty = !(causeSummary?.trim() || steps?.trim());

  // 1) artifact만 제출: 패턴으로 결과 점수만 부여. 패턴 미충족/아티팩트 너무 짧으면 0점.
  if (textEmpty && artifacts?.trim()) {
    const patternScore = gradeFromArtifactPatterns(challengeId, artifacts, ref);
    if (patternScore != null) return { success: true, score: patternScore, artifactScore: patternScore };
    console.log("[grade] Artifact-only, pattern miss or too short → 0 challengeId=%s", challengeId);
    return { success: true, score: 0, artifactScore: 0 };
  }

  // 2) 솔루션 작성함: 결과 점수(패턴) + 솔루션 0~20
  const artifactPart = artifacts?.trim()
    ? (gradeFromArtifactPatterns(challengeId, artifacts, ref) ?? 0)
    : 0;
  const prompt = buildPromptForSolution(ref, causeSummary, steps);
  let text: string | null = null;
  let firstStatus: number | null = null;

  const hasAiGateway = !!(process.env.AI_GATEWAY_BASE_URL?.trim() && process.env.AI_GATEWAY_TOKEN?.trim());
  if (hasAiGateway) {
    const out = await callAiGateway(prompt);
    if (out.ok) text = out.text;
    else if (out.status) firstStatus = out.status;
  }
  if (!text) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      if (firstStatus === null) return { success: false, reason: "no_key" };
      return { success: false, reason: firstStatus === 429 ? "quota" : "api_error" };
    }
    for (const modelId of GEMINI_MODEL_IDS) {
      const out = await callGemini(apiKey, modelId, prompt);
      if (out.ok) {
        text = out.text;
        break;
      }
      if (firstStatus === null) firstStatus = out.status;
    }
  }
  if (!text) {
    return { success: false, reason: firstStatus === 429 ? "quota" : "api_error" };
  }

  const { score: solution100, feedback } = parseScoreFromText(text);
  const maxSolution = ref.solutionMaxPoints ?? SOLUTION_MAX_POINTS;
  const solutionPart = Math.round((solution100 / 100) * maxSolution);
  const total = Math.min(100, artifactPart + solutionPart);
  console.log("[grade] challengeId=%s artifactPart=%d solutionPart=%d total=%d", challengeId, artifactPart, solutionPart, total);
  return { success: true, score: total, artifactScore: artifactPart, feedback };
}

/**
 * 솔루션(원인/해결) 텍스트만 0~20점으로 채점. 기존 제출에 솔루션 추가 시 사용.
 */
export async function gradeSolutionOnly(
  challengeId: string,
  causeSummary: string,
  steps: string
): Promise<GradeOutcome> {
  const ref = REFERENCE_ANSWERS[challengeId];
  if (!ref) return { success: false, reason: "no_ref" };
  if (!(causeSummary?.trim() || steps?.trim())) {
    return { success: true, score: 0 };
  }
  const prompt = buildPromptForSolution(ref, causeSummary, steps);
  let text: string | null = null;
  let firstStatus: number | null = null;
  const hasAiGateway = !!(process.env.AI_GATEWAY_BASE_URL?.trim() && process.env.AI_GATEWAY_TOKEN?.trim());
  if (hasAiGateway) {
    const out = await callAiGateway(prompt);
    if (out.ok) text = out.text;
    else if (out.status) firstStatus = out.status;
  }
  if (!text) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      if (firstStatus === null) return { success: false, reason: "no_key" };
      return { success: false, reason: firstStatus === 429 ? "quota" : "api_error" };
    }
    for (const modelId of GEMINI_MODEL_IDS) {
      const out = await callGemini(apiKey, modelId, prompt);
      if (out.ok) {
        text = out.text;
        break;
      }
      if (firstStatus === null) firstStatus = out.status;
    }
  }
  if (!text) {
    return { success: false, reason: firstStatus === 429 ? "quota" : "api_error" };
  }
  const { score: solution100 } = parseScoreFromText(text);
  const maxSolution = ref.solutionMaxPoints ?? SOLUTION_MAX_POINTS;
  const solutionPart = Math.round((solution100 / 100) * maxSolution);
  console.log("[grade] Solution-only challengeId=%s solutionPart=%d", challengeId, solutionPart);
  return { success: true, score: solutionPart };
}
