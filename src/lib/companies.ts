import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, jobs(id, status)")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        openJobs: (c.jobs ?? []).filter((j) => j.status === "open").length,
      }));
    },
  });
}

export function useCompanyBySlug(slug?: string) {
  return useQuery({
    queryKey: ["company", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCompanyOpenJobs(companyId?: string | null) {
  return useQuery({
    queryKey: ["company-open-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, job_skills(importance, skill_id, skills(id, name, slug))")
        .eq("company_id", companyId!)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
