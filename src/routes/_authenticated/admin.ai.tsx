import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiUsageDashboard } from "@/lib/ai-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  head: () => ({
    meta: [
      { title: "AI usage — Career Connect admin" },
      {
        name: "description",
        content: "Provider usage, token consumption, estimated cost, model mix and failure rate.",
      },
      { property: "og:title", content: "AI usage — Career Connect admin" },
      {
        property: "og:description",
        content: "Track AI spend and reliability across the platform.",
      },
    ],
  }),
  component: AdminAi,
});

const COLORS = ["var(--primary)", "var(--accent)", "var(--success)"];

function AdminAi() {
  const fetchUsage = useServerFn(getAiUsageDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ai-usage"],
    queryFn: () => fetchUsage(),
    refetchInterval: 60_000,
  });

  const daily = data?.daily ?? [];
  const modelDistribution = data?.models ?? [];
  const providers = data?.providers ?? [];
  const requests = data?.totals.requests ?? 0;
  const failures = data?.totals.failures ?? 0;
  const tokens = data?.totals.tokens ?? 0;
  const cost = data?.totals.costUsd ?? 0;
  const failureRate = String(data?.totals.failureRate ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="AI usage dashboard"
        description="Gateway traffic, token consumption and estimated spend for the last 7 days."
      />

      {!isLoading && data?.empty ? (
        <div className="surface-card p-6 text-sm text-muted-foreground">
          No AI requests have been recorded in the last 7 days yet. Usage appears here as soon as
          students start using the AI features.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Requests (7d)" value={requests} icon={Sparkles} />
        <KpiCard label="Tokens" value={`${(tokens / 1_000_000).toFixed(2)}M`} tone="accent" />
        <KpiCard label="Estimated cost" value={`$${cost.toFixed(2)}`} tone="success" />
        <KpiCard label="Failure rate" value={`${failureRate}%`} hint={`${failures} failed calls`} />
        <KpiCard label="p95 latency" value={`${data?.totals.p95LatencyMs ?? 0} ms`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Daily requests</h2>
          <p className="mb-4 text-sm text-muted-foreground">Successful gateway calls per day.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="requests" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold">Model distribution</h2>
          <p className="mb-4 text-sm text-muted-foreground">Share of traffic by model.</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={modelDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
              >
                {modelDistribution.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Token consumption</h2>
          <p className="mb-4 text-sm text-muted-foreground">Tokens processed per day.</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <div className="p-5 pb-0">
          <h2 className="font-display text-lg font-semibold">Provider usage</h2>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Estimated cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.provider}>
                <TableCell className="font-medium">{p.provider}</TableCell>
                <TableCell>{p.requests.toLocaleString()}</TableCell>
                <TableCell>{p.tokens.toLocaleString()}</TableCell>
                <TableCell>${p.costUsd.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="surface-card overflow-x-auto">
        <div className="p-5 pb-0">
          <h2 className="font-display text-lg font-semibold">Model cost breakdown</h2>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Traffic share</TableHead>
              <TableHead>Estimated cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelDistribution.map((m) => (
              <TableRow key={m.name}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.value}%</TableCell>
                <TableCell>${m.costUsd.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
