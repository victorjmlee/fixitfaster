# 프록시 오설정으로 인한 Agent 메트릭 누락

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 45 min
**Related Datadog products:** Agent, Metrics


## Symptom summary

Datadog Agent가 실행 중이며, `agent status` 명령을 통해 메트릭이 전송되고 있음을 확인할 수 있습니다. 하지만 Datadog UI의 Metrics Explorer에서 `datadog.agent.host_metrics`와 같은 Agent 관련 메트릭이나 `metrics-demo` 서비스의 커스텀 메트릭이 전혀 나타나지 않습니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. `npm run up:full` 명령어를 사용하여 Docker 환경을 시작합니다.
2. `fixitfaster-agent` 및 `fixitfaster-metrics-demo` 컨테이너가 실행 중인지 확인합니다.
3. `docker exec fixitfaster-agent agent status` 명령을 실행하여 DogStatsD 섹션에서 메트릭이 처리되고 전달되고 있음을 확인합니다.
4. Datadog UI의 Metrics Explorer (app.datadoghq.com/metric/explorer)로 이동합니다.
5. 호스트 메트릭(예: `datadog.agent.host_metrics`) 또는 데모 앱의 커스텀 메트릭(예: `custom.metric.from.demo`)을 검색합니다.
6. Datadog UI에 해당 메트릭이 나타나지 않음을 확인합니다.


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