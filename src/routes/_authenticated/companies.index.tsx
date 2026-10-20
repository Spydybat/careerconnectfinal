import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, Search } from "lucide-react";
import { useCompanies } from "@/lib/companies";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({
    meta: [
      { title: "Companies — Career Connect" },
      {
        name: "description",
        content: "Browse hiring companies, their industry, headquarters and current open roles.",
      },
      { property: "og:title", content: "Companies — Career Connect" },
      {
        property: "og:description",
        content: "Employer directory with open roles across the Career Connect network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const [q, setQ] = useState("");
  const { data: companies = [], isLoading } = useCompanies();

  const filtered = companies.filter((c) =>
    `${c.name} ${c.industry ?? ""} ${c.headquarters ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Company portal"
        title="Employer directory"
        description="Every company hiring through Career Connect, with their live roles."
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, industry or location"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading companies…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No companies match that search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => (
            <Link
              key={company.id}
              to="/companies/$slug"
              params={{ slug: company.slug }}
              className="surface-card flex flex-col gap-3 p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    loading="lazy"
                    className="size-11 rounded-lg object-contain"
                  />
                ) : (
                  <span className="grid size-11 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.industry || "Industry not set"}
                  </p>
                </div>
              </div>
              {company.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{company.description}</p>
              ) : null}
              <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                <span className="truncate">{company.headquarters || "Location not set"}</span>
                <Badge variant="secondary" className="ml-auto">
                  {company.openJobs} open
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && companies.length === 0 ? (
        <div className="surface-card flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Building2 className="size-4" /> No employers onboarded yet.
        </div>
      ) : null}
    </div>
  );
}
