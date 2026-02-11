# Scenario: APM traces not appearing in Datadog

**Difficulty:** ⭐⭐ Intermediate
**Estimated time:** 10–15 min
**Related Datadog products:** APM, Agent

---

## Symptom summary

Traces for the `trace-demo` service normally appear in Datadog APM, but at some point **traces stopped being received entirely.** The application is still running and logging that it sends spans; the Agent container is up. You need to find why traces never reach Datadog.

---

## Environment

- **Trace source:** `trace-demo` container — sends one span every 5 seconds to the Datadog Agent.
- **Agent:** Datadog Agent 7.x (Docker), listens for trace intake on a fixed port.
- **Path:** Application (trace-demo) → Agent (trace intake port) → Datadog APM.

---

## Steps to reproduce / What to observe

1. In Datadog → APM → Services / Traces, the **`trace-demo` service is missing** (or no new traces).
2. The **`trace-demo` container logs** show messages like "span sent" at regular intervals — the app believes it is sending.
3. The **Agent container is running** and healthy.
4. So: the app is sending, the agent is up, but **nothing shows up in APM.**

---

## What to investigate (hints)

- Confirm the Agent is listening for APM (port and config).
- Confirm **where** the application is sending traces: which host and **which port**.
- Check the application’s tracer configuration (code or environment variables for the trace agent).
- Datadog docs: APM trace collection, Agent configuration, and language tracer (e.g. Node.js) setup.

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

In **trace-demo**, the application sends traces to the Agent on a **configurable port**. Misconfigure that port so the app sends to a port the Agent is not listening on.

- In **`trace-demo/index.js`**, set the tracer’s `port` to **8127** (Agent listens on **8126**):

```javascript
const tracer = require('dd-trace').init({
  service: 'trace-demo',
  env: process.env.DD_ENV || 'development',
  hostname: 'agent',
  port: 8127,   // ← wrong: Agent listens on 8126
});
```

Then rebuild and restart the trace-demo container so the change is applied:

```bash
docker compose --env-file .env.local build trace-demo
docker compose --env-file .env.local up -d trace-demo
```

**Answer summary:**

1. In **`trace-demo/index.js`**, set the tracer `port` back to **8126** (the Agent’s APM trace intake port).
2. Rebuild and restart trace-demo:  
   `docker compose --env-file .env.local build trace-demo && docker compose --env-file .env.local up -d trace-demo`
3. After about 1–2 minutes, confirm the **`trace-demo`** service and new traces in Datadog APM.

**Related docs:** Agent Troubleshooting, APM trace collection, Node.js tracer (dd-trace) configuration
