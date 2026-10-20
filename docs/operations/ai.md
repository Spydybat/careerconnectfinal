# Runbook — AI

**Alerts:** `ai.failure_rate` (P2), `ai.latency` (P3), `ai.cost_spike` (P3)

All AI monitoring is derived from `ai_usage_logs`. Prompts, completions, resume
text and any user content are never stored or logged by observability.

## Diagnose

1. Operations console → AI card: requests, success rate, p95 latency, estimated
   cost, per-provider health.
2. Compare providers and models: a single provider degraded points to an
   upstream incident, all providers degraded points to gateway or network.
3. Logs: `error_kind=ai_error` with `request_id` correlation.

## Act

- Provider failure → AI features already degrade gracefully; confirm the UI
  shows the fallback state rather than an error page.
- Latency degradation → check whether one feature dominates the window; reduce
  its concurrency before disabling the feature.
- Cost spike → inspect the per-feature breakdown and the existing per-user AI
  limits; tighten limits before changing models.

## Verify

Failure rate and p95 return below thresholds; estimated spend for the window is
back inside the budget.
