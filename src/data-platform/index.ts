/**
 * Data Platform public entry point.
 *
 * Usage:
 *   const result = buildPlatform(createConfig({ scale: 0.05 }));
 */

import { createConfig, type PlatformConfig } from "./config";
import { runPipeline, type PipelineResult } from "./etl/pipeline";
import { buildMarts, type MartTables } from "./marts";
import { buildDataDictionary, type DataDictionary } from "./dictionary";
import { buildWarehouse, type WarehouseTables } from "./warehouse/build";

export * from "./config";
export * from "./lake";
export * from "./etl";
export * from "./quality/types";
export * from "./quality/engine";
export * from "./quality/rules";
export * from "./quality/rulesets";
export * from "./warehouse";
export * from "./marts";
export * from "./dictionary";
export type { SyntheticDatasets, DatasetName } from "./generators/types";
export { generateDatasets } from "./generators";

export interface PlatformBuild {
  config: PlatformConfig;
  pipeline: PipelineResult;
  warehouse: WarehouseTables;
  marts: MartTables;
  dictionary: DataDictionary;
  counts: Record<string, number>;
}

export function buildPlatform(
  config: PlatformConfig = createConfig(),
  options: { mode?: "full" | "incremental"; runTimestamp?: string; echoLogs?: boolean } = {},
): PlatformBuild {
  const pipeline = runPipeline({
    config,
    mode: options.mode ?? "full",
    ...(options.runTimestamp ? { runTimestamp: options.runTimestamp } : {}),
    ...(options.echoLogs === undefined ? {} : { echoLogs: options.echoLogs }),
  });

  const { tables } = buildWarehouse({
    curated: pipeline.curated,
    effectiveFrom: pipeline.run.started_at,
  });
  const marts = buildMarts(tables);

  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(pipeline.curated))
    counts[`curated.${name}`] = rows.length;
  for (const [name, rows] of Object.entries(tables)) counts[`warehouse.${name}`] = rows.length;
  for (const [name, rows] of Object.entries(marts)) counts[`mart.${name}`] = rows.length;

  return { config, pipeline, warehouse: tables, marts, dictionary: buildDataDictionary(), counts };
}
