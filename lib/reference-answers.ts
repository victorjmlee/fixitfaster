/**
 * 시나리오별 정답 (채점 기준). 서버 전용.
 * 제출 란이 없으므로 채점은 artifacts(파일 변경/diff/config)만으로 함.
 *
 * artifactCheck: artifacts 문자열(소문자)에 포함돼야 할 조건.
 *   - 각 내부 배열 = "이 문자열들이 전부 있으면 통과" (AND).
 *   - 여러 내부 배열 중 하나라도 통과하면 75점 (OR).
 *   - 예: [["fixitfaster-agent", "hostname"], ["fixitfaster-agent", "dd_hostname"]] → 둘 중 하나 만족하면 통과.
 */
export type ArtifactCheck = string[][];

export const REFERENCE_ANSWERS: Record<
  string,
  {
    rootCause: string;
    resolution: string;
    expectedChange: string;
    artifactCheck: ArtifactCheck;
    /** 결과(artifact) 통과 시 점수. */
    artifactScore?: number;
    /** 솔루션 채점 만점 (기본 20). 솔루션 전용 시나리오는 높게 설정. */
    solutionMaxPoints?: number;
    /** 시나리오별 점수 안내 (UI 표시용). */
    scoreGuide: { ko: string; en: string };
  }
> = {
  "scenario-infra": {
    rootCause: "Agent의 hostname과 DD_HOSTNAME이 잘못 설정되어 있음.",
    resolution: "docker-compose.yml에서 agent 서비스의 hostname과 DD_HOSTNAME을 모두 fixitfaster-agent로 설정 후 Agent 재시작.",
    expectedChange: "docker-compose.yml 내 agent 서비스에 hostname = fixitfaster-agent, DD_HOSTNAME = fixitfaster-agent.",
    /* hostname과 DD_HOSTNAME 둘 다 fixitfaster-agent로 변경해야 통과 */
    artifactCheck: [
      ["docker-compose", "fixitfaster-agent", "hostname", "dd_hostname"],
    ],
    artifactScore: 50,
    scoreGuide: {
      ko: "결과 50점 + 솔루션(원인/해결 작성) 20점 = 만점 70점",
      en: "Result 50 pts + Solution (optional) 20 pts = 70 max",
    },
  },
  "scenario-autodiscovery": {
    rootCause: "conf.d/nginx.d/autoconf.yaml의 ad_identifiers가 nginx 이미지명과 다름.",
    resolution: "ad_identifiers를 nginx로 수정 후 Agent 재시작.",
    expectedChange: "conf.d 내 nginx yaml에 ad_identifiers에 nginx 포함.",
    artifactCheck: [["conf.d", "ad_identifiers", "nginx"]],
    artifactScore: 60,
    scoreGuide: {
      ko: "결과 60점 + 솔루션 20점 = 만점 80점",
      en: "Result 60 pts + Solution 20 pts = 80 max",
    },
  },
  "scenario-apm": {
    rootCause: "trace-demo가 트레이스를 보내는 포트가 Agent(8126)와 다름.",
    resolution: "trace-demo에서 dd-trace port를 8126으로 수정 후 재빌드·재시작.",
    expectedChange: "trace-demo 관련 파일에서 port 8126.",
    /* trace-demo 코드/설정에서 8126 포트 설정이 있어야 함 (diff 또는 docker-compose) */
    artifactCheck: [
      ["trace-demo", "8126"],
      ["ddtrace", "8126"],
    ],
    artifactScore: 80,
    scoreGuide: {
      ko: "결과 80점 + 솔루션 20점 = 만점 100점",
      en: "Result 80 pts + Solution 20 pts = 100 max",
    },
  },
  "scenario-correlation": {
    rootCause: "correlation-demo에 DD_LOGS_INJECTION이 false라 trace_id 주입 안 됨.",
    resolution: "docker-compose.yml에서 correlation-demo의 DD_LOGS_INJECTION을 true로.",
    expectedChange: "docker-compose에서 correlation-demo에 DD_LOGS_INJECTION: true.",
    artifactCheck: [
      ["docker-compose", "correlation", "dd_logs_injection", "true"],
      ["docker-compose", "correlation", "logs_injection", "true"],
    ],
    artifactScore: 50,
    scoreGuide: {
      ko: "결과 50점 + 솔루션 20점 = 만점 70점",
      en: "Result 50 pts + Solution 20 pts = 70 max",
    },
  },
  "scenario-custom-metrics": {
    rootCause: "metrics-demo가 DogStatsD를 잘못된 호스트로 보냄.",
    resolution: "metrics-demo에서 StatsD host를 agent로 수정 후 재빌드·재시작.",
    expectedChange: "metrics-demo 코드에서 host를 agent(또는 agent 서비스명)로.",
    /* metrics-demo에서 host/StatsD 설정으로 agent 지정한 흔적 */
    artifactCheck: [
      ["metrics-demo", "agent", "host"],
      ["metrics-demo", "statsd", "agent"],
    ],
    artifactScore: 80,
    scoreGuide: {
      ko: "결과 80점 + 솔루션 20점 = 만점 100점",
      en: "Result 80 pts + Solution 20 pts = 100 max",
    },
  },
  "scenario-log-timezone": {
    rootCause: "log-demo 로그의 타임스탬프가 Asia/Seoul인데 Datadog 파이프라인에 올바른 Grok Parser와 Date Remapper(timezone Asia/Seoul)가 없음.",
    resolution: "Datadog 로그 파이프라인에서 Grok Parser로 타임스탬프를 파싱하고, Date Remapper에 timezone Asia/Seoul을 설정.",
    expectedChange: "",
    /* 보너스: Datadog UI에서 파이프라인을 수정하므로 artifact 채점 불가. 솔루션만 채점. */
    artifactCheck: [],
    artifactScore: 0,
    solutionMaxPoints: 20,
    scoreGuide: {
      ko: "보너스 시나리오 — 솔루션(원인/해결 작성) 만점 20점",
      en: "Bonus scenario — Solution (cause/resolution) 20 pts max",
    },
  },
};
