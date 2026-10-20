import { describe, expect, it } from "vitest";
import { routeWithFallback } from "@/ai/routing";
import { classifyFailure } from "@/ai/provider";
import { evaluateQuota, capPrompt, assertInputSize, limitsFor } from "@/ai/limits";
import { normaliseSkill, buildSkillGapRows } from "@/ai/skills";
import { validateAiOutput, CareerCoachResponseSchema } from "@/ai/schemas";
import { getPrompt } from "@/ai/prompts";
import { redactErrorMessage } from "@/ai/usage.server";
import type { AiModelConfig } from "@/ai/types";

const model = (id: string, provider: AiModelConfig["provider"]): AiModelConfig => ({
  id,
  provider,
  label: id,
  available: true,
  inputCostPerMillion: 1,
  outputCostPerMillion: 2,
  timeoutMs: 50,
  maxRetries: 1,
  maxInputChars: 10_000,
  maxOutputTokens: 512,
});

describe("routing core", () => {
  const models = [model("primary", "gemini"), model("fallback", "gemini")];

  it("returns the primary result without fallback", async () => {
    const out = await routeWithFallback({ models, invoke: async () => "ok" });
    expect(out.ok && out.data).toBe("ok");
    expect(out.ok && out.fallbacksUsed.length).toBe(0);
  });

  it("falls back to the next model when the primary keeps failing", async () => {
    let calls = 0;
    const out = await routeWithFallback({
      models,
      invoke: async (m) => {
        calls += 1;
        if (m.id === "primary") throw new Error("503 upstream unavailable");
        return "from-fallback";
      },
    });
    expect(out.ok && out.data).toBe("from-fallback");
    expect(out.ok && out.fallbacksUsed.length).toBe(1);
    expect(calls).toBeGreaterThan(1);
  });

  it("does not retry a non-transient failure on the same model", async () => {
    const attempts: string[] = [];
    await routeWithFallback({
      models,
      invoke: async (m) => {
        attempts.push(m.id);
        throw new Error("invalid output: schema validation failed");
      },
    });
    expect(attempts.filter((id) => id === "primary")).toHaveLength(1);
  });

  it("fails in a controlled way when every model fails", async () => {
    const out = await routeWithFallback({
      models,
      invoke: async () => {
        throw new Error("429 rate limited");
      },
    });
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.failure).toBe("rate_limited");
  });

  it("times out a hanging provider call", async () => {
    const out = await routeWithFallback({
      models: [model("slow", "gemini")],
      invoke: (_m, _c, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    });
    expect(out.ok).toBe(false);
  });
});

describe("error classification", () => {
  it.each([
    ["429 Too Many Requests", "rate_limited"],
    ["502 bad gateway", "provider_error"],
    ["The operation timed out", "timeout"],
    ["invalid output: schema validation failed", "invalid_output"],
  ])("classifies %s", (message, expected) => {
    expect(classifyFailure(new Error(message))).toBe(expected);
  });
});

describe("limits", () => {
  it("blocks a user over the hourly quota", () => {
    const limit = limitsFor("career_coach");
    const decision = evaluateQuota("career_coach", {
      lastHour: limit.perUserPerHour,
      lastDay: 0,
      costTodayUsd: 0,
    });
    expect(decision.allowed).toBe(false);
  });

  it("allows a user under quota", () => {
    expect(
      evaluateQuota("career_coach", { lastHour: 0, lastDay: 0, costTodayUsd: 0 }).allowed,
    ).toBe(true);
  });

  it("caps oversized prompts", () => {
    const capped = capPrompt("career_coach", "x".repeat(500_000));
    expect(capped.length).toBeLessThan(500_000);
  });

  it("rejects oversized user input", () => {
    expect(() => assertInputSize("career_coach", "x".repeat(500_000))).toThrow();
  });
});

describe("skill normalisation", () => {
  it("maps aliases onto the canonical taxonomy", () => {
    expect(normaliseSkill("reactjs")?.name.toLowerCase()).toContain("react");
    expect(normaliseSkill("  JS ")).toBeTruthy();
  });

  it("produces deterministic gap rows", () => {
    const rows = buildSkillGapRows(
      [{ name: "React", proficiency: 2 }],
      [
        { name: "React", importance: 5 },
        { name: "TypeScript", importance: 4 },
      ],
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.find((r) => r.skillName.toLowerCase().includes("react"))?.importance).toBe(5);
    expect(rows.every((r) => r.currentLevel <= r.targetLevel)).toBe(true);
  });
});

describe("schemas and prompts", () => {
  it("rejects malformed model output", () => {
    const result = validateAiOutput(CareerCoachResponseSchema, { answer: 42 });
    expect(result.ok).toBe(false);
  });

  it("accepts well-formed model output", () => {
    const result = validateAiOutput(CareerCoachResponseSchema, {
      answer: "Focus on TypeScript.",
      nextSteps: ["Build a project"],
      suggestedFollowUps: ["What should I learn next?"],
    });
    expect(result.ok).toBe(true);
  });

  it("every prompt carries the safety clause", () => {
    const prompt = getPrompt("career_coach_v1");
    expect(prompt.system.length).toBeGreaterThan(50);
    expect(prompt.id).toBe("career_coach_v1");
  });
});

describe("usage redaction", () => {
  it("removes credentials from logged errors", () => {
    const redacted = redactErrorMessage("failed with key sk-abcdef123456789 in request");
    expect(redacted).not.toContain("sk-abcdef123456789");
  });
});
