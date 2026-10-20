/**
 * Transform stage: clean -> normalize -> enrich -> dedupe.
 *
 * Every function is pure and returns both the output rows and a rejection
 * list so the pipeline can quarantine and reconcile.
 */

import { slugify } from "../random";

export type Row = Record<string, unknown>;

export interface TransformResult {
  records: Row[];
  rejected: { index: number; reason: string; record: Row }[];
}

const TRIM_COLLAPSE = /\s+/g;

/** CLEAN — trim strings, collapse whitespace, blank -> null, drop empty rows. */
export function clean(records: readonly Row[]): TransformResult {
  const out: Row[] = [];
  const rejected: TransformResult["rejected"] = [];

  records.forEach((record, index) => {
    if (record === null || typeof record !== "object") {
      rejected.push({ index, reason: "not_an_object", record: {} });
      return;
    }
    const next: Row = {};
    let populated = 0;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") {
        const trimmed = value.trim().replace(TRIM_COLLAPSE, " ");
        next[key] = trimmed === "" ? null : trimmed;
        if (trimmed !== "") populated++;
      } else if (typeof value === "number" && !Number.isFinite(value)) {
        next[key] = null;
      } else {
        next[key] = value;
        if (value !== null && value !== undefined) populated++;
      }
    }
    if (populated === 0) {
      rejected.push({ index, reason: "empty_record", record: next });
      return;
    }
    out.push(next);
  });

  return { records: out, rejected };
}

const CODE_FIELDS = new Set([
  "location_code",
  "category_code",
  "employment_code",
  "experience_code",
  "degree_code",
  "size_code",
  "college_code",
  "technology_code",
  "currency",
]);

const LOWER_FIELDS = new Set(["email", "status", "outcome", "offer_status", "source", "mode"]);

/** NORMALIZE — canonical casing for codes, lowercase emails/enums, ISO timestamps. */
export function normalize(records: readonly Row[]): TransformResult {
  const out = records.map((record) => {
    const next: Row = { ...record };
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== "string") continue;
      if (CODE_FIELDS.has(key)) next[key] = value.toUpperCase();
      else if (LOWER_FIELDS.has(key)) next[key] = value.toLowerCase();
      else if (key.endsWith("_at") || key.endsWith("_date") || key === "last_updated") {
        const parsed = Date.parse(value);
        next[key] = Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
      }
    }
    return next;
  });
  return { records: out, rejected: [] };
}

/** ENRICH — derived, analysis-friendly attributes added at the staging layer. */
export function enrich(dataset: string, records: readonly Row[]): TransformResult {
  const out = records.map((record) => {
    const next: Row = { ...record };
    const stamp = record["last_updated"];
    if (typeof stamp === "string" && stamp.length >= 10) {
      next["event_date"] = stamp.slice(0, 10);
      next["event_month"] = stamp.slice(0, 7);
      next["event_year"] = Number(stamp.slice(0, 4));
    }
    if (dataset === "jobs") {
      const min = Number(record["min_salary"]);
      const max = Number(record["max_salary"]);
      next["salary_midpoint"] =
        Number.isFinite(min) && Number.isFinite(max) ? (min + max) / 2 : null;
    }
    if (dataset === "students") {
      const skills = record["primary_skills"];
      next["skill_count"] = Array.isArray(skills) ? skills.length : 0;
    }
    if (dataset === "companies" && typeof record["company_name"] === "string") {
      next["company_slug"] = slugify(record["company_name"]);
    }
    if (dataset === "placements") {
      const ctc = Number(record["ctc_annual"]);
      next["ctc_band"] = !Number.isFinite(ctc)
        ? "unknown"
        : ctc >= 2_500_000
          ? "25L+"
          : ctc >= 1_500_000
            ? "15-25L"
            : ctc >= 800_000
              ? "8-15L"
              : "<8L";
    }
    return next;
  });
  return { records: out, rejected: [] };
}

/**
 * DEDUPE — keep the record with the highest watermark for each business key.
 * Ties resolve to the last occurrence, which keeps the operation deterministic.
 */
export function dedupe(records: readonly Row[], keyField: string): TransformResult {
  const winners = new Map<string, { index: number; record: Row; watermark: string }>();
  const rejected: TransformResult["rejected"] = [];

  records.forEach((record, index) => {
    const key = String(record[keyField] ?? `__missing_${index}`);
    const watermark = String(record["last_updated"] ?? "");
    const current = winners.get(key);
    if (!current) {
      winners.set(key, { index, record, watermark });
      return;
    }
    if (watermark >= current.watermark) {
      rejected.push({
        index: current.index,
        reason: "duplicate_superseded",
        record: current.record,
      });
      winners.set(key, { index, record, watermark });
    } else {
      rejected.push({ index, reason: "duplicate_superseded", record });
    }
  });

  const out = [...winners.values()].sort((a, b) => a.index - b.index).map((w) => w.record);
  return { records: out, rejected };
}

/** Business key per dataset, used by dedupe and warehouse loading. */
export function businessKeyOf(dataset: string): string {
  const explicit: Record<string, string> = {
    job_categories: "category_code",
    locations: "location_code",
    technologies: "technology_code",
    experience_levels: "experience_code",
    employment_types: "employment_code",
    student_certifications: "student_certification_id",
    learning_enrollments: "enrollment_id",
    hiring_trends: "trend_id",
  };
  const mapped = explicit[dataset];
  if (mapped) return mapped;
  return `${dataset.replace(/ies$/, "y").replace(/s$/, "")}_id`;
}
