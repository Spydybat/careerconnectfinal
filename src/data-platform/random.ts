/**
 * Deterministic pseudo-random utilities.
 *
 * All generators take an explicit seed so every run is reproducible; no
 * Math.random(), no Date.now() inside dataset generation.
 */

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  bool(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
  pickMany<T>(items: readonly T[], count: number): T[];
  weighted<T>(items: readonly (readonly [T, number])[]): T;
  normal(mean: number, stdDev: number): number;
  /** Log-normal-ish skew, useful for salaries and application counts. */
  skewed(min: number, max: number, skew?: number): number;
  date(startISO: string, endISO: string): Date;
  uuid(): string;
}

/** 32-bit string hash — used to derive stable child seeds. */
export function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  let state = (typeof seed === "number" ? seed >>> 0 : hashSeed(seed)) || 1;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => Math.floor(next() * (max - min + 1)) + min;

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("rng.pick: empty list");
    return items[int(0, items.length - 1)] as T;
  };

  const rng: Rng = {
    next,
    int,
    bool: (probability = 0.5) => next() < probability,
    pick,
    pickMany: <T>(items: readonly T[], count: number): T[] => {
      const pool = [...items];
      const out: T[] = [];
      const take = Math.min(count, pool.length);
      for (let i = 0; i < take; i++) {
        const idx = int(0, pool.length - 1);
        out.push(pool[idx] as T);
        pool.splice(idx, 1);
      }
      return out;
    },
    weighted: <T>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of items) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return items[items.length - 1]![0];
    },
    normal: (mean, stdDev) => {
      const u = Math.max(next(), 1e-9);
      const v = Math.max(next(), 1e-9);
      return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    skewed: (min, max, skew = 2) => {
      const r = Math.pow(next(), skew);
      return min + r * (max - min);
    },
    date: (startISO, endISO) => {
      const start = Date.parse(startISO);
      const end = Date.parse(endISO);
      return new Date(start + Math.floor(next() * (end - start)));
    },
    uuid: () => {
      const hex = "0123456789abcdef";
      let out = "";
      for (let i = 0; i < 32; i++) {
        if (i === 12) out += "4";
        else if (i === 16) out += hex[8 + int(0, 3)];
        else out += hex[int(0, 15)];
        if (i === 7 || i === 11 || i === 15 || i === 19) out += "-";
      }
      return out;
    },
  };

  return rng;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isoTimestamp(d: Date): string {
  return d.toISOString();
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
