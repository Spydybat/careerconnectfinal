/**
 * Data quality result model.
 *
 * One `DataQualityResult` is produced per rule, per dataset, per batch.
 */

export const QUALITY_DIMENSIONS = [
  "completeness",
  "validity",
  "uniqueness",
  "consistency",
  "referential_integrity",
  "business_rule",
] as const;

export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export type QualityStatus = "PASS" | "WARN" | "FAIL";

export interface DataQualityRule<T = Record<string, unknown>> {
  /** Stable rule identifier, e.g. `students.cgpa.range`. */
  rule: string;
  dimension: QualityDimension;
  description: string;
  /** Severity threshold: failure rate above this marks the rule FAIL. */
  failThreshold: number;
  /** Failure rate above this (but below failThreshold) marks the rule WARN. */
  warnThreshold: number;
  /** Returns true when the record satisfies the rule. */
  predicate: (record: T, index: number) => boolean;
}

export interface DataQualityResult {
  dataset: string;
  batch_id: string;
  rule: string;
  dimension: QualityDimension;
  status: QualityStatus;
  records_checked: number;
  records_failed: number;
  failure_rate: number;
  executed_at: string;
  /** Indexes of failing records (capped) — used to route rows to quarantine. */
  failed_indexes: number[];
}

export interface DataQualityReport {
  dataset: string;
  batch_id: string;
  results: DataQualityResult[];
  passed: boolean;
  /** Record indexes that failed at least one FAIL-severity rule. */
  quarantine_indexes: number[];
}
