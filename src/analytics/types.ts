/**
 * Business Intelligence layer — shared types.
 *
 * Architecture (strictly one direction):
 *   Warehouse (star schema) -> Analytics Mart -> Semantic Metrics
 *     -> Analytics Query Layer -> Dashboard / Export
 *
 * Dashboards never compute KPIs. They render a `DashboardResponse` that the
 * query layer produced from governed metric definitions.
 */

export type AnalyticsDomain =
  "executive" | "placement" | "recruiter" | "skills" | "salary" | "jobs" | "students" | "learning";

export const ANALYTICS_DOMAINS: readonly AnalyticsDomain[] = [
  "executive",
  "placement",
  "recruiter",
  "skills",
  "salary",
  "jobs",
  "students",
  "learning",
];

/** Conformed dimensions every mart row carries, so filters compose globally. */
export interface ConformedDims {
  date: string;
  month: string;
  quarter: string;
  year: number;
  location_code: string;
  city: string;
  region: string;
  industry: string;
  company_id: string;
  company_name: string;
  category_code: string;
  role_title: string;
  experience_code: string;
  employment_code: string;
  college_id: string;
  college_name: string;
  department: string;
  batch: number;
  student_id: string;
  recruiter_id: string;
  skill_id: string;
  technology_code: string;
}

export type MartRow = ConformedDims & Record<string, string | number>;

export type ValueFormat = "number" | "currency" | "percent" | "decimal" | "days" | "text";

export type Aggregation = "count" | "sum" | "avg" | "median" | "max" | "min" | "ratio" | "distinct";

export type RefreshFrequency = "batch_daily" | "batch_hourly" | "batch_monthly";

/** Which roles may read a metric. Enforced in the query layer, not the UI. */
export type AuthorizationScope =
  | "platform" // admin only
  | "organization" // admin / executive
  | "college" // placement officer (scoped to their college)
  | "company" // recruiter (scoped to their company)
  | "self"; // student (scoped to their own records)

export type MartSource =
  | "mart_applications"
  | "mart_interviews"
  | "mart_placements"
  | "mart_jobs"
  | "mart_salaries"
  | "mart_learning"
  | "mart_certifications"
  | "mart_hiring"
  | "mart_students"
  | "mart_job_skills"
  | "mart_student_skills"
  | "mart_job_technologies";

export interface MetricDefinition {
  metric_name: string;
  label: string;
  business_definition: string;
  source_mart: MartSource;
  source_measure: string;
  aggregation: Aggregation;
  dimensions: readonly (keyof ConformedDims)[];
  filters: readonly string[];
  refresh_frequency: RefreshFrequency;
  authorization_scope: AuthorizationScope;
  format: ValueFormat;
  /** Higher is better — drives KPI card affordances. */
  direction: "up_is_good" | "down_is_good" | "neutral";
}

export interface Freshness {
  /** When the last pipeline run completed (warehouse load time). */
  last_updated: string;
  /** Latest business date present in the warehouse. */
  data_through: string;
  pipeline_status: "healthy" | "degraded" | "failed";
  run_id: string;
  /** Batch — never advertised as real time. */
  refresh_mode: "batch";
  rows_quarantined: number;
  warehouse_rows: number;
}

export interface KpiCard {
  metric: string;
  label: string;
  value: number;
  format: ValueFormat;
  definition: string;
  source: string;
  direction: MetricDefinition["direction"];
}

export interface ChartSeries {
  key: string;
  label: string;
  format: ValueFormat;
}

export interface ChartSpec {
  id: string;
  title: string;
  description: string;
  type: "line" | "bar" | "area" | "pie" | "stacked-bar";
  xKey: string;
  xLabel: string;
  series: ChartSeries[];
  data: Record<string, string | number>[];
  metrics: string[];
}

export interface TableColumn {
  key: string;
  label: string;
  format: ValueFormat;
}

export interface TableSpec {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  page: number;
  page_size: number;
  total_rows: number;
  total_pages: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterFieldSpec {
  key: string;
  label: string;
  type: "select" | "date" | "date-range" | "number";
  options?: FilterOption[];
}

export interface DashboardResponse {
  domain: AnalyticsDomain;
  title: string;
  description: string;
  kpis: KpiCard[];
  charts: ChartSpec[];
  tables: TableSpec[];
  filters_applied: Record<string, string | number>;
  filter_fields: FilterFieldSpec[];
  freshness: Freshness;
  /** Row-level restriction the query layer forced for this caller. */
  scope: { level: AuthorizationScope; description: string };
  generated_at: string;
}
