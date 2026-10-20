import { describe, expect, it } from "vitest";
import { runRules, summariseReports } from "../quality/engine";
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
} from "../quality/rules";
import type { Row } from "../etl/transform";

const context = { dataset: "students", batch_id: "b1", executed_at: "2026-01-01T00:00:00.000Z" };

describe("quality rules", () => {
  it("detects missing values", () => {
    const records: Row[] = [{ email: "a@b.com" }, { email: "" }, { email: null }];
    const report = runRules(records, [notNull("students", "email")], context);
    expect(report.results[0]?.records_failed).toBe(2);
    expect(report.results[0]?.status).toBe("FAIL");
  });

  it("validates patterns, ranges and allowed values", () => {
    const records: Row[] = [
      { email: "ok@x.com", cgpa: 8, status: "applied" },
      { email: "nope", cgpa: 12, status: "unknown" },
    ];
    const report = runRules(
      records,
      [
        matchesPattern("students", "email", /^[^@]+@[^@]+\.[a-z]+$/),
        inRange("students", "cgpa", 0, 10),
        inSet("students", "status", ["applied", "rejected"]),
      ],
      context,
    );
    expect(report.results.map((r) => r.records_failed)).toEqual([1, 1, 1]);
  });

  it("detects duplicates and bad dates", () => {
    const records: Row[] = [
      { id: "1", last_updated: "2026-01-01T00:00:00.000Z" },
      { id: "1", last_updated: "not-a-date" },
    ];
    const report = runRules(
      records,
      [unique("students", "id", records), isIsoDate("students", "last_updated")],
      context,
    );
    expect(report.results[0]?.records_failed).toBe(2);
    expect(report.results[1]?.records_failed).toBe(1);
  });

  it("enforces referential integrity, consistency and business rules", () => {
    const records: Row[] = [
      { college_id: "C1", enrollment_year: 2022, graduation_year: 2026, cgpa: 9 },
      { college_id: "C9", enrollment_year: 2026, graduation_year: 2024, cgpa: 3 },
    ];
    const report = runRules(
      records,
      [
        referencesKey("students", "college_id", "colleges", ["C1"]),
        consistent(
          "students",
          "grad_after_enrol",
          "graduation after enrollment",
          (r) => Number(r["graduation_year"]) > Number(r["enrollment_year"]),
        ),
        businessRule("students", "min_cgpa", "cgpa >= 5", (r) => Number(r["cgpa"]) >= 5),
      ],
      context,
    );
    expect(report.results.every((r) => r.records_failed === 1)).toBe(true);
    expect(report.quarantine_indexes).toEqual([1]);
    expect(report.passed).toBe(false);
  });

  it("summarises reports", () => {
    const report = runRules([{ id: "1" }], [notNull("students", "id")], context);
    const summary = summariseReports([report]);
    expect(summary.rules_executed).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(0);
  });
});
