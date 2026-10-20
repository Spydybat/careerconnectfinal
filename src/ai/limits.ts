import { AiError, type AiFeature } from "./types";

/**
 * Sprint 11 — cost and abuse controls.
 *
 * All limits are declared here as data so they can be reviewed in one place
 * and asserted in tests. Enforcement helpers are pure; the server-side
 * counters that feed them live in usage.server.ts.
 */

export type AiLimits = {
  /** Maximum characters of user-supplied free text per feature. */
  maxUserInputChars: number;
  /** Maximum characters of the fully assembled prompt sent to a provider. */
  maxPromptChars: number;
  maxOutputTokens: number;
  requestTimeoutMs: number;
  /** Retries after the first attempt, per model. */
  maxRetries: number;
  /** Per user, rolling window. */
  perUserPerHour: number;
  perUserPerDay: number;
  /** Hard stop on spend attributable to one user in a day. */
  perUserDailyCostUsd: number;
};

export const AI_LIMITS: Record<AiFeature, AiLimits> = {
  career_coach: base({ maxUserInputChars: 4000, perUserPerHour: 30, perUserPerDay: 120 }),
  skill_gap: base({ maxUserInputChars: 2000, perUserPerHour: 10, perUserPerDay: 30 }),
  mock_interview_questions: base({ maxUserInputChars: 500, perUserPerHour: 10, perUserPerDay: 25 }),
  mock_interview_evaluation: base({
    maxUserInputChars: 6000,
    perUserPerHour: 40,
    perUserPerDay: 150,
  }),
  resume_analysis: base({ maxUserInputChars: 20000, perUserPerHour: 6, perUserPerDay: 20 }),
  skill_extraction: base({ maxUserInputChars: 20000, perUserPerHour: 6, perUserPerDay: 20 }),
  career_recommendation: base({ maxUserInputChars: 4000, perUserPerHour: 10, perUserPerDay: 30 }),
  learning_recommendation: base({ maxUserInputChars: 4000, perUserPerHour: 10, perUserPerDay: 30 }),
  job_matching: base({ maxUserInputChars: 12000, perUserPerHour: 15, perUserPerDay: 60 }),
};

function base(overrides: Partial<AiLimits> & { maxUserInputChars: number }): AiLimits {
  return {
    maxPromptChars: 48000,
    maxOutputTokens: 4096,
    requestTimeoutMs: 90000,
    maxRetries: 2,
    perUserPerHour: 20,
    perUserPerDay: 60,
    perUserDailyCostUsd: 1.5,
    ...overrides,
  };
}

export function limitsFor(feature: AiFeature): AiLimits {
  return AI_LIMITS[feature];
}

/** Rejects oversized free-text input before any provider is contacted. */
export function assertInputSize(feature: AiFeature, text: string): string {
  const { maxUserInputChars } = limitsFor(feature);
  if (text.length > maxUserInputChars) {
    throw new AiError(
      "input_too_large",
      `That input is too long. Please shorten it to under ${maxUserInputChars.toLocaleString()} characters.`,
      "blocked",
    );
  }
  return text;
}

/** Truncates the assembled prompt to the feature budget (defence in depth). */
export function capPrompt(feature: AiFeature, prompt: string): string {
  const { maxPromptChars } = limitsFor(feature);
  return prompt.length <= maxPromptChars
    ? prompt
    : `${prompt.slice(0, maxPromptChars)}\n[truncated]`;
}

export type UsageWindow = {
  lastHour: number;
  lastDay: number;
  costTodayUsd: number;
};

export type QuotaDecision =
  { allowed: true } | { allowed: false; reason: "hourly" | "daily" | "cost"; message: string };

/** Pure quota evaluation — the caller supplies the measured window. */
export function evaluateQuota(feature: AiFeature, window: UsageWindow): QuotaDecision {
  const limits = limitsFor(feature);
  if (window.lastHour >= limits.perUserPerHour) {
    return {
      allowed: false,
      reason: "hourly",
      message: "You've reached this hour's AI limit. Please try again shortly.",
    };
  }
  if (window.lastDay >= limits.perUserPerDay) {
    return {
      allowed: false,
      reason: "daily",
      message: "You've reached today's AI limit for this feature.",
    };
  }
  if (window.costTodayUsd >= limits.perUserDailyCostUsd) {
    return {
      allowed: false,
      reason: "cost",
      message: "You've reached today's AI usage allowance.",
    };
  }
  return { allowed: true };
}

export function assertQuota(feature: AiFeature, window: UsageWindow): void {
  const decision = evaluateQuota(feature, window);
  if (!decision.allowed) {
    throw new AiError("rate_limited", decision.message, "rate_limited");
  }
}
