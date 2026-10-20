import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, TrendingUp } from "lucide-react";
import {
  formatSalary,
  matchScore,
  useCareers,
  useMyStudent,
  useMyStudentSkills,
} from "@/lib/career";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/careers/")({
  head: () => ({
    meta: [
      { title: "Career explorer — Career Connect" },
      {
        name: "description",
        content: "Explore career paths ranked by how well they match your current skills.",
      },
      { property: "og:title", content: "Career explorer — Career Connect" },
      { property: "og:description", content: "Career match scores, salaries and market demand." },
    ],
  }),
  component: CareerExplorer,
});

function CareerExplorer() {
  const [q, setQ] = useState("");
  const { data: careers = [] } = useCareers();
  const { data: student } = useMyStudent();
  const { data: skills = [] } = useMyStudentSkills(student?.id);
  const held = new Set(skills.map((s) => s.skill_id));

  const ranked = careers
    .map((career) => ({
      career,
      score:
        matchScore(
          (career.career_skills ?? []).map((cs) => ({
            importance: cs.importance,
            skillId: cs.skills?.id ?? "",
          })),
          held,
        ) ?? 0,
    }))
    .filter(({ career }) =>
      `${career.title} ${career.summary}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Career module"
        title="Career explorer"
        description="Ranked by overlap between the skills on your profile and each role's requirements."
      />

      {top.length ? (
        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Recommended for you</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {top.map(({ career, score }) => (
              <Link
                key={career.id}
                to="/careers/$slug"
                params={{ slug: career.slug }}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium"
              >
                {career.title} · {score}% match
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search careers…"
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ranked.map(({ career, score }) => (
          <Link
            key={career.id}
            to="/careers/$slug"
            params={{ slug: career.slug }}
            className="surface-card block p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{career.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{career.summary}</p>
              </div>
              <Badge variant={score >= 60 ? "default" : "secondary"}>{score}%</Badge>
            </div>
            <Progress value={score} className="mt-4" />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatSalary(career.avg_salary_min, career.avg_salary_max)}</span>
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="size-3" /> Demand {career.demand_score}/100
              </span>
            </div>
          </Link>
        ))}
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No careers match that search.</p>
        ) : null}
      </div>
    </div>
  );
}
