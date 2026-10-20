import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, IndianRupee, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatSalary,
  matchScore,
  skillGap,
  useCareerBySlug,
  useJobs,
  useMyStudent,
  useMyStudentSkills,
} from "@/lib/career";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/careers/$slug")({
  head: () => ({
    meta: [
      { title: "Career details — Career Connect" },
      {
        name: "description",
        content: "Required skills, salary insights, market demand and your learning path.",
      },
      { property: "og:title", content: "Career details — Career Connect" },
      { property: "og:description", content: "Skill gap and learning path for this career." },
    ],
  }),
  component: CareerDetail,
});

function CareerDetail() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: career, isLoading } = useCareerBySlug(slug);
  const { data: student } = useMyStudent();
  const { data: skills = [] } = useMyStudentSkills(student?.id);
  const { data: jobs = [] } = useJobs();

  const held = new Set(skills.map((s) => s.skill_id));

  const setTarget = useMutation({
    mutationFn: async () => {
      if (!student || !career) return;
      const { error } = await supabase
        .from("students")
        .update({ target_career_id: career.id })
        .eq("id", student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-student"] });
      toast.success("Target career updated");
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading career…</p>;
  if (!career) return <p className="text-sm text-muted-foreground">Career not found.</p>;

  const required = (career.career_skills ?? []).map((cs) => ({
    importance: cs.importance,
    skillId: cs.skills?.id ?? "",
    name: cs.skills?.name ?? "",
  }));
  const score = matchScore(required, held) ?? 0;
  const gaps = skillGap(required, held);
  const learning = Array.isArray(career.learning_path)
    ? (career.learning_path as { step?: string; focus?: string }[])
    : [];
  const relatedJobs = jobs.filter((j) =>
    (j.job_skills ?? []).some((js) => required.some((r) => r.skillId === js.skills?.id)),
  );

  return (
    <div className="space-y-8">
      <Link
        to="/careers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Career explorer
      </Link>

      <PageHeader
        eyebrow="Career path"
        title={career.title}
        description={career.description ?? career.summary}
        actions={
          <Button
            onClick={() => setTarget.mutate()}
            disabled={setTarget.isPending || student?.target_career_id === career.id}
          >
            <Target className="size-4" />
            {student?.target_career_id === career.id ? "Target career" : "Set as target"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Career match score" value={`${score}%`} icon={Target} />
        <KpiCard
          label="Salary range"
          value={formatSalary(career.avg_salary_min, career.avg_salary_max)}
          icon={IndianRupee}
          tone="accent"
        />
        <KpiCard label="Market demand" value={`${career.demand_score}/100`} icon={TrendingUp} />
        <KpiCard label="Skills to learn" value={gaps.length} icon={GraduationCap} tone="success" />
      </div>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Required skills</h2>
          <span className="text-sm text-muted-foreground">{score}% covered</span>
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
      </section>

      <section className="surface-card p-5">
        <h2 className="font-display text-base font-semibold">Learning path</h2>
        <ol className="mt-4 space-y-3">
          {(learning.length
            ? learning.map((l, i) => ({
                title: l.step ?? `Step ${i + 1}`,
                detail: l.focus ?? "",
              }))
            : gaps.map((g, i) => ({
                title: `Step ${i + 1}: Learn ${g.name}`,
                detail: `Weight ${g.importance}/5 for this role — build one project that uses it.`,
              }))
          ).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                {step.detail ? (
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                ) : null}
              </div>
            </li>
          ))}
          {learning.length === 0 && gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You already cover every skill for this role — start applying.
            </p>
          ) : null}
        </ol>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Open roles on this path</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {relatedJobs.slice(0, 6).map((job) => (
            <Link
              key={job.id}
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="surface-card block p-5"
            >
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-muted-foreground">
                {job.companies?.name} · {job.location}
              </p>
            </Link>
          ))}
          {relatedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open roles for this path yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
