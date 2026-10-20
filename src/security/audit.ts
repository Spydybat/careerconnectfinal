/**
 * Sprint 12 — audit event model.
 *
 * The catalogue of audited actions is declared here so tests can assert that
 * every security-critical action has a record, and so metadata is scrubbed
 * before it is persisted. Nothing in this module touches the database.
 */

import { redactSecrets } from "./sanitize";
import type { Role } from "./policy";

export type AuditCategory =
  | "auth"
  | "access"
  | "user_management"
  | "job"
  | "application"
  | "interview"
  | "offer"
  | "placement"
  | "ai"
  | "security"
  | "admin";

export type AuditSeverity = "info" | "notice" | "warning" | "critical";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.login_failed"
  | "user.created"
  | "user.roles_changed"
  | "user.suspended"
  | "user.reinstated"
  | "user.deleted"
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
  | "placement.verified"
  | "admin.settings_changed"
  | "admin.audit_viewed"
  | "ai.request"
  | "ai.blocked"
  | "security.authorization_denied"
  | "security.rate_limited"
  | "security.invalid_input"
  | "security.file_rejected";

export const AUDIT_CATALOGUE: Record<
  AuditAction,
  { category: AuditCategory; severity: AuditSeverity }
> = {
  "auth.login": { category: "auth", severity: "info" },
  "auth.logout": { category: "auth", severity: "info" },
  "auth.login_failed": { category: "auth", severity: "warning" },
  "user.created": { category: "user_management", severity: "notice" },
  "user.roles_changed": { category: "user_management", severity: "critical" },
  "user.suspended": { category: "user_management", severity: "critical" },
  "user.reinstated": { category: "user_management", severity: "notice" },
  "user.deleted": { category: "user_management", severity: "critical" },
  "job.created": { category: "job", severity: "info" },
  "job.updated": { category: "job", severity: "info" },
  "job.closed": { category: "job", severity: "notice" },
  "application.created": { category: "application", severity: "info" },
  "application.status_changed": { category: "application", severity: "notice" },
  "interview.scheduled": { category: "interview", severity: "info" },
  "interview.updated": { category: "interview", severity: "info" },
  "offer.created": { category: "offer", severity: "notice" },
  "offer.updated": { category: "offer", severity: "notice" },
  "placement.recorded": { category: "placement", severity: "notice" },
  "placement.verified": { category: "placement", severity: "critical" },
  "admin.settings_changed": { category: "admin", severity: "critical" },
  "admin.audit_viewed": { category: "admin", severity: "info" },
  "ai.request": { category: "ai", severity: "info" },
  "ai.blocked": { category: "ai", severity: "warning" },
  "security.authorization_denied": { category: "security", severity: "warning" },
  "security.rate_limited": { category: "security", severity: "warning" },
  "security.invalid_input": { category: "security", severity: "info" },
  "security.file_rejected": { category: "security", severity: "warning" },
};

export const AUDIT_ACTIONS = Object.keys(AUDIT_CATALOGUE) as AuditAction[];

/** Keys that must never be persisted, whatever a caller passes. */
const FORBIDDEN_METADATA_KEYS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "apikey",
  "api_key",
  "secret",
  "service_role",
  "raw_text",
  "resume_text",
  "cover_note",
  "answer",
  "message",
];

export type AuditMetadata = Record<string, unknown>;

/**
 * Drops sensitive keys, redacts credential-shaped values and bounds the size of
 * the metadata blob. Audit records describe *what happened*, not the content.
 */
export function scrubMetadata(metadata: AuditMetadata | undefined): AuditMetadata {
  if (!metadata) return {};
  const out: AuditMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_METADATA_KEYS.some((k) => lower === k || lower.includes(k))) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string") {
      out[key] = redactSecrets(value).slice(0, 500);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value === undefined
    ) {
      out[key] = value ?? null;
    } else if (Array.isArray(value)) {
      out[key] = value.slice(0, 20).map((v) => (typeof v === "string" ? redactSecrets(v) : v));
    } else {
      out[key] = "[object]";
    }
  }
  return out;
}

export type AuditEventInput = {
  action: AuditAction;
  actorId?: string | null;
  actorRole?: Role | null;
  entityType?: string | null;
  entityId?: string | null;
  companyId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  outcome?: "success" | "failure" | "denied";
  metadata?: AuditMetadata;
};

export type AuditEventRow = {
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  outcome: "success" | "failure" | "denied";
  actor_id: string | null;
  actor_role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  company_id: string | null;
  request_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: AuditMetadata;
};

/** Non-reversible, non-cryptographic IP fingerprint — enough to spot bursts. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  let hash = 2166136261;
  for (let i = 0; i < ip.length; i += 1) {
    hash ^= ip.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ip_${(hash >>> 0).toString(36)}`;
}

export function buildAuditEvent(input: AuditEventInput): AuditEventRow {
  const catalogue = AUDIT_CATALOGUE[input.action];
  return {
    action: input.action,
    category: catalogue.category,
    severity: catalogue.severity,
    outcome: input.outcome ?? "success",
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    company_id: input.companyId ?? null,
    request_id: input.requestId ?? null,
    ip_hash: hashIp(input.ip),
    user_agent: input.userAgent ? input.userAgent.slice(0, 300) : null,
    metadata: scrubMetadata(input.metadata),
  };
}
