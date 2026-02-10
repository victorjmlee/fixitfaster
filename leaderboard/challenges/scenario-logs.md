# Scenario: Logs not visible in Datadog

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–25 min
**Related Datadog products:** Log Management, Agent

---

## Symptom summary

App or system logs were previously collected in Datadog Logs, but **at some point logs stopped ingesting entirely, or only certain sources disappeared.**

---

## Environment

- **Platform:** Local Docker (Datadog Agent)
- **Agent:** Datadog Agent 7.x
- **Note:** Log sources may be file, stdout, container logs, etc. (specify per team)

---

## Steps to reproduce / What to observe

1. In Datadog → Logs → Explorer, expected logs are missing.
2. (Optional) Agent config shows log collection disabled or wrong path/source.
3. The app is running and logs are present locally.

---

## Allowed resources

- [x] Datadog documentation (Log Management, Agent)
- [x] Help Center, Agent Troubleshooting
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

- **A.** Set Agent env var `DD_LOGS_ENABLED=false` and restart.
- **B.** Point log collection to a wrong path/file (e.g. a path that does not exist).
- **C.** Disable that log source in the Agent or set tags so it is hard to find in Explorer.

**Answer summary:**

- **A:** Restore `DD_LOGS_ENABLED=true` and restart the Agent.
- **B:** Restore the correct log path/config.
- **C:** Restore source/tag configuration.

**Related docs:** Log Collection (Agent), Troubleshooting
