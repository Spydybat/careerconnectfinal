/**
 * Slowly Changing Dimension helpers.
 *
 * SCD Type 1 — overwrite in place (corrections).
 * SCD Type 2 — close the current row and insert a new version (history).
 */

export interface Scd2Columns {
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
  version: number;
}

export const SCD2_OPEN_END = null;

export type Scd2Row<T> = T & Scd2Columns & { surrogate_key: number };

export interface Scd2ApplyInput<T extends Record<string, unknown>> {
  existing: Scd2Row<T>[];
  incoming: readonly T[];
  businessKey: keyof T & string;
  /** Attributes whose change opens a new version. */
  trackedAttributes: readonly (keyof T & string)[];
  effectiveFrom: string;
  nextKey: () => number;
}

export interface Scd2ApplyResult<T extends Record<string, unknown>> {
  rows: Scd2Row<T>[];
  inserted: number;
  updated: number;
  unchanged: number;
}

function changed<T extends Record<string, unknown>>(
  current: T,
  incoming: T,
  attributes: readonly (keyof T & string)[],
): boolean {
  return attributes.some((attribute) => {
    const a = current[attribute];
    const b = incoming[attribute];
    return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
  });
}

/** SCD Type 1: replace tracked attributes on the current row. */
export function applyScd1<T extends Record<string, unknown>>(
  existing: readonly (T & { surrogate_key: number })[],
  incoming: readonly T[],
  businessKey: keyof T & string,
  nextKey: () => number,
): (T & { surrogate_key: number })[] {
  const byKey = new Map(existing.map((row) => [String(row[businessKey]), row]));
  for (const record of incoming) {
    const key = String(record[businessKey]);
    const current = byKey.get(key);
    byKey.set(key, { ...record, surrogate_key: current?.surrogate_key ?? nextKey() });
  }
  return [...byKey.values()];
}

/** SCD Type 2: version history with effective dating. */
export function applyScd2<T extends Record<string, unknown>>(
  input: Scd2ApplyInput<T>,
): Scd2ApplyResult<T> {
  const rows = [...input.existing];
  const currentByKey = new Map<string, Scd2Row<T>>();
  for (const row of rows) {
    if (row.is_current) currentByKey.set(String(row[input.businessKey]), row);
  }

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const record of input.incoming) {
    const key = String(record[input.businessKey]);
    const current = currentByKey.get(key);

    if (!current) {
      const row: Scd2Row<T> = {
        ...record,
        surrogate_key: input.nextKey(),
        effective_from: input.effectiveFrom,
        effective_to: SCD2_OPEN_END,
        is_current: true,
        version: 1,
      };
      rows.push(row);
      currentByKey.set(key, row);
      inserted++;
      continue;
    }

    if (!changed(current as unknown as T, record, input.trackedAttributes)) {
      unchanged++;
      continue;
    }

    current.effective_to = input.effectiveFrom;
    current.is_current = false;
    const row: Scd2Row<T> = {
      ...record,
      surrogate_key: input.nextKey(),
      effective_from: input.effectiveFrom,
      effective_to: SCD2_OPEN_END,
      is_current: true,
      version: current.version + 1,
    };
    rows.push(row);
    currentByKey.set(key, row);
    updated++;
  }

  return { rows, inserted, updated, unchanged };
}
