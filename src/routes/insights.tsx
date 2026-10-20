import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Career Insights & Market Intelligence — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Executive analytics on career demand, salary benchmarks, skill growth velocity, and placement outcomes.",
      },
    ],
  }),
  component: InsightsPage,
});

const DEMAND_METRICS = [
  { role: "Software Engineering & Full-Stack", demandScore: 96, growth: "+38% YoY", tier: "Critical Demand", activeOpenings: 420 },
  { role: "AI & Machine Learning Engineering", demandScore: 94, growth: "+64% YoY", tier: "Surging Demand", activeOpenings: 290 },
  { role: "Cloud Infrastructure & DevOps", demandScore: 90, growth: "+45% YoY", tier: "High Demand", activeOpenings: 215 },
  { role: "Data Intelligence & Analytics", demandScore: 88, growth: "+32% YoY", tier: "Steady Demand", activeOpenings: 260 },
  { role: "Cybersecurity & Platform Trust", demandScore: 84, growth: "+28% YoY", tier: "High Demand", activeOpenings: 140 },
];

const SALARY_BENCHMARKS = [
  {
    domain: "Software Engineering",
    fresher: "₹8,00,000 - ₹14,00,000",
    earlyCareer: "₹12,00,000 - ₹20,00,000",
    midLevel: "₹18,00,000 - ₹32,00,000",
    topSkills: "Java, React, SQL, Cloud",
  },
  {
    domain: "AI & Machine Learning",
    fresher: "₹10,00,000 - ₹16,00,000",
    earlyCareer: "₹14,00,000 - ₹24,00,000",
    midLevel: "₹22,00,000 - ₹38,00,000",
    topSkills: "Python, PyTorch, LLMs, MLOps",
  },
  {
    domain: "Data Analytics & BI",
    fresher: "₹6,00,000 - ₹10,00,000",
    earlyCareer: "₹9,00,000 - ₹15,00,000",
    midLevel: "₹14,00,000 - ₹24,00,000",
    topSkills: "SQL, Power BI, Statistics, Excel",
  },
  {
    domain: "Cloud & DevOps Architecture",
    fresher: "₹7,00,000 - ₹12,00,000",
    earlyCareer: "₹11,00,000 - ₹18,00,000",
    midLevel: "₹16,00,000 - ₹28,00,000",
    topSkills: "Kubernetes, Docker, AWS, Linux",
  },
];

const SKILL_VELOCITY = [
  { name: "Generative AI APIs & RAG", growth: "+78%", volume: "High", momentum: "Accelerating" },
  { name: "PyTorch & Deep Learning", growth: "+64%", volume: "High", momentum: "Accelerating" },
  { name: "Cloud Native (K8s & Docker)", growth: "+45%", volume: "Very High", momentum: "Steady High" },
  { name: "Java Enterprise (Spring Boot)", growth: "+38%", volume: "Very High", momentum: "Core Staple" },
  { name: "Relational SQL Optimization", growth: "+32%", volume: "Ubiquitous", momentum: "Core Staple" },
  { name: "Modern TypeScript / React", growth: "+29%", volume: "High", momentum: "Steady High" },
];

function InsightsPage() {
  const [selectedExperienceTier, setSelectedExperienceTier] = useState<"fresher" | "earlyCareer" | "midLevel">("earlyCareer");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Executive Market Intelligence
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
                Career Insights & Placement Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Real-time benchmark intelligence covering career demand, compensation trends across experience tiers, skill velocity, and placement outcomes.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground shrink-0">
              <Info className="size-4 text-primary" />
              <span>Industry Benchmark Dataset (Curated Demonstration)</span>
            </div>
          </div>

          {/* KPI Executive Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Placement Velocity</span>
                <div className="text-3xl font-bold font-display text-foreground mt-2">92.4%</div>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-3 flex items-center gap-1">
                <ArrowUpRight className="size-3.5" /> +4.2% over previous annual cohort
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Median Tech Package</span>
                <div className="text-3xl font-bold font-display text-foreground mt-2">₹12.4 LPA</div>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-3 flex items-center gap-1">
                <ArrowUpRight className="size-3.5" /> ₹18.6 LPA top 25th percentile
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Active Hiring Partners</span>
                <div className="text-3xl font-bold font-display text-foreground mt-2">140+</div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Enterprises & technology scale-ups
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Skill Growth Index</span>
                <div className="text-3xl font-bold font-display text-foreground mt-2">+42%</div>
              </div>
              <p className="text-[11px] text-primary font-medium mt-3">
                Average annual competency expansion
              </p>
            </div>
          </div>

          {/* Section 1: Career Demand & Sector Opportunities */}
          <div className="surface-card rounded-3xl p-6 sm:p-8 border border-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  Career Demand & Hiring Absorption Rate
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Relative market absorption and active job openings by technical specialization.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Scale: 0 - 100 Absorption Index</span>
            </div>

            <div className="space-y-4">
              {DEMAND_METRICS.map((item) => (
                <div key={item.role} className="space-y-1.5 rounded-xl border border-border/70 p-4 bg-muted/15">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <span className="font-bold text-foreground">{item.role}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.growth}</span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary text-[11px]">
                        {item.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${item.demandScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground w-8 text-right">
                      {item.demandScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Salary Insights by Specialization & Experience */}
          <div className="surface-card rounded-3xl p-6 sm:p-8 border border-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                  <DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Salary Insights Across Experience Tiers
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Representative compensation bands across major career specializations.
                </p>
              </div>

              {/* Experience Tier Selector */}
              <div className="flex items-center gap-1 rounded-xl bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedExperienceTier("fresher")}
                  className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                    selectedExperienceTier === "fresher"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fresher
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExperienceTier("earlyCareer")}
                  className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                    selectedExperienceTier === "earlyCareer"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  0 - 2 Years
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExperienceTier("midLevel")}
                  className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                    selectedExperienceTier === "midLevel"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2 - 5 Years
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="p-3.5 font-semibold">Specialization Domain</th>
                    <th className="p-3.5 font-semibold">Active Selected Tier Band</th>
                    <th className="p-3.5 font-semibold">Fresher Tier</th>
                    <th className="p-3.5 font-semibold">0 - 2 Years Tier</th>
                    <th className="p-3.5 font-semibold">2 - 5 Years Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SALARY_BENCHMARKS.map((s) => (
                    <tr key={s.domain} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">
                        {s.domain}
                        <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                          Key: {s.topSkills}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                        {selectedExperienceTier === "fresher" && s.fresher}
                        {selectedExperienceTier === "earlyCareer" && s.earlyCareer}
                        {selectedExperienceTier === "midLevel" && s.midLevel}
                      </td>
                      <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{s.fresher}</td>
                      <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{s.earlyCareer}</td>
                      <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{s.midLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Skill Trends & Learning Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skill Growth Velocity */}
            <div className="surface-card rounded-3xl p-6 sm:p-8 border border-border space-y-5">
              <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                Skill Growth Velocity Trends
              </h3>
              <p className="text-xs text-muted-foreground">
                Annual expansion in hiring demand per competency category.
              </p>

              <div className="space-y-3">
                {SKILL_VELOCITY.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between rounded-xl border border-border/80 p-3 bg-muted/10 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{skill.name}</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Hiring Volume: {skill.volume}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {skill.growth}
                      </span>
                      <div className="text-[10px] text-primary font-medium mt-0.5">
                        {skill.momentum}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring & Placement Progress Benchmark */}
            <div className="surface-card rounded-3xl p-6 sm:p-8 border border-border space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  Hiring & Placement Cohort Velocity
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Time-to-offer milestones for verified candidate profiles.
                </p>

                <div className="mt-6 space-y-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Placed within 30 days of profile verification</span>
                      <span className="font-bold">62%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 w-[62%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Placed within 60 days</span>
                      <span className="font-bold">86%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary w-[86%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Overall Cohort Placement Benchmark</span>
                      <span className="font-bold">92.4%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary w-[92.4%]" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
                  <h4 className="font-bold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Learning Progress Impact
                  </h4>
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    Candidates who complete recommended skill gap milestones see an average of{" "}
                    <strong className="text-foreground">+40% higher shortlist selection</strong> from enterprise recruiters.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ready to align your profile?</span>
                <Button asChild size="sm" className="rounded-full text-xs">
                  <Link to="/profile">
                    Create Profile <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
