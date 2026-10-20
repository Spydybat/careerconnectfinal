/**
 * Server-only analytics snapshot.
 *
 * The warehouse is a deterministic, batch-built artefact, so the BI layer
 * builds it ONCE per worker and caches it. Dashboards query the cached
 * snapshot; the browser never receives warehouse rows.
 */

import { buildAnalyticsMart, type AnalyticsMart } from "./mart";
import type { AnalyticsPrincipal, AnalyticsRole } from "./authorization";
import { getPlatformSnapshot } from "@/observability/platform.server";

let cached: AnalyticsMart | null = null;
let cachedAt = 0;

/** Cache lifetime for the built snapshot (batch data — it does not change). */
const TTL_MS = 15 * 60 * 1000;

export interface SnapshotOptions {
  scale?: number;
  force?: boolean;
}

export function getAnalyticsMart(options: SnapshotOptions = {}): AnalyticsMart {
  const now = Date.now();
  if (!options.force && cached && now - cachedAt < TTL_MS) return cached;

  // Sprint 14 — BI never computes its own freshness: the platform snapshot is
  // the single shared source for run status, load time and quarantine counts.
  const snapshot = getPlatformSnapshot({
    ...(options.scale === undefined ? {} : { scale: options.scale }),
    ...(options.force ? { force: true } : {}),
  });
  const build = snapshot.build;

  cached = buildAnalyticsMart({
    warehouse: build.warehouse,
    curated: build.pipeline.curated,
    freshness: {
      last_updated: build.pipeline.run.finished_at ?? build.pipeline.run.started_at,
      pipeline_status:
        snapshot.etl.status === "FAILED"
          ? "failed"
          : snapshot.etl.status === "PARTIAL" || snapshot.quality.rules_failed > 0
            ? "degraded"
            : "healthy",
      run_id: snapshot.etl.run_id,
      refresh_mode: "batch",
      rows_quarantined: snapshot.etl.quarantined_records,
    },
  });
  cachedAt = now;
  return cached;
}

export function resetAnalyticsMartCache(): void {
  cached = null;
  cachedAt = 0;
}

const hash = (value: string): number => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const pickDeterministic = (
  values: readonly { value: string }[],
  seed: string,
): string | undefined =>
  values.length === 0 ? undefined : values[hash(seed) % values.length]?.value;

/**
 * Build the analytics principal for a signed-in user.
 *
 * The warehouse is a synthetic OLAP universe with no foreign keys back into
 * the operational database, so a recruiter's company / an officer's college /
 * a student's record are bound deterministically from the user id. The
 * binding is stable per user and is what row-level scope is enforced against.
 */
export function resolvePrincipal(
  userId: string,
  roles: readonly AnalyticsRole[],
  mart: AnalyticsMart,
): AnalyticsPrincipal {
  const effective: AnalyticsRole[] = roles.length > 0 ? [...roles] : ["student"];
  return {
    userId,
    roles: effective,
    companyId: pickDeterministic(mart.reference.companies, `company:${userId}`),
    collegeId: pickDeterministic(mart.reference.colleges, `college:${userId}`),
    studentId: pickDeterministic(
      mart.students.map((s) => ({ value: String(s["student_id"]) })),
      `student:${userId}`,
    ),
  };
}
