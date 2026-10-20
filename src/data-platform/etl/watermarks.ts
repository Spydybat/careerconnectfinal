/**
 * Incremental load support: watermarks per dataset.
 *
 * A watermark is the highest `last_updated` value successfully curated for a
 * dataset. Extraction in incremental mode only emits records strictly newer
 * than the stored watermark.
 */

export interface Watermark {
  dataset: string;
  value: string;
  run_id: string;
  updated_at: string;
}

export interface WatermarkStore {
  get(dataset: string): Watermark | undefined;
  set(watermark: Watermark): void;
  all(): Watermark[];
  reset(): void;
}

export function createWatermarkStore(initial: readonly Watermark[] = []): WatermarkStore {
  const map = new Map<string, Watermark>(initial.map((w) => [w.dataset, w]));
  return {
    get: (dataset) => map.get(dataset),
    set: (watermark) => void map.set(watermark.dataset, watermark),
    all: () => [...map.values()].sort((a, b) => a.dataset.localeCompare(b.dataset)),
    reset: () => map.clear(),
  };
}

export function watermarkField(record: Record<string, unknown>): string | undefined {
  const value =
    record["last_updated"] ?? record["updated_at"] ?? record["created_at"] ?? record["posted_at"];
  return typeof value === "string" ? value : undefined;
}

export function maxWatermark(records: readonly Record<string, unknown>[]): string | undefined {
  let max: string | undefined;
  for (const record of records) {
    const value = watermarkField(record);
    if (value !== undefined && (max === undefined || value > max)) max = value;
  }
  return max;
}
