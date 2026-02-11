# Fix It Faster Competition

팀 내 **Datadog 기반 트러블슈팅 경연대회**입니다.  
공식 Troubleshooting 문서와 내부 Wiki를 활용해 만든 이슈를 **누가 더 빠르고 정확하게 해결하는지** 겨룹니다.

**핸즈온 흐름:** 각자 환경에 Agent 띄우고 **각자 Datadog 콘솔**에서 보면서 트러블슈팅 → 먼저 **되는 환경**을 만든 뒤, 시나리오별로 **의도적으로 망가뜨려 두고** 참가자가 고치게 함.  
→ 자세한 구성: [docs/HANDSON_SETUP.md](docs/HANDSON_SETUP.md) (APM / Logs / Infra / Metrics·Monitor 시나리오)

---

## 🚀 API 키만 넣으면 됨

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **API 키 설정**  
   프로젝트 루트에 `.env.local` 파일을 만들고 다음만 채우면 됩니다.
   ```bash
   cp .env.example .env.local
   # .env.local 편집: DATADOG_API_KEY=본인_API_키
   ```

3. **실행**
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 접속 → **설정**에서 연결 테스트 후 챌린지 시작.

- **챌린지**: `challenges/` 폴더의 `.md` 파일이 자동으로 목록에 올라갑니다.
- **제출**: 각 챌린지에서 시작 → 타이머 동작 → 해결 후 제출하면 **리더보드**에 기록됩니다.
- **데이터**: 제출 내용은 `data/submissions.json`에 저장됩니다 (Git 제외).

### APM 트레이스가 안 들어올 때

트레이싱은 **instrumentation.ts**에서 켜집니다. `npm run dev` / `npm run start` 시 서버 프로세스에서 로드됩니다.

- **Agent 쓸 때:** `.env.local`에 `DD_AGENT_HOST=localhost` 있는지 확인 후 앱 **완전히 재시작**
- **트레이스가 계속 0이면:** `DATADOG_API_KEY`, `DATADOG_SITE`(EU면 `datadoghq.eu`) 확인 후 페이지/API 여러 번 호출해 보기
- APM 없이 **챌린지/리더보드만** 쓰려면 `DD_AGENT_HOST`와 `DATADOG_API_KEY`를 비우면 됩니다.

---

## 각자 환경에서 Agent 띄우고 실습하기

**Agent와 데모 컨테이너는 `agent/` 디렉터리에 있습니다.** (별도 Datadog 계정 repo로 분리 배포 가능.)  
루트에서 `npm run agent:up` 등은 `agent/` 로 위임됩니다. **Agent용 `.env.local`** 은 `agent/.env.local` 에 두거나, `agent/` 에서만 실습할 때는 `cp agent/.env.example agent/.env.local` 후 키 입력.

**이 레포의 Agent는 트레이스 + 로그 + 메트릭이 수집되도록 설정돼 있습니다.**  
- **트레이스:** trace-demo → Agent(8126) → APM  
- **로그:** log-demo (타임존 포맷), correlation-demo (trace 연동) → Agent 수집 → Logs  
- **메트릭:** metrics-demo → DogStatsD(8125) → Metrics  
→ 자세한 출처: [docs/WHERE_TRACES_AND_LOGS_COME_FROM.md](docs/WHERE_TRACES_AND_LOGS_COME_FROM.md)

1. **저장소 클론 & 의존성**
   ```bash
   cd fixitfaster
   npm install
   ```

2. **본인 API 키 설정**
   - **앱:** 루트에 `.env.local` (앱 연결 테스트용).
   - **Agent:** `agent/.env.local` 에 `DATADOG_API_KEY`, (파이프라인용) `DATADOG_APP_KEY` 넣기. 루트 `.env.local` 을 쓰려면 `ln -s ../.env.local agent/.env.local` 로 심볼릭 링크 가능.

3. **Agent + 앱 한 번에 실행** (`.env.local` 참조)
   - `.env.local`에 `DD_AGENT_HOST=localhost` 가 있으면 앱이 트레이스를 Agent로 보냅니다.
   ```bash
   npm run up
   ```
   - 이 명령이 **Agent를 Docker로 띄운 뒤** 곧바로 **Next.js 앱( localhost:3000 )** 을 실행합니다. 한 번에 둘 다 켜짐.
   - Agent만 따로 띄우려면: `npm run agent:up` → 그다음 터미널에서 `npm run dev`.
   - **log-demo 파이프라인까지 한 번에:** Agent + log-demo 파이프라인(본인 Datadog에 생성)을 같이 쓰려면 `npm run agent:up:full` 실행.  
     파이프라인만 따로 만들려면 Agent 띄운 뒤 `npm run pipeline:setup` 한 번 실행하면 됩니다 (Grok + Date Remapper Asia/Seoul).  
     **`pipeline:setup`이 Unauthorized면:** `.env.local`에 `DATADOG_APP_KEY`(Application Key)가 있어야 하고, Datadog **Organization Settings → Application Keys**에서 **로그 설정 쓰기 권한**이 있는 키를 사용하세요 (예: Logs Write 또는 Standard/Admin). EU 사이트면 `DATADOG_SITE=datadoghq.eu` 추가.

4. **브라우저에서**
   - http://localhost:3000 접속해서 챌린지/API 몇 번 호출해 보기.

5. **본인 Datadog에서 확인**
   - Datadog 로그인 → **APM** → **Services** 또는 **Traces**
   - 서비스 이름 `fixitfaster` 로 들어오는 트레이스 확인 (1~2분 지연될 수 있음)

정리하면, **각자 PC에서 Agent + 앱을 돌리고, 각자 Datadog 계정으로 실제 APM을 보면서** 챌린지를 풀 수 있습니다. Agent 끄려면 `npm run agent:down` (또는 `cd agent && docker compose down`) 하면 됩니다.

**컨테이너가 Restarting 이거나 `agent status` 실패 시:**  
`npm run agent:logs` 로 로그를 보세요. `agent/.env.local` 에 `DATADOG_API_KEY` 가 있고 따옴표 없이 한 줄로 들어갔는지 확인한 뒤 `npm run agent:down` → `npm run agent:up` 으로 다시 띄우세요.

---

## 경연 시: 팀원 다 같이 접속 (dev:lan)

**같은 네트워크**에서 팀원이 접속하려면:

1. 이 PC에서 **`npm run dev:lan`** 실행
2. **팀원에게는 이 PC의 IP:3000** 으로 접속하라고 공유 (예: `http://192.168.0.10:3000`. **0.0.0.0 은 접속 주소가 아님**)
3. Mac에서 본인 IP 확인: `ipconfig getifaddr en0` (또는 시스템 설정 → 네트워크)

→ 리더보드는 한 곳에 쌓이므로 모두 같은 화면에서 확인 가능.

**리더보드 초기화:** 테스트 데이터를 비우고 싶을 때  
- **방법 1:** 리더보드 페이지에서 **「리더보드 초기화」** 버튼 클릭 (확인 후 전부 삭제)  
- **방법 2:** 서버 끈 상태에서 `npm run leaderboard:reset` 실행 → `data/submissions.json` 이 비워짐

**AWS/Vercel 배포**가 필요하면 [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md) 참고.

---

## 목표

- **Datadog 여러 제품**을 조합한 현실적인 시나리오로 실전 감각 키우기
- **공식 문서** (docs.datadoghq.com) 및 **내부 Wiki** 활용 습관화
- 짧은 시간 안에 원인 파악 → 해결안 도출 → 문서화까지 한 사이클 경험

---

## 디렉터리 구조

```
fixitfaster/
├── README.md
├── .env.example
├── docker-compose.yml    # Agent + 시나리오별 데모 (trace, log, correlation, metrics)
├── app/                  # Next.js
│   ├── page.tsx          # 챌린지 목록
│   ├── setup/            # API 키 설정·연결 테스트
│   ├── challenges/[id]/  # 챌린지 상세 + 타이머 + 제출
│   ├── leaderboard/      # 리더보드
│   └── api/              # validate, challenges, submit, leaderboard, reset-leaderboard
├── lib/
├── challenges/           # 경연 시나리오 (.md)
│   ├── _template.md
│   ├── scenario-apm.md
│   ├── scenario-logs.md
│   ├── scenario-infra.md
│   ├── scenario-metrics-monitor.md
│   ├── scenario-correlation.md    # Trace–Log correlation
│   ├── scenario-log-timezone.md   # 로그 타임존 파싱
│   └── scenario-custom-metrics.md # DogStatsD 커스텀 메트릭
├── trace-demo/           # APM 트레이스 (15초마다 Agent 8126)
├── log-demo/             # 로그 타임존 시나리오용 (Asia/Seoul 포맷)
├── correlation-demo/     # Trace–Log correlation (dd-trace + log injection)
├── metrics-demo/         # DogStatsD 커스텀 메트릭 (8125)
├── scripts/
│   ├── reset-leaderboard.cjs
│   └── setup-log-pipeline.sh
├── data/                 # 제출 저장 (submissions.json)
├── docs/
│   ├── HANDSON_SETUP.md
│   ├── WHERE_TRACES_AND_LOGS_COME_FROM.md
│   ├── DATADOG_RESOURCES.md
│   ├── DEPLOY_AWS.md
│   ├── PROPOSAL_FIX_IT_FASTER_Q2.md
│   └── ...
└── solutions/
```

---

## 주최자용: 챌린지 추가

1. `challenges/_template.md`를 복사해 새 파일 생성 (예: `challenges/log-delay-issue.md`)
2. 증상, 환경, 재현 단계, 허용 리소스를 채우면 앱에 자동 반영됩니다.
3. (선택) `solutions/`에 정답 요약을 만들어 두고 경연 후 공개

---

## 라이선스 / 비고

내부 팀 활동용입니다. Datadog 문서 링크는 Datadog 공식 사이트를 참조하며, 내부 Wiki는 각 챌린지의 "허용 리소스"에 맞게 연결하면 됩니다.
