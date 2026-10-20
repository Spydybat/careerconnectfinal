import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/recruiter")({
  component: RecruiterLayout,
});

const TABS = [
  { to: "/recruiter", label: "Overview" },
  { to: "/recruiter/jobs", label: "Jobs" },
  { to: "/recruiter/candidates", label: "Candidates" },
  { to: "/recruiter/analytics", label: "Analytics" },
  { to: "/recruiter/company", label: "Company" },
] as const;

function RecruiterLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const active =
            tab.to === "/recruiter" ? pathname === "/recruiter" : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
