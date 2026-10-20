/**
 * Sprint 12 — rate limiting.
 *
 * Pure, clock-injected sliding-window limiter. Enforcement is per identity +
 * operation class, so one abusive account cannot exhaust another's budget.
 * The runtime store lives in rate-limit.server.ts; everything here is testable
 * without a request.
 */

export type RatePolicy = {
  /** Requests allowed inside the window. */
  limit: number;
  windowMs: number;
  /** Optional short burst window applied on top of the main window. */
  burst?: { limit: number; windowMs: number };
};

export const RATE_POLICIES = {
  /** Ordinary authenticated reads. */
  read: { limit: 300, windowMs: 60_000, burst: { limit: 40, windowMs: 1_000 } },
  /** Any state-changing server function. */
  write: { limit: 60, windowMs: 60_000, burst: { limit: 10, windowMs: 1_000 } },
  /** Analytics/warehouse queries and exports — expensive. */
  analytics: { limit: 60, windowMs: 60_000, burst: { limit: 6, windowMs: 1_000 } },
  export: { limit: 10, windowMs: 60_000 },
  /** Administrative mutations (role changes, suspensions, deletions). */
  admin: { limit: 30, windowMs: 60_000, burst: { limit: 5, windowMs: 1_000 } },
  /** Unauthenticated surfaces (auth attempts). */
  auth: { limit: 10, windowMs: 300_000 },
  /** AI is additionally quota'd per feature in src/ai/limits.ts. */
  ai: { limit: 30, windowMs: 60_000, burst: { limit: 3, windowMs: 1_000 } },
} as const satisfies Record<string, RatePolicy>;

export type RateClass = keyof typeof RATE_POLICIES;

export type RateDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number; reason: "window" | "burst" };

export type RateState = { hits: number[] };

/** Sliding-window check. `hits` is mutated in place (trimmed + appended). */
export function checkRate(state: RateState, policy: RatePolicy, now: number): RateDecision {
  const cutoff = now - policy.windowMs;
  state.hits = state.hits.filter((t) => t > cutoff);

  if (policy.burst) {
    const burstCutoff = now - policy.burst.windowMs;
    const inBurst = state.hits.filter((t) => t > burstCutoff);
    if (inBurst.length >= policy.burst.limit) {
      const oldest = inBurst[0] ?? now;
      return {
        allowed: false,
        reason: "burst",
        retryAfterMs: Math.max(1, oldest + policy.burst.windowMs - now),
      };
    }
  }

  if (state.hits.length >= policy.limit) {
    const oldest = state.hits[0] ?? now;
    return {
      allowed: false,
      reason: "window",
      retryAfterMs: Math.max(1, oldest + policy.windowMs - now),
    };
  }

  state.hits.push(now);
  return { allowed: true, remaining: policy.limit - state.hits.length };
}

export function rateKey(rateClass: RateClass, identity: string, scope?: string): string {
  return [rateClass, identity || "anonymous", scope ?? ""].join(":");
}

export class RateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limit exceeded. Please retry in ${Math.ceil(retryAfterMs / 1000)} second(s).`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/** Bounded in-memory store: pure class so tests can drive the clock. */
export class RateLimiter {
  private readonly states = new Map<string, RateState>();
  constructor(private readonly maxKeys = 10_000) {}

  check(key: string, policy: RatePolicy, now: number = Date.now()): RateDecision {
    let state = this.states.get(key);
    if (!state) {
      if (this.states.size >= this.maxKeys) this.evict(now);
      state = { hits: [] };
      this.states.set(key, state);
    }
    return checkRate(state, policy, now);
  }

  assert(key: string, policy: RatePolicy, now: number = Date.now()): void {
    const decision = this.check(key, policy, now);
    if (!decision.allowed) throw new RateLimitError(decision.retryAfterMs);
  }

  /** Drops entries whose window has fully elapsed. */
  private evict(now: number): void {
    for (const [key, state] of this.states) {
      const last = state.hits[state.hits.length - 1];
      if (last === undefined || now - last > 600_000) this.states.delete(key);
    }
  }

  get size(): number {
    return this.states.size;
  }
}
