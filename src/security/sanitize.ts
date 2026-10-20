/**
 * Sprint 12 — output sanitization.
 *
 * Two concerns live here:
 *   1. user-controlled content rendered in the UI (XSS),
 *   2. error text that crosses the server -> client boundary (leakage).
 *
 * React escapes text nodes by default, so these helpers exist for the places
 * that bypass it: text handed to `dangerouslySetInnerHTML`, exported documents
 * (CSV/PDF/Excel) and text embedded in model prompts.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

/** Removes tags, comments and any `javascript:`/`data:` URL payloads. */
export function stripHtml(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\bjavascript\s*:/gi, "")
    .replace(/\bdata\s*:\s*text\/html/gi, "")
    .replace(/\bon[a-z]+\s*=/gi, "");
}

/**
 * Normalizes any free-text a user typed or uploaded before it is stored,
 * exported or rendered: no HTML, no control characters, bounded length.
 */
export function sanitizeUserText(value: string, maxChars = 40_000): string {
  return stripHtml(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxChars);
}

/** CSV formula injection guard for exported cells. */
export function sanitizeCsvCell(value: string): string {
  const cleaned = sanitizeUserText(value, 4_000).replace(/"/g, '""');
  return /^[=+\-@\t\r]/.test(cleaned) ? `'${cleaned}` : cleaned;
}

const SECRET_PATTERNS: RegExp[] = [
  /sb_secret_[A-Za-z0-9_-]+/g,
  /sk-[A-Za-z0-9]{12,}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g,
  /postgres(?:ql)?:\/\/[^\s"']+/gi,
  /https?:\/\/[a-z0-9-]+\.supabase\.(?:co|cloud)[^\s"']*/gi,
  /\b(?:api[_-]?key|authorization|bearer|password|secret|service[_-]?role)\b\s*[:=]\s*\S+/gi,
];

/** Replaces credential-shaped substrings with a marker. */
export function redactSecrets(value: string): string {
  return SECRET_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "[redacted]"), value);
}

/** Internal detail that must never reach a browser response. */
const INTERNAL_HINTS = [
  /\bat\s+\S+\s+\(/, // stack frames
  /\/(?:src|node_modules|home|var|usr|dev-server)\//,
  /\b(?:PGRST|SQLSTATE|22P02|42501|42P01)\b/,
  /\brelation\s+"[^"]+"\s+does not exist/i,
  /\bduplicate key value violates\b/i,
  /\brow-level security\b/i,
  /\bfetch failed\b/i,
];

export type SafeError = {
  /** Message safe to render to the user. */
  message: string;
  /** Coarse class used for status mapping and audit records. */
  kind: "validation" | "unauthorized" | "forbidden" | "not_found" | "rate_limited" | "internal";
};

const KIND_PREFIX: { test: RegExp; kind: SafeError["kind"]; message?: string }[] = [
  { test: /^Invalid request/i, kind: "validation" },
  { test: /^Unauthorized/i, kind: "unauthorized", message: "Please sign in and try again." },
  {
    test: /^Forbidden/i,
    kind: "forbidden",
    message: "You don't have permission to perform this action.",
  },
  { test: /not found/i, kind: "not_found", message: "That item could not be found." },
  { test: /rate limit|too many requests/i, kind: "rate_limited" },
];

/**
 * Maps any thrown value to a message that is safe to return over the wire.
 * Unrecognised errors collapse to a generic message; details stay in the
 * server log.
 */
export function sanitizeError(error: unknown): SafeError {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const cleaned = redactSecrets(raw).trim();

  for (const rule of KIND_PREFIX) {
    if (rule.test.test(cleaned)) {
      return { message: rule.message ?? cleaned, kind: rule.kind };
    }
  }

  const leaksInternals = INTERNAL_HINTS.some((pattern) => pattern.test(cleaned));
  if (!cleaned || leaksInternals || cleaned.length > 300) {
    return { message: "Something went wrong. Please try again.", kind: "internal" };
  }
  return { message: cleaned, kind: "internal" };
}

export const ERROR_STATUS: Record<SafeError["kind"], number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  internal: 500,
};
