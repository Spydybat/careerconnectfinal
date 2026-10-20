/** Shared operational vocabulary for Sprint 14 observability. */

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type FreshnessStatus = "fresh" | "delayed" | "stale" | "failed";

export type EtlRunStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export type AlertSeverity = "P1" | "P2" | "P3" | "P4";

export interface ComponentHealth {
  component: string;
  status: HealthStatus;
  /** Short, safe, operator-facing summary. Never contains secrets or traces. */
  detail: string;
  latency_ms?: number;
  checked_at: string;
}

/** Worst-of aggregation — one unhealthy component makes the system unhealthy. */
export function worstStatus(statuses: readonly HealthStatus[]): HealthStatus {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const lowValue = sorted[low] ?? 0;
  if (low === high) return Math.round(lowValue);
  const highValue = sorted[high] ?? lowValue;
  return Math.round(lowValue + (highValue - lowValue) * (rank - low));
}

export interface LatencySummary {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export function summariseLatency(values: readonly number[]): LatencySummary {
  return {
    count: values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: values.length === 0 ? 0 : Math.round(Math.max(...values)),
  };
}
