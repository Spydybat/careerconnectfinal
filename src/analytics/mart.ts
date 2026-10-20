/**
 * Analytics marts — the BI consumption layer.
 *
 * Built strictly FROM the warehouse star schema (dimensions + facts). Every
 * row is denormalised onto the conformed dimension set declared in
 * `dimensions.ts`, which is what makes global filters composable.
 *
 * Curated data is used for exactly two things the star schema has no table
 * for: the job<->skill and job<->technology bridges (a many-to-many the
 * Sprint 8 warehouse does not model). Those bridges are built here rather
 * than by modifying the frozen warehouse architecture.
 */

import type { Row } from "@/data-platform/etl/transform";
import type { WarehouseTables } from "@/data-platform/warehouse/build";
import type { ConformedDims, Freshness, MartRow } from "./types";

export interface AnalyticsMart {
  freshness: Freshness;
  applications: MartRow[];
  interviews: MartRow[];
  placements: MartRow[];
  jobs: MartRow[];
  salaries: MartRow[];
  learning: MartRow[];
  certifications: MartRow[];
  hiring: MartRow[];
  students: MartRow[];
  job_skills: MartRow[];
  student_skills: MartRow[];
  job_technologies: MartRow[];
  reference: {
    colleges: { value: string; label: string }[];
    companies: { value: string; label: string }[];
    industries: { value: string; label: string }[];
    locations: { value: string; label: string }[];
    roles: { value: string; label: string }[];
    departments: { value: string; label: string }[];
    batches: { value: string; label: string }[];
    skills: { value: string; label: string }[];
    technologies: { value: string; label: string }[];
    experiences: { value: string; label: string }[];
    employmentTypes: { value: string; label: string }[];
    years: { value: string; label: string }[];
    months: { value: string; label: string }[];
  };
}

const EMPTY_DIMS: ConformedDims = {
  date: "",
  month: "",
  quarter: "",
  year: 0,
  location_code: "",
  city: "",
  region: "",
  industry: "",
  company_id: "",
  company_name: "",
  category_code: "",
  role_title: "",
  experience_code: "",
  employment_code: "",
  college_id: "",
  college_name: "",
  department: "",
  batch: 0,
  student_id: "",
  recruiter_id: "",
  skill_id: "",
  technology_code: "",
};

const s = (value: unknown): string => (value === null || value === undefined ? "" : String(value));
const n = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const quarterOf = (date: string): string =>
  date.length >= 7
    ? `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}`
    : "";

function dateParts(date: string) {
  return {
    date,
    month: date.slice(0, 7),
    quarter: quarterOf(date),
    year: date ? Number(date.slice(0, 4)) : 0,
  };
}

export interface BuildMartOptions {
  warehouse: WarehouseTables;
  curated: Record<string, Row[]>;
  freshness: Omit<Freshness, "data_through" | "warehouse_rows">;
}

export function buildAnalyticsMart(options: BuildMartOptions): AnalyticsMart {
  const { warehouse: w, curated } = options;

  // ---- dimension lookups ------------------------------------------------
  const dateByKey = new Map(w.dim_date.map((d) => [d.date_key, d.date]));
  const studentByKey = new Map(w.dim_student.map((r) => [r.surrogate_key, r]));
  const companyByKey = new Map(w.dim_company.map((r) => [r.surrogate_key, r]));
  const jobByKey = new Map(w.dim_job.map((r) => [r.surrogate_key, r]));
  const collegeByKey = new Map(w.dim_college.map((r) => [r.surrogate_key, r]));
  const locationByKey = new Map(w.dim_location.map((r) => [r.surrogate_key, r]));
  const courseByKey = new Map(w.dim_course.map((r) => [r.surrogate_key, r]));
  const skillByKey = new Map(w.dim_skill.map((r) => [r.surrogate_key, r]));
  const recruiterByKey = new Map(w.dim_recruiter.map((r) => [r.surrogate_key, r]));

  const companyByBk = new Map(
    w.dim_company.filter((r) => r.is_current).map((r) => [s(r["company_id"]), r]),
  );
  const jobByBk = new Map(w.dim_job.map((r) => [s(r["job_id"]), r]));
  const collegeByBk = new Map(w.dim_college.map((r) => [s(r["college_id"]), r]));
  const locationByBk = new Map(w.dim_location.map((r) => [s(r["location_code"]), r]));
  const skillByBk = new Map(w.dim_skill.map((r) => [s(r["skill_id"]), r]));
  const technologyByBk = new Map(w.dim_technology.map((r) => [s(r["technology_code"]), r]));
  const recruiterByBk = new Map(
    w.dim_recruiter.filter((r) => r.is_current).map((r) => [s(r["recruiter_id"]), r]),
  );

  const dateOf = (key: unknown): string => dateByKey.get(Number(key)) ?? "";

  /** Attributes contributed by the company dimension. */
  const companyDims = (key: unknown): Partial<ConformedDims> => {
    const company = companyByKey.get(Number(key));
    if (!company) return {};
    return {
      company_id: s(company["company_id"]),
      company_name: s(company["company_name"]),
      industry: s(company["industry"]),
    };
  };

  const jobDims = (key: unknown): Partial<ConformedDims> => {
    const job = jobByKey.get(Number(key));
    if (!job) return {};
    const location = locationByBk.get(s(job["location_code"]));
    return {
      category_code: s(job["category_code"]),
      role_title: s(job["title"]),
      experience_code: s(job["experience_code"]),
      employment_code: s(job["employment_code"]),
      location_code: s(job["location_code"]),
      city: s(location?.["city"]),
      region: s(location?.["region"]),
    };
  };

  const studentDims = (key: unknown): Partial<ConformedDims> => {
    const student = studentByKey.get(Number(key));
    if (!student) return {};
    const college = collegeByBk.get(s(student["college_id"]));
    return {
      student_id: s(student["student_id"]),
      college_id: s(student["college_id"]),
      college_name: s(college?.["college_name"]),
      department: s(student["branch"]),
      batch: n(student["graduation_year"]),
    };
  };

  const locationDims = (key: unknown): Partial<ConformedDims> => {
    const location = locationByKey.get(Number(key));
    if (!location) return {};
    return {
      location_code: s(location["location_code"]),
      city: s(location["city"]),
      region: s(location["region"]),
    };
  };

  const row = (parts: Partial<MartRow>[]): MartRow =>
    Object.assign({}, EMPTY_DIMS, ...parts) as MartRow;

  // ---- fact marts --------------------------------------------------------
  const applications: MartRow[] = w.fact_application.map((f) => {
    const date = dateOf(f["date_key"]);
    return row([
      dateParts(date),
      studentDims(f["student_key"]),
      companyDims(f["company_key"]),
      jobDims(f["job_key"]),
      {
        application_id: s(f["application_id"]),
        applications: 1,
        shortlisted: n(f["is_shortlisted"]),
        rejected: n(f["is_rejected"]),
        match_score: n(f["match_score"]),
      },
    ]);
  });

  const interviews: MartRow[] = w.fact_interview.map((f) => {
    const date = dateOf(f["date_key"]);
    return row([
      dateParts(date),
      studentDims(f["student_key"]),
      companyDims(f["company_key"]),
      jobDims(f["job_key"]),
      {
        interview_id: s(f["interview_id"]),
        interviews: 1,
        passed: n(f["passed"]),
        round_number: n(f["round_number"]),
        score: n(f["score"]),
        duration_minutes: n(f["duration_minutes"]),
      },
    ]);
  });

  // Time-to-hire per placement: offer date minus the originating application
  // date, resolved through the application fact (governed, not recomputed
  // in the dashboard).
  const applicationDateById = new Map(
    w.fact_application.map((f) => [s(f["application_id"]), dateOf(f["date_key"])]),
  );
  const placementApplication = new Map(
    (curated["placements"] ?? []).map((r) => [s(r["placement_id"]), s(r["application_id"])]),
  );
  const offerStatusById = new Map(
    (curated["placements"] ?? []).map((r) => [s(r["placement_id"]), s(r["offer_status"])]),
  );
  const dayDiff = (from: string, to: string): number => {
    if (!from || !to) return 0;
    const diff = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
    return Number.isFinite(diff) ? Math.max(0, Math.round(diff / 86_400_000)) : 0;
  };

  const placements: MartRow[] = w.fact_placement.map((f) => {
    const date = dateOf(f["date_key"]);
    const placementId = s(f["placement_id"]);
    const appDate = applicationDateById.get(placementApplication.get(placementId) ?? "") ?? "";
    const status = offerStatusById.get(placementId);
    const college = collegeByKey.get(Number(f["college_key"]));
    return row([
      dateParts(date),
      studentDims(f["student_key"]),
      companyDims(f["company_key"]),
      jobDims(f["job_key"]),
      {
        placement_id: placementId,
        college_id:
          s(college?.["college_id"]) ||
          s(studentByKey.get(Number(f["student_key"]))?.["college_id"]),
        college_name: s(college?.["college_name"]),
        placements: 1,
        offers: 1,
        ctc_annual: n(f["ctc_annual"]),
        base_salary: n(f["base_salary"]),
        bonus: n(f["bonus"]),
        joined: n(f["is_joined"]),
        accepted: status === "declined" || status === "withdrawn" ? 0 : 1,
        time_to_hire_days: dayDiff(appDate, date),
      },
    ]);
  });

  const jobStatusByBk = new Map(
    (curated["jobs"] ?? []).map((r) => [s(r["job_id"]), s(r["status"])]),
  );

  const jobs: MartRow[] = w.fact_job_posting.map((f) => {
    const date = dateOf(f["date_key"]);
    const jobId = s(f["job_id"]);
    const recruiter = recruiterByKey.get(Number(f["recruiter_key"]));
    const status = jobStatusByBk.get(jobId);
    return row([
      dateParts(date),
      companyDims(f["company_key"]),
      jobDims(f["job_key"]),
      locationDims(f["location_key"]),
      {
        job_id: jobId,
        recruiter_id: s(recruiter?.["recruiter_id"]),
        recruiter_name: s(recruiter?.["full_name"]),
        jobs: 1,
        active_jobs: status === "open" ? 1 : 0,
        status: status ?? "unknown",
        openings: n(f["openings"]),
        min_salary: n(f["min_salary"]),
        max_salary: n(f["max_salary"]),
        salary_midpoint: n(f["salary_midpoint"]),
      },
    ]);
  });

  const salaries: MartRow[] = w.fact_salary.map((f) => {
    const date = dateOf(f["date_key"]);
    return row([
      dateParts(date),
      companyDims(f["company_key"]),
      jobDims(f["job_key"]),
      locationDims(f["location_key"]),
      {
        salary_id: s(f["salary_id"]),
        category_code: s(f["category_code"]) || s(jobDims(f["job_key"]).category_code),
        experience_code: s(f["experience_code"]),
        observations: 1,
        base_min: n(f["base_min"]),
        base_median: n(f["base_median"]),
        base_max: n(f["base_max"]),
        bonus_pct: n(f["bonus_pct"]),
        sample_size: n(f["sample_size"]),
      },
    ]);
  });

  const learning: MartRow[] = w.fact_learning.map((f) => {
    const date = dateOf(f["date_key"]);
    const course = courseByKey.get(Number(f["course_key"]));
    const skill = skillByKey.get(Number(f["skill_key"]));
    return row([
      dateParts(date),
      studentDims(f["student_key"]),
      {
        enrollment_id: s(f["enrollment_id"]),
        course_id: s(course?.["course_id"]),
        course_name: s(course?.["course_name"]),
        provider: s(course?.["provider"]),
        level: s(course?.["level"]),
        skill_id: s(skill?.["skill_id"]),
        skill_name: s(skill?.["skill_name"]),
        enrollments: 1,
        completions: n(f["is_completed"]),
        progress_pct: n(f["progress_pct"]),
        hours_spent: n(f["hours_spent"]),
      },
    ]);
  });

  const certifications: MartRow[] = w.fact_certification.map((f) => {
    const date = dateOf(f["date_key"]);
    const skill = skillByKey.get(Number(f["skill_key"]));
    return row([
      dateParts(date),
      studentDims(f["student_key"]),
      {
        student_certification_id: s(f["student_certification_id"]),
        skill_id: s(skill?.["skill_id"]),
        skill_name: s(skill?.["skill_name"]),
        certifications: 1,
        verified: n(f["is_verified"]),
      },
    ]);
  });

  const hiring: MartRow[] = w.fact_hiring.map((f) => {
    const date = dateOf(f["date_key"]);
    return row([
      dateParts(date),
      locationDims(f["location_key"]),
      {
        trend_id: s(f["trend_id"]),
        category_code: s(f["category_code"]),
        jobs_posted: n(f["jobs_posted"]),
        applications_received: n(f["applications_received"]),
        offers_made: n(f["offers_made"]),
        avg_time_to_hire_days: n(f["avg_time_to_hire_days"]),
        demand_index: n(f["demand_index"]),
      },
    ]);
  });

  // ---- student mart (dimension-grain snapshot) ---------------------------
  const placedStudents = new Set(placements.map((p) => s(p["student_id"])));
  const studentCreatedAt = new Map(
    (curated["students"] ?? []).map((r) => [s(r["student_id"]), s(r["created_at"]).slice(0, 10)]),
  );

  const students: MartRow[] = w.dim_student
    .filter((r) => r.is_current && r.surrogate_key > 0)
    .map((r) => {
      const college = collegeByBk.get(s(r["college_id"]));
      const created = studentCreatedAt.get(s(r["student_id"])) ?? "";
      const location = locationByBk.get(s(r["location_code"]));
      return row([
        dateParts(created),
        {
          student_id: s(r["student_id"]),
          college_id: s(r["college_id"]),
          college_name: s(college?.["college_name"]),
          department: s(r["branch"]),
          batch: n(r["graduation_year"]),
          location_code: s(r["location_code"]),
          city: s(location?.["city"]),
          region: s(location?.["region"]),
          students: 1,
          eligible: r["is_placement_eligible"] ? 1 : 0,
          placed: placedStudents.has(s(r["student_id"])) ? 1 : 0,
          cgpa: n(r["cgpa"]),
          backlogs: n(r["backlogs"]),
        },
      ]);
    });

  // ---- bridges (many-to-many not modelled in the star schema) ------------
  const job_skills: MartRow[] = [];
  const job_technologies: MartRow[] = [];
  for (const job of curated["jobs"] ?? []) {
    const bk = s(job["job_id"]);
    const dimJob = jobByBk.get(bk);
    const company = companyByBk.get(s(job["company_id"]));
    const location = locationByBk.get(s(job["location_code"]));
    const date = s(job["posted_at"]).slice(0, 10);
    const shared = {
      ...dateParts(date),
      job_id: bk,
      category_code: s(dimJob?.["category_code"] ?? job["category_code"]),
      role_title: s(dimJob?.["title"] ?? job["title"]),
      experience_code: s(job["experience_code"]),
      employment_code: s(job["employment_code"]),
      location_code: s(job["location_code"]),
      city: s(location?.["city"]),
      region: s(location?.["region"]),
      company_id: s(job["company_id"]),
      company_name: s(company?.["company_name"]),
      industry: s(company?.["industry"]),
      openings: n(job["openings"]),
      salary_midpoint: n(job["salary_midpoint"]),
      min_salary: n(job["min_salary"]),
      max_salary: n(job["max_salary"]),
    };
    const skills = Array.isArray(job["required_skills"])
      ? (job["required_skills"] as unknown[])
      : [];
    for (const skillId of skills) {
      const skill = skillByBk.get(s(skillId));
      job_skills.push(
        row([
          shared,
          {
            skill_id: s(skillId),
            skill_name: s(skill?.["skill_name"]),
            skill_category: s(skill?.["skill_category"]),
            is_emerging: skill?.["is_emerging"] ? 1 : 0,
            demand_index: n(skill?.["demand_index"]),
            skill_postings: 1,
            skill_openings: n(job["openings"]),
          },
        ]),
      );
    }
    const techs = Array.isArray(job["required_technologies"])
      ? (job["required_technologies"] as unknown[])
      : [];
    for (const code of techs) {
      const tech = technologyByBk.get(s(code));
      job_technologies.push(
        row([
          shared,
          {
            technology_code: s(code),
            technology_name: s(tech?.["technology_name"]),
            technology_group: s(tech?.["technology_group"]),
            technology_postings: 1,
          },
        ]),
      );
    }
  }

  const student_skills: MartRow[] = [];
  for (const student of curated["students"] ?? []) {
    const bk = s(student["student_id"]);
    const college = collegeByBk.get(s(student["college_id"]));
    const skills = Array.isArray(student["primary_skills"])
      ? (student["primary_skills"] as unknown[])
      : [];
    for (const skillId of skills) {
      const skill = skillByBk.get(s(skillId));
      student_skills.push(
        row([
          dateParts(s(student["created_at"]).slice(0, 10)),
          {
            student_id: bk,
            college_id: s(student["college_id"]),
            college_name: s(college?.["college_name"]),
            department: s(student["branch"]),
            batch: n(student["graduation_year"]),
            location_code: s(student["location_code"]),
            skill_id: s(skillId),
            skill_name: s(skill?.["skill_name"]),
            skill_category: s(skill?.["skill_category"]),
            skill_holders: 1,
          },
        ]),
      );
    }
  }

  // ---- reference option lists (for filter controls) ----------------------
  const distinct = (
    rows: readonly MartRow[],
    valueKey: string,
    labelKey: string = valueKey,
  ): { value: string; label: string }[] => {
    const map = new Map<string, string>();
    for (const r of rows) {
      const value = s(r[valueKey]);
      if (!value) continue;
      if (!map.has(value)) map.set(value, s(r[labelKey]) || value);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const allDated = [...applications, ...jobs, ...placements, ...hiring];
  const years = [...new Set(allDated.map((r) => n(r["year"])).filter(Boolean))]
    .sort((a, b) => b - a)
    .map((y) => ({ value: String(y), label: String(y) }));
  const months = [...new Set(allDated.map((r) => s(r["month"])).filter(Boolean))]
    .sort()
    .reverse()
    .map((m) => ({ value: m, label: m }));

  const dataThrough =
    allDated.reduce((max, r) => (s(r["date"]) > max ? s(r["date"]) : max), "") ||
    options.freshness.last_updated.slice(0, 10);

  const warehouseRows = Object.values(w).reduce(
    (sum, table) => sum + (Array.isArray(table) ? table.length : 0),
    0,
  );

  return {
    freshness: { ...options.freshness, data_through: dataThrough, warehouse_rows: warehouseRows },
    applications,
    interviews,
    placements,
    jobs,
    salaries,
    learning,
    certifications,
    hiring,
    students,
    job_skills,
    student_skills,
    job_technologies,
    reference: {
      colleges: distinct(students, "college_id", "college_name"),
      companies: distinct(jobs, "company_id", "company_name"),
      industries: distinct(jobs, "industry"),
      locations: distinct([...jobs, ...hiring], "location_code", "city"),
      roles: distinct(jobs, "category_code"),
      departments: distinct(students, "department"),
      batches: distinct(students, "batch"),
      skills: distinct(job_skills, "skill_id", "skill_name"),
      technologies: distinct(job_technologies, "technology_code", "technology_name"),
      experiences: distinct(jobs, "experience_code"),
      employmentTypes: distinct(jobs, "employment_code"),
      years,
      months,
    },
  };
}
