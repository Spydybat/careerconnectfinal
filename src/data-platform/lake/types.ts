/**
 * Data lake contracts.
 *
 * The lake is a logical, layered object store. Every write carries ingestion
 * metadata so any downstream layer can trace a record back to its batch.
 */

import type { Layer } from "../config";

export interface IngestionMetadata {
  /** Logical source system the data came from. */
  source: string;
  /** Logical file/object the batch was materialised from. */
  source_file: string;
  /** Deterministic identifier of one ingestion run for one dataset. */
  batch_id: string;
  /** ISO timestamp of ingestion (deterministic — derived from the run clock). */
  ingested_at: string;
  record_count: number;
  schema_version: string;
}

export interface LakeObject<T = unknown> {
  layer: Layer;
  domain: string;
  /** Full logical path, e.g. `raw/students/batch=.../part-0001.json`. */
  path: string;
  metadata: IngestionMetadata;
  records: T[];
}

export interface LakeWriteResult {
  path: string;
  record_count: number;
  batch_id: string;
}

/** Pluggable storage. In-memory for tests, filesystem for local runs. */
export interface LakeStore {
  write<T>(object: LakeObject<T>): LakeWriteResult;
  read<T>(path: string): LakeObject<T> | undefined;
  list(layer?: Layer, domain?: string): string[];
  /** Moves an object between layers (used by archive/quarantine flows). */
  move(path: string, targetLayer: Layer): string;
  clear(): void;
}
