/**
 * Sprint 12 — audit log writer (server only).
 *
 * Audit rows are written with the service-role client because the table grants
 * no INSERT to `authenticated`: users can never forge, edit or delete their own
 * history. Writing must never break the action being audited, so failures are
 * logged and swallowed.
 */

import { buildAuditEvent, type AuditEventInput } from "@/security/audit";

export async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  const row = buildAuditEvent(input);
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      action: row.action,
      category: row.category,
      severity: row.severity,
      outcome: row.outcome,
      actor_id: row.actor_id,
      actor_role: row.actor_role,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      company_id: row.company_id,
      request_id: row.request_id,
      ip_hash: row.ip_hash,
      user_agent: row.user_agent,
      metadata: row.metadata as Record<string, never>,
    });
    if (error) console.error("[audit] insert failed", error.message);
  } catch (error) {
    console.error("[audit] insert threw", error instanceof Error ? error.message : error);
  }
}

/** Convenience wrapper: audits the outcome of a guarded action. */
export async function auditOutcome<T>(
  input: AuditEventInput,
  action: () => Promise<T>,
): Promise<T> {
  try {
    const result = await action();
    await writeAuditEvent({ ...input, outcome: "success" });
    return result;
  } catch (error) {
    await writeAuditEvent({
      ...input,
      outcome: "failure",
      metadata: { ...input.metadata, failed: true },
    });
    throw error;
  }
}
