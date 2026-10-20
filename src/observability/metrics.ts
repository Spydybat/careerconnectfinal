/**
 * Sprint 14 — application metrics.
 *
 * Deliberately small: an in-process, bounded, rolling window of request
 * observations. No metrics backend, no cardinality explosion — route +
 * method + status class only, with a hard cap on retained samples.
 */

import { summariseLatency, type LatencySummary } from "./types";
import type { ErrorKind } from "./errors";

export interface RequestObservation {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  at: number;
  errorKind?: ErrorKind;
}

export interface RouteMetrics {
  route: string;
  method: string;
  requests: number;
  errors: number;
  errorRate: number;
  latency: LatencySummary;
  statuses: Record<string, number>;
}

export interface MetricsSnapshot {
  windowMs: number;
  since: string;
  requests: number;
  errors: number;
  errorRate: number;
  latency: LatencySummary;
  statuses: Record<string, number>;
  errorKinds: Record<string, number>;
  routes: RouteMetrics[];
}

export interface MetricsRegistry {
  record(observation: Omit<RequestObservation, "at"> & { at?: number }): void;
  snapshot(now?: number): MetricsSnapshot;
  reset(): void;
  size(): number;
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_SAMPLES = 5000;

/** Collapses ids out of a path so metric cardinality stays bounded. */
export function normalizeRoute(pathname: string): string {
  if (!pathname) return "/";
  const normalized = pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment))
        return ":id";
      if (/^\d+$/.test(segment)) return ":id";
      if (/^[A-Za-z0-9_-]{24,}$/.test(segment)) return ":id";
      return segment;
    })
    .join("/");
  return normalized.length > 1 && normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function statusClass(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}

export function createMetricsRegistry(
  options: { windowMs?: number; maxSamples?: number } = {},
): MetricsRegistry {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxSamples = options.maxSamples ?? DEFAULT_MAX_SAMPLES;
  let samples: RequestObservation[] = [];

  const prune = (now: number) => {
    const cutoff = now - windowMs;
    if (samples.length > maxSamples) samples = samples.slice(samples.length - maxSamples);
    if (samples.length > 0 && (samples[0]?.at ?? now) < cutoff) {
      samples = samples.filter((s) => s.at >= cutoff);
    }
  };

  return {
    record(observation) {
      const at = observation.at ?? Date.now();
      samples.push({
        route: normalizeRoute(observation.route),
        method: observation.method.toUpperCase(),
        status: observation.status,
        durationMs: Math.max(0, Math.round(observation.durationMs)),
        at,
        ...(observation.errorKind ? { errorKind: observation.errorKind } : {}),
      });
      prune(at);
    },
    snapshot(now = Date.now()) {
      prune(now);
      const statuses: Record<string, number> = {};
      const errorKinds: Record<string, number> = {};
      const byRoute = new Map<string, RequestObservation[]>();
      let errors = 0;

      for (const sample of samples) {
        statuses[statusClass(sample.status)] = (statuses[statusClass(sample.status)] ?? 0) + 1;
        if (sample.status >= 500) errors += 1;
        if (sample.errorKind)
          errorKinds[sample.errorKind] = (errorKinds[sample.errorKind] ?? 0) + 1;
        const key = `${sample.method} ${sample.route}`;
        const bucket = byRoute.get(key);
        if (bucket) bucket.push(sample);
        else byRoute.set(key, [sample]);
      }

      const routes: RouteMetrics[] = [...byRoute.entries()]
        .map(([key, group]) => {
          const routeStatuses: Record<string, number> = {};
          let routeErrors = 0;
          for (const sample of group) {
            routeStatuses[statusClass(sample.status)] =
              (routeStatuses[statusClass(sample.status)] ?? 0) + 1;
            if (sample.status >= 500) routeErrors += 1;
          }
          const [method = "GET", ...rest] = key.split(" ");
          return {
            route: rest.join(" "),
            method,
            requests: group.length,
            errors: routeErrors,
            errorRate: group.length === 0 ? 0 : routeErrors / group.length,
            latency: summariseLatency(group.map((s) => s.durationMs)),
            statuses: routeStatuses,
          };
        })
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 25);

      return {
        windowMs,
        since: new Date(now - windowMs).toISOString(),
        requests: samples.length,
        errors,
        errorRate: samples.length === 0 ? 0 : errors / samples.length,
        latency: summariseLatency(samples.map((s) => s.durationMs)),
        statuses,
        errorKinds,
        routes,
      };
    },
    reset() {
      samples = [];
    },
    size: () => samples.length,
  };
}

/** Process-wide registry used by request middleware. */
export const appMetrics = createMetricsRegistry();
