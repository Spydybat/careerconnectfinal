import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Briefcase, CalendarClock, CheckCircle2, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecruiterOnboarding } from "@/components/recruiter-onboarding";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/career";
import {
  useCompanyApplications,
  useCompanyJobs,
  useCompanyPipeline,
  useMyRecruiter,
} from "@/lib/recruiter";

export const Route = createFileRoute("/_authenticated/recruiter/")({
  head: () => ({
    meta: [
      { title: "Recruiter overview — Career Connect" },
      {
        name: "description",
        content: "Hiring KPIs, recent applications, upcoming interviews and pipeline health.",
      },
      { property: "og:title", content: "Recruiter overview — Career Connect" },
      {
        property: "og:description",
        content: "Track your hiring pipeline across every open role.",
      },
    ],
  }),
  component: RecruiterOverview,
});

function RecruiterOverview() {
  const { data: recruiter, isLoading } = useMyRecruiter();
  const companyId = recruiter?.company_id ?? null;
  const { data: jobs = [] } = useCompanyJobs(companyId);
  const { data: applications = [] } = useCompanyApplications(companyId);
  const { data: pipeline } = useCompanyPipeline(applications.map((a) => a.id));

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading workspace…</p>;
  if (!recruiter || !companyId) return <RecruiterOnboarding />;

  const interviews = pipeline?.interviews ?? [];
  const upcoming = interviews
    .filter((i) => i.scheduled_at && new Date(i.scheduled_at) >= new Date())
    .slice(0, 6);
  const events = (pipeline?.events ?? []).slice(0, 10);
  const stages = STATUS_FLOW.filter((s) => s !== "rejected");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={recruiter.companies?.name ?? "Recruiter workspace"}
        title="Hiring overview"
        description="Pipeline health across every role your company has posted."
        actions={
          <Button asChild>
            <Link to="/recruiter/jobs">Post a job</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open roles"
          value={jobs.filter((j) => j.status === "open").length}
          hint={`${jobs.length} total`}
          icon={Briefcase}
        />
        <KpiCard label="Applications" value={applications.length} icon={Users} tone="accent" />
        <KpiCard label="Interviews" value={interviews.length} icon={CalendarClock} />
        <KpiCard
          label="Hired"
          value={applications.filter((a) => a.status === "hired").length}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-semibold">Hiring pipeline</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stages.map((stage) => {
            const count = applications.filter((a) => a.status === stage).length;
            return (
              <div key={stage} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{STATUS_LABEL[stage]}</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{count}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent applications</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/recruiter/candidates">View all</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {applications.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {a.profile?.full_name || "Candidate"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.jobs?.title} · {new Date(a.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[a.status] ?? a.status}</Badge>
              </div>
            ))}
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Upcoming interviews</h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((i) => {
              const app = applications.find((a) => a.id === i.application_id);
              return (
                <div key={i.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {app?.profile?.full_name || "Candidate"} · {i.round_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.mode} ·{" "}
                      {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "TBD"}
                    </p>
                  </div>
                  <Badge variant="outline">{i.status}</Badge>
                </div>
              );
            })}
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Activity className="size-4 text-primary" /> Activity feed
        </h2>
        <ol className="mt-4 space-y-3 border-l border-border pl-4">
          {events.map((e) => {
            const app = applications.find((a) => a.id === e.application_id);
            return (
              <li key={e.id} className="text-sm">
                <span className="font-medium">{app?.profile?.full_name || "Candidate"}</span>{" "}
                <span className="text-muted-foreground">
                  → {STATUS_LABEL[e.to_status] ?? e.to_status} ·{" "}
                  {new Date(e.created_at).toLocaleString()}
                </span>
                {e.note ? <p className="text-xs text-muted-foreground">{e.note}</p> : null}
              </li>
            );
          })}
          {events.length === 0 ? (
            <li className="text-sm text-muted-foreground">No activity yet.</li>
          ) : null}
        </ol>
      </section>
    </div>
  );
}
