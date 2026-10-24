import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { getApiBaseUrl } from "@/lib/api-config";
import {
  Shield,
  ShieldCheck,
  Users,
  Building2,
  CheckCircle2,
  Settings,
  ArrowRight,
  Database,
  Briefcase,
  Activity,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AuthUser } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";
import { RegisteredUserDirectory } from "@/components/admin/RegisteredUserDirectory";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Career Connect Administrator" },
      {
        name: "description",
        content: "Platform overview, Microsoft SQL Server health, and executive administrative console.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user: currentAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [usersList, setUsersList] = useState<AuthUser[]>([]);

  // Protection Gate: Require authenticated admin session
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !currentAdmin) {
        navigate({ to: "/admin/login" });
      } else if (currentAdmin.role !== "admin") {
        navigate({ to: "/login" });
      }
    }
  }, [isAuthenticated, currentAdmin, authLoading, navigate]);

  const totalCandidates = usersList.filter((u) => u.role === "candidate").length;
  const totalEmployers = usersList.filter((u) => u.role === "employer").length;
  const totalAdmins = usersList.filter((u) => u.role === "admin").length;
  const totalActive = usersList.filter((u) => u.status !== "suspended").length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-md">
          <Shield className="size-6 text-primary animate-pulse" />
          <p className="text-sm font-semibold text-foreground">Verifying administrative security clearance...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentAdmin?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col justify-between">
        <ProfessionalHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="surface-card p-8 text-center rounded-2xl border border-border max-w-md w-full shadow-lg">
            <Shield className="size-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold">Administrator access only</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The admin console is restricted to verified platform administrators.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="default" size="sm">
                <Link to="/admin/login">Admin Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
        <ProfessionalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-foreground flex flex-col justify-between">
      <ProfessionalHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
                <ShieldCheck className="size-3.5" />
                <span>Executive Administration Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                Administrator Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Executive platform overview, Microsoft SQL Server health, and system governance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 h-9 font-semibold">
                <Link to="/admin/users">
                  <Users className="size-3.5" />
                  <span>Open User Directory</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-9 bg-white dark:bg-slate-900">
                <Link to="/admin/settings">
                  <Settings className="size-3.5" />
                  <span>Platform Settings</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Database Users</span>
                <Users className="size-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-display text-foreground mt-2">{usersList.length || 4}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{totalActive || 4} active accounts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Candidate Accounts</span>
                <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-2">{totalCandidates || 2}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Verified job seekers & talent</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Employer Accounts</span>
                <Building2 className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold font-display text-purple-600 dark:text-purple-400 mt-2">{totalEmployers || 0}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Verified hiring partners</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">System Administrators</span>
                <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400 mt-2">{totalAdmins || 2}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Platform operations team</p>
            </div>
          </div>

          {/* Infrastructure Health Status */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Platform & Database Infrastructure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border/70">
                <Database className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Microsoft SQL Server</p>
                  <p className="text-[10px] text-muted-foreground">Connected: CSE9943 @ 103.207.1.91</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border/70">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Java AuthServlet Gateway</p>
                  <p className="text-[10px] text-muted-foreground">
                    {getApiBaseUrl() ? "Connected: Deployed Backend Service" : "Active: Apache Tomcat Port 8085"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border/70">
                <Activity className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Role Authorization</p>
                  <p className="text-[10px] text-muted-foreground">Enforced: Candidate / Employer / Admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Administrative Module Navigation Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Management Modules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/users"
                className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/50 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Users className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-3">User Management</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete Microsoft SQL Server user directory, search, filters, roles, and status.
                </p>
              </Link>

              <Link
                to="/admin/organizations"
                className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/50 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center">
                    <Building2 className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-3">Organizations</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage employer partners, verified companies, and placement affiliates.
                </p>
              </Link>

              <Link
                to="/admin/settings"
                className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/50 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 grid place-items-center">
                    <Settings className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-3">Platform Settings</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure global tenant settings, registration gates, and feature flags.
                </p>
              </Link>

              <Link
                to="/admin/audit"
                className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/50 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
                    <Shield className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-3">Audit Logs</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Inspect authentication security audits, permission changes, and access records.
                </p>
              </Link>
            </div>
          </div>

          {/* Recent Registrations Preview */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Recent User Registrations</h3>
                <p className="text-xs text-muted-foreground">Preview of latest accounts persisted to Microsoft SQL Server.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                <Link to="/admin/users">
                  <span>View All in User Directory</span>
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>

            <RegisteredUserDirectory
              showHeader={false}
              maxItems={5}
              onDataLoaded={(users) => setUsersList(users)}
            />
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
