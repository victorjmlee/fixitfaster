# SNMP 통합 체크 미실행

**Difficulty:** ⭐ Easy
**Estimated time:** 15 min
**Related Datadog products:** Agent, Metrics, Network Device Monitoring


## Symptom summary

SNMP 통합 체크가 실행되지 않거나, Agent status에 SNMP 체크가 'no disco'로 표시됩니다. Agent 로그에 SNMP 통합 관련 설정 오류가 나타납니다.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- 재현: docker-compose.yml에 broken 설정 주입 후 컨테이너 재시작


## Steps to reproduce / What to observe

1. `fixitfaster-agent` 환경을 시작합니다.
2. `docker exec fixitfaster-agent agent status` 명령어를 사용하여 Agent 상태를 확인합니다.
3. SNMP 체크가 실행되지 않거나 'no disco'로 표시되는 것을 확인합니다.
4. Agent 로그에서 SNMP 통합 관련 설정 오류를 찾습니다.


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