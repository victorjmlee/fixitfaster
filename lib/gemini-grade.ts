import { REFERENCE_ANSWERS } from "./reference-answers";

const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro"];

export type GradeResult = { score: number; feedback?: string };

export type GradeSkipReason = "no_key" | "no_ref" | "quota" | "api_error";

export type GradeOutcome =
  | { success: true; score: number; feedback?: string }
  | { success: false; reason: GradeSkipReason };

function buildPrompt(ref: { rootCause: string; resolution: string }, causeSummary: string, steps: string): string {
  return `You are a grader for a troubleshooting challenge. Compare the participant's answer to the reference answer and give a score from 0 to 100.

Reference answer (Korean):
- Root cause: ${ref.rootCause}
- Resolution: ${ref.resolution}

Participant's answer:
- Root cause summary: ${causeSummary || "(empty)"}
- Resolution steps: ${steps || "(empty)"}

Respond with exactly two lines:
Line 1: A single integer from 0 to 100 (the score). No other text.
Line 2: Optional one-line feedback in Korean (what was good or missing). If none, write "-"

Example:
85
원인(호스트명)을 정확히 짚었고, 해결 단계도 적절함.`;
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

/**
 * 참가자 답변을 정답과 비교해 0~100 점수 반환.
 * AI Gateway 설정 시 우선 사용, 없으면 Gemini. 실패 시 reason 반환.
 */
export async function gradeSubmission(
  challengeId: string,
  causeSummary: string,
  steps: string
): Promise<GradeOutcome> {
  const ref = REFERENCE_ANSWERS[challengeId];
  if (!ref) return { success: false, reason: "no_ref" };

  const prompt = buildPrompt(ref, causeSummary, steps);
  let text: string | null = null;
  let firstStatus: number | null = null;

  const hasAiGateway = !!(process.env.AI_GATEWAY_BASE_URL?.trim() && process.env.AI_GATEWAY_TOKEN?.trim());
  console.log("[grade] Config: AI_GATEWAY=" + (hasAiGateway ? "yes" : "no") + " GEMINI_KEY=" + (process.env.GEMINI_API_KEY?.trim() ? "yes" : "no"));

  // 1) Try AI Gateway if configured
  if (hasAiGateway) {
    const out = await callAiGateway(prompt);
    if (out.ok) {
      text = out.text;
      console.log("[grade] Used AI Gateway");
    } else if (out.status) firstStatus = out.status;
  }

  // 2) Fallback to Gemini
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
        console.log(`[grade] Used Gemini: ${modelId}`);
        break;
      }
      if (firstStatus === null) firstStatus = out.status;
    }
  }

  if (!text) {
    console.error("[grade] All backends failed");
    return { success: false, reason: firstStatus === 429 ? "quota" : "api_error" };
  }

  const { score, feedback } = parseScoreFromText(text);
  return { success: true, score, feedback };
}
