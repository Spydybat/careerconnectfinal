/**
 * Pipeline orchestration: extract -> raw -> staging -> quality -> curated,
 * with quarantine routing, archive, reconciliation and full run metadata.
 */

import { SCHEMA_VERSION, type PlatformConfig } from "../config";
import {
  createMemoryLakeStore,
  makeBatchId,
  makeObjectPath,
  makeSourceFile,
  type LakeStore,
} from "../lake";
import { runRules, summariseReports } from "../quality/engine";
import { rulesFor } from "../quality/rulesets";
import type { DataQualityReport } from "../quality/types";
import { extract, loadSourceSystem } from "./extract";
import { EtlError, withRetry } from "./errors";
import { createLogger, type PipelineLogger } from "./logger";
import { createRunTracker, makeRunId, type PipelineRun } from "./metadata";
import { reconcile, reconciliationSummary, type ReconciliationRow } from "./reconcile";
import { businessKeyOf, clean, dedupe, enrich, normalize, type Row } from "./transform";
import { createWatermarkStore, type WatermarkStore } from "./watermarks";
import type { DatasetName } from "../generators/types";

export interface PipelineOptions {
  config: PlatformConfig;
  mode?: "full" | "incremental";
  store?: LakeStore;
  watermarks?: WatermarkStore;
  /** Deterministic clock; defaults to a fixed run timestamp. */
  runTimestamp?: string;
  datasets?: readonly DatasetName[];
  echoLogs?: boolean;
  /** Archive raw batches once curated data is written. */
  archive?: boolean;
}

export interface PipelineResult {
  run: PipelineRun;
  store: LakeStore;
  watermarks: WatermarkStore;
  curated: Record<string, Row[]>;
  quality: DataQualityReport[];
  reconciliation: ReconciliationRow[];
  logs: ReturnType<PipelineLogger["entries"]>;
  summary: {
    quality: ReturnType<typeof summariseReports>;
    reconciliation: ReturnType<typeof reconciliationSummary>;
    duration_stages: number;
  };
}

const DEFAULT_RUN_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export function runPipeline(options: PipelineOptions): PipelineResult {
  const { config } = options;
  const mode = options.mode ?? "full";
  const runTimestamp = options.runTimestamp ?? DEFAULT_RUN_TIMESTAMP;
  const clock = () => runTimestamp;
  const store = options.store ?? createMemoryLakeStore();
  const watermarks = options.watermarks ?? createWatermarkStore();
  const runId = makeRunId(config.seed, runTimestamp, mode);
  const logger = createLogger({
    runId,
    clock,
    ...(options.echoLogs === undefined ? {} : { echo: options.echoLogs }),
  });
  const tracker = createRunTracker({
    runId,
    startedAt: runTimestamp,
    mode,
    seed: config.seed,
    scale: config.scale,
    schemaVersion: config.schemaVersion ?? SCHEMA_VERSION,
  });

  logger.log("info", "pipeline", `starting ${mode} run`, { context: { run_id: runId } });

  const source = loadSourceSystem(config);
  const batches = extract(config, {
    mode,
    watermarks,
    clock,
    ...(options.datasets ? { datasets: options.datasets } : {}),
  });

  // Parent key sets for referential integrity checks come from the full source
  // system, so incremental batches can still be validated against known parents.
  const keys: Record<string, Set<string>> = {};
  for (const [dataset, records] of Object.entries(source)) {
    const key = businessKeyOf(dataset);
    keys[dataset] = new Set((records as Row[]).map((record) => String(record[key] ?? "")));
  }

  const curated: Record<string, Row[]> = {};
  const reports: DataQualityReport[] = [];
  const reconciliation: ReconciliationRow[] = [];

  batches.forEach((batch, sequence) => {
    const dataset = batch.dataset;
    const batchId = makeBatchId(dataset, runTimestamp, sequence + 1, config.schemaVersion);
    const sourceFile = makeSourceFile(dataset, batchId);
    const metadata = {
      source: batch.source,
      source_file: sourceFile,
      batch_id: batchId,
      ingested_at: runTimestamp,
      record_count: batch.records.length,
      schema_version: config.schemaVersion,
    };

    try {
      // --- LOAD RAW (immutable, exactly as extracted) -----------------------
      const rawPath = makeObjectPath("raw", dataset, batchId);
      withRetry(() =>
        store.write({
          layer: "raw",
          domain: dataset,
          path: rawPath,
          metadata,
          records: batch.records,
        }),
      );
      tracker.stage({
        stage: "load_raw",
        dataset,
        records_in: batch.records.length,
        records_out: batch.records.length,
        records_rejected: 0,
        started_at: runTimestamp,
        finished_at: runTimestamp,
        status: "ok",
        error: undefined,
      });

      // --- STAGING (clean -> normalize -> enrich -> dedupe) -----------------
      const cleaned = clean(batch.records);
      const normalized = normalize(cleaned.records);
      const enriched = enrich(dataset, normalized.records);
      const deduped = dedupe(enriched.records, businessKeyOf(dataset));
      const rejected = [...cleaned.rejected, ...deduped.rejected];

      const stagingPath = makeObjectPath("staging", dataset, batchId);
      store.write({
        layer: "staging",
        domain: dataset,
        path: stagingPath,
        metadata: { ...metadata, record_count: deduped.records.length },
        records: deduped.records,
      });
      tracker.stage({
        stage: "dedupe",
        dataset,
        records_in: batch.records.length,
        records_out: deduped.records.length,
        records_rejected: rejected.length,
        started_at: runTimestamp,
        finished_at: runTimestamp,
        status: "ok",
        error: undefined,
      });

      // --- QUALITY ----------------------------------------------------------
      const report = runRules(deduped.records, rulesFor(dataset, deduped.records, { keys }), {
        dataset,
        batch_id: batchId,
        executed_at: runTimestamp,
      });
      reports.push(report);
      tracker.quality(report.results);

      const quarantineSet = new Set(report.quarantine_indexes);
      const goodRecords = deduped.records.filter((_, index) => !quarantineSet.has(index));
      const badRecords = deduped.records
        .filter((_, index) => quarantineSet.has(index))
        .map((record) => ({ ...record, _quarantine_batch: batchId }));

      if (badRecords.length > 0) {
        store.write({
          layer: "quarantine",
          domain: dataset,
          path: makeObjectPath("quarantine", dataset, batchId),
          metadata: { ...metadata, record_count: badRecords.length },
          records: badRecords,
        });
        logger.log("warn", "quality", `${badRecords.length} record(s) quarantined`, { dataset });
      }

      // --- CURATED ----------------------------------------------------------
      store.write({
        layer: "curated",
        domain: dataset,
        path: makeObjectPath("curated", dataset, batchId),
        metadata: { ...metadata, record_count: goodRecords.length },
        records: goodRecords,
      });
      curated[dataset] = goodRecords;

      tracker.stage({
        stage: "curate",
        dataset,
        records_in: deduped.records.length,
        records_out: goodRecords.length,
        records_rejected: badRecords.length,
        started_at: runTimestamp,
        finished_at: runTimestamp,
        status: "ok",
        error: undefined,
      });

      // --- METADATA + WATERMARK --------------------------------------------
      tracker.batch({
        batch_id: batchId,
        dataset,
        source: batch.source,
        source_file: sourceFile,
        schema_version: config.schemaVersion,
        ingested_at: runTimestamp,
        raw_count: batch.records.length,
        curated_count: goodRecords.length,
        quarantined_count: badRecords.length,
        watermark_from: batch.watermark_from,
        watermark_to: batch.watermark_to ?? runTimestamp,
      });

      if (batch.watermark_to) {
        watermarks.set({
          dataset,
          value: batch.watermark_to,
          run_id: runId,
          updated_at: runTimestamp,
        });
      }

      reconciliation.push(
        reconcile({
          dataset,
          batch_id: batchId,
          source_count: batch.source_total,
          raw_count: batch.records.length,
          staging_count: deduped.records.length,
          curated_count: goodRecords.length,
          quarantined_count: badRecords.length,
          rejected_count: rejected.length,
        }),
      );

      if (options.archive) store.move(rawPath, "archive");
    } catch (error) {
      const etlError =
        error instanceof EtlError
          ? error
          : new EtlError("curate", dataset, (error as Error).message, { cause: error });
      tracker.error(etlError.message);
      tracker.stage({
        stage: etlError.stage,
        dataset,
        records_in: batch.records.length,
        records_out: 0,
        records_rejected: batch.records.length,
        started_at: runTimestamp,
        finished_at: runTimestamp,
        status: "failed",
        error: etlError.message,
      });
      logger.log("error", etlError.stage, etlError.message, { dataset });
    }
  });

  const run = tracker.finish(runTimestamp);
  logger.log("info", "pipeline", `run ${run.status}`, {
    context: { datasets: batches.length, batches: run.batches.length },
  });

  return {
    run,
    store,
    watermarks,
    curated,
    quality: reports,
    reconciliation,
    logs: logger.entries(),
    summary: {
      quality: summariseReports(reports),
      reconciliation: reconciliationSummary(reconciliation),
      duration_stages: run.stages.length,
    },
  };
}
