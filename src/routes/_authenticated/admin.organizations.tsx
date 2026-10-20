import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRAINING_INSTITUTES, useAdminOrganizations } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/organizations")({
  head: () => ({
    meta: [
      { title: "Organization management — Career Connect admin" },
      {
        name: "description",
        content: "Companies, colleges and training partners registered on Career Connect.",
      },
      { property: "og:title", content: "Organization management — Career Connect admin" },
      {
        property: "og:description",
        content: "Review employers, campuses and training institutes with their activity levels.",
      },
    ],
  }),
  component: AdminOrganizations,
});

function AdminOrganizations() {
  const { data, isLoading } = useAdminOrganizations();
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const companies = data?.companies ?? [];
  const colleges = data?.colleges ?? [];

  const filteredCompanies = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return companies;
    return companies.filter((c) =>
      `${c.name} ${c.industry ?? ""} ${c.headquarters ?? ""}`.toLowerCase().includes(needle),
    );
  }, [companies, q]);

  const filteredColleges = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return colleges;
    return colleges.filter((c) => c.name.toLowerCase().includes(needle));
  }, [colleges, q]);

  const detail = companies.find((c) => c.id === detailId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Organizations"
        description="Employers, campuses and training partners connected to the platform."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Companies" value={companies.length} icon={Building2} />
        <KpiCard label="Colleges" value={colleges.length} icon={GraduationCap} tone="accent" />
        <KpiCard
          label="Training institutes"
          value={TRAINING_INSTITUTES.length}
          icon={GraduationCap}
          tone="success"
        />
      </div>

      <div className="surface-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search organizations"
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
          <TabsTrigger value="institutes">Training institutes</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-4">
          <div className="surface-card overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No companies registered yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>HQ</TableHead>
                    <TableHead>Recruiters</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Hires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.industry ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.headquarters ?? "—"}
                      </TableCell>
                      <TableCell>{c.recruiters}</TableCell>
                      <TableCell>
                        {c.jobs}{" "}
                        <span className="text-xs text-muted-foreground">({c.openJobs} open)</span>
                      </TableCell>
                      <TableCell>{c.hires}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(c.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="colleges" className="mt-4">
          <div className="surface-card overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : filteredColleges.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                No colleges detected — colleges appear once students add their campus.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>College</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Batches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColleges.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.students}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.branches.slice(0, 4).map((b) => (
                            <Badge key={b} variant="secondary">
                              {b}
                            </Badge>
                          ))}
                          {c.branches.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.batches.join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="institutes" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TRAINING_INSTITUTES.map((t) => (
              <div key={t.name} className="surface-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold">{t.name}</h3>
                  <Badge variant={t.status === "active" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.focus}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Learners</dt>
                    <dd className="font-medium">{t.learners}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Partner since</dt>
                    <dd className="font-medium">{t.partnerSince}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>{detail.industry ?? "Industry not set"}</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {detail.description || "No company description provided yet."}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Headquarters</dt>
                  <dd className="font-medium">{detail.headquarters ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Website</dt>
                  <dd className="truncate font-medium">{detail.website ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Open roles</dt>
                  <dd className="font-medium">{detail.openJobs}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Total hires</dt>
                  <dd className="font-medium">{detail.hires}</dd>
                </div>
              </dl>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">Organization settings</p>
                <p className="mt-1 text-muted-foreground">
                  Slug <code>{detail.slug}</code> · {detail.recruiters} recruiter seat(s) · verified
                  employer
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
