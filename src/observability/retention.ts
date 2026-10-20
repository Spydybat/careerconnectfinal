/**
 * Sprint 14 — retention policy register.
 *
 * Declarative only. Nothing here deletes data; audit records in particular are
 * never expired automatically (see docs/operations/retention.md).
 */

export interface RetentionPolicy {
  dataset: string;
  store: string;
  retention_days: number | "indefinite";
  /** Whether an automated job may delete expired rows. */
  auto_purge: boolean;
  rationale: string;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataset: "Application logs",
    store: "platform log stream (stdout)",
    retention_days: 30,
    auto_purge: true,
    rationale: "Operational debugging window; contains no personal content by design.",
  },
  {
    dataset: "Audit logs",
    store: "audit_logs",
    retention_days: "indefinite",
    auto_purge: false,
    rationale:
      "Compliance evidence for placement and admin actions. Deletion requires an explicit, approved policy.",
  },
  {
    dataset: "AI usage records",
    store: "ai_usage_logs",
    retention_days: 400,
    auto_purge: false,
    rationale:
      "Cost and reliability reporting across two placement cycles. No prompt content stored.",
  },
  {
    dataset: "ETL run metadata",
    store: "pipeline control plane (batch artefacts)",
    retention_days: 180,
    auto_purge: true,
    rationale: "Enough history to investigate reconciliation and watermark regressions.",
  },
  {
    dataset: "Data quality results",
    store: "pipeline control plane (batch artefacts)",
    retention_days: 180,
    auto_purge: true,
    rationale: "Supports quality trend reporting; regenerated on every deterministic rebuild.",
  },
];

export function policyFor(dataset: string): RetentionPolicy | undefined {
  return RETENTION_POLICIES.find((p) => p.dataset.toLowerCase() === dataset.toLowerCase());
}
