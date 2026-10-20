/**
 * Composable analytics filters.
 *
 * A filter set is resolved once (presets -> concrete date bounds, scope
 * overrides applied) and then evaluated against any mart row, because every
 * mart row carries the same conformed dimensions.
 */

import type { ConformedDims, FilterFieldSpec, MartRow } from "./types";

export type DateRangePreset =
  | "last_30_days"
  | "last_90_days"
  | "last_6_months"
  | "last_12_months"
  | "ytd"
  | "all_time"
  | "custom";

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_12_months", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export interface AnalyticsFilters {
  preset?: DateRangePreset | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  year?: number | undefined;
  quarter?: number | undefined;
  month?: string | undefined;
  college?: string | undefined;
  department?: string | undefined;
  batch?: number | undefined;
  company?: string | undefined;
  industry?: string | undefined;
  location?: string | undefined;
  role?: string | undefined;
  skill?: string | undefined;
  technology?: string | undefined;
  experience?: string | undefined;
  employmentType?: string | undefined;
  student?: string | undefined;
  recruiter?: string | undefined;
}

export interface ResolvedFilters extends AnalyticsFilters {
  preset: DateRangePreset;
  dateFrom: string;
  dateTo: string;
}

const ALL_TIME_START = "1970-01-01";

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const addMonths = (iso: string, months: number): string => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
};

/**
 * Resolve a preset into concrete bounds.
 *
 * `anchor` is the warehouse "data through" date, NOT wall-clock today: the
 * warehouse is batch loaded, so relative ranges must be relative to the data.
 */
export function resolveDateRange(
  filters: AnalyticsFilters,
  anchor: string,
): { preset: DateRangePreset; dateFrom: string; dateTo: string } {
  const preset: DateRangePreset =
    filters.preset ?? (filters.dateFrom || filters.dateTo ? "custom" : "last_12_months");

  if (preset === "custom") {
    return {
      preset,
      dateFrom: filters.dateFrom ?? ALL_TIME_START,
      dateTo: filters.dateTo ?? anchor,
    };
  }
  if (preset === "all_time") return { preset, dateFrom: ALL_TIME_START, dateTo: anchor };
  if (preset === "ytd") return { preset, dateFrom: `${anchor.slice(0, 4)}-01-01`, dateTo: anchor };
  if (preset === "last_30_days") return { preset, dateFrom: addDays(anchor, -29), dateTo: anchor };
  if (preset === "last_90_days") return { preset, dateFrom: addDays(anchor, -89), dateTo: anchor };
  if (preset === "last_6_months")
    return { preset, dateFrom: addMonths(anchor, -6), dateTo: anchor };
  return { preset, dateFrom: addMonths(anchor, -12), dateTo: anchor };
}

export function resolveFilters(
  filters: AnalyticsFilters,
  anchor: string,
  forced: Partial<AnalyticsFilters> = {},
): ResolvedFilters {
  const merged: AnalyticsFilters = { ...filters, ...stripUndefined(forced) };
  const range = resolveDateRange(merged, anchor);
  return { ...merged, ...range };
}

function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** Mapping of filter key -> conformed dimension key. */
export const FILTER_DIMENSION: Record<string, keyof ConformedDims> = {
  college: "college_id",
  department: "department",
  batch: "batch",
  company: "company_id",
  industry: "industry",
  location: "location_code",
  role: "category_code",
  experience: "experience_code",
  employmentType: "employment_code",
  student: "student_id",
  recruiter: "recruiter_id",
  skill: "skill_id",
  technology: "technology_code",
  year: "year",
  quarter: "quarter",
  month: "month",
};

/**
 * Predicate for a single mart row.
 *
 * Rows that do not carry a dimension at all (e.g. a learning fact has no
 * industry) are NOT filtered out by that dimension — a missing dimension is
 * treated as "not applicable" rather than "no match", which keeps composed
 * filters from silently zeroing unrelated metrics.
 */
export function matchesFilters(row: MartRow, filters: ResolvedFilters): boolean {
  const date = String(row.date ?? "");
  if (date) {
    if (date < filters.dateFrom || date > filters.dateTo) return false;
  }

  for (const [filterKey, dimension] of Object.entries(FILTER_DIMENSION)) {
    const wanted = (filters as unknown as Record<string, unknown>)[filterKey];
    if (wanted === undefined || wanted === null || wanted === "" || wanted === "all") continue;
    const actual = row[dimension];
    if (actual === undefined || actual === null || actual === "") continue;
    if (dimension === "quarter") {
      // stored as YYYY-Qn, filter arrives as 1..4
      if (!String(actual).endsWith(`Q${String(wanted)}`)) return false;
      continue;
    }
    if (String(actual) !== String(wanted)) return false;
  }
  return true;
}

export function applyFilters<T extends MartRow>(rows: readonly T[], filters: ResolvedFilters): T[] {
  return rows.filter((row) => matchesFilters(row, filters));
}

/** Filter controls offered per domain — composable subsets of one registry. */
export function filterFields(
  keys: readonly string[],
  options: Record<string, { value: string; label: string }[]>,
): FilterFieldSpec[] {
  const base: Record<string, FilterFieldSpec> = {
    preset: {
      key: "preset",
      label: "Date range",
      type: "select",
      options: DATE_RANGE_PRESETS.map((p) => ({ value: p.value, label: p.label })),
    },
    dateFrom: { key: "dateFrom", label: "From", type: "date" },
    dateTo: { key: "dateTo", label: "To", type: "date" },
    year: { key: "year", label: "Year", type: "select", options: options["year"] ?? [] },
    quarter: {
      key: "quarter",
      label: "Quarter",
      type: "select",
      options: [1, 2, 3, 4].map((q) => ({ value: String(q), label: `Q${q}` })),
    },
    month: { key: "month", label: "Month", type: "select", options: options["month"] ?? [] },
    college: {
      key: "college",
      label: "College",
      type: "select",
      options: options["college"] ?? [],
    },
    department: {
      key: "department",
      label: "Department",
      type: "select",
      options: options["department"] ?? [],
    },
    batch: { key: "batch", label: "Batch", type: "select", options: options["batch"] ?? [] },
    company: {
      key: "company",
      label: "Company",
      type: "select",
      options: options["company"] ?? [],
    },
    industry: {
      key: "industry",
      label: "Industry",
      type: "select",
      options: options["industry"] ?? [],
    },
    location: {
      key: "location",
      label: "Location",
      type: "select",
      options: options["location"] ?? [],
    },
    role: { key: "role", label: "Job role", type: "select", options: options["role"] ?? [] },
    skill: { key: "skill", label: "Skill", type: "select", options: options["skill"] ?? [] },
    technology: {
      key: "technology",
      label: "Technology",
      type: "select",
      options: options["technology"] ?? [],
    },
    experience: {
      key: "experience",
      label: "Experience level",
      type: "select",
      options: options["experience"] ?? [],
    },
    employmentType: {
      key: "employmentType",
      label: "Employment type",
      type: "select",
      options: options["employmentType"] ?? [],
    },
  };
  return keys.map((key) => base[key]).filter((f): f is FilterFieldSpec => Boolean(f));
}
