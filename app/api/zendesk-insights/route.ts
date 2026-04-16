import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const INSIGHTS_FILE = path.join(process.cwd(), "data", "zendesk-insights.json");
const STATUS_FILE = path.join(process.cwd(), "data", "zendesk-insights-status.json");

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

// GET: 현재 결과 + 분석 진행 상태
export async function GET() {
  const analyzing = fs.existsSync(STATUS_FILE);
  const data: ZendeskInsightsData = fs.existsSync(INSIGHTS_FILE)
    ? JSON.parse(fs.readFileSync(INSIGHTS_FILE, "utf-8"))
    : { candidates: [], analyzedAt: null, ticketsAnalyzed: 0, query: "" };

  return NextResponse.json(
    { ...data, analyzing },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// POST: Glean MCP로 신선한 티켓 가져와서 후보 추출 (background)
export async function POST() {
  if (fs.existsSync(STATUS_FILE)) {
    return NextResponse.json({ error: "이미 분석 중입니다" }, { status: 409 });
  }

  fs.writeFileSync(STATUS_FILE, JSON.stringify({ startedAt: new Date().toISOString() }));

  const insightsPath = INSIGHTS_FILE;
  const prompt = `Glean MCP를 사용해서 Zendesk 티켓을 검색하고 fixitfaster 시나리오 후보를 추출해줘.

다음 쿼리로 검색해 (각각 다른 결과가 나오도록):
1. "datadog agent environment variable misconfigured" (app: zendesk)
2. "log pipeline not collecting docker container" (app: zendesk)
3. "APM trace missing service configuration" (app: zendesk)
4. "metric not showing datadog agent config" (app: zendesk)

검색 결과에서 이전에 쓰지 않은 새로운 티켓 위주로 fixitfaster 챌린지 후보를 골라. 조건:
- Docker 환경에서 docker-compose.yml 환경변수 수정으로 재현/해결 가능한 문제
- 증상과 원인이 명확한 configuration 이슈
- TSE 교육에 실용적

분석이 끝나면 반드시 아래 형식의 JSON을 ${insightsPath} 파일에 저장해줘 (파일 전체를 덮어써):

{
  "analyzedAt": "<현재 ISO 8601 시각>",
  "ticketsAnalyzed": <검색된 티켓 총 수>,
  "query": "agent config / log collection / APM traces / metrics",
  "candidates": [
    {
      "title": "짧고 명확한 영어 제목",
      "difficulty": "Easy",
      "products": "Agent, Logs",
      "symptomSummary": "사용자가 겪는 증상 1-2문장 (한국어)",
      "likelyRootCause": "설정 관련 근본 원인 1문장 (한국어)",
      "suggestedFix": "해결 방법 1-2문장 (한국어)",
      "sourceTicketTitle": "원본 티켓 제목 그대로"
    }
  ]
}

파일 저장 후 "완료"라고만 말해줘.`;

  execFileAsync("claude", ["--print", "--dangerously-skip-permissions", prompt], {
    timeout: 240_000,
    env: { ...process.env, HOME: process.env.HOME ?? "/Users/victor.lee" },
  })
    .catch((e) => console.error("[zendesk-insights] claude CLI error:", e.message))
    .finally(() => {
      try { fs.unlinkSync(STATUS_FILE); } catch {}
    });

  return NextResponse.json({ analyzing: true, message: "Glean 검색 시작됨" });
}
