import { describe, expect, it } from "vitest";
import { createConfig } from "../config";
import { runPipeline } from "../etl/pipeline";
import { buildWarehouse, buildDimDate } from "../warehouse/build";
import { applyScd2, type Scd2Row } from "../warehouse/scd";
import { createKeyAllocator, dateKey } from "../warehouse/keys";
import { STAR_SCHEMA } from "../warehouse/schema";
import { buildMarts } from "../marts";
import { buildDataDictionary } from "../dictionary";
import type { Row } from "../etl/transform";

const config = createConfig({ scale: 0.01 });
const pipeline = runPipeline({ config });
const { tables } = buildWarehouse({
  curated: pipeline.curated,
  effectiveFrom: pipeline.run.started_at,
});

describe("surrogate keys", () => {
  it("allocates stable dense keys", () => {
    const allocator = createKeyAllocator();
    expect(allocator.keyFor("dim_student", "S1")).toBe(1);
    expect(allocator.keyFor("dim_student", "S2")).toBe(2);
    expect(allocator.keyFor("dim_student", "S1")).toBe(1);
    expect(allocator.keyFor("dim_company", "C1")).toBe(1);
  });

  it("derives YYYYMMDD date keys", () => {
    expect(dateKey("2026-03-04T10:00:00.000Z")).toBe(20260304);
    expect(dateKey(null)).toBe(-1);
  });
});

describe("SCD type 2", () => {
  it("versions a tracked attribute change", () => {
    const allocator = createKeyAllocator();
    const first = applyScd2<Row>({
      existing: [],
      incoming: [{ student_id: "S1", cgpa: 7 }],
      businessKey: "student_id",
      trackedAttributes: ["cgpa"],
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      nextKey: () => allocator.next("dim_student"),
    });
    const second = applyScd2<Row>({
      existing: first.rows as Scd2Row<Row>[],
      incoming: [{ student_id: "S1", cgpa: 8 }],
      businessKey: "student_id",
      trackedAttributes: ["cgpa"],
      effectiveFrom: "2026-06-01T00:00:00.000Z",
      nextKey: () => allocator.next("dim_student"),
    });

    expect(second.updated).toBe(1);
    expect(second.rows).toHaveLength(2);
    const closed = second.rows.find((r) => !r.is_current);
    const current = second.rows.find((r) => r.is_current);
    expect(closed?.effective_to).toBe("2026-06-01T00:00:00.000Z");
    expect(current?.version).toBe(2);
    expect(current?.["cgpa"]).toBe(8);
  });

  it("leaves unchanged records alone", () => {
    const allocator = createKeyAllocator();
    const first = applyScd2<Row>({
      existing: [],
      incoming: [{ company_id: "C1", industry: "IT" }],
      businessKey: "company_id",
      trackedAttributes: ["industry"],
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      nextKey: () => allocator.next("dim_company"),
    });
    const second = applyScd2<Row>({
      existing: first.rows as Scd2Row<Row>[],
      incoming: [{ company_id: "C1", industry: "IT" }],
      businessKey: "company_id",
      trackedAttributes: ["industry"],
      effectiveFrom: "2026-06-01T00:00:00.000Z",
      nextKey: () => allocator.next("dim_company"),
    });
    expect(second.unchanged).toBe(1);
    expect(second.rows).toHaveLength(1);
  });
});

describe("warehouse", () => {
  it("builds a complete date dimension", () => {
    const dates = buildDimDate("2026-01-01", "2026-01-31");
    expect(dates).toHaveLength(31);
    expect(dates[0]?.date_key).toBe(20260101);
    expect(dates[0]?.quarter).toBe(1);
  });

  it("populates every dimension and fact", () => {
    for (const [name, rows] of Object.entries(tables)) {
      expect(rows.length, `${name} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("resolves fact foreign keys to real dimension members", () => {
    const studentKeys = new Set(tables.dim_student.map((r) => r.surrogate_key));
    const companyKeys = new Set(tables.dim_company.map((r) => r.surrogate_key));
    const unresolved = tables.fact_application.filter(
      (row) =>
        !studentKeys.has(Number(row["student_key"])) ||
        !companyKeys.has(Number(row["company_key"])),
    );
    expect(unresolved).toHaveLength(0);
  });

  it("builds the completed warehouse: 10 dimensions and 8 facts", () => {
    expect(tables.dim_technology.length).toBeGreaterThan(1);
    expect(tables.dim_recruiter.length).toBeGreaterThan(1);
    expect(tables.fact_salary.length).toBeGreaterThan(0);
    expect(tables.fact_certification.length).toBeGreaterThan(0);
    expect(tables.fact_hiring.length).toBeGreaterThan(0);
  });

  it("keeps one row per declared grain key in every fact", () => {
    for (const spec of STAR_SCHEMA.filter((t) => t.kind === "fact")) {
      const rows = (tables as unknown as Record<string, Row[]>)[spec.name] ?? [];
      const keys = new Set(rows.map((r) => spec.grain_keys.map((k) => String(r[k])).join("|")));
      expect(keys.size, `${spec.name} grain must be unique`).toBe(rows.length);
    }
  });

  it("resolves recruiter, skill and location keys on the new facts", () => {
    const recruiterKeys = new Set(tables.dim_recruiter.map((r) => r.surrogate_key));
    const locationKeys = new Set(tables.dim_location.map((r) => r.surrogate_key));
    const skillKeys = new Set(tables.dim_skill.map((r) => r.surrogate_key));
    expect(
      tables.fact_job_posting.every((r) => recruiterKeys.has(Number(r["recruiter_key"]))),
    ).toBe(true);
    expect(tables.fact_salary.every((r) => locationKeys.has(Number(r["location_key"])))).toBe(true);
    expect(tables.fact_certification.every((r) => skillKeys.has(Number(r["skill_key"])))).toBe(
      true,
    );
  });

  it("documents grain for every star schema table", () => {
    expect(STAR_SCHEMA.every((table) => table.grain.length > 10)).toBe(true);
    expect(STAR_SCHEMA.filter((t) => t.kind === "fact")).toHaveLength(8);
    expect(STAR_SCHEMA.filter((t) => t.kind === "dimension")).toHaveLength(10);
  });
});

describe("marts", () => {
  const marts = buildMarts(tables);

  it("builds all analytics marts", () => {
    expect(marts.mart_company_hiring.length).toBeGreaterThan(0);
    expect(marts.mart_skill_demand_monthly.length).toBeGreaterThan(0);
    expect(marts.mart_salary_benchmark.length).toBeGreaterThan(0);
  });

  it("keeps offer rate within bounds", () => {
    for (const row of marts.mart_company_hiring) {
      expect(Number(row["offer_rate"])).toBeGreaterThanOrEqual(0);
      expect(Number(row["offer_rate"])).toBeLessThanOrEqual(1);
    }
  });
});

describe("data dictionary", () => {
  it("covers layers, datasets, warehouse and marts", () => {
    const dictionary = buildDataDictionary();
    expect(dictionary.layers).toContain("quarantine");
    expect(dictionary.datasets.length).toBeGreaterThanOrEqual(10);
    expect(dictionary.warehouse.length).toBe(STAR_SCHEMA.length);
    expect(dictionary.marts.length).toBe(5);
  });
});
