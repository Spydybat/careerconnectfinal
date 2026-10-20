/**
 * Analytics API — the only way a dashboard reaches warehouse data.
 *
 * Authorization (domain access + row scope) is enforced here, server side.
 * Responses are aggregated payloads: warehouse rows never reach the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalyticsRole } from "@/analytics/authorization";
import type { AnalyticsDomain, DashboardResponse, MetricDefinition } from "@/analytics/types";
import type { ExportResult } from "@/analytics/export";

const domainSchema = z.enum([
  "executive",
  "placement",
  "recruiter",
  "skills",
  "salary",
  "jobs",
  "students",
  "learning",
]);

const filtersSchema = z
  .object({
    preset: z
      .enum([
        "last_30_days",
        "last_90_days",
        "last_6_months",
        "last_12_months",
        "ytd",
        "all_time",
        "custom",
      ])
      .optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional(),
    college: z.string().max(64).optional(),
    department: z.string().max(64).optional(),
    batch: z.coerce.number().int().min(1900).max(2100).optional(),
    company: z.string().max(64).optional(),
    industry: z.string().max(64).optional(),
    location: z.string().max(64).optional(),
    role: z.string().max(64).optional(),
    skill: z.string().max(64).optional(),
    technology: z.string().max(64).optional(),
    experience: z.string().max(64).optional(),
    employmentType: z.string().max(64).optional(),
  })
  .default({});

const querySchema = z.object({
  domain: domainSchema,
  filters: filtersSchema,
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(5).max(200).default(25),
});

const exportSchema = querySchema.extend({
  format: z.enum(["csv", "excel", "pdf"]),
});

export type AnalyticsQueryInput = z.infer<typeof querySchema>;

async function loadRoles(
  supabase: {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (c: string, v: string) => Promise<{ data: { role: string }[] | null }>;
      };
    };
  },
  userId: string,
): Promise<AnalyticsRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? [])
    .map((row) => row.role)
    .filter((role): role is AnalyticsRole =>
      ["student", "recruiter", "placement_officer", "executive", "admin"].includes(role),
    );
  return roles.length > 0 ? roles : ["student"];
}

async function buildDashboard(
  input: AnalyticsQueryInput,
  supabase: Parameters<typeof loadRoles>[0],
  userId: string,
): Promise<DashboardResponse> {
  const { getAnalyticsMart, resolvePrincipal } = await import("@/analytics/snapshot.server");
  const { runDashboardQuery } = await import("@/analytics/queries");

  const mart = getAnalyticsMart();
  const roles = await loadRoles(supabase, userId);
  const principal = resolvePrincipal(userId, roles, mart);

  return runDashboardQuery({
    domain: input.domain as AnalyticsDomain,
    mart,
    principal,
    filters: input.filters,
    options: { page: input.page, pageSize: input.pageSize },
  });
}

/** Domain dashboard query — typed, aggregated, authorized. */
export const analyticsDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => querySchema.parse(data))
  .handler(async ({ data, context }): Promise<DashboardResponse> =>
    buildDashboard(data, context.supabase as never, context.userId),
  );

/** Export the dashboard using the same governed payload the UI renders. */
export const analyticsExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => exportSchema.parse(data))
  .handler(async ({ data, context }): Promise<ExportResult> => {
    const { exportDashboard } = await import("@/analytics/export");
    const dashboard = await buildDashboard(data, context.supabase as never, context.userId);
    return exportDashboard(dashboard, data.format);
  });

export interface AnalyticsAccess {
  roles: AnalyticsRole[];
  domains: AnalyticsDomain[];
  metrics: MetricDefinition[];
}

/** Which dashboards may this caller open, plus the governed metric catalog. */
export const analyticsAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsAccess> => {
    const { allowedDomains } = await import("@/analytics/authorization");
    const { metricCatalog } = await import("@/analytics/metrics");
    const roles = await loadRoles(context.supabase as never, context.userId);
    return { roles, domains: allowedDomains(roles), metrics: metricCatalog() };
  });
