# OpenMetrics V2 지표가 Agent에 의해 수집되지 않음

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 45 min
**Related Datadog products:** Metrics, Integrations


## Symptom summary

애플리케이션이 OpenMetrics V2 엔드포인트에서 지표를 노출하고 있지만, Datadog Agent가 해당 지표를 수집하지 못하고 있으며, Datadog Metrics Explorer에 표시되지 않습니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. Docker 환경 시작: `npm run up:full`
2. `fixitfaster-openmetrics-v2-app` 컨테이너가 실행 중이며 엔드포인트에서 지표를 노출하는지 확인합니다: `curl http://localhost:8080/metrics`.
3. Datadog Metrics Explorer로 이동하여 `openmetrics_v2_app.`으로 시작하는 지표(예: `openmetrics_v2_app.requests_total`)를 검색합니다. 데이터가 표시되지 않음을 확인합니다.
4. Datadog Agent의 `openmetrics` 체크에 대한 상태 및 로그를 검토하여 오류나 경고를 식별합니다.


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