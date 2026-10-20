# Runbook — database

**Alerts:** `db.unavailable` (P1)

## Diagnose

1. `/readiness` → the `database` check reports reachability and probe latency.
2. Operations console → Database card: probes, failures, p95, slow-query count,
   migration status.
3. Logs: `error_kind=database_error` grouped by `request_id`.

## Act

- All probes failing → backend outage: check backend status, then restart the
  backend if it is unresponsive. The app degrades rather than crashes; keep
  readiness failing so traffic drains.
- Elevated latency with successful probes → look for slow queries above the
  threshold (`DB_SLOW_QUERY_MS`) and for a recent traffic spike.
- `migration_status` not `applied` → deploy is inconsistent with the schema;
  roll forward with the migration or roll back the image.

## Verify

Probe failure rate returns to 0, p95 below the degraded threshold, `/readiness`
returns 200.
