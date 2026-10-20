import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AiError, type AiFeature } from "./types";

/**
 * Sprint 11 — AI context authorization.
 *
 * The AI layer never decides what a user may see. Before any context is built:
 *   1. the caller must be authenticated (middleware supplies userId),
 *   2. the caller must be authorized for the feature (role check),
 *   3. the tenant/organisation scope is resolved from the database,
 *   4. only rows inside that scope are read, through the RLS-bound client.
 *
 * The service-role client is never used to build model context.
 */

type Client = SupabaseClient<Database>;

export type AiPrincipal = {
  userId: string;
  role: "student" | "recruiter" | "admin" | "unknown";
  /** Row id of the student record, when the principal is a student. */
  studentId: string | null;
  /** Tenant scope: the college a student belongs to, or the recruiter's company. */
  tenantScope: { kind: "college" | "company" | "platform"; id: string | null };
};

/** Features a student may invoke. Nothing here reads cross-user data. */
const STUDENT_FEATURES: AiFeature[] = [
  "career_coach",
  "skill_gap",
  "mock_interview_questions",
  "mock_interview_evaluation",
  "resume_analysis",
  "skill_extraction",
  "career_recommendation",
  "learning_recommendation",
  "job_matching",
];

const FEATURE_ROLES: Record<AiFeature, AiPrincipal["role"][]> = Object.fromEntries(
  STUDENT_FEATURES.map((feature) => [feature, ["student", "admin"] as AiPrincipal["role"][]]),
) as Record<AiFeature, AiPrincipal["role"][]>;

export async function resolvePrincipal(supabase: Client, userId: string): Promise<AiPrincipal> {
  const [{ data: roles }, { data: student }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("students").select("id, college").eq("user_id", userId).maybeSingle(),
  ]);

  const roleNames = new Set((roles ?? []).map((r) => String(r.role)));
  const role: AiPrincipal["role"] = roleNames.has("admin")
    ? "admin"
    : roleNames.has("recruiter")
      ? "recruiter"
      : student
        ? "student"
        : roleNames.has("student")
          ? "student"
          : "unknown";

  return {
    userId,
    role,
    studentId: student?.id ?? null,
    tenantScope: student?.college
      ? { kind: "college", id: student.college }
      : { kind: "platform", id: null },
  };
}

/**
 * Authenticates + authorizes the caller for a feature and returns the
 * principal used to scope every subsequent read.
 */
export async function authorizeAiRequest(
  supabase: Client,
  userId: string | null | undefined,
  feature: AiFeature,
): Promise<AiPrincipal> {
  if (!userId) {
    throw new AiError("unauthorized", "Please sign in to use AI features.");
  }

  const principal = await resolvePrincipal(supabase, userId);
  const allowed = FEATURE_ROLES[feature] ?? [];

  if (!allowed.includes(principal.role)) {
    throw new AiError("unauthorized", "Your account does not have access to this AI feature.");
  }

  if (principal.role === "student" && !principal.studentId) {
    throw new AiError("unauthorized", "Complete your student profile before using AI features.");
  }

  return principal;
}

/** Guards a resource read: the row must belong to the principal. */
export function assertOwnedBy(principal: AiPrincipal, ownerUserId: string | null | undefined) {
  if (!ownerUserId || ownerUserId !== principal.userId) {
    throw new AiError("unauthorized", "That item does not belong to your account.");
  }
}

/**
 * Tables the AI context engine is allowed to read. Anything not on this list —
 * recruiter pipelines, other students, audit logs, system configuration — is
 * out of reach for every AI code path.
 */
export const AI_READABLE_TABLES = [
  "profiles",
  "students",
  "student_skills",
  "skills",
  "careers",
  "career_skills",
  "projects",
  "applications",
  "resumes",
  "jobs",
  "companies",
  "ai_conversations",
  "ai_messages",
  "ai_interview_sessions",
  "ai_interview_turns",
  "ai_skill_gap_reports",
] as const;

export type AiReadableTable = (typeof AI_READABLE_TABLES)[number];

export function isAiReadableTable(table: string): table is AiReadableTable {
  return (AI_READABLE_TABLES as readonly string[]).includes(table);
}

export function assertAiReadableTable(table: string): AiReadableTable {
  if (!isAiReadableTable(table)) {
    throw new AiError("unauthorized", "The AI layer may not read that data.");
  }
  return table;
}
