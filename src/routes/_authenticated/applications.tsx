import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auditDomainEvent } from "@/lib/audit-client";
import {
  formatSalary,
  useApplicationDetails,
  useMyApplications,
  useMyStudent,
  STATUS_FLOW,
  STATUS_LABEL,
} from "@/lib/career";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Career Connect" },
      {
        name: "description",
        content: "Track every application, its status timeline, interviews and offers.",
      },
      { property: "og:title", content: "Applications — Career Connect" },
      { property: "og:description", content: "Status timeline for all your job applications." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const [tab, setTab] = useState("active");
  const queryClient = useQueryClient();
  const { data: student } = useMyStudent();
  const { data: applications = [] } = useMyApplications(student?.id);
  const { data: details } = useApplicationDetails(applications.map((a) => a.id));

  const withdraw = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", id);
      if (error) throw error;
      await supabase
        .from("application_events")
        .insert({ application_id: id, to_status: "withdrawn", note: "Withdrawn by candidate" });
      await auditDomainEvent({
        action: "application.status_changed",
        entityType: "application",
        entityId: id,
        metadata: { to: "withdrawn", by: "candidate" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-details"] });
      toast.success("Application withdrawn");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closed = ["rejected", "withdrawn", "hired"];
  const visible = applications.filter((a) =>
    tab === "active" ? !closed.includes(a.status) : closed.includes(a.status),
  );

  const interviews = details?.interviews ?? [];
  const offers = details?.offers ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Applications module"
        title="Your applications"
        description="Every role you applied to, with its full status timeline."
        actions={
          <Button asChild variant="outline">
            <Link to="/jobs">Browse more jobs</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total applications" value={applications.length} icon={Send} />
        <KpiCard
          label="In progress"
          value={applications.filter((a) => !closed.includes(a.status)).length}
          icon={CalendarClock}
          tone="accent"
        />
        <KpiCard label="Interviews scheduled" value={interviews.length} icon={CalendarClock} />
        <KpiCard label="Offers" value={offers.length} icon={CheckCircle2} tone="success" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {visible.map((application) => {
          const events = (details?.events ?? []).filter((e) => e.application_id === application.id);
          const appInterviews = interviews.filter((i) => i.application_id === application.id);
          const appOffers = offers.filter((o) => o.application_id === application.id);
          const currentIndex = STATUS_FLOW.indexOf(
            application.status as (typeof STATUS_FLOW)[number],
          );

          return (
            <article key={application.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: application.job_id }}
                    className="font-medium hover:underline"
                  >
                    {application.jobs?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {application.jobs?.companies?.name} · applied{" "}
                    {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      application.status === "rejected" || application.status === "withdrawn"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {STATUS_LABEL[application.status] ?? application.status}
                  </Badge>
                  {!closed.includes(application.status) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => withdraw.mutate(application.id)}
                      disabled={withdraw.isPending}
                    >
                      <XCircle className="size-4" /> Withdraw
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {STATUS_FLOW.filter((s) => s !== "rejected").map((stage, i) => {
                  const reached = currentIndex >= i && application.status !== "rejected";
                  return (
                    <span
                      key={stage}
                      className={`rounded-full px-3 py-1 text-xs ${
                        reached
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABEL[stage]}
                    </span>
                  );
                })}
              </div>

              {events.length ? (
                <ol className="mt-5 space-y-2 border-l border-border pl-4">
                  {events.map((e) => (
                    <li key={e.id} className="text-sm">
                      <span className="font-medium">
                        {STATUS_LABEL[e.to_status] ?? e.to_status}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · {new Date(e.created_at).toLocaleString()}
                      </span>
                      {e.note ? <p className="text-sm text-muted-foreground">{e.note}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : null}

              {appInterviews.length ? (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium">Interviews</p>
                  {appInterviews.map((i) => (
                    <p key={i.id} className="text-sm text-muted-foreground">
                      {i.round_name} · {i.mode} ·{" "}
                      {i.scheduled_at
                        ? new Date(i.scheduled_at).toLocaleString()
                        : "to be scheduled"}{" "}
                      · {i.status}
                    </p>
                  ))}
                </div>
              ) : null}

              {appOffers.length ? (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium">Offers</p>
                  {appOffers.map((o) => (
                    <p key={o.id} className="text-sm text-muted-foreground">
                      {o.role_title ?? "Offer"} · {formatSalary(o.ctc, null)} ·{" "}
                      {o.joining_date
                        ? `joins ${new Date(o.joining_date).toLocaleDateString()}`
                        : "date TBD"}{" "}
                      · {o.status}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet.{" "}
            <Link to="/jobs" className="text-primary underline underline-offset-4">
              Browse jobs
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
