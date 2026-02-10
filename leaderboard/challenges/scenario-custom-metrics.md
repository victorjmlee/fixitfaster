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

- **Root cause summary:**
- **Resolution steps:**
- **Documentation / links used:**
- **Time taken:**

---

## For organizers: How to break it & answer key

**How to break it:**

- **A.** Set `DD_DOGSTATSD_NON_LOCAL_TRAFFIC=false` so the Agent does not accept metrics from other containers.
- **B.** Remove or block port 8125 mapping.
- **C.** Disable DogStatsD in the Agent (e.g. `dogstatsd_stats_enable: false` or full disable).

**Answer summary:**

- **A:** Set `DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true` and restart the Agent.
- **B:** Add `8125:8125/udp` port mapping in docker-compose.yml.
- **C:** Re-enable DogStatsD in the Agent config.

**How to verify:**

```bash
# Check DogStatsD status in the Agent container
docker exec fixitfaster-agent agent status | grep -A5 DogStatsD
```

**Related docs:** DogStatsD, Custom Metrics
