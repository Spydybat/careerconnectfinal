/**
 * Star schema definitions (Career Connect approved warehouse architecture).
 *
 * Grain is documented per table because it is the single most important
 * contract in a dimensional model. Every column carries enough metadata for
 * the machine-readable data dictionary and for lineage:
 *   source (system.table.column) -> target (table.column) + transformation.
 */

export type ColumnRole =
  | "surrogate_key"
  | "business_key"
  | "foreign_key"
  | "degenerate_dimension"
  | "attribute"
  | "measure"
  | "scd";

export type MeasureType = "additive" | "semi_additive" | "non_additive" | "n/a";

export interface ColumnSpec {
  name: string;
  type: string;
  role: ColumnRole;
  description: string;
  nullable: boolean;
  /** `dataset.column` in the curated layer, or a derivation note. */
  source: string;
  transformation: string;
  measure_type: MeasureType;
  pii: "none" | "synthetic_pii";
}

export interface TableSpec {
  name: string;
  kind: "dimension" | "fact";
  grain: string;
  scd: "type_1" | "type_2" | "static" | "n/a";
  /** Fact only: the business process the fact records. */
  business_process: string;
  /** Curated datasets the table is built from. */
  source_tables: string[];
  owner: string;
  /** Dimensions: business key column. Facts: the grain key column list. */
  grain_keys: string[];
  has_unknown_member: boolean;
  columns: ColumnSpec[];
}

interface ColOptions {
  nullable?: boolean;
  source?: string;
  transformation?: string;
  measure_type?: MeasureType;
  pii?: "none" | "synthetic_pii";
}

const col = (
  name: string,
  type: string,
  role: ColumnRole,
  description: string,
  options: ColOptions = {},
): ColumnSpec => ({
  name,
  type,
  role,
  description,
  nullable: options.nullable ?? false,
  source: options.source ?? "derived",
  transformation: options.transformation ?? "direct copy",
  measure_type: options.measure_type ?? (role === "measure" ? "additive" : "n/a"),
  pii: options.pii ?? "none",
});

const dim = (
  name: string,
  grain: string,
  scd: TableSpec["scd"],
  meta: {
    source_tables: string[];
    owner: string;
    business_key: string;
    has_unknown_member?: boolean;
  },
  columns: ColumnSpec[],
): TableSpec => ({
  name,
  kind: "dimension",
  grain,
  scd,
  business_process: "master data conformance",
  source_tables: meta.source_tables,
  owner: meta.owner,
  grain_keys: [meta.business_key],
  has_unknown_member: meta.has_unknown_member ?? true,
  columns,
});

const fact = (
  name: string,
  grain: string,
  meta: {
    business_process: string;
    source_tables: string[];
    owner: string;
    grain_keys: string[];
  },
  columns: ColumnSpec[],
): TableSpec => ({
  name,
  kind: "fact",
  grain,
  scd: "n/a",
  business_process: meta.business_process,
  source_tables: meta.source_tables,
  owner: meta.owner,
  grain_keys: meta.grain_keys,
  has_unknown_member: false,
  columns,
});

const scdColumns = (): ColumnSpec[] => [
  col("effective_from", "timestamp", "scd", "Version start timestamp", {
    source: "pipeline.run.started_at",
    transformation: "run timestamp at the moment the version was opened",
  }),
  col("effective_to", "timestamp", "scd", "Version end timestamp (null = current)", {
    nullable: true,
    source: "pipeline.run.started_at",
    transformation: "set when a newer version supersedes this row",
  }),
  col("is_current", "boolean", "scd", "Current-record indicator"),
  col("version", "integer", "scd", "Monotonic version number per business key"),
];

export const DIMENSIONS: TableSpec[] = [
  dim(
    "dim_date",
    "One row per calendar day in the reporting window (2023-01-01 .. 2026-12-31)",
    "static",
    {
      source_tables: ["generated calendar"],
      owner: "data_platform",
      business_key: "date",
      has_unknown_member: false,
    },
    [
      col("date_key", "integer", "surrogate_key", "YYYYMMDD smart key", {
        source: "calendar.date",
        transformation: "to_char(date,'YYYYMMDD')::int",
      }),
      col("date", "date", "business_key", "Calendar date", { source: "calendar.date" }),
      col("year", "integer", "attribute", "Calendar year", {
        source: "calendar.date",
        transformation: "extract(year)",
      }),
      col("quarter", "integer", "attribute", "Calendar quarter 1-4", {
        source: "calendar.date",
        transformation: "extract(quarter)",
      }),
      col("month", "integer", "attribute", "Month number", {
        source: "calendar.date",
        transformation: "extract(month)",
      }),
      col("month_name", "text", "attribute", "Month name", {
        source: "calendar.date",
        transformation: "month lookup",
      }),
      col("day_of_month", "integer", "attribute", "Day of month", { source: "calendar.date" }),
      col("day_of_week", "integer", "attribute", "0=Sunday", { source: "calendar.date" }),
      col("is_weekend", "boolean", "attribute", "Weekend flag", {
        source: "calendar.date",
        transformation: "day_of_week in (0,6)",
      }),
      col("academic_year", "text", "attribute", "Jul-Jun academic year label", {
        source: "calendar.date",
        transformation: "Jul-Jun window label",
      }),
      col("placement_season", "text", "attribute", "Placement season label", {
        source: "calendar.date",
        transformation: "Jul-Jun window label",
      }),
    ],
  ),
  dim(
    "dim_student",
    "One row per student version (SCD2)",
    "type_2",
    { source_tables: ["students"], owner: "campus_analytics", business_key: "student_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key", {
        transformation: "dense sequence per dimension",
      }),
      col("student_id", "text", "business_key", "Source student identifier", {
        source: "students.student_id",
      }),
      col("full_name", "text", "attribute", "Student name (synthetic)", {
        source: "students.full_name",
        pii: "synthetic_pii",
      }),
      col("college_id", "text", "attribute", "Owning college", { source: "students.college_id" }),
      col("degree_code", "text", "attribute", "Degree code", { source: "students.degree_code" }),
      col("branch", "text", "attribute", "Branch of study (tracked)", {
        source: "students.branch",
      }),
      col("graduation_year", "integer", "attribute", "Expected graduation year", {
        source: "students.graduation_year",
      }),
      col("cgpa", "numeric", "attribute", "Tracked: CGPA", { source: "students.cgpa" }),
      col("backlogs", "integer", "attribute", "Tracked: active backlogs", {
        source: "students.backlogs",
      }),
      col("is_placement_eligible", "boolean", "attribute", "Tracked: eligibility", {
        source: "students.is_placement_eligible",
        transformation: "cgpa >= 6 and backlogs = 0",
      }),
      col("location_code", "text", "attribute", "Student location", {
        source: "students.location_code",
      }),
      ...scdColumns(),
    ],
  ),
  dim(
    "dim_company",
    "One row per company version (SCD2)",
    "type_2",
    { source_tables: ["companies"], owner: "employer_relations", business_key: "company_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("company_id", "text", "business_key", "Source company identifier", {
        source: "companies.company_id",
      }),
      col("company_name", "text", "attribute", "Company name", {
        source: "companies.company_name",
      }),
      col("industry", "text", "attribute", "Tracked: industry", { source: "companies.industry" }),
      col("size_code", "text", "attribute", "Tracked: size band", {
        source: "companies.size_code",
      }),
      col("headcount", "integer", "attribute", "Tracked: headcount", {
        source: "companies.headcount",
      }),
      col("rating", "numeric", "attribute", "Employer rating", { source: "companies.rating" }),
      col("is_hiring_partner", "boolean", "attribute", "Tracked: partner flag", {
        source: "companies.is_hiring_partner",
      }),
      col("headquarters_location_code", "text", "attribute", "HQ location", {
        source: "companies.headquarters_location_code",
      }),
      ...scdColumns(),
    ],
  ),
  dim(
    "dim_job",
    "One row per job posting, current state (SCD1)",
    "type_1",
    { source_tables: ["jobs"], owner: "employer_relations", business_key: "job_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("job_id", "text", "business_key", "Source job identifier", { source: "jobs.job_id" }),
      col("title", "text", "attribute", "Job title", { source: "jobs.title" }),
      col("category_code", "text", "attribute", "Job category", { source: "jobs.category_code" }),
      col("employment_code", "text", "attribute", "Employment type", {
        source: "jobs.employment_code",
      }),
      col("experience_code", "text", "attribute", "Experience level", {
        source: "jobs.experience_code",
      }),
      col("is_remote", "boolean", "attribute", "Remote flag", { source: "jobs.is_remote" }),
      col("status", "text", "attribute", "Posting status (overwritten on change)", {
        source: "jobs.status",
      }),
      col("location_code", "text", "attribute", "Posting location", {
        source: "jobs.location_code",
      }),
      col("company_id", "text", "attribute", "Owning company", { source: "jobs.company_id" }),
    ],
  ),
  dim(
    "dim_skill",
    "One row per skill in the taxonomy (SCD1)",
    "type_1",
    { source_tables: ["skills"], owner: "market_intelligence", business_key: "skill_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("skill_id", "text", "business_key", "Source skill identifier", {
        source: "skills.skill_id",
      }),
      col("skill_name", "text", "attribute", "Skill name", { source: "skills.skill_name" }),
      col("skill_category", "text", "attribute", "technical | soft | domain", {
        source: "skills.skill_category",
      }),
      col("skill_group", "text", "attribute", "Analytics grouping", {
        source: "skills.skill_group",
      }),
      col("demand_index", "numeric", "attribute", "Market demand 0-100", {
        source: "skills.demand_index",
      }),
      col("is_emerging", "boolean", "attribute", "Emerging skill flag", {
        source: "skills.is_emerging",
      }),
    ],
  ),
  dim(
    "dim_location",
    "One row per location code (static reference)",
    "static",
    { source_tables: ["locations"], owner: "data_platform", business_key: "location_code" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("location_code", "text", "business_key", "Location code", {
        source: "locations.location_code",
      }),
      col("city", "text", "attribute", "City", { source: "locations.city" }),
      col("state", "text", "attribute", "State", { source: "locations.state" }),
      col("country", "text", "attribute", "Country", { source: "locations.country" }),
      col("city_tier", "integer", "attribute", "Metro tier", { source: "locations.city_tier" }),
      col("region", "text", "attribute", "Region", { source: "locations.region" }),
    ],
  ),
  dim(
    "dim_college",
    "One row per college (SCD1)",
    "type_1",
    { source_tables: ["colleges"], owner: "campus_analytics", business_key: "college_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("college_id", "text", "business_key", "Source college identifier", {
        source: "colleges.college_id",
      }),
      col("college_name", "text", "attribute", "College name", { source: "colleges.college_name" }),
      col("location_code", "text", "attribute", "Location", { source: "colleges.location_code" }),
      col("accreditation", "text", "attribute", "Accreditation grade", {
        source: "colleges.accreditation",
      }),
      col("is_autonomous", "boolean", "attribute", "Autonomy flag", {
        source: "colleges.is_autonomous",
      }),
    ],
  ),
  dim(
    "dim_course",
    "One row per learning course (SCD1)",
    "type_1",
    { source_tables: ["courses"], owner: "learning", business_key: "course_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("course_id", "text", "business_key", "Source course identifier", {
        source: "courses.course_id",
      }),
      col("course_name", "text", "attribute", "Course name", { source: "courses.course_name" }),
      col("provider", "text", "attribute", "Provider", { source: "courses.provider" }),
      col("skill_id", "text", "attribute", "Primary skill taught", { source: "courses.skill_id" }),
      col("level", "text", "attribute", "Difficulty", { source: "courses.level" }),
    ],
  ),
  dim(
    "dim_technology",
    "One row per technology in the technology taxonomy (static reference)",
    "static",
    {
      source_tables: ["technologies"],
      owner: "market_intelligence",
      business_key: "technology_code",
    },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("technology_code", "text", "business_key", "Technology code", {
        source: "technologies.technology_code",
      }),
      col("technology_name", "text", "attribute", "Technology name", {
        source: "technologies.technology_name",
      }),
      col("technology_group", "text", "attribute", "Technology family", {
        source: "technologies.technology_group",
      }),
    ],
  ),
  dim(
    "dim_recruiter",
    "One row per recruiter version (SCD2)",
    "type_2",
    { source_tables: ["recruiters"], owner: "employer_relations", business_key: "recruiter_id" },
    [
      col("surrogate_key", "integer", "surrogate_key", "Warehouse surrogate key"),
      col("recruiter_id", "text", "business_key", "Source recruiter identifier", {
        source: "recruiters.recruiter_id",
      }),
      col("full_name", "text", "attribute", "Recruiter name (synthetic)", {
        source: "recruiters.full_name",
        pii: "synthetic_pii",
      }),
      col("company_id", "text", "attribute", "Employing company", {
        source: "recruiters.company_id",
      }),
      col("designation", "text", "attribute", "Tracked: designation", {
        source: "recruiters.designation",
      }),
      col("is_active", "boolean", "attribute", "Tracked: active flag", {
        source: "recruiters.is_active",
      }),
      ...scdColumns(),
    ],
  ),
];

export const FACTS: TableSpec[] = [
  fact(
    "fact_application",
    "One row per application event: exactly one row per source application_id",
    {
      business_process: "A student applies to a job posting",
      source_tables: ["applications"],
      owner: "placement_office",
      grain_keys: ["application_id"],
    },
    [
      col("application_id", "text", "degenerate_dimension", "Source application id (grain key)", {
        source: "applications.application_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — application date", {
        source: "applications.applied_at",
        transformation: "dateKey(applied_at)",
      }),
      col("student_key", "integer", "foreign_key", "dim_student", {
        source: "applications.student_id",
        transformation: "lookup current dim_student",
      }),
      col("job_key", "integer", "foreign_key", "dim_job", {
        source: "applications.job_id",
        transformation: "lookup dim_job",
      }),
      col("company_key", "integer", "foreign_key", "dim_company", {
        source: "applications.company_id",
        transformation: "lookup current dim_company",
      }),
      col("application_count", "integer", "measure", "Always 1", {
        source: "applications",
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("match_score", "numeric", "measure", "Resume/job match 0-100", {
        source: "applications.match_score",
        measure_type: "non_additive",
      }),
      col("is_shortlisted", "integer", "measure", "1 when the application passed screening", {
        source: "applications.status",
        transformation: "status in (shortlisted, interviewing, offered, hired, accepted)",
        measure_type: "additive",
      }),
      col("is_rejected", "integer", "measure", "1 when rejected", {
        source: "applications.status",
        transformation: "status = 'rejected'",
        measure_type: "additive",
      }),
    ],
  ),
  fact(
    "fact_interview",
    "One row per interview event: exactly one row per source interview_id (one round)",
    {
      business_process: "A candidate attends an interview round",
      source_tables: ["interviews"],
      owner: "placement_office",
      grain_keys: ["interview_id"],
    },
    [
      col("interview_id", "text", "degenerate_dimension", "Source interview id (grain key)", {
        source: "interviews.interview_id",
      }),
      col("application_id", "text", "degenerate_dimension", "Originating application", {
        source: "interviews.application_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — scheduled date", {
        source: "interviews.scheduled_at",
        transformation: "dateKey(scheduled_at)",
      }),
      col("student_key", "integer", "foreign_key", "dim_student", {
        source: "interviews.student_id",
      }),
      col("job_key", "integer", "foreign_key", "dim_job", { source: "interviews.job_id" }),
      col("company_key", "integer", "foreign_key", "dim_company", {
        source: "interviews.company_id",
      }),
      col("round_number", "integer", "attribute", "Round sequence", {
        source: "interviews.round_number",
      }),
      col("interview_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("passed", "integer", "measure", "1 when outcome = passed", {
        source: "interviews.outcome",
        measure_type: "additive",
      }),
      col("score", "numeric", "measure", "Panel score if provided", {
        source: "interviews.score",
        nullable: true,
        measure_type: "non_additive",
      }),
      col("duration_minutes", "integer", "measure", "Scheduled duration", {
        source: "interviews.duration_minutes",
        measure_type: "additive",
      }),
    ],
  ),
  fact(
    "fact_placement",
    "One row per placement event: exactly one row per source placement_id (offer issued)",
    {
      business_process: "A company issues a placement offer to a student",
      source_tables: ["placements"],
      owner: "placement_office",
      grain_keys: ["placement_id"],
    },
    [
      col("placement_id", "text", "degenerate_dimension", "Source placement id (grain key)", {
        source: "placements.placement_id",
      }),
      col("application_id", "text", "degenerate_dimension", "Originating application", {
        source: "placements.application_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — offer date", {
        source: "placements.offer_date",
        transformation: "dateKey(offer_date)",
      }),
      col("joining_date_key", "integer", "foreign_key", "dim_date — joining date", {
        source: "placements.joining_date",
        transformation: "dateKey(joining_date)",
      }),
      col("student_key", "integer", "foreign_key", "dim_student", {
        source: "placements.student_id",
      }),
      col("company_key", "integer", "foreign_key", "dim_company", {
        source: "placements.company_id",
      }),
      col("job_key", "integer", "foreign_key", "dim_job", { source: "placements.job_id" }),
      col("college_key", "integer", "foreign_key", "dim_college", {
        source: "placements.college_id",
      }),
      col("placement_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("ctc_annual", "numeric", "measure", "Annual CTC of the offer", {
        source: "placements.ctc_annual",
        measure_type: "additive",
      }),
      col("base_salary", "numeric", "measure", "Base component", {
        source: "placements.base_salary",
        measure_type: "additive",
      }),
      col("bonus", "numeric", "measure", "Bonus component", {
        source: "placements.bonus",
        measure_type: "additive",
      }),
      col("is_joined", "integer", "measure", "1 when offer_status = joined", {
        source: "placements.offer_status",
        measure_type: "additive",
      }),
    ],
  ),
  fact(
    "fact_salary",
    "One row per salary observation: exactly one row per source salary_id (role x level x location x month)",
    {
      business_process: "A compensation band is observed for a role in a market",
      source_tables: ["salaries"],
      owner: "market_intelligence",
      grain_keys: ["salary_id"],
    },
    [
      col("salary_id", "text", "degenerate_dimension", "Source salary observation id (grain key)", {
        source: "salaries.salary_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — first day of observed month", {
        source: "salaries.observed_month",
        transformation: "dateKey(observed_month || '-01')",
      }),
      col("job_key", "integer", "foreign_key", "dim_job", { source: "salaries.job_id" }),
      col("company_key", "integer", "foreign_key", "dim_company", {
        source: "salaries.company_id",
      }),
      col("location_key", "integer", "foreign_key", "dim_location", {
        source: "salaries.location_code",
      }),
      col("category_code", "text", "attribute", "Job category", {
        source: "salaries.category_code",
      }),
      col("experience_code", "text", "attribute", "Experience level", {
        source: "salaries.experience_code",
      }),
      col("observation_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("base_min", "numeric", "measure", "Band minimum", {
        source: "salaries.base_min",
        measure_type: "semi_additive",
      }),
      col("base_median", "numeric", "measure", "Band median", {
        source: "salaries.base_median",
        measure_type: "non_additive",
      }),
      col("base_max", "numeric", "measure", "Band maximum", {
        source: "salaries.base_max",
        measure_type: "semi_additive",
      }),
      col("bonus_pct", "numeric", "measure", "Bonus percentage", {
        source: "salaries.bonus_pct",
        measure_type: "non_additive",
      }),
      col("equity_pct", "numeric", "measure", "Equity percentage", {
        source: "salaries.equity_pct",
        measure_type: "non_additive",
      }),
      col("sample_size", "integer", "measure", "Observations behind the band", {
        source: "salaries.sample_size",
        measure_type: "additive",
      }),
    ],
  ),
  fact(
    "fact_job_posting",
    "One row per job posting event: exactly one row per source job_id",
    {
      business_process: "A company publishes a job posting",
      source_tables: ["jobs"],
      owner: "employer_relations",
      grain_keys: ["job_id"],
    },
    [
      col("job_id", "text", "degenerate_dimension", "Source job id (grain key)", {
        source: "jobs.job_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — posted date", {
        source: "jobs.posted_at",
        transformation: "dateKey(posted_at)",
      }),
      col("company_key", "integer", "foreign_key", "dim_company", { source: "jobs.company_id" }),
      col("job_key", "integer", "foreign_key", "dim_job", { source: "jobs.job_id" }),
      col("recruiter_key", "integer", "foreign_key", "dim_recruiter", {
        source: "jobs.recruiter_id",
      }),
      col("location_key", "integer", "foreign_key", "dim_location", {
        source: "jobs.location_code",
      }),
      col("posting_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("openings", "integer", "measure", "Vacancies advertised", {
        source: "jobs.openings",
        measure_type: "additive",
      }),
      col("min_salary", "numeric", "measure", "Band minimum", {
        source: "jobs.min_salary",
        measure_type: "semi_additive",
      }),
      col("max_salary", "numeric", "measure", "Band maximum", {
        source: "jobs.max_salary",
        measure_type: "semi_additive",
      }),
      col("salary_midpoint", "numeric", "measure", "Band midpoint", {
        source: "jobs.min_salary, jobs.max_salary",
        transformation: "(min_salary + max_salary) / 2",
        measure_type: "non_additive",
      }),
    ],
  ),
  fact(
    "fact_learning",
    "One row per learning event: exactly one row per source enrollment_id (student x course enrollment)",
    {
      business_process: "A student enrolls in and progresses through a course",
      source_tables: ["learning_enrollments"],
      owner: "learning",
      grain_keys: ["enrollment_id"],
    },
    [
      col("enrollment_id", "text", "degenerate_dimension", "Source enrollment id (grain key)", {
        source: "learning_enrollments.enrollment_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — enrollment date", {
        source: "learning_enrollments.enrolled_at",
        transformation: "dateKey(enrolled_at)",
      }),
      col("student_key", "integer", "foreign_key", "dim_student", {
        source: "learning_enrollments.student_id",
      }),
      col("course_key", "integer", "foreign_key", "dim_course", {
        source: "learning_enrollments.course_id",
      }),
      col("skill_key", "integer", "foreign_key", "dim_skill", {
        source: "learning_enrollments.skill_id",
      }),
      col("enrollment_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("progress_pct", "numeric", "measure", "Completion percentage at observation", {
        source: "learning_enrollments.progress_pct",
        measure_type: "semi_additive",
      }),
      col("hours_spent", "numeric", "measure", "Learning hours", {
        source: "learning_enrollments.hours_spent",
        measure_type: "additive",
      }),
      col("is_completed", "integer", "measure", "1 when completed_at is set", {
        source: "learning_enrollments.completed_at",
        measure_type: "additive",
      }),
    ],
  ),
  fact(
    "fact_certification",
    "One row per certification event: exactly one row per source student_certification_id",
    {
      business_process: "A student earns a certification",
      source_tables: ["student_certifications", "certifications"],
      owner: "learning",
      grain_keys: ["student_certification_id"],
    },
    [
      col(
        "student_certification_id",
        "text",
        "degenerate_dimension",
        "Source student certification id (grain key)",
        { source: "student_certifications.student_certification_id" },
      ),
      col("certification_id", "text", "degenerate_dimension", "Certification catalogue id", {
        source: "student_certifications.certification_id",
      }),
      col("date_key", "integer", "foreign_key", "dim_date — issue date", {
        source: "student_certifications.issued_at",
        transformation: "dateKey(issued_at)",
      }),
      col("expiry_date_key", "integer", "foreign_key", "dim_date — expiry date", {
        source: "student_certifications.expires_at",
        transformation: "dateKey(expires_at)",
      }),
      col("student_key", "integer", "foreign_key", "dim_student", {
        source: "student_certifications.student_id",
      }),
      col("skill_key", "integer", "foreign_key", "dim_skill", {
        source: "certifications.skill_id",
        transformation: "join certifications on certification_id then lookup dim_skill",
      }),
      col("certification_count", "integer", "measure", "Always 1", {
        transformation: "constant 1",
        measure_type: "additive",
      }),
      col("is_verified", "integer", "measure", "1 when verified by the issuer", {
        source: "student_certifications.verified",
        measure_type: "additive",
      }),
      col("validity_months", "integer", "measure", "Certification validity window", {
        source: "certifications.validity_months",
        measure_type: "non_additive",
      }),
    ],
  ),
  fact(
    "fact_hiring",
    "One row per hiring event bucket: month x job category x location (periodic snapshot)",
    {
      business_process: "Hiring demand and conversion observed in a market each month",
      source_tables: ["hiring_trends"],
      owner: "market_intelligence",
      grain_keys: ["date_key", "category_code", "location_key"],
    },
    [
      col("date_key", "integer", "foreign_key", "dim_date — first day of the month", {
        source: "hiring_trends.month",
        transformation: "dateKey(month || '-01')",
      }),
      col("location_key", "integer", "foreign_key", "dim_location", {
        source: "hiring_trends.location_code",
      }),
      col("category_code", "text", "attribute", "Job category (grain key)", {
        source: "hiring_trends.category_code",
      }),
      col("trend_id", "text", "degenerate_dimension", "Source trend id", {
        source: "hiring_trends.trend_id",
      }),
      col("jobs_posted", "integer", "measure", "Postings in the bucket", {
        source: "hiring_trends.jobs_posted",
        measure_type: "additive",
      }),
      col("applications_received", "integer", "measure", "Applications in the bucket", {
        source: "hiring_trends.applications_received",
        measure_type: "additive",
      }),
      col("offers_made", "integer", "measure", "Offers from the bucket's application cohort", {
        source: "hiring_trends.offers_made",
        measure_type: "additive",
      }),
      col("avg_time_to_hire_days", "numeric", "measure", "Average days to hire", {
        source: "hiring_trends.avg_time_to_hire_days",
        measure_type: "non_additive",
      }),
      col("demand_index", "numeric", "measure", "Composite demand index 0-100", {
        source: "hiring_trends.demand_index",
        measure_type: "non_additive",
      }),
    ],
  ),
];

export const STAR_SCHEMA: TableSpec[] = [...DIMENSIONS, ...FACTS];

export function tableSpec(name: string): TableSpec | undefined {
  return STAR_SCHEMA.find((table) => table.name === name);
}
