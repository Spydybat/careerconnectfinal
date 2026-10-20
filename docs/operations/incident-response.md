# Incident response

## Severity

| Sev | Definition                                    | Examples                                                         | Response             | Comms                                       |
| --- | --------------------------------------------- | ---------------------------------------------------------------- | -------------------- | ------------------------------------------- |
| P1  | Platform down or data/security breach risk    | app 5xx spike, database unreachable, cross-tenant access attempt | immediate, all hands | status note to staff at 15 min, then hourly |
| P2  | Major feature broken or data pipeline failing | ETL FAILED, warehouse stale, AI provider down                    | within 1 hour        | note in daily ops summary                   |
| P3  | Degraded experience                           | latency degradation, quality score dip, AI cost spike            | next business day    | ticket only                                 |
| P4  | Cosmetic or informational                     | single quarantined batch, one-off warning                        | backlog              | none                                        |

## Procedure

1. **Detect** — alert fires (`alert.fired` log) or the operations console shows
   a non-healthy component.
2. **Assess** — open `/admin/operations`; note overall status, the failing
   components and the firing alerts.
3. **Correlate** — take a `request_id` from the failing path and filter logs by
   it to reconstruct the request end to end.
4. **Contain** — follow the linked runbook page for the failing domain.
5. **Verify** — `/readiness` returns 200, the component returns to healthy and
   the alert clears on the next snapshot.
6. **Record** — capture the timeline, cause and follow-ups; security-relevant
   actions are already in `audit_logs`.

## Escalation

P1 unresolved after 30 minutes, or any suspicion of data exposure, escalates to
the platform owner and triggers a security review of `audit_logs` for the
affected window.
