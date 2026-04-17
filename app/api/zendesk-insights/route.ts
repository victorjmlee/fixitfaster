import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const DATA_DIR = path.join(process.cwd(), "data");
const RAW_TICKETS_FILE = path.join(DATA_DIR, "zendesk-tickets-raw.json");
const USED_TICKETS_FILE = path.join(DATA_DIR, "used-tickets.json");
const GLEAN_STATUS_FILE = path.join(DATA_DIR, "zendesk-glean-status.json");
const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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
  totalTickets: number;
  usedTickets: number;
  query: string;
  candidates: ScenarioCandidate[];
  gleanFetching?: boolean;
};

type RawTicket = { title: string; topic?: string; product?: string; snippet?: string };

// ─── Gemini 호출 ─────────────────────────────────────────────────────────────

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

// ─── GET: 상태 반환 ───────────────────────────────────────────────────────────

export async function GET() {
  const gleanFetching = fs.existsSync(GLEAN_STATUS_FILE);
  const totalTickets = fs.existsSync(RAW_TICKETS_FILE)
    ? (JSON.parse(fs.readFileSync(RAW_TICKETS_FILE, "utf-8")) as { tickets: RawTicket[] }).tickets.length
    : 0;
  const usedTickets = fs.existsSync(USED_TICKETS_FILE)
    ? (JSON.parse(fs.readFileSync(USED_TICKETS_FILE, "utf-8")) as { usedTickets: string[] }).usedTickets.length
    : 0;

  return NextResponse.json(
    { candidates: [], analyzedAt: null, ticketsAnalyzed: 0, totalTickets, usedTickets, gleanFetching },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// ─── POST: 미사용 티켓 → Gemini 분석 (빠름) ─────────────────────────────────

export async function POST() {
  if (!fs.existsSync(RAW_TICKETS_FILE)) {
    return NextResponse.json(
      { error: "티켓 데이터가 없어요. 먼저 'Zendesk 새로 가져오기'를 눌러주세요." },
      { status: 400 }
    );
  }

  const { tickets } = JSON.parse(fs.readFileSync(RAW_TICKETS_FILE, "utf-8")) as { tickets: RawTicket[] };
  const usedTitles: string[] = fs.existsSync(USED_TICKETS_FILE)
    ? (JSON.parse(fs.readFileSync(USED_TICKETS_FILE, "utf-8")) as { usedTickets: string[] }).usedTickets
    : [];

  // 사용된 티켓 제외
  const unused = tickets.filter((t) => !usedTitles.includes(t.title));
  const pool = unused.length >= 15 ? unused : tickets; // 미사용이 너무 적으면 전체 풀 사용
  const sample = pool.sort(() => Math.random() - 0.5).slice(0, 20);

  const ticketList = sample
    .map((t, i) => `${i + 1}. [${t.product ?? "?"}] ${t.title}\n   ${(t.snippet ?? "").slice(0, 200)}`)
    .join("\n\n");

  const usedNote = usedTitles.length > 0
    ? `\n이미 챌린지로 만든 티켓 제목 (제외할 것):\n${usedTitles.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  const prompt = `당신은 Datadog TSE 교육용 fixitfaster 챌린지를 설계하는 전문가입니다.
${usedNote}
아래 Zendesk 티켓 목록에서 fixitfaster 챌린지로 적합한 새로운 후보를 3~5개 골라주세요.

## 선택 기준
- **재현 가능성**: docker-compose.yml 환경변수 수정 또는 앱 컨테이너 설정 변경으로 broken 상태를 만들고 해결 가능
- **Root cause 명확**: 어떤 설정이 잘못되어 어떤 증상이 생겼는지 한 문장으로 설명 가능
- **제품 다양성**: APM, Logs, Metrics, Infrastructure 등 다양하게
- **TSE 실습용**: 30분 이내 Agent 또는 앱 컨테이너 설정 수정으로 해결 가능

## 티켓 목록 (미사용 ${unused.length}개 중 ${sample.length}개 샘플)
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
        totalTickets: tickets.length,
        usedTickets: usedTitles.length,
        query: `${unused.length} unused / ${tickets.length} total`,
        gleanFetching: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// ─── PUT: Glean으로 신선한 티켓 fetch (느림, background) ────────────────────

export async function PUT() {
  if (fs.existsSync(GLEAN_STATUS_FILE)) {
    return NextResponse.json({ error: "이미 가져오는 중입니다" }, { status: 409 });
  }

  fs.writeFileSync(GLEAN_STATUS_FILE, JSON.stringify({ startedAt: new Date().toISOString() }));

  const rawPath = RAW_TICKETS_FILE;
  const prompt = `Glean MCP를 사용해서 Zendesk 티켓을 검색해줘.

아래 6개 쿼리로 각각 검색해. 각 쿼리마다 최대한 많은 결과를 가져와:
1. "datadog agent not working configuration" (app: zendesk)
2. "data not showing up datadog" (app: zendesk)
3. "datadog configuration environment variable" (app: zendesk)
4. "datadog not collecting container" (app: zendesk)
5. "datadog setup not sending" (app: zendesk)
6. "datadog troubleshooting misconfigured" (app: zendesk)

검색 결과를 모아서 아래 형식의 JSON을 ${rawPath} 파일에 저장해줘 (파일 전체를 덮어써):

{
  "fetchedAt": "<현재 ISO 8601 시각>",
  "tickets": [
    {
      "title": "티켓 제목",
      "product": "관련 제품",
      "snippet": "티켓 내용 요약 (200자 이내)"
    }
  ]
}

중복 제거하고 최대한 많은 티켓을 수집해줘. 파일 저장 후 "완료"라고만 말해줘.`;

  execFileAsync("claude", ["--print", "--dangerously-skip-permissions", prompt], {
    timeout: 300_000,
    env: { ...process.env, HOME: process.env.HOME ?? "/Users/victor.lee" },
  })
    .catch((e) => console.error("[zendesk-glean] claude CLI error:", e.message))
    .finally(() => {
      try { fs.unlinkSync(GLEAN_STATUS_FILE); } catch {}
    });

  return NextResponse.json({ gleanFetching: true, message: "Glean 검색 시작됨" });
}
