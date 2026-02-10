# Scenario: Host not showing in Infrastructure

**Difficulty:** ⭐ Easy
**Estimated time:** 10–20 min
**Related Datadog products:** Infrastructure (Host Map, etc.), Agent

---

## Symptom summary

The host where the Agent is running **does not appear in Datadog Infrastructure** (Host Map, inventory, etc.).  
It may have been visible before, or for new setups it has never appeared.

---

## Environment

- **Platform:** Local Docker (Datadog Agent)
- **Agent:** Datadog Agent 7.x
- **Note:** Same API key; only the host is missing.

---

## Steps to reproduce / What to observe

1. In Datadog → Infrastructure → Host Map (or Hosts), the expected host is missing.
2. The Agent container is running and `agent status` succeeds.
3. (Optional) Metrics/APM may also be missing or partial.

---

## Allowed resources

- [x] Datadog documentation (Infrastructure, Agent)
- [x] Agent Troubleshooting
- [ ] Internal wiki: (specify per team)

---

## Submission format (for participants)

- **Root cause summary:**
- **Resolution steps:**
- **Documentation / links used:**
- **Time taken:**

---

## For organizers: How to break it & answer key

**How to break it (choose one; easier options first):**

**Option A. Wrong hostname (recommended)**  
→ The host appears under a different name in Infrastructure; the expected name `fixitfaster-agent` is not in the list.

In `docker-compose.yml` for the **agent** service:

1. Change `hostname: fixitfaster-agent` to `hostname: broken-infra-host`.
2. Change `DD_HOSTNAME=fixitfaster-agent` to `DD_HOSTNAME=broken-infra-host` (or remove the line).

Then restart only the Agent:

```bash
npm run agent:down && npm run agent:up
```

In Datadog Infrastructure → Hosts / Host Map you will see **`broken-infra-host`** only; **`fixitfaster-agent`** will not appear. Participants fix by restoring `DD_HOSTNAME` and `hostname` in the compose file.

**Option B. Stop the Agent container**  
→ The host stops sending metrics and disappears from Infrastructure after a few minutes.

```bash
docker stop fixitfaster-agent
```

(Other demo containers can keep running.) Participants fix by starting the Agent again (`npm run agent:up` or `docker start fixitfaster-agent`).

**Option C. Use a different org API key**  
→ Data goes to another org, so the host does not appear in this org’s Infrastructure. Use only if you have another org’s key.

**Answer summary:**

- **A:** Restore `hostname: fixitfaster-agent` and `DD_HOSTNAME=fixitfaster-agent` in docker-compose.yml, then `npm run agent:down && npm run agent:up`.
- **B:** Run `npm run agent:up` or `docker start fixitfaster-agent`.
- **C:** Restore the correct org `DATADOG_API_KEY` in `.env.local` and restart the Agent.

**Related docs:** [Infrastructure Monitoring](https://docs.datadoghq.com/infrastructure/), [Agent Troubleshooting](https://docs.datadoghq.com/agent/troubleshooting/), [Hostname in Containers](https://docs.datadoghq.com/agent/troubleshooting/hostname_containers/)
