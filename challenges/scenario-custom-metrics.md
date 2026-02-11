# Scenario: Custom metrics not appearing

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 10–20 min
**Related Datadog products:** Metrics, Agent (DogStatsD)

---

## Symptom summary

The app sends custom metrics via DogStatsD, but **those metrics do not appear in Metrics Explorer.**  
No `fixitfaster.demo.*` metrics are visible.

---

## Environment

- **Metric source:** `metrics-demo` container (DogStatsD client)
- **Agent:** Datadog Agent 7.x (Docker)
- **DogStatsD port:** 8125/udp

---

## Steps to reproduce / What to observe

1. In Datadog Metrics → Explorer, search for `fixitfaster.demo`.
2. No metrics appear (and they do not show in autocomplete).
3. The `metrics-demo` container logs show "sent metrics" as expected.
4. (Optional) Check Agent status for DogStatsD.

---

## Allowed resources

- [x] Datadog documentation (Metrics, DogStatsD)
- [x] Agent Troubleshooting
- [ ] Internal wiki: (specify per team)

---

## Submission format (for participants)

- Root cause summary:
- Resolution steps:
- Documentation / links used:
- Time taken:
