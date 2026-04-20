# SNMP Integration Check Not Running

**Difficulty:** ⭐ Easy
**Estimated time:** 15 min
**Related Datadog products:** Agent, Metrics, Network Device Monitoring


## Symptom summary

The SNMP integration check is not running, or the Agent status shows 'no disco' for the SNMP check. Agent logs indicate configuration errors related to the SNMP integration.


## Environment

- Platform: Local Docker (docker-compose)
- Agent: Datadog Agent 7.x (containerized)
- Reproduction: inject broken config in docker-compose.yml and restart containers


## Steps to reproduce / What to observe

1. Start the `fixitfaster-agent` environment.
2. Check the Agent status using `docker exec fixitfaster-agent agent status`.
3. Observe that the SNMP check is not running or shows 'no disco'.
4. Review Agent logs for any configuration errors related to SNMP.


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