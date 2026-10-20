import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Sparkles,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MapPin,
  ChevronRight,
  Layers,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CAREER CONNECT — Build Your Professional Future" },
      {
        name: "description",
        content:
          "Discover opportunities, showcase your skills, grow your professional network and make informed career decisions.",
      },
      { property: "og:title", content: "CAREER CONNECT — Build Your Professional Future" },
      {
        property: "og:description",
        content:
          "Discover opportunities, showcase your skills, grow your professional network and make informed career decisions.",
      },
    ],
  }),
  component: HomePage,
});

const FEATURED_OPPORTUNITIES = [
  {
    id: "opp-1",
    title: "Senior Full-Stack Software Engineer",
    company: "CloudScale Technologies",
    location: "Bengaluru, India (Hybrid)",
    type: "Full-time",
    experience: "2 - 5 Years",
    salary: "₹18,00,000 - ₹26,00,000",
    skills: ["Java", "Spring Boot", "React", "SQL", "Cloud Architecture"],
  },
  {
    id: "opp-2",
    title: "AI & Machine Learning Engineer",
    company: "Cognitive Intelligence Labs",
    location: "Hyderabad, India (Remote)",
    type: "Full-time",
    experience: "Fresher / 0-2 Years",
    salary: "₹14,00,000 - ₹20,00,000",
    skills: ["Python", "Machine Learning", "PyTorch", "SQL", "Statistics"],
  },
  {
    id: "opp-3",
    title: "Enterprise Data & Analytics Specialist",
    company: "Synthesize Global Solutions",
    location: "Chennai, India (On-site)",
    type: "Full-time",
    experience: "0 - 2 Years",
    salary: "₹10,00,000 - ₹15,00,000",
    skills: ["SQL", "Power BI", "Python", "Data Modeling", "Excel"],
  },
];

const SKILL_HIGHLIGHTS = [
  {
    name: "Java & Enterprise Spring Boot",
    category: "Technical Skills",
    demand: "Very High (94%)",
    growth: "+38% YoY",
    description: "Core backend development, microservices, and distributed transaction systems.",
  },
  {
    name: "Python & Machine Learning",
    category: "Emerging Skills",
    demand: "High (91%)",
    growth: "+62% YoY",
    description: "Data intelligence, predictive modeling, and applied AI pipelines.",
  },
  {
    name: "Modern React & TypeScript",
    category: "Technical Skills",
    demand: "High (89%)",
    growth: "+29% YoY",
    description: "Component-driven design systems, web performance, and responsive architecture.",
  },
  {
    name: "Enterprise Data Warehousing & SQL",
    category: "Professional Skills",
    demand: "Very High (95%)",
    growth: "+34% YoY",
    description: "Relational data modeling, ACID transactions, and analytical querying.",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const [activeQuadrant, setActiveQuadrant] = useState<{
    id: string;
    title: string;
    description: string;
    link: string;
    linkText: string;
  } | null>(null);

  const QUADRANT_DATA = {
    profile: {
      id: "profile",
      title: "Candidate Profile & Credentials Domain",
      description:
        "Comprehensive professional profile engine validating education credentials, verified technical competencies, career objectives, and professional summaries.",
      link: "/profile",
      linkText: "Create or Edit Your Profile",
    },
    jobs: {
      id: "jobs",
      title: "Opportunities & Career Discovery Domain",
      description:
        "Live marketplace connecting job seekers and graduates with top technology enterprises, curated by required skill competencies and experience levels.",
      link: "/opportunities",
      linkText: "Explore Opportunities",
    },
    skills: {
      id: "skills",
      title: "Skills Intelligence & Gap Analysis Domain",
      description:
        "Standardized technical, professional, and emerging skill matrices with structured proficiency benchmarking and personalized learning pathways.",
      link: "/skills",
      linkText: "Discover Skills & Learning Areas",
    },
    analytics: {
      id: "analytics",
      title: "Career & Placement Insights Domain",
      description:
        "Actionable placement analytics, salary benchmarks across experience tiers, and industry demand indicators to inform career progression.",
      link: "/insights",
      linkText: "View Career Insights",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      {/* Hero Section - Spacious 2-Column Professional Layout */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background pt-10 pb-16 sm:pt-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline, Description & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" />
                <span>THE PROFESSIONAL CAREER NETWORK</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Build Your <span className="text-primary">Professional</span> Future.
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Discover verified opportunities, showcase your skills, grow your professional network, and make data-driven career moves across top enterprise technology ecosystems.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full px-7 font-semibold text-sm shadow-md h-12 w-full sm:w-auto justify-center">
                  <Link to="/profile">
                    Create Your Profile <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 font-semibold text-sm border-border hover:bg-muted h-12 w-full sm:w-auto justify-center"
                >
                  <Link to="/opportunities">Explore Opportunities</Link>
                </Button>
              </div>

              {/* Platform Highlights Ticker */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="surface-card p-3 rounded-xl border border-border/80 bg-white/50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold font-display text-foreground">8+</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Verified Profiles</div>
                </div>
                <div className="surface-card p-3 rounded-xl border border-border/80 bg-white/50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold font-display text-foreground">100%</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Schema Validated</div>
                </div>
                <div className="surface-card p-3 rounded-xl border border-border/80 bg-white/50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold font-display text-foreground">30+</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Skill Pathways</div>
                </div>
                <div className="surface-card p-3 rounded-xl border border-border/80 bg-white/50 dark:bg-slate-900/50">
                  <div className="text-2xl font-bold font-display text-foreground">92%</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Placement Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Career Intelligence Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative surface-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-primary/5 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Career Intelligence Engine</h3>
                      <p className="text-[10px] text-muted-foreground">Live Candidate Matching Active</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>

                {/* Candidate Matching Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Profile Readiness Score</span>
                    <span className="font-bold text-primary">94% High Fit</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary w-[94%]" />
                  </div>
                </div>

                {/* Matched Enterprise Role Snippet */}
                <div className="rounded-xl border border-border/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Full-Stack Engineer</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">₹18 - 26 LPA</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    CloudScale Technologies • Bengaluru (Hybrid)
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Java", "Spring Boot", "React", "SQL"].map((s) => (
                      <span key={s} className="rounded px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core Pillar Quick Links */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <Link
                    to="/skills"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border p-2.5 font-medium hover:bg-muted text-slate-700 dark:text-slate-300 transition-colors text-center text-[11px]"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Skills Matrix</span>
                  </Link>
                  <Link
                    to="/network"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border p-2.5 font-medium hover:bg-muted text-slate-700 dark:text-slate-300 transition-colors text-center text-[11px]"
                  >
                    <Users className="size-3.5 text-primary" />
                    <span>Mentors & Network</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Career Opportunities Section */}
      <section className="py-16 bg-muted/20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live Openings
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-1">
                Featured Career Opportunities
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore curated career opportunities across verified enterprise hiring partners.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
              <Link to="/opportunities">
                View All Opportunities <ChevronRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_OPPORTUNITIES.map((opp) => (
              <div
                key={opp.id}
                className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Building2 className="size-4 text-primary" />
                    <span className="font-semibold text-foreground">{opp.company}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {opp.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {opp.location}
                    </span>
                    <span>•</span>
                    <span>{opp.experience}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {opp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {opp.salary}
                  </div>
                  <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
                    <Link to="/opportunities">
                      View Details <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Intelligence Highlights */}
      <section className="py-16 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Skills Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-1">
                In-Demand Skill Pathways
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Benchmark your competencies against high-growth market demand.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
              <Link to="/skills">
                Discover All Skills <ChevronRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SKILL_HIGHLIGHTS.map((skill) => (
              <div
                key={skill.name}
                className="surface-card rounded-2xl p-5 border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {skill.category}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {skill.growth}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    {skill.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {skill.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Market Demand:</span>
                  <span className="font-semibold text-foreground">{skill.demand}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Feature: Interactive Career Ecosystem Explorer */}
      <section className="py-16 bg-muted/15 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Architectural Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-1">
              Interactive Career Ecosystem Architecture
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Explore the four interconnected pillars of Career Connect. Click on any domain to inspect its capabilities or jump directly into the module.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Image Map Canvas Container */}
            <div className="lg:col-span-8 surface-card rounded-2xl p-4 sm:p-6 border border-border shadow-xs">
              <div className="relative overflow-hidden rounded-xl bg-slate-950/5">
                <img
                  src="/career-connect.png"
                  alt="Career Connect Ecosystem Architecture"
                  className="w-full h-auto block rounded-lg select-none"
                />

                {/* Hotspot 1: Profile (Top Left) */}
                <button
                  type="button"
                  onClick={() => setActiveQuadrant(QUADRANT_DATA.profile)}
                  className={`absolute left-[6.3%] top-[18.5%] w-[25.2%] h-[27.7%] rounded-xl transition-all border-2 flex items-center justify-center ${
                    activeQuadrant?.id === "profile"
                      ? "border-primary bg-primary/25 shadow-lg"
                      : "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/20"
                  }`}
                  aria-label="Explore Profile Domain"
                >
                  <span className="sr-only">Profile Domain</span>
                </button>

                {/* Hotspot 2: Jobs/Opportunities (Top Right) */}
                <button
                  type="button"
                  onClick={() => setActiveQuadrant(QUADRANT_DATA.jobs)}
                  className={`absolute left-[63.2%] top-[18.5%] w-[25.2%] h-[27.7%] rounded-xl transition-all border-2 flex items-center justify-center ${
                    activeQuadrant?.id === "jobs"
                      ? "border-primary bg-primary/25 shadow-lg"
                      : "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/20"
                  }`}
                  aria-label="Explore Opportunities Domain"
                >
                  <span className="sr-only">Opportunities Domain</span>
                </button>

                {/* Hotspot 3: Skills (Bottom Left) */}
                <button
                  type="button"
                  onClick={() => setActiveQuadrant(QUADRANT_DATA.skills)}
                  className={`absolute left-[6.3%] top-[50.8%] w-[25.2%] h-[27.7%] rounded-xl transition-all border-2 flex items-center justify-center ${
                    activeQuadrant?.id === "skills"
                      ? "border-primary bg-primary/25 shadow-lg"
                      : "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/20"
                  }`}
                  aria-label="Explore Skills Domain"
                >
                  <span className="sr-only">Skills Domain</span>
                </button>

                {/* Hotspot 4: Analytics/Insights (Bottom Right) */}
                <button
                  type="button"
                  onClick={() => setActiveQuadrant(QUADRANT_DATA.analytics)}
                  className={`absolute left-[63.2%] top-[50.8%] w-[25.2%] h-[27.7%] rounded-xl transition-all border-2 flex items-center justify-center ${
                    activeQuadrant?.id === "analytics"
                      ? "border-primary bg-primary/25 shadow-lg"
                      : "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/20"
                  }`}
                  aria-label="Explore Insights Domain"
                >
                  <span className="sr-only">Insights Domain</span>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Tip: Click on any quadrant above to inspect domain capabilities.</span>
                <span className="font-mono text-[11px]">4 Connected Hubs</span>
              </div>
            </div>

            {/* Quadrant Detail Panel */}
            <div className="lg:col-span-4 surface-card rounded-2xl p-6 border border-border h-full flex flex-col justify-between">
              {activeQuadrant ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>Selected Domain</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {activeQuadrant.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {activeQuadrant.description}
                  </p>
                  <div className="pt-4">
                    <Button asChild className="w-full text-xs">
                      <Link to={activeQuadrant.link}>
                        {activeQuadrant.linkText} <ArrowRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 my-auto py-8 text-center">
                  <div className="grid size-12 place-items-center rounded-full bg-muted mx-auto text-primary">
                    <Layers className="size-6" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Select a Quadrant on the Map
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Click any quadrant on the left — Profile, Opportunities, Skills, or Insights — to inspect its integration and navigate directly.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveQuadrant(QUADRANT_DATA.profile)}
                      className="text-xs"
                    >
                      Inspect Profile Domain
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveQuadrant(QUADRANT_DATA.jobs)}
                      className="text-xs"
                    >
                      Inspect Opportunities Domain
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Career Insights Summary Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card rounded-3xl p-8 sm:p-12 border border-border bg-gradient-to-r from-card via-card to-primary/5 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Executive Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Informed Career Decisions Backed by Data
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Access comprehensive salary metrics across experience bands, placement cohort velocity, and real-time skill demand charts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full text-xs sm:text-sm px-6">
                <Link to="/insights">
                  Explore Career Insights <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full text-xs sm:text-sm px-6">
                <Link to="/career-profiles">Browse Career Profiles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ProfessionalFooter />
    </div>
  );
}
