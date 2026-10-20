/**
 * Negative fixtures: intentionally corrupted records must be detected by the
 * quality rulesets and routed to quarantine. Each fixture violates exactly one
 * rule so a failure here points at a single broken check.
 */

import { describe, expect, it } from "vitest";
import { runRules } from "../quality/engine";
import { rulesFor, type RuleSetContext } from "../quality/rulesets";
import type { Row } from "../etl/transform";
import { createConfig } from "../config";
import { runPipeline } from "../etl/pipeline";

const context = { batch_id: "fixture", executed_at: "2026-01-01T00:00:00.000Z" };
const keys: RuleSetContext = {
  keys: {
    colleges: new Set(["CLG001"]),
    companies: new Set(["CMP001"]),
    students: new Set(["STU001"]),
    jobs: new Set(["JOB001"]),
  },
};

function check(dataset: string, records: Row[]) {
  return runRules(records, rulesFor(dataset, records, keys), { dataset, ...context });
}

const goodStudent: Row = {
  student_id: "STU001",
  full_name: "Asha Rao",
  email: "asha@example.com",
  college_id: "CLG001",
  enrollment_year: 2022,
  graduation_year: 2026,
  cgpa: 8.1,
  backlogs: 0,
  is_placement_eligible: true,
  last_updated: "2026-01-01T00:00:00.000Z",
};

describe("negative fixtures — students", () => {
  it("passes a clean record", () => {
    const report = check("students", [goodStudent]);
    expect(report.passed).toBe(true);
    expect(report.quarantine_indexes).toEqual([]);
  });

  it("quarantines a duplicate business key", () => {
    const report = check("students", [goodStudent, { ...goodStudent }]);
    const rule = report.results.find((r) => r.rule.includes("unique"));
    expect(rule?.records_failed).toBe(2);
    expect(report.quarantine_indexes).toEqual([0, 1]);
  });

  it("quarantines a malformed email", () => {
    const report = check("students", [{ ...goodStudent, email: "not-an-email" }]);
    expect(report.passed).toBe(false);
    expect(report.quarantine_indexes).toContain(0);
  });

  it("quarantines an out-of-range cgpa", () => {
    const report = check("students", [{ ...goodStudent, cgpa: 14 }]);
    expect(report.quarantine_indexes).toContain(0);
  });

  it("quarantines an orphan college reference", () => {
    const report = check("students", [{ ...goodStudent, college_id: "CLG999" }]);
    const rule = report.results.find((r) => r.dimension === "referential_integrity");
    expect(rule?.records_failed).toBe(1);
    expect(report.quarantine_indexes).toContain(0);
  });

  it("quarantines graduation before enrollment", () => {
    const report = check("students", [{ ...goodStudent, graduation_year: 2021 }]);
    const rule = report.results.find((r) => r.rule.includes("graduation_after_enrollment"));
    expect(rule?.records_failed).toBe(1);
  });

  it("quarantines eligibility that violates the cgpa/backlog rule", () => {
    const report = check("students", [
      { ...goodStudent, cgpa: 5.2, is_placement_eligible: true },
      { ...goodStudent, student_id: "STU002", backlogs: 2, is_placement_eligible: true },
    ]);
    const rule = report.results.find((r) => r.rule.includes("eligibility_requires_cgpa"));
    expect(rule?.records_failed).toBe(2);
    expect(rule?.dimension).toBe("business_rule");
  });

  it("quarantines a non-ISO watermark", () => {
    const report = check("students", [{ ...goodStudent, last_updated: "not-a-timestamp" }]);
    const rule = report.results.find((r) => r.rule.includes("last_updated"));
    expect(rule?.records_failed).toBe(1);
    expect(rule?.status).not.toBe("PASS");
  });
});

describe("negative fixtures — hiring trends", () => {
  const goodTrend: Row = {
    trend_id: "HT001",
    month: "2026-01",
    category_code: "SDE",
    location_code: "BLR",
    jobs_posted: 10,
    applications_received: 80,
    offers_made: 6,
    avg_time_to_hire_days: 21,
    demand_index: 55,
    last_updated: "2026-01-01T00:00:00.000Z",
  };

  it("passes a clean bucket", () => {
    expect(check("hiring_trends", [goodTrend]).passed).toBe(true);
  });

  it("quarantines offers exceeding applications", () => {
    const report = check("hiring_trends", [{ ...goodTrend, offers_made: 200 }]);
    const rule = report.results.find((r) => r.rule.includes("offers_not_exceeding_applications"));
    expect(rule?.records_failed).toBe(1);
    expect(report.quarantine_indexes).toContain(0);
  });

  it("quarantines a demand index outside 0-100", () => {
    expect(check("hiring_trends", [{ ...goodTrend, demand_index: 140 }]).passed).toBe(false);
  });
});

describe("generated data satisfies every rule", () => {
  it("produces zero quarantined records on a normal run", () => {
    const result = runPipeline({ config: createConfig({ scale: 0.02 }) });
    const failing = result.quality.flatMap((report) =>
      report.results.filter((r) => r.status !== "PASS").map((r) => `${r.dataset}.${r.rule}`),
    );
    expect(failing).toEqual([]);
    expect(result.summary.quality.records_quarantined).toBe(0);
  });
});
