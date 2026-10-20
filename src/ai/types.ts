/**
 * Sprint 10 — AI Intelligence Platform
 * Core types for the provider abstraction and request pipeline.
 *
 * The AI layer is never a source of truth. It reads from the operational
 * database, the warehouse marts and the reference taxonomies, and returns
 * schema-validated, guardrail-checked structured output.
 */

export type AiProviderId = "openai" | "gemini" | "claude";

export type AiFeature =
  | "resume_analysis"
  | "skill_extraction"
  | "skill_gap"
  | "career_recommendation"
  | "learning_recommendation"
  | "job_matching"
  | "career_coach"
  | "mock_interview_questions"
  | "mock_interview_evaluation";

export type AiRequestStatus = "success" | "error" | "blocked" | "rate_limited";

export type AiModelConfig = {
  /** Gateway model id, e.g. "google/gemini-3.6-flash". */
  id: string;
  provider: AiProviderId;
  label: string;
  /** Maximum characters accepted as prompt input (cost control). */
  maxInputChars: number;
  /** Maximum completion tokens requested from the provider. */
  maxOutputTokens: number;
  /** Hard wall-clock timeout for a single attempt, milliseconds. */
  timeoutMs: number;
  /** Attempts after the first one. */
  maxRetries: number;
  /** Estimated USD per 1M tokens, used for cost reporting only. */
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  /** False when the model is not reachable through the current gateway. */
  available: boolean;
};

export type AiGenerationRequest = {
  feature: AiFeature;
  system: string;
  prompt: string;
  /** Zod schema is passed separately; this is metadata only. */
  schemaName: string;
};

export type AiTokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type AiGenerationResult<T> = {
  data: T;
  provider: AiProviderId;
  model: string;
  usage: AiTokenUsage;
  latencyMs: number;
  attempts: number;
  /** Providers that failed before the successful one. */
  fallbacksUsed: AiProviderId[];
  estimatedCostUsd: number;
};

export type AiUsageRecord = {
  requestId: string;
  userId: string | null;
  feature: AiFeature;
  provider: AiProviderId | null;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  status: AiRequestStatus;
  errorMessage: string | null;
};

export class AiError extends Error {
  readonly code:
    | "not_configured"
    | "unauthorized"
    | "input_too_large"
    | "blocked_input"
    | "blocked_output"
    | "invalid_output"
    | "rate_limited"
    | "usage_limit"
    | "provider_failed"
    | "timeout";

  readonly status: AiRequestStatus;

  constructor(code: AiError["code"], message: string, status: AiRequestStatus = "error") {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
  }
}
