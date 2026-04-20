# Agent Reporting to Wrong Datadog Org

**Difficulty:** ⭐ Easy
**Estimated time:** 15 min
**Related Datadog products:** Agent, Infrastructure


## Symptom summary

`fixitfaster-agent` 호스트의 모든 Datadog 데이터(메트릭, 로그, 트레이스 등)가 의도한 Datadog 조직이 아닌 다른 조직으로 전송되고 있습니다. 따라서 귀하의 Datadog 계정에서는 `fixitfaster-agent`로부터 어떠한 데이터도 볼 수 없을 것입니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)


## Steps to reproduce / What to observe

1. `npm run up:full` 명령어를 사용하여 챌린지 환경을 시작합니다.
2. Datadog 계정으로 이동하여 `fixitfaster-agent` 호스트의 데이터(메트릭, 로그, 트레이스)를 검색합니다.
3. `fixitfaster-agent` 또는 관련 데모 컨테이너(예: `fixitfaster-trace-demo`, `fixitfaster-log-demo`)에서 발생하는 어떠한 데이터도 의도한 Datadog 조직에 나타나지 않음을 확인합니다.


## Allowed resources

- Datadog 공식 문서
- 내부 위키
- AI 사용 금지

## Helpful Commands

Agent 상태 확인:
```
docker exec fixitfaster-agent agent status
docker exec fixitfaster-agent agent configcheck
```

재시작:
```
cd ~/fixitfaster-agent
npm run agent:restart
```
