# Scenario: Missing Container Metrics and Logs

**Difficulty:** ⭐ Easy
**Estimated time:** 15–20 min
**Related Datadog products:** Infrastructure (Containers), Logs, Agent


## Symptom summary

The `infra-demo` container is running and visible via `docker ps`, but it does not appear in Datadog Infrastructure → Containers, and logs for `service:infra-demo` do not appear in Datadog Logs. No errors are visible in the Agent status. All other containers are working normally.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- Reproduction: broken config injected into docker-compose.yml; agent restart required


## Steps to reproduce / What to observe

1. Start the environment from the `fixitfaster-agent` directory: `docker compose up -d`
2. Confirm `infra-demo` is running: `docker ps | grep infra-demo`
3. In Datadog → Infrastructure → Containers, search for `fixitfaster-infra-demo`. It is missing.
4. In Datadog Logs, filter by `service:infra-demo`. No logs appear.
5. Run `docker exec fixitfaster-agent agent status` — the Agent appears healthy with no obvious errors.


## What to investigate (hints)

- Check the Agent's environment variables in `docker-compose.yml` for any container exclusion rules.
- Datadog docs: Container Discovery Management, `DD_CONTAINER_EXCLUDE_LOGS`, `DD_CONTAINER_EXCLUDE_METRICS`.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check running containers:
docker ps | grep infra-demo

Agent status:
docker exec fixitfaster-agent agent status

Check agent environment variables:
docker exec fixitfaster-agent env

Restart agent after fix:
cd ~/fixitfaster-agent
npm run agent:restart
