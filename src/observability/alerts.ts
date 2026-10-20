/**
 * Sprint 14 — alerting foundation.
 *
 * Alert *definitions* live here as data, thresholds come from configuration,
 * and delivery is an abstraction. Without external credentials the sink logs
 * structured alert records — no production integration is invented.
 */

import { logger as rootLogger, type Logger } from "./logger";
import type { AlertSeverity } from "./types";
import type { OperationsSnapshot } from "./operations";

export type AlertDomain =
  "application" | "database" | "etl" | "data_quality" | "warehouse" | "ai" | "security";

export interface AlertDefinition {
  id: string;
  domain: AlertDomain;
  title: string;
  severity: AlertSeverity;
  /** Human description of the condition — mirrored in the runbook. */
  condition: string;
  runbook: string;
  evaluate: (snapshot: OperationsSnapshot, config: AlertConfig) => AlertResult | null;
}

export interface AlertResult {
  firing: boolean;
  detail: string;
  value?: number;
}

export interface AlertEvaluation {
  id: string;
  domain: AlertDomain;
  title: string;
  severity: AlertSeverity;
  firing: boolean;
  detail: string;
  value: number | null;
  runbook: string;
  evaluated_at: string;
}

export interface AlertConfig {
  appErrorRate: number;
  appP95LatencyMs: number;
  dbFailureRate: number;
  etlRecordDropRatio: number;
  quarantineIncreaseRatio: number;
  stalePipelineMs: number;
  qualityScoreFloor: number;
  warehouseStaleMs: number;
  aiFailureRate: number;
  aiP95LatencyMs: number;
  aiDailyCostUsd: number;
  securityAuthFailures: number;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  appErrorRate: Number(process.env["ALERT_APP_ERROR_RATE"] ?? 0.05),
  appP95LatencyMs: Number(process.env["ALERT_APP_P95_MS"] ?? 2000),
  dbFailureRate: Number(process.env["ALERT_DB_FAILURE_RATE"] ?? 0.2),
  etlRecordDropRatio: Number(process.env["ALERT_ETL_DROP_RATIO"] ?? 0.1),
  quarantineIncreaseRatio: Number(process.env["ALERT_QUARANTINE_RATIO"] ?? 0.05),
  stalePipelineMs: Number(process.env["ALERT_STALE_PIPELINE_MS"] ?? 26 * 60 * 60 * 1000),
  qualityScoreFloor: Number(process.env["ALERT_QUALITY_SCORE_FLOOR"] ?? 95),
  warehouseStaleMs: Number(process.env["ALERT_WAREHOUSE_STALE_MS"] ?? 24 * 60 * 60 * 1000),
  aiFailureRate: Number(process.env["ALERT_AI_FAILURE_RATE"] ?? 0.25),
  aiP95LatencyMs: Number(process.env["ALERT_AI_P95_MS"] ?? 15000),
  aiDailyCostUsd: Number(process.env["ALERT_AI_DAILY_COST_USD"] ?? 20),
  securityAuthFailures: Number(process.env["ALERT_SECURITY_AUTH_FAILURES"] ?? 50),
};

const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;

export const ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    id: "app.error_rate",
    domain: "application",
    title: "Application failure rate",
    severity: "P1",
    condition: "5xx rate over the rolling window exceeds the configured threshold",
    runbook: "docs/operations/application.md",
    evaluate: (s, c) => ({
      firing: s.application.requests >= 20 && s.application.errorRate > c.appErrorRate,
      detail: `error rate ${pct(s.application.errorRate)} over ${s.application.requests} requests`,
      value: s.application.errorRate,
    }),
  },
  {
    id: "app.latency",
    domain: "application",
    title: "Application latency degradation",
    severity: "P3",
    condition: "p95 request latency exceeds the configured threshold",
    runbook: "docs/operations/application.md",
    evaluate: (s, c) => ({
      firing: s.application.requests >= 20 && s.application.latency.p95 > c.appP95LatencyMs,
      detail: `p95 ${s.application.latency.p95}ms`,
      value: s.application.latency.p95,
    }),
  },
  {
    id: "db.unavailable",
    domain: "database",
    title: "Database failure",
    severity: "P1",
    condition: "connection probes fail above the configured rate",
    runbook: "docs/operations/database.md",
    evaluate: (s, c) => ({
      firing: s.database.probes > 0 && s.database.connection_failure_rate > c.dbFailureRate,
      detail: `${s.database.failures}/${s.database.probes} probes failed`,
      value: s.database.connection_failure_rate,
    }),
  },
  {
    id: "etl.failed",
    domain: "etl",
    title: "Pipeline failure",
    severity: "P2",
    condition: "the most recent pipeline run finished FAILED",
    runbook: "docs/operations/etl.md",
    evaluate: (s) => ({
      firing: s.etl.status === "FAILED",
      detail: `run ${s.etl.run_id} status ${s.etl.status} with ${s.etl.error_count} errors`,
      value: s.etl.error_count,
    }),
  },
  {
    id: "etl.record_drop",
    domain: "etl",
    title: "Unexpected record drop",
    severity: "P2",
    condition: "processed records fall below input records by more than the allowed ratio",
    runbook: "docs/operations/etl.md",
    evaluate: (s, c) => {
      const input = s.etl.input_records;
      const dropped = Math.max(0, input - s.etl.processed_records);
      const ratio = input === 0 ? 0 : dropped / input;
      return {
        firing: input > 0 && ratio > c.etlRecordDropRatio,
        detail: `${dropped}/${input} records not landed (${pct(ratio)})`,
        value: ratio,
      };
    },
  },
  {
    id: "etl.quarantine_spike",
    domain: "etl",
    title: "Large quarantine increase",
    severity: "P3",
    condition: "quarantined share of the batch exceeds the configured ratio",
    runbook: "docs/operations/etl.md",
    evaluate: (s, c) => {
      const input = s.etl.input_records;
      const ratio = input === 0 ? 0 : s.etl.quarantined_records / input;
      return {
        firing: input > 0 && ratio > c.quarantineIncreaseRatio,
        detail: `${s.etl.quarantined_records} quarantined (${pct(ratio)})`,
        value: ratio,
      };
    },
  },
  {
    id: "etl.stale",
    domain: "etl",
    title: "Stale pipeline",
    severity: "P2",
    condition: "no successful pipeline run within the configured interval",
    runbook: "docs/operations/etl.md",
    evaluate: (s, c) => ({
      firing: s.warehouse.age_ms > c.stalePipelineMs,
      detail: `last successful load ${Math.round(s.warehouse.age_ms / 3_600_000)}h ago`,
      value: s.warehouse.age_ms,
    }),
  },
  {
    id: "quality.degraded",
    domain: "data_quality",
    title: "Data quality degradation",
    severity: "P3",
    condition: "overall quality score drops below the floor or a FAIL rule appears",
    runbook: "docs/operations/etl.md",
    evaluate: (s, c) => ({
      firing: s.quality.score < c.qualityScoreFloor || s.quality.rules_failed > 0,
      detail: `score ${s.quality.score}, ${s.quality.rules_failed} failing rules`,
      value: s.quality.score,
    }),
  },
  {
    id: "warehouse.stale",
    domain: "warehouse",
    title: "Warehouse staleness",
    severity: "P2",
    condition: "warehouse data age exceeds the configured stale threshold",
    runbook: "docs/operations/warehouse.md",
    evaluate: (s, c) => ({
      firing: s.warehouse.status === "stale" || s.warehouse.age_ms > c.warehouseStaleMs,
      detail: `freshness ${s.warehouse.status}, data through ${s.warehouse.data_through}`,
      value: s.warehouse.age_ms,
    }),
  },
  {
    id: "ai.failure_rate",
    domain: "ai",
    title: "AI provider failure",
    severity: "P2",
    condition: "AI failure rate exceeds the configured threshold",
    runbook: "docs/operations/ai.md",
    evaluate: (s, c) => ({
      firing: s.ai.requests >= 10 && s.ai.failureRate > c.aiFailureRate,
      detail: `${s.ai.failures}/${s.ai.requests} requests failed`,
      value: s.ai.failureRate,
    }),
  },
  {
    id: "ai.latency",
    domain: "ai",
    title: "AI latency degradation",
    severity: "P3",
    condition: "AI p95 latency exceeds the configured threshold",
    runbook: "docs/operations/ai.md",
    evaluate: (s, c) => ({
      firing: s.ai.requests >= 10 && s.ai.latency.p95 > c.aiP95LatencyMs,
      detail: `p95 ${s.ai.latency.p95}ms`,
      value: s.ai.latency.p95,
    }),
  },
  {
    id: "ai.cost_spike",
    domain: "ai",
    title: "AI cost spike",
    severity: "P3",
    condition: "estimated spend in the window exceeds the configured daily budget",
    runbook: "docs/operations/ai.md",
    evaluate: (s, c) => ({
      firing: s.ai.costUsd > c.aiDailyCostUsd,
      detail: `estimated $${s.ai.costUsd.toFixed(2)} in ${s.ai.window_hours}h`,
      value: s.ai.costUsd,
    }),
  },
  {
    id: "security.anomaly",
    domain: "security",
    title: "Security anomaly",
    severity: "P1",
    condition: "authentication failures spike or a cross-tenant access attempt is recorded",
    runbook: "docs/operations/security.md",
    evaluate: (s, c) => ({
      firing:
        s.security.auth_failures > c.securityAuthFailures || s.security.cross_tenant_attempts > 0,
      detail: `${s.security.auth_failures} auth failures, ${s.security.cross_tenant_attempts} cross-tenant attempts`,
      value: s.security.auth_failures,
    }),
  },
];

export function evaluateAlerts(
  snapshot: OperationsSnapshot,
  config: AlertConfig = DEFAULT_ALERT_CONFIG,
  now: string = new Date().toISOString(),
): AlertEvaluation[] {
  return ALERT_DEFINITIONS.map((definition) => {
    const result = definition.evaluate(snapshot, config) ?? {
      firing: false,
      detail: "not evaluated",
    };
    return {
      id: definition.id,
      domain: definition.domain,
      title: definition.title,
      severity: definition.severity,
      firing: result.firing,
      detail: result.detail,
      value: result.value ?? null,
      runbook: definition.runbook,
      evaluated_at: now,
    };
  });
}

export interface AlertSink {
  name: string;
  deliver(alert: AlertEvaluation): Promise<void> | void;
}

/** Default sink: structured log lines. Safe in every environment. */
export function createLogAlertSink(injected?: Logger): AlertSink {
  const log = injected ?? rootLogger;
  return {
    name: "log",
    deliver(alert) {
      log.warn(`${alert.title}: ${alert.detail}`, {
        event: "alert.fired",
        alert_id: alert.id,
        domain: alert.domain,
        severity: alert.severity,
        runbook: alert.runbook,
      });
    },
  };
}

/** In-memory sink for tests and local verification. */
export function createMemoryAlertSink(): AlertSink & { delivered: AlertEvaluation[] } {
  const delivered: AlertEvaluation[] = [];
  return { name: "memory", delivered, deliver: (alert) => void delivered.push(alert) };
}

export async function dispatchAlerts(
  evaluations: readonly AlertEvaluation[],
  sink: AlertSink = createLogAlertSink(),
): Promise<AlertEvaluation[]> {
  const firing = evaluations.filter((a) => a.firing);
  for (const alert of firing) await sink.deliver(alert);
  return firing;
}
