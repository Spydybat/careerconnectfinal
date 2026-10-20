import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
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
import { formatLpa, usePlacementData } from "@/lib/placement";

export const Route = createFileRoute("/_authenticated/placement/records")({
  head: () => ({
    meta: [
      { title: "Placement records — Career Connect" },
      {
        name: "description",
        content:
          "Verified placement history with offer details, package, location and joining status.",
      },
      { property: "og:title", content: "Placement records — Career Connect" },
      {
        property: "og:description",
        content: "Audit-ready placement history for every graduating batch.",
      },
    ],
  }),
  component: PlacementRecords,
});

const PAGE_SIZE = 10;

function joiningStatus(date: string) {
  return new Date(date) <= new Date() ? "Joined" : "Awaiting joining";
}

function PlacementRecords() {
  const { data, isLoading } = usePlacementData();
  const records = data?.records ?? [];
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((r) =>
      `${r.studentName} ${r.company ?? ""} ${r.roleTitle}`.toLowerCase().includes(needle),
    );
  }, [records, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Placement records"
        description="Offer details, packages and joining status across batches."
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search student, company or role"
          className="pl-9"
        />
      </div>

      <div className="surface-card overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No placement records yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Records appear once offers are confirmed and verified by the placement cell.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Placement date</TableHead>
                <TableHead>Joining</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Package</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.branch ?? "—"}</p>
                  </TableCell>
                  <TableCell>{r.company ?? "—"}</TableCell>
                  <TableCell>{r.roleTitle}</TableCell>
                  <TableCell className="tabular-nums">{r.batch ?? r.academicYear ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{r.placementDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{joiningStatus(r.placementDate)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.verificationStatus === "verified" ? "default" : "outline"}>
                      {r.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatLpa(r.ctc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {current + 1} of {pages} · {filtered.length} records
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
