import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RAW_TICKETS_FILE = path.join(process.cwd(), "data", "zendesk-tickets-raw.json");
const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const SAMPLE_SIZE = 20; // 64개 중 매번 랜덤 20개 선택

export type ScenarioCandidate = {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  products: string;
  symptomSummary: string;
  likelyRootCause: string;
  suggestedFix: string;
  sourceTicketTitle: string;
  sourceTicketUrl?: string;
};

export type ZendeskInsightsData = {
  analyzedAt: string;
  ticketsAnalyzed: number;
  query: string;
  candidates: ScenarioCandidate[];
};

type RawTicket = {
  title: string;
  topic?: string;
  product?: string;
  snippet?: string;
};

function shuffleSample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  for (const modelId of GEMINI_MODEL_IDS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
        }),
      });
      if (!res.ok) { console.warn(`[insights] Gemini ${modelId}: ${res.status}`); continue; }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (e) {
      console.warn(`[insights] ${modelId}:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error("Gemini 호출 실패");
}

// GET: 캐시 없이 항상 빈 상태 반환 (POST로만 결과 얻음)
export async function GET() {
  return NextResponse.json(
    { candidates: [], analyzedAt: null, ticketsAnalyzed: 0, query: "", analyzing: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// POST: 랜덤 샘플 티켓 → Gemini 분석 → 즉시 반환
export async function POST() {
  if (!fs.existsSync(RAW_TICKETS_FILE)) {
    return NextResponse.json({ error: "zendesk-tickets-raw.json 없음" }, { status: 500 });
  }

  const { tickets } = JSON.parse(fs.readFileSync(RAW_TICKETS_FILE, "utf-8")) as { tickets: RawTicket[] };
  const sample = shuffleSample(tickets, SAMPLE_SIZE);

  const ticketList = sample
    .map((t, i) => `${i + 1}. [${t.product ?? "?"}] ${t.title}\n   ${(t.snippet ?? "").slice(0, 200)}`)
    .join("\n\n");

  const prompt = `당신은 Datadog TSE 교육용 fixitfaster 챌린지를 설계하는 전문가입니다.

아래 Zendesk 티켓 목록에서 fixitfaster 챌린지로 적합한 후보를 3~5개 골라주세요.

선택 기준:
- Docker 환경에서 설정 파일(docker-compose.yml, datadog.yaml, 환경변수) 수정으로 재현/해결 가능
- 증상과 원인이 명확한 configuration 이슈
- TSE 교육에 실용적

## 티켓 목록 (랜덤 샘플 ${sample.length}개)
${ticketList}

## 출력 형식
순수 JSON 배열만 출력 (마크다운 코드블록 없이):
[
  {
    "title": "짧고 명확한 영어 제목",
    "difficulty": "Easy",
    "products": "Agent, Logs",
    "symptomSummary": "사용자가 겪는 증상 1-2문장 (한국어)",
    "likelyRootCause": "설정 관련 근본 원인 1문장 (한국어)",
    "suggestedFix": "해결 방법 1-2문장 (한국어)",
    "sourceTicketTitle": "원본 티켓 제목 그대로"
  }
]`;

  try {
    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const candidates = JSON.parse(cleaned) as ScenarioCandidate[];

    return NextResponse.json(
      {
        candidates,
        analyzedAt: new Date().toISOString(),
        ticketsAnalyzed: sample.length,
        query: `random sample of ${sample.length}/${tickets.length} tickets`,
        analyzing: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
