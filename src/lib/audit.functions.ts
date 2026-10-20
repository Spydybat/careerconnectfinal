/**
 * Sprint 12 — audit log server functions.
 *
 * Reads are admin-only and always paginated. Writes are limited to the small
 * set of events the browser is the only witness of (sign-in / sign-out); every
 * other audited action is written by the server function that performs it.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  AUDIT_ACTIONS,
  type AuditAction,
  type AuditCategory,
  type AuditSeverity,
} from "@/security/audit";
import { paginationSchema, searchSchema, toRange, uuidSchema } from "@/security/validation";

export type AuditRow = {
  id: string;
  occurredAt: string;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  outcome: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

export type AuditPage = { rows: AuditRow[]; total: number; page: number; pageSize: number };

const listSchema = z
  .object({
    pagination: paginationSchema.default({ page: 1, pageSize: 25 }),
    category: z
      .enum([
        "auth",
        "access",
        "user_management",
        "job",
        "application",
        "interview",
        "offer",
        "placement",
        "ai",
        "security",
        "admin",
      ])
      .optional(),
    severity: z.enum(["info", "notice", "warning", "critical"]).optional(),
    actorId: uuidSchema.optional(),
    search: searchSchema.optional(),
  })
  .strict();

export const listAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AuditPage> => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);

    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("read", context.userId, "audit");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { from, to } = toRange(data.pagination);

    let query = supabaseAdmin
      .from("audit_logs")
      .select(
        "id, occurred_at, action, category, severity, outcome, actor_id, actor_role, entity_type, entity_id, request_id, metadata",
        { count: "exact" },
      )
      .order("occurred_at", { ascending: false })
      .range(from, to);

    if (data.category) query = query.eq("category", data.category);
    if (data.severity) query = query.eq("severity", data.severity);
    if (data.actorId) query = query.eq("actor_id", data.actorId);
    // Bound, parameterised match — never string-concatenated SQL.
    if (data.search) query = query.ilike("action", `%${data.search.replace(/[%_,]/g, "")}%`);

    const { data: rows, count, error } = await query;
    if (error) throw new Error("Unable to load audit events");

    const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
    const names = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", actorIds);
      for (const p of profiles ?? []) names.set(p.id, p.full_name || p.email || "—");
    }

    return {
      rows: (rows ?? []).map((r) => ({
        id: r.id,
        occurredAt: r.occurred_at,
        action: r.action as AuditAction,
        category: r.category as AuditCategory,
        severity: r.severity as AuditSeverity,
        outcome: r.outcome,
        actorId: r.actor_id,
        actorRole: r.actor_role,
        actorName: r.actor_id ? (names.get(r.actor_id) ?? "—") : "System",
        entityType: r.entity_type,
        entityId: r.entity_id,
        requestId: r.request_id,
        metadata: (r.metadata ?? {}) as Record<string, string | number | boolean | null>,
      })),
      total: count ?? 0,
      page: data.pagination.page,
      pageSize: data.pagination.pageSize,
    };
  });

const CLIENT_AUDITABLE = ["auth.login", "auth.logout"] as const satisfies readonly AuditAction[];

/**
 * The only audit action a browser may request. The actor is taken from the
 * verified session, never from the payload.
 */
export const recordAuthEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ action: z.enum(CLIENT_AUDITABLE) })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("auth", context.userId, "audit-auth");

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const { primaryRole } = await import("@/security/policy");
    const { writeAuditEvent } = await import("@/lib/audit.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    await writeAuditEvent({
      action: data.action,
      actorId: context.userId,
      actorRole: primaryRole((roles ?? []).map((r) => r.role)),
      entityType: "session",
      entityId: context.userId,
      requestId: getRequestHeader("x-request-id") ?? null,
      ip: getRequestHeader("x-forwarded-for") ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Domain events                                                       */
/* ------------------------------------------------------------------ */

const DOMAIN_ACTIONS = [
  "job.created",
  "job.updated",
  "job.closed",
  "application.created",
  "application.status_changed",
  "interview.scheduled",
  "interview.updated",
  "offer.created",
  "offer.updated",
  "placement.recorded",
  "placement.verified",
] as const satisfies readonly AuditAction[];

/** Entity type -> table. Existence is checked through the caller's RLS client. */
const ENTITY_TABLES = {
  job: "jobs",
  application: "applications",
  interview: "interviews",
  offer: "offers",
  placement: "placements",
} as const;

const domainEventSchema = z
  .object({
    action: z.enum(DOMAIN_ACTIONS),
    entityType: z.enum(["job", "application", "interview", "offer", "placement"]),
    entityId: uuidSchema,
    metadata: z
      .record(z.string().max(60), z.union([z.string().max(300), z.number(), z.boolean(), z.null()]))
      .optional(),
  })
  .strict();

/**
 * Records a domain event for an entity the caller can actually see.
 *
 * The actor and role come from the verified session; the entity is re-read with
 * the caller's RLS-scoped client, so a student cannot log events against
 * another company's jobs or another student's applications. The row itself is
 * written with the service-role client, so nobody can edit their own trail.
 */
export const recordDomainEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => domainEventSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("write", context.userId, "audit-domain");

    const table = ENTITY_TABLES[data.entityType];
    const { data: entity, error } = await context.supabase
      .from(table)
      .select("id")
      .eq("id", data.entityId)
      .maybeSingle();
    if (error || !entity) {
      throw new Error("Forbidden: that record is not visible to you");
    }

    const [{ data: roles }, { primaryRole }, { writeAuditEvent }, { getRequestHeader }] =
      await Promise.all([
        context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
        import("@/security/policy"),
        import("@/lib/audit.server"),
        import("@tanstack/react-start/server"),
      ]);

    await writeAuditEvent({
      action: data.action,
      actorId: context.userId,
      actorRole: primaryRole((roles ?? []).map((r) => r.role)),
      entityType: data.entityType,
      entityId: data.entityId,
      requestId: getRequestHeader("x-request-id") ?? null,
      ip: getRequestHeader("x-forwarded-for") ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      ...(data.metadata ? { metadata: data.metadata } : {}),
    });
    return { ok: true };
  });

export const AUDIT_ACTION_LIST = AUDIT_ACTIONS;
