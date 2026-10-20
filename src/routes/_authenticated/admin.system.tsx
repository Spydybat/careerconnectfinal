import { createFileRoute } from "@tanstack/react-router";
import { Activity, Database, HardDrive, ServerCog } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BACKGROUND_JOBS, ERROR_RATE_TREND, STORAGE_USAGE, SYSTEM_SERVICES } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/system")({
  head: () => ({
    meta: [
      { title: "System monitoring — Career Connect admin" },
      {
        name: "description",
        content: "API health, database status, storage usage, background jobs and error rate.",
      },
      { property: "og:title", content: "System monitoring — Career Connect admin" },
      {
        property: "og:description",
        content: "Operational health of every Career Connect service.",
      },
    ],
  }),
  component: AdminSystem,
});

function AdminSystem() {
  const degraded = SYSTEM_SERVICES.filter((s) => s.status !== "operational").length;
  const queued = BACKGROUND_JOBS.reduce((s, j) => s + j.queued, 0);
  const storageUsed = STORAGE_USAGE.reduce((s, b) => s + b.usedGb, 0);
  const storageQuota = STORAGE_USAGE.reduce((s, b) => s + b.quotaGb, 0);
  const latestError = ERROR_RATE_TREND[ERROR_RATE_TREND.length - 1]?.errors ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="System monitoring"
        description="Service health, storage capacity, background workloads and error budgets."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Services"
          value={degraded === 0 ? "All healthy" : `${degraded} degraded`}
          icon={Activity}
          tone={degraded === 0 ? "success" : "default"}
        />
        <KpiCard label="Database" value="Operational" icon={Database} hint="22 ms median latency" />
        <KpiCard
          label="Storage used"
          value={`${storageUsed.toFixed(1)} / ${storageQuota} GB`}
          icon={HardDrive}
          tone="accent"
        />
        <KpiCard
          label="Queued jobs"
          value={queued}
          icon={ServerCog}
          hint={`${BACKGROUND_JOBS.length} workers`}
        />
      </div>

      <div className="surface-card overflow-x-auto">
        <div className="p-5 pb-0">
          <h2 className="font-display text-lg font-semibold">API & service health</h2>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Uptime (30d)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SYSTEM_SERVICES.map((s) => (
              <TableRow key={s.name}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "operational" ? "default" : "destructive"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>{s.latencyMs} ms</TableCell>
                <TableCell className="text-muted-foreground">{s.uptime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Storage usage</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Per-bucket consumption against quota.
          </p>
          <div className="space-y-4">
            {STORAGE_USAGE.map((b) => (
              <div key={b.bucket}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.bucket}</span>
                  <span className="text-muted-foreground">
                    {b.usedGb} / {b.quotaGb} GB
                  </span>
                </div>
                <Progress value={(b.usedGb / b.quotaGb) * 100} className="mt-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Error rate</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Percentage of failed requests · currently {latestError}%
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ERROR_RATE_TREND}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="errors"
                stroke="var(--destructive)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <div className="p-5 pb-0">
          <h2 className="font-display text-lg font-semibold">Background jobs & queues</h2>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Queued</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BACKGROUND_JOBS.map((j) => (
              <TableRow key={j.name}>
                <TableCell className="font-medium">{j.name}</TableCell>
                <TableCell className="text-muted-foreground">{j.schedule}</TableCell>
                <TableCell className="text-muted-foreground">{j.lastRun}</TableCell>
                <TableCell>{j.queued}</TableCell>
                <TableCell>
                  <Badge variant={j.status === "running" ? "default" : "secondary"}>
                    {j.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
