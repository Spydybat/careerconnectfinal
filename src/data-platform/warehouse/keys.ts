/**
 * Surrogate key management for the warehouse.
 *
 * Surrogate keys are dense integers assigned in deterministic insertion order
 * per dimension, so rebuilds from the same seed are identical.
 */

export interface SurrogateKeyAllocator {
  keyFor(dimension: string, businessKey: string): number;
  next(dimension: string): number;
  snapshot(): Record<string, Record<string, number>>;
}

export const UNKNOWN_KEY = -1;

export function createKeyAllocator(): SurrogateKeyAllocator {
  const maps = new Map<string, Map<string, number>>();
  const counters = new Map<string, number>();

  const mapFor = (dimension: string) => {
    let map = maps.get(dimension);
    if (!map) {
      map = new Map<string, number>();
      maps.set(dimension, map);
    }
    return map;
  };

  return {
    keyFor(dimension, businessKey) {
      const map = mapFor(dimension);
      const existing = map.get(businessKey);
      if (existing !== undefined) return existing;
      const next = (counters.get(dimension) ?? 0) + 1;
      counters.set(dimension, next);
      map.set(businessKey, next);
      return next;
    },
    next(dimension) {
      const next = (counters.get(dimension) ?? 0) + 1;
      counters.set(dimension, next);
      return next;
    },
    snapshot() {
      const out: Record<string, Record<string, number>> = {};
      for (const [dimension, map] of maps) out[dimension] = Object.fromEntries(map);
      return out;
    },
  };
}

/** Deterministic date key: YYYYMMDD. */
export function dateKey(isoDateOrTimestamp: string | null | undefined): number {
  if (!isoDateOrTimestamp || isoDateOrTimestamp.length < 10) return UNKNOWN_KEY;
  return Number(isoDateOrTimestamp.slice(0, 10).replace(/-/g, ""));
}
