import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminOrganizations,
  adminOverview,
  adminSetUserRoles,
  adminSetUserStatus,
} from "@/lib/admin.functions";
import type { AppRole } from "@/lib/session";

export function useAdminOverview() {
  const fn = useServerFn(adminOverview);
  return useQuery({ queryKey: ["admin", "overview"], queryFn: () => fn() });
}

export function useAdminUsers() {
  const fn = useServerFn(adminListUsers);
  return useQuery({ queryKey: ["admin", "users"], queryFn: () => fn() });
}

export function useAdminOrganizations() {
  const fn = useServerFn(adminOrganizations);
  return useQuery({ queryKey: ["admin", "organizations"], queryFn: () => fn() });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin"] });
}

export function useCreateUser() {
  const fn = useServerFn(adminCreateUser);
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { email: string; password: string; fullName: string; role: AppRole }) =>
      fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useSetUserRoles() {
  const fn = useServerFn(adminSetUserRoles);
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { userId: string; roles: AppRole[] }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useSetUserStatus() {
  const fn = useServerFn(adminSetUserStatus);
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { userId: string; suspended: boolean }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const fn = useServerFn(adminDeleteUser);
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { userId: string }) => fn({ data: input }),
    onSuccess: invalidate,
  });
}

/* ------------------------------------------------------------------ */
/* Telemetry, audit and platform config are not yet backed by tables.   */
/* Deterministic mock data keeps the admin console demonstrable.        */
/* ------------------------------------------------------------------ */

export const DAILY_ACTIVE_USERS = [
  { day: "Mon", users: 412, sessions: 780 },
  { day: "Tue", users: 468, sessions: 903 },
  { day: "Wed", users: 501, sessions: 988 },
  { day: "Thu", users: 487, sessions: 941 },
  { day: "Fri", users: 552, sessions: 1104 },
  { day: "Sat", users: 318, sessions: 566 },
  { day: "Sun", users: 289, sessions: 501 },
];

export const MONTHLY_REGISTRATIONS = [
  { month: "Mar", students: 210, recruiters: 18 },
  { month: "Apr", students: 264, recruiters: 24 },
  { month: "May", students: 301, recruiters: 22 },
  { month: "Jun", students: 388, recruiters: 31 },
  { month: "Jul", students: 442, recruiters: 37 },
  { month: "Aug", students: 496, recruiters: 44 },
];

export const GROWTH_TREND = [
  { month: "Mar", users: 1180, jobs: 84, placements: 21 },
  { month: "Apr", users: 1462, jobs: 106, placements: 34 },
  { month: "May", users: 1785, jobs: 129, placements: 46 },
  { month: "Jun", users: 2204, jobs: 158, placements: 63 },
  { month: "Jul", users: 2683, jobs: 191, placements: 88 },
  { month: "Aug", users: 3223, jobs: 224, placements: 117 },
];

export const AI_DAILY_USAGE = [
  { day: "Mon", requests: 184, failures: 3, tokens: 412_000 },
  { day: "Tue", requests: 226, failures: 5, tokens: 501_000 },
  { day: "Wed", requests: 259, failures: 2, tokens: 578_000 },
  { day: "Thu", requests: 241, failures: 6, tokens: 540_000 },
  { day: "Fri", requests: 302, failures: 4, tokens: 668_000 },
  { day: "Sat", requests: 128, failures: 1, tokens: 279_000 },
  { day: "Sun", requests: 96, failures: 0, tokens: 208_000 },
];

export const AI_MODEL_DISTRIBUTION = [
  { name: "gemini-3.5-flash", value: 68, costUsd: 41.2 },
  { name: "gemini-3-pro", value: 21, costUsd: 96.5 },
  { name: "gpt-5-mini", value: 11, costUsd: 18.4 },
];

export const AI_PROVIDERS = [
  {
    provider: "Lovable AI Gateway",
    requests: 1436,
    tokens: 3_186_000,
    costUsd: 156.1,
    status: "operational",
  },
  {
    provider: "Embeddings service",
    requests: 402,
    tokens: 214_000,
    costUsd: 6.3,
    status: "operational",
  },
];

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  actorRole: AppRole;
  action: string;
  target: string;
  category: "auth" | "admin" | "security" | "data";
  ip: string;
  result: "success" | "failure";
};

export const AUDIT_LOG: AuditEntry[] = [
  {
    id: "a1",
    at: "2026-08-08T06:41:00Z",
    actor: "priya.admin@careerconnect.io",
    actorRole: "admin",
    action: "Suspended user account",
    target: "rahul.k@student.edu",
    category: "admin",
    ip: "103.21.44.9",
    result: "success",
  },
  {
    id: "a2",
    at: "2026-08-08T06:12:00Z",
    actor: "system",
    actorRole: "admin",
    action: "Nightly backup completed",
    target: "primary-db",
    category: "data",
    ip: "internal",
    result: "success",
  },
  {
    id: "a3",
    at: "2026-08-08T05:58:00Z",
    actor: "neha@fintrail.example",
    actorRole: "recruiter",
    action: "Signed in with Google",
    target: "session",
    category: "auth",
    ip: "49.36.181.4",
    result: "success",
  },
  {
    id: "a4",
    at: "2026-08-08T05:30:00Z",
    actor: "unknown",
    actorRole: "student",
    action: "Failed sign-in attempt (x5)",
    target: "arun@student.edu",
    category: "security",
    ip: "185.220.101.7",
    result: "failure",
  },
  {
    id: "a5",
    at: "2026-08-07T18:22:00Z",
    actor: "priya.admin@careerconnect.io",
    actorRole: "admin",
    action: "Enabled feature flag",
    target: "ai_resume_rewrite",
    category: "admin",
    ip: "103.21.44.9",
    result: "success",
  },
  {
    id: "a6",
    at: "2026-08-07T16:05:00Z",
    actor: "placement@college.edu",
    actorRole: "placement_officer",
    action: "Verified placement record",
    target: "PLC-2041",
    category: "data",
    ip: "14.98.22.130",
    result: "success",
  },
  {
    id: "a7",
    at: "2026-08-07T12:44:00Z",
    actor: "ritu@nimbus.example",
    actorRole: "recruiter",
    action: "Downloaded applicant resume",
    target: "RES-8871",
    category: "security",
    ip: "52.66.14.201",
    result: "success",
  },
  {
    id: "a8",
    at: "2026-08-07T09:10:00Z",
    actor: "priya.admin@careerconnect.io",
    actorRole: "admin",
    action: "Created recruiter account",
    target: "arjun@orbital.example",
    category: "admin",
    ip: "103.21.44.9",
    result: "success",
  },
];

export type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: string;
};

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: "ai_resume_rewrite",
    label: "AI resume rewrite",
    description: "Let students generate an AI-rewritten resume draft.",
    enabled: true,
    rollout: "All students",
  },
  {
    key: "campus_drives",
    label: "Campus drives",
    description: "Placement cell drive scheduling and registrations.",
    enabled: true,
    rollout: "Placement officers",
  },
  {
    key: "recruiter_bulk_actions",
    label: "Recruiter bulk actions",
    description: "Bulk status changes across the applicant pipeline.",
    enabled: false,
    rollout: "Beta cohort",
  },
  {
    key: "salary_insights",
    label: "Salary insights",
    description: "Show market salary benchmarks on career pages.",
    enabled: true,
    rollout: "All users",
  },
  {
    key: "public_company_pages",
    label: "Public company pages",
    description: "Expose employer profiles without sign-in.",
    enabled: false,
    rollout: "Disabled",
  },
];

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "All users" | "Students" | "Recruiters" | "Placement officers";
  status: "published" | "scheduled" | "draft";
  publishedAt: string;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "an1",
    title: "Autumn placement season opens",
    body: "Campus drive registrations are live for the 2026 batch.",
    audience: "Students",
    status: "published",
    publishedAt: "2026-08-05",
  },
  {
    id: "an2",
    title: "Recruiter analytics refresh",
    body: "Funnel analytics now update hourly instead of daily.",
    audience: "Recruiters",
    status: "published",
    publishedAt: "2026-08-02",
  },
  {
    id: "an3",
    title: "Scheduled maintenance",
    body: "Platform will be read-only on 20 Aug, 01:00–02:00 IST.",
    audience: "All users",
    status: "scheduled",
    publishedAt: "2026-08-20",
  },
];

export const PERMISSIONS = [
  { key: "view_jobs", label: "Browse jobs" },
  { key: "apply_jobs", label: "Apply to jobs" },
  { key: "manage_jobs", label: "Publish & manage jobs" },
  { key: "view_candidates", label: "View applicant profiles" },
  { key: "manage_pipeline", label: "Move candidates in pipeline" },
  { key: "view_placements", label: "View placement records" },
  { key: "verify_placements", label: "Verify placement records" },
  { key: "manage_users", label: "Manage user accounts" },
  { key: "manage_platform", label: "Platform configuration" },
  { key: "view_audit", label: "View audit logs" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ROLE_PERMISSIONS: Record<AppRole, PermissionKey[]> = {
  student: ["view_jobs", "apply_jobs"],
  recruiter: ["view_jobs", "manage_jobs", "view_candidates", "manage_pipeline"],
  placement_officer: ["view_jobs", "view_candidates", "view_placements", "verify_placements"],
  admin: PERMISSIONS.map((p) => p.key),
};

export const SYSTEM_SERVICES = [
  { name: "Web application", status: "operational" as const, latencyMs: 118, uptime: "99.98%" },
  {
    name: "Server functions API",
    status: "operational" as const,
    latencyMs: 164,
    uptime: "99.95%",
  },
  { name: "Database (Postgres)", status: "operational" as const, latencyMs: 22, uptime: "99.99%" },
  { name: "Object storage", status: "operational" as const, latencyMs: 87, uptime: "99.97%" },
  { name: "Auth service", status: "operational" as const, latencyMs: 96, uptime: "99.99%" },
  { name: "AI gateway", status: "degraded" as const, latencyMs: 1420, uptime: "99.41%" },
];

export const BACKGROUND_JOBS = [
  {
    name: "Resume analysis queue",
    schedule: "on demand",
    lastRun: "2 min ago",
    queued: 3,
    status: "running" as const,
  },
  {
    name: "Match score refresh",
    schedule: "every 30 min",
    lastRun: "12 min ago",
    queued: 0,
    status: "idle" as const,
  },
  {
    name: "Placement digest email",
    schedule: "daily 07:00",
    lastRun: "6 h ago",
    queued: 0,
    status: "idle" as const,
  },
  {
    name: "Storage cleanup",
    schedule: "weekly",
    lastRun: "3 d ago",
    queued: 0,
    status: "idle" as const,
  },
  {
    name: "Audit log archival",
    schedule: "daily 02:00",
    lastRun: "11 h ago",
    queued: 1,
    status: "idle" as const,
  },
];

export const ERROR_RATE_TREND = [
  { day: "Mon", errors: 0.4 },
  { day: "Tue", errors: 0.6 },
  { day: "Wed", errors: 0.3 },
  { day: "Thu", errors: 1.1 },
  { day: "Fri", errors: 0.5 },
  { day: "Sat", errors: 0.2 },
  { day: "Sun", errors: 0.2 },
];

export const STORAGE_USAGE = [
  { bucket: "resumes", usedGb: 12.4, quotaGb: 50 },
  { bucket: "company-logos", usedGb: 1.8, quotaGb: 10 },
  { bucket: "exports", usedGb: 4.1, quotaGb: 20 },
];

export const TRAINING_INSTITUTES = [
  {
    name: "SkillForge Academy",
    focus: "Full-stack engineering",
    learners: 480,
    partnerSince: "2024",
    status: "active",
  },
  {
    name: "DataCraft Institute",
    focus: "Data & analytics",
    learners: 265,
    partnerSince: "2025",
    status: "active",
  },
  {
    name: "CloudNine Labs",
    focus: "Cloud & DevOps",
    learners: 172,
    partnerSince: "2025",
    status: "onboarding",
  },
];

export const APP_SETTINGS = [
  { key: "platform_name", label: "Platform name", value: "Career Connect" },
  { key: "support_email", label: "Support email", value: "support@careerconnect.io" },
  { key: "min_eligible_cgpa", label: "Minimum eligible CGPA", value: "6.0" },
  { key: "resume_max_mb", label: "Max resume size (MB)", value: "8" },
  { key: "application_window_days", label: "Default application window (days)", value: "30" },
  { key: "session_timeout_min", label: "Session timeout (minutes)", value: "60" },
];

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SYSTEM_CONFIG = [
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    description: "Show a maintenance screen to non-admins.",
    enabled: false,
  },
  {
    key: "signups_open",
    label: "Public sign-ups",
    description: "Allow new accounts to self-register.",
    enabled: true,
  },
  {
    key: "email_notifications",
    label: "Transactional email",
    description: "Send application and drive notifications.",
    enabled: true,
  },
  {
    key: "ai_gateway",
    label: "AI gateway",
    description: "Enable AI resume and career features platform-wide.",
    enabled: true,
  },
  {
    key: "audit_retention",
    label: "Extended audit retention",
    description: "Keep audit events for 24 months instead of 6.",
    enabled: true,
  },
];
