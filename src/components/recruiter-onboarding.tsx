import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RecruiterOnboarding() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, industry")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const join = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from("recruiters")
        .insert({ user_id: user!.id, company_id: companyId, job_title: jobTitle || "Recruiter" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recruiter"] });
      toast.success("Workspace ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .insert({ name: name.trim(), slug: slugify(name), industry: industry || null })
        .select("id")
        .single();
      if (error) throw error;
      const linked = await supabase
        .from("recruiters")
        .insert({ user_id: user!.id, company_id: data.id, job_title: jobTitle || "Recruiter" });
      if (linked.error) throw linked.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recruiter"] });
      queryClient.invalidateQueries({ queryKey: ["all-companies"] });
      toast.success("Company created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Recruiter setup"
        title="Set up your hiring workspace"
        description="Link your account to a company to post jobs and manage candidates."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Create a company</h2>
          <div className="space-y-2">
            <Label htmlFor="cname">Company name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cind">Industry</Label>
            <Input id="cind" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctitle">Your title</Label>
            <Input
              id="ctitle"
              value={jobTitle}
              placeholder="Talent Acquisition Lead"
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="w-full"
          >
            Create and continue
          </Button>
        </section>

        <section className="surface-card space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Join an existing company</h2>
          <p className="text-sm text-muted-foreground">Pick the organisation you hire for.</p>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.industry ?? "—"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => join.mutate(company.id)}
                  disabled={join.isPending}
                >
                  Join
                </Button>
              </div>
            ))}
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No companies yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
