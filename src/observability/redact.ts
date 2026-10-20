/**
 * Sprint 14 — redaction for everything that leaves the process as a log line,
 * a metric label or an operational payload.
 *
 * Rule: observability records *what happened*, never *what was said*. Prompts,
 * resume bodies, credentials and personal contact details are dropped here so
 * no call site has to remember to do it.
 */

import { redactSecrets } from "@/security/sanitize";

export const REDACTED = "[redacted]";

/** Keys whose value is never emitted, whatever the caller passes. */
export const FORBIDDEN_LOG_KEYS = [
  "password",
  "passwd",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "secret",
  "service_role",
  "service_role_key",
  "anon_key",
  "private_key",
  "credential",
  "prompt",
  "completion",
  "system_prompt",
  "answer",
  "raw_text",
  "resume_text",
  "resume",
  "cover_note",
  "message_content",
  "email",
  "phone",
  "ssn",
  "dob",
  "file_path",
  "signed_url",
] as const;

const MAX_STRING = 500;
const MAX_ARRAY = 20;
const MAX_DEPTH = 3;

function isForbidden(key: string): boolean {
  const lower = key.toLowerCase();
  return FORBIDDEN_LOG_KEYS.some((k) => lower === k || lower.includes(k));
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return redactSecrets(value).slice(0, MAX_STRING);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return "[array]";
    return value.slice(0, MAX_ARRAY).map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) return "[object]";
    return redactFields(value as Record<string, unknown>, depth + 1);
  }
  return "[unserializable]";
}

/** Recursively scrubs a structured payload for logging. */
export function redactFields(
  fields: Record<string, unknown> | undefined,
  depth = 0,
): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = isForbidden(key) ? REDACTED : redactValue(value, depth);
  }
  return out;
}
