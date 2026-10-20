# Runbook — ETL and data quality

**Alerts:** `etl.failed` (P2), `etl.record_drop` (P2), `etl.quarantine_spike` (P3),
`etl.stale` (P2), `quality.degraded` (P3)

## Diagnose

1. Operations console → ETL card: run id, status, duration, input vs processed,
   rejected, quarantined, watermark.
2. Data quality card: score, failing rules, per-dimension breakdown and trend.
3. Logs filtered by the run id give per-stage timings and errors.

## Act

- **FAILED run** — the pipeline is idempotent and watermark-driven: re-run it.
  Records already processed are not duplicated.
- **Record drop** — compare input vs processed per dataset; a drop with no
  errors usually means rejected rows. Inspect the rejection reasons before
  re-running.
- **Quarantine spike** — a source contract changed. Fix the source or the rule,
  then reprocess the quarantined batch; do not lower the rule to clear the alert.
- **Stale pipeline** — no successful run in the interval. Check the scheduler
  first, then run manually.
- **Quality degradation** — treat a failing rule as a data incident: identify
  the dimension, the affected dataset and the first bad run via the trend.

## Verify

Latest run is `SUCCESS`, input ≈ processed, quality score at or above the floor,
warehouse freshness back to `fresh`.

## How the pipeline is triggered in production

The production architecture is strictly batch and stays out of the request path:

```
OLTP → Data Lake → ETL → Warehouse → Marts → BI
```

- **Never on a web request.** No route, loader or server function runs the
  pipeline. Request-time BI reads only pre-built marts.
- **Scheduled batch** — the pipeline entrypoint is `bun run data:build`
  (`scripts/build-data-platform.ts`). In production it is invoked out of band on
  a schedule (nightly by default) by the platform scheduler — a `pg_cron` job
  calling the batch endpoint via `pg_net`, or an external scheduler hitting the
  same `/api/public/*` batch path. The Worker runtime does not run cron itself.
- **Manual re-run** — operators re-run the same command/endpoint after a failure;
  the pipeline is idempotent and watermark-driven, so re-running is safe.
- **Freshness contract** — the warehouse freshness signal and the `etl.stale`
  alert are what detect a scheduler that stopped firing.
