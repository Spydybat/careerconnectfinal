/**
 * Machine-readable data dictionary for every layer of the platform.
 */

import { DOMAINS, LAYERS, PLATFORM_VERSION, SCHEMA_VERSION } from "../config";
import { STAR_SCHEMA, type TableSpec } from "../warehouse/schema";

export interface DatasetDictionaryEntry {
  dataset: string;
  layer: "raw" | "staging" | "curated";
  description: string;
  business_key: string;
  owner: string;
  refresh: "full" | "incremental";
  pii: "none" | "synthetic_pii";
  quality_dimensions: string[];
}

export const DATASET_DICTIONARY: DatasetDictionaryEntry[] = [
  {
    dataset: "students",
    layer: "curated",
    description: "Synthetic student master with academics, skills and eligibility.",
    business_key: "student_id",
    owner: "campus_analytics",
    refresh: "incremental",
    pii: "synthetic_pii",
    quality_dimensions: [
      "completeness",
      "validity",
      "uniqueness",
      "referential_integrity",
      "business_rule",
    ],
  },
  {
    dataset: "companies",
    layer: "curated",
    description: "Employer master with industry, size and partnership status.",
    business_key: "company_id",
    owner: "employer_relations",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["completeness", "validity", "uniqueness"],
  },
  {
    dataset: "jobs",
    layer: "curated",
    description: "Job postings including salary band, skills and lifecycle status.",
    business_key: "job_id",
    owner: "employer_relations",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["validity", "uniqueness", "consistency", "referential_integrity"],
  },
  {
    dataset: "applications",
    layer: "curated",
    description: "Student applications to job postings with match score and status.",
    business_key: "application_id",
    owner: "placement_office",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["validity", "uniqueness", "referential_integrity"],
  },
  {
    dataset: "interviews",
    layer: "curated",
    description: "Interview rounds scheduled against applications.",
    business_key: "interview_id",
    owner: "placement_office",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["validity", "uniqueness", "referential_integrity"],
  },
  {
    dataset: "placements",
    layer: "curated",
    description: "Offers issued, accepted and joined, with compensation detail.",
    business_key: "placement_id",
    owner: "placement_office",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["validity", "consistency", "business_rule", "referential_integrity"],
  },
  {
    dataset: "salaries",
    layer: "curated",
    description: "Observed compensation bands by role, level and location.",
    business_key: "salary_id",
    owner: "market_intelligence",
    refresh: "full",
    pii: "none",
    quality_dimensions: ["validity", "consistency"],
  },
  {
    dataset: "courses",
    layer: "curated",
    description: "Learning catalogue mapped to the skill taxonomy.",
    business_key: "course_id",
    owner: "learning",
    refresh: "full",
    pii: "none",
    quality_dimensions: ["validity", "referential_integrity"],
  },
  {
    dataset: "learning_enrollments",
    layer: "curated",
    description: "Student progress against catalogue courses.",
    business_key: "enrollment_id",
    owner: "learning",
    refresh: "incremental",
    pii: "none",
    quality_dimensions: ["validity", "referential_integrity"],
  },
  {
    dataset: "hiring_trends",
    layer: "curated",
    description: "Monthly demand signal by job category and location.",
    business_key: "trend_id",
    owner: "market_intelligence",
    refresh: "full",
    pii: "none",
    quality_dimensions: ["validity", "consistency"],
  },
];

export interface DataDictionary {
  platform_version: string;
  schema_version: string;
  layers: readonly string[];
  domains: readonly string[];
  datasets: DatasetDictionaryEntry[];
  warehouse: TableSpec[];
  marts: { name: string; grain: string; description: string }[];
}

export const MART_DICTIONARY = [
  {
    name: "mart_placement_summary",
    grain: "placement_season x college",
    description: "Placement counts, joins and CTC distribution per college and season.",
  },
  {
    name: "mart_company_hiring",
    grain: "company",
    description: "Postings, applications, offers and offer rate per employer.",
  },
  {
    name: "mart_skill_demand_monthly",
    grain: "month x job category",
    description: "Demand, competition and conversion signal per category and month.",
  },
  {
    name: "mart_student_funnel",
    grain: "student",
    description: "Application to offer funnel per student.",
  },
  {
    name: "mart_salary_benchmark",
    grain: "job category x experience level",
    description: "Salary percentiles derived from live postings.",
  },
];

export function buildDataDictionary(): DataDictionary {
  return {
    platform_version: PLATFORM_VERSION,
    schema_version: SCHEMA_VERSION,
    layers: LAYERS,
    domains: DOMAINS,
    datasets: DATASET_DICTIONARY,
    warehouse: STAR_SCHEMA,
    marts: MART_DICTIONARY,
  };
}
