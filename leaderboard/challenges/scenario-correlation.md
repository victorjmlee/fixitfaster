# Scenario: Logs not linked from Trace

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–20 min
**Related Datadog products:** APM, Log Management

---

## Symptom summary

On the APM Trace detail page, **the "Logs" tab shows no logs.**  
Logs are being collected and traces are present, but **they are not linked to each other.**

---

## Environment

- **Service:** `correlation-demo` (Node.js + dd-trace)
- **Agent:** Datadog Agent 7.x (Docker)
- **Logs:** JSON format to stdout

---

## Steps to reproduce / What to observe

1. In Datadog APM → Traces, open a trace for the `correlation-demo` service.
2. On the trace detail page, the **Logs** tab is empty.
3. In Logs Explorer, searching for `service:correlation-demo` returns logs.
4. Logs are missing or have incorrect `dd.trace_id` / `dd.span_id` fields.

---

## Allowed resources

- [x] Datadog documentation (APM, Logs)
- [x] Connect Logs and Traces
- [x] Node.js APM docs
- [ ] Internal wiki: (specify per team)

---

## Submission format (for participants)

- **Root cause summary:**
- **Resolution steps:**
- **Documentation / links used:**
- **Time taken:**

---

## For organizers: How to break it & answer key

**How to break it:**

- **A.** Set `DD_LOGS_INJECTION=false` so trace_id is not injected into logs.
- **B.** Change log field names from `dd.trace_id` / `dd.span_id` to something else.
- **C.** Set the log `service` tag to a different value than the APM service name (e.g. `correlation-demo` vs `correlationdemo`).

**Answer summary:**

- **A:** Set `DD_LOGS_INJECTION=true` and restart the container.
- **B:** Use a Datadog pipeline Remapper to map to `trace_id` (or restore field names).
- **C:** Use the same service name in APM and Logs.

**Correlation requirements:**

1. Logs must include a `dd.trace_id` field.
2. The log `service` tag must match the APM service name.
3. (Optional) `dd.span_id` links to a specific span.

**Related docs:** Connect Logs and Traces, dd-trace-js
