# Scenario: Host not showing in Infrastructure

**Difficulty:** ⭐ Easy
**Estimated time:** 5–10 min
**Related Datadog products:** Infrastructure (Host Map, etc.), Agent


## Symptom summary

The host you expect 'fixitfaster-agent' does not appear in Datadog Infrastructure (Host Map, Hosts). You may see a different host name such as broken-agent, or no host at all. The Agent container is running and agent status works. You need to get the expected host to show correctly in Infrastructure.


## Environment

- Platform: Local Docker (Datadog Agent).
- Agent: Datadog Agent 7.x.
- Same API key; the host appears under the wrong name or is missing from the list.


## Steps to reproduce / What to observe

1. In Datadog → Infrastructure → Host Map (or Hosts), look for the expected host name (e.g. fixitfaster-agent).
2. The expected host is missing; you may see another name (e.g. broken-agent) instead.
3. The Agent container is running; docker exec fixitfaster-agent agent status succeeds.
4. So: the agent is up, but the host in Datadog does not match what you expect.


## What to investigate (hints)

- Check how the Agent reports its hostname: docker-compose (hostname, DD_HOSTNAME) and Agent docs.
- Datadog docs: Infrastructure, Agent hostname, Hostname in containers.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check Agent container and status:
docker ps | grep agent
docker exec fixitfaster-agent agent status

Restart the agent:
cd ~/fixitfaster-agent
npm run agent:restart

