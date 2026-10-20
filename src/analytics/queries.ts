/**
 * Analytics query layer.
 *
 * Turns (domain, filters, principal) into a fully typed `DashboardResponse`.
 * Dashboards render this payload verbatim — no KPI is ever computed in React.
 */

import { authorize, type AnalyticsPrincipal } from "./authorization";
import {
  avg,
  count,
  groupBy,
  max,
  median,
  monthlySeries,
  paginate,
  percentile,
  ratio,
  round,
  series,
  sum,
} from "./engine";
import {
  applyFilters,
  filterFields,
  resolveFilters,
  type AnalyticsFilters,
  type ResolvedFilters,
} from "./filters";
import type { AnalyticsMart } from "./mart";
import { evaluateMetric, getMetric } from "./metrics";
import type {
  AnalyticsDomain,
  ChartSpec,
  DashboardResponse,
  KpiCard,
  MartRow,
  TableColumn,
  TableSpec,
  ValueFormat,
} from "./types";

export interface QueryOptions {
  page?: number;
  pageSize?: number;
}

type DashboardBody = Omit<
  DashboardResponse,
  "domain" | "freshness" | "scope" | "generated_at" | "filters_applied" | "filter_fields"
>;

interface Ctx {
  mart: AnalyticsMart;
  filters: ResolvedFilters;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// builders
// ---------------------------------------------------------------------------

function kpi(ctx: Ctx, metricName: string, labelOverride?: string): KpiCard {
  const metric = getMetric(metricName);
  return {
    metric: metric.metric_name,
    label: labelOverride ?? metric.label,
    value: evaluateMetric(metricName, ctx.mart, ctx.filters),
    format: metric.format,
    definition: metric.business_definition,
    source: `${metric.source_mart}.${metric.source_measure}`,
    direction: metric.direction,
  };
}

function chart(spec: Omit<ChartSpec, "description"> & { description?: string }): ChartSpec {
  return { description: spec.description ?? "", ...spec } as ChartSpec;
}

function table(
  ctx: Ctx,
  id: string,
  title: string,
  columns: TableColumn[],
  rows: Record<string, string | number>[],
): TableSpec {
  const page = paginate(rows, ctx.page, ctx.pageSize);
  return { id, title, columns, ...page };
}

const col = (key: string, label: string, format: ValueFormat = "text"): TableColumn => ({
  key,
  label,
  format,
});

const rowsOf = (ctx: Ctx, source: readonly MartRow[]) => applyFilters(source, ctx.filters);

const seriesData = (points: { bucket: string }[]): Record<string, string | number>[] =>
  points as unknown as Record<string, string | number>[];

// ---------------------------------------------------------------------------
// executive
// ---------------------------------------------------------------------------

function executiveDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const students = rowsOf(ctx, mart.students);
  const jobs = rowsOf(ctx, mart.jobs);
  const applications = rowsOf(ctx, mart.applications);
  const placements = rowsOf(ctx, mart.placements);
  const hiring = rowsOf(ctx, mart.hiring);

  return {
    title: "Executive analytics",
    description:
      "Organization-wide performance across students, demand, hiring funnel and compensation, sourced from the warehouse marts.",
    kpis: [
      kpi(ctx, "total_students"),
      kpi(ctx, "total_companies"),
      kpi(ctx, "active_job_count"),
      kpi(ctx, "application_count"),
      kpi(ctx, "interview_count"),
      kpi(ctx, "offer_count"),
      kpi(ctx, "placed_students", "Placements"),
      kpi(ctx, "average_salary"),
      kpi(ctx, "placement_rate"),
    ],
    charts: [
      chart({
        id: "user_growth",
        title: "Student growth",
        description: "New student records registered per month.",
        type: "area",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "students", label: "New students", format: "number" }],
        data: seriesData(monthlySeries(students, ctx.filters, { students: (g) => count(g) })),
        metrics: ["total_students"],
      }),
      chart({
        id: "job_growth",
        title: "Job growth",
        description: "Job postings published per month.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "jobs", label: "Jobs posted", format: "number" }],
        data: seriesData(monthlySeries(jobs, ctx.filters, { jobs: (g) => count(g) })),
        metrics: ["job_count"],
      }),
      chart({
        id: "application_trend",
        title: "Application trend",
        description: "Applications received per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "applications", label: "Applications", format: "number" }],
        data: seriesData(
          monthlySeries(applications, ctx.filters, { applications: (g) => count(g) }),
        ),
        metrics: ["application_count"],
      }),
      chart({
        id: "placement_trend",
        title: "Placement trend",
        description: "Offers extended and hires joined per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "offers", label: "Offers", format: "number" },
          { key: "hires", label: "Hires", format: "number" },
        ],
        data: seriesData(
          monthlySeries(placements, ctx.filters, {
            offers: (g) => count(g),
            hires: (g) => sum(g, "joined"),
          }),
        ),
        metrics: ["offer_count", "hire_count"],
      }),
      chart({
        id: "hiring_trend",
        title: "Hiring trend",
        description: "Market hiring activity from the hiring snapshot fact.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "jobs_posted", label: "Jobs posted", format: "number" },
          { key: "applications_received", label: "Applications", format: "number" },
          { key: "offers_made", label: "Offers", format: "number" },
        ],
        data: seriesData(
          monthlySeries(hiring, ctx.filters, {
            jobs_posted: (g) => sum(g, "jobs_posted"),
            applications_received: (g) => sum(g, "applications_received"),
            offers_made: (g) => sum(g, "offers_made"),
          }),
        ),
        metrics: ["job_count", "application_count", "offer_count"],
      }),
      chart({
        id: "salary_trend",
        title: "Salary trend",
        description: "Average and median annual CTC of offers per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "average_salary", label: "Average CTC", format: "currency" },
          { key: "median_salary", label: "Median CTC", format: "currency" },
        ],
        data: seriesData(
          monthlySeries(placements, ctx.filters, {
            average_salary: (g) => avg(g, "ctc_annual"),
            median_salary: (g) => median(g, "ctc_annual"),
          }),
        ),
        metrics: ["average_salary", "median_salary"],
      }),
    ],
    tables: [
      table(
        ctx,
        "company_hiring",
        "Company hiring leaderboard",
        [
          col("label", "Company"),
          col("jobs", "Jobs", "number"),
          col("applications", "Applications", "number"),
          col("offers", "Offers", "number"),
          col("avg_ctc", "Average CTC", "currency"),
        ],
        seriesData(
          series(
            jobs,
            "company_id",
            {
              jobs: (g) => count(g),
              applications: (g) =>
                applications.filter((a) => a["company_id"] === g[0]?.["company_id"]).length,
              offers: (g) =>
                placements.filter((p) => p["company_id"] === g[0]?.["company_id"]).length,
              avg_ctc: (g) =>
                avg(
                  placements.filter((p) => p["company_id"] === g[0]?.["company_id"]),
                  "ctc_annual",
                ),
            },
            { sort: "value", valueKey: "offers", labelKey: "company_name" },
          ),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// placement
// ---------------------------------------------------------------------------

const CTC_BANDS: { label: string; min: number; max: number }[] = [
  { label: "< 8L", min: 0, max: 800_000 },
  { label: "8–15L", min: 800_000, max: 1_500_000 },
  { label: "15–25L", min: 1_500_000, max: 2_500_000 },
  { label: "25L+", min: 2_500_000, max: Number.MAX_SAFE_INTEGER },
];

function placementDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const students = rowsOf(ctx, mart.students);
  const placements = rowsOf(ctx, mart.placements);

  const byDepartment = series(
    students,
    "department",
    { eligible: (g) => sum(g, "eligible"), placed: (g) => sum(g, "placed") },
    { sort: "value", valueKey: "placed", limit: 12 },
  );

  const byCollege = series(
    students,
    "college_id",
    {
      eligible: (g) => sum(g, "eligible"),
      placed: (g) => sum(g, "placed"),
      placement_rate: (g) => ratio(sum(g, "placed"), sum(g, "eligible")),
    },
    { sort: "value", valueKey: "placed", labelKey: "college_name", limit: 15 },
  );

  const salaryDistribution = CTC_BANDS.map((band) => ({
    bucket: band.label,
    offers: placements.filter(
      (p) => Number(p["ctc_annual"]) >= band.min && Number(p["ctc_annual"]) < band.max,
    ).length,
  }));

  const acceptedOffers = sum(placements, "accepted");
  const offerOutcome = [
    { bucket: "Accepted", offers: acceptedOffers },
    { bucket: "Declined / withdrawn", offers: count(placements) - acceptedOffers },
  ];

  return {
    title: "Placement analytics",
    description:
      "College and department placement performance, package benchmarks and offer conversion from the placement mart.",
    kpis: [
      kpi(ctx, "placement_rate"),
      kpi(ctx, "eligible_students"),
      kpi(ctx, "placed_students"),
      kpi(ctx, "average_salary", "Average package"),
      kpi(ctx, "highest_salary", "Highest package"),
      kpi(ctx, "offer_acceptance_rate"),
    ],
    charts: [
      chart({
        id: "department_placement",
        title: "Department-wise placement",
        description: "Eligible versus placed students by department.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Department",
        series: [
          { key: "eligible", label: "Eligible", format: "number" },
          { key: "placed", label: "Placed", format: "number" },
        ],
        data: seriesData(byDepartment),
        metrics: ["eligible_students", "placed_students"],
      }),
      chart({
        id: "college_comparison",
        title: "College comparison",
        description: "Placement rate by college.",
        type: "bar",
        xKey: "label",
        xLabel: "College",
        series: [{ key: "placement_rate", label: "Placement rate", format: "percent" }],
        data: seriesData(byCollege),
        metrics: ["placement_rate"],
      }),
      chart({
        id: "placement_trend",
        title: "Placement trend",
        description: "Offers and joins per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "offers", label: "Offers", format: "number" },
          { key: "hires", label: "Joined", format: "number" },
        ],
        data: seriesData(
          monthlySeries(placements, ctx.filters, {
            offers: (g) => count(g),
            hires: (g) => sum(g, "joined"),
          }),
        ),
        metrics: ["offer_count", "hire_count"],
      }),
      chart({
        id: "salary_distribution",
        title: "Salary distribution",
        description: "Offers by annual CTC band.",
        type: "bar",
        xKey: "bucket",
        xLabel: "CTC band",
        series: [{ key: "offers", label: "Offers", format: "number" }],
        data: salaryDistribution,
        metrics: ["offer_count"],
      }),
      chart({
        id: "company_hiring",
        title: "Company-wise hiring",
        description: "Top companies by offers extended.",
        type: "bar",
        xKey: "label",
        xLabel: "Company",
        series: [{ key: "offers", label: "Offers", format: "number" }],
        data: seriesData(
          series(
            placements,
            "company_id",
            { offers: (g) => count(g), avg_ctc: (g) => avg(g, "ctc_annual") },
            { sort: "value", valueKey: "offers", labelKey: "company_name", limit: 12 },
          ),
        ),
        metrics: ["offer_count"],
      }),
      chart({
        id: "offer_acceptance",
        title: "Offer acceptance",
        description: "Accepted versus declined offers.",
        type: "pie",
        xKey: "bucket",
        xLabel: "Outcome",
        series: [{ key: "offers", label: "Offers", format: "number" }],
        data: offerOutcome,
        metrics: ["offer_acceptance_rate"],
      }),
    ],
    tables: [
      table(
        ctx,
        "college_leaderboard",
        "College placement leaderboard",
        [
          col("label", "College"),
          col("eligible", "Eligible", "number"),
          col("placed", "Placed", "number"),
          col("placement_rate", "Placement rate", "percent"),
        ],
        seriesData(
          series(
            students,
            "college_id",
            {
              eligible: (g) => sum(g, "eligible"),
              placed: (g) => sum(g, "placed"),
              placement_rate: (g) => ratio(sum(g, "placed"), sum(g, "eligible")),
            },
            { sort: "value", valueKey: "placed", labelKey: "college_name" },
          ),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// recruiter
// ---------------------------------------------------------------------------

function recruiterDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const jobs = rowsOf(ctx, mart.jobs);
  const applications = rowsOf(ctx, mart.applications);
  const interviews = rowsOf(ctx, mart.interviews);
  const placements = rowsOf(ctx, mart.placements);

  const funnel = [
    { bucket: "Applications", value: count(applications) },
    { bucket: "Shortlisted", value: sum(applications, "shortlisted") },
    { bucket: "Interviews", value: count(interviews) },
    { bucket: "Offers", value: count(placements) },
    { bucket: "Hires", value: sum(placements, "joined") },
  ];

  return {
    title: "Recruiter analytics",
    description:
      "Requisition health, funnel conversion and hiring velocity for authorized companies.",
    kpis: [
      kpi(ctx, "active_job_count", "Open jobs"),
      kpi(ctx, "application_count"),
      kpi(ctx, "interview_count"),
      kpi(ctx, "offer_count"),
      kpi(ctx, "hire_count"),
      kpi(ctx, "average_time_to_hire"),
    ],
    charts: [
      chart({
        id: "recruitment_funnel",
        title: "Recruitment funnel",
        description: "Volume at each stage of the hiring process.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Stage",
        series: [{ key: "value", label: "Candidates", format: "number" }],
        data: funnel,
        metrics: ["application_count", "interview_count", "offer_count", "hire_count"],
      }),
      chart({
        id: "applications_by_job",
        title: "Applications by job",
        description: "Top job titles by application volume.",
        type: "bar",
        xKey: "label",
        xLabel: "Job",
        series: [{ key: "applications", label: "Applications", format: "number" }],
        data: seriesData(
          series(
            applications,
            "role_title",
            { applications: (g) => count(g) },
            { sort: "value", valueKey: "applications", labelKey: "role_title", limit: 12 },
          ),
        ),
        metrics: ["application_count"],
      }),
      chart({
        id: "interview_conversion",
        title: "Interview conversion",
        description: "Interviews per application, by month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "conversion", label: "Interview conversion", format: "percent" }],
        data: seriesData(
          monthlySeries(applications, ctx.filters, {
            conversion: (g) =>
              ratio(
                interviews.filter((i) => i["month"] === (g[0]?.["month"] ?? "")).length,
                count(g),
              ),
          }),
        ),
        metrics: ["interview_conversion_rate"],
      }),
      chart({
        id: "offer_conversion",
        title: "Offer conversion",
        description: "Offers per application, by month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "conversion", label: "Offer conversion", format: "percent" }],
        data: seriesData(
          monthlySeries(applications, ctx.filters, {
            conversion: (g) =>
              ratio(
                placements.filter((p) => p["month"] === (g[0]?.["month"] ?? "")).length,
                count(g),
              ),
          }),
        ),
        metrics: ["hiring_conversion_rate"],
      }),
      chart({
        id: "time_to_hire",
        title: "Time to hire",
        description: "Average days from application to offer, by month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "days", label: "Days", format: "days" }],
        data: seriesData(
          monthlySeries(placements, ctx.filters, { days: (g) => avg(g, "time_to_hire_days") }),
        ),
        metrics: ["average_time_to_hire"],
      }),
      chart({
        id: "recruiter_performance",
        title: "Recruiter performance",
        description: "Postings and openings owned per recruiter.",
        type: "bar",
        xKey: "label",
        xLabel: "Recruiter",
        series: [
          { key: "jobs", label: "Jobs posted", format: "number" },
          { key: "openings", label: "Openings", format: "number" },
        ],
        data: seriesData(
          series(
            jobs,
            "recruiter_id",
            { jobs: (g) => count(g), openings: (g) => sum(g, "openings") },
            { sort: "value", valueKey: "jobs", labelKey: "recruiter_name", limit: 12 },
          ),
        ),
        metrics: ["job_count"],
      }),
    ],
    tables: [
      table(
        ctx,
        "job_performance",
        "Job performance",
        [
          col("label", "Job"),
          col("jobs", "Postings", "number"),
          col("openings", "Openings", "number"),
          col("applications", "Applications", "number"),
        ],
        seriesData(
          series(
            jobs,
            "job_id",
            {
              jobs: (g) => count(g),
              openings: (g) => sum(g, "openings"),
              applications: (g) =>
                applications.filter((a) => a["role_title"] === g[0]?.["role_title"]).length,
            },
            { sort: "value", valueKey: "applications", labelKey: "role_title" },
          ),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// skills
// ---------------------------------------------------------------------------

function skillsDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const jobSkills = rowsOf(ctx, mart.job_skills);
  const studentSkills = rowsOf(ctx, mart.student_skills);
  const jobTech = rowsOf(ctx, mart.job_technologies);

  const supplyBySkill = new Map<string, number>();
  for (const row of studentSkills) {
    const key = String(row["skill_id"]);
    supplyBySkill.set(key, (supplyBySkill.get(key) ?? 0) + 1);
  }

  const half = ctx.filters.dateFrom
    ? new Date(
        (Date.parse(`${ctx.filters.dateFrom}T00:00:00Z`) +
          Date.parse(`${ctx.filters.dateTo}T00:00:00Z`)) /
          2,
      )
        .toISOString()
        .slice(0, 10)
    : ctx.filters.dateTo;

  const topSkills = series(
    jobSkills,
    "skill_id",
    {
      demand: (g) => sum(g, "skill_postings"),
      openings: (g) => sum(g, "skill_openings"),
      supply: (g) => supplyBySkill.get(String(g[0]?.["skill_id"] ?? "")) ?? 0,
      gap: (g) =>
        sum(g, "skill_postings") - (supplyBySkill.get(String(g[0]?.["skill_id"] ?? "")) ?? 0),
      growth: (g) => {
        const recent = g.filter((r) => String(r["date"]) >= half).length;
        const earlier = g.filter((r) => String(r["date"]) < half).length;
        return ratio(recent - earlier, Math.max(1, earlier));
      },
      emerging: (g) => Number(g[0]?.["is_emerging"] ?? 0),
    },
    { sort: "value", valueKey: "demand", labelKey: "skill_name" },
  );

  const trending = [...topSkills]
    .sort((a, b) => Number(b["growth"]) - Number(a["growth"]))
    .slice(0, 12);

  return {
    title: "Skill intelligence",
    description:
      "Demand, supply and gap analysis across skills and technologies, from the job-skill bridge.",
    kpis: [
      kpi(ctx, "skill_demand", "Skill demand (postings)"),
      kpi(ctx, "skill_supply"),
      kpi(ctx, "technology_demand"),
      {
        metric: "skill_gap",
        label: "Skill gap",
        value:
          evaluateMetric("skill_demand", ctx.mart, ctx.filters) -
          evaluateMetric("skill_supply", ctx.mart, ctx.filters),
        format: "number",
        definition:
          "Skill demand minus skill supply: unmet requirement volume across the filtered scope. Composed from two governed metrics.",
        source: "mart_job_skills.skill_postings - mart_student_skills.skill_holders",
        direction: "down_is_good",
      },
      {
        metric: "trending_skills",
        label: "Trending skills",
        value: trending.filter((t) => Number(t["growth"]) > 0).length,
        format: "number",
        definition:
          "Skills whose posting volume in the second half of the selected window exceeds the first half.",
        source: "mart_job_skills.skill_postings",
        direction: "up_is_good",
      },
    ],
    charts: [
      chart({
        id: "top_skills",
        title: "Top skills",
        description: "Most demanded skills by job postings.",
        type: "bar",
        xKey: "label",
        xLabel: "Skill",
        series: [{ key: "demand", label: "Postings", format: "number" }],
        data: seriesData(topSkills.slice(0, 15)),
        metrics: ["skill_demand"],
      }),
      chart({
        id: "skill_demand_trend",
        title: "Skill demand trend",
        description: "Skill requirements on postings per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "demand", label: "Skill requirements", format: "number" }],
        data: seriesData(
          monthlySeries(jobSkills, ctx.filters, { demand: (g) => sum(g, "skill_postings") }),
        ),
        metrics: ["skill_demand"],
      }),
      chart({
        id: "technology_trend",
        title: "Technology trend",
        description: "Technology requirements on postings per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "demand", label: "Technology requirements", format: "number" }],
        data: seriesData(
          monthlySeries(jobTech, ctx.filters, { demand: (g) => sum(g, "technology_postings") }),
        ),
        metrics: ["technology_demand"],
      }),
      chart({
        id: "supply_vs_demand",
        title: "Skill supply vs demand",
        description: "Student supply against posting demand for the top skills.",
        type: "bar",
        xKey: "label",
        xLabel: "Skill",
        series: [
          { key: "demand", label: "Demand", format: "number" },
          { key: "supply", label: "Supply", format: "number" },
        ],
        data: seriesData(topSkills.slice(0, 12)),
        metrics: ["skill_demand", "skill_supply"],
      }),
      chart({
        id: "fastest_growing",
        title: "Fastest growing skills",
        description: "Growth of posting volume in the second half of the window versus the first.",
        type: "bar",
        xKey: "label",
        xLabel: "Skill",
        series: [{ key: "growth", label: "Growth", format: "percent" }],
        data: seriesData(trending),
        metrics: ["skill_demand"],
      }),
      chart({
        id: "top_technologies",
        title: "Most demanded technologies",
        description: "Technologies by posting volume.",
        type: "bar",
        xKey: "label",
        xLabel: "Technology",
        series: [{ key: "demand", label: "Postings", format: "number" }],
        data: seriesData(
          series(
            jobTech,
            "technology_code",
            { demand: (g) => sum(g, "technology_postings") },
            { sort: "value", valueKey: "demand", labelKey: "technology_name", limit: 15 },
          ),
        ),
        metrics: ["technology_demand"],
      }),
    ],
    tables: [
      table(
        ctx,
        "skill_gap",
        "Skill gap analysis",
        [
          col("label", "Skill"),
          col("demand", "Demand", "number"),
          col("supply", "Supply", "number"),
          col("gap", "Gap", "number"),
          col("growth", "Growth", "percent"),
        ],
        seriesData(topSkills),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// salary
// ---------------------------------------------------------------------------

function salaryDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const placements = rowsOf(ctx, mart.placements);
  const salaries = rowsOf(ctx, mart.salaries);
  const jobTech = rowsOf(ctx, mart.job_technologies);

  const distribution = CTC_BANDS.map((band) => ({
    bucket: band.label,
    offers: placements.filter(
      (p) => Number(p["ctc_annual"]) >= band.min && Number(p["ctc_annual"]) < band.max,
    ).length,
  }));

  const breakdown = (dimension: string, labelKey?: string, limit = 12) =>
    seriesData(
      series(
        placements,
        dimension,
        {
          offers: (g) => count(g),
          average: (g) => avg(g, "ctc_annual"),
          median: (g) => median(g, "ctc_annual"),
          highest: (g) => max(g, "ctc_annual"),
        },
        { sort: "value", valueKey: "median", limit, ...(labelKey ? { labelKey } : {}) },
      ),
    );

  return {
    title: "Salary intelligence",
    description: "Compensation benchmarks from placement offers and observed market salary facts.",
    kpis: [
      kpi(ctx, "average_salary"),
      kpi(ctx, "median_salary"),
      kpi(ctx, "highest_salary"),
      kpi(ctx, "market_median_salary"),
      {
        metric: "p25_salary",
        label: "25th percentile",
        value: percentile(placements, "ctc_annual", 0.25),
        format: "currency",
        definition: "25th percentile annual CTC across offers in scope.",
        source: "mart_placements.ctc_annual",
        direction: "neutral",
      },
      {
        metric: "p75_salary",
        label: "75th percentile",
        value: percentile(placements, "ctc_annual", 0.75),
        format: "currency",
        definition: "75th percentile annual CTC across offers in scope.",
        source: "mart_placements.ctc_annual",
        direction: "neutral",
      },
    ],
    charts: [
      chart({
        id: "salary_trend",
        title: "Salary trend",
        description: "Average and median offer CTC per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "average", label: "Average", format: "currency" },
          { key: "median", label: "Median", format: "currency" },
        ],
        data: seriesData(
          monthlySeries(placements, ctx.filters, {
            average: (g) => avg(g, "ctc_annual"),
            median: (g) => median(g, "ctc_annual"),
          }),
        ),
        metrics: ["average_salary", "median_salary"],
      }),
      chart({
        id: "salary_by_role",
        title: "Salary by role",
        description: "Median offer CTC by job category.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Role",
        series: [{ key: "median", label: "Median CTC", format: "currency" }],
        data: breakdown("category_code"),
        metrics: ["median_salary"],
      }),
      chart({
        id: "salary_by_location",
        title: "Salary by location",
        description: "Median offer CTC by location.",
        type: "bar",
        xKey: "label",
        xLabel: "Location",
        series: [{ key: "median", label: "Median CTC", format: "currency" }],
        data: breakdown("location_code", "city"),
        metrics: ["median_salary"],
      }),
      chart({
        id: "salary_by_experience",
        title: "Salary by experience",
        description: "Median observed market salary by experience band.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Experience",
        series: [{ key: "median", label: "Median base", format: "currency" }],
        data: seriesData(
          series(
            salaries,
            "experience_code",
            { median: (g) => median(g, "base_median"), observations: (g) => count(g) },
            { sort: "asc" },
          ),
        ),
        metrics: ["market_median_salary"],
      }),
      chart({
        id: "salary_by_industry",
        title: "Salary by industry",
        description: "Median offer CTC by industry.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Industry",
        series: [{ key: "median", label: "Median CTC", format: "currency" }],
        data: breakdown("industry"),
        metrics: ["median_salary"],
      }),
      chart({
        id: "salary_by_technology",
        title: "Salary by technology",
        description: "Median posted salary midpoint by required technology.",
        type: "bar",
        xKey: "label",
        xLabel: "Technology",
        series: [{ key: "median", label: "Median posted salary", format: "currency" }],
        data: seriesData(
          series(
            jobTech,
            "technology_code",
            { median: (g) => median(g, "salary_midpoint"), postings: (g) => count(g) },
            { sort: "value", valueKey: "median", labelKey: "technology_name", limit: 12 },
          ),
        ),
        metrics: ["technology_demand"],
      }),
      chart({
        id: "salary_distribution",
        title: "Salary distribution",
        description: "Offers by CTC band.",
        type: "bar",
        xKey: "bucket",
        xLabel: "CTC band",
        series: [{ key: "offers", label: "Offers", format: "number" }],
        data: distribution,
        metrics: ["offer_count"],
      }),
    ],
    tables: [
      table(
        ctx,
        "salary_by_company",
        "Salary by company",
        [
          col("label", "Company"),
          col("offers", "Offers", "number"),
          col("average", "Average", "currency"),
          col("median", "Median", "currency"),
          col("highest", "Highest", "currency"),
        ],
        breakdown("company_id", "company_name", 500),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// jobs
// ---------------------------------------------------------------------------

function jobsDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const jobs = rowsOf(ctx, mart.jobs);

  const newWindowStart = (() => {
    const d = new Date(`${ctx.filters.dateTo}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 29);
    return d.toISOString().slice(0, 10);
  })();
  const newJobsFilters: ResolvedFilters = {
    ...ctx.filters,
    preset: "custom",
    dateFrom: newWindowStart,
  };

  return {
    title: "Job market analytics",
    description: "Demand composition across roles, locations, industries and employment types.",
    kpis: [
      kpi(ctx, "job_count", "Total jobs"),
      kpi(ctx, "active_job_count"),
      {
        metric: "job_count",
        label: "New jobs (30d)",
        value: evaluateMetric("job_count", ctx.mart, newJobsFilters),
        format: "number",
        definition:
          "Governed job_count metric evaluated over the last 30 days of the selected window (warehouse batch window).",
        source: "mart_jobs.jobs",
        direction: "up_is_good",
      },
      kpi(ctx, "application_count"),
      kpi(ctx, "hiring_conversion_rate"),
      kpi(ctx, "total_companies", "Hiring companies"),
    ],
    charts: [
      chart({
        id: "job_trend",
        title: "Job trend",
        description: "Postings and openings per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "jobs", label: "Postings", format: "number" },
          { key: "openings", label: "Openings", format: "number" },
        ],
        data: seriesData(
          monthlySeries(jobs, ctx.filters, {
            jobs: (g) => count(g),
            openings: (g) => sum(g, "openings"),
          }),
        ),
        metrics: ["job_count"],
      }),
      chart({
        id: "role_demand",
        title: "Role demand",
        description: "Postings by job category.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Role",
        series: [{ key: "jobs", label: "Postings", format: "number" }],
        data: seriesData(
          series(
            jobs,
            "category_code",
            { jobs: (g) => count(g), openings: (g) => sum(g, "openings") },
            {
              sort: "value",
              valueKey: "jobs",
              limit: 15,
            },
          ),
        ),
        metrics: ["job_count"],
      }),
      chart({
        id: "location_demand",
        title: "Location demand",
        description: "Postings by location.",
        type: "bar",
        xKey: "label",
        xLabel: "Location",
        series: [{ key: "jobs", label: "Postings", format: "number" }],
        data: seriesData(
          series(
            jobs,
            "location_code",
            { jobs: (g) => count(g) },
            {
              sort: "value",
              valueKey: "jobs",
              labelKey: "city",
              limit: 15,
            },
          ),
        ),
        metrics: ["job_count"],
      }),
      chart({
        id: "industry_demand",
        title: "Industry demand",
        description: "Postings by industry.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Industry",
        series: [{ key: "jobs", label: "Postings", format: "number" }],
        data: seriesData(
          series(
            jobs,
            "industry",
            { jobs: (g) => count(g) },
            { sort: "value", valueKey: "jobs", limit: 12 },
          ),
        ),
        metrics: ["job_count"],
      }),
      chart({
        id: "employment_type",
        title: "Employment type",
        description: "Postings by employment type.",
        type: "pie",
        xKey: "bucket",
        xLabel: "Employment type",
        series: [{ key: "jobs", label: "Postings", format: "number" }],
        data: seriesData(
          series(jobs, "employment_code", { jobs: (g) => count(g) }, { sort: "value" }),
        ),
        metrics: ["job_count"],
      }),
      chart({
        id: "experience_level",
        title: "Experience level",
        description: "Postings by required experience band.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Experience",
        series: [{ key: "jobs", label: "Postings", format: "number" }],
        data: seriesData(
          series(jobs, "experience_code", { jobs: (g) => count(g) }, { sort: "asc" }),
        ),
        metrics: ["job_count"],
      }),
    ],
    tables: [
      table(
        ctx,
        "role_demand_table",
        "Demand by role",
        [
          col("bucket", "Role"),
          col("jobs", "Postings", "number"),
          col("openings", "Openings", "number"),
          col("active", "Active", "number"),
          col("median_salary", "Median posted salary", "currency"),
        ],
        seriesData(
          series(
            jobs,
            "category_code",
            {
              jobs: (g) => count(g),
              openings: (g) => sum(g, "openings"),
              active: (g) => sum(g, "active_jobs"),
              median_salary: (g) => median(g, "salary_midpoint"),
            },
            { sort: "value", valueKey: "jobs" },
          ),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// students
// ---------------------------------------------------------------------------

function studentsDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const students = rowsOf(ctx, mart.students);
  const applications = rowsOf(ctx, mart.applications);
  const interviews = rowsOf(ctx, mart.interviews);
  const placements = rowsOf(ctx, mart.placements);
  const learning = rowsOf(ctx, mart.learning);
  const studentSkills = rowsOf(ctx, mart.student_skills);

  const funnel = [
    { bucket: "Applications", value: count(applications) },
    { bucket: "Shortlisted", value: sum(applications, "shortlisted") },
    { bucket: "Interviews", value: count(interviews) },
    { bucket: "Interviews passed", value: sum(interviews, "passed") },
    { bucket: "Offers", value: count(placements) },
  ];

  return {
    title: "Student analytics",
    description: "Student population, skills, activity and placement readiness.",
    kpis: [
      kpi(ctx, "total_students"),
      kpi(ctx, "eligible_students"),
      kpi(ctx, "placed_students"),
      kpi(ctx, "application_count"),
      kpi(ctx, "interview_count"),
      kpi(ctx, "learning_completion_rate"),
      kpi(ctx, "certification_count"),
    ],
    charts: [
      chart({
        id: "students_by_department",
        title: "Students by department",
        description: "Population and placement status by department.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Department",
        series: [
          { key: "students", label: "Students", format: "number" },
          { key: "placed", label: "Placed", format: "number" },
        ],
        data: seriesData(
          series(
            students,
            "department",
            { students: (g) => count(g), placed: (g) => sum(g, "placed") },
            { sort: "value", valueKey: "students", limit: 15 },
          ),
        ),
        metrics: ["total_students", "placed_students"],
      }),
      chart({
        id: "skills_distribution",
        title: "Skills distribution",
        description: "Most common student skills.",
        type: "bar",
        xKey: "label",
        xLabel: "Skill",
        series: [{ key: "students", label: "Students", format: "number" }],
        data: seriesData(
          series(
            studentSkills,
            "skill_id",
            { students: (g) => sum(g, "skill_holders") },
            { sort: "value", valueKey: "students", labelKey: "skill_name", limit: 15 },
          ),
        ),
        metrics: ["skill_supply"],
      }),
      chart({
        id: "career_preferences",
        title: "Career preferences",
        description: "Roles students apply to most.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Role",
        series: [{ key: "applications", label: "Applications", format: "number" }],
        data: seriesData(
          series(
            applications,
            "category_code",
            { applications: (g) => count(g) },
            {
              sort: "value",
              valueKey: "applications",
              limit: 12,
            },
          ),
        ),
        metrics: ["application_count"],
      }),
      chart({
        id: "application_funnel",
        title: "Application funnel",
        description: "Student progression from application to offer.",
        type: "bar",
        xKey: "bucket",
        xLabel: "Stage",
        series: [{ key: "value", label: "Records", format: "number" }],
        data: funnel,
        metrics: ["application_count", "interview_count", "offer_count"],
      }),
      chart({
        id: "learning_progress",
        title: "Learning progress",
        description: "Average course progress and completions per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "progress", label: "Avg progress %", format: "number" },
          { key: "completions", label: "Completions", format: "number" },
        ],
        data: seriesData(
          monthlySeries(learning, ctx.filters, {
            progress: (g) => avg(g, "progress_pct"),
            completions: (g) => sum(g, "completions"),
          }),
        ),
        metrics: ["learning_completion_rate"],
      }),
      chart({
        id: "placement_status",
        title: "Placement status",
        description: "Placed versus unplaced eligible students.",
        type: "pie",
        xKey: "bucket",
        xLabel: "Status",
        series: [{ key: "students", label: "Students", format: "number" }],
        data: [
          { bucket: "Placed", students: sum(students, "placed") },
          {
            bucket: "Eligible, not placed",
            students: Math.max(0, sum(students, "eligible") - sum(students, "placed")),
          },
          {
            bucket: "Not eligible",
            students: Math.max(0, count(students) - sum(students, "eligible")),
          },
        ],
        metrics: ["placement_rate"],
      }),
    ],
    tables: [
      table(
        ctx,
        "student_activity",
        "Student activity",
        [
          col("bucket", "Student"),
          col("department", "Department"),
          col("applications", "Applications", "number"),
          col("interviews", "Interviews", "number"),
          col("offers", "Offers", "number"),
          col("best_ctc", "Best CTC", "currency"),
        ],
        seriesData(
          series(
            students,
            "student_id",
            {
              department: (g) => 0,
              applications: (g) =>
                applications.filter((a) => a["student_id"] === g[0]?.["student_id"]).length,
              interviews: (g) =>
                interviews.filter((i) => i["student_id"] === g[0]?.["student_id"]).length,
              offers: (g) =>
                placements.filter((p) => p["student_id"] === g[0]?.["student_id"]).length,
              best_ctc: (g) =>
                max(
                  placements.filter((p) => p["student_id"] === g[0]?.["student_id"]),
                  "ctc_annual",
                ),
            },
            { sort: "value", valueKey: "offers" },
          ).map((point, index, all) => ({
            ...point,
            department: String(
              students.find((s) => s["student_id"] === point.bucket)?.["department"] ?? "",
            ),
            _index: index,
            _total: all.length,
          })),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// learning
// ---------------------------------------------------------------------------

function learningDashboard(ctx: Ctx): DashboardBody {
  const { mart } = ctx;
  const learning = rowsOf(ctx, mart.learning);
  const certifications = rowsOf(ctx, mart.certifications);

  return {
    title: "Learning analytics",
    description: "Course enrolment, completion and skill acquisition across the student base.",
    kpis: [
      kpi(ctx, "course_enrollment_count"),
      kpi(ctx, "learning_completion_rate"),
      kpi(ctx, "learning_hours"),
      kpi(ctx, "certification_count", "Skill acquisition"),
    ],
    charts: [
      chart({
        id: "enrollment_trend",
        title: "Enrolment trend",
        description: "Course enrolments per month.",
        type: "area",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "enrollments", label: "Enrolments", format: "number" }],
        data: seriesData(monthlySeries(learning, ctx.filters, { enrollments: (g) => count(g) })),
        metrics: ["course_enrollment_count"],
      }),
      chart({
        id: "completion_rate",
        title: "Completion rate",
        description: "Completed enrolments as a share of enrolments, per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [{ key: "completion_rate", label: "Completion rate", format: "percent" }],
        data: seriesData(
          monthlySeries(learning, ctx.filters, {
            completion_rate: (g) => ratio(sum(g, "completions"), count(g)),
          }),
        ),
        metrics: ["learning_completion_rate"],
      }),
      chart({
        id: "course_popularity",
        title: "Course popularity",
        description: "Most enrolled courses.",
        type: "bar",
        xKey: "label",
        xLabel: "Course",
        series: [{ key: "enrollments", label: "Enrolments", format: "number" }],
        data: seriesData(
          series(
            learning,
            "course_id",
            { enrollments: (g) => count(g), completions: (g) => sum(g, "completions") },
            { sort: "value", valueKey: "enrollments", labelKey: "course_name", limit: 15 },
          ),
        ),
        metrics: ["course_enrollment_count"],
      }),
      chart({
        id: "skill_acquisition",
        title: "Skill acquisition",
        description: "Certifications earned by skill.",
        type: "bar",
        xKey: "label",
        xLabel: "Skill",
        series: [{ key: "certifications", label: "Certifications", format: "number" }],
        data: seriesData(
          series(
            certifications,
            "skill_id",
            { certifications: (g) => count(g) },
            { sort: "value", valueKey: "certifications", labelKey: "skill_name", limit: 15 },
          ),
        ),
        metrics: ["certification_count"],
      }),
      chart({
        id: "learning_progress",
        title: "Learning progress",
        description: "Average progress and hours logged per month.",
        type: "line",
        xKey: "bucket",
        xLabel: "Month",
        series: [
          { key: "progress", label: "Avg progress %", format: "number" },
          { key: "hours", label: "Hours", format: "number" },
        ],
        data: seriesData(
          monthlySeries(learning, ctx.filters, {
            progress: (g) => avg(g, "progress_pct"),
            hours: (g) => round(sum(g, "hours_spent")),
          }),
        ),
        metrics: ["learning_hours"],
      }),
    ],
    tables: [
      table(
        ctx,
        "course_performance",
        "Course performance",
        [
          col("label", "Course"),
          col("provider", "Provider"),
          col("enrollments", "Enrolments", "number"),
          col("completions", "Completions", "number"),
          col("completion_rate", "Completion rate", "percent"),
          col("hours", "Hours", "number"),
        ],
        seriesData(
          series(
            learning,
            "course_id",
            {
              enrollments: (g) => count(g),
              completions: (g) => sum(g, "completions"),
              completion_rate: (g) => ratio(sum(g, "completions"), count(g)),
              hours: (g) => round(sum(g, "hours_spent")),
            },
            { sort: "value", valueKey: "enrollments", labelKey: "course_name" },
          ).map((point) => ({
            ...point,
            provider: String(
              learning.find((l) => l["course_id"] === point.bucket)?.["provider"] ?? "",
            ),
          })),
        ),
      ),
    ],
  };
}

// ---------------------------------------------------------------------------
// dispatch
// ---------------------------------------------------------------------------

const FILTER_KEYS: Record<AnalyticsDomain, string[]> = {
  executive: ["preset", "dateFrom", "dateTo", "location", "industry", "role", "experience"],
  placement: [
    "preset",
    "dateFrom",
    "dateTo",
    "college",
    "department",
    "batch",
    "company",
    "location",
  ],
  recruiter: ["preset", "dateFrom", "dateTo", "company", "role", "location", "employmentType"],
  skills: ["preset", "dateFrom", "dateTo", "role", "industry", "location", "experience", "skill"],
  salary: ["preset", "dateFrom", "dateTo", "role", "experience", "location", "industry", "company"],
  jobs: [
    "preset",
    "dateFrom",
    "dateTo",
    "role",
    "location",
    "industry",
    "employmentType",
    "experience",
  ],
  students: ["preset", "dateFrom", "dateTo", "college", "department", "batch", "location"],
  learning: ["preset", "dateFrom", "dateTo", "college", "department", "batch"],
};

const BUILDERS: Record<AnalyticsDomain, (ctx: Ctx) => DashboardBody> = {
  executive: executiveDashboard,
  placement: placementDashboard,
  recruiter: recruiterDashboard,
  skills: skillsDashboard,
  salary: salaryDashboard,
  jobs: jobsDashboard,
  students: studentsDashboard,
  learning: learningDashboard,
};

export function runDashboardQuery(input: {
  domain: AnalyticsDomain;
  mart: AnalyticsMart;
  principal: AnalyticsPrincipal;
  filters?: AnalyticsFilters;
  options?: QueryOptions;
}): DashboardResponse {
  const { domain, mart, principal } = input;
  const auth = authorize(principal, domain);
  const resolved = resolveFilters(
    input.filters ?? {},
    mart.freshness.data_through,
    auth.forcedFilters,
  );

  const ctx: Ctx = {
    mart,
    filters: resolved,
    page: input.options?.page ?? 1,
    pageSize: input.options?.pageSize ?? 25,
  };

  const built = BUILDERS[domain](ctx);
  const ref = mart.reference;

  return {
    domain,
    ...built,
    filters_applied: Object.fromEntries(
      Object.entries(resolved).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ) as Record<string, string | number>,
    filter_fields: filterFields(FILTER_KEYS[domain], {
      college: ref.colleges,
      department: ref.departments,
      batch: ref.batches,
      company: ref.companies,
      industry: ref.industries,
      location: ref.locations,
      role: ref.roles,
      skill: ref.skills,
      technology: ref.technologies,
      experience: ref.experiences,
      employmentType: ref.employmentTypes,
      year: ref.years,
      month: ref.months,
    }),
    freshness: mart.freshness,
    scope: { level: auth.level, description: auth.description },
    generated_at: mart.freshness.last_updated,
  };
}
