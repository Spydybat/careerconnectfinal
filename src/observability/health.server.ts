/**
 * Sprint 14 — liveness and readiness probes.
 *
 * /health   — process liveness plus a shallow view of subsystems.
 * /readiness — verifies the dependencies a request actually needs.
 *
 * Neither response contains secrets, environment values, connection details
 * or stack traces. Failures are reported as a short operator-facing phrase.
 */

import { buildHealthPayload, HTTP_STATUS_FOR, isReady, type HealthPayload } from "./health";
import { requestIdFrom } from "@/security/headers";
import { classifyError } from "./errors";
import { logger } from "./logger";
import type { ComponentHealth, HealthStatus } from "./types";

const BOOTED_AT = Date.now();

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

function environmentName(): string {
  return env("NODE_ENV") ?? "development";
}

function nowIso(): string {
  return new Date().toISOString();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("probe timeout")), ms)),
  ]);
}

/** Cheap, credential-free reachability probe against the backend auth endpoint. */
export async function checkDatabase(timeoutMs = 2500): Promise<ComponentHealth> {
  const started = Date.now();
  const url = env("SUPABASE_URL");
  if (!url) {
    return {
      component: "database",
      status: "unhealthy",
      detail: "backend endpoint is not configured",
      checked_at: nowIso(),
    };
  }
  try {
    const response = await withTimeout(
      fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
        method: "GET",
        headers: (() => {
          const key = env("SUPABASE_PUBLISHABLE_KEY") ?? env("SUPABASE_ANON_KEY");
          return key ? { apikey: key } : {};
        })(),
      }),
      timeoutMs,
    );
    const latency = Date.now() - started;
    const reachable = response.ok || response.status === 401;
    const status: HealthStatus = reachable
      ? latency > 1000
        ? "degraded"
        : "healthy"
      : "unhealthy";
    return {
      component: "database",
      status,
      detail: reachable ? "reachable" : "backend returned a non-success status",
      latency_ms: latency,
      checked_at: nowIso(),
    };
  } catch (error) {
    const classified = classifyError(error);
    logger.warn("database probe failed", { event: "health.database", error_kind: classified.kind });
    return {
      component: "database",
      status: "unhealthy",
      detail: "backend unreachable",
      latency_ms: Date.now() - started,
      checked_at: nowIso(),
    };
  }
}

/** Configuration presence only — never the value. */
export function checkConfiguration(): ComponentHealth {
  const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
  const missing = required.filter(
    (name) => !env(name) && !env(name.replace("SUPABASE_", "VITE_SUPABASE_")),
  );
  return {
    component: "configuration",
    status: missing.length === 0 ? "healthy" : "unhealthy",
    detail:
      missing.length === 0
        ? "required configuration present"
        : `${missing.length} required value(s) missing`,
    checked_at: nowIso(),
  };
}

export function checkAiGateway(): ComponentHealth {
  const configured = Boolean(env("LOVABLE_API_KEY"));
  return {
    component: "ai_gateway",
    status: configured ? "healthy" : "degraded",
    detail: configured ? "credential configured" : "AI features disabled: no gateway credential",
    checked_at: nowIso(),
  };
}

export function checkProcess(): ComponentHealth {
  return {
    component: "application",
    status: "healthy",
    detail: "process serving requests",
    checked_at: nowIso(),
  };
}

function payload(checks: ComponentHealth[], requestId: string | null): HealthPayload {
  return buildHealthPayload({
    checks,
    environment: environmentName(),
    version: env("APP_VERSION") ?? env("GIT_SHA") ?? "unknown",
    uptimeS: (Date.now() - BOOTED_AT) / 1000,
    requestId,
  });
}

function jsonResponse(body: unknown, status: number, requestId: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
  });
}

export async function handleHealth(request: Request): Promise<Response> {
  const requestId = requestIdFrom(request);
  const body = payload([checkProcess(), checkConfiguration(), checkAiGateway()], requestId);
  return jsonResponse(body, HTTP_STATUS_FOR[body.status], requestId);
}

export async function handleReadiness(request: Request): Promise<Response> {
  const requestId = requestIdFrom(request);
  const checks = [checkConfiguration(), await checkDatabase()];
  const body = payload(checks, requestId);
  const ready = isReady(checks);
  return jsonResponse({ ...body, ready }, ready ? 200 : 503, requestId);
}
