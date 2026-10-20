/**
 * Sprint 14 — AI observability.
 *
 * Aggregates rows that the Sprint 11 usage tracker already writes. Prompt and
 * completion content is not stored and is never aggregated here.
 */

import { summariseLatency, type HealthStatus, type LatencySummary } from "./types";

export interface AiUsageRow {
  created_at: string;
  feature: string;
  provider: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | string | null;
  latency_ms: number | null;
  status: string;
}

export interface AiBreakdown {
  key: string;
  requests: number;
  failures: number;
  failureRate: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latency: LatencySummary;
}

export interface AiObservability {
  window_hours: number;
  requests: number;
  successes: number;
  failures: number;
  successRate: number;
  failureRate: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latency: LatencySummary;
  providers: (AiBreakdown & { health: HealthStatus })[];
  models: AiBreakdown[];
  features: AiBreakdown[];
}

const empty = (key: string): AiBreakdown & { latencies: number[] } => ({
  key,
  requests: 0,
  failures: 0,
  failureRate: 0,
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  latency: summariseLatency([]),
  latencies: [],
});

function finalize(group: AiBreakdown & { latencies: number[] }): AiBreakdown {
  const { latencies, ...rest } = group;
  return {
    ...rest,
    failureRate: group.requests === 0 ? 0 : group.failures / group.requests,
    costUsd: Math.round(group.costUsd * 1e6) / 1e6,
    latency: summariseLatency(latencies),
  };
}

export function providerHealth(breakdown: AiBreakdown, thresholds = AI_THRESHOLDS): HealthStatus {
  if (breakdown.requests === 0) return "healthy";
  if (breakdown.failureRate >= thresholds.failureRateCritical) return "unhealthy";
  if (
    breakdown.failureRate >= thresholds.failureRateWarn ||
    breakdown.latency.p95 >= thresholds.p95LatencyMs
  ) {
    return "degraded";
  }
  return "healthy";
}

export interface AiThresholds {
  failureRateWarn: number;
  failureRateCritical: number;
  p95LatencyMs: number;
  dailyCostWarnUsd: number;
  dailyCostCriticalUsd: number;
  costSpikeMultiplier: number;
}

/** Configurable — never hardcode these in UI components. */
export const AI_THRESHOLDS: AiThresholds = {
  failureRateWarn: Number(process.env["AI_FAILURE_RATE_WARN"] ?? 0.1),
  failureRateCritical: Number(process.env["AI_FAILURE_RATE_CRITICAL"] ?? 0.25),
  p95LatencyMs: Number(process.env["AI_P95_LATENCY_MS"] ?? 15000),
  dailyCostWarnUsd: Number(process.env["AI_DAILY_COST_WARN_USD"] ?? 5),
  dailyCostCriticalUsd: Number(process.env["AI_DAILY_COST_CRITICAL_USD"] ?? 20),
  costSpikeMultiplier: Number(process.env["AI_COST_SPIKE_MULTIPLIER"] ?? 3),
};

export function summariseAiUsage(
  rows: readonly AiUsageRow[],
  options: { windowHours?: number; thresholds?: AiThresholds } = {},
): AiObservability {
  const thresholds = options.thresholds ?? AI_THRESHOLDS;
  const providers = new Map<string, AiBreakdown & { latencies: number[] }>();
  const models = new Map<string, AiBreakdown & { latencies: number[] }>();
  const features = new Map<string, AiBreakdown & { latencies: number[] }>();
  const latencies: number[] = [];

  let requests = 0;
  let failures = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;

  const bump = (
    map: Map<string, AiBreakdown & { latencies: number[] }>,
    key: string,
    row: AiUsageRow,
    failed: boolean,
  ) => {
    const group = map.get(key) ?? empty(key);
    group.requests += 1;
    if (failed) group.failures += 1;
    group.inputTokens += Number(row.input_tokens ?? 0);
    group.outputTokens += Number(row.output_tokens ?? 0);
    group.costUsd += Number(row.estimated_cost_usd ?? 0);
    if (row.latency_ms) group.latencies.push(Number(row.latency_ms));
    map.set(key, group);
  };

  for (const row of rows) {
    const failed = row.status !== "success";
    requests += 1;
    if (failed) failures += 1;
    inputTokens += Number(row.input_tokens ?? 0);
    outputTokens += Number(row.output_tokens ?? 0);
    costUsd += Number(row.estimated_cost_usd ?? 0);
    if (row.latency_ms) latencies.push(Number(row.latency_ms));
    bump(providers, row.provider ?? "unknown", row, failed);
    bump(models, row.model ?? "unknown", row, failed);
    bump(features, row.feature ?? "unknown", row, failed);
  }

  const sortDesc = (a: AiBreakdown, b: AiBreakdown) => b.requests - a.requests;

  return {
    window_hours: options.windowHours ?? 24,
    requests,
    successes: requests - failures,
    failures,
    successRate: requests === 0 ? 1 : (requests - failures) / requests,
    failureRate: requests === 0 ? 0 : failures / requests,
    inputTokens,
    outputTokens,
    costUsd: Math.round(costUsd * 1e6) / 1e6,
    latency: summariseLatency(latencies),
    providers: [...providers.values()]
      .map(finalize)
      .map((p) => ({ ...p, health: providerHealth(p, thresholds) }))
      .sort(sortDesc),
    models: [...models.values()].map(finalize).sort(sortDesc),
    features: [...features.values()].map(finalize).sort(sortDesc),
  };
}
