import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAnalyticsAccess } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/analytics/executive", label: "Executive", domain: "executive" },
  { to: "/analytics/placement", label: "Placement", domain: "placement" },
  { to: "/analytics/recruiter", label: "Recruiter", domain: "recruiter" },
  { to: "/analytics/skills", label: "Skills", domain: "skills" },
  { to: "/analytics/salary", label: "Salary", domain: "salary" },
  { to: "/analytics/jobs", label: "Jobs", domain: "jobs" },
  { to: "/analytics/students", label: "Students", domain: "students" },
  { to: "/analytics/learning", label: "Learning", domain: "learning" },
] as const;

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsLayout,
});

function AnalyticsLayout() {
  const { data } = useAnalyticsAccess();
  const allowed = data?.domains;
  const tabs = allowed ? TABS.filter((tab) => allowed.includes(tab.domain)) : TABS;

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b pb-2" aria-label="Analytics dashboards">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            activeProps={{ className: "bg-muted font-medium text-foreground" }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
