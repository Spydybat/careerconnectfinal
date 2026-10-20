import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { analyseSkillGap, listSkillGapReports } from "@/lib/ai-skill-gap.functions";
import { PageHeader } from "@/components/page-header";
import { ScoreDial } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/ai/skill-gap")({
  head: () => ({
    meta: [
      { title: "AI Skill Gap — Career Connect" },
      {
        name: "description",
        content:
          "See how ready you are for your target career and get a sequenced plan to close every skill gap.",
      },
      { property: "og:title", content: "AI Skill Gap — Career Connect" },
      {
        property: "og:description",
        content: "Readiness scoring and a sequenced learning plan for your target career.",
      },
    ],
  }),
  component: SkillGapPage,
});

type Gap = { skill: string; importance: number; currentLevel: number; why: string };
type PlanStep = {
  step: number;
  title: string;
  focus: string;
  durationWeeks: number;
  outcome: string;
};

function SkillGapPage() {
  const queryClient = useQueryClient();
  const run = useServerFn(analyseSkillGap);
  const list = useServerFn(listSkillGapReports);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["ai", "skill-gap"],
    queryFn: () => list({ data: undefined }),
  });

  const analyse = useMutation({
    mutationFn: () => run({ data: { careerId: null } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "skill-gap"] });
      toast.success("Skill gap analysis updated.");
    },
    onError: (error: Error) => toast.error(error.message || "The analysis could not run."),
  });

  const latest = reports[0];
  const gaps = (latest?.gaps as Gap[] | null) ?? [];
  const plan = (latest?.plan as PlanStep[] | null) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI intelligence"
        title="Skill gap & learning plan"
        description="Readiness is calculated from your recorded skills against your target career's requirements."
        actions={
          <Button onClick={() => analyse.mutate()} disabled={analyse.isPending}>
            {analyse.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Target className="size-4" />
            )}
            Run analysis
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your reports…</p>
      ) : !latest ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No analysis yet. Set a target career on your profile, then run the analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start gap-6 rounded-xl border border-border bg-card p-6">
            <ScoreDial value={latest.readiness_score ?? 0} label="Readiness" />
            <div className="flex-1 space-y-2">
              <Badge variant="secondary">{latest.career_title}</Badge>
              <p className="text-sm leading-relaxed">{latest.summary}</p>
            </div>
          </div>

          {gaps.length ? (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Gaps to close</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {gaps.map((gap) => (
                  <div key={gap.skill} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{gap.skill}</p>
                      <Badge variant="outline">
                        {gap.currentLevel}/5 · importance {gap.importance}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{gap.why}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {plan.length ? (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Your learning plan</h2>
              <ol className="space-y-3">
                {plan.map((step) => (
                  <li key={step.step} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {step.step}
                      </span>
                      <p className="font-medium">{step.title}</p>
                      <Badge variant="secondary">{step.durationWeeks} weeks</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{step.focus}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Outcome: </span>
                      {step.outcome}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
