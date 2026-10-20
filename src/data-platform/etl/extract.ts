/**
 * Extract stage.
 *
 * The source system is the synthetic OLTP export produced by the generators.
 * Extraction is pull-based, batched, and supports incremental watermarks.
 */

import type { PlatformConfig } from "../config";
import { generateDatasets } from "../generators";
import type { DatasetName, SyntheticDatasets } from "../generators/types";
import { watermarkField, type WatermarkStore } from "./watermarks";

export interface ExtractedBatch {
  dataset: DatasetName;
  records: Record<string, unknown>[];
  source: string;
  extracted_at: string;
  watermark_from: string | undefined;
  watermark_to: string | undefined;
  source_total: number;
}

export interface ExtractOptions {
  mode: "full" | "incremental";
  watermarks: WatermarkStore;
  clock: () => string;
  datasets?: readonly DatasetName[];
}

let cache: { seed: number; scale: number; data: SyntheticDatasets } | undefined;

/** Memoised so repeated pipeline runs in one process stay fast and identical. */
export function loadSourceSystem(config: PlatformConfig): SyntheticDatasets {
  if (cache && cache.seed === config.seed && cache.scale === config.scale) return cache.data;
  const data = generateDatasets(config);
  cache = { seed: config.seed, scale: config.scale, data };
  return data;
}

export function extract(config: PlatformConfig, options: ExtractOptions): ExtractedBatch[] {
  const source = loadSourceSystem(config);
  const names = (options.datasets ?? (Object.keys(source) as DatasetName[])) as DatasetName[];

  return names.map((dataset) => {
    const all = source[dataset] as unknown as Record<string, unknown>[];
    const previous = options.watermarks.get(dataset)?.value;
    const useIncremental = options.mode === "incremental" && previous !== undefined;

    const records = useIncremental
      ? all.filter((record) => {
          const value = watermarkField(record);
          return value !== undefined && value > previous;
        })
      : [...all];

    let high: string | undefined;
    for (const record of records) {
      const value = watermarkField(record);
      if (value !== undefined && (high === undefined || value > high)) high = value;
    }

    return {
      dataset,
      records,
      source: "career_connect_oltp_export",
      extracted_at: options.clock(),
      watermark_from: useIncremental ? previous : undefined,
      watermark_to: high,
      source_total: all.length,
    };
  });
}
