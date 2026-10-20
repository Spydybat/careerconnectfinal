import type { z } from "zod";
import type { AiFeature, AiProviderId, AiTokenUsage } from "./types";

/**
 * Sprint 11 — provider abstraction.
 *
 * Application code never talks to a vendor SDK. It talks to this contract.
 * Every adapter (OpenAI, Gemini, Claude) implements exactly these three
 * capabilities and nothing else, so no provider-specific business logic can
 * leak into features.
 */

export type AiProviderConfig = {
  provider: AiProviderId;
  /** Concrete model id from the model registry. */
  model: string;
  /** Wall-clock budget for a single attempt. */
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  /** Attempts after the first one, for retryable failures only. */
  retryLimit: number;
  /** Hard cap on prompt characters (cost control). */
  maxInputChars: number;
};

export type AiProviderRequest = {
  feature: AiFeature;
  system: string;
  prompt: string;
  /** Abort signal owned by the router; adapters must honour it. */
  signal?: AbortSignal;
};

export type AiProviderResponse<T> = {
  data: T;
  usage: AiTokenUsage;
  provider: AiProviderId;
  model: string;
};

export type AiProviderHealth = {
  provider: AiProviderId;
  available: boolean;
  /** Human readable reason when unavailable. Never contains secrets. */
  detail: string;
  checkedAt: string;
};

export interface AiProvider {
  readonly id: AiProviderId;
  /** Free-text completion. */
  generate(
    request: AiProviderRequest,
    config: AiProviderConfig,
  ): Promise<AiProviderResponse<string>>;
  /** Schema-constrained completion. The adapter must return parsed data. */
  structuredGenerate<T>(
    request: AiProviderRequest,
    schema: z.ZodType<T>,
    config: AiProviderConfig,
  ): Promise<AiProviderResponse<T>>;
  /** Cheap reachability/configuration probe used by the router and admin console. */
  healthCheck(): Promise<AiProviderHealth>;
}

export type AiFailureKind =
  "timeout" | "rate_limited" | "invalid_output" | "not_configured" | "provider_error";

const TIMEOUT = /\b(timeout|timed out|abort(ed)?|ETIMEDOUT)\b/i;
const RATE_LIMIT = /\b(429|rate.?limit|quota|overloaded|too many requests)\b/i;
const TRANSIENT = /\b(500|502|503|504|fetch failed|ECONNRESET|network)\b/i;
const INVALID_OUTPUT = /\b(no ?object ?generated|invalid json|schema|zod|validation)\b/i;
const NOT_CONFIGURED = /\b(401|403|unauthorized|not configured|missing api key|unavailable)\b/i;

/** Deterministic error classification shared by the router and its tests. */
export function classifyFailure(error: unknown): AiFailureKind {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (TIMEOUT.test(message)) return "timeout";
  if (RATE_LIMIT.test(message)) return "rate_limited";
  if (INVALID_OUTPUT.test(message)) return "invalid_output";
  if (NOT_CONFIGURED.test(message)) return "not_configured";
  if (TRANSIENT.test(message)) return "provider_error";
  return "provider_error";
}

/** Only transient conditions may be retried on the same model. */
export function isRetryable(kind: AiFailureKind): boolean {
  return kind === "timeout" || kind === "rate_limited" || kind === "provider_error";
}
