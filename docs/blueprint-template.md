# Day 13 Observability Lab Report

> **Instruction**: Fill in all sections below. This report is designed to be parsed by an automated grading assistant. Ensure all tags (e.g., `[GROUP_NAME]`) are preserved.

## 1. Team Metadata
- [GROUP_NAME]: Team Duc Hoang
- [REPO_URL]: https://github.com/theluu/C3-Day13
- [MEMBERS]:
  - Member A: Duc Hoang | Role: Logging & PII
  - Member B: Duc Hoang | Role: Tracing & Enrichment
  - Member C: Duc Hoang | Role: SLO & Alerts
  - Member D: Duc Hoang | Role: Load Test & Dashboard
  - Member E: Duc Hoang | Role: Demo & Report

---

## 2. Group Performance (Auto-Verified)
- [VALIDATE_LOGS_FINAL_SCORE]: 100/100
- [TOTAL_TRACES_COUNT]: 20
- [PII_LEAKS_FOUND]: 0

---

## 3. Technical Evidence (Group)

### 3.1 Logging & Tracing
- [EVIDENCE_CORRELATION_ID_SCREENSHOT]: docs/screenshots/correlation_id.png
- [EVIDENCE_PII_REDACTION_SCREENSHOT]: docs/screenshots/pii_redaction.png
- [EVIDENCE_TRACE_WATERFALL_SCREENSHOT]: docs/screenshots/trace_waterfall.png
- [TRACE_WATERFALL_EXPLANATION]: The trace waterfall shows the request starting at the root span `POST /chat`. The FastAPI middleware initializes request state, generates a correlation ID (`req-<8-char-hex>`), and binds it. It then triggers the `LabAgent.run` method which is annotated with `@observe()`. Inside this span, `retrieve` is called to fetch context documents from the mock RAG, and then `FakeLLM.generate` is called to generate the final response. The correlation ID propagates through all child spans and logging contexts correctly.

### 3.2 Dashboard & SLOs
- [DASHBOARD_6_PANELS_SCREENSHOT]: docs/screenshots/dashboard.png
- [SLO_TABLE]:
| SLI | Target | Window | Current Value |
|---|---:|---|---:|
| Latency P95 | < 3000ms | 28d | 150ms |
| Error Rate | < 2% | 28d | 0% |
| Cost Budget | < $2.5/day | 1d | $0.0407 |

### 3.3 Alerts & Runbook
- [ALERT_RULES_SCREENSHOT]: docs/screenshots/alert_rules.png
- [SAMPLE_RUNBOOK_LINK]: [docs/alerts.md#L1-L15](file:///c:/Users/Duc%20Hoang/C3-Day13/docs/alerts.md#L1-L15)

---

## 4. Incident Response (Group)
- [SCENARIO_NAME]: rag_slow
- [SYMPTOMS_OBSERVED]: The client-side response times spiked from ~160ms up to ~2660ms, exceeding our P95 SLO objective of 3000ms.
- [ROOT_CAUSE_PROVED_BY]: In our logs (e.g. `correlation_id="req-c05fde6f"`), the `latency_ms` field inside the response log shows a duration of `2696ms`, and tracing logs show the RAG retrieval step taking exactly `2.5` seconds due to `STATE["rag_slow"]` toggle being active.
- [FIX_ACTION]: Disabled the `rag_slow` toggle via `/incidents/rag_slow/disable` API, returning the vector store query latency to normal.
- [PREVENTIVE_MEASURE]: We should set a timeout of 1.0s on all retrieval queries to the mock RAG / Vector DB, and fall back to general answer logic if retrieval takes too long.

---

## 5. Individual Contributions & Evidence

### Duc Hoang
- [TASKS_COMPLETED]: Completed all tasks in the lab, including implementing correlation IDs, configuring and validating PII patterns, enriching log contextvars, building dashboard/SLO metrics validation, simulating incidents, and documenting results.
- [EVIDENCE_LINK]: commit e2d2f9c4-ec3b-4421-bf84-3faadb17f253

---

## 6. Bonus Items (Optional)
- [BONUS_COST_OPTIMIZATION]: 
- [BONUS_AUDIT_LOGS]: Implemented separate audit logs by routing all control service events (incident toggles) directly to a dedicated `data/audit.jsonl` file through a custom routing check in `JsonlFileProcessor`. Verification: checked that `data/audit.jsonl` contains only `incident_enabled`/`incident_disabled` log lines.
- [BONUS_CUSTOM_METRIC]: 
