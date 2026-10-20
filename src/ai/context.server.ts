import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * AI Context Engine.
 *
 * Builds the grounding context for a model call from the operational database.
 * It is deliberately authorization-aware: it only ever uses the *authenticated*
 * Supabase client from the request middleware, so row level security decides
 * what the model can see. The service-role client is never used here.
 */

export type StudentContext = {
  studentId: string | null;
  name: string;
  headline: string | null;
  college: string | null;
  degree: string | null;
  branch: string | null;
  graduationYear: number | null;
  cgpa: number | null;
  targetCareer: { id: string; title: string; summary: string } | null;
  skills: { name: string; proficiency: number }[];
  requiredSkills: { name: string; importance: number }[];
  projects: { title: string; techStack: string | null }[];
  applications: { title: string; company: string | null; status: string }[];
  latestResumeSummary: string | null;
};

type Client = SupabaseClient<Database>;

export async function buildStudentContext(
  supabase: Client,
  userId: string,
): Promise<StudentContext> {
  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("full_name, headline").eq("id", userId).maybeSingle(),
    supabase
      .from("students")
      .select("id, college, degree, branch, graduation_year, cgpa, target_career_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const base: StudentContext = {
    studentId: student?.id ?? null,
    name: profile?.full_name?.trim() || "the student",
    headline: profile?.headline ?? null,
    college: student?.college ?? null,
    degree: student?.degree ?? null,
    branch: student?.branch ?? null,
    graduationYear: student?.graduation_year ?? null,
    cgpa: student?.cgpa ?? null,
    targetCareer: null,
    skills: [],
    requiredSkills: [],
    projects: [],
    applications: [],
    latestResumeSummary: null,
  };

  if (!student) return base;

  const [career, skills, projects, applications, resume] = await Promise.all([
    student.target_career_id
      ? supabase
          .from("careers")
          .select("id, title, summary")
          .eq("id", student.target_career_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("student_skills")
      .select("proficiency, skills(name)")
      .eq("student_id", student.id),
    supabase.from("projects").select("title, tech_stack").eq("student_id", student.id).limit(10),
    supabase
      .from("applications")
      .select("status, jobs(title, companies(name))")
      .eq("student_id", student.id)
      .order("applied_at", { ascending: false })
      .limit(10),
    supabase
      .from("resumes")
      .select("ai_summary")
      .eq("student_id", student.id)
      .not("ai_summary", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  base.targetCareer = career.data ?? null;

  base.skills = (skills.data ?? [])
    .map((row) => ({
      name: row.skills?.name ?? "",
      proficiency: row.proficiency ?? 3,
    }))
    .filter((s) => s.name);

  base.projects = (projects.data ?? []).map((p) => ({
    title: p.title,
    techStack: p.tech_stack,
  }));

  base.applications = (applications.data ?? []).map((a) => ({
    title: a.jobs?.title ?? "Role",
    company: a.jobs?.companies?.name ?? null,
    status: a.status,
  }));

  base.latestResumeSummary = resume.data?.ai_summary ?? null;

  if (student.target_career_id) {
    const { data: required } = await supabase
      .from("career_skills")
      .select("importance, skills(name)")
      .eq("career_id", student.target_career_id);

    base.requiredSkills = (required ?? [])
      .map((row) => ({ name: row.skills?.name ?? "", importance: row.importance ?? 3 }))
      .filter((s) => s.name)
      .sort((a, b) => b.importance - a.importance);
  }

  return base;
}

/** Renders the context as a compact, token-efficient briefing for the model. */
export function renderContext(ctx: StudentContext): string {
  const lines: string[] = [`Student: ${ctx.name}`];

  if (ctx.headline) lines.push(`Headline: ${ctx.headline}`);
  const study = [ctx.degree, ctx.branch, ctx.college].filter(Boolean).join(", ");
  if (study) lines.push(`Studying: ${study}`);
  if (ctx.graduationYear) lines.push(`Graduating: ${ctx.graduationYear}`);
  if (ctx.cgpa) lines.push(`CGPA: ${ctx.cgpa}`);
  lines.push(
    ctx.targetCareer
      ? `Target career: ${ctx.targetCareer.title} — ${ctx.targetCareer.summary}`
      : "Target career: not chosen yet",
  );
  lines.push(
    ctx.skills.length
      ? `Current skills (name:proficiency 1-5): ${ctx.skills
          .map((s) => `${s.name}:${s.proficiency}`)
          .join(", ")}`
      : "Current skills: none recorded",
  );
  if (ctx.requiredSkills.length) {
    lines.push(
      `Skills the target career expects (name:importance 1-5): ${ctx.requiredSkills
        .map((s) => `${s.name}:${s.importance}`)
        .join(", ")}`,
    );
  }
  if (ctx.projects.length) {
    lines.push(
      `Projects: ${ctx.projects
        .map((p) => (p.techStack ? `${p.title} (${p.techStack})` : p.title))
        .join("; ")}`,
    );
  }
  if (ctx.applications.length) {
    lines.push(
      `Recent applications: ${ctx.applications
        .map((a) => `${a.title}${a.company ? ` at ${a.company}` : ""} — ${a.status}`)
        .join("; ")}`,
    );
  }
  if (ctx.latestResumeSummary) {
    lines.push(`Latest resume summary: ${ctx.latestResumeSummary}`);
  }

  return lines.join("\n");
}
