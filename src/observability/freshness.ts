/**
 * Sprint 14 — the single freshness service.
 *
 * Every consumer (BI dashboards, the operations console, alerts) derives
 * freshness from this module. Dashboards must not compute their own.
 */

import type { Freshness } from "@/analytics/types";
import type { EtlRunStatus, FreshnessStatus } from "./types";

export interface FreshnessThresholds {
  /** Below this age the data is fresh. */
  freshMs: number;
  /** Between fresh and stale the data is delayed. */
  staleMs: number;
}

export const DEFAULT_FRESHNESS_THRESHOLDS: FreshnessThresholds = {
  freshMs: 6 * 60 * 60 * 1000,
  staleMs: 24 * 60 * 60 * 1000,
};

export interface FreshnessReport {
  status: FreshnessStatus;
  /** Last successful warehouse load. */
  last_updated: string;
  /** Latest business date present in the warehouse. */
  data_through: string;
  age_ms: number;
  refresh_duration_ms: number;
  pipeline_status: EtlRunStatus;
  run_id: string;
  rows_quarantined: number;
  warehouse_rows: number;
  mart_status: "ok" | "degraded" | "failed";
}

export function classifyFreshness(
  ageMs: number,
  pipelineStatus: EtlRunStatus,
  thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS,
): FreshnessStatus {
  if (pipelineStatus === "FAILED") return "failed";
  if (ageMs >= thresholds.staleMs) return "stale";
  if (ageMs >= thresholds.freshMs || pipelineStatus === "PARTIAL") return "delayed";
  return "fresh";
}

export function buildFreshnessReport(input: {
  freshness: Freshness;
  pipelineStatus: EtlRunStatus;
  refreshDurationMs: number;
  now?: number;
  thresholds?: FreshnessThresholds;
}): FreshnessReport {
  const now = input.now ?? Date.now();
  const lastUpdated = Date.parse(input.freshness.last_updated);
  const ageMs = Number.isFinite(lastUpdated)
    ? Math.max(0, now - lastUpdated)
    : Number.MAX_SAFE_INTEGER;
  const status = classifyFreshness(ageMs, input.pipelineStatus, input.thresholds);

  return {
    status,
    last_updated: input.freshness.last_updated,
    data_through: input.freshness.data_through,
    age_ms: ageMs,
    refresh_duration_ms: input.refreshDurationMs,
    pipeline_status: input.pipelineStatus,
    run_id: input.freshness.run_id,
    rows_quarantined: input.freshness.rows_quarantined,
    warehouse_rows: input.freshness.warehouse_rows,
    mart_status:
      input.pipelineStatus === "FAILED" ? "failed" : status === "fresh" ? "ok" : "degraded",
  };
}

/** What a BI surface shows in its "data as of" strip. */
export interface BiFreshnessBadge {
  last_updated: string;
  data_through: string;
  pipeline_status: EtlRunStatus;
  freshness: FreshnessStatus;
  query_duration_ms: number;
}

export function biBadge(report: FreshnessReport, queryDurationMs: number): BiFreshnessBadge {
  return {
    last_updated: report.last_updated,
    data_through: report.data_through,
    pipeline_status: report.pipeline_status,
    freshness: report.status,
    query_duration_ms: Math.round(queryDurationMs),
  };
}
