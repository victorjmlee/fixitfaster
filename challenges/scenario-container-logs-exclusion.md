# Scenario: Container Metrics and Logs Silently Excluded

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–20 min
**Related Datadog products:** Infrastructure (Containers), Logs, Agent


## Symptom summary

The `app-demo` container is running and visible via `docker ps`, but it does not appear in Datadog Infrastructure → Containers, and no logs from it are visible in Datadog Logs. No errors appear in the Agent status. All other containers are working normally.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- Reproduction: broken config injected into docker-compose.yml; agent restart required


## Steps to reproduce / What to observe

1. Start the environment from the `fixitfaster-agent` directory: `docker compose up -d`
2. Confirm `app-demo` is running: `docker ps | grep app-demo`
3. In Datadog → Infrastructure → Containers, search for `fixitfaster-app-demo`. It is missing.
4. In Datadog Logs, filter by `service:app-demo`. No logs appear.
5. Run `docker exec fixitfaster-agent agent status` — the Agent appears healthy with no obvious errors.


## What to investigate (hints)

- Check the Agent's container exclusion configuration in `docker-compose.yml`.
- Review which environment variables control which containers the Agent collects metrics and logs from.
- Datadog docs: Container Discovery Management, `DD_CONTAINER_EXCLUDE`, `DD_CONTAINER_EXCLUDE_LOGS`, `DD_CONTAINER_EXCLUDE_METRICS`.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check running containers:
docker ps | grep app-demo

Agent status and container check:
docker exec fixitfaster-agent agent status
docker exec fixitfaster-agent agent configcheck

Restart agent after fix:
cd ~/fixitfaster-agent
npm run agent:restart
