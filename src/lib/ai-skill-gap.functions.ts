import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * AI Skill Gap analysis — compares a student's recorded skills against the
 * skills their target career expects, then produces a prioritised learning plan.
 * The deterministic gap maths happens in code; the model only writes the plan.
 */

// Response schema lives in src/ai/schemas.ts; the system prompt lives in the
// versioned registry at src/ai/prompts.ts.

export const listSkillGapReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_skill_gap_reports")
      .select("id, career_title, readiness_score, gaps, plan, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    return data ?? [];
  });

export const analyseSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ careerId: z.string().uuid().nullable().default(null) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { buildStudentContext, renderContext } = await import("@/ai/context.server");
    const { routeStructured } = await import("@/ai/router.server");
    const { clampScore } = await import("@/ai/guardrails");
    const { authorizeAiRequest } = await import("@/ai/authorization.server");
    const { getPrompt } = await import("@/ai/prompts");
    const { SkillGapResponseSchema } = await import("@/ai/schemas");
    const { buildSkillGapRows } = await import("@/ai/skills");

    await authorizeAiRequest(context.supabase, context.userId, "skill_gap");

    const profile = await buildStudentContext(context.supabase, context.userId);

    const careerId = data.careerId ?? profile.targetCareer?.id ?? null;
    let careerTitle = profile.targetCareer?.title ?? "";
    let required = profile.requiredSkills;

    if (careerId && careerId !== profile.targetCareer?.id) {
      const [{ data: career }, { data: careerSkills }] = await Promise.all([
        context.supabase.from("careers").select("title").eq("id", careerId).maybeSingle(),
        context.supabase
          .from("career_skills")
          .select("importance, skills(name)")
          .eq("career_id", careerId),
      ]);
      careerTitle = career?.title ?? "";
      required = (careerSkills ?? [])
        .map((row) => ({ name: row.skills?.name ?? "", importance: row.importance ?? 3 }))
        .filter((s) => s.name)
        .sort((a, b) => b.importance - a.importance);
    }

    if (!careerId || required.length === 0) {
      throw new Error("Choose a target career on your profile first.");
    }

    // Deterministic readiness maths — the model never computes the score.
    const have = new Map(profile.skills.map((s) => [s.name.toLowerCase(), s.proficiency]));
    const totalWeight = required.reduce((sum, s) => sum + s.importance, 0);
    const earned = required.reduce((sum, s) => {
      const level = have.get(s.name.toLowerCase()) ?? 0;
      return sum + s.importance * Math.min(1, level / 4);
    }, 0);
    const readiness = clampScore(totalWeight > 0 ? (earned / totalWeight) * 100 : 0);

    // Canonical taxonomy normalisation — gap rows come from code, not the model.
    const canonicalRows = buildSkillGapRows(profile.skills, required);
    const missing = canonicalRows.slice(0, 8).map((row) => ({
      skill: row.skillName,
      importance: row.importance,
      currentLevel: row.currentLevel,
    }));

    const promptSpec = getPrompt("skill_gap_v1");
    const result = await routeStructured({
      feature: promptSpec.feature,
      chain: promptSpec.chain,
      userId: context.userId,
      schema: SkillGapResponseSchema,
      system: promptSpec.system,

      prompt: [
        `Target career: ${careerTitle}`,
        `Computed readiness score: ${readiness}/100 (already calculated — do not recompute).`,
        "STUDENT CONTEXT (trusted, from the platform database):",
        renderContext(profile),
        "SKILL GAPS TO COVER (skill | importance 1-5 | current level 0-5):",
        missing.length
          ? missing.map((g) => `${g.skill} | ${g.importance} | ${g.currentLevel}`).join("\n")
          : "None — the student meets the core expectations; focus the plan on depth and portfolio evidence.",
      ].join("\n\n"),
    });

    const gaps = result.data.gaps.slice(0, 8);
    const plan = result.data.plan.slice(0, 5).map((step, index) => ({
      ...step,
      step: index + 1,
      durationWeeks: Math.max(1, Math.min(8, Math.round(step.durationWeeks))),
    }));

    const { data: saved, error } = await context.supabase
      .from("ai_skill_gap_reports")
      .insert({
        user_id: context.userId,
        career_id: careerId,
        career_title: careerTitle,
        readiness_score: readiness,
        gaps,
        plan,
        summary: result.data.summary,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: saved.id,
      careerTitle,
      readinessScore: readiness,
      summary: result.data.summary,
      gaps,
      plan,
    };
  });
