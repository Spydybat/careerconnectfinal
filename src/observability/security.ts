/**
 * Sprint 14 — security monitoring.
 *
 * Built on the Sprint 12 audit trail; no parallel security log is created.
 * Rows come from `audit_logs` and are projected into operational counters.
 */

import type { HealthStatus } from "./types";

export interface AuditRow {
  occurred_at: string;
  action: string;
  category: string;
  severity: string;
  outcome: string;
  actor_id: string | null;
  actor_role: string | null;
}

export interface SecurityObservability {
  window_hours: number;
  total_events: number;
  auth_failures: number;
  authorization_failures: number;
  rate_limit_violations: number;
  csrf_failures: number;
  suspicious_uploads: number;
  cross_tenant_attempts: number;
  admin_security_events: number;
  critical_events: number;
  status: HealthStatus;
  recent: {
    at: string;
    action: string;
    severity: string;
    outcome: string;
    actor_role: string | null;
  }[];
}

export interface SecurityThresholds {
  authFailureWarn: number;
  authFailureCritical: number;
  authorizationFailureWarn: number;
  crossTenantCritical: number;
}

export const SECURITY_THRESHOLDS: SecurityThresholds = {
  authFailureWarn: Number(process.env["SEC_AUTH_FAILURE_WARN"] ?? 20),
  authFailureCritical: Number(process.env["SEC_AUTH_FAILURE_CRITICAL"] ?? 100),
  authorizationFailureWarn: Number(process.env["SEC_AUTHZ_FAILURE_WARN"] ?? 20),
  crossTenantCritical: Number(process.env["SEC_CROSS_TENANT_CRITICAL"] ?? 1),
};

export function summariseSecurity(
  rows: readonly AuditRow[],
  options: { windowHours?: number; thresholds?: SecurityThresholds } = {},
): SecurityObservability {
  const thresholds = options.thresholds ?? SECURITY_THRESHOLDS;
  const count = (predicate: (row: AuditRow) => boolean) => rows.filter(predicate).length;

  const authFailures = count((r) => r.action === "auth.login_failed");
  const authorizationFailures = count(
    (r) => r.action === "security.authorization_denied" || r.outcome === "denied",
  );
  const rateLimited = count((r) => r.action === "security.rate_limited");
  const csrf = count((r) => r.action.includes("csrf"));
  const uploads = count((r) => r.action === "security.file_rejected");
  const crossTenant = count(
    (r) => r.category === "security" && r.outcome === "denied" && r.severity === "critical",
  );
  const adminEvents = count((r) => r.category === "admin" || r.action.startsWith("user.roles"));
  const critical = count((r) => r.severity === "critical");

  let status: HealthStatus = "healthy";
  if (
    authFailures >= thresholds.authFailureCritical ||
    crossTenant >= thresholds.crossTenantCritical
  ) {
    status = "unhealthy";
  } else if (
    authFailures >= thresholds.authFailureWarn ||
    authorizationFailures >= thresholds.authorizationFailureWarn
  ) {
    status = "degraded";
  }

  return {
    window_hours: options.windowHours ?? 24,
    total_events: rows.length,
    auth_failures: authFailures,
    authorization_failures: authorizationFailures,
    rate_limit_violations: rateLimited,
    csrf_failures: csrf,
    suspicious_uploads: uploads,
    cross_tenant_attempts: crossTenant,
    admin_security_events: adminEvents,
    critical_events: critical,
    status,
    recent: [...rows]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .slice(0, 10)
      .map((r) => ({
        at: r.occurred_at,
        action: r.action,
        severity: r.severity,
        outcome: r.outcome,
        actor_role: r.actor_role,
      })),
  };
}
