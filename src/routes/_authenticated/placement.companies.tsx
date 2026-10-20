import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Mail } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMPUS_DRIVES, DRIVE_STATUS_LABEL, type CampusDrive } from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/companies")({
  head: () => ({
    meta: [
      { title: "Company visits — Career Connect" },
      {
        name: "description",
        content:
          "Campus visit calendar with hiring teams, open roles, expected packages and required skills.",
      },
      { property: "og:title", content: "Company visits — Career Connect" },
      {
        property: "og:description",
        content: "Coordinate employer visits and share role expectations with students.",
      },
    ],
  }),
  component: CompanyVisits,
});

function monthLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function CompanyVisits() {
  const sorted = [...CAMPUS_DRIVES].sort((a, b) => a.date.localeCompare(b.date));
  const [selected, setSelected] = useState<CampusDrive>(sorted[0]!);

  const months = sorted.reduce<Record<string, CampusDrive[]>>((acc, d) => {
    const key = monthLabel(d.date);
    (acc[key] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employers"
        title="Company visits"
        description="Visit calendar, hiring contacts and role expectations for every recruiting partner."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          {Object.entries(months).map(([month, items]) => (
            <section key={month}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {month}
              </h2>
              <div className="mt-2 space-y-2">
                {items.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors",
                      selected.id === d.id ? "border-primary bg-primary/5" : "hover:bg-muted",
                    )}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-center">
                      <span className="font-display text-sm font-semibold leading-none">
                        {new Date(d.date).getDate()}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {new Date(d.date).toLocaleDateString(undefined, { month: "short" })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.company}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {d.mode} · {d.venue}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <article className="surface-card space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">{selected.company}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" /> {selected.date} · {selected.venue}
              </p>
            </div>
            <Badge variant={selected.status === "completed" ? "secondary" : "default"}>
              {DRIVE_STATUS_LABEL[selected.status]}
            </Badge>
          </div>

          <section>
            <h3 className="text-sm font-semibold">Hiring team</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {selected.hiringTeam.map((m) => (
                <div key={m.email} className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.title}</p>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                    <a href={`mailto:${m.email}`}>
                      <Mail className="size-3" /> {m.email}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Available roles &amp; expected packages</h3>
            <div className="mt-2 space-y-2">
              {selected.roles.map((r) => (
                <div
                  key={r.title}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.location} · {r.type}
                    </p>
                  </div>
                  <p className="tabular-nums font-medium">{r.packageLpa} LPA</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Required skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.skills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
