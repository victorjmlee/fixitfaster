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
    /** AI 채점 프롬프트용 상세 기준. 없으면 rootCause/resolution으로 대체. */
    solutionRubric?: string;
    artifactCheck: ArtifactCheck;
    /**
     * 커밋된 변경사항 채점용 (diff가 비어있을 때 전체 artifact 내용 검색).
     * diff 채점보다 구체적인 패턴 필요 (오탐 방지).
     */
    artifactCheckFull?: ArtifactCheck;
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
    /* diff가 비어있을 때(커밋된 변경) 전체 파일 내용으로 검증 — "hostname: fixitfaster-agent"는 container_name과 구별됨 */
    artifactCheckFull: [
      ["hostname: fixitfaster-agent", "DD_HOSTNAME=fixitfaster-agent"],
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
    /* diff 없을 때: docker-compose.yml에 DD_LOGS_INJECTION=true가 있으면 통과 (false→true로 변경됨) */
    artifactCheckFull: [
      ["DD_LOGS_INJECTION=true"],
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
  "scenario-missing-container-metrics-logs-exclusion": {
    rootCause: "Agent 환경변수 DD_CONTAINER_EXCLUDE_LOGS=name:fixitfaster-infra-demo와 DD_CONTAINER_EXCLUDE_METRICS=name:fixitfaster-infra-demo로 인해 infra-demo 컨테이너의 로그와 메트릭이 수집에서 제외되었습니다.",
    resolution: "docker-compose.yml의 agent 서비스에서 DD_CONTAINER_EXCLUDE_LOGS와 DD_CONTAINER_EXCLUDE_METRICS 환경변수(name:fixitfaster-infra-demo)를 제거하고 Agent를 재시작합니다.",
    expectedChange: "docker-compose.yml의 agent 서비스에서 DD_CONTAINER_EXCLUDE_LOGS와 DD_CONTAINER_EXCLUDE_METRICS 항목이 삭제되어야 합니다.",
    solutionRubric: "DD_CONTAINER_EXCLUDE_LOGS 또는 DD_CONTAINER_EXCLUDE_METRICS가 원인임을 언급하면 정답으로 인정합니다. 컨테이너 제외 규칙으로 인해 infra-demo의 데이터가 수집되지 않는다는 내용이면 부분 정답입니다. 두 환경변수를 모두 제거해야 완전 해결로 인정합니다.",
    artifactCheck: [
      [
        "DD_CONTAINER_EXCLUDE_LOGS",
        "fixitfaster-infra-demo"
      ],
      [
        "DD_CONTAINER_EXCLUDE_METRICS",
        "fixitfaster-infra-demo"
      ]
    ],
    artifactCheckFull: [],
    artifactScore: 75,
    scoreGuide: {
      ko: "결과 75점 + 솔루션 20점 = 만점 95점",
      en: "Result 75 pts + Solution 20 pts = 95 max",
    },
  },
  "scenario-agent-metrics-proxy-misconfig": {
    rootCause: "Datadog Agent가 DogStatsD 메트릭을 중간 프록시(Vector)로 보내도록 설정되어 있으나, 해당 프록시가 Datadog 백엔드로 메트릭을 전달하도록 올바르게 구성되지 않았습니다.",
    resolution: "`fixitfaster-agent` 서비스의 `DD_DOGSTATSD_URL` 환경 변수를 제거하여 Agent가 직접 메트릭을 수집하고 Datadog으로 전송하도록 합니다.",
    expectedChange: "`docker-compose.yml` 파일에서 `fixitfaster-agent` 서비스에 추가된 `DD_DOGSTATSD_URL=udp://vector:8125` 환경 변수를 제거해야 합니다.",
    solutionRubric: "원인: Agent가 DogStatsD 메트릭을 Vector 프록시로 보내지만, Vector가 Datadog으로 전달하지 않는다는 내용을 언급하면 정답. `DD_DOGSTATSD_URL` 환경 변수가 잘못 설정되었음을 언급해도 정답.\n해결: `DD_DOGSTATSD_URL` 환경 변수를 제거하거나 Agent가 직접 메트릭을 보내도록 수정하는 내용을 언급하면 정답. Vector 프록시 설정을 수정하여 Datadog으로 전달하도록 하는 내용을 언급해도 정답.",
    artifactCheck: [
      [
        "docker-compose",
        "DD_DOGSTATSD_URL",
        ""
      ]
    ],
    artifactCheckFull: [],
    artifactScore: 75,
    scoreGuide: {
      ko: "결과 75점 + 솔루션 20점 = 만점 95점",
      en: "Result 75 pts + Solution 20 pts = 95 max",
    },
  },
  "scenario-snmp-config-error": {
    rootCause: "`conf.d/snmp.d/conf.yaml` 파일의 `instances` 블록에 구문 오류(콜론 누락)가 있어 Agent가 SNMP 체크를 로드하지 못했습니다.",
    resolution: "`conf.d/snmp.d/conf.yaml` 파일의 `instances` 블록에 콜론을 추가하고, `ip_address`와 `community_string` 등 필수 필드를 올바르게 구성해야 합니다.",
    expectedChange: "`conf.d/snmp.d/conf.yaml` 파일에서 `instances` 뒤에 콜론을 추가하고, `ip_address`와 `community_string` 필드가 올바른 값으로 구성되어야 합니다.",
    solutionRubric: "`conf.d/snmp.d/conf.yaml` 파일의 구문 오류(예: `instances` 뒤 콜론 누락) 또는 필수 필드 누락을 원인으로 언급하면 정답. `conf.d/snmp.d/conf.yaml` 파일의 `instances` 블록에 콜론을 추가하고 `ip_address` 및 `community_string` 필드를 올바르게 구성하는 내용을 해결로 언급하면 정답.",
    artifactCheck: [
      [
        "configFiles",
        "conf.d/snmp.d/conf.yaml",
        "instances:"
      ],
      [
        "configFiles",
        "conf.d/snmp.d/conf.yaml",
        "ip_address: 127.0.0.1"
      ]
    ],
    artifactCheckFull: [
      [
        "conf.d/snmp.d/conf.yaml",
        "init_config:\ninstances:\n  - ip_address: 127.0.0.1\n    community_string: public\n    port: 161\n    snmp_version: 2c\n    tags:\n      - snmp_device:test_device\n"
      ]
    ],
    artifactScore: 75,
    scoreGuide: {
      ko: "결과 75점 + 솔루션 20점 = 만점 95점",
      en: "Result 75 pts + Solution 20 pts = 95 max",
    },
  },
};
