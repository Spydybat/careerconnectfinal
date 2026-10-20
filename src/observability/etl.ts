/**
 * Sprint 14 — ETL run observability.
 *
 * Derived from the existing pipeline control plane (PipelineRun + quality
 * reports). No second pipeline, no second quality engine — this module only
 * projects what the platform already records into an operational shape.
 */

import type { PipelineRun } from "@/data-platform/etl/metadata";
import type { DataQualityReport } from "@/data-platform/quality/types";
import type { EtlRunStatus } from "./types";

export interface EtlDatasetRun {
  dataset: string;
  batch_id: string;
  input_records: number;
  processed_records: number;
  rejected_records: number;
  quarantined_records: number;
  watermark: string;
}

export interface EtlRunSummary {
  pipeline: string;
  run_id: string;
  batch_id: string;
  mode: "full" | "incremental";
  started_at: string;
  ended_at: string | null;
  duration_ms: number;
  status: EtlRunStatus;
  input_records: number;
  processed_records: number;
  rejected_records: number;
  quarantined_records: number;
  error_count: number;
  watermark: string | null;
  datasets: EtlDatasetRun[];
}

export function mapRunStatus(run: PipelineRun): EtlRunStatus {
  if (!run.finished_at) return "RUNNING";
  if (run.status === "failed") return "FAILED";
  if (run.status === "partial") return "PARTIAL";
  return "SUCCESS";
}

export function summariseEtlRun(
  run: PipelineRun,
  reports: readonly DataQualityReport[] = [],
): EtlRunSummary {
  const quarantineByBatch = new Map<string, number>();
  for (const report of reports) {
    quarantineByBatch.set(
      report.batch_id,
      (quarantineByBatch.get(report.batch_id) ?? 0) + report.quarantine_indexes.length,
    );
  }

  const datasets: EtlDatasetRun[] = run.batches.map((batch) => ({
    dataset: batch.dataset,
    batch_id: batch.batch_id,
    input_records: batch.raw_count,
    processed_records: batch.curated_count,
    rejected_records: Math.max(0, batch.raw_count - batch.curated_count - batch.quarantined_count),
    quarantined_records: batch.quarantined_count || (quarantineByBatch.get(batch.batch_id) ?? 0),
    watermark: batch.watermark_to,
  }));

  const started = Date.parse(run.started_at);
  const ended = run.finished_at ? Date.parse(run.finished_at) : Number.NaN;
  const stageRejects = run.stages.reduce((sum, stage) => sum + stage.records_rejected, 0);

  return {
    pipeline: "career-connect-batch",
    run_id: run.run_id,
    batch_id: run.batches.at(-1)?.batch_id ?? run.run_id,
    mode: run.mode,
    started_at: run.started_at,
    ended_at: run.finished_at ?? null,
    duration_ms:
      Number.isFinite(ended) && Number.isFinite(started) ? Math.max(0, ended - started) : 0,
    status: mapRunStatus(run),
    input_records: datasets.reduce((s, d) => s + d.input_records, 0),
    processed_records: datasets.reduce((s, d) => s + d.processed_records, 0),
    rejected_records: Math.max(
      stageRejects,
      datasets.reduce((s, d) => s + d.rejected_records, 0),
    ),
    quarantined_records: datasets.reduce((s, d) => s + d.quarantined_records, 0),
    error_count: run.errors.length + run.stages.filter((s) => s.status === "failed").length,
    watermark: datasets.at(-1)?.watermark ?? null,
    datasets,
  };
}
