# Alerting

Alert definitions live as data in `src/observability/alerts.ts`. Each has an id,
domain, severity, condition, threshold source and a runbook link. Thresholds
come from configuration (`ALERT_*` environment variables) with safe defaults.

| Alert                  | Severity | Condition                                      | Env override                        |
| ---------------------- | -------- | ---------------------------------------------- | ----------------------------------- |
| `app.error_rate`       | P1       | 5xx rate > threshold over ≥20 requests         | `ALERT_APP_ERROR_RATE` (0.05)       |
| `app.latency`          | P3       | request p95 > threshold                        | `ALERT_APP_P95_MS` (2000)           |
| `db.unavailable`       | P1       | connection probe failure rate > threshold      | `ALERT_DB_FAILURE_RATE` (0.2)       |
| `etl.failed`           | P2       | last pipeline run FAILED                       | —                                   |
| `etl.record_drop`      | P2       | processed < input beyond ratio                 | `ALERT_ETL_DROP_RATIO` (0.1)        |
| `etl.quarantine_spike` | P3       | quarantined share > ratio                      | `ALERT_QUARANTINE_RATIO` (0.05)     |
| `etl.stale`            | P2       | no successful run within interval              | `ALERT_STALE_PIPELINE_MS` (26h)     |
| `quality.degraded`     | P3       | quality score < floor or any FAIL rule         | `ALERT_QUALITY_SCORE_FLOOR` (95)    |
| `warehouse.stale`      | P2       | warehouse age beyond stale threshold           | `ALERT_WAREHOUSE_STALE_MS` (24h)    |
| `ai.failure_rate`      | P2       | AI failure rate > threshold (≥10 requests)     | `ALERT_AI_FAILURE_RATE` (0.25)      |
| `ai.latency`           | P3       | AI p95 > threshold                             | `ALERT_AI_P95_MS` (15000)           |
| `ai.cost_spike`        | P3       | estimated spend > daily budget                 | `ALERT_AI_DAILY_COST_USD` (20)      |
| `security.anomaly`     | P1       | auth-failure spike or any cross-tenant attempt | `ALERT_SECURITY_AUTH_FAILURES` (50) |

## Delivery

Delivery is an abstraction (`AlertSink`). The default sink writes structured
`alert.fired` log records — it works in every environment and needs no
credentials. An email/webhook/pager sink can be added later by implementing
`AlertSink`; no external integration is invented here.

Alerts are evaluated whenever an operations snapshot is built (operations
console refresh, or a scheduled caller). Only firing alerts are dispatched.
