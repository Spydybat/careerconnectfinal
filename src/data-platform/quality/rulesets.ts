/**
 * Domain quality rule sets. One builder per dataset, all deterministic.
 */

import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  OFFER_STATUSES,
} from "../reference/taxonomy";
import {
  businessRule,
  consistent,
  inRange,
  inSet,
  isIsoDate,
  matchesPattern,
  notNull,
  referencesKey,
  unique,
} from "./rules";
import type { DataQualityRule } from "./types";

type Row = Record<string, unknown>;

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export interface RuleSetContext {
  /** Parent key sets used for referential integrity checks. */
  keys: Record<string, Set<string>>;
}

function keysOf(context: RuleSetContext, name: string): Set<string> {
  return context.keys[name] ?? new Set<string>();
}

export function rulesFor(
  dataset: string,
  records: readonly Row[],
  context: RuleSetContext,
): DataQualityRule<Row>[] {
  switch (dataset) {
    case "students":
      return [
        notNull("students", "student_id"),
        unique("students", "student_id", records),
        matchesPattern("students", "email", EMAIL),
        inRange("students", "cgpa", 0, 10),
        inRange("students", "backlogs", 0, 20),
        isIsoDate("students", "last_updated"),
        referencesKey("students", "college_id", "colleges", keysOf(context, "colleges")),
        consistent(
          "students",
          "graduation_after_enrollment",
          "graduation_year must be after enrollment_year",
          (r) => Number(r["graduation_year"]) > Number(r["enrollment_year"]),
        ),
        businessRule(
          "students",
          "eligibility_requires_cgpa",
          "placement-eligible students must have cgpa >= 6 and no backlogs",
          (r) =>
            !r["is_placement_eligible"] || (Number(r["cgpa"]) >= 6 && Number(r["backlogs"]) === 0),
        ),
      ];
    case "companies":
      return [
        notNull("companies", "company_id"),
        unique("companies", "company_id", records),
        notNull("companies", "company_name"),
        inRange("companies", "rating", 0, 5),
        inRange("companies", "headcount", 1, 5_000_000),
        isIsoDate("companies", "last_updated"),
      ];
    case "recruiters":
      return [
        notNull("recruiters", "recruiter_id"),
        unique("recruiters", "recruiter_id", records),
        matchesPattern("recruiters", "email", EMAIL),
        referencesKey("recruiters", "company_id", "companies", keysOf(context, "companies")),
      ];
    case "colleges":
      return [
        notNull("colleges", "college_id"),
        unique("colleges", "college_id", records),
        inRange("colleges", "established_year", 1850, 2026),
      ];
    case "skills":
      return [
        notNull("skills", "skill_id"),
        unique("skills", "skill_id", records),
        inRange("skills", "demand_index", 0, 100),
      ];
    case "certifications":
      return [
        notNull("certifications", "certification_id"),
        unique("certifications", "certification_id", records),
        referencesKey("certifications", "skill_id", "skills", keysOf(context, "skills")),
      ];
    case "courses":
      return [
        notNull("courses", "course_id"),
        unique("courses", "course_id", records),
        inRange("courses", "rating", 0, 5),
        inRange("courses", "completion_rate", 0, 1),
        referencesKey("courses", "skill_id", "skills", keysOf(context, "skills")),
      ];
    case "jobs":
      return [
        notNull("jobs", "job_id"),
        unique("jobs", "job_id", records),
        referencesKey("jobs", "company_id", "companies", keysOf(context, "companies")),
        inSet(
          "jobs",
          "employment_code",
          EMPLOYMENT_TYPES.map((t) => t.code),
        ),
        inSet(
          "jobs",
          "experience_code",
          EXPERIENCE_LEVELS.map((t) => t.code),
        ),
        consistent(
          "jobs",
          "salary_band_ordered",
          "max_salary must be greater than or equal to min_salary",
          (r) => Number(r["max_salary"]) >= Number(r["min_salary"]),
        ),
        isIsoDate("jobs", "posted_at"),
      ];
    case "internships":
      return [
        notNull("internships", "internship_id"),
        unique("internships", "internship_id", records),
        referencesKey("internships", "job_id", "jobs", keysOf(context, "jobs")),
        inRange("internships", "duration_weeks", 2, 104),
      ];
    case "applications":
      return [
        notNull("applications", "application_id"),
        unique("applications", "application_id", records),
        referencesKey("applications", "student_id", "students", keysOf(context, "students")),
        referencesKey("applications", "job_id", "jobs", keysOf(context, "jobs")),
        inSet("applications", "status", APPLICATION_STATUSES),
        inRange("applications", "match_score", 0, 100),
        isIsoDate("applications", "applied_at"),
      ];
    case "interviews":
      return [
        notNull("interviews", "interview_id"),
        unique("interviews", "interview_id", records),
        referencesKey(
          "interviews",
          "application_id",
          "applications",
          keysOf(context, "applications"),
        ),
        inRange("interviews", "round_number", 1, 8),
        isIsoDate("interviews", "scheduled_at"),
      ];
    case "placements":
      return [
        notNull("placements", "placement_id"),
        unique("placements", "placement_id", records),
        referencesKey("placements", "student_id", "students", keysOf(context, "students")),
        referencesKey("placements", "company_id", "companies", keysOf(context, "companies")),
        inSet("placements", "offer_status", OFFER_STATUSES),
        businessRule(
          "placements",
          "ctc_positive",
          "annual CTC must be positive",
          (r) => Number(r["ctc_annual"]) > 0,
        ),
        consistent(
          "placements",
          "joining_after_offer",
          "joining_date must not precede offer_date",
          (r) => String(r["joining_date"]) >= String(r["offer_date"]),
        ),
      ];
    case "salaries":
      return [
        notNull("salaries", "salary_id"),
        unique("salaries", "salary_id", records),
        consistent(
          "salaries",
          "median_within_band",
          "base_median must sit inside the base band",
          (r) =>
            Number(r["base_median"]) >= Number(r["base_min"]) &&
            Number(r["base_median"]) <= Number(r["base_max"]),
        ),
        inRange("salaries", "sample_size", 1, 100_000),
      ];
    case "hiring_trends":
      return [
        notNull("hiring_trends", "trend_id"),
        unique("hiring_trends", "trend_id", records),
        inRange("hiring_trends", "demand_index", 0, 100),
        consistent(
          "hiring_trends",
          "offers_not_exceeding_applications",
          "offers_made cannot exceed applications_received",
          (r) => Number(r["offers_made"]) <= Number(r["applications_received"]),
        ),
      ];
    case "learning_enrollments":
      return [
        notNull("learning_enrollments", "enrollment_id"),
        unique("learning_enrollments", "enrollment_id", records),
        referencesKey(
          "learning_enrollments",
          "student_id",
          "students",
          keysOf(context, "students"),
        ),
        referencesKey("learning_enrollments", "course_id", "courses", keysOf(context, "courses")),
        inRange("learning_enrollments", "progress_pct", 0, 100),
      ];
    case "student_certifications":
      return [
        notNull("student_certifications", "student_certification_id"),
        unique("student_certifications", "student_certification_id", records),
        referencesKey(
          "student_certifications",
          "student_id",
          "students",
          keysOf(context, "students"),
        ),
        referencesKey(
          "student_certifications",
          "certification_id",
          "certifications",
          keysOf(context, "certifications"),
        ),
      ];
    default:
      // Reference datasets: identity + completeness only.
      return records.length > 0 && records[0] !== undefined
        ? [notNull(dataset, Object.keys(records[0])[0] ?? "id")]
        : [];
  }
}
