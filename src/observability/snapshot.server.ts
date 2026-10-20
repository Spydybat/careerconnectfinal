/**
 * Sprint 14 — assembles the operations snapshot from existing signals.
 *
 * Server-only: it touches the privileged client and the in-process metrics
 * registry. Everything it returns is safe to render in the admin console.
 */

import { appMetrics } from "./metrics";
import { summariseDatabase, type DbProbe } from "./database";
import { summariseAiUsage, type AiUsageRow } from "./ai";
import { summariseSecurity, type AuditRow } from "./security";
import { summariseStorage } from "./storage";
import { evaluateAlerts } from "./alerts";
import { biBadge } from "./freshness";
import { getFreshnessReport, getPlatformSnapshot } from "./platform.server";
import { checkAiGateway, checkConfiguration, checkDatabase, checkProcess } from "./health.server";
import { worstStatus, type ComponentHealth } from "./types";
import { logger } from "./logger";
import { classifyError } from "./errors";
import type { OperationsSnapshot } from "./operations";

const WINDOW_HOURS = 24;

async function probeDatabase(): Promise<{ probes: DbProbe[]; health: ComponentHealth }> {
  const health = await checkDatabase();
  return {
    probes: [
      {
        ok: health.status !== "unhealthy",
        latency_ms: health.latency_ms ?? 0,
        ...(health.status === "unhealthy" ? { error_kind: "database_error" } : {}),
      },
    ],
    health,
  };
}

export async function buildOperationsSnapshot(
  now: number = Date.now(),
): Promise<OperationsSnapshot> {
  const startedAt = Date.now();
  const since = new Date(now - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const platform = getPlatformSnapshot();
  const warehouse = getFreshnessReport(now);
  const application = appMetrics.snapshot(now);

  let aiRows: AiUsageRow[] = [];
  let auditRows: AuditRow[] = [];
  let resumeObjects = 0;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [ai, audit, resumes] = await Promise.all([
      supabaseAdmin
        .from("ai_usage_logs")
        .select(
          "created_at, feature, provider, model, input_tokens, output_tokens, estimated_cost_usd, latency_ms, status",
        )
        .gte("created_at", since)
        .limit(5000),
      supabaseAdmin
        .from("audit_logs")
        .select("occurred_at, action, category, severity, outcome, actor_id, actor_role")
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(2000),
      supabaseAdmin
        .from("resumes")
        .select("*", { count: "exact", head: true })
        .not("file_path", "is", null),
    ]);
    aiRows = (ai.data ?? []) as AiUsageRow[];
    auditRows = (audit.data ?? []) as AuditRow[];
    resumeObjects = resumes.count ?? 0;
  } catch (error) {
    logger.error("operations snapshot partial", {
      event: "operations.snapshot",
      error_kind: classifyError(error).kind,
    });
  }

  const { probes, health: dbHealth } = await probeDatabase();
  const database = summariseDatabase(probes, { migrationStatus: "applied" });
  const ai = summariseAiUsage(aiRows, { windowHours: WINDOW_HOURS });
  const security = summariseSecurity(auditRows, { windowHours: WINDOW_HOURS });

  const datasetRows = Object.values(platform.build.pipeline.curated).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  const storage = summariseStorage([
    { area: "resumes", objects: resumeObjects, bytes: 0, upload_failures: 0, download_failures: 0 },
    { area: "datasets", objects: datasetRows, bytes: 0, upload_failures: 0, download_failures: 0 },
    {
      area: "exports",
      objects: platform.warehouseRows,
      bytes: 0,
      upload_failures: 0,
      download_failures: 0,
    },
  ]);

  const appHealth: ComponentHealth = {
    component: "application",
    status:
      application.requests === 0
        ? "healthy"
        : application.errorRate > 0.05
          ? "unhealthy"
          : application.errorRate > 0
            ? "degraded"
            : "healthy",
    detail: `${application.requests} requests, p95 ${application.latency.p95}ms`,
    latency_ms: application.latency.p95,
    checked_at: new Date(now).toISOString(),
  };

  const components: ComponentHealth[] = [
    checkProcess(),
    appHealth,
    dbHealth,
    checkConfiguration(),
    checkAiGateway(),
    {
      component: "etl",
      status:
        platform.etl.status === "FAILED"
          ? "unhealthy"
          : platform.etl.status === "PARTIAL"
            ? "degraded"
            : "healthy",
      detail: `run ${platform.etl.run_id} ${platform.etl.status}`,
      latency_ms: platform.etl.duration_ms,
      checked_at: new Date(now).toISOString(),
    },
    {
      component: "warehouse",
      status:
        warehouse.status === "failed" || warehouse.status === "stale"
          ? "unhealthy"
          : warehouse.status === "delayed"
            ? "degraded"
            : "healthy",
      detail: `data through ${warehouse.data_through} (${warehouse.status})`,
      latency_ms: warehouse.refresh_duration_ms,
      checked_at: new Date(now).toISOString(),
    },
    {
      component: "data_quality",
      status: platform.quality.status,
      detail: `score ${platform.quality.score}, ${platform.quality.rules_failed} failing rules`,
      checked_at: new Date(now).toISOString(),
    },
    {
      component: "ai",
      status: worstStatus(ai.providers.map((p) => p.health)),
      detail: `${ai.requests} requests, ${Math.round(ai.failureRate * 100)}% failures`,
      latency_ms: ai.latency.p95,
      checked_at: new Date(now).toISOString(),
    },
    {
      component: "storage",
      status: storage.status,
      detail: `${storage.total_objects} objects tracked`,
      checked_at: new Date(now).toISOString(),
    },
    {
      component: "security",
      status: security.status,
      detail: `${security.total_events} audited events in ${WINDOW_HOURS}h`,
      checked_at: new Date(now).toISOString(),
    },
  ];

  const snapshot: OperationsSnapshot = {
    generated_at: new Date(now).toISOString(),
    environment: process.env["NODE_ENV"] ?? "development",
    status: worstStatus(components.map((c) => c.status)),
    components,
    application,
    database,
    etl: platform.etl,
    quality: platform.quality,
    quality_trend: platform.qualityTrend,
    warehouse,
    bi: biBadge(warehouse, Date.now() - startedAt),
    ai,
    storage,
    security,
    alerts: [],
  };

  snapshot.alerts = evaluateAlerts(snapshot, undefined, snapshot.generated_at);
  return snapshot;
}
