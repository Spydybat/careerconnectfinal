import { describe, expect, it } from "vitest";
import {
  ALERT_DEFINITIONS,
  DEFAULT_ALERT_CONFIG,
  createMemoryAlertSink,
  dispatchAlerts,
  evaluateAlerts,
} from "../alerts";
import { summariseLatency } from "../types";
import type { OperationsSnapshot } from "../operations";

function baseSnapshot(overrides: Partial<OperationsSnapshot> = {}): OperationsSnapshot {
  const now = new Date().toISOString();
  return {
    generated_at: now,
    environment: "test",
    status: "healthy",
    components: [],
    application: {
      windowMs: 900_000,
      since: now,
      requests: 100,
      errors: 0,
      errorRate: 0,
      latency: summariseLatency([100, 120, 140]),
      statuses: { "2xx": 100 },
      errorKinds: {},
      routes: [],
    },
    database: {
      status: "healthy",
      probes: 5,
      failures: 0,
      connection_failure_rate: 0,
      latency: summariseLatency([20, 30]),
      slow_queries: 0,
      migration_status: "applied",
      slow_query_threshold_ms: 1000,
    },
    etl: {
      run_id: "run-1",
      status: "SUCCESS",
      started_at: now,
      finished_at: now,
      duration_ms: 1000,
      input_records: 1000,
      processed_records: 1000,
      rejected_records: 0,
      quarantined_records: 0,
      error_count: 0,
      watermark: now,
      datasets: [],
    },
    quality: {
      score: 100,
      status: "healthy",
      rules_total: 10,
      rules_passed: 10,
      rules_failed: 0,
      rules_warned: 0,
      dimensions: [],
    },
    quality_trend: [],
    warehouse: {
      status: "fresh",
      last_updated: now,
      data_through: now,
      age_ms: 60_000,
      refresh_duration_ms: 1000,
      pipeline_status: "SUCCESS",
      run_id: "run-1",
      rows_quarantined: 0,
      warehouse_rows: 500,
      mart_status: "ok",
    },
    bi: {
      last_updated: now,
      data_through: now,
      pipeline_status: "SUCCESS",
      freshness: "fresh",
      query_duration_ms: 20,
    },
    ai: {
      window_hours: 24,
      requests: 50,
      successes: 50,
      failures: 0,
      successRate: 1,
      failureRate: 0,
      inputTokens: 100,
      outputTokens: 100,
      costUsd: 1,
      latency: summariseLatency([800, 900]),
      providers: [],
      models: [],
      features: [],
    },
    storage: {
      status: "healthy",
      total_objects: 10,
      total_bytes: 1000,
      areas: [],
    },
    security: {
      window_hours: 24,
      total_events: 2,
      auth_failures: 1,
      authorization_failures: 0,
      rate_limit_violations: 0,
      csrf_failures: 0,
      suspicious_uploads: 0,
      cross_tenant_attempts: 0,
      admin_security_events: 0,
      critical_events: 0,
      status: "healthy",
      recent: [],
    },
    alerts: [],
    ...overrides,
  } as OperationsSnapshot;
}

describe("alert definitions", () => {
  it("covers every operational domain with a severity and a runbook", () => {
    const domains = new Set(ALERT_DEFINITIONS.map((d) => d.domain));
    for (const domain of [
      "application",
      "database",
      "etl",
      "data_quality",
      "warehouse",
      "ai",
      "security",
    ]) {
      expect(domains.has(domain as never)).toBe(true);
    }
    for (const definition of ALERT_DEFINITIONS) {
      expect(["P1", "P2", "P3", "P4"]).toContain(definition.severity);
      expect(definition.runbook).toMatch(/^docs\/operations\//);
      expect(definition.condition.length).toBeGreaterThan(10);
    }
  });

  it("has unique ids", () => {
    const ids = ALERT_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("alert evaluation", () => {
  it("stays silent on a healthy snapshot", () => {
    const firing = evaluateAlerts(baseSnapshot()).filter((a) => a.firing);
    expect(firing).toHaveLength(0);
  });

  it("fires on an application error-rate breach", () => {
    const snapshot = baseSnapshot();
    snapshot.application.errors = 20;
    snapshot.application.errorRate = 0.2;
    const alert = evaluateAlerts(snapshot).find((a) => a.id === "app.error_rate");
    expect(alert?.firing).toBe(true);
    expect(alert?.severity).toBe("P1");
  });

  it("fires on pipeline failure and unexpected record drop", () => {
    const snapshot = baseSnapshot();
    snapshot.etl.status = "FAILED";
    snapshot.etl.error_count = 3;
    snapshot.etl.processed_records = 500;
    const alerts = evaluateAlerts(snapshot);
    expect(alerts.find((a) => a.id === "etl.failed")?.firing).toBe(true);
    expect(alerts.find((a) => a.id === "etl.record_drop")?.firing).toBe(true);
  });

  it("fires on warehouse staleness", () => {
    const snapshot = baseSnapshot();
    snapshot.warehouse.status = "stale";
    snapshot.warehouse.age_ms = 48 * 3_600_000;
    const alerts = evaluateAlerts(snapshot);
    expect(alerts.find((a) => a.id === "warehouse.stale")?.firing).toBe(true);
    expect(alerts.find((a) => a.id === "etl.stale")?.firing).toBe(true);
  });

  it("fires on quality degradation", () => {
    const snapshot = baseSnapshot();
    snapshot.quality.score = 80;
    snapshot.quality.rules_failed = 2;
    expect(evaluateAlerts(snapshot).find((a) => a.id === "quality.degraded")?.firing).toBe(true);
  });

  it("fires on AI failure rate and cost spikes", () => {
    const snapshot = baseSnapshot();
    snapshot.ai.failures = 30;
    snapshot.ai.failureRate = 0.6;
    snapshot.ai.costUsd = DEFAULT_ALERT_CONFIG.aiDailyCostUsd + 10;
    const alerts = evaluateAlerts(snapshot);
    expect(alerts.find((a) => a.id === "ai.failure_rate")?.firing).toBe(true);
    expect(alerts.find((a) => a.id === "ai.cost_spike")?.firing).toBe(true);
  });

  it("fires on a cross-tenant access attempt", () => {
    const snapshot = baseSnapshot();
    snapshot.security.cross_tenant_attempts = 1;
    const alert = evaluateAlerts(snapshot).find((a) => a.id === "security.anomaly");
    expect(alert?.firing).toBe(true);
    expect(alert?.severity).toBe("P1");
  });

  it("respects configured thresholds", () => {
    const snapshot = baseSnapshot();
    snapshot.application.errorRate = 0.2;
    const relaxed = evaluateAlerts(snapshot, { ...DEFAULT_ALERT_CONFIG, appErrorRate: 0.5 });
    expect(relaxed.find((a) => a.id === "app.error_rate")?.firing).toBe(false);
  });
});

describe("alert delivery", () => {
  it("delivers only firing alerts to the sink", async () => {
    const snapshot = baseSnapshot();
    snapshot.security.cross_tenant_attempts = 2;
    const sink = createMemoryAlertSink();
    const delivered = await dispatchAlerts(evaluateAlerts(snapshot), sink);
    expect(delivered.length).toBe(sink.delivered.length);
    expect(sink.delivered.every((a) => a.firing)).toBe(true);
    expect(sink.delivered.some((a) => a.id === "security.anomaly")).toBe(true);
  });
});
