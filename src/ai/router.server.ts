import type { z } from "zod";
import { AI_MODELS, estimateCostUsd, resolveChain, type AiModelChain } from "./models";
import {
  AiError,
  type AiFeature,
  type AiGenerationResult,
  type AiModelConfig,
  type AiProviderId,
} from "./types";
import { guardOutputText } from "./guardrails";
import { capPrompt } from "./limits";
import { validateAiOutput } from "./schemas";
import { routeWithFallback, type RouteInvoke } from "./routing";
import { getProvider } from "./providers/gateway.server";
import { checkUserQuota, newRequestId, recordAiUsage } from "./usage.server";
import type { AiProviderConfig, AiProviderResponse } from "./provider";

/**
 * The AI router (Sprint 11).
 *
 * Responsibilities:
 *  - enforce per-user quotas and prompt size caps before any provider call
 *  - resolve a model chain to concrete, available providers
 *  - delegate the call to a provider adapter (no vendor logic lives here)
 *  - bound each attempt with a timeout, retry only transient failures
 *  - fall through to the fallback provider, then fail in a controlled way
 *  - validate structured output against a Zod schema before returning it
 *  - record usage, cost and latency for every request
 *
 * Server-only: must never be imported from client code.
 */

export type RouteOptions<T> = {
  feature: AiFeature;
  chain: AiModelChain;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Auth context used for authorization, quotas and usage attribution. */
  userId: string | null;
  temperature?: number;
  /** Test seam: overrides the provider adapter call. */
  invokeOverride?: (
    model: AiModelConfig,
    config: AiProviderConfig,
    signal: AbortSignal,
  ) => Promise<AiProviderResponse<unknown>>;
  /** Test seam: overrides the resolved model chain. */
  modelsOverride?: AiModelConfig[];
  /** Skips the database quota read (used by evaluation fixtures). */
  skipQuota?: boolean;
};

export async function routeStructured<T>(options: RouteOptions<T>): Promise<AiGenerationResult<T>> {
  const requestId = newRequestId();
  const startedAt = Date.now();

  if (!options.invokeOverride && !process.env["LOVABLE_API_KEY"]) {
    throw new AiError("not_configured", "AI is not configured for this project yet.");
  }

  if (options.userId && !options.skipQuota) {
    const quota = await checkUserQuota(options.userId, options.feature);
    if (!quota.allowed) {
      await recordAiUsage({
        requestId,
        userId: options.userId,
        feature: options.feature,
        provider: null,
        model: null,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        latencyMs: 0,
        status: "rate_limited",
        errorMessage: "quota exceeded",
      });
      throw new AiError("rate_limited", quota.reason ?? "AI limit reached.", "rate_limited");
    }
  }

  const models = options.modelsOverride ?? resolveChain(options.chain);
  const prompt = capPrompt(options.feature, options.prompt);

  let usage = { inputTokens: 0, outputTokens: 0 };

  const invoke: RouteInvoke<T> = async (model, config, signal) => {
    const response = options.invokeOverride
      ? await options.invokeOverride(model, config, signal)
      : await getProvider(model.provider).structuredGenerate<T>(
          { feature: options.feature, system: options.system, prompt, signal },
          options.schema,
          config,
        );

    usage = response.usage ?? usage;

    // Model output is untrusted until it validates.
    const validation = validateAiOutput(options.schema, response.data);
    if (!validation.ok) {
      throw new Error(
        `invalid output: schema validation failed (${validation.issues[0] ?? "unknown"})`,
      );
    }
    guardOutputText(JSON.stringify(validation.data));
    return validation.data;
  };

  const outcome = await routeWithFallback<T>({
    models,
    invoke,
    ...(options.temperature === undefined ? {} : { temperature: options.temperature }),
  });

  const latencyMs = Date.now() - startedAt;

  if (outcome.ok) {
    const model = AI_MODELS[outcome.model];
    const estimatedCostUsd = model
      ? estimateCostUsd(model, usage.inputTokens, usage.outputTokens)
      : 0;

    await recordAiUsage({
      requestId,
      userId: options.userId,
      feature: options.feature,
      provider: outcome.provider,
      model: outcome.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostUsd,
      latencyMs,
      status: "success",
      errorMessage: null,
    });

    return {
      data: outcome.data,
      provider: outcome.provider,
      model: outcome.model,
      usage,
      latencyMs,
      attempts: outcome.attempts.length,
      fallbacksUsed: outcome.fallbacksUsed,
      estimatedCostUsd,
    };
  }

  const status = outcome.failure === "rate_limited" ? "rate_limited" : "error";
  await recordAiUsage({
    requestId,
    userId: options.userId,
    feature: options.feature,
    provider: null,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    latencyMs,
    status,
    errorMessage: outcome.message,
  });

  throw toControlledError(outcome.failure, outcome.message);
}

/** Maps an internal failure kind onto a safe, user-facing application error. */
export function toControlledError(failure: string, message: string): AiError {
  if (/402|credit/i.test(message)) {
    return new AiError("usage_limit", "The AI workspace has run out of credits.");
  }
  switch (failure) {
    case "rate_limited":
      return new AiError(
        "rate_limited",
        "The AI service is busy right now. Please try again in a moment.",
        "rate_limited",
      );
    case "timeout":
      return new AiError("timeout", "The AI service took too long to respond. Please try again.");
    case "invalid_output":
      return new AiError(
        "invalid_output",
        "The AI response could not be understood. Please retry.",
      );
    case "not_configured":
      return new AiError("not_configured", "AI is not available for this project right now.");
    default:
      return new AiError("provider_failed", "The AI service could not complete that request.");
  }
}

export function describeCatalogue() {
  return Object.values(AI_MODELS).map((model) => ({
    id: model.id,
    provider: model.provider,
    label: model.label,
    available: model.available,
    inputCostPerMillion: model.inputCostPerMillion,
    outputCostPerMillion: model.outputCostPerMillion,
  }));
}

export function providersForChain(chain: AiModelChain): AiProviderId[] {
  return resolveChain(chain).map((model) => model.provider);
}
