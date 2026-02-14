# Scenario: Logs seem to not be collecting in real time

**Difficulty:** ⭐⭐⭐ Intermediate
**Estimated time:** 15–25 min
**Related Datadog products:** Log Management, Pipelines


## Symptom summary

log-demo 로그가 예전에는 Datadog에 정상적으로 보였는데, 어느 시점부터 타임스탬프가 약 9시간 어긋나거나 "Last 15 minutes"로 필터하면 최근 로그가 안 보이는 것처럼 됐습니다. 수집이 멈춘 것 같습니다. log-demo 컨테이너는 여전히 실행 중이며 로그를 쓰고 있습니다. Explorer에서 로그가 잘못 보이거나 빠지는 원인을 찾아야 합니다.


## Environment

- 로그 소스: log-demo 컨테이너(Asia/Seoul 타임존으로 5초마다 로그 출력).
- 로그 형식: YYYY-MM-DD HH:MM:SS [INFO] [log-demo] User 123 completed action
- Agent: Datadog Agent 7.x (Docker), 컨테이너 로그 수집.


## Steps to reproduce / What to observe

1. Datadog Logs → Explorer에서 service:log-demo 로 검색합니다.
2. log-demo 컨테이너는 실행 중이며 로그를 출력합니다(예: docker logs fixitfaster-log-demo).
3. 정리: 로그는 나오는데, Datadog에서는 잘못된 시간으로 보이거나 수집이 안 되는 것처럼 보입니다.


## What to investigate (hints)

- Logs → Configuration → Pipelines에서 service:log-demo에 적용되는 파이프라인을 찾아 검토.
- Datadog 문서: 로그 파이프라인, Date Remapper, 파싱.


## Allowed resources

- Datadog 문서
- 내부 위키
- AI 사용 금지

## Helpful Commands

log-demo 컨테이너 로그 확인:
docker logs -f fixitfaster-log-demo
