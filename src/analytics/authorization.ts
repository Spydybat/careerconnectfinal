/**
 * Analytics authorization.
 *
 * Enforced in the query layer (server side), never by hiding UI. Two things
 * are checked for every request:
 *   1. Domain access — may this role read this dashboard at all?
 *   2. Row scope    — which rows may it see (forced filters merged last).
 */

import type { AnalyticsDomain, AuthorizationScope } from "./types";
import type { AnalyticsFilters } from "./filters";

export type AnalyticsRole = "student" | "recruiter" | "placement_officer" | "executive" | "admin";

export interface AnalyticsPrincipal {
  userId: string;
  roles: AnalyticsRole[];
  /** Company the recruiter is authorised for (warehouse business key). */
  companyId?: string | undefined;
  /** College the placement officer is authorised for. */
  collegeId?: string | undefined;
  /** Student business key for self-scoped analytics. */
  studentId?: string | undefined;
}

export interface Authorization {
  level: AuthorizationScope;
  description: string;
  forcedFilters: Partial<AnalyticsFilters>;
}

export class AnalyticsAuthorizationError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsAuthorizationError";
  }
}

const DOMAIN_ACCESS: Record<AnalyticsRole, readonly AnalyticsDomain[]> = {
  admin: [
    "executive",
    "placement",
    "recruiter",
    "skills",
    "salary",
    "jobs",
    "students",
    "learning",
  ],
  executive: [
    "executive",
    "placement",
    "recruiter",
    "skills",
    "salary",
    "jobs",
    "students",
    "learning",
  ],
  placement_officer: ["placement", "students", "learning", "skills", "jobs"],
  recruiter: ["recruiter", "jobs", "skills", "salary"],
  student: ["students", "learning", "skills", "jobs"],
};

const SCOPE_RANK: Record<AnalyticsRole, AuthorizationScope> = {
  admin: "platform",
  executive: "organization",
  placement_officer: "college",
  recruiter: "company",
  student: "self",
};

export function highestRole(roles: readonly AnalyticsRole[]): AnalyticsRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("executive")) return "executive";
  if (roles.includes("placement_officer")) return "placement_officer";
  if (roles.includes("recruiter")) return "recruiter";
  return "student";
}

export function allowedDomains(roles: readonly AnalyticsRole[]): AnalyticsDomain[] {
  const set = new Set<AnalyticsDomain>();
  for (const role of roles.length > 0 ? roles : (["student"] as AnalyticsRole[])) {
    for (const domain of DOMAIN_ACCESS[role] ?? []) set.add(domain);
  }
  return [...set];
}

export function canAccessDomain(roles: readonly AnalyticsRole[], domain: AnalyticsDomain): boolean {
  return allowedDomains(roles).includes(domain);
}

/**
 * Resolve the row-level scope for a principal. Forced filters are applied
 * AFTER user filters, so a caller cannot widen their own scope by sending
 * a conflicting filter value.
 */
export function authorize(principal: AnalyticsPrincipal, domain: AnalyticsDomain): Authorization {
  const roles = principal.roles.length > 0 ? principal.roles : (["student"] as AnalyticsRole[]);
  if (!canAccessDomain(roles, domain)) {
    throw new AnalyticsAuthorizationError(
      `Role ${highestRole(roles)} is not authorized for the ${domain} analytics domain.`,
    );
  }

  const role = highestRole(roles);
  const level = SCOPE_RANK[role];

  if (role === "admin") {
    return {
      level,
      description: "Platform-wide analytics across all colleges and companies.",
      forcedFilters: {},
    };
  }
  if (role === "executive") {
    return { level, description: "Organization-wide analytics.", forcedFilters: {} };
  }
  if (role === "placement_officer") {
    if (!principal.collegeId) {
      throw new AnalyticsAuthorizationError(
        "No college is linked to this placement officer account, so college-scoped analytics cannot be served.",
      );
    }
    return {
      level,
      description: `Scoped to college ${principal.collegeId}.`,
      forcedFilters: { college: principal.collegeId },
    };
  }
  if (role === "recruiter") {
    if (!principal.companyId) {
      throw new AnalyticsAuthorizationError(
        "No company is linked to this recruiter account, so company-scoped analytics cannot be served.",
      );
    }
    return {
      level,
      description: `Scoped to company ${principal.companyId}.`,
      forcedFilters: { company: principal.companyId },
    };
  }

  if (!principal.studentId) {
    throw new AnalyticsAuthorizationError(
      "No student record is linked to this account, so personal analytics cannot be served.",
    );
  }
  return {
    level,
    description: "Personal analytics only — restricted to your own records.",
    forcedFilters: { student: principal.studentId },
  };
}
