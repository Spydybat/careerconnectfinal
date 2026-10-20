/**
 * Reconciliation: proves that nothing was silently lost between layers.
 */

export interface ReconciliationRow {
  dataset: string;
  batch_id: string;
  source_count: number;
  raw_count: number;
  staging_count: number;
  curated_count: number;
  quarantined_count: number;
  rejected_count: number;
  balanced: boolean;
  variance: number;
}

export function reconcile(input: {
  dataset: string;
  batch_id: string;
  source_count: number;
  raw_count: number;
  staging_count: number;
  curated_count: number;
  quarantined_count: number;
  rejected_count: number;
}): ReconciliationRow {
  const accounted = input.curated_count + input.quarantined_count + input.rejected_count;
  const variance = input.raw_count - accounted;
  return { ...input, balanced: variance === 0, variance };
}

export function reconciliationSummary(rows: readonly ReconciliationRow[]) {
  return {
    datasets: rows.length,
    balanced: rows.filter((r) => r.balanced).length,
    unbalanced: rows.filter((r) => !r.balanced).map((r) => r.dataset),
    raw_total: rows.reduce((sum, r) => sum + r.raw_count, 0),
    curated_total: rows.reduce((sum, r) => sum + r.curated_count, 0),
    quarantined_total: rows.reduce((sum, r) => sum + r.quarantined_count, 0),
  };
}
