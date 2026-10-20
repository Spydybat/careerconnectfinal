# Runbook — application

**Alerts:** `app.error_rate` (P1), `app.latency` (P3)

## Diagnose

1. `/admin/operations` → Application table: which route and status class dominate.
2. Check `errorKinds` in the snapshot — `database_error`, `ai_error` and
   `external_service_error` mean the fault is downstream, not in the route.
3. Pick a `request_id` from an error log line and filter all logs by it.
4. `/readiness` — if it is 503 the dependency section names the failing component.

## Act

- Downstream fault → follow that component's runbook page.
- Single route failing after a deploy → roll back to the previous image tag.
- Latency only, error rate normal → check database probe latency and AI p95;
  both feed request latency.

## Verify

Error rate returns below threshold over the rolling window and the alert clears
on the next snapshot.
