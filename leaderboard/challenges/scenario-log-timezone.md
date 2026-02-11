# Scenario: Logs seem to not be collecting in real time

**Difficulty:** ⭐⭐⭐ Intermediate
**Estimated time:** 15–25 min
**Related Datadog products:** Log Management, Pipelines


## Symptom summary

log-demo logs used to show up correctly in Datadog, but at some point they started behaving wrong: timestamps are off by about 9 hours, or when you filter by "Last 15 minutes" recent logs do not appear — as if they stopped ingesting. The log-demo container is still running and writing logs. You need to find why the logs are wrong or missing in the explorer.


## Environment

- Log source: log-demo container (prints logs in Asia/Seoul timezone every 5 seconds).
- Log format: YYYY-MM-DD HH:MM:SS [INFO] [log-demo] User 123 completed action
- Agent: Datadog Agent 7.x (Docker), collects container logs.


## Steps to reproduce / What to observe

1. In Datadog Logs → Explorer, search for service:log-demo.
2. The log-demo container is running and producing logs (e.g. docker logs fixitfaster-log-demo).
3. So: logs are being produced, but in Datadog they appear at the wrong time or seem not to be ingesting.


## What to investigate (hints)

- In Logs → Configuration → Pipelines, find the pipeline that applies to service:log-demo and review.
- Datadog docs: Log Pipelines, Date Remapper, Parsing.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check log-demo container logs:
docker logs -f fixitfaster-log-demo

Rebuild and restart log-demo container:
cd ~/fixitfaster-agent
docker compose --env-file .env.local build log-demo && docker compose --env-file .env.local up -d log-demo

Restart the agent:
cd ~/fixitfaster-agent
npm run agent:restart

