/**
 * Pipeline run + batch metadata tracking (the platform's control plane).
 */

import type { DataQualityResult } from "../quality/types";
import type { EtlStage } from "./errors";

export type RunStatus = "running" | "succeeded" | "failed" | "partial";

export interface StageMetric {
  stage: EtlStage;
  dataset: string;
  records_in: number;
  records_out: number;
  records_rejected: number;
  started_at: string;
  finished_at: string;
  status: "ok" | "failed";
  error: string | undefined;
}

export interface BatchMetadata {
  batch_id: string;
  dataset: string;
  source: string;
  source_file: string;
  schema_version: string;
  ingested_at: string;
  raw_count: number;
  curated_count: number;
  quarantined_count: number;
  watermark_from: string | undefined;
  watermark_to: string;
}

export interface PipelineRun {
  run_id: string;
  started_at: string;
  finished_at: string | undefined;
  status: RunStatus;
  mode: "full" | "incremental";
  seed: number;
  scale: number;
  schema_version: string;
  batches: BatchMetadata[];
  stages: StageMetric[];
  quality: DataQualityResult[];
  errors: string[];
}

export interface RunTracker {
  run: PipelineRun;
  stage(metric: StageMetric): void;
  batch(metadata: BatchMetadata): void;
  quality(results: readonly DataQualityResult[]): void;
  error(message: string): void;
  finish(at: string): PipelineRun;
}

export function createRunTracker(init: {
  runId: string;
  startedAt: string;
  mode: "full" | "incremental";
  seed: number;
  scale: number;
  schemaVersion: string;
}): RunTracker {
  const run: PipelineRun = {
    run_id: init.runId,
    started_at: init.startedAt,
    finished_at: undefined,
    status: "running",
    mode: init.mode,
    seed: init.seed,
    scale: init.scale,
    schema_version: init.schemaVersion,
    batches: [],
    stages: [],
    quality: [],
    errors: [],
  };

  return {
    run,
    stage: (metric) => void run.stages.push(metric),
    batch: (metadata) => void run.batches.push(metadata),
    quality: (results) => void run.quality.push(...results),
    error: (message) => void run.errors.push(message),
    finish(at) {
      run.finished_at = at;
      const hasFailure = run.errors.length > 0 || run.stages.some((s) => s.status === "failed");
      const hasQualityFailure = run.quality.some((q) => q.status === "FAIL");
      run.status = hasFailure ? "failed" : hasQualityFailure ? "partial" : "succeeded";
      return run;
    },
  };
}

/** Deterministic run identifier so repeated runs are comparable. */
export function makeRunId(seed: number, runDate: string, mode: string): string {
  return `run_${runDate.slice(0, 10).replace(/-/g, "")}_${mode}_${seed}`;
}
