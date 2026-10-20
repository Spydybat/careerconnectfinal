import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { PERMISSIONS, ROLE_PERMISSIONS, useAdminUsers, useSetUserRoles } from "@/lib/admin";
import { ROLE_LABELS, type AppRole } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & permissions — Career Connect admin" },
      {
        name: "description",
        content: "Platform roles, their permission matrix and how many accounts hold each role.",
      },
      { property: "og:title", content: "Roles & permissions — Career Connect admin" },
      {
        property: "og:description",
        content: "Understand exactly what students, recruiters, officers and admins can do.",
      },
    ],
  }),
  component: AdminRoles,
});

const ROLES: AppRole[] = ["student", "recruiter", "placement_officer", "admin"];

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  student: "Builds a profile, analyses resumes, explores careers and applies to jobs.",
  recruiter: "Publishes roles for their company and runs the hiring pipeline.",
  placement_officer: "Runs campus placements, drives and verifies placement records.",
  admin: "Full platform control including users, organizations and configuration.",
};

function AdminRoles() {
  const { data, isLoading } = useAdminUsers();
  const users = data ?? [];
  const setRoles = useSetUserRoles();

  const counts = useMemo(() => {
    const map = new Map<AppRole, number>(ROLES.map((r) => [r, 0]));
    for (const u of users) for (const r of u.roles) map.set(r, (map.get(r) ?? 0) + 1);
    return map;
  }, [users]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Roles & permissions"
        description="Roles are enforced in the database through a dedicated role table and security-definer checks."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">Assign roles</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <div key={role} className="surface-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold">{ROLE_LABELS[role]}</h2>
              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : (
                <Badge variant="secondary">{counts.get(role) ?? 0} users</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {ROLE_PERMISSIONS[role].map((p) => (
                <Badge key={p} variant="outline">
                  {PERMISSIONS.find((x) => x.key === p)?.label ?? p}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card p-5">
        <h2 className="font-display text-lg font-semibold">Role assignment</h2>
        <p className="text-sm text-muted-foreground">
          Toggle roles for an account. Changes apply immediately.
        </p>
        {isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {users.slice(0, 8).map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-48">
                  <p className="text-sm font-medium">{u.fullName || u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => {
                    const has = u.roles.includes(role);
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        disabled={setRoles.isPending}
                        onClick={() =>
                          setRoles.mutate(
                            {
                              userId: u.id,
                              roles: has ? u.roles.filter((r) => r !== role) : [...u.roles, role],
                            },
                            {
                              onSuccess: () =>
                                toast.success(
                                  `${has ? "Removed" : "Assigned"} ${ROLE_LABELS[role]}`,
                                ),
                              onError: () => toast.error("Could not update roles"),
                            },
                          )
                        }
                      >
                        {ROLE_LABELS[role]}
                      </Button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="surface-card overflow-x-auto">
        <div className="p-5 pb-0">
          <h2 className="font-display text-lg font-semibold">Permission matrix</h2>
          <p className="text-sm text-muted-foreground">Capability coverage per platform role.</p>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center">
                  {ROLE_LABELS[r]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((p) => (
              <TableRow key={p.key}>
                <TableCell className="font-medium">{p.label}</TableCell>
                {ROLES.map((r) => (
                  <TableCell key={r} className="text-center">
                    {ROLE_PERMISSIONS[r].includes(p.key) ? (
                      <Check className="mx-auto size-4 text-success" />
                    ) : (
                      <Minus className="mx-auto size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
