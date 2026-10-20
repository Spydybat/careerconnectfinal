/**
 * Deterministic path + batch identifier construction for the data lake.
 *
 * Layout:
 *   <layer>/<domain>/batch=<batch_id>/part-0001.json
 *
 * Layers: raw | staging | curated | quarantine | archive
 */

import type { Layer } from "../config";

export function makeBatchId(
  domain: string,
  runDate: string,
  sequence: number,
  schemaVersion: string,
): string {
  const day = runDate.slice(0, 10).replace(/-/g, "");
  return `${domain}_${schemaVersion}_${day}_${String(sequence).padStart(4, "0")}`;
}

export function makeSourceFile(domain: string, batchId: string): string {
  return `oltp_export/${domain}/${batchId}.json`;
}

export function makeObjectPath(layer: Layer, domain: string, batchId: string, part = 1): string {
  return `${layer}/${domain}/batch=${batchId}/part-${String(part).padStart(4, "0")}.json`;
}

export function parseObjectPath(
  path: string,
): { layer: string; domain: string; batchId: string; part: string } | undefined {
  const match = /^([^/]+)\/([^/]+)\/batch=([^/]+)\/(part-\d+)\.json$/.exec(path);
  if (!match) return undefined;
  const [, layer, domain, batchId, part] = match;
  if (!layer || !domain || !batchId || !part) return undefined;
  return { layer, domain, batchId, part };
}

export function relocate(path: string, targetLayer: Layer): string {
  const parsed = parseObjectPath(path);
  if (!parsed) throw new Error(`Not a lake object path: ${path}`);
  return `${targetLayer}/${parsed.domain}/batch=${parsed.batchId}/${parsed.part}.json`;
}
