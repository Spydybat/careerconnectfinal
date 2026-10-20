import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CAMPUS_DRIVES,
  DRIVE_STATUS_LABEL,
  usePlacementData,
  type CampusDrive,
  type DriveStatus,
} from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/drives")({
  head: () => ({
    meta: [
      { title: "Campus drives — Career Connect" },
      {
        name: "description",
        content:
          "Upcoming, ongoing and completed campus drives with eligibility, registrations and participating companies.",
      },
      { property: "og:title", content: "Campus drives — Career Connect" },
      {
        property: "og:description",
        content: "Coordinate campus hiring drives and student registrations.",
      },
    ],
  }),
  component: CampusDrives,
});

const FILTERS: { value: DriveStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

function CampusDrives() {
  const [filter, setFilter] = useState<DriveStatus | "all">("all");
  const [active, setActive] = useState<CampusDrive | null>(null);
  const { data } = usePlacementData();
  const students = data?.students ?? [];

  const drives = CAMPUS_DRIVES.filter((d) => filter === "all" || d.status === filter);

  function eligibleFor(drive: CampusDrive) {
    return students.filter(
      (s) =>
        (!s.branch || drive.eligibility.branches.includes(s.branch)) &&
        (s.cgpa === null || s.cgpa >= drive.eligibility.minCgpa),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Drives"
        title="Campus drives"
        description="Plan drives, track registrations and review eligibility in one place."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as DriveStatus | "all")}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {drives.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="font-medium">No drives in this stage</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch the filter to see drives at other stages.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {drives.map((d) => (
            <article key={d.id} className="surface-card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold">{d.title}</h2>
                  <p className="text-sm text-muted-foreground">{d.company}</p>
                </div>
                <Badge variant={d.status === "completed" ? "secondary" : "default"}>
                  {DRIVE_STATUS_LABEL[d.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {d.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {d.venue} · {d.mode}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {eligibleFor(d).length} eligible
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Registrations</span>
                  <span className="tabular-nums">
                    {d.registered}/{d.seats}
                  </span>
                </div>
                <Progress value={(d.registered / d.seats) * 100} className="mt-1.5 h-2" />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setActive(d)}
              >
                View drive
              </Button>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>
                  {active.company} · {active.date} · {active.mode}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <section>
                  <h3 className="font-medium">Eligibility</h3>
                  <p className="mt-1 text-muted-foreground">
                    Batch {active.eligibility.batch} · Minimum CGPA {active.eligibility.minCgpa} ·{" "}
                    {active.eligibility.branches.join(", ")}
                  </p>
                </section>

                <section>
                  <h3 className="font-medium">Eligible students ({eligibleFor(active).length})</h3>
                  <div className="mt-2 space-y-1">
                    {eligibleFor(active)
                      .slice(0, 8)
                      .map((s) => (
                        <div key={s.id} className="flex justify-between text-muted-foreground">
                          <span>{s.name}</span>
                          <span className="tabular-nums">
                            {s.branch ?? "—"} · CGPA {s.cgpa ?? "—"}
                          </span>
                        </div>
                      ))}
                    {eligibleFor(active).length === 0 ? (
                      <p className="text-muted-foreground">
                        No students in the cohort currently meet this criteria.
                      </p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium">Roles on offer</h3>
                  <div className="mt-2 space-y-2">
                    {active.roles.map((r) => (
                      <div key={r.title} className="flex justify-between rounded-lg bg-muted p-3">
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
                  <h3 className="font-medium">Required skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {active.skills.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium">Registration status</h3>
                  <p className="mt-1 text-muted-foreground">
                    {active.registered} of {active.seats} seats filled
                    {active.offersMade != null ? ` · ${active.offersMade} offers made` : ""}
                  </p>
                  <Progress value={(active.registered / active.seats) * 100} className="mt-2 h-2" />
                </section>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
