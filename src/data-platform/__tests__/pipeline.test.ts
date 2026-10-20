import { describe, expect, it } from "vitest";
import { createConfig } from "../config";
import { runPipeline } from "../etl/pipeline";
import { businessKeyOf, clean, dedupe, normalize } from "../etl/transform";
import { createWatermarkStore } from "../etl/watermarks";
import { makeBatchId, makeObjectPath, parseObjectPath } from "../lake/paths";

const config = createConfig({ scale: 0.01 });

describe("lake paths", () => {
  it("builds and parses deterministic object paths", () => {
    const batchId = makeBatchId("students", "2026-01-01T00:00:00.000Z", 3, "v1");
    expect(batchId).toBe("students_v1_20260101_0003");
    const path = makeObjectPath("raw", "students", batchId);
    expect(parseObjectPath(path)).toEqual({
      layer: "raw",
      domain: "students",
      batchId,
      part: "part-0001",
    });
  });
});

describe("transforms", () => {
  it("cleans blanks and drops empty records", () => {
    const result = clean([{ a: "  x  y " }, { a: "", b: null }]);
    expect(result.records).toEqual([{ a: "x y" }]);
    expect(result.rejected[0]?.reason).toBe("empty_record");
  });

  it("normalizes codes and emails", () => {
    const [row] = normalize([{ location_code: "blr", email: "A@B.COM" }]).records;
    expect(row?.["location_code"]).toBe("BLR");
    expect(row?.["email"]).toBe("a@b.com");
  });

  it("dedupes on business key keeping the newest watermark", () => {
    const result = dedupe(
      [
        { student_id: "S1", last_updated: "2026-01-01", v: 1 },
        { student_id: "S1", last_updated: "2026-02-01", v: 2 },
        { student_id: "S2", last_updated: "2026-01-01", v: 3 },
      ],
      "student_id",
    );
    expect(result.records).toHaveLength(2);
    expect(result.records.find((r) => r["student_id"] === "S1")?.["v"]).toBe(2);
    expect(result.rejected).toHaveLength(1);
  });

  it("derives business keys per dataset", () => {
    expect(businessKeyOf("students")).toBe("student_id");
    expect(businessKeyOf("companies")).toBe("company_id");
    expect(businessKeyOf("locations")).toBe("location_code");
  });
});

describe("pipeline", () => {
  const result = runPipeline({ config });

  it("is deterministic across runs", () => {
    const again = runPipeline({ config });
    expect(Object.keys(again.curated)).toEqual(Object.keys(result.curated));
    expect(JSON.stringify(again.curated["students"])).toBe(
      JSON.stringify(result.curated["students"]),
    );
  });

  it("writes every layer to the lake with ingestion metadata", () => {
    expect(result.store.list("raw").length).toBeGreaterThan(0);
    expect(result.store.list("staging").length).toBeGreaterThan(0);
    expect(result.store.list("curated").length).toBeGreaterThan(0);
    const path = result.store.list("raw", "students")[0];
    const object = path ? result.store.read(path) : undefined;
    expect(object?.metadata.source).toBe("career_connect_oltp_export");
    expect(object?.metadata.batch_id).toContain("students");
    expect(object?.metadata.schema_version).toBe("v1");
  });

  it("reconciles record counts across layers", () => {
    expect(result.reconciliation.every((row) => row.balanced)).toBe(true);
    expect(result.summary.reconciliation.unbalanced).toEqual([]);
  });

  it("executes quality rules across all six dimensions", () => {
    const dimensions = new Set(result.run.quality.map((q) => q.dimension));
    expect(dimensions.has("completeness")).toBe(true);
    expect(dimensions.has("validity")).toBe(true);
    expect(dimensions.has("uniqueness")).toBe(true);
    expect(dimensions.has("consistency")).toBe(true);
    expect(dimensions.has("referential_integrity")).toBe(true);
    expect(dimensions.has("business_rule")).toBe(true);
    expect(result.summary.quality.rules_executed).toBeGreaterThan(20);
  });

  it("records run metadata and batch lineage", () => {
    expect(result.run.run_id).toContain("run_");
    expect(result.run.batches.length).toBeGreaterThan(0);
    expect(result.run.finished_at).toBeDefined();
    expect(result.run.errors).toEqual([]);
  });

  it("supports incremental loads via watermarks", () => {
    const watermarks = createWatermarkStore();
    const first = runPipeline({ config, watermarks, mode: "full" });
    const second = runPipeline({ config, watermarks, mode: "incremental" });
    expect(first.curated["students"]?.length ?? 0).toBeGreaterThan(0);
    expect(second.curated["students"]?.length ?? 0).toBe(0);
  });

  it("archives raw batches when requested", () => {
    const archived = runPipeline({ config, archive: true });
    expect(archived.store.list("raw")).toHaveLength(0);
    expect(archived.store.list("archive").length).toBeGreaterThan(0);
  });
});
