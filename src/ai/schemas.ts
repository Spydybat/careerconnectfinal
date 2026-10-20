import { z } from "zod";

/**
 * Sprint 11 — typed AI output schemas.
 *
 * Every model call in the application validates against one of these. Model
 * output is untrusted until it has passed through here; anything that fails
 * validation is a controlled `invalid_output` error, never application data.
 *
 * Schemas stay strict-compatible: flat objects, no constraints the model can
 * silently violate (length/format bounds live in the prompt and in the
 * post-parse clamps below).
 */

const shortText = z.string().min(1).max(600);
const paragraph = z.string().min(1).max(4000);
const score = z.number();

export const CareerCoachResponseSchema = z.object({
  answer: paragraph,
  nextSteps: z.array(shortText),
  suggestedFollowUps: z.array(shortText),
});
export type CareerCoachResponse = z.infer<typeof CareerCoachResponseSchema>;

export const SkillGapResponseSchema = z.object({
  summary: paragraph,
  gaps: z.array(
    z.object({
      skill: shortText,
      importance: z.number(),
      currentLevel: z.number(),
      why: shortText,
    }),
  ),
  plan: z.array(
    z.object({
      step: z.number(),
      title: shortText,
      focus: shortText,
      durationWeeks: z.number(),
      outcome: shortText,
    }),
  ),
});
export type SkillGapResponse = z.infer<typeof SkillGapResponseSchema>;

export const MockInterviewQuestionSchema = z.object({
  category: z.enum(["behavioural", "technical", "system_design", "role_specific"]),
  question: shortText,
});
export type MockInterviewQuestion = z.infer<typeof MockInterviewQuestionSchema>;

export const MockInterviewQuestionSetSchema = z.object({
  questions: z.array(MockInterviewQuestionSchema),
});

export const MockInterviewEvaluationSchema = z.object({
  score,
  verdict: shortText,
  strengths: z.array(shortText),
  improvements: z.array(shortText),
  modelAnswer: paragraph,
});
export type MockInterviewEvaluation = z.infer<typeof MockInterviewEvaluationSchema>;

export const MockInterviewSummarySchema = z.object({
  overallScore: score,
  summary: paragraph,
  focusAreas: z.array(shortText),
});

export const ResumeAnalysisSchema = z.object({
  summary: paragraph,
  strengths: z.array(shortText),
  weaknesses: z.array(shortText),
  extractedSkills: z.array(shortText),
  atsScore: score,
});
export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

export const CareerRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      careerTitle: shortText,
      fitScore: score,
      rationale: shortText,
    }),
  ),
});
export type CareerRecommendation = z.infer<typeof CareerRecommendationSchema>;

export const LearningRecommendationSchema = z.object({
  items: z.array(
    z.object({
      title: shortText,
      skill: shortText,
      provider: shortText,
      durationWeeks: z.number(),
      why: shortText,
    }),
  ),
});
export type LearningRecommendation = z.infer<typeof LearningRecommendationSchema>;

export const JobMatchSchema = z.object({
  matches: z.array(
    z.object({
      jobTitle: shortText,
      matchScore: score,
      matchedSkills: z.array(shortText),
      missingSkills: z.array(shortText),
      rationale: shortText,
    }),
  ),
});
export type JobMatch = z.infer<typeof JobMatchSchema>;

export const AI_SCHEMAS = {
  career_coach_response: CareerCoachResponseSchema,
  skill_gap_response: SkillGapResponseSchema,
  mock_interview_question: MockInterviewQuestionSetSchema,
  mock_interview_evaluation: MockInterviewEvaluationSchema,
  mock_interview_summary: MockInterviewSummarySchema,
  resume_analysis: ResumeAnalysisSchema,
  career_recommendation: CareerRecommendationSchema,
  learning_recommendation: LearningRecommendationSchema,
  job_match: JobMatchSchema,
} as const;

export type AiSchemaName = keyof typeof AI_SCHEMAS;

export type SchemaValidation<T> = { ok: true; data: T } | { ok: false; issues: string[] };

/**
 * Validates raw model output. Returns a discriminated result rather than
 * throwing so callers must handle the invalid case explicitly.
 */
export function validateAiOutput<T>(schema: z.ZodType<T>, value: unknown): SchemaValidation<T> {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`),
  };
}
