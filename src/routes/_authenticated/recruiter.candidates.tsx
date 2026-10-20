import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, CheckCircle2, FileText, Search, ThumbsDown, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RecruiterOnboarding } from "@/components/recruiter-onboarding";
import { ScoreDial } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABEL, matchScore } from "@/lib/career";
import { useHiringActions } from "@/lib/hiring";
import {
  titleCase,
  useCandidateDetail,
  useCompanyApplications,
  useCompanyJobs,
  useCompanyPipeline,
  useMyRecruiter,
} from "@/lib/recruiter";

export const Route = createFileRoute("/_authenticated/recruiter/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — Career Connect" },
      {
        name: "description",
        content: "Review applicants, skill match, resumes and move them through hiring stages.",
      },
      { property: "og:title", content: "Candidates — Career Connect" },
      { property: "og:description", content: "Your applicant tracking workspace." },
    ],
  }),
  component: RecruiterCandidates,
});

function RecruiterCandidates() {
  const { data: recruiter, isLoading } = useMyRecruiter();
  const companyId = recruiter?.company_id ?? null;
  const { data: jobs = [] } = useCompanyJobs(companyId);
  const { data: applications = [] } = useCompanyApplications(companyId);
  const { data: pipeline } = useCompanyPipeline(applications.map((a) => a.id));
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        if (jobFilter !== "all" && a.job_id !== jobFilter) return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          (a.profile?.full_name ?? "").toLowerCase().includes(q) ||
          (a.jobs?.title ?? "").toLowerCase().includes(q)
        );
      }),
    [applications, jobFilter, statusFilter, query],
  );

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!recruiter || !companyId) return <RecruiterOnboarding />;

  const active = applications.find((a) => a.id === activeId) ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Applicant tracking"
        title="Candidates"
        description="Every application across your roles, with skill match and hiring actions."
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search candidate or role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.keys(STATUS_LABEL).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setActiveId(a.id)}
            className="surface-card flex w-full flex-wrap items-center gap-4 p-4 text-left transition-colors hover:border-primary/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.profile?.full_name || "Candidate"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.jobs?.title} · {a.students?.college || "College not set"} ·{" "}
                {a.students?.graduation_year ?? "—"}
              </p>
            </div>
            {typeof a.match_score === "number" ? (
              <Badge variant="outline">{a.match_score}% match</Badge>
            ) : null}
            <Badge variant="secondary">{STATUS_LABEL[a.status] ?? a.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(a.applied_at).toLocaleDateString()}
            </span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No candidates match these filters.</p>
        ) : null}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActiveId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.profile?.full_name || "Candidate"}</DialogTitle>
              </DialogHeader>
              <CandidateDetail
                application={active}
                job={jobs.find((j) => j.id === active.job_id) ?? null}
                interviews={(pipeline?.interviews ?? []).filter(
                  (i) => i.application_id === active.id,
                )}
                offers={(pipeline?.offers ?? []).filter((o) => o.application_id === active.id)}
                events={(pipeline?.events ?? []).filter((e) => e.application_id === active.id)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type DetailProps = {
  application: {
    id: string;
    status: string;
    cover_note: string | null;
    applied_at: string;
    student_id: string;
    profile: {
      full_name: string;
      email: string | null;
      phone: string | null;
      headline: string | null;
      location: string | null;
    } | null;
    students: {
      college: string | null;
      degree: string | null;
      branch: string | null;
      graduation_year: number | null;
      cgpa: number | null;
      about: string | null;
    } | null;
    jobs: { title: string } | null;
  };
  job: {
    title: string;
    job_skills?: { importance: number; skill_id: string; skills: { name: string } | null }[];
  } | null;
  interviews: {
    id: string;
    round_name: string;
    mode: string;
    status: string;
    scheduled_at: string | null;
    feedback: string | null;
  }[];
  offers: {
    id: string;
    ctc: number | null;
    role_title: string | null;
    status: string;
    joining_date: string | null;
  }[];
  events: { id: string; to_status: string; note: string | null; created_at: string }[];
};

function CandidateDetail({ application, job, interviews, offers, events }: DetailProps) {
  const { data: detail } = useCandidateDetail(application.student_id);
  const actions = useHiringActions();
  const [note, setNote] = useState("");
  const [round, setRound] = useState("Technical round 1");
  const [mode, setMode] = useState("online");
  const [when, setWhen] = useState("");
  const [ctc, setCtc] = useState("");
  const [roleTitle, setRoleTitle] = useState(job?.title ?? "");

  const held = new Set((detail?.skills ?? []).map((s) => s.skill_id));
  const required = (job?.job_skills ?? []).map((js) => ({
    importance: js.importance,
    skillId: js.skill_id,
    name: js.skills?.name ?? "",
  }));
  const score = matchScore(required, held);
  const primaryResume =
    (detail?.resumes ?? []).find((r) => r.is_primary) ?? (detail?.resumes ?? [])[0] ?? null;
  const openOffer = offers.find((o) => o.status === "extended") ?? offers[0] ?? null;

  return (
    <Tabs defaultValue="profile" className="mt-2">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="match">Skill match</TabsTrigger>
        <TabsTrigger value="resume">Resume</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4 pt-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {application.profile?.email ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Phone: </span>
            {application.profile?.phone ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">College: </span>
            {application.students?.college ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Degree: </span>
            {application.students?.degree ?? "—"} · {application.students?.branch ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Graduation: </span>
            {application.students?.graduation_year ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">CGPA: </span>
            {application.students?.cgpa ?? "—"}
          </p>
        </div>
        {application.students?.about ? (
          <p className="text-sm text-muted-foreground">{application.students.about}</p>
        ) : null}
        {application.cover_note ? (
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">Cover note</p>
            <p className="mt-1">{application.cover_note}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Projects</p>
          <ul className="mt-2 space-y-2">
            {(detail?.projects ?? []).map((p) => (
              <li key={p.id} className="text-sm">
                <span className="font-medium">{p.title}</span>
                {p.tech_stack ? (
                  <span className="text-muted-foreground"> · {p.tech_stack}</span>
                ) : null}
              </li>
            ))}
            {(detail?.projects ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">No projects listed.</li>
            ) : null}
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="match" className="space-y-4 pt-4">
        <div className="flex items-center gap-6">
          <ScoreDial value={score ?? 0} label="Skill match" />
          <div className="text-sm text-muted-foreground">
            {required.length} skills required for {job?.title ?? "this role"}.
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Matched</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {required
                .filter((r) => held.has(r.skillId))
                .map((r) => (
                  <Badge key={r.skillId} variant="secondary">
                    {r.name}
                  </Badge>
                ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Missing</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {required
                .filter((r) => !held.has(r.skillId))
                .map((r) => (
                  <Badge key={r.skillId} variant="outline">
                    {r.name}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="resume" className="space-y-4 pt-4">
        {primaryResume ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{primaryResume.title}</p>
                <p className="text-xs text-muted-foreground">
                  AI score {primaryResume.ai_score ?? "—"} · ATS {primaryResume.ats_score ?? "—"}
                </p>
              </div>
            </div>
            {primaryResume.ai_summary ? (
              <p className="text-sm text-muted-foreground">{primaryResume.ai_summary}</p>
            ) : null}
            {primaryResume.raw_text ? (
              <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border p-3 text-xs">
                {primaryResume.raw_text}
              </pre>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This candidate has no resume on file.</p>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4 pt-4">
        <ol className="space-y-3 border-l border-border pl-4 text-sm">
          {events.map((e) => (
            <li key={e.id}>
              <span className="font-medium">{STATUS_LABEL[e.to_status] ?? e.to_status}</span>{" "}
              <span className="text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </span>
              {e.note ? <p className="text-xs text-muted-foreground">{e.note}</p> : null}
            </li>
          ))}
          {events.length === 0 ? (
            <li className="text-muted-foreground">
              Applied on {new Date(application.applied_at).toLocaleDateString()}
            </li>
          ) : null}
        </ol>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Interviews</p>
          <div className="mt-2 space-y-3">
            {interviews.map((i) => (
              <div key={i.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {i.round_name} · {titleCase(i.mode)}
                  </p>
                  <Select
                    value={i.status}
                    onValueChange={(status) =>
                      actions.updateInterview.mutate({ interviewId: i.id, status })
                    }
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["scheduled", "completed", "cancelled", "no_show"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {titleCase(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "Not scheduled"}
                </p>
              </div>
            ))}
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews yet.</p>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Offers</p>
          <div className="mt-2 space-y-2">
            {offers.map((o) => (
              <p key={o.id} className="text-sm">
                {o.role_title ?? "Offer"} ·{" "}
                {o.ctc ? `₹${(o.ctc / 100000).toFixed(1)}L` : "CTC not set"} · {o.status}
              </p>
            ))}
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offers yet.</p>
            ) : null}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="actions" className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared with the placement timeline"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                actions.setStatus.mutate({
                  applicationId: application.id,
                  from: application.status,
                  to: "shortlisted",
                  note,
                })
              }
            >
              <CheckCircle2 className="size-4" /> Shortlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                actions.setStatus.mutate({
                  applicationId: application.id,
                  from: application.status,
                  to: "rejected",
                  note,
                })
              }
            >
              <ThumbsDown className="size-4" /> Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                actions.hire.mutate({
                  applicationId: application.id,
                  from: application.status,
                  ...(openOffer ? { offerId: openOffer.id } : {}),
                })
              }
            >
              <Trophy className="size-4" /> Mark hired
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Schedule interview</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="round">Round</Label>
              <Input id="round" value={round} onChange={(e) => setRound(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["online", "onsite", "phone"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {titleCase(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="when">Date & time</Label>
              <Input
                id="when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              actions.scheduleInterview.mutate({
                applicationId: application.id,
                from: application.status,
                roundName: round,
                mode,
                scheduledAt: when ? new Date(when).toISOString() : null,
              })
            }
            disabled={!round.trim() || actions.scheduleInterview.isPending}
          >
            <CalendarPlus className="size-4" /> Schedule
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Send offer</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="offerrole">Role title</Label>
              <Input
                id="offerrole"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ctc">CTC (₹ per year)</Label>
              <Input id="ctc" type="number" value={ctc} onChange={(e) => setCtc(e.target.value)} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              actions.sendOffer.mutate({
                applicationId: application.id,
                from: application.status,
                ctc: ctc ? Number(ctc) : null,
                roleTitle: roleTitle || (job?.title ?? "Offer"),
                joiningDate: null,
              })
            }
            disabled={actions.sendOffer.isPending}
          >
            Send offer
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
