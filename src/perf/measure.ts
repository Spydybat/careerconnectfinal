/**
 * Sprint 12 — performance measurement primitives.
 *
 * Deliberately dependency-free: latency samples in, percentile summary out.
 * Used by the load-test harness, the ETL/warehouse benchmarks and the perf
 * regression tests.
 */

export type LatencySummary = {
  label: string;
  count: number;
  errors: number;
  errorRate: number;
  min: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  /** Wall-clock duration of the whole run, in ms. */
  durationMs: number;
  /** Completed operations per second. */
  throughput: number;
};

/** Nearest-rank percentile on an unsorted sample set. */
export function percentile(samples: readonly number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const index = Math.min(sorted.length - 1, Math.max(0, rank));
  return sorted[index] ?? 0;
}

export function summarize(
  label: string,
  samples: readonly number[],
  options: { errors?: number; durationMs?: number } = {},
): LatencySummary {
  const errors = options.errors ?? 0;
  const count = samples.length;
  const durationMs = options.durationMs ?? samples.reduce((a, b) => a + b, 0);
  const total = samples.reduce((a, b) => a + b, 0);
  return {
    label,
    count,
    errors,
    errorRate: count + errors === 0 ? 0 : errors / (count + errors),
    min: count ? Math.min(...samples) : 0,
    mean: count ? total / count : 0,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
    max: count ? Math.max(...samples) : 0,
    durationMs,
    throughput: durationMs > 0 ? (count / durationMs) * 1000 : 0,
  };
}

/** Millisecond clock that works in the browser, Node and the Worker runtime. */
export function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export async function timed<T>(fn: () => Promise<T> | T): Promise<{ value: T; ms: number }> {
  const start = now();
  const value = await fn();
  return { value, ms: now() - start };
}

/**
 * Service level objectives. These are budgets asserted by the performance
 * tests, not marketing numbers: a regression that crosses one fails CI.
 */
export const PERF_BUDGETS = {
  /** Pure in-process work (validation, guardrails, filter evaluation). */
  requestOverheadMs: 5,
  /** Analytics query over the in-memory marts. */
  analyticsQueryMs: 250,
  /** Warehouse aggregation across all marts. */
  warehouseAggregateMs: 750,
  /** Full ETL run over the synthetic dataset. */
  etlRunMs: 8_000,
  /** Server function round trip excluding the model call. */
  serverFnMs: 400,
  /** AI request ceiling — enforced as a hard timeout in src/ai/limits.ts. */
  aiRequestMs: 90_000,
} as const;

export type BudgetCheck = {
  label: string;
  budgetMs: number;
  observedMs: number;
  withinBudget: boolean;
};

export function checkBudget(label: string, observedMs: number, budgetMs: number): BudgetCheck {
  return { label, budgetMs, observedMs, withinBudget: observedMs <= budgetMs };
}

export function formatSummary(summary: LatencySummary): string {
  const f = (n: number) => `${n.toFixed(1)}ms`;
  return [
    summary.label.padEnd(28),
    `n=${summary.count}`.padEnd(10),
    `p50=${f(summary.p50)}`.padEnd(14),
    `p95=${f(summary.p95)}`.padEnd(14),
    `p99=${f(summary.p99)}`.padEnd(14),
    `max=${f(summary.max)}`.padEnd(14),
    `rps=${summary.throughput.toFixed(0)}`.padEnd(10),
    `err=${(summary.errorRate * 100).toFixed(2)}%`,
  ].join(" ");
}
