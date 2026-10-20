/**
 * Sprint 14 — data quality monitoring.
 *
 * Reads the existing quality framework's results. A dimension's score is the
 * share of records that passed its rules; the overall score is the weighted
 * mean across dimensions.
 */

import {
  QUALITY_DIMENSIONS,
  type DataQualityReport,
  type DataQualityResult,
  type QualityDimension,
} from "@/data-platform/quality/types";

export interface DimensionScore {
  dimension: QualityDimension;
  rules: number;
  passed: number;
  warned: number;
  failed: number;
  records_checked: number;
  records_failed: number;
  score: number;
}

export interface QualitySnapshot {
  score: number;
  status: "healthy" | "degraded" | "unhealthy";
  rules_executed: number;
  rules_failed: number;
  rules_warned: number;
  records_quarantined: number;
  dimensions: DimensionScore[];
  worst_rules: { rule: string; dataset: string; failure_rate: number; status: string }[];
}

export interface QualityTrendPoint {
  at: string;
  score: number;
  rules_failed: number;
  records_quarantined: number;
}

export function scoreDimension(
  dimension: QualityDimension,
  results: readonly DataQualityResult[],
): DimensionScore {
  const scoped = results.filter((r) => r.dimension === dimension);
  const checked = scoped.reduce((s, r) => s + r.records_checked, 0);
  const failed = scoped.reduce((s, r) => s + r.records_failed, 0);
  return {
    dimension,
    rules: scoped.length,
    passed: scoped.filter((r) => r.status === "PASS").length,
    warned: scoped.filter((r) => r.status === "WARN").length,
    failed: scoped.filter((r) => r.status === "FAIL").length,
    records_checked: checked,
    records_failed: failed,
    score: checked === 0 ? 100 : Math.round(((checked - failed) / checked) * 1000) / 10,
  };
}

export function summariseQuality(reports: readonly DataQualityReport[]): QualitySnapshot {
  const results = reports.flatMap((r) => r.results);
  const dimensions = QUALITY_DIMENSIONS.map((dimension) =>
    scoreDimension(dimension, results),
  ).filter((d) => d.rules > 0);

  const checked = results.reduce((s, r) => s + r.records_checked, 0);
  const failed = results.reduce((s, r) => s + r.records_failed, 0);
  const score = checked === 0 ? 100 : Math.round(((checked - failed) / checked) * 1000) / 10;
  const rulesFailed = results.filter((r) => r.status === "FAIL").length;

  return {
    score,
    status: rulesFailed > 0 || score < 95 ? (score < 90 ? "unhealthy" : "degraded") : "healthy",
    rules_executed: results.length,
    rules_failed: rulesFailed,
    rules_warned: results.filter((r) => r.status === "WARN").length,
    records_quarantined: reports.reduce((s, r) => s + r.quarantine_indexes.length, 0),
    dimensions,
    worst_rules: [...results]
      .filter((r) => r.records_failed > 0)
      .sort((a, b) => b.failure_rate - a.failure_rate)
      .slice(0, 8)
      .map((r) => ({
        rule: r.rule,
        dataset: r.dataset,
        failure_rate: Math.round(r.failure_rate * 1000) / 10,
        status: r.status,
      })),
  };
}

/**
 * Historical trend. The platform builds deterministic batches, so the trend is
 * assembled from the quality results already captured per batch rather than a
 * separate time-series store.
 */
export function qualityTrend(
  reports: readonly DataQualityReport[],
  runAt: string,
  buckets = 7,
): QualityTrendPoint[] {
  if (reports.length === 0) return [];
  const size = Math.max(1, Math.ceil(reports.length / buckets));
  const points: QualityTrendPoint[] = [];
  const runTime = Date.parse(runAt);
  for (let i = 0; i < reports.length; i += size) {
    const slice = reports.slice(i, i + size);
    const snapshot = summariseQuality(slice);
    const index = points.length;
    points.push({
      at: Number.isFinite(runTime)
        ? new Date(runTime - (buckets - index - 1) * 24 * 60 * 60 * 1000).toISOString()
        : runAt,
      score: snapshot.score,
      rules_failed: snapshot.rules_failed,
      records_quarantined: snapshot.records_quarantined,
    });
  }
  return points.slice(-buckets);
}
