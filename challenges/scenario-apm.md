# Scenario: APM traces not appearing in Datadog

**Difficulty:** ⭐⭐⭐⭐ Hard
**Estimated time:** 10–15 min
**Related Datadog products:** APM, Agent


## Symptom summary

Traces for the `trace-demo` service normally appear in Datadog APM, but at some point traces stopped being received entirely. The application is still running and logging that it sends spans; the Agent container is up. You need to find why traces never reach Datadog.


## Environment

- Trace source: `trace-demo` container — sends one span every 5 seconds to the Datadog Agent.
- Agent: Datadog Agent 7.x (Docker), listens for trace intake on a fixed port.
- Path: Application (trace-demo) → Agent (trace intake port) → Datadog APM.


## Steps to reproduce / What to observe

1. In Datadog → APM → Services / Traces, the `trace-demo` service is missing (or no new traces).
2. The `trace-demo` container logs show messages like "span sent" at regular intervals — the app believes it is sending
3. The Agent container is running and healthy.
4. So: the app is sending, the agent is up, but nothing shows up in APM.


## What to investigate (hints)

- Confirm the Agent is listening for APM (port and config).
- Confirm where the application is sending traces: which host and **which port**.
- Check the application’s tracer configuration (code or environment variables for the trace agent).
- Datadog docs: APM trace collection, Agent configuration, and language tracer (e.g. Node.js) setup.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check trace-demo container logs:
docker logs -f fixitfaster-trace-demo

Rebuild and restart trace-demo container:  
cd ~/fixitfaster-agent 
docker compose --env-file .env.local build trace-demo && docker compose --env-file .env.local up -d trace-demo

Restart the agent:
npm run agent:restart
