# Runbook — warehouse and BI

**Alerts:** `warehouse.stale` (P2), `etl.stale` (P2)

Freshness has one source of truth (`src/observability/freshness.ts`). The BI
dashboards and the operations console read the same report, so they can never
disagree.

## Diagnose

1. Operations console → Warehouse card: freshness status, last successful load,
   data-through date, refresh duration, mart status.
2. If freshness is `failed` or `stale`, the cause is upstream — go to
   [etl.md](./etl.md).
3. `delayed` with a `SUCCESS` run means the load is running long: compare
   refresh duration against previous runs.

## Act

- Upstream pipeline failure → fix and re-run the pipeline; freshness recovers
  automatically on the next snapshot.
- Mart degraded → rebuild the marts after the warehouse load completes.
- Communicate to BI users using the freshness badge already shown on dashboards;
  never hand-edit warehouse rows to make a dashboard look current.

## Verify

`data_through` advances, status returns to `fresh`, BI badge matches the
operations console.
