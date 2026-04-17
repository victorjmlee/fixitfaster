# Scenario: Container Metrics and Logs Silently Excluded

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–20 min
**Related Datadog products:** Infrastructure (Containers), Logs, Agent


## Symptom summary

`app-demo` 컨테이너는 실행 중이고 `docker ps`로 확인되지만, Datadog Infrastructure → Containers에서 보이지 않고, Datadog Logs에서도 해당 컨테이너의 로그가 전혀 나타나지 않습니다. Agent status에는 오류가 없고 다른 컨테이너들은 정상 동작 중입니다.


## Environment

- 플랫폼: 로컬 Docker (docker-compose)
- Agent: Datadog Agent 7.x (컨테이너)
- 재현: docker-compose.yml에 broken 설정 주입 후 Agent 재시작


## Steps to reproduce / What to observe

1. `fixitfaster-agent` 디렉토리에서 `docker compose up -d`로 환경을 시작합니다.
2. `docker ps | grep app-demo`로 `app-demo`가 실행 중인지 확인합니다.
3. Datadog → Infrastructure → Containers에서 `fixitfaster-app-demo`를 검색합니다. 보이지 않습니다.
4. Datadog Logs에서 `service:app-demo`로 필터링합니다. 로그가 없습니다.
5. `docker exec fixitfaster-agent agent status`를 실행합니다. Agent는 정상처럼 보이며 명백한 오류가 없습니다.


## What to investigate (hints)

- `docker-compose.yml`에서 Agent의 컨테이너 제외(exclusion) 설정을 확인해보세요.
- Agent가 어떤 컨테이너에서 메트릭과 로그를 수집할지 제어하는 환경 변수를 검토하세요.
- Datadog 문서: Container Discovery Management, `DD_CONTAINER_EXCLUDE`, `DD_CONTAINER_EXCLUDE_LOGS`, `DD_CONTAINER_EXCLUDE_METRICS`.


## Allowed resources

- Datadog 문서
- 내부 위키
- AI 사용 금지

## Helpful Commands

컨테이너 실행 확인:
docker ps | grep app-demo

Agent 상태 확인:
docker exec fixitfaster-agent agent status
docker exec fixitfaster-agent agent configcheck

수정 후 Agent 재시작:
cd ~/fixitfaster-agent
npm run agent:restart
