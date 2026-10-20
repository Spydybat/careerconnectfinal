import type { AiModelConfig, AiProviderId } from "./types";

/**
 * Model registry for the Sprint 10 AI platform.
 *
 * Every model the app may call is declared here with its cost, limits and
 * availability. Feature code never hardcodes a model id — it asks the router
 * for a chain and the router resolves it against this registry.
 */
export const AI_MODELS: Record<string, AiModelConfig> = {
  "google/gemini-3.6-flash": {
    id: "google/gemini-3.6-flash",
    provider: "gemini",
    label: "Gemini 3.6 Flash",
    maxInputChars: 24000,
    maxOutputTokens: 4096,
    timeoutMs: 90000,
    maxRetries: 2,
    inputCostPerMillion: 0.3,
    outputCostPerMillion: 2.5,
    available: true,
  },
  "google/gemini-3.1-flash-lite": {
    id: "google/gemini-3.1-flash-lite",
    provider: "gemini",
    label: "Gemini 3.1 Flash Lite",
    maxInputChars: 16000,
    maxOutputTokens: 2048,
    timeoutMs: 60000,
    maxRetries: 2,
    inputCostPerMillion: 0.1,
    outputCostPerMillion: 0.4,
    available: true,
  },
  "google/gemini-3.1-pro-preview": {
    id: "google/gemini-3.1-pro-preview",
    provider: "gemini",
    label: "Gemini 3.1 Pro",
    maxInputChars: 48000,
    maxOutputTokens: 8192,
    timeoutMs: 120000,
    maxRetries: 1,
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 10,
    available: true,
  },
  /**
   * OpenAI models are reachable through the gateway but only on the Responses
   * API, which this chat-completions router does not speak. They are declared
   * so cost reporting and the admin console can show the full catalogue, and
   * marked unavailable so the router skips them instead of failing at runtime.
   */
  "openai/gpt-5.4-mini": {
    id: "openai/gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 Mini",
    maxInputChars: 24000,
    maxOutputTokens: 4096,
    timeoutMs: 120000,
    maxRetries: 1,
    inputCostPerMillion: 0.45,
    outputCostPerMillion: 3.6,
    available: false,
  },
  /** Claude is not offered by the gateway on this project. */
  "anthropic/claude-sonnet": {
    id: "anthropic/claude-sonnet",
    provider: "claude",
    label: "Claude Sonnet",
    maxInputChars: 24000,
    maxOutputTokens: 4096,
    timeoutMs: 120000,
    maxRetries: 1,
    inputCostPerMillion: 3,
    outputCostPerMillion: 15,
    available: false,
  },
};

/**
 * Ordered preference chains. The router walks a chain and uses the first
 * available model; if a call fails after its retries it falls through to the
 * next entry.
 */
export const AI_MODEL_CHAINS = {
  /** Cheap, high volume, short output. */
  fast: ["google/gemini-3.1-flash-lite", "google/gemini-3.6-flash"],
  /** Default balance of quality, latency and cost. */
  balanced: ["google/gemini-3.6-flash", "google/gemini-3.1-flash-lite"],
  /** Long context or nuanced reasoning. */
  deep: ["google/gemini-3.1-pro-preview", "google/gemini-3.6-flash"],
} as const;

export type AiModelChain = keyof typeof AI_MODEL_CHAINS;

export function resolveChain(chain: AiModelChain): AiModelConfig[] {
  return AI_MODEL_CHAINS[chain]
    .map((id) => AI_MODELS[id])
    .filter((model): model is AiModelConfig => Boolean(model?.available));
}

export function estimateCostUsd(
  model: AiModelConfig,
  inputTokens: number,
  outputTokens: number,
): number {
  const cost =
    (inputTokens / 1_000_000) * model.inputCostPerMillion +
    (outputTokens / 1_000_000) * model.outputCostPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function providersInCatalogue(): AiProviderId[] {
  return Array.from(new Set(Object.values(AI_MODELS).map((m) => m.provider)));
}
