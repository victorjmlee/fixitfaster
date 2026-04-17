# Scenario: Custom metrics not appearing

**Difficulty:** ⭐⭐⭐⭐ Hard
**Estimated time:** 10–20 min
**Related Datadog products:** Metrics, Agent (DogStatsD)


## Symptom summary

The app sends custom metrics via DogStatsD, but those metrics do not appear in Metrics Explorer. No fixitfaster.demo.* metrics are visible. The metrics-demo container is running and logs show "sent metrics"; the Agent is up. You need to find why metrics never reach Datadog.


## Environment

- Metric source: metrics-demo container (DogStatsD client), sends every 5 seconds.
- Agent: Datadog Agent 7.x (Docker), DogStatsD on port 8125/udp.
- Path: Application (metrics-demo) → Agent (host + port) → Datadog Metrics.


## Steps to reproduce / What to observe

1. In Datadog Metrics → Explorer, search for fixitfaster.demo.
2. No metrics appear (and they do not show in autocomplete).
3. The metrics-demo container logs show "sent metrics" at regular intervals.
4. The Agent container is running and healthy.
5. So: the app is sending, the agent is up, but nothing shows up in Metrics Explorer.


## What to investigate (hints)

- Confirm where the application sends metrics: which host and which port.
- Check the application’s DogStatsD client configuration (code or config).
- Datadog docs: DogStatsD, Custom metrics, Agent configuration.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check metrics-demo container logs:
docker logs -f fixitfaster-metrics-demo

Rebuild and restart metrics-demo container:
cd ~/fixitfaster-agent
docker compose --env-file .env.local build metrics-demo && docker compose --env-file .env.local up -d metrics-demo

Stop metrics-demo container:
cd ~/fixitfaster-agent
docker compose --env-file .env.local stop metrics-demo

Restart the agent:
cd ~/fixitfaster-agent
npm run agent:restart
