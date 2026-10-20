import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "recruiter" | "placement_officer" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  student: "Candidate",
  recruiter: "Employer",
  placement_officer: "Placement Officer",
  admin: "Administrator",
};

interface LocalAuthUser {
  id: number;
  fullName: string;
  email: string;
  role: "candidate" | "admin" | "employer";
  organization?: string | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Career Connect database authentication session
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("career_connect_auth_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.email) {
            setLocalUser(parsed);
          }
        }
      } catch (e) {
        console.warn("Error reading local auth user", e);
      }
    }

    // 2. Also listen to Supabase if configured
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Construct synthetic user if authenticated via AuthServlet / SQL Server
  const user: User | null = localUser
    ? ({
        id: String(localUser.id),
        email: localUser.email,
        user_metadata: {
          full_name: localUser.fullName,
          role: localUser.role,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User)
    : session?.user ?? null;

  return { session, user, loading: loading && !localUser };
}

export function useRoles() {
  const { user } = useSession();

  // If user is authenticated via Career Connect AuthServlet / SQL Server
  const metaRole = (user as unknown as { user_metadata?: { role?: string } })?.user_metadata?.role;

  const query = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user && !metaRole,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user!.id);
        if (error) return [];
        return (data ?? []).map((r) => r.role as AppRole);
      } catch {
        return [];
      }
    },
  });

  if (metaRole) {
    const isStaff = metaRole === "admin";
    const isRecruiter = metaRole === "employer";
    const isStudent = metaRole === "candidate";
    const primary: AppRole = isStaff ? "admin" : isRecruiter ? "recruiter" : "student";
    return {
      roles: [primary],
      primary,
      isStaff,
      isRecruiter,
      isStudent,
      loading: false,
    };
  }

  const roles = query.data ?? [];
  const primary: AppRole = roles.includes("admin")
    ? "admin"
    : roles.includes("placement_officer")
      ? "placement_officer"
      : roles.includes("recruiter")
        ? "recruiter"
        : "student";

  return {
    roles,
    primary,
    isStaff: roles.includes("admin") || roles.includes("placement_officer"),
    isRecruiter: roles.includes("recruiter"),
    isStudent: roles.length === 0 || roles.includes("student"),
    loading: query.isLoading,
  };
}
