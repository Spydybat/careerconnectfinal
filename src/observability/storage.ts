/**
 * Sprint 14 — storage monitoring.
 *
 * Operational metadata only: counts, sizes and failure tallies. Object paths,
 * signed URLs and file names never leave this module.
 */

import type { HealthStatus } from "./types";

export interface StorageAreaStats {
  area: "resumes" | "datasets" | "exports";
  objects: number;
  bytes: number;
  upload_failures: number;
  download_failures: number;
  status: HealthStatus;
}

export interface StorageObservability {
  areas: StorageAreaStats[];
  total_objects: number;
  total_bytes: number;
  status: HealthStatus;
}

export function areaStatus(stats: {
  upload_failures: number;
  download_failures: number;
}): HealthStatus {
  const failures = stats.upload_failures + stats.download_failures;
  if (failures >= 10) return "unhealthy";
  if (failures > 0) return "degraded";
  return "healthy";
}

export function summariseStorage(
  areas: readonly Omit<StorageAreaStats, "status">[],
): StorageObservability {
  const withStatus = areas.map((area) => ({ ...area, status: areaStatus(area) }));
  return {
    areas: withStatus,
    total_objects: withStatus.reduce((s, a) => s + a.objects, 0),
    total_bytes: withStatus.reduce((s, a) => s + a.bytes, 0),
    status: withStatus.some((a) => a.status === "unhealthy")
      ? "unhealthy"
      : withStatus.some((a) => a.status === "degraded")
        ? "degraded"
        : "healthy",
  };
}
