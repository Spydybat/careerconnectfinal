import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auditDomainEvent } from "@/lib/audit-client";
import { useSession } from "@/lib/session";
import { useSkills, formatSalary } from "@/lib/career";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
  JOB_STATUS_LABEL,
  WORK_MODES,
  titleCase,
  useCompanyApplications,
  useCompanyJobs,
  useMyRecruiter,
} from "@/lib/recruiter";
import { PageHeader } from "@/components/page-header";
import { RecruiterOnboarding } from "@/components/recruiter-onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/recruiter/jobs")({
  head: () => ({
    meta: [
      { title: "Job management — Career Connect" },
      {
        name: "description",
        content: "Create, publish, edit and archive job postings for your company.",
      },
      { property: "og:title", content: "Job management — Career Connect" },
      { property: "og:description", content: "Manage every role your company is hiring for." },
    ],
  }),
  component: RecruiterJobs,
});

type FormState = {
  id?: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  experience_level: string;
  work_mode: string;
  salary_min: string;
  salary_max: string;
  openings: string;
  status: string;
  closes_at: string;
  skillIds: string[];
};

const EMPTY: FormState = {
  title: "",
  description: "",
  location: "",
  employment_type: "full_time",
  experience_level: "fresher",
  work_mode: "onsite",
  salary_min: "",
  salary_max: "",
  openings: "1",
  status: "draft",
  closes_at: "",
  skillIds: [],
};

function RecruiterJobs() {
  const { user } = useSession();
  const { data: recruiter, isLoading } = useMyRecruiter();
  const companyId = recruiter?.company_id ?? null;
  const { data: jobs = [] } = useCompanyJobs(companyId);
  const { data: applications = [] } = useCompanyApplications(companyId);
  const { data: skills = [] } = useSkills();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [skillQuery, setSkillQuery] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId!,
        posted_by: user!.id,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location || null,
        employment_type: form.employment_type,
        experience_level: form.experience_level,
        work_mode: form.work_mode,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        openings: Number(form.openings || 1),
        status: form.status,
        closes_at: form.closes_at || null,
      };
      let jobId = form.id;
      const isNew = !jobId;
      if (jobId) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
        if (error) throw error;
        jobId = data.id;
      }
      await supabase.from("job_skills").delete().eq("job_id", jobId!);
      if (form.skillIds.length) {
        const { error } = await supabase
          .from("job_skills")
          .insert(form.skillIds.map((id) => ({ job_id: jobId!, skill_id: id, importance: 3 })));
        if (error) throw error;
      }
      await auditDomainEvent({
        action: isNew ? "job.created" : "job.updated",
        entityType: "job",
        entityId: jobId!,
        metadata: { status: payload.status, openings: payload.openings },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      setForm(EMPTY);
      toast.success("Job saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
      if (error) throw error;
      await auditDomainEvent({
        action: status === "closed" || status === "archived" ? "job.closed" : "job.updated",
        entityType: "job",
        entityId: id,
        metadata: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Audited before deletion: afterwards the row is no longer visible for
      // the server-side ownership check.
      await auditDomainEvent({
        action: "job.closed",
        entityType: "job",
        entityId: id,
        metadata: { deleted: true },
      });
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
      toast.success("Job deleted");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("foreign key")
          ? "This job has applications — archive it instead."
          : e.message,
      ),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!recruiter || !companyId) return <RecruiterOnboarding />;

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillQuery.toLowerCase()),
  );

  function editJob(job: (typeof jobs)[number]) {
    setForm({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location ?? "",
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      work_mode: job.work_mode,
      salary_min: job.salary_min ? String(job.salary_min) : "",
      salary_max: job.salary_max ? String(job.salary_max) : "",
      openings: String(job.openings ?? 1),
      status: job.status,
      closes_at: job.closes_at ?? "",
      skillIds: (job.job_skills ?? []).map((js) => js.skill_id),
    });
    setOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={recruiter.companies?.name ?? "Company"}
        title="Job management"
        description="Create roles, publish them to students, and archive when hiring closes."
        actions={
          <Button
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New job
          </Button>
        }
      />

      <div className="space-y-3">
        {jobs.map((job) => {
          const count = applications.filter((a) => a.job_id === job.id).length;
          return (
            <article key={job.id} className="surface-card flex flex-wrap gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{job.title}</h2>
                  <Badge variant={job.status === "open" ? "default" : "secondary"}>
                    {JOB_STATUS_LABEL[job.status] ?? job.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {titleCase(job.work_mode)} · {titleCase(job.employment_type)} ·{" "}
                  {titleCase(job.experience_level)} · {job.location || "Anywhere"} ·{" "}
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(job.job_skills ?? []).map((js) => (
                    <Badge key={js.skill_id} variant="outline">
                      {js.skills?.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-2 sm:w-48">
                <p className="text-sm text-muted-foreground">
                  <span className="font-display text-xl font-semibold text-foreground">
                    {count}
                  </span>{" "}
                  applicants
                </p>
                <Select
                  value={job.status}
                  onValueChange={(status) => setStatus.mutate({ id: job.id, status })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {JOB_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editJob(job)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate(job.id)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles yet — create your first job.</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit job" : "Create job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Input
                  id="loc"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openings">Openings</Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  value={form.openings}
                  onChange={(e) => setForm({ ...form, openings: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employment type</Label>
                <Select
                  value={form.employment_type}
                  onValueChange={(v) => setForm({ ...form, employment_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {titleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience level</Label>
                <Select
                  value={form.experience_level}
                  onValueChange={(v) => setForm({ ...form, experience_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {titleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work mode</Label>
                <Select
                  value={form.work_mode}
                  onValueChange={(v) => setForm({ ...form, work_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {titleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {JOB_STATUS_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smin">Salary min (₹)</Label>
                <Input
                  id="smin"
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smax">Salary max (₹)</Label>
                <Input
                  id="smax"
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closes">Closes on</Label>
                <Input
                  id="closes"
                  type="date"
                  value={form.closes_at}
                  onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsearch">Required skills</Label>
              <Input
                id="skillsearch"
                placeholder="Search skills"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
                {filteredSkills.map((s) => {
                  const checked = form.skillIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setForm({
                            ...form,
                            skillIds: v
                              ? [...form.skillIds, s.id]
                              : form.skillIds.filter((id) => id !== s.id),
                          })
                        }
                      />
                      {s.name}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={!form.title.trim() || !form.description.trim() || save.isPending}
            >
              Save job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
