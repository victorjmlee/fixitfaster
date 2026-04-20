# OpenMetrics V2 Metrics Not Collected by Agent

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 45 min
**Related Datadog products:** Metrics, Integrations


## Symptom summary

An application is exposing metrics on an OpenMetrics V2 endpoint, but the Datadog Agent is failing to collect these metrics, and they are not appearing in the Datadog Metrics Explorer.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- Reproduction: inject broken config in docker-compose.yml and restart containers


## Steps to reproduce / What to observe

1. Start the Docker environment: `npm run up:full`
2. Verify that the `fixitfaster-openmetrics-v2-app` container is running and exposing metrics by accessing its endpoint: `curl http://localhost:8080/metrics`.
3. Navigate to Datadog Metrics Explorer and search for metrics starting with `openmetrics_v2_app.` (e.g., `openmetrics_v2_app.requests_total`). Observe that no data is present.
4. Examine the Datadog Agent's status and logs for the `openmetrics` check to identify any errors or warnings.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check agent status:
```
docker exec fixitfaster-agent agent status
docker exec fixitfaster-agent agent configcheck
```

Restart:
```
cd ~/fixitfaster-agent
npm run agent:restart
```