import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin AI monitoring — real usage, cost and reliability aggregated from
 * ai_usage_logs. Admin-only: the caller's role is verified before the
 * privileged client is loaded.
 */

export type AiUsageDashboard = {
  daily: { day: string; requests: number; failures: number; tokens: number }[];
  models: { name: string; value: number; costUsd: number }[];
  providers: {
    provider: string;
    requests: number;
    tokens: number;
    costUsd: number;
    status: string;
  }[];
  features: { feature: string; requests: number; failures: number; costUsd: number }[];
  totals: {
    requests: number;
    failures: number;
    tokens: number;
    costUsd: number;
    failureRate: number;
    p95LatencyMs: number;
  };
  empty: boolean;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getAiUsageDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AiUsageDashboard> => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("ai_usage_logs")
      .select(
        "created_at, feature, provider, model, input_tokens, output_tokens, estimated_cost_usd, latency_ms, status",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);

    const rows = data ?? [];

    const dayMap = new Map<
      string,
      { day: string; requests: number; failures: number; tokens: number }
    >();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: DAY_LABELS[d.getDay()] ?? key, requests: 0, failures: 0, tokens: 0 });
    }

    const modelMap = new Map<string, { requests: number; costUsd: number }>();
    const providerMap = new Map<
      string,
      { requests: number; tokens: number; costUsd: number; failures: number }
    >();
    const featureMap = new Map<string, { requests: number; failures: number; costUsd: number }>();
    const latencies: number[] = [];

    let requests = 0;
    let failures = 0;
    let tokens = 0;
    let costUsd = 0;

    for (const row of rows) {
      const tok = Number(row.input_tokens ?? 0) + Number(row.output_tokens ?? 0);
      const cost = Number(row.estimated_cost_usd ?? 0);
      const failed = row.status !== "success";

      requests += 1;
      tokens += tok;
      costUsd += cost;
      if (failed) failures += 1;
      if (row.latency_ms) latencies.push(Number(row.latency_ms));

      const dayKey = String(row.created_at).slice(0, 10);
      const day = dayMap.get(dayKey);
      if (day) {
        day.requests += 1;
        day.tokens += tok;
        if (failed) day.failures += 1;
      }

      const modelKey = row.model ?? "unrouted";
      const model = modelMap.get(modelKey) ?? { requests: 0, costUsd: 0 };
      model.requests += 1;
      model.costUsd += cost;
      modelMap.set(modelKey, model);

      const providerKey = row.provider ?? "unrouted";
      const provider = providerMap.get(providerKey) ?? {
        requests: 0,
        tokens: 0,
        costUsd: 0,
        failures: 0,
      };
      provider.requests += 1;
      provider.tokens += tok;
      provider.costUsd += cost;
      if (failed) provider.failures += 1;
      providerMap.set(providerKey, provider);

      const featureKey = row.feature ?? "unknown";
      const feature = featureMap.get(featureKey) ?? { requests: 0, failures: 0, costUsd: 0 };
      feature.requests += 1;
      feature.costUsd += cost;
      if (failed) feature.failures += 1;
      featureMap.set(featureKey, feature);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies.length
      ? Math.round(
          latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0,
        )
      : 0;

    return {
      daily: Array.from(dayMap.values()),
      models: Array.from(modelMap.entries())
        .map(([name, m]) => ({
          name,
          value: requests ? Math.round((m.requests / requests) * 100) : 0,
          costUsd: Number(m.costUsd.toFixed(4)),
        }))
        .sort((a, b) => b.value - a.value),
      providers: Array.from(providerMap.entries())
        .map(([provider, p]) => ({
          provider,
          requests: p.requests,
          tokens: p.tokens,
          costUsd: Number(p.costUsd.toFixed(4)),
          status: p.failures / Math.max(1, p.requests) > 0.2 ? "degraded" : "operational",
        }))
        .sort((a, b) => b.requests - a.requests),
      features: Array.from(featureMap.entries())
        .map(([feature, f]) => ({
          feature,
          requests: f.requests,
          failures: f.failures,
          costUsd: Number(f.costUsd.toFixed(4)),
        }))
        .sort((a, b) => b.requests - a.requests),
      totals: {
        requests,
        failures,
        tokens,
        costUsd: Number(costUsd.toFixed(4)),
        failureRate: requests ? Number(((failures / requests) * 100).toFixed(1)) : 0,
        p95LatencyMs: p95,
      },
      empty: rows.length === 0,
    };
  });
