/**
 * Warehouse build: turns curated datasets into conformed dimensions and facts.
 */

import { CALENDAR_END, CALENDAR_START } from "../config";
import type { Row } from "../etl/transform";
import { createKeyAllocator, dateKey, UNKNOWN_KEY, type SurrogateKeyAllocator } from "./keys";
import { applyScd1, applyScd2, type Scd2Row } from "./scd";

export interface DimDate {
  date_key: number;
  date: string;
  year: number;
  quarter: number;
  month: number;
  month_name: string;
  day_of_month: number;
  day_of_week: number;
  is_weekend: boolean;
  academic_year: string;
  placement_season: string;
}

export interface WarehouseTables {
  dim_date: DimDate[];
  dim_student: Scd2Row<Row>[];
  dim_company: Scd2Row<Row>[];
  dim_job: (Row & { surrogate_key: number })[];
  dim_skill: (Row & { surrogate_key: number })[];
  dim_location: (Row & { surrogate_key: number })[];
  dim_college: (Row & { surrogate_key: number })[];
  dim_course: (Row & { surrogate_key: number })[];
  dim_technology: (Row & { surrogate_key: number })[];
  dim_recruiter: Scd2Row<Row>[];
  fact_application: Row[];
  fact_interview: Row[];
  fact_placement: Row[];
  fact_salary: Row[];
  fact_job_posting: Row[];
  fact_learning: Row[];
  fact_certification: Row[];
  fact_hiring: Row[];
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function buildDimDate(start = CALENDAR_START, end = CALENDAR_END): DimDate[] {
  const rows: DimDate[] = [];
  const from = new Date(`${start}T00:00:00.000Z`);
  const to = new Date(`${end}T00:00:00.000Z`);
  for (let d = from; d <= to; d = new Date(d.getTime() + 86_400_000)) {
    const iso = d.toISOString().slice(0, 10);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const academicStart = month >= 7 ? year : year - 1;
    rows.push({
      date_key: Number(iso.replace(/-/g, "")),
      date: iso,
      year,
      quarter: Math.floor((month - 1) / 3) + 1,
      month,
      month_name: MONTHS[month - 1] ?? "Unknown",
      day_of_month: d.getUTCDate(),
      day_of_week: d.getUTCDay(),
      is_weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
      academic_year: `${academicStart}-${String((academicStart + 1) % 100).padStart(2, "0")}`,
      placement_season: `${academicStart}-${String((academicStart + 1) % 100).padStart(2, "0")}`,
    });
  }
  return rows;
}

export interface BuildWarehouseOptions {
  curated: Record<string, Row[]>;
  effectiveFrom: string;
  /** Previous warehouse state, enabling incremental SCD2 versioning. */
  previous?: Pick<WarehouseTables, "dim_student" | "dim_company" | "dim_recruiter"> | undefined;
  allocator?: SurrogateKeyAllocator;
}

const pick = (record: Row, fields: readonly string[]): Row => {
  const out: Row = {};
  for (const field of fields) out[field] = record[field] ?? null;
  return out;
};

export function buildWarehouse(options: BuildWarehouseOptions): {
  tables: WarehouseTables;
  scd: {
    dim_student: { inserted: number; updated: number };
    dim_company: { inserted: number; updated: number };
    dim_recruiter: { inserted: number; updated: number };
  };
} {
  const allocator = options.allocator ?? createKeyAllocator();
  const curated = options.curated;
  const rows = (name: string): Row[] => curated[name] ?? [];

  // ---- Dimensions -------------------------------------------------------
  const dim_date = buildDimDate();

  const studentScd = applyScd2<Row>({
    existing: options.previous?.dim_student ?? [],
    incoming: rows("students").map((r) =>
      pick(r, [
        "student_id",
        "full_name",
        "college_id",
        "degree_code",
        "branch",
        "graduation_year",
        "cgpa",
        "backlogs",
        "is_placement_eligible",
        "location_code",
      ]),
    ),
    businessKey: "student_id",
    trackedAttributes: ["cgpa", "backlogs", "is_placement_eligible", "branch"],
    effectiveFrom: options.effectiveFrom,
    nextKey: () => allocator.next("dim_student"),
  });

  const companyScd = applyScd2<Row>({
    existing: options.previous?.dim_company ?? [],
    incoming: rows("companies").map((r) =>
      pick(r, [
        "company_id",
        "company_name",
        "industry",
        "size_code",
        "headcount",
        "rating",
        "is_hiring_partner",
        "headquarters_location_code",
      ]),
    ),
    businessKey: "company_id",
    trackedAttributes: ["industry", "size_code", "headcount", "is_hiring_partner"],
    effectiveFrom: options.effectiveFrom,
    nextKey: () => allocator.next("dim_company"),
  });

  const dim_job = applyScd1<Row>(
    [],
    rows("jobs").map((r) =>
      pick(r, [
        "job_id",
        "title",
        "category_code",
        "employment_code",
        "experience_code",
        "is_remote",
        "status",
        "location_code",
        "company_id",
      ]),
    ),
    "job_id",
    () => allocator.next("dim_job"),
  );

  const dim_skill = applyScd1<Row>(
    [],
    rows("skills").map((r) =>
      pick(r, [
        "skill_id",
        "skill_name",
        "skill_category",
        "skill_group",
        "demand_index",
        "is_emerging",
      ]),
    ),
    "skill_id",
    () => allocator.next("dim_skill"),
  );

  const dim_location = applyScd1<Row>(
    [],
    rows("locations").map((r) =>
      pick(r, ["location_code", "city", "state", "country", "city_tier", "region"]),
    ),
    "location_code",
    () => allocator.next("dim_location"),
  );

  const dim_college = applyScd1<Row>(
    [],
    rows("colleges").map((r) =>
      pick(r, ["college_id", "college_name", "location_code", "accreditation", "is_autonomous"]),
    ),
    "college_id",
    () => allocator.next("dim_college"),
  );

  const dim_course = applyScd1<Row>(
    [],
    rows("courses").map((r) =>
      pick(r, ["course_id", "course_name", "provider", "skill_id", "level"]),
    ),
    "course_id",
    () => allocator.next("dim_course"),
  );

  const dim_technology = applyScd1<Row>(
    [],
    rows("technologies").map((r) =>
      pick(r, ["technology_code", "technology_name", "technology_group"]),
    ),
    "technology_code",
    () => allocator.next("dim_technology"),
  );

  const recruiterScd = applyScd2<Row>({
    existing: options.previous?.dim_recruiter ?? [],
    incoming: rows("recruiters").map((r) =>
      pick(r, ["recruiter_id", "full_name", "company_id", "designation", "is_active"]),
    ),
    businessKey: "recruiter_id",
    trackedAttributes: ["designation", "is_active"],
    effectiveFrom: options.effectiveFrom,
    nextKey: () => allocator.next("dim_recruiter"),
  });

  // ---- Lookups ----------------------------------------------------------
  const studentKey = new Map(
    studentScd.rows
      .filter((r) => r.is_current)
      .map((r) => [String(r["student_id"]), r.surrogate_key]),
  );
  const companyKey = new Map(
    companyScd.rows
      .filter((r) => r.is_current)
      .map((r) => [String(r["company_id"]), r.surrogate_key]),
  );
  const jobKey = new Map(dim_job.map((r) => [String(r["job_id"]), r.surrogate_key]));
  const skillKey = new Map(dim_skill.map((r) => [String(r["skill_id"]), r.surrogate_key]));
  const locationKey = new Map(
    dim_location.map((r) => [String(r["location_code"]), r.surrogate_key]),
  );
  const collegeKey = new Map(dim_college.map((r) => [String(r["college_id"]), r.surrogate_key]));
  const courseKey = new Map(dim_course.map((r) => [String(r["course_id"]), r.surrogate_key]));
  const recruiterKey = new Map(
    recruiterScd.rows
      .filter((r) => r.is_current)
      .map((r) => [String(r["recruiter_id"]), r.surrogate_key]),
  );
  const lookup = (map: Map<string, number>, value: unknown) =>
    map.get(String(value ?? "")) ?? UNKNOWN_KEY;

  // ---- Facts ------------------------------------------------------------
  const SHORTLISTED = new Set(["shortlisted", "interviewing", "offered", "hired", "accepted"]);

  const fact_application = rows("applications").map((r) => ({
    application_id: r["application_id"],
    date_key: dateKey(r["applied_at"] as string),
    student_key: lookup(studentKey, r["student_id"]),
    job_key: lookup(jobKey, r["job_id"]),
    company_key: lookup(companyKey, r["company_id"]),
    application_count: 1,
    match_score: Number(r["match_score"] ?? 0),
    is_shortlisted: SHORTLISTED.has(String(r["status"])) ? 1 : 0,
    is_rejected: String(r["status"]) === "rejected" ? 1 : 0,
  }));

  const fact_interview = rows("interviews").map((r) => ({
    interview_id: r["interview_id"],
    date_key: dateKey(r["scheduled_at"] as string),
    student_key: lookup(studentKey, r["student_id"]),
    job_key: lookup(jobKey, r["job_id"]),
    company_key: lookup(companyKey, r["company_id"]),
    round_number: Number(r["round_number"] ?? 0),
    interview_count: 1,
    passed: String(r["outcome"]) === "passed" ? 1 : 0,
    score: r["score"] ?? null,
    duration_minutes: Number(r["duration_minutes"] ?? 0),
  }));

  const fact_placement = rows("placements").map((r) => ({
    placement_id: r["placement_id"],
    date_key: dateKey(r["offer_date"] as string),
    joining_date_key: dateKey(r["joining_date"] as string),
    student_key: lookup(studentKey, r["student_id"]),
    company_key: lookup(companyKey, r["company_id"]),
    job_key: lookup(jobKey, r["job_id"]),
    college_key: lookup(collegeKey, r["college_id"]),
    placement_count: 1,
    ctc_annual: Number(r["ctc_annual"] ?? 0),
    base_salary: Number(r["base_salary"] ?? 0),
    bonus: Number(r["bonus"] ?? 0),
    is_joined: String(r["offer_status"]) === "joined" ? 1 : 0,
  }));

  const fact_job_posting = rows("jobs").map((r) => ({
    job_id: r["job_id"],
    date_key: dateKey(r["posted_at"] as string),
    company_key: lookup(companyKey, r["company_id"]),
    job_key: lookup(jobKey, r["job_id"]),
    recruiter_key: lookup(recruiterKey, r["recruiter_id"]),
    location_key: lookup(locationKey, r["location_code"]),
    posting_count: 1,
    openings: Number(r["openings"] ?? 0),
    min_salary: Number(r["min_salary"] ?? 0),
    max_salary: Number(r["max_salary"] ?? 0),
    salary_midpoint: Number(
      r["salary_midpoint"] ?? (Number(r["min_salary"] ?? 0) + Number(r["max_salary"] ?? 0)) / 2,
    ),
  }));

  const fact_learning = rows("learning_enrollments").map((r) => ({
    enrollment_id: r["enrollment_id"],
    date_key: dateKey(r["enrolled_at"] as string),
    student_key: lookup(studentKey, r["student_id"]),
    course_key: lookup(courseKey, r["course_id"]),
    skill_key: lookup(skillKey, r["skill_id"]),
    enrollment_count: 1,
    progress_pct: Number(r["progress_pct"] ?? 0),
    hours_spent: Number(r["hours_spent"] ?? 0),
    is_completed: r["completed_at"] ? 1 : 0,
  }));

  const certificationSkill = new Map(
    rows("certifications").map((r) => [String(r["certification_id"]), r]),
  );

  const fact_certification = rows("student_certifications").map((r) => {
    const cert = certificationSkill.get(String(r["certification_id"]));
    return {
      student_certification_id: r["student_certification_id"],
      certification_id: r["certification_id"],
      date_key: dateKey(r["issued_at"] as string),
      expiry_date_key: dateKey(r["expires_at"] as string),
      student_key: lookup(studentKey, r["student_id"]),
      skill_key: lookup(skillKey, cert?.["skill_id"]),
      certification_count: 1,
      is_verified: r["verified"] ? 1 : 0,
      validity_months: Number(cert?.["validity_months"] ?? 0),
    };
  });

  const fact_salary = rows("salaries").map((r) => ({
    salary_id: r["salary_id"],
    date_key: dateKey(`${String(r["observed_month"] ?? "").slice(0, 7)}-01`),
    job_key: lookup(jobKey, r["job_id"]),
    company_key: lookup(companyKey, r["company_id"]),
    location_key: lookup(locationKey, r["location_code"]),
    category_code: r["category_code"],
    experience_code: r["experience_code"],
    observation_count: 1,
    base_min: Number(r["base_min"] ?? 0),
    base_median: Number(r["base_median"] ?? 0),
    base_max: Number(r["base_max"] ?? 0),
    bonus_pct: Number(r["bonus_pct"] ?? 0),
    equity_pct: Number(r["equity_pct"] ?? 0),
    sample_size: Number(r["sample_size"] ?? 0),
  }));

  const fact_hiring = rows("hiring_trends").map((r) => ({
    date_key: dateKey(`${String(r["month"] ?? "").slice(0, 7)}-01`),
    location_key: lookup(locationKey, r["location_code"]),
    category_code: r["category_code"],
    trend_id: r["trend_id"],
    jobs_posted: Number(r["jobs_posted"] ?? 0),
    applications_received: Number(r["applications_received"] ?? 0),
    offers_made: Number(r["offers_made"] ?? 0),
    avg_time_to_hire_days: Number(r["avg_time_to_hire_days"] ?? 0),
    demand_index: Number(r["demand_index"] ?? 0),
  }));

  // Every dimension carries an "Unknown" member (key -1) so facts whose parent
  // was quarantined or arrived late still join cleanly.
  const unknown = (businessKeyField: string, label: string): Row & { surrogate_key: number } => ({
    surrogate_key: UNKNOWN_KEY,
    [businessKeyField]: "__UNKNOWN__",
    ...(label ? { [label]: "Unknown" } : {}),
  });
  const unknownScd2 = (businessKeyField: string, label: string): Scd2Row<Row> => ({
    ...unknown(businessKeyField, label),
    effective_from: options.effectiveFrom,
    effective_to: null,
    is_current: true,
    version: 0,
  });

  return {
    tables: {
      dim_date,
      dim_student: [unknownScd2("student_id", "full_name"), ...studentScd.rows],
      dim_company: [unknownScd2("company_id", "company_name"), ...companyScd.rows],
      dim_job: [unknown("job_id", "title"), ...dim_job],
      dim_skill: [unknown("skill_id", "skill_name"), ...dim_skill],
      dim_location: [unknown("location_code", "city"), ...dim_location],
      dim_college: [unknown("college_id", "college_name"), ...dim_college],
      dim_course: [unknown("course_id", "course_name"), ...dim_course],
      dim_technology: [unknown("technology_code", "technology_name"), ...dim_technology],
      dim_recruiter: [unknownScd2("recruiter_id", "full_name"), ...recruiterScd.rows],

      fact_application,
      fact_interview,
      fact_placement,
      fact_salary,
      fact_job_posting,
      fact_learning,
      fact_certification,
      fact_hiring,
    },
    scd: {
      dim_student: { inserted: studentScd.inserted, updated: studentScd.updated },
      dim_company: { inserted: companyScd.inserted, updated: companyScd.updated },
      dim_recruiter: { inserted: recruiterScd.inserted, updated: recruiterScd.updated },
    },
  };
}
