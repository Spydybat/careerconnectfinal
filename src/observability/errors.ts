/**
 * Sprint 14 — centralized error classification.
 *
 * Every server failure is classified once. The client receives a safe,
 * generic message plus the request id; the diagnostic detail is logged
 * server-side only.
 */

import { redactSecrets } from "@/security/sanitize";
import { logger as rootLogger, type Logger } from "./logger";

export const ERROR_KINDS = [
  "validation_error",
  "authentication_error",
  "authorization_error",
  "database_error",
  "storage_error",
  "ai_error",
  "etl_error",
  "external_service_error",
  "unexpected_error",
] as const;

export type ErrorKind = (typeof ERROR_KINDS)[number];

export interface ClassifiedError {
  kind: ErrorKind;
  status: number;
  /** Safe to show a user. */
  clientMessage: string;
  /** Server-side only. */
  detail: string;
  retryable: boolean;
}

const DEFAULTS: Record<ErrorKind, { status: number; clientMessage: string; retryable: boolean }> = {
  validation_error: {
    status: 400,
    clientMessage: "Some of the submitted values are invalid.",
    retryable: false,
  },
  authentication_error: {
    status: 401,
    clientMessage: "Please sign in to continue.",
    retryable: false,
  },
  authorization_error: {
    status: 403,
    clientMessage: "You do not have access to this resource.",
    retryable: false,
  },
  database_error: {
    status: 503,
    clientMessage: "We could not reach the database. Please retry shortly.",
    retryable: true,
  },
  storage_error: {
    status: 503,
    clientMessage: "File storage is unavailable. Please retry shortly.",
    retryable: true,
  },
  ai_error: {
    status: 503,
    clientMessage: "The AI service is unavailable right now.",
    retryable: true,
  },
  etl_error: { status: 500, clientMessage: "A data pipeline operation failed.", retryable: true },
  external_service_error: {
    status: 502,
    clientMessage: "An upstream service is unavailable.",
    retryable: true,
  },
  unexpected_error: {
    status: 500,
    clientMessage: "Something went wrong. Please try again.",
    retryable: false,
  },
};

const MATCHERS: { kind: ErrorKind; test: RegExp }[] = [
  {
    kind: "validation_error",
    test: /\b(zod|validation|invalid input|invalid value|required field|parse error|schema)\b/i,
  },
  {
    kind: "authentication_error",
    test: /\b(unauthorized|not authenticated|no session|jwt expired|invalid token|401)\b/i,
  },
  {
    kind: "authorization_error",
    test: /\b(forbidden|not allowed|access denied|permission denied|row-level security|rls|403)\b/i,
  },
  {
    kind: "database_error",
    test: /\b(postgres|pgrst|supabase|database|relation .* does not exist|deadlock|connection refused|timeout expired)\b/i,
  },
  {
    kind: "storage_error",
    test: /\b(storage|bucket|object not found|upload failed|download failed)\b/i,
  },
  {
    kind: "ai_error",
    test: /\b(ai gateway|model|completion|provider|rate.?limit(ed)? by provider|quota)\b/i,
  },
  { kind: "etl_error", test: /\b(etl|pipeline|watermark|quarantine|reconcil)\b/i },
  {
    kind: "external_service_error",
    test: /\b(fetch failed|econnreset|enotfound|bad gateway|upstream|502|504)\b/i,
  },
];

/** Errors thrown by app code can declare their own class. */
export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly detail: string;
  constructor(kind: ErrorKind, message: string, detail?: string) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.detail = detail ?? message;
  }
}

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof AppError) {
    const base = DEFAULTS[error.kind];
    return {
      kind: error.kind,
      status: base.status,
      clientMessage: error.message || base.clientMessage,
      detail: redactSecrets(error.detail).slice(0, 500),
      retryable: base.retryable,
    };
  }

  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "unknown error";
  const status =
    error != null && typeof error === "object" && "status" in error
      ? Number((error as { status: unknown }).status)
      : undefined;

  let kind: ErrorKind = "unexpected_error";
  if (status === 401) kind = "authentication_error";
  else if (status === 403) kind = "authorization_error";
  else if (status === 400 || status === 422) kind = "validation_error";
  else {
    const match = MATCHERS.find((m) => m.test.test(raw));
    if (match) kind = match.kind;
  }

  const base = DEFAULTS[kind];
  return {
    kind,
    status: status && status >= 400 && status < 600 ? status : base.status,
    clientMessage: base.clientMessage,
    detail: redactSecrets(raw).slice(0, 500),
    retryable: base.retryable,
  };
}

/** Classify, log server-side with correlation, and return the safe payload. */
export function reportError(
  error: unknown,
  context: { requestId?: string | null; event?: string; logger?: Logger } & Record<
    string,
    unknown
  > = {},
): ClassifiedError {
  const { requestId, event, logger: injected, ...rest } = context;
  const classified = classifyError(error);
  (injected ?? rootLogger).error(classified.detail, {
    request_id: requestId ?? null,
    event: event ?? "app.error",
    status: classified.status,
    error_kind: classified.kind,
    retryable: classified.retryable,
    ...rest,
  });
  return classified;
}

/** The only error shape a client may receive. */
export function toClientError(
  classified: ClassifiedError,
  requestId?: string | null,
): { error: { kind: ErrorKind; message: string; request_id: string | null } } {
  return {
    error: {
      kind: classified.kind,
      message: classified.clientMessage,
      request_id: requestId ?? null,
    },
  };
}
