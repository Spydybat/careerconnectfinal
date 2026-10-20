/**
 * Analytics marts — pre-aggregated, query-ready tables built on the star schema.
 */

import type { Row } from "../etl/transform";
import type { WarehouseTables } from "../warehouse/build";

export interface MartTables {
  mart_placement_summary: Row[];
  mart_company_hiring: Row[];
  mart_skill_demand_monthly: Row[];
  mart_student_funnel: Row[];
  mart_salary_benchmark: Row[];
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function groupBy<T>(rows: readonly T[], keyOf: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = map.get(key);
    if (bucket) bucket.push(row);
    else map.set(key, [row]);
  }
  return map;
}

export function buildMarts(tables: WarehouseTables): MartTables {
  const dateByKey = new Map(tables.dim_date.map((d) => [d.date_key, d]));
  const companyByKey = new Map(
    tables.dim_company
      .filter((c) => c.is_current && c.surrogate_key > 0)
      .map((c) => [c.surrogate_key, c]),
  );
  const studentByKey = new Map(
    tables.dim_student
      .filter((s) => s.is_current && s.surrogate_key > 0)
      .map((s) => [s.surrogate_key, s]),
  );
  const collegeByKey = new Map(tables.dim_college.map((c) => [c.surrogate_key, c]));

  // --- Placement summary by season and college ---------------------------
  const mart_placement_summary = [
    ...groupBy(tables.fact_placement, (row) => {
      const season = dateByKey.get(Number(row["date_key"]))?.placement_season ?? "unknown";
      return `${season}|${row["college_key"]}`;
    }),
  ]
    .map(([key, group]) => {
      const [season = "unknown", collegeKey = "-1"] = key.split("|");
      const college = collegeByKey.get(Number(collegeKey));
      const ctcs = group.map((g) => Number(g["ctc_annual"])).sort((a, b) => a - b);
      const total = ctcs.reduce((sum, v) => sum + v, 0);
      return {
        placement_season: season,
        college_key: Number(collegeKey),
        college_name: college?.["college_name"] ?? "Unknown",
        placements: group.length,
        joined: group.reduce((sum, g) => sum + Number(g["is_joined"]), 0),
        avg_ctc: round(total / Math.max(1, ctcs.length)),
        median_ctc: ctcs[Math.floor(ctcs.length / 2)] ?? 0,
        max_ctc: ctcs[ctcs.length - 1] ?? 0,
      };
    })
    .sort(
      (a, b) => a.placement_season.localeCompare(b.placement_season) || b.placements - a.placements,
    );

  // --- Company hiring performance ----------------------------------------
  const applicationsByCompany = groupBy(tables.fact_application, (r) => String(r["company_key"]));
  const placementsByCompany = groupBy(tables.fact_placement, (r) => String(r["company_key"]));
  const postingsByCompany = groupBy(tables.fact_job_posting, (r) => String(r["company_key"]));

  const mart_company_hiring = [...companyByKey.values()]
    .map((company) => {
      const key = String(company.surrogate_key);
      const applications = applicationsByCompany.get(key) ?? [];
      const placements = placementsByCompany.get(key) ?? [];
      const postings = postingsByCompany.get(key) ?? [];
      return {
        company_key: company.surrogate_key,
        company_id: company["company_id"],
        company_name: company["company_name"],
        industry: company["industry"],
        jobs_posted: postings.length,
        openings: postings.reduce((sum, p) => sum + Number(p["openings"]), 0),
        applications: applications.length,
        offers: placements.length,
        offer_rate: round(placements.length / Math.max(1, applications.length), 4),
        avg_ctc: round(
          placements.reduce((sum, p) => sum + Number(p["ctc_annual"]), 0) /
            Math.max(1, placements.length),
        ),
      };
    })
    .sort((a, b) => b.offers - a.offers || b.applications - a.applications);

  // --- Monthly skill/category demand -------------------------------------
  const mart_skill_demand_monthly = [
    ...groupBy(tables.fact_hiring, (row) => {
      const month = dateByKey.get(Number(row["date_key"]))?.date.slice(0, 7) ?? "unknown";
      return `${month}|${row["category_code"]}`;
    }),
  ]
    .map(([key, group]) => {
      const [month = "unknown", category = "unknown"] = key.split("|");
      const jobs = group.reduce((sum, g) => sum + Number(g["jobs_posted"]), 0);
      const applications = group.reduce((sum, g) => sum + Number(g["applications_received"]), 0);
      const offers = group.reduce((sum, g) => sum + Number(g["offers_made"]), 0);
      return {
        month,
        category_code: category,
        jobs_posted: jobs,
        applications_received: applications,
        offers_made: offers,
        applications_per_job: round(applications / Math.max(1, jobs)),
        conversion_rate: round(offers / Math.max(1, applications), 4),
        avg_demand_index: round(
          group.reduce((sum, g) => sum + Number(g["demand_index"]), 0) / Math.max(1, group.length),
        ),
      };
    })
    .sort(
      (a, b) => a.month.localeCompare(b.month) || a.category_code.localeCompare(b.category_code),
    );

  // --- Student funnel -----------------------------------------------------
  const applicationsByStudent = groupBy(tables.fact_application, (r) => String(r["student_key"]));
  const interviewsByStudent = groupBy(tables.fact_interview, (r) => String(r["student_key"]));
  const placementsByStudent = groupBy(tables.fact_placement, (r) => String(r["student_key"]));

  const mart_student_funnel = [...studentByKey.values()]
    .map((student) => {
      const key = String(student.surrogate_key);
      const applications = applicationsByStudent.get(key) ?? [];
      const interviews = interviewsByStudent.get(key) ?? [];
      const placements = placementsByStudent.get(key) ?? [];
      return {
        student_key: student.surrogate_key,
        student_id: student["student_id"],
        college_id: student["college_id"],
        graduation_year: student["graduation_year"],
        cgpa: student["cgpa"],
        applications: applications.length,
        shortlisted: applications.reduce((sum, a) => sum + Number(a["is_shortlisted"]), 0),
        interviews: interviews.length,
        interviews_passed: interviews.reduce((sum, i) => sum + Number(i["passed"]), 0),
        offers: placements.length,
        best_ctc: placements.reduce((max, p) => Math.max(max, Number(p["ctc_annual"])), 0),
      };
    })
    .filter((row) => row.applications > 0)
    .sort((a, b) => b.offers - a.offers || b.applications - a.applications);

  // --- Salary benchmark ---------------------------------------------------
  const jobByKey = new Map(tables.dim_job.map((j) => [j.surrogate_key, j]));
  const mart_salary_benchmark = [
    ...groupBy(tables.fact_job_posting, (row) => {
      const job = jobByKey.get(Number(row["job_key"]));
      return `${String(job?.["category_code"] ?? "unknown")}|${String(job?.["experience_code"] ?? "unknown")}`;
    }),
  ]
    .map(([key, group]) => {
      const [category = "unknown", experience = "unknown"] = key.split("|");
      const midpoints = group.map((g) => Number(g["salary_midpoint"])).sort((a, b) => a - b);
      const at = (q: number) =>
        midpoints[Math.min(midpoints.length - 1, Math.floor(midpoints.length * q))] ?? 0;
      return {
        category_code: category,
        experience_code: experience,
        postings: group.length,
        p25_salary: at(0.25),
        median_salary: at(0.5),
        p75_salary: at(0.75),
        avg_openings: round(
          group.reduce((sum, g) => sum + Number(g["openings"]), 0) / Math.max(1, group.length),
        ),
      };
    })
    .sort((a, b) => a.category_code.localeCompare(b.category_code));

  return {
    mart_placement_summary,
    mart_company_hiring,
    mart_skill_demand_monthly,
    mart_student_funnel,
    mart_salary_benchmark,
  };
}
