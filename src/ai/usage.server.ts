import { randomUUID } from "node:crypto";
import type { AiFeature, AiProviderId, AiRequestStatus, AiUsageRecord } from "./types";
import { evaluateQuota, type UsageWindow } from "./limits";

/**
 * Sprint 11 — AI usage tracking and quota measurement.
 *
 * Every AI request is recorded with request_id, user, feature, provider,
 * model, status, latency, tokens and estimated cost. Prompt and completion
 * bodies are deliberately NOT stored — only a truncated, non-sensitive error
 * message when a request fails.
 */

export function newRequestId(): string {
  try {
    return randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

/** Strips anything that looks like user content or a credential from an error. */
export function redactErrorMessage(message: string): string {
  return message
    .replace(/sk-[A-Za-z0-9]{8,}/g, "[redacted]")
    .replace(/sb_secret_[A-Za-z0-9_-]{6,}/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g, "[redacted]")
    .replace(/["'][^"']{200,}["']/g, '"[redacted]"')
    .slice(0, 300);
}

export async function recordAiUsage(record: AiUsageRecord): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_usage_logs").insert({
      id: record.requestId,
      user_id: record.userId,
      feature: record.feature,
      provider: record.provider,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      estimated_cost_usd: record.estimatedCostUsd,
      latency_ms: record.latencyMs,
      status: record.status,
      error_message: record.errorMessage ? redactErrorMessage(record.errorMessage) : null,
    });
  } catch (error) {
    // Usage logging must never break the feature it measures.
    console.error("ai usage log failed", error);
  }
}

/** Measures a user's rolling usage window for quota enforcement. */
export async function readUsageWindow(userId: string, feature: AiFeature): Promise<UsageWindow> {
  const empty: UsageWindow = { lastHour: 0, lastDay: 0, costTodayUsd: 0 };
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hourAgo = Date.now() - 60 * 60 * 1000;

    const { data } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("created_at, estimated_cost_usd, feature")
      .eq("user_id", userId)
      .gte("created_at", dayAgo)
      .limit(1000);

    const rows = data ?? [];
    return rows.reduce<UsageWindow>((acc, row) => {
      const isFeature = row.feature === feature;
      acc.costTodayUsd += Number(row.estimated_cost_usd ?? 0);
      if (isFeature) {
        acc.lastDay += 1;
        if (new Date(row.created_at).getTime() >= hourAgo) acc.lastHour += 1;
      }
      return acc;
    }, empty);
  } catch (error) {
    console.error("ai usage window failed", error);
    // Fail open on measurement errors: per-attempt timeouts, retry caps and
    // input caps still bound the cost of a single request.
    return empty;
  }
}

export type QuotaCheck = { allowed: boolean; reason?: string };

export async function checkUserQuota(userId: string, feature: AiFeature): Promise<QuotaCheck> {
  const window = await readUsageWindow(userId, feature);
  const decision = evaluateQuota(feature, window);
  return decision.allowed ? { allowed: true } : { allowed: false, reason: decision.message };
}

export function usageStatusFor(kind: string): AiRequestStatus {
  if (kind === "rate_limited") return "rate_limited";
  if (kind === "blocked_input" || kind === "blocked_output") return "blocked";
  return "error";
}

export type ProviderAttribution = { provider: AiProviderId | null; model: string | null };
