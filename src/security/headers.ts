/**
 * Sprint 12 — production security headers and request identity.
 *
 * Applied to every server response by request middleware in src/start.ts.
 * The CSP is intentionally compatible with the app as it ships today: Vite's
 * dev pipeline and the TanStack hydration payload need inline scripts/styles,
 * so those are allowed while framing, plugins and arbitrary connect targets
 * are not.
 */

export type CspOptions = {
  /** Dev mode relaxes CSP for HMR websockets and eval-based transforms. */
  dev?: boolean;
  /** Extra origins the app must reach (the Cloud backend, AI gateway). */
  connectSrc?: string[];
};

export function buildCsp({ dev = false, connectSrc = [] }: CspOptions = {}): string {
  const connect = ["'self'", "https:", ...(dev ? ["ws:", "wss:"] : ["wss:"]), ...connectSrc];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Hydration and the Vite client require inline execution.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'", "https:"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https:"],
    "connect-src": [...new Set(connect)],
    "media-src": ["'self'", "blob:", "https:"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    // The Lovable editor renders the app inside an iframe; deny everything else.
    "frame-ancestors": ["'self'", "https://lovable.dev", "https://*.lovable.app"],
  };

  const serialized = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");

  return dev ? serialized : `${serialized}; upgrade-insecure-requests`;
}

export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "interest-cohort=()",
].join(", ");

export function securityHeaders({ dev = false }: { dev?: boolean } = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "content-security-policy": buildCsp({ dev }),
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": PERMISSIONS_POLICY,
    "cross-origin-opener-policy": "same-origin",
    "x-dns-prefetch-control": "off",
  };
  if (!dev) {
    headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

/** Response types that must never be cached by a shared cache. */
export function isPrivateResponse(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes("application/json") || contentType.includes("text/html");
}

/**
 * Copies security headers onto a response without clobbering values the app
 * has deliberately set (e.g. a stricter CSP on a specific route).
 */
export function applySecurityHeaders(
  response: Response,
  options: { dev?: boolean; requestId?: string } = {},
): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders({ dev: options.dev ?? false }))) {
    if (!headers.has(key)) headers.set(key, value);
  }
  if (options.requestId && !headers.has("x-request-id")) {
    headers.set("x-request-id", options.requestId);
  }
  if (isPrivateResponse(headers.get("content-type")) && !headers.has("cache-control")) {
    headers.set("cache-control", "private, no-store");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Maximum accepted request body size for server functions and API routes. */
export const MAX_REQUEST_BYTES = 1024 * 1024; // 1 MiB

export function isRequestTooLarge(contentLength: string | null, max = MAX_REQUEST_BYTES): boolean {
  if (!contentLength) return false;
  const size = Number(contentLength);
  return Number.isFinite(size) && size > max;
}

/** Correlates logs, audit rows and error responses for one request. */
export function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function requestIdFrom(request: Request | undefined): string {
  const existing = request?.headers.get("x-request-id");
  return existing && /^[\w-]{8,64}$/.test(existing) ? existing : newRequestId();
}
