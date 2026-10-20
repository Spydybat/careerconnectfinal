/**
 * Data quality engine: executes rules against a batch and produces results.
 */

import type { DataQualityReport, DataQualityResult, DataQualityRule } from "./types";

const MAX_TRACKED_FAILURES = 200;

export interface QualityRunContext {
  dataset: string;
  batch_id: string;
  executed_at: string;
}

export function runRules<T extends Record<string, unknown>>(
  records: readonly T[],
  rules: readonly DataQualityRule<T>[],
  context: QualityRunContext,
): DataQualityReport {
  const results: DataQualityResult[] = [];
  const quarantine = new Set<number>();

  for (const rule of rules) {
    const failedIndexes: number[] = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record === undefined) continue;
      let ok: boolean;
      try {
        ok = rule.predicate(record, i);
      } catch {
        ok = false;
      }
      if (!ok) failedIndexes.push(i);
    }

    const checked = records.length;
    const failed = failedIndexes.length;
    const rate = checked === 0 ? 0 : failed / checked;
    const status = rate > rule.failThreshold ? "FAIL" : rate > rule.warnThreshold ? "WARN" : "PASS";

    if (status === "FAIL") for (const index of failedIndexes) quarantine.add(index);

    results.push({
      dataset: context.dataset,
      batch_id: context.batch_id,
      rule: rule.rule,
      dimension: rule.dimension,
      status,
      records_checked: checked,
      records_failed: failed,
      failure_rate: Number(rate.toFixed(6)),
      executed_at: context.executed_at,
      failed_indexes: failedIndexes.slice(0, MAX_TRACKED_FAILURES),
    });
  }

  return {
    dataset: context.dataset,
    batch_id: context.batch_id,
    results,
    passed: results.every((r) => r.status !== "FAIL"),
    quarantine_indexes: [...quarantine].sort((a, b) => a - b),
  };
}

export function summariseReports(reports: readonly DataQualityReport[]) {
  const results = reports.flatMap((r) => r.results);
  return {
    rules_executed: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    warned: results.filter((r) => r.status === "WARN").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    records_quarantined: reports.reduce((sum, r) => sum + r.quarantine_indexes.length, 0),
  };
}
