import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Building2, ExternalLink, MapPin } from "lucide-react";
import { formatSalary } from "@/lib/career";
import { titleCase } from "@/lib/recruiter";
import { useCompanyBySlug, useCompanyOpenJobs } from "@/lib/companies";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/companies/$slug")({
  head: () => ({
    meta: [
      { title: "Company profile — Career Connect" },
      {
        name: "description",
        content:
          "Company overview, headquarters, industry and every open role they are hiring for.",
      },
      { property: "og:title", content: "Company profile — Career Connect" },
      { property: "og:description", content: "Employer overview and live openings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyDetail,
});

function CompanyDetail() {
  const { slug } = Route.useParams();
  const { data: company, isLoading } = useCompanyBySlug(slug);
  const { data: jobs = [] } = useCompanyOpenJobs(company?.id ?? null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!company) {
    return (
      <div className="surface-card space-y-3 p-6">
        <p className="font-display font-semibold">Company not found</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/companies">Back to directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Company portal"
        title={company.name}
        description={company.description ?? ""}
        actions={
          company.website ? (
            <Button asChild variant="outline">
              <a href={company.website} target="_blank" rel="noreferrer">
                Website <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card space-y-4 p-5">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="size-12 rounded-lg object-contain"
              />
            ) : (
              <span className="grid size-12 place-items-center rounded-lg bg-primary/10 font-display text-lg font-semibold text-primary">
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
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <dd>{company.headquarters || "Location not set"}</dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="size-4" />
              <dd>
                {jobs.length} open {jobs.length === 1 ? "role" : "roles"}
              </dd>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-4" />
              <dd>{company.industry || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Open roles</h2>
          {jobs.length === 0 ? (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              No published roles right now — check back soon.
            </p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/jobs/$jobId"
                        params={{ jobId: job.id }}
                        className="font-display font-semibold hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {job.location || "Location flexible"} · {titleCase(job.work_mode)} ·{" "}
                        {titleCase(job.employment_type)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(job.job_skills ?? []).slice(0, 4).map((js) => (
                        <Badge key={js.skill_id} variant="secondary">
                          {js.skills?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
