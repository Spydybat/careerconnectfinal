/**
 * Sprint 14 — health model.
 *
 * Pure: turns component checks into a health payload. The payload is
 * deliberately free of credentials, environment variables, connection strings
 * and stack traces — it is safe to expose unauthenticated.
 */

import { worstStatus, type ComponentHealth, type HealthStatus } from "./types";

export interface HealthPayload {
  status: HealthStatus;
  service: string;
  environment: string;
  version: string;
  uptime_s: number;
  checked_at: string;
  request_id: string | null;
  checks: ComponentHealth[];
}

export const HTTP_STATUS_FOR: Record<HealthStatus, number> = {
  healthy: 200,
  degraded: 200,
  unhealthy: 503,
};

export function buildHealthPayload(input: {
  checks: readonly ComponentHealth[];
  service?: string;
  environment?: string;
  version?: string;
  uptimeS?: number;
  requestId?: string | null;
  now?: Date;
}): HealthPayload {
  const now = input.now ?? new Date();
  return {
    status: worstStatus(input.checks.map((c) => c.status)),
    service: input.service ?? "career-connect",
    environment: input.environment ?? "development",
    version: input.version ?? "unknown",
    uptime_s: Math.round(input.uptimeS ?? 0),
    checked_at: now.toISOString(),
    request_id: input.requestId ?? null,
    checks: input.checks.map((check) => ({
      component: check.component,
      status: check.status,
      detail: check.detail,
      ...(check.latency_ms === undefined ? {} : { latency_ms: check.latency_ms }),
      checked_at: check.checked_at,
    })),
  };
}

/** Readiness is stricter: a degraded required dependency is not ready. */
export function isReady(checks: readonly ComponentHealth[]): boolean {
  return checks.every((check) => check.status === "healthy");
}
