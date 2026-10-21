import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { getApiUrl, isBackendConfigured } from "@/lib/api-config";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Unconditionally redirect consolidated legacy routes
    if (location.pathname === "/account" || location.pathname === "/account/") {
      throw redirect({ to: "/profile" });
    }
    if (location.pathname === "/jobs" || location.pathname === "/jobs/") {
      throw redirect({ to: "/opportunities" });
    }

    // 1. Check Career Connect SQL Server authentication session from local storage cache
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("career_connect_auth_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u && u.id && u.email) {
            return { user: u };
          }
        } catch {}
      }
    }

    // 2. Authoritative check via AuthServlet session endpoint
    if (typeof fetch !== "undefined" && isBackendConfigured()) {
      try {
        const res = await fetch(getApiUrl("/AuthServlet?action=session"), { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (typeof window !== "undefined") {
              localStorage.setItem("career_connect_auth_user", JSON.stringify(data.user));
            }
            return { user: data.user };
          }
        }
      } catch (e) {
        // network exception
      }
    }

    // Unauthenticated user -> redirect to login
    throw redirect({ to: "/login" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
