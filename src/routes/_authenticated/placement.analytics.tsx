import { createFileRoute } from "@tanstack/react-router";
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
import {
  DEPARTMENT_STATS,
  OFFER_OUTCOMES,
  PLACEMENT_TREND,
  SALARY_BANDS,
  TOP_RECRUITERS,
} from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/analytics")({
  head: () => ({
    meta: [
      { title: "Placement analytics — Career Connect" },
      {
        name: "description",
        content:
          "Department-wise placement, company hiring, salary distribution, trends and offer acceptance.",
      },
      { property: "og:title", content: "Placement analytics — Career Connect" },
      {
        property: "og:description",
        content: "Benchmark placement performance across departments and recruiters.",
      },
    ],
  }),
  component: PlacementAnalytics,
});

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

function PlacementAnalytics() {
  const accepted = OFFER_OUTCOMES.find((o) => o.name === "Accepted")?.value ?? 0;
  const totalOffers = OFFER_OUTCOMES.reduce((sum, o) => sum + o.value, 0);
  const acceptanceRate = totalOffers ? Math.round((accepted / totalOffers) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Placement analytics"
        description="Indicative benchmarks — figures use sample data until warehouse reporting is connected."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Department-wise placement</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPARTMENT_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="department" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="eligible" fill="hsl(var(--muted-foreground))" radius={4} />
                <Bar dataKey="placed" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Salary distribution</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALARY_BANDS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="band" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Placement trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PLACEMENT_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="placed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="offers"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Offer acceptance rate</h2>
          <p className="text-sm text-muted-foreground">
            {acceptanceRate}% of {totalOffers} offers accepted
          </p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={OFFER_OUTCOMES}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {OFFER_OUTCOMES.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="surface-card p-5">
        <h2 className="font-display text-lg font-semibold">Top recruiters</h2>
        <div className="mt-4 space-y-3">
          {TOP_RECRUITERS.map((r) => (
            <div key={r.company} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.company}</span>
              <span className="tabular-nums text-muted-foreground">
                {r.hires} hires · avg {r.avgLpa} LPA
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
