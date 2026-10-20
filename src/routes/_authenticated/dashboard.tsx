import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Send,
  Sparkles,
  Target,
  Users,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/session";
import { useAuth } from "@/lib/auth-context";
import {
  formatSalary,
  matchScore,
  useJobs,
  useMyApplications,
  useMyProfile,
  useMyResumes,
  useMyStudent,
  useMyStudentSkills,
  STATUS_LABEL,
} from "@/lib/career";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Career Connect" },
      {
        name: "description",
        content: "Your career readiness, applications and matched opportunities at a glance.",
      },
      { property: "og:title", content: "Dashboard — Career Connect" },
      { property: "og:description", content: "Career readiness, applications and matched jobs." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user: authUser } = useAuth();
  const { isStaff, isRecruiter, loading } = useRoles();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your workspace…</p>;
  if (authUser?.role === "admin") return <AdminDashboardOverview authUser={authUser} />;
  if (isStaff) return <StaffDashboard />;
  if (isRecruiter || authUser?.role === "employer") return <RecruiterDashboard />;
  return <StudentDashboard />;
}

function AdminDashboardOverview({ authUser }: { authUser: { fullName?: string; email?: string } }) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administrative Console"
        title={`Welcome, ${authUser?.fullName || "Administrator"}`}
        description="Platform administration, live user directory management, and system governance."
        actions={
          <Button asChild>
            <Link to="/admin/dashboard">
              <ShieldCheck className="size-4" /> Open Admin Console
            </Link>
          </Button>
        }
      />
      <div className="surface-card p-6 rounded-2xl border border-border space-y-4">
        <h3 className="text-base font-bold text-foreground">Administrative Shortcuts</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/admin/dashboard"
            className="p-4 rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/60 hover:border-primary transition-colors block group"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="size-4" />
              <span>Registered User Directory</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Live Microsoft SQL Server candidate and employer account operations.
            </p>
          </Link>
          <Link
            to="/admin/users"
            className="p-4 rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/60 hover:border-primary transition-colors block group"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Users className="size-4" />
              <span>User Governance</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Review and audit user roles, credentials, and authentication profiles.
            </p>
          </Link>
          <Link
            to="/insights"
            className="p-4 rounded-xl border border-border bg-slate-50/70 dark:bg-slate-900/60 hover:border-primary transition-colors block group"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Briefcase className="size-4" />
              <span>Career Insights</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Examine hiring market salary distributions and competency trends.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user: authUser } = useAuth();
  const { user: sessionUser } = useSession();
  const { data: profile } = useMyProfile();
  const { data: student } = useMyStudent();
  const { data: skills = [] } = useMyStudentSkills(student?.id);
  const { data: applications = [] } = useMyApplications(student?.id);
  const { data: jobs = [] } = useJobs();
  const { data: resumes = [] } = useMyResumes(student?.id);

  const rawName =
    authUser?.fullName ||
    profile?.full_name ||
    (sessionUser as { user_metadata?: { full_name?: string } })?.user_metadata?.full_name ||
    sessionUser?.email?.split("@")[0] ||
    "Candidate";
  const firstName = rawName.trim().split(/\s+/)[0] || "Candidate";

  const held = new Set(skills.map((s) => s.skill_id));
  const ranked = jobs
    .map((job) => ({
      job,
      score:
        matchScore(
          (job.job_skills ?? []).map((js) => ({
            importance: js.importance,
            skillId: js.skills?.id ?? "",
          })),
          held,
        ) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const profileFields = [
    student?.college,
    student?.degree,
    student?.graduation_year,
    student?.about,
    profile?.full_name,
    skills.length > 0 ? "skills" : null,
    resumes.length > 0 ? "resume" : null,
  ];
  const completeness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );
  const active = applications.filter((a) => !["rejected", "withdrawn"].includes(a.status));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Candidate workspace"
        title={`Welcome back, ${firstName}`}
        description="Your readiness, applications and the roles that fit your current skill set."
        actions={
          <Button asChild>
            <Link to="/resume">
              <Sparkles className="size-4" /> Analyze resume
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Profile completeness" value={`${completeness}%`} icon={Target} />
        <KpiCard label="Skills on profile" value={skills.length} icon={GraduationCap} />
        <KpiCard label="Active applications" value={active.length} icon={Send} tone="accent" />
        <KpiCard
          label="Best resume score"
          value={resumes.find((r) => r.ai_score)?.ai_score ?? "—"}
          icon={Sparkles}
          tone="success"
        />
      </div>

      {completeness < 100 ? (
        <div className="surface-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Finish your profile to improve match quality</p>
              <p className="text-sm text-muted-foreground">
                Matching uses your skills, education and resume.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile">Complete profile</Link>
            </Button>
          </div>
          <Progress value={completeness} className="mt-4" />
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Matched opportunities</h2>
          <Link to="/opportunities" className="text-sm text-primary underline underline-offset-4">
            View all jobs
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ranked.map(({ job, score }) => (
            <Link
              key={job.id}
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="surface-card block p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.companies?.name} · {job.location}
                  </p>
                </div>
                <Badge variant={score >= 60 ? "default" : "secondary"}>{score}% match</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </Link>
          ))}
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open roles yet.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Recent applications</h2>
        <div className="mt-4 space-y-2">
          {applications.slice(0, 5).map((a) => (
            <div
              key={a.id}
              className="surface-card flex items-center justify-between gap-4 px-5 py-3"
            >
              <div>
                <p className="text-sm font-medium">{a.jobs?.title}</p>
                <p className="text-xs text-muted-foreground">{a.jobs?.companies?.name}</p>
              </div>
              <Badge variant="outline">{STATUS_LABEL[a.status] ?? a.status}</Badge>
            </div>
          ))}
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t applied to anything yet.{" "}
              <Link to="/opportunities" className="text-primary underline underline-offset-4">
                Browse opportunities
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function RecruiterDashboard() {
  const { data } = useQuery({
    queryKey: ["recruiter-overview"],
    queryFn: async () => {
      const jobs = await supabase
        .from("jobs")
        .select("id, title, status, applications(id, status)")
        .order("created_at", { ascending: false });
      if (jobs.error) throw jobs.error;
      return jobs.data ?? [];
    },
  });

  const myJobs = data ?? [];
  const allApps = myJobs.flatMap((j) => j.applications ?? []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Recruiter workspace"
        title="Hiring overview"
        description="Your open roles and the candidate pipeline across them."
        actions={
          <Button asChild>
            <Link to="/recruiter">Manage pipeline</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open roles"
          value={myJobs.filter((j) => j.status === "open").length}
          icon={Briefcase}
        />
        <KpiCard label="Total applicants" value={allApps.length} icon={Users} tone="accent" />
        <KpiCard
          label="Shortlisted"
          value={allApps.filter((a) => a.status === "shortlisted").length}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Offers"
          value={allApps.filter((a) => ["offered", "hired"].includes(a.status)).length}
          icon={Sparkles}
          tone="success"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Head to the hiring workspace to post roles and move candidates through the pipeline.
      </p>
    </div>
  );
}

function StaffDashboard() {
  const { data } = useQuery({
    queryKey: ["staff-overview"],
    queryFn: async () => {
      const [students, placements, applications, jobs] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("placements").select("id, ctc, verification_status"),
        supabase.from("applications").select("id, status"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      return {
        students: students.count ?? 0,
        placements: placements.data ?? [],
        applications: applications.data ?? [],
        openJobs: jobs.count ?? 0,
      };
    },
  });

  const placements = data?.placements ?? [];
  const avgCtc = placements.length
    ? Math.round(
        placements.reduce((s, p) => s + (p.ctc ?? 0), 0) / placements.filter((p) => p.ctc).length ||
          0,
      )
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Placement office"
        title="Placement intelligence"
        description="Cohort-wide hiring activity, placements and verification status."
        actions={
          <Button asChild>
            <Link to="/opportunities">Explore opportunities</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Registered students" value={data?.students ?? 0} icon={GraduationCap} />
        <KpiCard label="Open roles" value={data?.openJobs ?? 0} icon={Briefcase} />
        <KpiCard
          label="Applications"
          value={data?.applications.length ?? 0}
          icon={Send}
          tone="accent"
        />
        <KpiCard
          label="Placements"
          value={placements.length}
          hint={avgCtc ? `Avg ₹${(avgCtc / 100000).toFixed(1)}L CTC` : undefined}
          icon={CheckCircle2}
          tone="success"
        />
      </div>
    </div>
  );
}
