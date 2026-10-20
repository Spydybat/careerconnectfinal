import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ResumeInput = z.object({
  resumeText: z.string().min(80, "Add at least a few lines of resume text"),
  targetCareer: z.string().optional(),
  knownSkills: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
});

const ResumeAnalysis = z.object({
  score: z.number(),
  atsScore: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  extractedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experience: z.array(
    z.object({
      role: z.string(),
      organisation: z.string(),
      duration: z.string(),
      highlight: z.string(),
    }),
  ),
  education: z.array(
    z.object({
      qualification: z.string(),
      institution: z.string(),
      year: z.string(),
    }),
  ),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ResumeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project yet.");

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const { streamText, Output } = await import("ai");

    const gateway = createLovableAiGatewayProvider(key);

    const result = streamText({
      model: gateway("google/gemini-3.5-flash"),
      output: Output.object({ schema: ResumeAnalysis }),
      system:
        "You are a technical recruiter and career coach reviewing a student's resume for early-career technology roles. " +
        "Be specific and actionable. score and atsScore are 0-100 integers. Score strictly: 0-40 weak, 41-70 average, 71-85 strong, 86-100 exceptional. " +
        "atsScore judges applicant-tracking-system friendliness: keyword coverage, standard section headings, plain formatting, quantified bullets, contact details. " +
        "missingSkills lists high-value skills expected for the target career that the resume does not evidence (max 10). " +
        "improvements: at most 6 concrete rewrite actions. strengths: at most 5. " +
        "Extract only concrete technical or professional skills, normalized to their canonical name (ReactJS -> React, Postgres -> PostgreSQL, AWS Cloud -> AWS).",
      prompt: [
        data.targetCareer ? `Target career: ${data.targetCareer}` : "Target career: not specified",
        data.requiredSkills.length
          ? `Skills typically required for that career: ${data.requiredSkills.join(", ")}`
          : "",
        data.knownSkills.length
          ? `Skills already on the student's profile: ${data.knownSkills.join(", ")}`
          : "",
        "Resume text:",
        data.resumeText.slice(0, 12000),
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const output = ResumeAnalysis.parse(await result.output);
    return {
      ...output,
      score: Math.max(0, Math.min(100, Math.round(output.score))),
      atsScore: Math.max(0, Math.min(100, Math.round(output.atsScore))),
      improvements: output.improvements.slice(0, 6),
      strengths: output.strengths.slice(0, 5),
      missingSkills: output.missingSkills.slice(0, 10),
    };
  });
