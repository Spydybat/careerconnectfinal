/**
 * Sprint 14 — centralized structured server logging.
 *
 * One shape for every server event: JSON in production (machine ingestible),
 * a compact single line in development. Fields are redacted before emission,
 * so no call site can leak a prompt, a resume body or a credential.
 */

import { redactFields } from "./redact";

export const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_WEIGHT: Record<LogLevel, number> = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };

export interface LogFields {
  request_id?: string | null;
  event?: string;
  duration_ms?: number;
  status?: string | number;
  route?: string;
  method?: string;
  actor_id?: string | null;
  [key: string]: unknown;
}

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  event: string;
  request_id: string | null;
  duration_ms: number | null;
  status: string | number | null;
  message: string;
  fields: Record<string, unknown>;
}

export interface LoggerOptions {
  service?: string;
  environment?: string;
  minLevel?: LogLevel;
  /** "json" in production, "pretty" locally. */
  format?: "json" | "pretty";
  clock?: () => Date;
  sink?: (record: LogRecord, line: string) => void;
  base?: LogFields;
}

export interface Logger {
  debug(message: string, fields?: LogFields): LogRecord | null;
  info(message: string, fields?: LogFields): LogRecord | null;
  warn(message: string, fields?: LogFields): LogRecord | null;
  error(message: string, fields?: LogFields): LogRecord | null;
  /** Derives a logger that stamps every record with extra fields (e.g. request_id). */
  child(fields: LogFields): Logger;
}

const RESERVED = new Set([
  "request_id",
  "event",
  "duration_ms",
  "status",
  "service",
  "environment",
  "timestamp",
  "level",
  "message",
]);

export function formatLine(record: LogRecord, format: "json" | "pretty"): string {
  if (format === "json") {
    return JSON.stringify({
      timestamp: record.timestamp,
      level: record.level,
      service: record.service,
      environment: record.environment,
      event: record.event,
      request_id: record.request_id,
      duration_ms: record.duration_ms,
      status: record.status,
      message: record.message,
      ...record.fields,
    });
  }
  const parts = [
    record.level.padEnd(5),
    record.event,
    record.message,
    record.request_id ? `req=${record.request_id}` : "",
    record.duration_ms != null ? `${record.duration_ms}ms` : "",
    record.status != null ? `status=${record.status}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

function defaultSink(record: LogRecord, line: string): void {
  if (record.level === "ERROR") console.error(line);
  else if (record.level === "WARN") console.warn(line);
  else console.log(line);
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const service = options.service ?? "career-connect";
  const environment =
    options.environment ??
    (typeof process !== "undefined" ? (process.env["NODE_ENV"] ?? "development") : "development");
  const format = options.format ?? (environment === "production" ? "json" : "pretty");
  const minLevel =
    LEVEL_WEIGHT[options.minLevel ?? (environment === "production" ? "INFO" : "DEBUG")];
  const clock = options.clock ?? (() => new Date());
  const sink = options.sink ?? defaultSink;
  const base = options.base ?? {};

  const emit = (level: LogLevel, message: string, fields?: LogFields): LogRecord | null => {
    if (LEVEL_WEIGHT[level] < minLevel) return null;
    const merged: LogFields = { ...base, ...(fields ?? {}) };
    const extra: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(merged)) {
      if (!RESERVED.has(key)) extra[key] = value;
    }
    const record: LogRecord = {
      timestamp: clock().toISOString(),
      level,
      service,
      environment,
      event: String(merged.event ?? "app.event"),
      request_id: (merged.request_id as string | undefined) ?? null,
      duration_ms: typeof merged.duration_ms === "number" ? Math.round(merged.duration_ms) : null,
      status: (merged.status as string | number | undefined) ?? null,
      message: String(message).slice(0, 500),
      fields: redactFields(extra),
    };
    sink(record, formatLine(record, format));
    return record;
  };

  const logger: Logger = {
    debug: (message, fields) => emit("DEBUG", message, fields),
    info: (message, fields) => emit("INFO", message, fields),
    warn: (message, fields) => emit("WARN", message, fields),
    error: (message, fields) => emit("ERROR", message, fields),
    child: (fields) => createLogger({ ...options, base: { ...base, ...fields } }),
  };
  return logger;
}

/** Process-wide logger for server code that has no request context. */
export const logger = createLogger();

/** Per-request logger — correlates every downstream event with one request id. */
export function requestLogger(requestId: string, fields: LogFields = {}): Logger {
  return logger.child({ request_id: requestId, ...fields });
}
