import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyTeam, useMyRecruiter } from "@/lib/recruiter";
import { PageHeader } from "@/components/page-header";
import { RecruiterOnboarding } from "@/components/recruiter-onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/recruiter/company")({
  head: () => ({
    meta: [
      { title: "Company profile — Career Connect" },
      {
        name: "description",
        content: "Maintain your employer brand: logo, industry, locations and hiring team.",
      },
      { property: "og:title", content: "Company profile — Career Connect" },
      { property: "og:description", content: "Keep your employer profile current for students." },
    ],
  }),
  component: CompanyProfile,
});

function CompanyProfile() {
  const { data: recruiter, isLoading } = useMyRecruiter();
  const company = recruiter?.companies ?? null;
  const { data: team = [] } = useCompanyTeam(recruiter?.company_id ?? null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    logo_url: "",
    headquarters: "",
    description: "",
  });

  useEffect(() => {
    if (!company) return;
    setForm({
      name: company.name ?? "",
      industry: company.industry ?? "",
      website: company.website ?? "",
      logo_url: company.logo_url ?? "",
      headquarters: company.headquarters ?? "",
      description: company.description ?? "",
    });
  }, [company]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          industry: form.industry || null,
          website: form.website || null,
          logo_url: form.logo_url || null,
          headquarters: form.headquarters || null,
          description: form.description || null,
        })
        .eq("id", company!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recruiter"] });
      toast.success("Company profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!recruiter || !company) return <RecruiterOnboarding />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Employer brand"
        title="Company profile"
        description="This is what students see when they open one of your roles."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card space-y-4 p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hq">Headquarters</Label>
              <Input
                id="hq"
                value={form.headquarters}
                onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="web">Website</Label>
              <Input
                id="web"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </section>

        <section className="surface-card space-y-4 p-5">
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={`${form.name} logo`}
                className="size-12 rounded-lg object-contain"
              />
            ) : (
              <span className="grid size-12 place-items-center rounded-lg bg-primary/10 font-display text-lg font-semibold text-primary">
                {form.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{form.name || "Company"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {form.industry || "Industry"} · {form.headquarters || "Location"}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Hiring team
            </h2>
            <ul className="mt-3 space-y-3">
              {team.map((member) => (
                <li key={member.id} className="text-sm">
                  <p className="font-medium">{member.profile?.full_name || "Recruiter"}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.job_title || "Recruiter"}
                    {member.profile?.email ? ` · ${member.profile.email}` : ""}
                  </p>
                </li>
              ))}
              {team.length === 0 ? (
                <li className="text-sm text-muted-foreground">No teammates yet.</li>
              ) : null}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
