import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminUserRow, AppRole } from "@/lib/admin.server";

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const count = async (table: string, filter?: { col: string; val: string }) => {
      let q = supabaseAdmin.from(table as never).select("*", { count: "exact", head: true });
      if (filter) q = q.eq(filter.col, filter.val);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [
      profiles,
      students,
      recruiters,
      companies,
      jobs,
      openJobs,
      applications,
      placements,
      resumes,
      analyzedResumes,
      colleges,
      recentApps,
      recentJobs,
      recentPlacements,
    ] = await Promise.all([
      count("profiles"),
      count("students"),
      count("recruiters"),
      count("companies"),
      count("jobs"),
      count("jobs", { col: "status", val: "open" }),
      count("applications"),
      count("placements"),
      count("resumes"),
      supabaseAdmin
        .from("resumes")
        .select("*", { count: "exact", head: true })
        .not("analyzed_at", "is", null)
        .then((r) => r.count ?? 0),
      supabaseAdmin
        .from("students")
        .select("college")
        .not("college", "is", null)
        .then((r) => new Set((r.data ?? []).map((s) => s.college)).size),
      supabaseAdmin
        .from("applications")
        .select("id, status, applied_at, jobs(title, companies(name))")
        .order("applied_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("jobs")
        .select("id, title, created_at, companies(name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("placements")
        .select("id, role_title, placement_date, ctc, companies(name)")
        .order("placement_date", { ascending: false })
        .limit(8),
    ]);

    const activity = [
      ...(recentApps.data ?? []).map((a) => ({
        id: `app-${a.id}`,
        kind: "application" as const,
        title: `Application ${a.status} — ${a.jobs?.title ?? "role"}`,
        subtitle: a.jobs?.companies?.name ?? "",
        at: a.applied_at,
      })),
      ...(recentJobs.data ?? []).map((j) => ({
        id: `job-${j.id}`,
        kind: "job" as const,
        title: `Job published — ${j.title}`,
        subtitle: j.companies?.name ?? "",
        at: j.created_at,
      })),
      ...(recentPlacements.data ?? []).map((p) => ({
        id: `plc-${p.id}`,
        kind: "placement" as const,
        title: `Placement recorded — ${p.role_title}`,
        subtitle: p.companies?.name ?? "",
        at: p.placement_date,
      })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 12);

    return {
      counts: {
        users: profiles,
        students,
        recruiters,
        companies,
        colleges,
        jobs,
        openJobs,
        applications,
        placements,
        resumes,
        aiRequests: analyzedResumes,
      },
      activity,
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: authData, error: authError }, rolesRes, profilesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("id, full_name, email"),
    ]);
    if (authError) throw authError;

    const rolesByUser = new Map<string, AppRole[]>();
    for (const r of rolesRes.data ?? []) {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as AppRole]);
    }
    const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));

    return authData.users.map((u) => {
      const bannedUntil = (u as { banned_until?: string | null }).banned_until ?? null;
      const suspended = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
      return {
        id: u.id,
        email: u.email ?? null,
        fullName: nameById.get(u.id) || (u.user_metadata?.["full_name"] as string) || "" || "—",
        roles: rolesByUser.get(u.id) ?? [],
        status: suspended ? ("suspended" as const) : ("active" as const),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmed: !!u.email_confirmed_at,
      };
    });
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(1),
        role: z.enum(["student", "recruiter", "placement_officer", "admin"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { auditOutcome } = await import("@/lib/audit.server");
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("admin", context.userId, "admin-write");

    return auditOutcome(
      {
        action: "user.created",
        actorId: context.userId,
        actorRole: "admin",
        entityType: "user",
        metadata: { role: data.role },
      },
      async () => {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { full_name: data.fullName, role: data.role },
        });
        if (error) throw error;
        return { id: created.user?.id ?? null };
      },
    );
  });

export const adminSetUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["student", "recruiter", "placement_officer", "admin"])).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { auditOutcome } = await import("@/lib/audit.server");
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("admin", context.userId, "admin-write");

    return auditOutcome(
      {
        action: "user.roles_changed",
        actorId: context.userId,
        actorRole: "admin",
        entityType: "user",
        entityId: data.userId,
        metadata: { roles: data.roles.join(",") },
      },
      async () => {
        const { error: delError } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", data.userId);
        if (delError) throw delError;
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert(data.roles.map((role) => ({ user_id: data.userId, role })));
        if (error) throw error;
        return { ok: true };
      },
    );
  });

export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot suspend your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { auditOutcome } = await import("@/lib/audit.server");
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("admin", context.userId, "admin-write");

    return auditOutcome(
      {
        action: data.suspended ? "user.suspended" : "user.reinstated",
        actorId: context.userId,
        actorRole: "admin",
        entityType: "user",
        entityId: data.userId,
      },
      async () => {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
          ban_duration: data.suspended ? "876000h" : "none",
        });
        if (error) throw error;
        return { ok: true };
      },
    );
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { auditOutcome } = await import("@/lib/audit.server");
    const { assertRateLimit } = await import("@/lib/rate-limit.server");
    assertRateLimit("admin", context.userId, "admin-write");

    return auditOutcome(
      {
        action: "user.deleted",
        actorId: context.userId,
        actorRole: "admin",
        entityType: "user",
        entityId: data.userId,
      },
      async () => {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
        if (error) throw error;
        return { ok: true };
      },
    );
  });

export const adminOrganizations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [companiesRes, jobsRes, recruitersRes, studentsRes, placementsRes] = await Promise.all([
      supabaseAdmin.from("companies").select("*").order("name"),
      supabaseAdmin.from("jobs").select("id, company_id, status"),
      supabaseAdmin.from("recruiters").select("id, company_id"),
      supabaseAdmin.from("students").select("id, college, branch, graduation_year"),
      supabaseAdmin.from("placements").select("id, company_id, ctc"),
    ]);

    const jobs = jobsRes.data ?? [];
    const recruiters = recruitersRes.data ?? [];
    const placements = placementsRes.data ?? [];

    const companies = (companiesRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      industry: c.industry,
      headquarters: c.headquarters,
      website: c.website,
      description: c.description,
      createdAt: c.created_at,
      jobs: jobs.filter((j) => j.company_id === c.id).length,
      openJobs: jobs.filter((j) => j.company_id === c.id && j.status === "open").length,
      recruiters: recruiters.filter((r) => r.company_id === c.id).length,
      hires: placements.filter((p) => p.company_id === c.id).length,
    }));

    const collegeMap = new Map<
      string,
      { students: number; branches: Set<string>; batches: Set<number> }
    >();
    for (const s of studentsRes.data ?? []) {
      if (!s.college) continue;
      const entry = collegeMap.get(s.college) ?? {
        students: 0,
        branches: new Set<string>(),
        batches: new Set<number>(),
      };
      entry.students += 1;
      if (s.branch) entry.branches.add(s.branch);
      if (s.graduation_year) entry.batches.add(s.graduation_year);
      collegeMap.set(s.college, entry);
    }
    const colleges = Array.from(collegeMap.entries())
      .map(([name, v]) => ({
        name,
        students: v.students,
        branches: Array.from(v.branches).sort(),
        batches: Array.from(v.batches).sort((a, b) => b - a),
      }))
      .sort((a, b) => b.students - a.students);

    return { companies, colleges };
  });
