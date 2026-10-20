import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, Database, Gauge } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOperationsSnapshot } from "@/lib/operations.functions";
import type { HealthStatus } from "@/observability/types";

export const Route = createFileRoute("/_authenticated/admin/operations")({
  head: () => ({
    meta: [
      { title: "Operations console — Career Connect admin" },
      {
        name: "description",
        content:
          "System health, request metrics, pipeline runs, warehouse freshness, AI reliability and security signals.",
      },
      { property: "og:title", content: "Operations console — Career Connect admin" },
      {
        property: "og:description",
        content: "Operational health of the Career Connect platform in one place.",
      },
    ],
  }),
  component: AdminOperations,
});

const TONE: Record<HealthStatus, "default" | "secondary" | "destructive"> = {
  healthy: "default",
  degraded: "secondary",
  unhealthy: "destructive",
};

const ms = (value: number) => `${Math.round(value)} ms`;
const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;
const ago = (iso: string) => {
  const delta = Date.now() - Date.parse(iso);
  if (!Number.isFinite(delta)) return "unknown";
  const hours = delta / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(delta / 60_000))} min ago`;
  if (hours < 48) return `${Math.round(hours)} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function AdminOperations() {
  const fetchSnapshot = useServerFn(getOperationsSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "operations"],
    queryFn: () => fetchSnapshot(),
    refetchInterval: 60_000,
  });

  const firing = (data?.alerts ?? []).filter((alert) => alert.firing);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Operations console"
        description="Operational health only — application, database, pipelines, warehouse, BI, AI, storage and security."
      />

      {isLoading ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">Collecting signals…</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="System status" value={data?.status ?? "—"} icon={Activity} />
        <KpiCard
          label="Requests (window)"
          value={data?.application.requests ?? 0}
          hint={`error rate ${pct(data?.application.errorRate ?? 0)}`}
          icon={Gauge}
        />
        <KpiCard
          label="Request p95"
          value={ms(data?.application.latency.p95 ?? 0)}
          hint={`p50 ${ms(data?.application.latency.p50 ?? 0)} · p99 ${ms(data?.application.latency.p99 ?? 0)}`}
        />
        <KpiCard
          label="Firing alerts"
          value={firing.length}
          tone={firing.length > 0 ? "accent" : "success"}
          icon={AlertTriangle}
        />
      </div>

      <Section title="System health">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="text-right">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.components ?? []).map((component) => (
              <TableRow key={component.component}>
                <TableCell className="font-medium">{component.component}</TableCell>
                <TableCell>
                  <Badge variant={TONE[component.status]}>{component.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{component.detail}</TableCell>
                <TableCell className="text-right">
                  {component.latency_ms == null ? "—" : ms(component.latency_ms)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Application">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Reqs</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">p95</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.application.routes ?? []).slice(0, 8).map((route) => (
                <TableRow key={`${route.method} ${route.route}`}>
                  <TableCell className="font-mono text-xs">
                    {route.method} {route.route}
                  </TableCell>
                  <TableCell className="text-right">{route.requests}</TableCell>
                  <TableCell className="text-right">{route.errors}</TableCell>
                  <TableCell className="text-right">{ms(route.latency.p95)}</TableCell>
                </TableRow>
              ))}
              {(data?.application.routes ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No requests recorded in the current window.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Section>

        <Section title="Database">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{data?.database.status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Probe p95</dt>
              <dd className="font-medium">{ms(data?.database.latency.p95 ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Connection failures</dt>
              <dd className="font-medium">{data?.database.failures ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Slow queries (&gt;{data?.database.slow_query_threshold_ms ?? 0}ms)
              </dt>
              <dd className="font-medium">{data?.database.slow_queries ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Migrations</dt>
              <dd className="font-medium">{data?.database.migration_status ?? "unknown"}</dd>
            </div>
          </dl>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="ETL">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Run</dt>
              <dd className="font-mono text-xs">{data?.etl.run_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={data?.etl.status === "SUCCESS" ? "default" : "secondary"}>
                  {data?.etl.status ?? "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="font-medium">{ms(data?.etl.duration_ms ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Watermark</dt>
              <dd className="font-mono text-xs">{data?.etl.watermark ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Input → processed</dt>
              <dd className="font-medium">
                {data?.etl.input_records ?? 0} → {data?.etl.processed_records ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rejected / quarantined</dt>
              <dd className="font-medium">
                {data?.etl.rejected_records ?? 0} / {data?.etl.quarantined_records ?? 0}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Data quality">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Score</dt>
              <dd className="font-medium">{data?.quality.score ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Failing rules</dt>
              <dd className="font-medium">{data?.quality.rules_failed ?? 0}</dd>
            </div>
          </dl>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Dimension</TableHead>
                <TableHead className="text-right">Rules</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.quality.dimensions ?? []).map((dimension) => (
                <TableRow key={dimension.dimension}>
                  <TableCell>{dimension.dimension.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right">{dimension.rules}</TableCell>
                  <TableCell className="text-right">{dimension.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Warehouse &amp; BI freshness">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Freshness</dt>
              <dd>
                <Badge variant={data?.warehouse.status === "fresh" ? "default" : "secondary"}>
                  {data?.warehouse.status ?? "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last successful load</dt>
              <dd className="font-medium">{data ? ago(data.warehouse.last_updated) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data through</dt>
              <dd className="font-mono text-xs">{data?.warehouse.data_through ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Refresh duration</dt>
              <dd className="font-medium">{ms(data?.warehouse.refresh_duration_ms ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mart status</dt>
              <dd className="font-medium">{data?.warehouse.mart_status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">BI query time</dt>
              <dd className="font-medium">{ms(data?.bi.query_duration_ms ?? 0)}</dd>
            </div>
          </dl>
        </Section>

        <Section title="AI">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Requests ({data?.ai.window_hours ?? 24}h)</dt>
              <dd className="font-medium">{data?.ai.requests ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Success rate</dt>
              <dd className="font-medium">{pct(data?.ai.successRate ?? 1)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Latency p95</dt>
              <dd className="font-medium">{ms(data?.ai.latency.p95 ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estimated cost</dt>
              <dd className="font-medium">${(data?.ai.costUsd ?? 0).toFixed(2)}</dd>
            </div>
          </dl>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Reqs</TableHead>
                <TableHead className="text-right">p95</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.ai.providers ?? []).map((provider) => (
                <TableRow key={provider.key}>
                  <TableCell>{provider.key}</TableCell>
                  <TableCell>
                    <Badge variant={TONE[provider.health]}>{provider.health}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{provider.requests}</TableCell>
                  <TableCell className="text-right">{ms(provider.latency.p95)}</TableCell>
                </TableRow>
              ))}
              {(data?.ai.providers ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    No AI traffic in the window.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Storage">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Objects</TableHead>
                <TableHead className="text-right">Failures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.storage.areas ?? []).map((area) => (
                <TableRow key={area.area}>
                  <TableCell className="capitalize">{area.area}</TableCell>
                  <TableCell>
                    <Badge variant={TONE[area.status]}>{area.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{area.objects}</TableCell>
                  <TableCell className="text-right">
                    {area.upload_failures + area.download_failures}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Security">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Auth failures</dt>
              <dd className="font-medium">{data?.security.auth_failures ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Authorization denials</dt>
              <dd className="font-medium">{data?.security.authorization_failures ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rate-limit violations</dt>
              <dd className="font-medium">{data?.security.rate_limit_violations ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rejected uploads</dt>
              <dd className="font-medium">{data?.security.suspicious_uploads ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cross-tenant attempts</dt>
              <dd className="font-medium">{data?.security.cross_tenant_attempts ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Admin security events</dt>
              <dd className="font-medium">{data?.security.admin_security_events ?? 0}</dd>
            </div>
          </dl>
        </Section>
      </div>

      <Section title="Alerts">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alert</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.alerts ?? []).map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">{alert.title}</TableCell>
                <TableCell>{alert.severity}</TableCell>
                <TableCell>
                  <Badge variant={alert.firing ? "destructive" : "outline"}>
                    {alert.firing ? "firing" : "ok"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{alert.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <p className="text-xs text-muted-foreground">
        <Database className="mr-1 inline h-3 w-3" />
        Snapshot generated {data ? ago(data.generated_at) : "—"} · environment{" "}
        {data?.environment ?? "—"}
      </p>
    </div>
  );
}
