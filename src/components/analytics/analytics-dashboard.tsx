import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatValue } from "@/analytics/export";
import type { AnalyticsFilters } from "@/analytics/filters";
import type { AnalyticsDomain, ChartSpec, TableSpec } from "@/analytics/types";
import { useDashboard, useDashboardExport } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 44%))",
  "hsl(var(--chart-4, 43 74% 56%))",
  "hsl(var(--chart-5, 27 87% 61%))",
];

function ChartCard({ spec }: { spec: ChartSpec }) {
  const axisProps = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  };
  const tooltip = (
    <Tooltip
      contentStyle={{
        background: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 8,
        fontSize: 12,
        color: "hsl(var(--popover-foreground))",
      }}
    />
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{spec.title}</CardTitle>
        <CardDescription>{spec.description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px]">
        {spec.data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data for the selected filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {spec.type === "pie" ? (
              <PieChart>
                <Pie
                  data={spec.data}
                  dataKey={spec.series[0]?.key ?? "value"}
                  nameKey={spec.xKey}
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {spec.data.map((_, index) => (
                    <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                {tooltip}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : spec.type === "line" ? (
              <LineChart data={spec.data} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey={spec.xKey} {...axisProps} />
                <YAxis {...axisProps} width={52} />
                {tooltip}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {spec.series.map((series, index) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={PALETTE[index % PALETTE.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            ) : spec.type === "area" ? (
              <AreaChart data={spec.data} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey={spec.xKey} {...axisProps} />
                <YAxis {...axisProps} width={52} />
                {tooltip}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {spec.series.map((series, index) => (
                  <Area
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={PALETTE[index % PALETTE.length]}
                    fill={PALETTE[index % PALETTE.length]}
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={spec.data} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey={spec.xKey}
                  {...axisProps}
                  interval={0}
                  angle={-18}
                  height={54}
                  dy={12}
                />
                <YAxis {...axisProps} width={52} />
                {tooltip}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {spec.series.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    {...(spec.type === "stacked-bar" ? { stackId: "a" } : {})}
                    fill={PALETTE[index % PALETTE.length]}
                    radius={spec.type === "stacked-bar" ? 0 : [4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function TableCard({
  spec,
  page,
  onPage,
}: {
  spec: TableSpec;
  page: number;
  onPage: (page: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{spec.title}</CardTitle>
          <CardDescription>{spec.total_rows.toLocaleString()} rows</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {spec.page} of {Math.max(spec.total_pages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={spec.page >= spec.total_pages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {spec.columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {spec.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={spec.columns.length} className="text-muted-foreground">
                  No rows for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              spec.rows.map((row, index) => (
                <TableRow key={index}>
                  {spec.columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(column.format !== "text" && "tabular-nums")}
                    >
                      {formatValue(row[column.key] ?? "", column.format)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ domain }: { domain: AnalyticsDomain }) {
  const [filters, setFilters] = useState<AnalyticsFilters>({ preset: "last_12_months" });
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({ domain, filters, page, pageSize: 25 }), [domain, filters, page]);
  const { data, isLoading, isFetching, error, refetch } = useDashboard(params);
  const exporter = useDashboardExport(params);

  function setFilter(key: string, value: string) {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev } as Record<string, string | number | undefined>;
      if (value === ALL) delete next[key];
      else next[key] = key === "batch" || key === "year" ? Number(value) : value;
      return next as AnalyticsFilters;
    });
  }

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Analytics unavailable</CardTitle>
          <CardDescription>{(error as Error).message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  const filterValues = filters as Record<string, string | number | undefined>;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
            <p className="text-sm text-muted-foreground">{data.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            {(["csv", "excel", "pdf"] as const).map((format) => (
              <Button
                key={format}
                variant="outline"
                size="sm"
                disabled={exporter.isPending}
                onClick={() => exporter.mutate(format)}
              >
                <Download className="mr-2 h-4 w-4" />
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant={data.freshness.pipeline_status === "healthy" ? "secondary" : "destructive"}
          >
            Pipeline {data.freshness.pipeline_status}
          </Badge>
          <span>Batch refresh — data through {data.freshness.data_through}</span>
          <span>· Loaded {new Date(data.freshness.last_updated).toLocaleString()}</span>
          <span>· Run {data.freshness.run_id}</span>
          <span>· Scope: {data.scope.description}</span>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          {data.filter_fields.map((field) => (
            <div key={field.key} className="min-w-[170px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <Select
                value={String(filterValues[field.key] ?? ALL)}
                onValueChange={(value) => setFilter(field.key, value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={field.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <Card key={kpi.metric}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                {kpi.label}
                <TooltipProvider delayDuration={0}>
                  <UiTooltip>
                    <TooltipTrigger aria-label={`${kpi.label} definition`}>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>{kpi.definition}</p>
                      <p className="mt-1 text-muted-foreground">Source: {kpi.source}</p>
                    </TooltipContent>
                  </UiTooltip>
                </TooltipProvider>
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatValue(kpi.value, kpi.format)}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.charts.map((chart) => (
          <ChartCard key={chart.id} spec={chart} />
        ))}
      </div>

      <div className="space-y-4">
        {data.tables.map((table) => (
          <TableCard key={table.id} spec={table} page={page} onPage={setPage} />
        ))}
      </div>
    </div>
  );
}
