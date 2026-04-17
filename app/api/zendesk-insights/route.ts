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

아래 6개 쿼리로 각각 검색해. 각 쿼리마다 최대한 많은 결과를 가져와:
1. "datadog agent not working configuration" (app: zendesk)
2. "data not showing up datadog" (app: zendesk)
3. "datadog configuration environment variable" (app: zendesk)
4. "datadog not collecting container" (app: zendesk)
5. "datadog setup not sending" (app: zendesk)
6. "datadog troubleshooting misconfigured" (app: zendesk)

전체 검색 결과를 합쳐서 fixitfaster 챌린지로 좋은 후보를 5~8개 골라.

## 선택 기준 (중요)
- **재현 가능성**: docker-compose.yml 환경변수 추가/수정, 또는 앱 컨테이너 설정 변경만으로 broken 상태를 만들고 고칠 수 있어야 함
- **Root cause 명확**: "어떤 설정이 잘못되어서 어떤 증상이 생겼는지" 한 문장으로 설명 가능
- **제품 무관**: APM, Logs, Metrics, Infrastructure 등 특정 제품에 치우치지 말고 다양하게 선택
- **난이도 분산**: Easy / Medium / Hard 골고루 포함
- **TSE 실습용**: 참가자가 30분 이내에 Agent 또는 앱 컨테이너 설정을 고쳐서 해결 가능

## 제외 기준
- Datadog UI 설정(대시보드, 알림 등)만으로 해결하는 문제
- 코드 버그 수정이 필요한 문제
- 클라우드 인프라(AWS, GCP 등) 권한 문제

분석이 끝나면 반드시 아래 형식의 JSON을 ${insightsPath} 파일에 저장해줘 (파일 전체를 덮어써):

{
  "analyzedAt": "<현재 ISO 8601 시각>",
  "ticketsAnalyzed": <검색된 티켓 총 수>,
  "query": "datadog configuration troubleshooting",
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
