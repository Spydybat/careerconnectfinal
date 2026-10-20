import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAuditEvents, type AuditPage } from "@/lib/audit.functions";
import { formatDateTime } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit logs — Career Connect admin" },
      {
        name: "description",
        content: "Activity timeline, login history, admin actions and security events.",
      },
      { property: "og:title", content: "Audit logs — Career Connect admin" },
      {
        property: "og:description",
        content: "Trace every privileged action and security event on the platform.",
      },
    ],
  }),
  component: AdminAudit,
});

const ALL = "all";
const PAGE_SIZE = 15;

const CATEGORIES = [
  "auth",
  "access",
  "user_management",
  "job",
  "application",
  "interview",
  "offer",
  "placement",
  "ai",
  "security",
  "admin",
] as const;

const SEVERITIES = ["info", "notice", "warning", "critical"] as const;

const VIEWS = [
  { value: "timeline", label: "Activity timeline", category: ALL },
  { value: "all", label: "All events", category: ALL },
  { value: "auth", label: "Login history", category: "auth" },
  { value: "user_management", label: "User management", category: "user_management" },
  { value: "admin", label: "Admin actions", category: "admin" },
  { value: "security", label: "Security events", category: "security" },
] as const;

type Filters = {
  page: number;
  category?: (typeof CATEGORIES)[number];
  severity?: (typeof SEVERITIES)[number];
  search?: string;
};

const SEVERITY_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary",
  notice: "default",
  warning: "outline",
  critical: "destructive",
};

function AdminAudit() {
  const fetchAudit = useServerFn(listAuditEvents);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [severity, setSeverity] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("timeline");

  const viewCategory = VIEWS.find((v) => v.value === view)?.category ?? ALL;
  const effectiveCategory =
    viewCategory !== ALL ? viewCategory : category !== ALL ? category : undefined;

  const filters: Filters = {
    page,
    ...(effectiveCategory ? { category: effectiveCategory as (typeof CATEGORIES)[number] } : {}),
    ...(severity !== ALL ? { severity: severity as (typeof SEVERITIES)[number] } : {}),
    ...(q.trim() ? { search: q.trim() } : {}),
  };

  const query = useQuery<AuditPage>({
    queryKey: ["audit-events", filters],
    queryFn: () =>
      fetchAudit({
        data: {
          pagination: { page: filters.page, pageSize: PAGE_SIZE },
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.severity ? { severity: filters.severity } : {}),
          ...(filters.search ? { search: filters.search } : {}),
        },
      }),
  });

  const counts = useQuery({
    queryKey: ["audit-counts"],
    queryFn: async () => {
      const head = (extra: Record<string, string>) =>
        fetchAudit({ data: { pagination: { page: 1, pageSize: 1 }, ...extra } }).then(
          (r) => r.total,
        );
      const [total, logins, admin, critical] = await Promise.all([
        head({}),
        head({ category: "auth" }),
        head({ category: "admin" }),
        head({ severity: "critical" }),
      ]);
      return { total, logins, admin, critical };
    },
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function reset(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Audit logs"
        description="Immutable trail of authentication, administrative and security events."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total events" value={counts.data?.total ?? 0} />
        <KpiCard label="Login events" value={counts.data?.logins ?? 0} tone="accent" />
        <KpiCard label="Admin actions" value={counts.data?.admin ?? 0} />
        <KpiCard label="Critical events" value={counts.data?.critical ?? 0} icon={ShieldAlert} />
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => reset(() => setView(v.value))}
            className={
              view === v.value
                ? "whitespace-nowrap rounded-lg bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                : "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className="surface-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => reset(() => setQ(e.target.value))}
              placeholder="Search action, e.g. user.roles_changed"
              className="pl-9"
            />
          </div>
          <Select
            value={category}
            onValueChange={(v) => reset(() => setCategory(v))}
            disabled={viewCategory !== ALL}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(v) => reset(() => setSeverity(v))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All severities</SelectItem>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isError ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          Unable to load audit events.
        </div>
      ) : query.isLoading ? (
        <div className="surface-card flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading audit trail…
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          No audit entries match your filters.
        </div>
      ) : view === "timeline" ? (
        <div className="surface-card p-6">
          <ol className="relative space-y-6 border-l border-border pl-6">
            {rows.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={
                    e.outcome === "success"
                      ? "absolute -left-[1.65rem] top-1.5 size-3 rounded-full bg-primary"
                      : "absolute -left-[1.65rem] top-1.5 size-3 rounded-full bg-destructive"
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{e.action}</p>
                  <Badge variant="secondary" className="capitalize">
                    {e.category.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant={SEVERITY_TONE[e.severity] ?? "secondary"}>{e.severity}</Badge>
                  <Badge variant={e.outcome === "success" ? "default" : "destructive"}>
                    {e.outcome}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {e.actorName}
                  {e.actorRole ? ` · ${e.actorRole.replace(/_/g, " ")}` : ""}
                  {e.entityType ? ` · ${e.entityType}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(e.occurredAt)}
                  {e.requestId ? ` · req ${e.requestId.slice(0, 8)}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(e.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{e.actorName}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {e.actorRole?.replace(/_/g, " ") ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.entityType ?? "—"}
                    {e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {e.category.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_TONE[e.severity] ?? "secondary"}>{e.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.outcome === "success" ? "default" : "destructive"}>
                      {e.outcome}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount} · {total} events
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
