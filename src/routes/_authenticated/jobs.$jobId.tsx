import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, Building2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auditDomainEvent } from "@/lib/audit-client";
import {
  formatSalary,
  matchScore,
  skillGap,
  useJob,
  useMyApplications,
  useMyResumes,
  useMyStudent,
  useMyStudentSkills,
  useSavedJobs,
  STATUS_LABEL,
} from "@/lib/career";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job details — Career Connect" },
      {
        name: "description",
        content: "Role requirements, salary, match score and one-click apply.",
      },
      { property: "og:title", content: "Job details — Career Connect" },
      { property: "og:description", content: "Apply with your analyzed resume in one click." },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: job, isLoading } = useJob(jobId);
  const { data: student } = useMyStudent();
  const { data: skills = [] } = useMyStudentSkills(student?.id);
  const { data: saved = [] } = useSavedJobs(student?.id);
  const { data: applications = [] } = useMyApplications(student?.id);
  const { data: resumes = [] } = useMyResumes(student?.id);

  const held = new Set(skills.map((s) => s.skill_id));
  const isSaved = saved.some((s) => s.job_id === jobId);
  const existing = applications.find((a) => a.job_id === jobId);

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("Profile not ready");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("student_id", student.id)
          .eq("job_id", jobId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ student_id: student.id, job_id: jobId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("Profile not ready");
      const primary = resumes.find((r) => r.is_primary) ?? resumes[0];
      const { data, error } = await supabase
        .from("applications")
        .insert({
          student_id: student.id,
          job_id: jobId,
          resume_id: primary?.id ?? null,
          cover_note: note.trim() || null,
          status: "applied",
          match_score: score,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("application_events").insert({
        application_id: data.id,
        to_status: "applied",
        note: "Application submitted",
      });
      await auditDomainEvent({
        action: "application.created",
        entityType: "application",
        entityId: data.id,
        metadata: { job_id: jobId, match_score: score },
      });
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted");
      navigate({ to: "/applications" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading role…</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found.</p>;

  const required = (job.job_skills ?? []).map((js) => ({
    importance: js.importance,
    skillId: js.skills?.id ?? "",
    name: js.skills?.name ?? "",
  }));
  const score = matchScore(required, held) ?? 0;
  const gaps = skillGap(required, held);

  return (
    <div className="space-y-8">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Job board
      </Link>

      <PageHeader
        eyebrow={job.companies?.name ?? "Open role"}
        title={job.title}
        description={job.description ?? ""}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toggleSave.mutate()}>
              {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {isSaved ? "Saved" : "Save"}
            </Button>
            {existing ? (
              <Badge variant="outline">{STATUS_LABEL[existing.status] ?? existing.status}</Badge>
            ) : (
              <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
                <Send className="size-4" /> Apply now
              </Button>
            )}
          </div>
        }
      />

      <div className="surface-card flex flex-wrap gap-6 p-5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Building2 className="size-4" /> {job.companies?.industry ?? "—"}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-4" /> {job.location} · {job.work_mode}
        </span>
        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
        <span>Experience: {job.experience_level}</span>
      </div>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Your match</h2>
          <span className="text-sm text-muted-foreground">{score}%</span>
        </div>
        <Progress value={score} className="mt-3" />
        <div className="mt-4 flex flex-wrap gap-2">
          {required.map((r) => (
            <Badge key={r.skillId} variant={held.has(r.skillId) ? "default" : "secondary"}>
              {r.name}
              {held.has(r.skillId) ? " ✓" : ""}
            </Badge>
          ))}
        </div>
        {gaps.length ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Close these first:{" "}
            {gaps
              .slice(0, 3)
              .map((g) => g.name)
              .join(", ")}
            .
          </p>
        ) : null}
      </section>

      {!existing ? (
        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Cover note (optional)</h2>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={4}
            className="mt-3"
            placeholder="Why you're a strong fit for this role…"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {resumes.length
              ? `Applying with: ${(resumes.find((r) => r.is_primary) ?? resumes[0])?.title}`
              : "No resume on file — upload one to strengthen your application."}
          </p>
          <Button className="mt-4" onClick={() => apply.mutate()} disabled={apply.isPending}>
            <Send className="size-4" /> Submit application
          </Button>
        </section>
      ) : null}
    </div>
  );
}
