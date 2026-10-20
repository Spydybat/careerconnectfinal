import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Percent, Send, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { RecruiterOnboarding } from "@/components/recruiter-onboarding";
import { STATUS_LABEL } from "@/lib/career";
import {
  useCompanyApplications,
  useCompanyJobs,
  useCompanyPipeline,
  useMyRecruiter,
} from "@/lib/recruiter";

export const Route = createFileRoute("/_authenticated/recruiter/analytics")({
  head: () => ({
    meta: [
      { title: "Recruiter analytics — Career Connect" },
      {
        name: "description",
        content: "Hiring funnel, interview conversion and role-level application analytics.",
      },
      { property: "og:title", content: "Recruiter analytics — Career Connect" },
      { property: "og:description", content: "Measure how your hiring funnel is performing." },
    ],
  }),
  component: RecruiterAnalytics,
});

const FUNNEL = ["applied", "shortlisted", "interview", "offered", "hired"] as const;

function RecruiterAnalytics() {
  const { data: recruiter, isLoading } = useMyRecruiter();
  const companyId = recruiter?.company_id ?? null;
  const { data: jobs = [] } = useCompanyJobs(companyId);
  const { data: applications = [] } = useCompanyApplications(companyId);
  const { data: pipeline } = useCompanyPipeline(applications.map((a) => a.id));

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!recruiter || !companyId) return <RecruiterOnboarding />;

  const events = pipeline?.events ?? [];
  const reached = (stage: string) =>
    new Set(
      applications
        .filter(
          (a) =>
            a.status === stage ||
            events.some((e) => e.application_id === a.id && e.to_status === stage),
        )
        .map((a) => a.id),
    ).size;

  const total = applications.length;
  const interviewed = reached("interview");
  const hired = reached("hired");
  const conversion = total ? Math.round((interviewed / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Hiring performance"
        description="Funnel conversion and role-level demand for your company."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open jobs"
          value={jobs.filter((j) => j.status === "open").length}
          icon={Briefcase}
        />
        <KpiCard label="Applications" value={total} icon={Send} tone="accent" />
        <KpiCard
          label="Interview conversion"
          value={`${conversion}%`}
          hint={`${interviewed} interviewed`}
          icon={Percent}
        />
        <KpiCard
          label="Hires"
          value={hired}
          hint={total ? `${Math.round((hired / total) * 100)}% of applicants` : undefined}
          icon={Trophy}
          tone="success"
        />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-semibold">Hiring funnel</h2>
        <div className="mt-4 space-y-3">
          {FUNNEL.map((stage) => {
            const count = reached(stage);
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={stage}>
                <div className="flex items-center justify-between text-sm">
                  <span>{STATUS_LABEL[stage] ?? stage}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-semibold">Applications by role</h2>
        <div className="mt-4 space-y-3">
          {jobs.map((job) => {
            const apps = applications.filter((a) => a.job_id === job.id);
            const jobHired = apps.filter((a) => a.status === "hired").length;
            return (
              <div key={job.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{job.title}</span>
                <span className="tabular-nums text-muted-foreground">
                  {apps.length} applicants · {jobHired} hired
                </span>
              </div>
            );
          })}
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles posted yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
