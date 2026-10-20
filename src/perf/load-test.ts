/**
 * Sprint 12 — repeatable load-test foundation.
 *
 * A tiny concurrent scenario runner so API, analytics, AI and ETL paths can be
 * measured under normal / moderate / peak-like load with the same reporting
 * shape. It has no network dependency: the caller supplies the task, which may
 * be a server function, an analytics query or an ETL run.
 */

import { formatSummary, now, summarize, type LatencySummary } from "./measure";

export type LoadProfile = {
  name: "normal" | "moderate" | "peak";
  concurrency: number;
  iterations: number;
};

export const LOAD_PROFILES: readonly LoadProfile[] = [
  { name: "normal", concurrency: 4, iterations: 40 },
  { name: "moderate", concurrency: 16, iterations: 160 },
  { name: "peak", concurrency: 48, iterations: 480 },
];

export type Scenario = {
  label: string;
  /** One unit of work. Throwing counts as an error, not a latency sample. */
  task: (iteration: number) => Promise<unknown> | unknown;
};

export type ScenarioResult = LatencySummary & { profile: LoadProfile["name"] };

export async function runScenario(
  scenario: Scenario,
  profile: LoadProfile,
): Promise<ScenarioResult> {
  const samples: number[] = [];
  let errors = 0;
  let next = 0;
  const startedAt = now();

  async function worker(): Promise<void> {
    for (;;) {
      const iteration = next;
      next += 1;
      if (iteration >= profile.iterations) return;
      const started = now();
      try {
        await scenario.task(iteration);
        samples.push(now() - started);
      } catch {
        errors += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, profile.concurrency) }, () => worker()));

  const summary = summarize(`${scenario.label} [${profile.name}]`, samples, {
    errors,
    durationMs: now() - startedAt,
  });
  return { ...summary, profile: profile.name };
}

/** Runs one scenario across every load profile, in increasing order. */
export async function runLoadProfiles(
  scenario: Scenario,
  profiles: readonly LoadProfile[] = LOAD_PROFILES,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];
  for (const profile of profiles) {
    results.push(await runScenario(scenario, profile));
  }
  return results;
}

export function reportResults(results: readonly ScenarioResult[]): string {
  return results.map((r) => formatSummary(r)).join("\n");
}
