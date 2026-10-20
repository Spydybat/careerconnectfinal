import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  UserRound,
  Sparkles,
  Briefcase,
  TrendingUp,
  Users,
  FileText,
  UserPlus,
  LogIn,
  LogOut,
  LayoutDashboard,
  Shield,
  Building2,
  ChevronDown,
  Menu,
  X,
  Send,
  Mic,
  Target,
  Compass,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function ProfessionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAuthenticated, logout } = useAuth();

  const isItemActive = (to: string) => {
    if (to === "/") return pathname === "/";
    if (to === "/dashboard") return pathname === "/dashboard";
    if (to === "/admin/dashboard") return pathname === "/admin/dashboard" || pathname === "/admin";
    if (to === "/employer/dashboard") return pathname === "/employer/dashboard";
    return pathname === to || pathname.startsWith(to + "/");
  };

  const isSkillsActive =
    pathname === "/skills" ||
    pathname === "/insights" ||
    pathname === "/careers" ||
    pathname.startsWith("/careers/") ||
    pathname.startsWith("/ai/") ||
    pathname === "/resume" ||
    pathname.startsWith("/resume/");

  const getDashboardPath = () => {
    if (!user) return "/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "employer") return "/employer/dashboard";
    return "/dashboard";
  };

  // 1. Role-specific desktop navigation items
  const publicNavItems: HeaderNavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/opportunities", label: "Find Opportunities", icon: Briefcase },
    { to: "/insights", label: "Career Insights", icon: TrendingUp },
    { to: "/companies", label: "Companies", icon: Building2 },
  ];

  const candidateNavItems: HeaderNavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "My Profile", icon: UserRound },
    { to: "/opportunities", label: "Find Opportunities", icon: Briefcase },
    { to: "/applications", label: "Applications", icon: Send },
    { to: "/network", label: "Professional Network", icon: Users },
  ];

  const employerNavItems: HeaderNavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/employer/dashboard", label: "Employer Dashboard", icon: LayoutDashboard },
    { to: "/recruiter/jobs", label: "Job Postings", icon: Briefcase },
    { to: "/recruiter/candidates", label: "Candidate Search", icon: UserRound },
    { to: "/recruiter/company", label: "Company Profile", icon: Building2 },
    { to: "/recruiter/analytics", label: "Hiring Analytics", icon: TrendingUp },
  ];

  const adminNavItems: HeaderNavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "User Management", icon: UserRound },
    { to: "/admin/organizations", label: "Organizations", icon: Building2 },
    { to: "/admin/settings", label: "Platform Settings", icon: Settings },
    { to: "/admin/audit", label: "Audit Logs", icon: ShieldCheck },
  ];

  const activeNavItems = !isAuthenticated
    ? publicNavItems
    : user?.role === "admin"
      ? adminNavItems
      : user?.role === "employer"
        ? employerNavItems
        : candidateNavItems;

  const getRoleBadge = (role?: string) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Shield className="size-3" /> Admin
        </span>
      );
    }
    if (role === "employer") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
          <Building2 className="size-3" /> Employer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary">
        Candidate
      </span>
    );
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "CC";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0];
    const second = parts[1];
    if (parts.length >= 2 && first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left Side: Brand Logo and Title */}
        <div className="flex items-center shrink-0 min-w-0">
          <Link
            to="/"
            className="group flex items-center gap-2 sm:gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 min-w-0"
          >
            {/* Official Career Connect Infinity Ribbon Logo Container */}
            <div className="size-9 sm:size-11 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200/90 dark:border-slate-700/90 shadow-xs group-hover:scale-105 transition-all shrink-0 flex items-center justify-center overflow-hidden">
              <img src="/career-connect-icon.png" alt="Career Connect Logo" className="size-full object-contain" />
            </div>
            {/* Brand Typography & Subtitle */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                Career Connect
              </span>
              <span className="hidden min-[360px]:block text-[11px] font-medium text-muted-foreground leading-tight mt-0.5 truncate">
                Professional Network
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav
          className="hidden lg:flex items-center h-[72px] gap-1 xl:gap-2 mx-2"
          aria-label="Main Navigation"
        >
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex flex-col items-center justify-center h-[72px] px-2.5 xl:px-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                  active
                    ? "text-primary font-semibold"
                    : "text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`size-[18px] xl:size-5 transition-transform duration-150 group-hover:scale-105 shrink-0 ${
                    active
                      ? "text-primary"
                      : "text-slate-500 group-hover:text-primary dark:text-slate-400 dark:group-hover:text-slate-100"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] xl:text-xs tracking-tight whitespace-nowrap mt-1 leading-none">
                  {item.label}
                </span>

                {/* Subtle Blue Active Indicator Line */}
                {active && (
                  <span
                    className="absolute bottom-0 inset-x-2 h-[3px] rounded-t-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          {/* Candidate-Only: Consolidated Skills & Career Development Dropdown */}
          {isAuthenticated && user?.role === "candidate" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`group relative flex flex-col items-center justify-center h-[72px] px-2.5 xl:px-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                    isSkillsActive
                      ? "text-primary font-semibold"
                      : "text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    <Sparkles
                      className={`size-[18px] xl:size-5 transition-transform duration-150 group-hover:scale-105 shrink-0 ${
                        isSkillsActive
                          ? "text-primary"
                          : "text-slate-500 group-hover:text-primary dark:text-slate-400 dark:group-hover:text-slate-100"
                      }`}
                      aria-hidden="true"
                    />
                    <ChevronDown className="size-2.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </div>
                  <span className="text-[11px] xl:text-xs tracking-tight whitespace-nowrap mt-1 leading-none">
                    Skills & Career
                  </span>
                  {isSkillsActive && (
                    <span
                      className="absolute bottom-0 inset-x-2 h-[3px] rounded-t-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 p-1.5 shadow-lg rounded-xl border border-border">
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Skills & Development
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/skills" className="flex items-center gap-2.5 text-xs font-medium">
                    <Sparkles className="size-4 text-primary" />
                    <span>Discover Skills</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/insights" className="flex items-center gap-2.5 text-xs font-medium">
                    <TrendingUp className="size-4 text-primary" />
                    <span>Career Insights</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/careers" className="flex items-center gap-2.5 text-xs font-medium">
                    <Compass className="size-4 text-primary" />
                    <span>Career Paths</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  AI Career Tools
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/ai/skill-gap" className="flex items-center gap-2.5 text-xs font-medium">
                    <Target className="size-4 text-primary" />
                    <span>Skill Gap Plan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/ai/career-coach" className="flex items-center gap-2.5 text-xs font-medium">
                    <Sparkles className="size-4 text-primary" />
                    <span>AI Career Coach</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/ai/mock-interview" className="flex items-center gap-2.5 text-xs font-medium">
                    <Mic className="size-4 text-primary" />
                    <span>Mock Interview</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link to="/resume" className="flex items-center gap-2.5 text-xs font-medium">
                    <FileText className="size-4 text-primary" />
                    <span>Resume AI</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Right Side: Authentication Controls & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated && user ? (
            /* Authenticated User Profile Menu */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="User account menu"
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-left"
                >
                  <Avatar className="size-9 border border-border/80">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {getUserInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {user.role === "admin" ? "Admin" : user.role === "employer" ? "Employer" : "Candidate"}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg rounded-xl border border-border">
                <DropdownMenuLabel className="p-2">
                  <p className="text-xs font-bold text-foreground truncate">{user.fullName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1.5">{getRoleBadge(user.role)}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Role-Specific Avatar Dropdown Actions */}
                {user.role === "candidate" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/dashboard" className="flex items-center gap-2.5 text-xs font-medium">
                        <LayoutDashboard className="size-4 text-primary" />
                        <span>Candidate Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/profile" className="flex items-center gap-2.5 text-xs font-medium">
                        <UserRound className="size-4 text-slate-500" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/applications" className="flex items-center gap-2.5 text-xs font-medium">
                        <Send className="size-4 text-slate-500" />
                        <span>My Applications</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/resume" className="flex items-center gap-2.5 text-xs font-medium">
                        <FileText className="size-4 text-slate-500" />
                        <span>Resume AI</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === "employer" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/employer/dashboard" className="flex items-center gap-2.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                        <Building2 className="size-4" />
                        <span>Employer Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/recruiter/jobs" className="flex items-center gap-2.5 text-xs font-medium">
                        <Briefcase className="size-4 text-slate-500" />
                        <span>Manage Job Postings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/recruiter/candidates" className="flex items-center gap-2.5 text-xs font-medium">
                        <UserRound className="size-4 text-slate-500" />
                        <span>Candidate Search</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/admin/dashboard" className="flex items-center gap-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <Shield className="size-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/admin/users" className="flex items-center gap-2.5 text-xs font-medium">
                        <UserRound className="size-4 text-slate-500" />
                        <span>User Management</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer py-2">
                      <Link to="/admin/settings" className="flex items-center gap-2.5 text-xs font-medium">
                        <Settings className="size-4 text-slate-500" />
                        <span>Platform Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2.5 text-xs font-medium"
                >
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Unauthenticated Visitor Options: Log In & Create Account */
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden min-[360px]:inline-flex h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                <Link to="/login" className="flex items-center gap-1.5">
                  <LogIn className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Log In</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex h-9 px-3.5 sm:px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs transition-all gap-1.5"
              >
                <Link to="/register" className="flex items-center gap-1.5">
                  <UserPlus className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Create Account</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid size-8 sm:size-9 place-items-center rounded-lg border border-border text-foreground hover:bg-muted lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shrink-0"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-4.5 sm:size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-4.5 sm:size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-white dark:bg-slate-900 px-3 sm:px-4 py-4 lg:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated && user && (
            <div className="mb-4 pb-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {getUserInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div>{getRoleBadge(user.role)}</div>
            </div>
          )}

          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-foreground dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`size-4.5 shrink-0 ${
                      active ? "text-primary" : "text-slate-500 dark:text-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Candidate-Only: Mobile Skills & Development Sub-links */}
            {isAuthenticated && user?.role === "candidate" && (
              <>
                <div className="pt-2 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Skills & Career Development
                </div>
                <Link
                  to="/skills"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Sparkles className="size-4 text-primary" />
                  <span>Discover Skills</span>
                </Link>
                <Link
                  to="/insights"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <TrendingUp className="size-4 text-primary" />
                  <span>Career Insights</span>
                </Link>
                <Link
                  to="/careers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Compass className="size-4 text-primary" />
                  <span>Career Paths</span>
                </Link>
                <Link
                  to="/ai/skill-gap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Target className="size-4 text-primary" />
                  <span>Skill Gap Plan</span>
                </Link>
                <Link
                  to="/ai/career-coach"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Sparkles className="size-4 text-primary" />
                  <span>AI Career Coach</span>
                </Link>
                <Link
                  to="/ai/mock-interview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Mic className="size-4 text-primary" />
                  <span>Mock Interview</span>
                </Link>
                <Link
                  to="/resume"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FileText className="size-4 text-primary" />
                  <span>Resume AI</span>
                </Link>
              </>
            )}

            {/* In-drawer Actions */}
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 rounded-lg justify-start gap-2.5 text-sm font-semibold"
                  >
                    <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="size-4 text-primary" />
                      <span>My Workspace Dashboard</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full h-10 rounded-lg justify-start gap-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    <span>Log Out</span>
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 rounded-lg text-sm font-semibold gap-1.5"
                  >
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="size-4" />
                      <span>Log In</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold gap-1.5"
                  >
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <UserPlus className="size-4" />
                      <span>Create Account</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
