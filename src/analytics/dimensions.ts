/**
 * Conformed dimension registry.
 *
 * Dimensions are declared once and reused by every metric, filter and
 * dashboard, so "Location" means exactly the same thing everywhere.
 */

import type { ConformedDims } from "./types";

export interface DimensionDefinition {
  key: keyof ConformedDims;
  label: string;
  /** Warehouse dimension table the attribute is conformed from. */
  source_dimension: string;
  description: string;
  /** Exposed as a dashboard filter control. */
  filterable: boolean;
  /** Usable as a chart breakdown axis. */
  groupable: boolean;
}

export const DIMENSIONS: readonly DimensionDefinition[] = [
  {
    key: "date",
    label: "Date",
    source_dimension: "dim_date",
    description: "Business date of the event (application, interview, offer, posting).",
    filterable: true,
    groupable: true,
  },
  {
    key: "month",
    label: "Month",
    source_dimension: "dim_date",
    description: "Calendar month (YYYY-MM) of the business date.",
    filterable: true,
    groupable: true,
  },
  {
    key: "quarter",
    label: "Quarter",
    source_dimension: "dim_date",
    description: "Calendar quarter (YYYY-Qn) of the business date.",
    filterable: true,
    groupable: true,
  },
  {
    key: "year",
    label: "Year",
    source_dimension: "dim_date",
    description: "Calendar year of the business date.",
    filterable: true,
    groupable: true,
  },
  {
    key: "location_code",
    label: "Location",
    source_dimension: "dim_location",
    description: "Conformed location code of the job, posting or placement.",
    filterable: true,
    groupable: true,
  },
  {
    key: "city",
    label: "City",
    source_dimension: "dim_location",
    description: "City name resolved from dim_location.",
    filterable: false,
    groupable: true,
  },
  {
    key: "region",
    label: "Region",
    source_dimension: "dim_location",
    description: "Geographic region resolved from dim_location.",
    filterable: false,
    groupable: true,
  },
  {
    key: "industry",
    label: "Industry",
    source_dimension: "dim_company",
    description: "Industry of the hiring company (SCD2 current version).",
    filterable: true,
    groupable: true,
  },
  {
    key: "company_id",
    label: "Company",
    source_dimension: "dim_company",
    description: "Hiring company business key.",
    filterable: true,
    groupable: true,
  },
  {
    key: "company_name",
    label: "Company name",
    source_dimension: "dim_company",
    description: "Display name of the hiring company.",
    filterable: false,
    groupable: true,
  },
  {
    key: "category_code",
    label: "Job role",
    source_dimension: "dim_job",
    description: "Job category / role family the record belongs to.",
    filterable: true,
    groupable: true,
  },
  {
    key: "role_title",
    label: "Job title",
    source_dimension: "dim_job",
    description: "Posted job title.",
    filterable: false,
    groupable: true,
  },
  {
    key: "experience_code",
    label: "Experience level",
    source_dimension: "dim_job",
    description: "Experience band required by the job.",
    filterable: true,
    groupable: true,
  },
  {
    key: "employment_code",
    label: "Employment type",
    source_dimension: "dim_job",
    description: "Full time, part time, internship or contract.",
    filterable: true,
    groupable: true,
  },
  {
    key: "college_id",
    label: "College",
    source_dimension: "dim_college",
    description: "College the student belongs to.",
    filterable: true,
    groupable: true,
  },
  {
    key: "college_name",
    label: "College name",
    source_dimension: "dim_college",
    description: "Display name of the college.",
    filterable: false,
    groupable: true,
  },
  {
    key: "department",
    label: "Department",
    source_dimension: "dim_student",
    description: "Academic branch / department of the student.",
    filterable: true,
    groupable: true,
  },
  {
    key: "batch",
    label: "Batch",
    source_dimension: "dim_student",
    description: "Graduation year of the student.",
    filterable: true,
    groupable: true,
  },
  {
    key: "student_id",
    label: "Student",
    source_dimension: "dim_student",
    description: "Student business key — used for self-scoped analytics.",
    filterable: false,
    groupable: false,
  },
  {
    key: "recruiter_id",
    label: "Recruiter",
    source_dimension: "dim_recruiter",
    description: "Recruiter who owns the job posting (SCD2 current version).",
    filterable: false,
    groupable: true,
  },
  {
    key: "skill_id",
    label: "Skill",
    source_dimension: "dim_skill",
    description: "Skill required by a job or held by a student.",
    filterable: true,
    groupable: true,
  },
  {
    key: "technology_code",
    label: "Technology",
    source_dimension: "dim_technology",
    description: "Technology required by a job posting.",
    filterable: true,
    groupable: true,
  },
];

export const DIMENSION_BY_KEY: Record<string, DimensionDefinition> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.key, d]),
);
