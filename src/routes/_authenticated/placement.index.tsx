import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, GraduationCap, Percent, TrendingUp, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CAMPUS_DRIVES, DRIVE_STATUS_LABEL, formatLpa, usePlacementData } from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/")({
  head: () => ({
    meta: [
      { title: "Placement dashboard — Career Connect" },
      {
        name: "description",
        content:
          "Placement rate, eligible and placed students, package benchmarks and live campus drives.",
      },
      { property: "og:title", content: "Placement dashboard — Career Connect" },
      {
        property: "og:description",
        content: "Track placement outcomes across your cohort in one workspace.",
      },
    ],
  }),
  component: PlacementDashboard,
});

function PlacementDashboard() {
  const { data, isLoading } = usePlacementData();

  const students = data?.students ?? [];
  const records = data?.records ?? [];
  const eligible = students.filter((s) => s.eligible);
  const placed = students.filter((s) => s.placed);
  const rate = eligible.length ? Math.round((placed.length / eligible.length) * 100) : 0;
  const packages = records.map((r) => r.ctc).filter((c): c is number => !!c);
  const avg = packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;
  const highest = packages.length ? Math.max(...packages) : 0;
  const activeDrives = CAMPUS_DRIVES.filter((d) => d.status !== "completed");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Placement cell"
        title="Placement dashboard"
        description="Cohort readiness, offer outcomes and campus drive activity at a glance."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Eligible students"
            value={eligible.length}
            hint={`${students.length} registered in cohort`}
            icon={Users}
          />
          <KpiCard
            label="Placed students"
            value={placed.length}
            hint={`${records.length} placement records`}
            icon={GraduationCap}
            tone="success"
          />
          <KpiCard
            label="Placement rate"
            value={`${rate}%`}
            hint="Placed / eligible"
            icon={Percent}
          />
          <KpiCard label="Average package" value={formatLpa(avg)} icon={TrendingUp} tone="accent" />
          <KpiCard
            label="Highest package"
            value={formatLpa(highest)}
            icon={Trophy}
            tone="success"
          />
          <KpiCard
            label="Active campus drives"
            value={activeDrives.length}
            hint={`${CAMPUS_DRIVES.length} drives this year`}
            icon={Building2}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent placement activity</h2>
            <Link to="/placement/records" className="text-sm font-medium text-primary">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No placements recorded yet. Records appear here once offers are confirmed.
              </p>
            ) : (
              records.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.roleTitle} · {r.company ?? "Company"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums font-medium">{formatLpa(r.ctc)}</p>
                    <p className="text-xs text-muted-foreground">{r.placementDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Campus drives</h2>
            <Link to="/placement/drives" className="text-sm font-medium text-primary">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {CAMPUS_DRIVES.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.date} · {d.registered}/{d.seats} registered
                  </p>
                </div>
                <Badge variant={d.status === "completed" ? "secondary" : "default"}>
                  {DRIVE_STATUS_LABEL[d.status]}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
