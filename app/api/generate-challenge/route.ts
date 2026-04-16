import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { ScenarioCandidate } from "@/app/api/zendesk-insights/route";

const GEMINI_MODEL_IDS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const DRAFTS_DIR = path.join(process.cwd(), "challenges", "_drafts");
const AGENT_COMPOSE = path.join(process.cwd(), "fixitfaster-agent", "docker-compose.yml");

export type GeneratedChallenge = {
  slug: string;
  challengeMarkdown: string;
  referenceAnswer: {
    rootCause: string;
    resolution: string;
    expectedChange: string;
    solutionRubric: string;
    artifactCheck: string[][];
    artifactCheckFull?: string[][];
    artifactScore: number;
    scoreGuide: { ko: string; en: string };
  };
  dockerComposePatch: {
    description: string;
    service: string;
    envAdd?: [string, string][];
    envRemove?: string[];
    volumeAdd?: string[];
    newService?: string;
  };
};

function buildPrompt(candidate: ScenarioCandidate, dockerCompose: string): string {
  return `당신은 Datadog fixitfaster 챌린지를 설계하는 전문가입니다.

## 시나리오 후보
- 제목: ${candidate.title}
- 난이도: ${candidate.difficulty}
- 제품: ${candidate.products}
- 증상: ${candidate.symptomSummary}
- 원인: ${candidate.likelyRootCause}
- 해결: ${candidate.suggestedFix}
- 출처 티켓: ${candidate.sourceTicketTitle}

## 현재 docker-compose.yml (fixitfaster-agent)
\`\`\`yaml
${dockerCompose}
\`\`\`

## 규칙
1. **환경**: 모든 챌린지는 로컬 Docker (docker-compose) 기반
2. **broken 상태**: docker-compose.yml의 기존 서비스에 잘못된 환경변수/설정을 추가하거나, 새 서비스를 추가
3. **채점**: 참가자가 git diff로 변경사항을 제출하므로 artifactCheck는 diff에서 찾을 문자열 패턴
4. **slug**: scenario-{짧은-영어-식별자} 형식 (예: scenario-apm-disabled)
5. **힌트 규칙 (매우 중요)**:
   - 힌트는 "어디를 봐야 하는가"만 알려줘야 함 — 무엇을 바꿔야 하는지는 절대 언급 금지
   - 정답(환경변수명, 올바른 값, 파일명)을 직접 노출하지 말 것
   - "Agent 설정을 확인해보세요", "트레이스가 전송되는 경로를 추적해보세요" 수준으로 작성
   - 힌트 2개 이하로 제한

## 출력 형식
순수 JSON만 출력 (마크다운 코드블록 없이):

{
  "slug": "scenario-xxx",
  "challengeMarkdown": "# Scenario: ...전체 마크다운...",
  "referenceAnswer": {
    "rootCause": "한국어로 한 문장",
    "resolution": "한국어로 한 문장 (구체적인 파일/환경변수 포함)",
    "expectedChange": "한국어로 어떤 파일의 어떤 값이 바뀌어야 하는지",
    "solutionRubric": "AI 채점용 상세 기준 (한국어, 3~5줄): 참가자가 원인/해결에 뭘 언급해야 점수를 받는지, 어떤 표현이 정답으로 인정되는지 구체적으로 서술. 예: 'DD_LOGS_ENABLED=false 또는 로그 비활성화를 원인으로 언급하면 정답. DD_LOGS_ENABLED=true로 변경하거나 값을 수정한다는 내용이 있으면 해결 인정.'",
    "artifactCheck": [["docker-compose", "변경된키", "변경된값"]],
    "artifactCheckFull": [["DD_XXX=정답값"]],
    "artifactScore": 75,
    "scoreGuide": {
      "ko": "결과 75점 + 솔루션 20점 = 만점 95점",
      "en": "Result 75 pts + Solution 20 pts = 95 max"
    }
  },
  "dockerComposePatch": {
    "description": "docker-compose.yml에서 무엇을 어떻게 변경하는지 설명",
    "service": "변경할 서비스명 (예: agent, trace-demo, log-demo)",
    "envAdd": [["ENV_VAR_NAME", "broken_value"]],
    "envRemove": ["제거할_기존_env_var_이름"],
    "newService": null
  }
}

challengeMarkdown 형식 (아래를 정확히 따라):
# Scenario: {제목}

**Difficulty:** {⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Hard}
**Estimated time:** {분} min
**Related Datadog products:** {제품}


## Symptom summary

{증상 설명 - 구체적으로, 한국어/영어 혼용 OK}


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. ...
2. ...
3. ...


## What to investigate (hints)

- {어디를 봐야 하는지만 — 정답·환경변수명·올바른 값은 절대 쓰지 말 것}
- {두 번째 힌트 (선택) — 마찬가지로 방향만}


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Agent 상태 확인:
docker exec fixitfaster-agent agent status
docker exec fixitfaster-agent agent configcheck

재시작:
cd ~/fixitfaster-agent
npm run agent:restart`;
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
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      });
      if (!res.ok) {
        console.warn(`[generate-challenge] Gemini ${modelId}: ${res.status}`);
        continue;
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (e) {
      console.warn(`[generate-challenge] ${modelId}:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error("Gemini 호출 실패");
}

export async function POST(req: NextRequest) {
  try {
    const candidate = (await req.json()) as ScenarioCandidate;

    const dockerCompose = fs.existsSync(AGENT_COMPOSE)
      ? fs.readFileSync(AGENT_COMPOSE, "utf-8")
      : "(docker-compose.yml not found)";

    const prompt = buildPrompt(candidate, dockerCompose);
    const raw = await callGemini(prompt);

    // JSON 파싱
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const generated = JSON.parse(cleaned) as GeneratedChallenge;

    // 드래프트 저장
    if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });

    const mdPath = path.join(DRAFTS_DIR, `${generated.slug}.md`);
    fs.writeFileSync(mdPath, generated.challengeMarkdown, "utf-8");

    const metaPath = path.join(DRAFTS_DIR, `${generated.slug}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify({
      candidate,
      referenceAnswer: generated.referenceAnswer,
      dockerComposePatch: generated.dockerComposePatch,
      generatedAt: new Date().toISOString(),
    }, null, 2), "utf-8");

    return NextResponse.json({
      slug: generated.slug,
      challengeMarkdown: generated.challengeMarkdown,
      referenceAnswer: generated.referenceAnswer,
      dockerComposePatch: generated.dockerComposePatch,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[generate-challenge]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
