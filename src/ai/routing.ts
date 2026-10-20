import type { AiModelConfig } from "./types";
import {
  classifyFailure,
  isRetryable,
  type AiFailureKind,
  type AiProviderConfig,
} from "./provider";
import type { AiProviderId } from "./types";

/**
 * Pure provider routing core.
 *
 * Primary provider -> retry (transient only) -> fallback provider -> ... ->
 * controlled failure. It never loops forever: total attempts are bounded by
 * the chain length and each model's retryLimit.
 *
 * This module has no I/O so it is exhaustively unit-testable; the server
 * router supplies the `invoke` callback that actually talks to an adapter.
 */

export type RouteAttempt = {
  provider: AiProviderId;
  model: string;
  attempt: number;
  ok: boolean;
  failure?: AiFailureKind;
  latencyMs: number;
};

export type RouteSuccess<T> = {
  ok: true;
  data: T;
  provider: AiProviderId;
  model: string;
  attempts: RouteAttempt[];
  fallbacksUsed: AiProviderId[];
};

export type RouteFailure = {
  ok: false;
  failure: AiFailureKind;
  message: string;
  attempts: RouteAttempt[];
  fallbacksUsed: AiProviderId[];
};

export type RouteInvoke<T> = (
  model: AiModelConfig,
  config: AiProviderConfig,
  signal: AbortSignal,
) => Promise<T>;

export type RouteCoreOptions<T> = {
  models: AiModelConfig[];
  invoke: RouteInvoke<T>;
  /** Injectable for tests; defaults to Date.now. */
  now?: () => number;
  /** Injectable for tests; defaults to a real timer. */
  wait?: (ms: number) => Promise<void>;
  temperature?: number;
};

export function toProviderConfig(model: AiModelConfig, temperature = 0.3): AiProviderConfig {
  return {
    provider: model.provider,
    model: model.id,
    timeoutMs: model.timeoutMs,
    maxOutputTokens: model.maxOutputTokens,
    temperature,
    retryLimit: model.maxRetries,
    maxInputChars: model.maxInputChars,
  };
}

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function routeWithFallback<T>(
  options: RouteCoreOptions<T>,
): Promise<RouteSuccess<T> | RouteFailure> {
  const now = options.now ?? (() => Date.now());
  const wait = options.wait ?? defaultWait;
  const attempts: RouteAttempt[] = [];
  const fallbacksUsed: AiProviderId[] = [];

  if (options.models.length === 0) {
    return {
      ok: false,
      failure: "not_configured",
      message: "No AI model is available for this feature.",
      attempts,
      fallbacksUsed,
    };
  }

  let lastFailure: AiFailureKind = "provider_error";
  let lastMessage = "AI request failed";

  for (let modelIndex = 0; modelIndex < options.models.length; modelIndex += 1) {
    const model = options.models[modelIndex]!;
    const config = toProviderConfig(model, options.temperature);

    for (let attempt = 0; attempt <= model.maxRetries; attempt += 1) {
      const startedAt = now();
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(new Error(`Provider timeout after ${model.timeoutMs}ms`)),
        model.timeoutMs,
      );

      try {
        const data = await options.invoke(model, config, controller.signal);
        clearTimeout(timer);
        attempts.push({
          provider: model.provider,
          model: model.id,
          attempt: attempt + 1,
          ok: true,
          latencyMs: now() - startedAt,
        });
        return {
          ok: true,
          data,
          provider: model.provider,
          model: model.id,
          attempts,
          fallbacksUsed,
        };
      } catch (error) {
        clearTimeout(timer);
        const failure = classifyFailure(error);
        lastFailure = failure;
        lastMessage = error instanceof Error ? error.message : String(error);
        attempts.push({
          provider: model.provider,
          model: model.id,
          attempt: attempt + 1,
          ok: false,
          failure,
          latencyMs: now() - startedAt,
        });

        const canRetry = isRetryable(failure) && attempt < model.maxRetries;
        if (!canRetry) break;
        // Bounded exponential backoff — capped so a request can never hang.
        await wait(Math.min(2000, 250 * 2 ** attempt));
      }
    }

    if (modelIndex < options.models.length - 1) fallbacksUsed.push(model.provider);
  }

  return { ok: false, failure: lastFailure, message: lastMessage, attempts, fallbacksUsed };
}
