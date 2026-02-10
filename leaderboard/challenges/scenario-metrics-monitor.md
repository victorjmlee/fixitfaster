# Scenario: Metrics or monitors missing / alerts wrong

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–25 min
**Related Datadog products:** Metrics, Monitors, Agent

---

## Symptom summary

- **Case 1:** A metric no longer appears in Datadog, or a metric that was there before has disappeared.
- **Case 2:** A monitor (alert) is configured but notifications do not arrive, or they fire incorrectly.

Participants work from the state where metrics/monitors were previously correct; the organizer has broken something and they must find and fix it.

---

## Environment

- **Platform:** Local Docker (Datadog Agent), (optional) app sending metrics
- **Agent:** Datadog Agent 7.x
- **Note:** Custom or default system metrics, 1–2 monitors (specify per team)

---

## Steps to reproduce / What to observe

1. **Metrics:** In Metrics Explorer or a dashboard, the expected metric is missing or always zero.
2. **Monitors:** In Monitors, status is wrong (e.g. always Alert/No Data) or notifications do not fire.
3. The Agent is running; other products (APM, Logs) may be fine.

---

## Allowed resources

- [x] Datadog documentation (Metrics, Monitors, Agent)
- [x] Help Center, Troubleshooting
- [ ] Internal wiki: (specify per team)

---

## Submission format (for participants)

- **Root cause summary:**
- **Resolution steps:**
- **Documentation / links used:**
- **Time taken:**

---

## For organizers: How to break it & answer key

**How to break it (choose one):**

- **A. Metrics:** Disable metric collection in the Agent or use a wrong prefix/filter so the metric is not sent.
- **B. Monitor:** Change the monitor query to a non-existent metric or wrong condition.
- **C. Monitor:** Set the notification channel (email/Slack) to an invalid value so alerts do not reach anyone.

**Answer summary:**

- **A:** Restore metric collection/forwarding config and restart the Agent.
- **B:** Fix the monitor query (correct metric/condition).
- **C:** Restore the notification channel and save the monitor.

**Related docs:** Metrics, Monitors, Agent
