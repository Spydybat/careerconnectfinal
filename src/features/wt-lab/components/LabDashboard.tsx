import { Link } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/api-config";
import { WT_EXERCISES } from "../data/exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  GraduationCap,
  Layers,
  PlayCircle,
  Server,
  Sparkles,
  Terminal,
} from "lucide-react";

export function LabDashboard() {
  const totalModules = WT_EXERCISES.length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card/80 to-primary/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
                CC
              </span>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Platform Architecture
              </Badge>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Career Connect Platform Services
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Explore the interactive modules, candidate portals, enterprise persistence layers,
              and full-stack services powering the Career Connect AI career intelligence platform.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              {totalModules} Interactive Modules Active
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Enterprise Full-Stack Architecture
            </span>
          </div>
        </div>

        {/* Quick Tech Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/80 pt-6 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              UI & Presentation
            </span>
            <p className="mt-1 font-display text-lg font-bold text-foreground">
              HTML5 · CSS3 · Dynamic UI
            </p>
            <p className="text-[11px] text-muted-foreground">Modules 01, 02, 03</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Server Infrastructure
            </span>
            <p className="mt-1 font-display text-lg font-bold text-foreground">
              Cloud & Servlet Container
            </p>
            <p className="text-[11px] text-muted-foreground">Module 04 Web Server</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Enterprise Services
            </span>
            <p className="mt-1 font-display text-lg font-bold text-foreground">
              Servlets · JSP · MVC
            </p>
            <p className="text-[11px] text-muted-foreground">Modules 05(A), 05(B), 06(A), 06(B)</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Data Interchange
            </span>
            <p className="mt-1 font-display text-lg font-bold text-foreground">XML · XSD · XSLT</p>
            <p className="text-[11px] text-muted-foreground">Module 07 Schema Services</p>
          </div>
        </div>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {WT_EXERCISES.map((ex) => (
          <article
            key={ex.id}
            className="surface-card flex flex-col justify-between p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/40 group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  {ex.number}
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                >
                  <CheckCircle2 className="size-3 mr-1" /> {ex.status}
                </Badge>
              </div>

              <h2 className="mt-3 font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {ex.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                {ex.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {ex.technologies.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-border/60 pt-4">
              <Button asChild size="sm" className="gap-1.5 text-xs">
                <Link to={ex.route}>
                  Open Module <PlayCircle className="size-3.5" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Standalone Server & Execution Banner */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Terminal className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Enterprise Java Web & Data Services
              </h3>
              <p className="text-xs text-muted-foreground">
                Standalone Java servlet engine and XML transformation service active on port 8085.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
              <a href={getApiUrl("/index-5a.html")} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> Open Services Console
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
