# Agent Metrics Missing Due to Proxy Misconfiguration

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 45 min
**Related Datadog products:** Agent, Metrics


## Symptom summary

The Datadog Agent is running, and its `agent status` command indicates that metrics are being sent. However, when you check the Datadog UI's Metrics Explorer, no Agent-related metrics (e.g., `datadog.agent.host_metrics`) or custom metrics from the `metrics-demo` service appear.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- Reproduction: inject broken config in docker-compose.yml and restart containers


## Steps to reproduce / What to observe

1. Start the Docker environment using `npm run up:full`.
2. Verify that the `fixitfaster-agent` and `fixitfaster-metrics-demo` containers are running.
3. Execute `docker exec fixitfaster-agent agent status` and observe that the DogStatsD section shows metrics being processed and forwarded.
4. Navigate to the Datadog UI's Metrics Explorer (app.datadoghq.com/metric/explorer).
5. Search for host metrics (e.g., `datadog.agent.host_metrics`) or custom metrics from the demo app (e.g., `custom.metric.from.demo`).
6. Observe that these metrics are not appearing in the Datadog UI.


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