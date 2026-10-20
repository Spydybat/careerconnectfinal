import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * AI Mock Interview — question generation and answer evaluation.
 * Every session, question, answer and score is persisted for review.
 */

const StartInput = z.object({
  roleTitle: z.string().min(2).max(120),
  difficulty: z.enum(["gentle", "standard", "hard"]).default("standard"),
});

// Schemas live in src/ai/schemas.ts; prompts in the registry at src/ai/prompts.ts.

export const listInterviewSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_interview_sessions")
      .select("id, role_title, difficulty, status, overall_score, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

export const getInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [{ data: session }, { data: turns }] = await Promise.all([
      context.supabase
        .from("ai_interview_sessions")
        .select("id, role_title, difficulty, status, overall_score, summary, created_at")
        .eq("id", data.sessionId)
        .maybeSingle(),
      context.supabase
        .from("ai_interview_turns")
        .select("id, seq, category, question, answer, score, feedback")
        .eq("session_id", data.sessionId)
        .order("seq", { ascending: true }),
    ]);
    return { session, turns: turns ?? [] };
  });

export const startMockInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data, context }) => {
    const { buildStudentContext, renderContext } = await import("@/ai/context.server");
    const { routeStructured } = await import("@/ai/router.server");
    const { authorizeAiRequest } = await import("@/ai/authorization.server");
    const { getPrompt } = await import("@/ai/prompts");
    const { MockInterviewQuestionSetSchema } = await import("@/ai/schemas");

    await authorizeAiRequest(context.supabase, context.userId, "mock_interview_questions");
    const promptSpec = getPrompt("mock_interview_v1");

    const profile = await buildStudentContext(context.supabase, context.userId);

    const result = await routeStructured({
      feature: promptSpec.feature,
      chain: promptSpec.chain,
      userId: context.userId,
      schema: MockInterviewQuestionSetSchema,
      system: promptSpec.system,
      prompt: [
        `Role being interviewed for: ${data.roleTitle}`,
        `Difficulty: ${data.difficulty}`,
        "CANDIDATE CONTEXT (trusted, from the platform database):",
        renderContext(profile),
      ].join("\n\n"),
    });

    const questions = result.data.questions.slice(0, 5);
    if (questions.length === 0) throw new Error("The interviewer could not generate questions.");

    const { data: session, error } = await context.supabase
      .from("ai_interview_sessions")
      .insert({
        user_id: context.userId,
        role_title: data.roleTitle,
        difficulty: data.difficulty,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: turnsError } = await context.supabase.from("ai_interview_turns").insert(
      questions.map((q, index) => ({
        session_id: session.id,
        seq: index + 1,
        category: q.category,
        question: q.question,
      })),
    );
    if (turnsError) throw new Error(turnsError.message);

    return { sessionId: session.id };
  });

export const submitInterviewAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        turnId: z.string().uuid(),
        answer: z.string().min(2).max(6000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { guardInput, asUntrustedBlock, clampScore } = await import("@/ai/guardrails");
    const { routeStructured } = await import("@/ai/router.server");
    const { authorizeAiRequest } = await import("@/ai/authorization.server");
    const { getPrompt } = await import("@/ai/prompts");
    const { MockInterviewEvaluationSchema } = await import("@/ai/schemas");
    const { assertInputSize } = await import("@/ai/limits");

    await authorizeAiRequest(context.supabase, context.userId, "mock_interview_evaluation");
    const promptSpec = getPrompt("mock_interview_evaluation_v1");
    assertInputSize("mock_interview_evaluation", data.answer);

    const { sanitized } = guardInput(data.answer, promptSpec.maxUserChars);

    const { data: turn } = await context.supabase
      .from("ai_interview_turns")
      .select("id, question, category, session_id, ai_interview_sessions(role_title, difficulty)")
      .eq("id", data.turnId)
      .maybeSingle();
    if (!turn) throw new Error("That interview question could not be found.");

    const result = await routeStructured({
      feature: promptSpec.feature,
      chain: promptSpec.chain,
      userId: context.userId,
      schema: MockInterviewEvaluationSchema,
      system: promptSpec.system,
      prompt: [
        `Role: ${turn.ai_interview_sessions?.role_title ?? "Software Engineer"}`,
        `Difficulty: ${turn.ai_interview_sessions?.difficulty ?? "standard"}`,
        `Question category: ${turn.category}`,
        `Question: ${turn.question}`,
        asUntrustedBlock("candidate_answer", sanitized),
      ].join("\n\n"),
    });

    const evaluation = {
      score: clampScore(result.data.score),
      verdict: result.data.verdict,
      strengths: result.data.strengths.slice(0, 3),
      improvements: result.data.improvements.slice(0, 3),
      modelAnswer: result.data.modelAnswer,
    };

    const { error } = await context.supabase
      .from("ai_interview_turns")
      .update({
        answer: sanitized,
        score: evaluation.score,
        feedback: evaluation,
      })
      .eq("id", turn.id);
    if (error) throw new Error(error.message);

    return evaluation;
  });

export const finishMockInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { routeStructured } = await import("@/ai/router.server");
    const { clampScore } = await import("@/ai/guardrails");
    const { authorizeAiRequest } = await import("@/ai/authorization.server");
    const { getPrompt } = await import("@/ai/prompts");
    const { MockInterviewSummarySchema } = await import("@/ai/schemas");

    await authorizeAiRequest(context.supabase, context.userId, "mock_interview_evaluation");
    const promptSpec = getPrompt("mock_interview_summary_v1");

    const { data: turns } = await context.supabase
      .from("ai_interview_turns")
      .select("seq, category, question, answer, score, feedback")
      .eq("session_id", data.sessionId)
      .order("seq", { ascending: true });

    const answered = (turns ?? []).filter((t) => t.answer);
    if (answered.length === 0) throw new Error("Answer at least one question first.");

    const result = await routeStructured({
      feature: promptSpec.feature,
      chain: promptSpec.chain,
      userId: context.userId,
      schema: MockInterviewSummarySchema,
      system: promptSpec.system,
      prompt: answered
        .map(
          (t) =>
            `Q${t.seq} (${t.category}): ${t.question}\nScore: ${t.score ?? "n/a"}\nAnswer: ${(t.answer ?? "").slice(0, 1200)}`,
        )
        .join("\n\n"),
    });

    const overall = clampScore(result.data.overallScore);
    const { error } = await context.supabase
      .from("ai_interview_sessions")
      .update({
        status: "completed",
        overall_score: overall,
        summary: result.data.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);

    return {
      overallScore: overall,
      summary: result.data.summary,
      focusAreas: result.data.focusAreas.slice(0, 3),
    };
  });
