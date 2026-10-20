import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Code2, PlayCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LabTechnology, ExerciseStatus } from "../types";

interface LabHeaderProps {
  number: string;
  title: string;
  description: string;
  technologies: LabTechnology[];
  status: ExerciseStatus;
  activeTab?: string;
  onTabChange?: (tab: "demo" | "source" | "docs") => void;
  externalLink?: string;
}

export function LabHeader({
  number,
  title,
  description,
  technologies,
  status,
  activeTab = "demo",
  onTabChange,
  externalLink,
}: LabHeaderProps) {
  return (
    <div className="border-b border-border bg-card/60 pb-6 backdrop-blur-sm min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
        >
          <Link to="/wt-lab">
            <ArrowLeft className="size-4" /> Back to Platform Services
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {externalLink && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <a href={externalLink} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> Standalone Preview
              </a>
            </Button>
          )}
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
          >
            <CheckCircle2 className="size-3.5" />
            {status}
          </Badge>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            {number}
          </span>
          <span className="text-muted-foreground">•</span>
          <div className="flex flex-wrap gap-1.5">
            {technologies.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px] font-normal">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
