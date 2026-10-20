import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
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
import { formatLpa, usePlacementData } from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/students")({
  head: () => ({
    meta: [
      { title: "Student placement directory — Career Connect" },
      {
        name: "description",
        content:
          "Search the cohort by department, batch, placement status, resume readiness and eligibility.",
      },
      { property: "og:title", content: "Student placement directory — Career Connect" },
      {
        property: "og:description",
        content: "Filter students by eligibility, resume status and assigned company.",
      },
    ],
  }),
  component: StudentDirectory,
});

const PAGE_SIZE = 10;
const ALL = "all";

function StudentDirectory() {
  const { data, isLoading } = usePlacementData();
  const students = data?.students ?? [];

  const [q, setQ] = useState("");
  const [dept, setDept] = useState(ALL);
  const [batch, setBatch] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [eligibility, setEligibility] = useState(ALL);
  const [page, setPage] = useState(0);

  const departments = useMemo(
    () => Array.from(new Set(students.map((s) => s.branch).filter((b): b is string => !!b))).sort(),
    [students],
  );
  const batches = useMemo(
    () =>
      Array.from(new Set(students.map((s) => s.batch).filter((b): b is number => !!b))).sort(
        (a, b) => b - a,
      ),
    [students],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students.filter((s) => {
      if (needle && !`${s.name} ${s.email ?? ""} ${s.college ?? ""}`.toLowerCase().includes(needle))
        return false;
      if (dept !== ALL && s.branch !== dept) return false;
      if (batch !== ALL && String(s.batch) !== batch) return false;
      if (status === "placed" && !s.placed) return false;
      if (status === "unplaced" && s.placed) return false;
      if (eligibility === "eligible" && !s.eligible) return false;
      if (eligibility === "not_eligible" && s.eligible) return false;
      return true;
    });
  }, [students, q, dept, batch, status, eligibility]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Student placement directory"
        description="Cohort readiness with resume status, eligibility and assigned company."
      />

      <div className="surface-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => reset(setQ)(e.target.value)}
            placeholder="Search students"
            className="pl-9"
          />
        </div>
        <Select value={dept} onValueChange={reset(setDept)}>
          <SelectTrigger>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={batch} onValueChange={reset(setBatch)}>
          <SelectTrigger>
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={String(b)}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={reset(setStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Placement status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="placed">Placed</SelectItem>
            <SelectItem value="unplaced">Not placed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eligibility} onValueChange={reset(setEligibility)}>
          <SelectTrigger>
            <SelectValue placeholder="Eligibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any eligibility</SelectItem>
            <SelectItem value="eligible">Eligible</SelectItem>
            <SelectItem value="not_eligible">Not eligible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No students match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing the department, batch or status filters.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Package</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                  </TableCell>
                  <TableCell>{s.branch ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{s.batch ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{s.cgpa ?? "—"}</TableCell>
                  <TableCell>
                    {s.hasResume ? (
                      <Badge variant="secondary">
                        {s.resumeScore != null ? `ATS ${s.resumeScore}` : "Uploaded"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Missing</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.eligible ? "default" : "outline"}>
                      {s.eligible ? "Eligible" : "Not eligible"}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.company ?? (s.placed ? "Assigned" : "—")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatLpa(s.ctc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {current + 1} of {pages} · {filtered.length} students
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
