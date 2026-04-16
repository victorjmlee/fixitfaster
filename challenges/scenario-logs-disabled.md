# Scenario: Log Collection Not Enabled in datadog.yaml

**Difficulty:** ⭐ Easy
**Estimated time:** 10 min
**Related Datadog products:** Agent, Logs


## Symptom summary

Agent가 실행 중이지만 로그가 전혀 수집되지 않습니다. Agent status에서 `LogsProcessed: 0`이 표시되거나 `'Scan - got 0 files from FilesToTail and currently tailing 0 files'` 메시지가 나타납니다. `log-demo` 컨테이너에서 로그가 생성되고 있음에도 Datadog UI에서 로그가 보이지 않습니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. `docker-compose up` 명령어로 환경을 실행합니다.
2. `docker exec fixitfaster-agent agent status` 명령어를 실행하여 Agent 상태를 확인합니다.
3. Agent 상태 출력에서 `Logs Agent` 섹션을 확인합니다. `LogsProcessed: 0` 또는 `'Scan - got 0 files from FilesToTail and currently tailing 0 files'` 메시지가 나타나는지 확인합니다.
4. Datadog UI에서 `log-demo` 서비스의 로그가 보이지 않는지 확인합니다.


## What to investigate (hints)

- Agent가 로그를 수집하도록 설정되어 있는지 확인해보세요.
- Agent 설정 파일 또는 환경 변수를 확인하여 로그 수집 관련 설정이 올바른지 확인해보세요.


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