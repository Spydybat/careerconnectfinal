/**
 * Reusable data quality rule builders.
 *
 * Rules are pure and deterministic; they never touch I/O.
 */

import type { DataQualityRule, QualityDimension } from "./types";

type Row = Record<string, unknown>;

const DEFAULTS = { warnThreshold: 0, failThreshold: 0.02 };

function build<T extends Row>(
  rule: string,
  dimension: QualityDimension,
  description: string,
  predicate: (record: T, index: number) => boolean,
  thresholds?: { warnThreshold?: number; failThreshold?: number },
): DataQualityRule<T> {
  return {
    rule,
    dimension,
    description,
    predicate,
    warnThreshold: thresholds?.warnThreshold ?? DEFAULTS.warnThreshold,
    failThreshold: thresholds?.failThreshold ?? DEFAULTS.failThreshold,
  };
}

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "");

/** COMPLETENESS — the field must be present and non-blank. */
export function notNull<T extends Row>(dataset: string, field: string): DataQualityRule<T> {
  return build<T>(
    `${dataset}.${field}.not_null`,
    "completeness",
    `${field} must be present`,
    (record) => !isBlank(record[field]),
  );
}

/** VALIDITY — the value must match a pattern. */
export function matchesPattern<T extends Row>(
  dataset: string,
  field: string,
  pattern: RegExp,
): DataQualityRule<T> {
  return build<T>(
    `${dataset}.${field}.pattern`,
    "validity",
    `${field} must match ${pattern.source}`,
    (record) => typeof record[field] === "string" && pattern.test(record[field] as string),
  );
}

/** VALIDITY — numeric range check (inclusive). */
export function inRange<T extends Row>(
  dataset: string,
  field: string,
  min: number,
  max: number,
): DataQualityRule<T> {
  return build<T>(
    `${dataset}.${field}.range`,
    "validity",
    `${field} must be between ${min} and ${max}`,
    (record) => {
      const value = record[field];
      return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
    },
  );
}

/** VALIDITY — value must belong to an allowed set. */
export function inSet<T extends Row>(
  dataset: string,
  field: string,
  allowed: readonly string[],
): DataQualityRule<T> {
  const set = new Set(allowed);
  return build<T>(
    `${dataset}.${field}.allowed_values`,
    "validity",
    `${field} must be one of ${allowed.join(", ")}`,
    (record) => typeof record[field] === "string" && set.has(record[field] as string),
  );
}

/** VALIDITY — parseable ISO date/timestamp. */
export function isIsoDate<T extends Row>(dataset: string, field: string): DataQualityRule<T> {
  return build<T>(
    `${dataset}.${field}.iso_date`,
    "validity",
    `${field} must be an ISO date`,
    (record) => {
      const value = record[field];
      if (typeof value !== "string" || value.length < 10) return false;
      return !Number.isNaN(Date.parse(value));
    },
  );
}

/** UNIQUENESS — the key must be unique across the dataset. */
export function unique<T extends Row>(
  dataset: string,
  field: string,
  records: readonly T[],
): DataQualityRule<T> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = String(record[field]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return build<T>(
    `${dataset}.${field}.unique`,
    "uniqueness",
    `${field} must be unique`,
    (record) => (counts.get(String(record[field])) ?? 0) <= 1,
  );
}

/** CONSISTENCY — cross-field invariant inside one record. */
export function consistent<T extends Row>(
  dataset: string,
  name: string,
  description: string,
  predicate: (record: T) => boolean,
): DataQualityRule<T> {
  return build<T>(`${dataset}.${name}`, "consistency", description, (record) => predicate(record));
}

/** REFERENTIAL INTEGRITY — the foreign key must exist in the parent dataset. */
export function referencesKey<T extends Row>(
  dataset: string,
  field: string,
  parentDataset: string,
  parentKeys: Iterable<string>,
): DataQualityRule<T> {
  const keys = new Set(parentKeys);
  return build<T>(
    `${dataset}.${field}.fk_${parentDataset}`,
    "referential_integrity",
    `${field} must exist in ${parentDataset}`,
    (record) => keys.has(String(record[field])),
  );
}

/** BUSINESS RULE — arbitrary domain rule. */
export function businessRule<T extends Row>(
  dataset: string,
  name: string,
  description: string,
  predicate: (record: T, index: number) => boolean,
  thresholds?: { warnThreshold?: number; failThreshold?: number },
): DataQualityRule<T> {
  return build<T>(
    `${dataset}.${name}`,
    "business_rule",
    description,
    predicate,
    thresholds ?? { failThreshold: 0.05 },
  );
}
