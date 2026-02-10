# Scenario: APM traces not appearing in Datadog

**Difficulty:** ⭐ Easy (Warm-up)
**Estimated time:** 5–10 min
**Related Datadog products:** APM, Agent

---

## Symptom summary

Traces for the `trace-demo` service normally appear in Datadog APM, but at some point **traces stopped being received entirely.**

---

## Environment

- **Trace source:** `trace-demo` container (sends spans every 15 seconds)
- **Agent:** Datadog Agent 7.x (Docker)
- **Port:** 8126 (APM trace intake)

---

## Steps to reproduce / What to observe

1. In Datadog → APM → Services / Traces, the `trace-demo` service is missing.
2. The `trace-demo` container logs show "span sent" messages as expected.
3. The Agent is running.

---

## Allowed resources

- [x] Datadog documentation (APM, Agent)
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

<!-- Do not share with participants before the competition; use for review only -->

**How to break it:**

In docker-compose.yml, change the Agent’s `DD_APM_ENABLED=true` to `DD_APM_ENABLED=false`:

```yaml
# docker-compose.yml (agent service)
environment:
  - DD_APM_ENABLED=false  # ← change to this
```

Then restart the Agent:

```bash
npm run agent:down && npm run agent:up
```

**Answer summary:**

1. Restore `DD_APM_ENABLED=true` in docker-compose.yml.
2. Restart the Agent: `npm run agent:down && npm run agent:up`.
3. After 1–2 minutes, confirm the `trace-demo` service in APM.

**Related docs:** Agent Troubleshooting, APM trace collection
