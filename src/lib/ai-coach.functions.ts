import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * AI Career Coach — grounded, conversation-aware guidance.
 * Conversations are persisted so a student can come back to advice later.
 */

const AskInput = z.object({
  conversationId: z.string().uuid().nullable().default(null),
  message: z.string().min(2).max(4000),
});

// Response schema and system prompt live in the AI layer (src/ai/schemas.ts,
// src/ai/prompts.ts) — features never inline them.

export const listCoachConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

export const getCoachConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ conversationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: messages } = await context.supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    return messages ?? [];
  });

export const askCareerCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    const { guardInput, asUntrustedBlock } = await import("@/ai/guardrails");
    const { buildStudentContext, renderContext } = await import("@/ai/context.server");
    const { routeStructured } = await import("@/ai/router.server");
    const { authorizeAiRequest } = await import("@/ai/authorization.server");
    const { getPrompt } = await import("@/ai/prompts");
    const { CareerCoachResponseSchema } = await import("@/ai/schemas");
    const { assertInputSize } = await import("@/ai/limits");

    // Authenticate -> authorize -> scope, before any context is assembled.
    await authorizeAiRequest(context.supabase, context.userId, "career_coach");

    const prompt = getPrompt("career_coach_v1");
    assertInputSize("career_coach", data.message);
    const { sanitized } = guardInput(data.message, prompt.maxUserChars);
    const profile = await buildStudentContext(context.supabase, context.userId);

    // Reuse or open a thread before calling the model so history is never lost.
    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: created, error } = await context.supabase
        .from("ai_conversations")
        .insert({
          user_id: context.userId,
          title: sanitized.slice(0, 60),
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = created.id;
    }

    const { data: history } = await context.supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    await context.supabase
      .from("ai_messages")
      .insert({ conversation_id: conversationId, role: "user", content: sanitized });

    const transcript = (history ?? [])
      .map((m) => `${m.role === "assistant" ? "Coach" : "Student"}: ${m.content}`)
      .join("\n");

    const result = await routeStructured({
      feature: prompt.feature,
      chain: prompt.chain,
      userId: context.userId,
      schema: CareerCoachResponseSchema,
      system: prompt.system,

      prompt: [
        "STUDENT CONTEXT (trusted, from the platform database):",
        renderContext(profile),
        transcript ? `CONVERSATION SO FAR:\n${transcript}` : "",
        asUntrustedBlock("student_question", sanitized),
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const reply = {
      ...result.data,
      nextSteps: result.data.nextSteps.slice(0, 4),
      suggestedFollowUps: result.data.suggestedFollowUps.slice(0, 3),
    };

    await context.supabase
      .from("ai_messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: reply.answer });
    await context.supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { conversationId, reply, model: result.model, provider: result.provider };
  });
