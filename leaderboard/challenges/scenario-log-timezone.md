# Scenario: Log timestamps 9 hours off / Logs seem to not be ingesting

**Difficulty:** ⭐⭐ Medium
**Estimated time:** 15–25 min
**Related Datadog products:** Log Management, Pipelines

---

## Symptom summary

- **A.** Logs are in Datadog but **timestamps are shifted by 9 hours**, so real-time monitoring is wrong (e.g. 2 PM logs show as 11 PM or vice versa).
- **B.** With a time range like "Last 15 minutes", **recent logs do not appear** — as if logs were not ingesting.

Both can happen when **Grok parsing and the Date Remapper are missing the Asia/Seoul timezone** (logs are then interpreted as UTC).

---

## Environment

- **Log source:** `log-demo` container (logs in Asia/Seoul timezone)
- **Log format:** `2024-01-15 14:30:00 [INFO] [log-demo] User 123 completed action`
- **Agent:** Datadog Agent 7.x (Docker)

---

## Steps to reproduce / What to observe

1. In Datadog Logs → Explorer, search for `service:log-demo`.
2. Log **timestamp** is off by 9 hours from the actual time.
3. With "Last 15 minutes" filter, recently generated logs do not show.

---

## Allowed resources

- [x] Datadog documentation (Log Management, Pipelines)
- [x] Log Parsing, Date Remapper
- [ ] Internal wiki: (specify per team)

---

## Submission format (for participants)

- **Root cause summary:**
- **Resolution steps:**
- **Documentation / links used:**
- **Time taken:**

---

## For organizers: Working setup vs how to break it & answer key

**Working setup (what participants should see first):**

- The pipeline created by **`npm run pipeline:setup`** (or `npm run agent:up:full`) in this repo is the **correct** one.
- In Logs → Configuration → Pipelines → "log-demo (Asia/Seoul Timezone)", the Grok Parser and **Date Remapper (Asia/Seoul)** are configured.

**How to break it (for the scenario):**

- **A.** In that pipeline, **remove the Date Remapper** or set **Timezone to UTC (or leave unset)** → 9-hour shift / logs missing from "Last 15 minutes".
- **B.** **Remove or break the Grok Parser** so `timestamp` is not parsed → Date Remapper cannot run and log time is wrong or logs seem missing.
- **C.** Disable the pipeline or change the filter so `service:log-demo` logs do not use this pipeline.

**Answer summary:**

1. In Logs → Configuration → Pipelines, find or create the pipeline for `service:log-demo`.
2. Use a Grok Parser to extract the timestamp (e.g. `%{date("yyyy-MM-dd HH:mm:ss"):timestamp} \[%{word:level}\] ...`).
3. Add or fix the Date Remapper: source `timestamp`, **Timezone: Asia/Seoul**.
4. Save and confirm with new logs.

**Related docs:** Log Pipelines, Date Remapper, Parsing
