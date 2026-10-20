/**
 * Sprint 12 — runtime rate-limit enforcement (server only).
 *
 * One limiter instance per worker isolate. This bounds abuse from a single
 * client without a shared store; the AI layer keeps its own database-backed
 * quotas (src/ai/limits.ts) for cost ceilings that must survive restarts.
 */

import {
  RATE_POLICIES,
  RateLimiter,
  RateLimitError,
  rateKey,
  type RateClass,
} from "@/security/rate-limit";

const limiter = new RateLimiter();

export { RateLimitError };

/** Throws RateLimitError when the identity has exhausted its budget. */
export function assertRateLimit(rateClass: RateClass, identity: string, scope?: string): void {
  limiter.assert(rateKey(rateClass, identity, scope), RATE_POLICIES[rateClass]);
}

export function rateLimitSnapshot(): { trackedKeys: number } {
  return { trackedKeys: limiter.size };
}
