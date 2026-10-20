/**
 * Data Platform configuration.
 *
 * The platform is OLAP-only: it never reads or writes the operational
 * (OLTP) Supabase database. Everything here is deterministic — the same
 * seed always produces the same datasets, batches and warehouse output.
 */

export const PLATFORM_VERSION = "1.0.0";
export const SCHEMA_VERSION = "v1";

/** Master seed. Change it to produce a different (still deterministic) universe. */
export const DEFAULT_SEED = 20260808;

/** Logical layers of the pipeline, in execution order. */
export const LAYERS = ["raw", "staging", "curated", "quarantine", "archive"] as const;
export type Layer = (typeof LAYERS)[number];

/** Every dataset domain handled by the platform. */
export const DOMAINS = [
  "students",
  "companies",
  "jobs",
  "internships",
  "skills",
  "certifications",
  "colleges",
  "recruiters",
  "placements",
  "courses",
  "salaries",
  "interviews",
  "applications",
  "hiring_trends",
  "job_categories",
  "locations",
  "technologies",
  "experience_levels",
  "employment_types",
] as const;
export type Domain = (typeof DOMAINS)[number];

export type Volumes = Record<Domain, number>;

/** Full-scale target volumes (scale = 1). */
export const BASE_VOLUMES: Volumes = {
  students: 10_000,
  companies: 1_000,
  jobs: 5_000,
  internships: 1_200,
  skills: 500,
  certifications: 300,
  colleges: 250,
  recruiters: 1_500,
  placements: 2_000,
  courses: 500,
  salaries: 2_000,
  interviews: 5_000,
  applications: 20_000,
  hiring_trends: 0, // derived: companies x months, computed by the generator
  job_categories: 0, // reference data, fixed size
  locations: 0,
  technologies: 0,
  experience_levels: 0,
  employment_types: 0,
};

export interface PlatformConfig {
  seed: number;
  /** 0 < scale <= 1 — shrinks generated volumes while preserving distributions. */
  scale: number;
  volumes: Volumes;
  /** Root directory of the file-backed data lake. */
  lakeRoot: string;
  schemaVersion: string;
}

export function createConfig(overrides: Partial<PlatformConfig> = {}): PlatformConfig {
  const scale = overrides.scale ?? 1;
  const volumes = { ...BASE_VOLUMES, ...(overrides.volumes ?? {}) };
  const scaled = Object.fromEntries(
    Object.entries(volumes).map(([k, v]) => [k, Math.max(v === 0 ? 0 : 1, Math.round(v * scale))]),
  ) as Volumes;
  return {
    seed: overrides.seed ?? DEFAULT_SEED,
    scale,
    volumes: scaled,
    lakeRoot: overrides.lakeRoot ?? ".data-lake",
    schemaVersion: overrides.schemaVersion ?? SCHEMA_VERSION,
  };
}

/** Reporting window used for facts and dim_date. */
export const CALENDAR_START = "2023-01-01";
export const CALENDAR_END = "2026-12-31";
