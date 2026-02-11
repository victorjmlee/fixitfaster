# Scenario: Logs not linked from Trace

**Difficulty:** ⭐ Easy
**Estimated time:** 5–10 min
**Related Datadog products:** APM, Log Management


## Symptom summary

On the APM Trace detail page, the "Logs" tab shows no logs.  
Logs are being collected and traces are present, but they are not linked to each other.


## Environment

- Service: `correlation-demo` (Node.js + dd-trace)
- Agent: Datadog Agent 7.x (Docker)
- Logs: JSON format to stdout


## Steps to reproduce / What to observe

1. In Datadog APM → Traces, open a trace for the `correlation-demo` service.
2. On the trace detail page, the Logs tab is empty.
3. In Logs Explorer, searching for `service:correlation-demo` returns logs.
4. Logs are missing or have incorrect `dd.trace_id` / `dd.span_id` fields.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check correlation-demo container logs:
docker logs -f fixitfaster-correlation-demo

Rebuild and restart correlation-demo container:
cd ~/fixitfaster-agent
docker compose --env-file .env.local build correlation-demo && docker compose --env-file .env.local up -d correlation-demo

Restart the agent:
cd ~/fixitfaster-agent
npm run agent:restart
