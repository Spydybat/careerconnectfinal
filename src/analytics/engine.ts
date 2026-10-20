/**
 * Aggregation engine — the only place numbers are produced.
 *
 * Pure functions over mart rows. Dashboards, the API and exports all call
 * through here, which is what guarantees a metric has one value everywhere.
 */

import { applyFilters, type ResolvedFilters } from "./filters";
import type { MartRow } from "./types";

export const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const round = (value: number, digits = 2): number =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;

export const sum = (rows: readonly MartRow[], key: string): number =>
  rows.reduce((total, row) => total + num(row[key]), 0);

export const count = (rows: readonly MartRow[]): number => rows.length;

export const avg = (rows: readonly MartRow[], key: string): number => {
  const values = rows.map((row) => num(row[key])).filter((v) => Number.isFinite(v));
  if (values.length === 0) return 0;
  return round(values.reduce((a, b) => a + b, 0) / values.length);
};

export const max = (rows: readonly MartRow[], key: string): number =>
  rows.reduce((best, row) => Math.max(best, num(row[key])), 0);

export const min = (rows: readonly MartRow[], key: string): number =>
  rows.length === 0 ? 0 : rows.reduce((best, row) => Math.min(best, num(row[key])), Infinity);

export function percentile(rows: readonly MartRow[], key: string, p: number): number {
  const values = rows
    .map((row) => num(row[key]))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.floor((values.length - 1) * p)));
  return round(values[index] ?? 0);
}

export const median = (rows: readonly MartRow[], key: string): number => percentile(rows, key, 0.5);

export const distinct = (rows: readonly MartRow[], key: string): number =>
  new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean)).size;

/** Safe ratio, always returned as a 0..1 fraction rounded to 4 places. */
export const ratio = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : round(numerator / denominator, 4);

export function groupBy(rows: readonly MartRow[], key: string): Map<string, MartRow[]> {
  const map = new Map<string, MartRow[]>();
  for (const row of rows) {
    const bucket = String(row[key] ?? "");
    const existing = map.get(bucket);
    if (existing) existing.push(row);
    else map.set(bucket, [row]);
  }
  return map;
}

export interface SeriesPoint extends Record<string, string | number> {
  bucket: string;
}

/**
 * Group rows by a dimension and evaluate one or more aggregations per bucket.
 * Used for every chart, so chart data and KPI data share the same code path.
 */
export function series(
  rows: readonly MartRow[],
  dimension: string,
  measures: Record<string, (group: MartRow[]) => number>,
  options: {
    sort?: "asc" | "desc" | "value";
    limit?: number;
    valueKey?: string;
    labelKey?: string;
  } = {},
): SeriesPoint[] {
  const grouped = groupBy(rows, dimension);
  let points: SeriesPoint[] = [...grouped.entries()]
    .filter(([bucket]) => bucket !== "")
    .map(([bucket, group]) => {
      const point: SeriesPoint = { bucket };
      if (options.labelKey) point["label"] = String(group[0]?.[options.labelKey] ?? bucket);
      for (const [name, fn] of Object.entries(measures)) point[name] = fn(group);
      return point;
    });

  const valueKey = options.valueKey ?? Object.keys(measures)[0] ?? "bucket";
  if (options.sort === "value") points.sort((a, b) => num(b[valueKey]) - num(a[valueKey]));
  else if (options.sort === "desc") points.sort((a, b) => b.bucket.localeCompare(a.bucket));
  else points.sort((a, b) => a.bucket.localeCompare(b.bucket));

  if (options.limit) points = points.slice(0, options.limit);
  return points;
}

/** Continuous monthly buckets between two dates, so trend charts have no gaps. */
export function monthRange(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
  let guard = 0;
  while (cursor <= end && guard < 240) {
    out.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    guard += 1;
  }
  return out;
}

export function monthlySeries(
  rows: readonly MartRow[],
  filters: ResolvedFilters,
  measures: Record<string, (group: MartRow[]) => number>,
): SeriesPoint[] {
  const grouped = groupBy(rows, "month");
  return monthRange(filters.dateFrom, filters.dateTo).map((month) => {
    const group = grouped.get(month) ?? [];
    const point: SeriesPoint = { bucket: month };
    for (const [name, fn] of Object.entries(measures)) point[name] = fn(group);
    return point;
  });
}

export const filtered = (rows: readonly MartRow[], filters: ResolvedFilters): MartRow[] =>
  applyFilters(rows, filters);

/** Deterministic server-side pagination for large tables. */
export function paginate<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): { rows: T[]; page: number; page_size: number; total_rows: number; total_pages: number } {
  const size = Math.max(1, Math.min(200, Math.floor(pageSize) || 25));
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * size;
  return {
    rows: rows.slice(start, start + size),
    page: current,
    page_size: size,
    total_rows: rows.length,
    total_pages: totalPages,
  };
}
