import type { z } from "zod";
import { AI_MODELS } from "../models";
import type { AiProviderId } from "../types";
import type {
  AiProvider,
  AiProviderConfig,
  AiProviderHealth,
  AiProviderRequest,
  AiProviderResponse,
} from "../provider";

/**
 * Gateway-backed provider adapters.
 *
 * All three vendors are reached through the Lovable AI Gateway, but each one
 * gets its own adapter object so vendor differences (endpoint family, request
 * shaping, availability) stay inside the adapter and never reach features.
 *
 * Server-only: reads LOVABLE_API_KEY.
 */

type AdapterSpec = {
  id: AiProviderId;
  /** OpenAI reasoning models are served by the gateway Responses API. */
  endpoint: "chat" | "responses";
};

function catalogueFor(provider: AiProviderId) {
  return Object.values(AI_MODELS).filter((model) => model.provider === provider);
}

function isAvailable(provider: AiProviderId): boolean {
  return catalogueFor(provider).some((model) => model.available);
}

function requireKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("not configured: LOVABLE_API_KEY is missing");
  return key;
}

async function chatModel(modelId: string) {
  const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(requireKey());
  return gateway(modelId);
}

function createAdapter(spec: AdapterSpec): AiProvider {
  async function call<T>(
    request: AiProviderRequest,
    config: AiProviderConfig,
    schema?: z.ZodType<T>,
  ): Promise<AiProviderResponse<T | string>> {
    if (!isAvailable(spec.id)) {
      // OpenAI models on this gateway are served by the Responses API, which is
      // not enabled for this project; Claude is not offered at all. Both stay
      // declared so the router and admin console can reason about them.
      throw new Error(`unavailable: the ${spec.id} provider is not enabled for this project`);
    }

    const { streamText, Output } = await import("ai");
    const model = await chatModel(config.model);

    // Always streamed: buffered gateway calls are severed by the platform
    // request timeout on long generations, and are still billed.
    const result = streamText({
      model,
      ...(request.signal ? { abortSignal: request.signal } : {}),
      temperature: config.temperature,
      system: request.system,
      prompt: request.prompt.slice(0, config.maxInputChars),
      ...(schema ? { output: Output.object({ schema }) } : {}),
    });

    const data = schema
      ? ((await result.output) as T)
      : ((await result.text) as unknown as T | string);
    const usageRaw = await result.usage;

    return {
      data,
      usage: {
        inputTokens: usageRaw?.inputTokens ?? 0,
        outputTokens: usageRaw?.outputTokens ?? 0,
      },
      provider: spec.id,
      model: config.model,
    };
  }

  return {
    id: spec.id,
    async generate(request, config) {
      return (await call(request, config)) as AiProviderResponse<string>;
    },
    async structuredGenerate<T>(
      request: AiProviderRequest,
      schema: z.ZodType<T>,
      config: AiProviderConfig,
    ) {
      return (await call<T>(request, config, schema)) as AiProviderResponse<T>;
    },
    async healthCheck(): Promise<AiProviderHealth> {
      const checkedAt = new Date().toISOString();
      if (!process.env["LOVABLE_API_KEY"]) {
        return { provider: spec.id, available: false, detail: "AI key not configured", checkedAt };
      }
      if (!isAvailable(spec.id)) {
        return {
          provider: spec.id,
          available: false,
          detail: "No enabled model in the catalogue for this provider",
          checkedAt,
        };
      }
      return { provider: spec.id, available: true, detail: "Gateway model available", checkedAt };
    },
  };
}

export const openAiProvider = createAdapter({ id: "openai", endpoint: "responses" });
export const geminiProvider = createAdapter({ id: "gemini", endpoint: "chat" });
export const claudeProvider = createAdapter({ id: "claude", endpoint: "chat" });

export const AI_PROVIDER_ADAPTERS: Record<AiProviderId, AiProvider> = {
  openai: openAiProvider,
  gemini: geminiProvider,
  claude: claudeProvider,
};

export function getProvider(id: AiProviderId): AiProvider {
  return AI_PROVIDER_ADAPTERS[id];
}

export async function checkAllProviders(): Promise<AiProviderHealth[]> {
  return Promise.all(Object.values(AI_PROVIDER_ADAPTERS).map((provider) => provider.healthCheck()));
}
