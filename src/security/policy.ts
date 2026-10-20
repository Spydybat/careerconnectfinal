/**
 * Sprint 12 — RBAC and tenant isolation policy.
 *
 * This is the single declarative statement of who may do what. Server functions
 * assert against it; the negative tests in __tests__/rbac.test.ts enumerate
 * every role/capability pair so a widened boundary fails the suite.
 *
 * Two rules are absolute:
 *   1. authorization is decided server-side from the verified session, never
 *      from client-supplied role/company/student ids,
 *   2. tenant scope is resolved from the database for the caller and compared
 *      to the resource, never taken from the request.
 */

export type Role = "student" | "recruiter" | "placement_officer" | "admin";

export const ROLES: readonly Role[] = ["student", "recruiter", "placement_officer", "admin"];

export type Capability =
  // student surface
  | "student:read_own_profile"
  | "student:manage_own_resume"
  | "student:apply_to_job"
  | "student:use_ai_coach"
  // recruiter surface
  | "recruiter:manage_own_company"
  | "recruiter:post_job"
  | "recruiter:read_own_company_applications"
  | "recruiter:read_applicant_resume"
  | "recruiter:schedule_interview"
  | "recruiter:make_offer"
  // placement office surface
  | "placement:read_all_students"
  | "placement:verify_placement"
  | "placement:read_analytics"
  | "placement:export_reports"
  // admin surface
  | "admin:manage_users"
  | "admin:manage_roles"
  | "admin:suspend_user"
  | "admin:delete_user"
  | "admin:read_audit_log"
  | "admin:read_ai_usage"
  | "admin:manage_platform";

const STUDENT: Capability[] = [
  "student:read_own_profile",
  "student:manage_own_resume",
  "student:apply_to_job",
  "student:use_ai_coach",
];

const RECRUITER: Capability[] = [
  "recruiter:manage_own_company",
  "recruiter:post_job",
  "recruiter:read_own_company_applications",
  "recruiter:read_applicant_resume",
  "recruiter:schedule_interview",
  "recruiter:make_offer",
];

const PLACEMENT: Capability[] = [
  "placement:read_all_students",
  "placement:verify_placement",
  "placement:read_analytics",
  "placement:export_reports",
];

const ADMIN: Capability[] = [
  ...STUDENT,
  ...RECRUITER,
  ...PLACEMENT,
  "admin:manage_users",
  "admin:manage_roles",
  "admin:suspend_user",
  "admin:delete_user",
  "admin:read_audit_log",
  "admin:read_ai_usage",
  "admin:manage_platform",
];

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  student: STUDENT,
  recruiter: RECRUITER,
  // Placement officers also see analytics-grade student data, never recruiter
  // pipelines of a specific company and never admin user management.
  placement_officer: PLACEMENT,
  admin: ADMIN,
};

/** Capabilities that require an explicit admin role, never inherited. */
export const ADMIN_ONLY: readonly Capability[] = [
  "admin:manage_users",
  "admin:manage_roles",
  "admin:suspend_user",
  "admin:delete_user",
  "admin:read_audit_log",
  "admin:read_ai_usage",
  "admin:manage_platform",
];

export function can(roles: readonly Role[], capability: Capability): boolean {
  return roles.some((role) => ROLE_CAPABILITIES[role].includes(capability));
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: you don't have permission to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: please sign in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function assertCapability(roles: readonly Role[], capability: Capability): void {
  if (!can(roles, capability)) throw new ForbiddenError();
}

/** Highest-privilege role, used for display and audit records only. */
export function primaryRole(roles: readonly Role[]): Role {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("placement_officer")) return "placement_officer";
  if (roles.includes("recruiter")) return "recruiter";
  return "student";
}

/* ------------------------------------------------------------------ */
/* Tenant isolation                                                    */
/* ------------------------------------------------------------------ */

export type TenantScope =
  | { kind: "company"; companyId: string | null }
  | { kind: "college"; college: string | null }
  | { kind: "platform" }
  | { kind: "none" };

/**
 * Resolves the scope a caller may operate in from their *server-verified*
 * identity. A `claimedCompanyId` from the request is only ever accepted when it
 * equals the caller's actual company.
 */
export function resolveCompanyScope(
  actualCompanyId: string | null,
  claimedCompanyId?: string | null,
): string {
  if (!actualCompanyId) {
    throw new ForbiddenError("Forbidden: your account is not linked to a company yet");
  }
  if (claimedCompanyId && claimedCompanyId !== actualCompanyId) {
    throw new ForbiddenError("Forbidden: that organization is not yours");
  }
  return actualCompanyId;
}

/** Cross-tenant guard for a resource that carries a company id. */
export function assertSameCompany(
  callerCompanyId: string | null,
  resourceCompanyId: string | null | undefined,
  roles: readonly Role[] = [],
): void {
  if (roles.includes("admin")) return;
  if (!callerCompanyId || !resourceCompanyId || callerCompanyId !== resourceCompanyId) {
    throw new ForbiddenError("Forbidden: that resource belongs to another organization");
  }
}

/** Ownership guard for student-owned rows (resumes, applications, AI context). */
export function assertOwnsStudent(
  callerStudentId: string | null,
  resourceStudentId: string | null | undefined,
  roles: readonly Role[] = [],
): void {
  if (roles.includes("admin") || roles.includes("placement_officer")) return;
  if (!callerStudentId || !resourceStudentId || callerStudentId !== resourceStudentId) {
    throw new ForbiddenError("Forbidden: that record belongs to another student");
  }
}

/**
 * Placement officers are scoped to their own institution. Analytics rows for
 * other colleges must be filtered out server-side.
 */
export function assertSameCollege(
  callerCollege: string | null,
  resourceCollege: string | null | undefined,
  roles: readonly Role[] = [],
): void {
  if (roles.includes("admin")) return;
  if (!callerCollege || !resourceCollege || callerCollege !== resourceCollege) {
    throw new ForbiddenError("Forbidden: that institution is outside your scope");
  }
}
