import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useRoles } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/placement")({
  component: PlacementLayout,
});

const TABS = [
  { to: "/placement", label: "Overview" },
  { to: "/placement/students", label: "Students" },
  { to: "/placement/drives", label: "Campus drives" },
  { to: "/placement/companies", label: "Company visits" },
  { to: "/placement/records", label: "Records" },
  { to: "/placement/analytics", label: "Analytics" },
] as const;

function PlacementLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isStaff, loading } = useRoles();

  if (!loading && !isStaff) {
    return (
      <div className="surface-card p-8 text-center">
        <h1 className="font-display text-xl font-semibold">Placement cell access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace is available to placement officers and administrators.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-primary">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const active =
            tab.to === "/placement" ? pathname === "/placement" : pathname.startsWith(tab.to);
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
