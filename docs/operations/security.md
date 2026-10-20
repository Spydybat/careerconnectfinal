# Runbook — security

**Alerts:** `security.anomaly` (P1)

Signals come from the Sprint 12 audit trail (`audit_logs`); Sprint 14 adds no
parallel security log and stores no new personal data.

## Monitored counters

Authentication failures, authorization denials, rate-limit violations, CSRF
failures, rejected uploads, cross-tenant access attempts, admin security events.

## Diagnose

1. Operations console → Security card for the 24h counters.
2. Any cross-tenant attempt is treated as P1 regardless of volume.
3. Query `audit_logs` for the window: actor role, action, outcome, entity type.
   Actor identity stays inside the audit trail — it is not copied into logs.

## Act

- Auth failure spike from many actors → likely credential stuffing: verify rate
  limiting is engaging (`security.rate_limited` counter rising).
- Authorization denials concentrated on one role → check the RLS policies and
  role assignment rather than loosening policy.
- Cross-tenant attempt → freeze the actor's session, review every audited action
  by that actor, and escalate per [incident-response.md](./incident-response.md).

## Verify

Counters return to baseline; no residual denials for legitimate users.
