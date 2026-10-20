/**
 * Sprint 14 — the single build of the batch platform, shared by BI and by the
 * operations console.
 *
 * Both consumers previously needed pipeline metadata; building it twice would
 * produce two different "last updated" values. This module owns the build, its
 * timing, and the freshness report derived from it.
 */

import { buildPlatform, type PlatformBuild } from "@/data-platform";
import { createConfig } from "@/data-platform/config";
import { summariseEtlRun, type EtlRunSummary } from "./etl";
import {
  summariseQuality,
  qualityTrend,
  type QualitySnapshot,
  type QualityTrendPoint,
} from "./quality";
import { buildFreshnessReport, type FreshnessReport } from "./freshness";
import { logger } from "./logger";

export interface PlatformSnapshot {
  build: PlatformBuild;
  builtAt: number;
  buildDurationMs: number;
  etl: EtlRunSummary;
  quality: QualitySnapshot;
  qualityTrend: QualityTrendPoint[];
  warehouseRows: number;
  dataThrough: string;
}

let cached: PlatformSnapshot | null = null;
const TTL_MS = 15 * 60 * 1000;

function latestBusinessDate(build: PlatformBuild): string {
  let latest = build.pipeline.run.started_at;
  for (const batch of build.pipeline.run.batches) {
    if (batch.watermark_to > latest) latest = batch.watermark_to;
  }
  return latest;
}

export function getPlatformSnapshot(
  options: { scale?: number; force?: boolean } = {},
): PlatformSnapshot {
  const now = Date.now();
  if (!options.force && cached && now - cached.builtAt < TTL_MS) return cached;

  const scale = options.scale ?? Number(process.env["ANALYTICS_SCALE"] ?? 0.02);
  const started = Date.now();
  const build = buildPlatform(createConfig({ scale }));
  const buildDurationMs = Date.now() - started;

  const etl = summariseEtlRun(build.pipeline.run, build.pipeline.quality);
  const quality = summariseQuality(build.pipeline.quality);
  const warehouseRows = Object.values(build.warehouse).reduce((sum, rows) => sum + rows.length, 0);

  logger.info("platform snapshot built", {
    event: "platform.build",
    duration_ms: buildDurationMs,
    status: etl.status,
    run_id: etl.run_id,
    warehouse_rows: warehouseRows,
    quality_score: quality.score,
  });

  cached = {
    build,
    builtAt: now,
    buildDurationMs,
    etl,
    quality,
    qualityTrend: qualityTrend(
      build.pipeline.quality,
      build.pipeline.run.finished_at ?? build.pipeline.run.started_at,
    ),
    warehouseRows,
    dataThrough: latestBusinessDate(build),
  };
  return cached;
}

export function resetPlatformSnapshot(): void {
  cached = null;
}

/** Shared freshness for BI, alerts and the operations console. */
export function getFreshnessReport(now: number = Date.now()): FreshnessReport {
  const snapshot = getPlatformSnapshot();
  return buildFreshnessReport({
    freshness: {
      last_updated:
        snapshot.build.pipeline.run.finished_at ?? snapshot.build.pipeline.run.started_at,
      data_through: snapshot.dataThrough,
      pipeline_status:
        snapshot.etl.status === "FAILED"
          ? "failed"
          : snapshot.etl.status === "PARTIAL"
            ? "degraded"
            : "healthy",
      run_id: snapshot.etl.run_id,
      refresh_mode: "batch",
      rows_quarantined: snapshot.etl.quarantined_records,
      warehouse_rows: snapshot.warehouseRows,
    },
    pipelineStatus: snapshot.etl.status,
    refreshDurationMs: snapshot.buildDurationMs,
    now,
  });
}
