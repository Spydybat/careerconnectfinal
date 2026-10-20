/**
 * Sprint 12 — browser-side audit helper.
 *
 * Domain mutations still run through RLS-scoped client queries; this helper
 * records the matching audit event on the server. Auditing must never break the
 * action that was just performed, so failures are logged and swallowed — the
 * server function itself re-verifies the actor and the entity's visibility.
 */

import { recordDomainEvent } from "@/lib/audit.functions";

type DomainAction =
  | "job.created"
  | "job.updated"
  | "job.closed"
  | "application.created"
  | "application.status_changed"
  | "interview.scheduled"
  | "interview.updated"
  | "offer.created"
  | "offer.updated"
  | "placement.recorded"
  | "placement.verified";

type DomainEntity = "job" | "application" | "interview" | "offer" | "placement";

export type AuditableMetadata = Record<string, string | number | boolean | null>;

export async function auditDomainEvent(input: {
  action: DomainAction;
  entityType: DomainEntity;
  entityId: string;
  metadata?: AuditableMetadata;
}): Promise<void> {
  try {
    await recordDomainEvent({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    });
  } catch (error) {
    console.warn("[audit] event not recorded", error instanceof Error ? error.message : error);
  }
}
