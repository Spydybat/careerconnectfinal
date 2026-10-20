import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import {
  MAX_REQUEST_BYTES,
  applySecurityHeaders,
  isRequestTooLarge,
  requestIdFrom,
} from "@/security/headers";
import { appMetrics } from "@/observability/metrics";
import { requestLogger } from "@/observability/logger";
import { reportError } from "@/observability/errors";

const isDev = import.meta.env.DEV;

/**
 * Sprint 12 — every response carries production security headers and a request
 * id, and oversized bodies are rejected before any handler runs.
 */
const securityMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const requestId = requestIdFrom(request);

  if (isRequestTooLarge(request?.headers.get("content-length") ?? null)) {
    return applySecurityHeaders(new Response("Request entity too large", { status: 413 }), {
      dev: isDev,
      requestId,
    });
  }

  setResponseHeader("x-request-id", requestId);
  // Sprint 14 — one correlated log line and one metric sample per request.
  const startedAt = Date.now();
  const log = requestLogger(requestId, {
    route: request ? new URL(request.url).pathname : "unknown",
    method: request?.method ?? "GET",
  });
  let status = 200;
  let result: Awaited<ReturnType<typeof next>>;
  try {
    result = await next();
  } catch (error) {
    status = 500;
    appMetrics.record({
      route: request ? new URL(request.url).pathname : "unknown",
      method: request?.method ?? "GET",
      status,
      durationMs: Date.now() - startedAt,
      errorKind: reportError(error, { requestId, event: "request.failed", logger: log }).kind,
    });
    throw error;
  }
  if (result instanceof Response) status = result.status;
  else if (
    result != null &&
    typeof result === "object" &&
    "response" in result &&
    result.response instanceof Response
  ) {
    status = result.response.status;
  }
  const durationMs = Date.now() - startedAt;
  appMetrics.record({
    route: request ? new URL(request.url).pathname : "unknown",
    method: request?.method ?? "GET",
    status,
    durationMs,
  });
  log[status >= 500 ? "error" : status >= 400 ? "warn" : "info"]("request completed", {
    event: "http.request",
    duration_ms: durationMs,
    status,
  });
  if (result instanceof Response) {
    return applySecurityHeaders(result, { dev: isDev, requestId });
  }
  if (
    result != null &&
    typeof result === "object" &&
    "response" in result &&
    result.response instanceof Response
  ) {
    return {
      ...result,
      response: applySecurityHeaders(result.response, { dev: isDev, requestId }),
    };
  }
  return result;
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Full detail stays server-side; the client only ever sees a safe message.
    reportError(error, { event: "request.unhandled" });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const MAX_BODY_BYTES = MAX_REQUEST_BYTES;

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, securityMiddleware, csrfMiddleware],
}));
