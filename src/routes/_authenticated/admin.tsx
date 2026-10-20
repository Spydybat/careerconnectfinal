import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useRoles } from "@/lib/session";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin/dashboard", label: "Overview" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/organizations", label: "Organizations" },
  { to: "/admin/settings", label: "Platform" },
  { to: "/admin/audit", label: "Audit logs" },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useRoles();
  const isAdmin = roles.includes("admin") || authUser?.role === "admin";
  const loading = authLoading && rolesLoading;

  if (!loading && !isAdmin) {
    return (
      <div className="surface-card p-8 text-center rounded-2xl border border-border">
        <h1 className="font-display text-xl font-semibold">Administrator access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The admin console is restricted to verified platform administrators.
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
          const active = pathname.startsWith(tab.to) || (tab.to === "/admin/dashboard" && pathname === "/admin");
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
