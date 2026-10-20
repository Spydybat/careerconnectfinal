import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Users,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/employer/dashboard")({
  head: () => ({
    meta: [
      { title: "Employer Portal — CAREER CONNECT" },
      { name: "description", content: "Employer and recruiter talent management workspace." },
    ],
  }),
  component: EmployerDashboardPage,
});

function EmployerDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [candidateQuery, setCandidateQuery] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        navigate({ to: "/login" });
      } else if (user.role !== "employer" && user.role !== "admin") {
        navigate({ to: "/dashboard" });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Loading employer workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <ProfessionalHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
                <Building2 className="size-3.5" />
                <span>{user.organization || "Hiring Partner Workspace"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
                Employer Talent Hub
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Welcome back, {user.fullName}. Review candidate pipelines and discover matching candidates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild className="h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs gap-2">
                <Link to="/career-profiles">
                  <Search className="size-3.5" />
                  <span>Browse Candidate Directory</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Active Opportunities</span>
              <p className="text-2xl font-bold font-display text-foreground mt-2">18 Roles</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Live in hiring directory</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Talent Matches</span>
              <p className="text-2xl font-bold font-display text-primary mt-2">42 Profiles</p>
              <p className="text-[11px] text-muted-foreground mt-1">Matched by technical skills</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Verified Candidates</span>
              <p className="text-2xl font-bold font-display text-purple-600 mt-2">100%</p>
              <p className="text-[11px] text-muted-foreground mt-1">XML & Schema validated</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Recruitment Velocity</span>
              <p className="text-2xl font-bold font-display text-foreground mt-2">9.4 Days</p>
              <p className="text-[11px] text-muted-foreground mt-1">Average candidate screening</p>
            </div>
          </div>

          {/* Quick Actions & Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Talent Search Gateway</h3>
                  <p className="text-xs text-muted-foreground">Filter candidate profiles across competencies and qualifications.</p>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link to="/career-profiles">View All</Link>
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by skill (e.g. Java, React, SQL, Machine Learning)..."
                  value={candidateQuery}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                  className="pl-10 h-11 text-sm bg-background rounded-xl border-input"
                />
              </div>

              <div className="pt-2 border-t border-border/80 flex flex-wrap gap-2 text-xs">
                <span className="text-muted-foreground py-1">Popular searches:</span>
                {["Software Engineer", "Full-Stack Java", "Data Analyst", "AI / ML"].map((s) => (
                  <Button
                    key={s}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCandidateQuery(s)}
                    className="h-7 text-xs bg-muted/60 text-foreground"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-foreground">Recruiter Quick Links</h3>
              <div className="space-y-2.5">
                <Link
                  to="/opportunities"
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="size-4 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Job Listings Directory</p>
                      <p className="text-[10px] text-muted-foreground">Review open positions</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>

                <Link
                  to="/network"
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="size-4 text-purple-600" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Talent Network</p>
                      <p className="text-[10px] text-muted-foreground">Peer connections & alumni</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>

                <Link
                  to="/insights"
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="size-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Market Benchmarks</p>
                      <p className="text-[10px] text-muted-foreground">Compensation & skill trends</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
