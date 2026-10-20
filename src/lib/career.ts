import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export type SkillRow = { id: string; name: string; slug: string; category_id: string | null };

export function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "Not disclosed";
  const lakh = (n: number) => `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (min && max) return `₹${lakh(min)} – ₹${lakh(max)}`;
  return `₹${lakh((min ?? max)!)}+`;
}

export const STATUS_FLOW = [
  "applied",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
] as const;
export type ApplicationStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offer extended",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, slug, category_id, skill_categories(name)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyStudent() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-student", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const inserted = await supabase
        .from("students")
        .insert({ user_id: user!.id })
        .select("*")
        .single();
      if (inserted.error) throw inserted.error;
      return inserted.data;
    },
  });
}

export function useMyProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyStudentSkills(studentId?: string) {
  return useQuery({
    queryKey: ["student-skills", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_skills")
        .select("id, proficiency, source, skill_id, skills(id, name, slug)")
        .eq("student_id", studentId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCareers() {
  return useQuery({
    queryKey: ["careers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("careers")
        .select("*, career_skills(importance, skills(id, name, slug))")
        .order("demand_score", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "*, companies(id, name, slug, industry, headquarters), job_skills(importance, skills(id, name, slug))",
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyApplications(studentId?: string) {
  return useQuery({
    queryKey: ["my-applications", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(id, title, location, companies(name))")
        .eq("student_id", studentId!)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyResumes(studentId?: string) {
  return useQuery({
    queryKey: ["resumes", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Deterministic match engine: weighted overlap between required and held skills. */
export function useSavedJobs(studentId?: string) {
  return useQuery({
    queryKey: ["saved-jobs", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, job_id")
        .eq("student_id", studentId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCareerBySlug(slug: string) {
  return useQuery({
    queryKey: ["career", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("careers")
        .select("*, career_skills(importance, skills(id, name, slug))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "*, companies(id, name, slug, industry, headquarters, website, description), job_skills(importance, skills(id, name, slug))",
        )
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useResume(resumeId: string) {
  return useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useApplicationDetails(applicationIds: string[]) {
  const key = applicationIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["application-details", key],
    enabled: applicationIds.length > 0,
    queryFn: async () => {
      const [events, interviews, offers] = await Promise.all([
        supabase
          .from("application_events")
          .select("*")
          .in("application_id", applicationIds)
          .order("created_at", { ascending: true }),
        supabase.from("interviews").select("*").in("application_id", applicationIds),
        supabase.from("offers").select("*").in("application_id", applicationIds),
      ]);
      return {
        events: events.data ?? [],
        interviews: interviews.data ?? [],
        offers: offers.data ?? [],
      };
    },
  });
}

/** Deterministic match engine: weighted overlap between required and held skills. */
export function matchScore(required: { importance: number; skillId: string }[], held: Set<string>) {
  if (required.length === 0) return null;
  const total = required.reduce((sum, r) => sum + r.importance, 0);
  const got = required.reduce((sum, r) => (held.has(r.skillId) ? sum + r.importance : sum), 0);
  return Math.round((got / total) * 100);
}

export function skillGap(
  required: { importance: number; skillId: string; name: string }[],
  held: Set<string>,
) {
  return required.filter((r) => !held.has(r.skillId)).sort((a, b) => b.importance - a.importance);
}
