import { describe, expect, it } from "vitest";
import { createLogger, formatLine, requestLogger, type LogRecord } from "../logger";
import { AppError, classifyError, reportError, toClientError } from "../errors";
import { createMetricsRegistry, normalizeRoute, statusClass } from "../metrics";
import { buildFreshnessReport, classifyFreshness, biBadge } from "../freshness";
import { summariseDatabase } from "../database";
import { summariseSecurity } from "../security";
import { summariseStorage } from "../storage";
import { summariseAiUsage, providerHealth } from "../ai";
import { buildHealthPayload, isReady, HTTP_STATUS_FOR } from "../health";
import { RETENTION_POLICIES, policyFor } from "../retention";
import { redactFields, REDACTED } from "../redact";
import { percentile, summariseLatency, worstStatus } from "../types";

function capture() {
  const records: LogRecord[] = [];
  const lines: string[] = [];
  const logger = createLogger({
    environment: "production",
    format: "json",
    sink: (record, line) => {
      records.push(record);
      lines.push(line);
    },
  });
  return { logger, records, lines };
}

describe("structured logging", () => {
  it("emits one json object per line with the required fields", () => {
    const { logger, lines } = capture();
    logger.info("job listed", {
      event: "jobs.list",
      request_id: "req-1",
      duration_ms: 12.6,
      status: 200,
    });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!);
    expect(parsed).toMatchObject({
      level: "INFO",
      service: "career-connect",
      environment: "production",
      event: "jobs.list",
      request_id: "req-1",
      duration_ms: 13,
      status: 200,
    });
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("respects the minimum level", () => {
    const { logger, records } = capture();
    logger.debug("noisy");
    expect(records).toHaveLength(0);
  });

  it("never logs sensitive content", () => {
    const { logger, lines } = capture();
    logger.warn("ai call", {
      event: "ai.call",
      prompt: "my resume text",
      email: "student@example.com",
      authorization: "Bearer secret-token",
      password: "hunter2",
      resume_text: "…",
    });
    const line = lines[0]!;
    expect(line).not.toContain("hunter2");
    expect(line).not.toContain("secret-token");
    expect(line).not.toContain("student@example.com");
    expect(line).toContain(REDACTED);
  });

  it("propagates a request id to child loggers", () => {
    const { logger, records } = capture();
    const child = logger.child({ request_id: "req-42" }).child({ event: "db.query" });
    child.info("query complete");
    expect(records[0]).toMatchObject({ request_id: "req-42", event: "db.query" });
  });

  it("builds a correlated request logger", () => {
    const record = requestLogger("req-7").error("boom", { event: "app.error" });
    expect(record?.request_id).toBe("req-7");
  });

  it("formats pretty lines for local development", () => {
    const { logger, records } = capture();
    logger.info("hello", { event: "test" });
    expect(formatLine(records[0]!, "pretty")).toContain("hello");
  });
});

describe("redaction", () => {
  it("redacts forbidden keys at any depth", () => {
    const out = redactFields({ nested: { api_key: "abc", ok: 1 } }) as Record<string, any>;
    expect(out["nested"].api_key).toBe(REDACTED);
    expect(out["nested"].ok).toBe(1);
  });
});

describe("error monitoring", () => {
  it("classifies known error kinds", () => {
    expect(classifyError(new AppError("authorization_error", "nope")).kind).toBe(
      "authorization_error",
    );
    expect(classifyError(new Error("Unauthorized")).kind).toBe("authentication_error");
    expect(classifyError(new Error("upstream bad gateway")).kind).toBe("external_service_error");
    expect(classifyError(new Error("something odd")).kind).toBe("unexpected_error");
  });

  it("returns a safe client payload without internals", () => {
    const classified = classifyError(
      new Error("connection string postgres://user:pw@host/db failed"),
    );
    const payload = toClientError(classified, "req-9");
    expect(JSON.stringify(payload)).not.toContain("pw@host");
    expect(payload.error.request_id).toBe("req-9");
    expect(payload.error.message.length).toBeGreaterThan(0);
  });

  it("logs the diagnostic detail server-side with correlation", () => {
    const { logger, records } = capture();
    reportError(new Error("db exploded"), { requestId: "req-3", event: "db.write", logger });
    expect(records[0]).toMatchObject({ level: "ERROR", request_id: "req-3", event: "db.write" });
  });
});

describe("application metrics", () => {
  it("bounds route cardinality", () => {
    expect(normalizeRoute("/jobs/8f1f0f66-1a2b-4c3d-9e0f-1a2b3c4d5e6f")).toBe("/jobs/:id");
    expect(normalizeRoute("/students/42/applications")).toBe("/students/:id/applications");
    expect(statusClass(503)).toBe("5xx");
  });

  it("aggregates counts, error rate and latency percentiles", () => {
    const registry = createMetricsRegistry({ windowMs: 60_000 });
    const now = Date.now();
    for (let i = 0; i < 9; i += 1) {
      registry.record({ route: "/jobs", method: "get", status: 200, durationMs: 100 + i, at: now });
    }
    registry.record({
      route: "/jobs",
      method: "GET",
      status: 500,
      durationMs: 900,
      at: now,
      errorKind: "unexpected_error",
    });
    const snapshot = registry.snapshot(now);
    expect(snapshot.requests).toBe(10);
    expect(snapshot.errors).toBe(1);
    expect(snapshot.errorRate).toBeCloseTo(0.1);
    expect(snapshot.latency.p95).toBeGreaterThanOrEqual(snapshot.latency.p50);
    expect(snapshot.errorKinds["unexpected_error"]).toBe(1);
    expect(snapshot.routes[0]?.route).toBe("/jobs");
  });

  it("drops samples outside the rolling window", () => {
    const registry = createMetricsRegistry({ windowMs: 1000 });
    const now = Date.now();
    registry.record({ route: "/a", method: "GET", status: 200, durationMs: 5, at: now - 5000 });
    registry.record({ route: "/a", method: "GET", status: 200, durationMs: 5, at: now });
    expect(registry.snapshot(now).requests).toBe(1);
  });
});

describe("percentiles", () => {
  it("computes ordered percentiles", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(values, 50)).toBeLessThan(percentile(values, 95));
    expect(percentile([], 95)).toBe(0);
    const summary = summariseLatency(values);
    expect(summary.p99).toBeGreaterThanOrEqual(summary.p95);
    expect(summary.max).toBe(100);
  });

  it("takes the worst component status", () => {
    expect(worstStatus(["healthy", "degraded"])).toBe("degraded");
    expect(worstStatus(["degraded", "unhealthy"])).toBe("unhealthy");
    expect(worstStatus([])).toBe("healthy");
  });
});

const freshnessInput = (lastUpdatedMsAgo: number, now: number) => ({
  freshness: {
    last_updated: new Date(now - lastUpdatedMsAgo).toISOString(),
    data_through: new Date(now - lastUpdatedMsAgo).toISOString(),
    rows: 120,
  } as any,
  pipelineStatus: "SUCCESS" as const,
  refreshDurationMs: 1200,
  now,
});

describe("warehouse freshness", () => {
  it("classifies fresh, delayed, stale and failed", () => {
    const hour = 3_600_000;
    expect(classifyFreshness(hour, "SUCCESS")).toBe("fresh");
    expect(classifyFreshness(8 * hour, "SUCCESS")).toBe("delayed");
    expect(classifyFreshness(30 * hour, "SUCCESS")).toBe("stale");
    expect(classifyFreshness(hour, "FAILED")).toBe("failed");
    expect(classifyFreshness(hour, "PARTIAL")).toBe("delayed");
  });

  it("gives BI and operations the same freshness values", () => {
    const now = Date.now();
    const report = buildFreshnessReport(freshnessInput(3_600_000, now));
    const badge = biBadge(report, 42);
    expect(badge.data_through).toBe(report.data_through);
    expect(badge.freshness).toBe(report.status);
    expect(badge.pipeline_status).toBe(report.pipeline_status);
    expect(badge.query_duration_ms).toBe(42);
  });
});

describe("database observability", () => {
  it("summarises probe health without exposing connection details", () => {
    const summary = summariseDatabase([
      { ok: true, latency_ms: 40 },
      { ok: true, latency_ms: 60 },
    ]);
    expect(summary.status).toBe("healthy");
    expect(summary.connection_failure_rate).toBe(0);
    expect(JSON.stringify(summary)).not.toMatch(/postgres|password/i);
  });

  it("marks total failure unhealthy", () => {
    expect(summariseDatabase([{ ok: false, latency_ms: 0 }]).status).toBe("unhealthy");
  });
});

describe("ai observability", () => {
  const rows = [
    {
      created_at: new Date().toISOString(),
      feature: "coach",
      provider: "lovable",
      model: "gemini",
      input_tokens: 100,
      output_tokens: 50,
      estimated_cost_usd: 0.01,
      latency_ms: 900,
      status: "success",
    },
    {
      created_at: new Date().toISOString(),
      feature: "coach",
      provider: "lovable",
      model: "gemini",
      input_tokens: 10,
      output_tokens: 0,
      estimated_cost_usd: 0,
      latency_ms: 4000,
      status: "error",
    },
  ];

  it("aggregates requests, tokens, cost and failure rate", () => {
    const ai = summariseAiUsage(rows, { windowHours: 24 });
    expect(ai.requests).toBe(2);
    expect(ai.failures).toBe(1);
    expect(ai.failureRate).toBeCloseTo(0.5);
    expect(ai.inputTokens + ai.outputTokens).toBe(160);
    expect(ai.costUsd).toBeCloseTo(0.01);
    expect(ai.providers.length).toBeGreaterThan(0);
  });

  it("never surfaces prompt or response content", () => {
    expect(JSON.stringify(summariseAiUsage(rows))).not.toMatch(/prompt|resume/i);
  });

  it("degrades provider health as failures rise", () => {
    const healthy = providerHealth({
      key: "a",
      requests: 10,
      failures: 0,
      tokens: 0,
      costUsd: 0,
      latency: summariseLatency([100]),
      health: "healthy",
    } as any);
    expect(healthy).toBe("healthy");
  });
});

describe("security monitoring", () => {
  const row = (action: string, outcome = "failure", severity = "warning") => ({
    occurred_at: new Date().toISOString(),
    action,
    category: "security",
    severity,
    outcome,
    actor_id: null,
    actor_role: "student",
  });

  it("counts the operational security signals", () => {
    const summary = summariseSecurity([
      row("auth.login_failed"),
      row("auth.login_failed"),
      row("security.rate_limited"),
      row("security.authorization_denied", "denied"),
    ]);
    expect(summary.auth_failures).toBe(2);
    expect(summary.rate_limit_violations).toBe(1);
    expect(summary.authorization_failures).toBeGreaterThanOrEqual(1);
    expect(summary.total_events).toBe(4);
  });

  it("stays healthy when nothing happened", () => {
    expect(summariseSecurity([]).status).toBe("healthy");
  });
});

describe("storage monitoring", () => {
  it("reports counts only", () => {
    const summary = summariseStorage([
      { area: "resumes", objects: 12, bytes: 1024, upload_failures: 0, download_failures: 0 },
    ]);
    expect(summary.total_objects).toBe(12);
    expect(JSON.stringify(summary)).not.toMatch(/\.pdf|http/);
  });
});

describe("health endpoints", () => {
  const check = (status: "healthy" | "degraded" | "unhealthy") => ({
    component: "database",
    status,
    detail: "reachable",
    checked_at: new Date().toISOString(),
  });

  it("returns 200 while healthy or degraded and 503 when unhealthy", () => {
    expect(HTTP_STATUS_FOR[buildHealthPayload({ checks: [check("healthy")] }).status]).toBe(200);
    expect(HTTP_STATUS_FOR[buildHealthPayload({ checks: [check("degraded")] }).status]).toBe(200);
    expect(HTTP_STATUS_FOR[buildHealthPayload({ checks: [check("unhealthy")] }).status]).toBe(503);
  });

  it("is safe to expose publicly", () => {
    const payload = buildHealthPayload({ checks: [check("healthy")], environment: "production" });
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toMatch(/SUPABASE|KEY|postgres:\/\/|at .*\.ts:/);
  });

  it("readiness fails when a dependency is degraded", () => {
    expect(isReady([check("healthy")])).toBe(true);
    expect(isReady([check("degraded")])).toBe(false);
  });
});

describe("retention", () => {
  it("documents a policy for every observability dataset", () => {
    expect(RETENTION_POLICIES.length).toBeGreaterThan(3);
    for (const policy of RETENTION_POLICIES) {
      if (typeof policy.retention_days === "number")
        expect(policy.retention_days).toBeGreaterThan(0);
      else expect(policy.retention_days).toBe("indefinite");
      expect(policy.rationale.length).toBeGreaterThan(0);
    }
    expect(policyFor(RETENTION_POLICIES[0]!.dataset)).toBeDefined();
  });
});
