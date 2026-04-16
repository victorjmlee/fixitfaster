# Scenario: Docker Log Collection Disabled by Missing Env Vars

**Difficulty:** ⭐ Easy
**Estimated time:** 10 min
**Related Datadog products:** Agent, Logs


## Symptom summary

Docker 컨테이너 (log-demo)에서 로그가 전혀 수집되지 않습니다. Datadog UI에서 로그가 보이지 않습니다. Agent는 정상 실행 중이며 인프라 메트릭은 수집되고 있어 로그만 선택적으로 누락된 상황입니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. `docker-compose up` 명령으로 모든 컨테이너를 시작합니다.
2. Datadog UI의 Log Explorer로 이동합니다.
3. `source:log-demo` 필터를 사용하여 로그를 검색합니다.
4. log-demo 컨테이너에서 생성된 로그가 표시되지 않는 것을 확인합니다.


## What to investigate (hints)

- Agent가 로그를 수집하도록 활성화되어 있는지 확인하십시오.
- Agent가 모든 컨테이너의 로그를 수집하도록 구성되어 있는지 확인하십시오.


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
npm run agent:restart