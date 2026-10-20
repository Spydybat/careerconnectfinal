import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export const JOB_STATUSES = ["draft", "open", "closed", "archived"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Published",
  closed: "Closed",
  archived: "Archived",
};

export const EMPLOYMENT_TYPES = ["full_time", "internship", "contract", "part_time"] as const;
export const EXPERIENCE_LEVELS = ["fresher", "junior", "mid", "senior"] as const;
export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;

export function titleCase(value?: string | null) {
  if (!value) return "—";
  return value
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function useMyRecruiter() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["my-recruiter", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruiters")
        .select("*, companies(*)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCompanyTeam(companyId?: string | null) {
  return useQuery({
    queryKey: ["company-team", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruiters")
        .select("id, user_id, job_title, created_at")
        .eq("company_id", companyId!);
      if (error) throw error;
      const ids = (data ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);
      return (data ?? []).map((r) => ({
        ...r,
        profile: (profiles ?? []).find((p) => p.id === r.user_id) ?? null,
      }));
    },
  });
}

export function useCompanyJobs(companyId?: string | null) {
  return useQuery({
    queryKey: ["company-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, job_skills(importance, skill_id, skills(id, name, slug))")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type CompanyApplication = Awaited<
  ReturnType<ReturnType<typeof useCompanyApplications>["refetch"]>
>["data"] extends (infer T)[] | undefined
  ? T
  : never;

export function useCompanyApplications(companyId?: string | null) {
  return useQuery({
    queryKey: ["company-applications", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "*, jobs!inner(id, title, company_id, location, employment_type), students(id, user_id, college, degree, branch, graduation_year, cgpa, about, open_to_work)",
        )
        .eq("jobs.company_id", companyId!)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const userIds = rows
        .map((r) => r.students?.user_id)
        .filter((v): v is string => typeof v === "string");
      const profiles = userIds.length
        ? ((
            await supabase
              .from("profiles")
              .select("id, full_name, email, phone, headline, location, avatar_url")
              .in("id", Array.from(new Set(userIds)))
          ).data ?? [])
        : [];
      return rows.map((r) => ({
        ...r,
        profile: profiles.find((p) => p.id === r.students?.user_id) ?? null,
      }));
    },
  });
}

export function useCompanyPipeline(applicationIds: string[]) {
  const key = applicationIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["company-pipeline", key],
    enabled: applicationIds.length > 0,
    queryFn: async () => {
      const [events, interviews, offers] = await Promise.all([
        supabase
          .from("application_events")
          .select("*")
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("interviews")
          .select("*")
          .in("application_id", applicationIds)
          .order("scheduled_at", { ascending: true }),
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

export function useCandidateDetail(studentId?: string | null) {
  return useQuery({
    queryKey: ["candidate-detail", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const [skills, resumes, education, projects] = await Promise.all([
        supabase
          .from("student_skills")
          .select("id, proficiency, source, skill_id, skills(id, name, slug)")
          .eq("student_id", studentId!),
        supabase
          .from("resumes")
          .select("*")
          .eq("student_id", studentId!)
          .order("created_at", { ascending: false }),
        supabase.from("education").select("*").eq("student_id", studentId!),
        supabase.from("projects").select("*").eq("student_id", studentId!),
      ]);
      return {
        skills: skills.data ?? [],
        resumes: resumes.data ?? [],
        education: education.data ?? [],
        projects: projects.data ?? [],
      };
    },
  });
}
