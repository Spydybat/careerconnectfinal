import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Building2,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/session";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";
import { cn } from "@/lib/utils";

interface WorkspaceTab {
  to: string;
  label: string;
  icon: LucideIcon;
}

const CANDIDATE_TABS: WorkspaceTab[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: Send },
  { to: "/resume", label: "Resume AI", icon: FileText },
  { to: "/ai/career-coach", label: "AI Career Coach", icon: Sparkles },
  { to: "/ai/mock-interview", label: "Mock Interview", icon: Mic },
  { to: "/ai/skill-gap", label: "Skill Gap Plan", icon: Target },
  { to: "/careers", label: "Career Paths", icon: Compass },
  { to: "/companies", label: "Companies", icon: Building2 },
];

const RECRUITER_TABS: WorkspaceTab[] = [
  { to: "/employer/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/recruiter/jobs", label: "Job Postings", icon: Briefcase },
  { to: "/recruiter/candidates", label: "Candidate Search", icon: UserRound },
  { to: "/recruiter/company", label: "Company Profile", icon: Building2 },
  { to: "/recruiter/analytics", label: "Hiring Analytics", icon: BarChart3 },
];

const ADMIN_TABS: WorkspaceTab[] = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: UserRound },
  { to: "/admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/admin/settings", label: "Platform Settings", icon: ShieldCheck },
  { to: "/admin/audit", label: "Audit Logs", icon: BarChart3 },
];

const STAFF_TABS: WorkspaceTab[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/placement", label: "Placement Cell", icon: GraduationCap },
  { to: "/placement/students", label: "Student Directory", icon: UserRound },
  { to: "/placement/analytics", label: "Placement Analytics", icon: BarChart3 },
  { to: "/placement/drives", label: "Recruitment Drives", icon: Briefcase },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const { roles, isStaff, isRecruiter } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Determine tabs and role label based on role
  const isUserAdmin = roles.includes("admin") || authUser?.role === "admin";
  const isUserRecruiter = isRecruiter || authUser?.role === "employer";

  const tabs: WorkspaceTab[] = isUserAdmin
    ? ADMIN_TABS
    : isStaff
      ? STAFF_TABS
      : isUserRecruiter
        ? RECRUITER_TABS
        : CANDIDATE_TABS;

  const workspaceTitle = isUserAdmin
    ? "Administrator Workspace"
    : isStaff
      ? "Placement Operations"
      : isUserRecruiter
        ? "Employer Talent Hub"
        : "Candidate Workspace";

  const WorkspaceIcon = isUserAdmin
    ? ShieldCheck
    : isStaff
      ? GraduationCap
      : isUserRecruiter
        ? Building2
        : LayoutDashboard;

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-950 flex flex-col justify-between">
      {/* 1. Unified Shared Top Navigation Header (Identical across Home, Dashboard & All Pages) */}
      <ProfessionalHeader />

      {/* 2. Sleek Horizontal Workspace Subnav Toolbar */}
      <div className="sticky top-[72px] z-40 border-b border-slate-200/90 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-12 gap-4 min-w-0">
          {/* Workspace Context Tag */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
              <WorkspaceIcon className="size-3.5" />
            </div>
            <span className="text-xs font-bold text-foreground tracking-tight">
              {workspaceTitle}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
          </div>

          {/* Horizontal Tabs List */}
          <nav
            className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 no-scrollbar flex-1 md:flex-initial min-w-0 w-full"
            aria-label="Workspace Tools Navigation"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active =
                pathname === tab.to ||
                (!["/dashboard", "/admin/dashboard", "/employer/dashboard"].includes(tab.to) &&
                  pathname.startsWith(tab.to));

              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      active ? "text-primary-foreground" : "text-slate-500 dark:text-slate-400",
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. Main Workspace Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 4. Unified Shared Footer (Identical across Home, Dashboard & All Pages) */}
      <ProfessionalFooter />
    </div>
  );
}
