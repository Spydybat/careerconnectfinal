import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/** Verifies the caller is an admin using their own (RLS-scoped) client. */
export async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Unable to verify administrator access");
  if (!data) throw new Error("Forbidden: administrator access required");
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string;
  roles: AppRole[];
  status: "active" | "suspended";
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
};
