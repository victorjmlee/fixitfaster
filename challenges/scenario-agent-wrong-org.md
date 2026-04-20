# Agent Reporting to Wrong Datadog Org

**Difficulty:** ⭐ Easy
**Estimated time:** 15 min
**Related Datadog products:** Agent, Infrastructure


## Symptom summary

All Datadog data (metrics, logs, traces, etc.) for the `fixitfaster-agent` host is being sent to an unintended Datadog organization instead of the desired one. You will not see any data from `fixitfaster-agent` in your Datadog account.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)


## Steps to reproduce / What to observe

1. Start the challenge environment using `npm run up:full`.
2. Navigate to your Datadog account and search for data (metrics, logs, traces) from the host `fixitfaster-agent`.
3. Observe that no data from `fixitfaster-agent` or its associated demo containers (e.g., `fixitfaster-trace-demo`, `fixitfaster-log-demo`) appears in your intended Datadog organization.


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
