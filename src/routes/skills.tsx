import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Search,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Filter,
  Layers,
  Code2,
  Brain,
  Briefcase,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Discover Skills & Competencies — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Explore in-demand technical, professional, and emerging skills, skill development pathways, and career-related skill gaps.",
      },
    ],
  }),
  component: SkillsPage,
});

interface SkillItem {
  id: string;
  name: string;
  category: "Technical" | "Professional" | "Emerging";
  demand: "Very High" | "High" | "Moderate";
  growthRate: string;
  associatedRoles: string[];
  subskills: string[];
  learningAreas: string[];
}

const SKILLS_CATALOG: SkillItem[] = [
  {
    id: "sk-1",
    name: "Enterprise Java & Spring Framework",
    category: "Technical",
    demand: "Very High",
    growthRate: "+38% YoY",
    associatedRoles: ["Software Developer", "Backend Engineer", "Enterprise Architect"],
    subskills: ["Java Core & Collections", "Spring Boot", "REST APIs", "JDBC & JPA", "Microservices"],
    learningAreas: ["Spring Cloud", "Enterprise Concurrency", "JVM Tuning & Profiling"],
  },
  {
    id: "sk-2",
    name: "Applied Machine Learning & Python",
    category: "Emerging",
    demand: "Very High",
    growthRate: "+64% YoY",
    associatedRoles: ["AI / ML Engineer", "Data Scientist", "Research Associate"],
    subskills: ["Python", "Scikit-Learn", "PyTorch / TensorFlow", "Data Preprocessing", "Feature Engineering"],
    learningAreas: ["Transformer Architectures", "Model Deployment (ONNX, FastAPI)", "Vector Databases"],
  },
  {
    id: "sk-3",
    name: "Modern React & Frontend Systems",
    category: "Technical",
    demand: "High",
    growthRate: "+29% YoY",
    associatedRoles: ["Frontend Engineer", "Web Developer", "Full-Stack Engineer"],
    subskills: ["TypeScript", "React Hooks & Context", "Tailwind CSS", "State Management", "SSR & Vite"],
    learningAreas: ["Design Systems", "Web Performance Optimization", "Micro-frontends"],
  },
  {
    id: "sk-4",
    name: "Relational Database Design & SQL",
    category: "Technical",
    demand: "Very High",
    growthRate: "+32% YoY",
    associatedRoles: ["Data Analyst", "Software Developer", "Database Administrator"],
    subskills: ["SQL DDL/DML", "Index Optimization", "ACID Transactions", "Stored Procedures", "Schema Normalization"],
    learningAreas: ["Query Execution Plans", "PostgreSQL Internals", "Distributed SQL"],
  },
  {
    id: "sk-5",
    name: "Cloud Architecture & Containerization",
    category: "Emerging",
    demand: "Very High",
    growthRate: "+45% YoY",
    associatedRoles: ["Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer"],
    subskills: ["Docker Containers", "Kubernetes Orchestration", "AWS/Azure Basics", "CI/CD Pipelines", "Linux Administration"],
    learningAreas: ["Infrastructure as Code (Terraform)", "Cloud Security & IAM", "Service Meshes"],
  },
  {
    id: "sk-6",
    name: "Business Intelligence & Data Visualization",
    category: "Professional",
    demand: "High",
    growthRate: "+26% YoY",
    associatedRoles: ["Data Analyst", "Product Analyst", "Business Intelligence Engineer"],
    subskills: ["Power BI / Tableau", "Excel Advanced Analytics", "Dashboard Design", "KPI Modeling"],
    learningAreas: ["Executive Data Storytelling", "Statistical Significance Testing", "Automated Reporting Pipelines"],
  },
  {
    id: "sk-7",
    name: "Agile Project Delivery & Cross-Functional Leadership",
    category: "Professional",
    demand: "High",
    growthRate: "+22% YoY",
    associatedRoles: ["Engineering Manager", "Technical Project Lead", "Product Manager"],
    subskills: ["Scrum & Kanban", "Sprint Planning", "Risk Mitigation", "Stakeholder Communication"],
    learningAreas: ["Scaled Agile Framework (SAFe)", "Engineering Metrics (DORA)", "Async Team Collaboration"],
  },
  {
    id: "sk-8",
    name: "Generative AI Integration & Prompt Engineering",
    category: "Emerging",
    demand: "Very High",
    growthRate: "+78% YoY",
    associatedRoles: ["AI Applications Developer", "Product Innovator", "Solutions Architect"],
    subskills: ["LLM API Orchestration", "Prompt Design", "RAG Architectures", "Embedding Search", "Evaluation Benchmarking"],
    learningAreas: ["Agentic Tool Calling", "Fine-Tuning Small Models", "AI Governance & Guardrails"],
  },
];

interface CareerGapProfile {
  career: string;
  coreSkills: string[];
  commonGaps: string[];
  recommendations: string[];
}

const DEFAULT_GAP_PROFILE: CareerGapProfile = {
  career: "Software Developer",
  coreSkills: ["Java or TypeScript", "Object-Oriented Design", "SQL & Database Queries", "RESTful APIs", "Git Version Control"],
  commonGaps: ["Distributed Caching (Redis)", "Database Query Optimization & Indexing", "CI/CD Automation", "Unit & Integration Testing"],
  recommendations: [
    "Build a multi-tier web application integrating relational databases with clean DAO separation.",
    "Practice SQL query tuning using EXPLAIN plans on medium-to-large datasets.",
    "Implement test coverage using standard test runners (Vitest or JUnit).",
  ],
};

const CAREER_SKILL_GAP_PROFILES: CareerGapProfile[] = [
  DEFAULT_GAP_PROFILE,
  {
    career: "AI / ML Engineer",
    coreSkills: ["Python Programming", "Linear Algebra & Probability", "Machine Learning Algorithms", "PyTorch or TensorFlow", "SQL"],
    commonGaps: ["Model Serving at Scale (FastAPI/Docker)", "Feature Store Management", "Data Validation & Drift Detection", "MLOps Lifecycle"],
    recommendations: [
      "Deploy a trained model as an authenticated REST service inside a container.",
      "Explore vector embeddings and semantic search integration.",
      "Benchmark model inference latency under concurrent simulated requests.",
    ],
  },
  {
    career: "Data Analyst",
    coreSkills: ["Advanced SQL", "Business Intelligence (Power BI/Tableau)", "Python or R for Analytics", "Data Cleaning", "Spreadsheet Modeling"],
    commonGaps: ["Automated ETL Pipelines", "Statistical Hypothesis Testing", "Executive Stakeholder Storytelling", "Data Warehousing Schemas"],
    recommendations: [
      "Build an automated data pipeline extracting and transforming operational records.",
      "Design an interactive executive dashboard visualizing cohort retention and metrics.",
      "Learn star-schema and snowflake-schema dimensional modeling.",
    ],
  },
];

function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Technical" | "Professional" | "Emerging">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCareerName, setSelectedCareerName] = useState<string>("Software Developer");
  const selectedCareerGap: CareerGapProfile =
    CAREER_SKILL_GAP_PROFILES.find((p) => p.career === selectedCareerName) ?? DEFAULT_GAP_PROFILE;

  const filteredSkills = SKILLS_CATALOG.filter((skill) => {
    const matchesCategory = selectedCategory === "All" || skill.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.associatedRoles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
      skill.subskills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Skills Intelligence & Benchmarks
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
                Discover Skills & Competencies
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Benchmark your competencies against industry hiring demand, explore structured development pathways, and close critical career-related skill gaps.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground shrink-0">
              <Info className="size-4 text-primary" />
              <span>Curated Industry Benchmark Dataset</span>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="surface-card rounded-2xl p-4 sm:p-6 border border-border space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {(["All", "Technical", "Professional", "Emerging"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {cat === "All" ? "All Competencies" : `${cat} Skills`}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by skill, role, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Showing <strong>{filteredSkills.length}</strong> of {SKILLS_CATALOG.length} verified competencies
              </span>
              <span>Updated Quarterly for Industry Hiring Cycles</span>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {skill.category}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {skill.growthRate}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-foreground">
                    {skill.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5 text-primary" />
                    <span>Demand: <strong className="text-foreground">{skill.demand}</strong></span>
                  </div>

                  {/* Subskills */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Core Topics
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skill.subskills.map((sub, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-secondary/70 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Learning Areas */}
                  <div className="mt-4 space-y-1 text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Recommended Focus
                    </span>
                    <ul className="space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
                      {skill.learningAreas.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Target: {skill.associatedRoles[0]}
                  </span>
                  <Button asChild size="sm" variant="ghost" className="text-xs px-2">
                    <Link to="/opportunities">
                      Roles <ArrowRight className="size-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Section: Career-Related Skill Gap Analyzer */}
          <div className="surface-card rounded-3xl p-6 sm:p-10 border border-border space-y-8 bg-gradient-to-b from-card to-muted/20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                <Target className="size-3.5" />
                <span>Career-Related Skill Gap Matrix</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Target Role Skill Gap Analysis
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                Select your intended career path to view core required competencies, typical gaps identified in candidate evaluations, and recommended learning actions.
              </p>
            </div>

            {/* Career Selector Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              {CAREER_SKILL_GAP_PROFILES.map((profile) => (
                <button
                  key={profile.career}
                  type="button"
                  onClick={() => setSelectedCareerName(profile.career)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    selectedCareerGap.career === profile.career
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {profile.career}
                </button>
              ))}
            </div>

            {/* Gap Analysis Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Expected Core Skills */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Expected Baseline Competencies</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Skills standard for entry-to-mid level roles in this specialization:
                </p>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {selectedCareerGap.coreSkills.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Identified Common Gaps */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Target className="size-4 text-amber-500" />
                  <span>Common Candidate Skill Gaps</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Frequent competency blind spots observed in candidate evaluations:
                </p>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {selectedCareerGap.commonGaps.map((g, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Learning Roadmap */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <BookOpen className="size-4 text-primary" />
                  <span>Recommended Action Plan</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Targeted milestones to close these gaps and qualify for top interviews:
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {selectedCareerGap.recommendations.map((rec, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <strong>{idx + 1}.</strong> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
