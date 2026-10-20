/** Typed pipeline errors with retry semantics. */

export type EtlStage =
  | "extract"
  | "load_raw"
  | "validate"
  | "clean"
  | "normalize"
  | "dedupe"
  | "quality"
  | "curate"
  | "warehouse"
  | "mart"
  | "reconcile"
  | "archive";

export class EtlError extends Error {
  readonly stage: EtlStage;
  readonly dataset: string;
  readonly retryable: boolean;
  readonly cause_message: string | undefined;

  constructor(
    stage: EtlStage,
    dataset: string,
    message: string,
    options: { retryable?: boolean; cause?: unknown } = {},
  ) {
    super(`[${stage}:${dataset}] ${message}`);
    this.name = "EtlError";
    this.stage = stage;
    this.dataset = dataset;
    this.retryable = options.retryable ?? false;
    this.cause_message = options.cause instanceof Error ? options.cause.message : undefined;
  }
}

/** Runs `fn`, retrying retryable failures with deterministic (no jitter) backoff. */
export function withRetry<T>(
  fn: () => T,
  options: { attempts?: number; onRetry?: (attempt: number, error: unknown) => void } = {},
): T {
  const attempts = options.attempts ?? 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      const retryable = error instanceof EtlError ? error.retryable : false;
      if (!retryable || attempt === attempts) break;
      options.onRetry?.(attempt, error);
    }
  }
  throw lastError;
}
