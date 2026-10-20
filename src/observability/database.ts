/**
 * Sprint 14 — database observability.
 *
 * A lightweight probe plus rolling latency. Index review is documented, not
 * automated: indexes are only added with query evidence (see
 * docs/operations/database.md).
 */

import { summariseLatency, type HealthStatus, type LatencySummary } from "./types";

export interface DbProbe {
  ok: boolean;
  latency_ms: number;
  error_kind?: string;
}

export interface DatabaseObservability {
  status: HealthStatus;
  probes: number;
  failures: number;
  connection_failure_rate: number;
  latency: LatencySummary;
  slow_queries: number;
  migration_status: "applied" | "unknown";
  slow_query_threshold_ms: number;
}

export const SLOW_QUERY_MS = Number(process.env["DB_SLOW_QUERY_MS"] ?? 1000);
export const DB_DEGRADED_MS = Number(process.env["DB_DEGRADED_LATENCY_MS"] ?? 500);

export function summariseDatabase(
  probes: readonly DbProbe[],
  options: { migrationStatus?: "applied" | "unknown"; slowQueryMs?: number } = {},
): DatabaseObservability {
  const slowMs = options.slowQueryMs ?? SLOW_QUERY_MS;
  const failures = probes.filter((p) => !p.ok).length;
  const latency = summariseLatency(probes.filter((p) => p.ok).map((p) => p.latency_ms));
  const slow = probes.filter((p) => p.latency_ms >= slowMs).length;

  let status: HealthStatus = "healthy";
  if (probes.length > 0 && failures === probes.length) status = "unhealthy";
  else if (failures > 0 || latency.p95 >= DB_DEGRADED_MS) status = "degraded";

  return {
    status,
    probes: probes.length,
    failures,
    connection_failure_rate: probes.length === 0 ? 0 : failures / probes.length,
    latency,
    slow_queries: slow,
    migration_status: options.migrationStatus ?? "unknown",
    slow_query_threshold_ms: slowMs,
  };
}
