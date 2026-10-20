import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Find Career Opportunities — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Discover verified career opportunities by job title, company, required skills, and experience level.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: "Remote" | "Hybrid" | "On-site";
  experienceLevel: "Fresher" | "0 - 2 Years" | "2 - 5 Years" | "5+ Years";
  employmentType: "Full-time" | "Contract" | "Internship";
  salary: string;
  skills: string[];
  description: string;
  responsibilities: string[];
}

const OPPORTUNITIES_DATA: Opportunity[] = [
  {
    id: "opp-1",
    title: "Senior Full-Stack Software Engineer",
    company: "CloudScale Technologies",
    location: "Bengaluru, Karnataka",
    locationType: "Hybrid",
    experienceLevel: "2 - 5 Years",
    employmentType: "Full-time",
    salary: "₹18,00,000 - ₹26,00,000",
    skills: ["Java", "Spring Boot", "React", "TypeScript", "SQL", "Cloud Architecture"],
    description:
      "Join our enterprise systems team developing high-throughput multi-tier cloud applications and scalable transactional architectures.",
    responsibilities: [
      "Design and maintain scalable REST microservices using Java and Spring Boot.",
      "Develop responsive user interfaces using React and modern design system tokens.",
      "Optimize relational database queries and transactional consistency.",
    ],
  },
  {
    id: "opp-2",
    title: "AI & Machine Learning Engineer",
    company: "Cognitive Intelligence Labs",
    location: "Hyderabad, Telangana",
    locationType: "Remote",
    experienceLevel: "0 - 2 Years",
    employmentType: "Full-time",
    salary: "₹14,00,000 - ₹20,00,000",
    skills: ["Python", "Machine Learning", "PyTorch", "SQL", "Statistics", "FastAPI"],
    description:
      "Develop and deploy predictive models, data transformation pipelines, and intelligent API endpoints.",
    responsibilities: [
      "Train, evaluate, and benchmark deep learning models for production services.",
      "Engineer feature pipelines for structured and unstructured enterprise datasets.",
      "Deploy low-latency inference services with automated monitoring.",
    ],
  },
  {
    id: "opp-3",
    title: "Enterprise Data & Analytics Specialist",
    company: "Synthesize Global Solutions",
    location: "Chennai, Tamil Nadu",
    locationType: "On-site",
    experienceLevel: "0 - 2 Years",
    employmentType: "Full-time",
    salary: "₹10,00,000 - ₹15,00,000",
    skills: ["SQL", "Power BI", "Python", "Data Modeling", "Excel"],
    description:
      "Transform complex operational records into executive business intelligence dashboards and predictive KPIs.",
    responsibilities: [
      "Construct relational database schemas and automated data validation rules.",
      "Design interactive executive reports in Power BI with drill-down metrics.",
      "Collaborate with hiring and placement stakeholders to optimize hiring velocity.",
    ],
  },
  {
    id: "opp-4",
    title: "Cloud Infrastructure & DevOps Engineer",
    company: "Aura Cloud Networks",
    location: "Pune, Maharashtra",
    locationType: "Remote",
    experienceLevel: "2 - 5 Years",
    employmentType: "Full-time",
    salary: "₹16,00,000 - ₹24,00,000",
    skills: ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "Terraform"],
    description:
      "Build resilient deployment infrastructure, container orchestration clusters, and automated continuous delivery pipelines.",
    responsibilities: [
      "Maintain Kubernetes clusters and configure zero-downtime rolling deployments.",
      "Enforce infrastructure security policies, SSL termination, and network peering.",
      "Implement observability alerts, distributed tracing, and automated failover.",
    ],
  },
  {
    id: "opp-5",
    title: "Frontend Design Systems Engineer",
    company: "Nexus Interactive Systems",
    location: "Gurugram, Haryana",
    locationType: "Hybrid",
    experienceLevel: "0 - 2 Years",
    employmentType: "Full-time",
    salary: "₹12,00,000 - ₹18,00,000",
    skills: ["React", "TypeScript", "Tailwind CSS", "Accessibility (a11y)", "Design Systems"],
    description:
      "Architect reusable component libraries, design token specifications, and accessible frontend interfaces.",
    responsibilities: [
      "Maintain multi-theme design tokens across web and mobile viewports.",
      "Ensure WCAG 2.1 AA accessibility compliance across all interaction states.",
      "Collaborate closely with UI/UX product designers to refine interaction workflows.",
    ],
  },
  {
    id: "opp-6",
    title: "Associate Software Developer",
    company: "Apex Financial Tech",
    location: "Mumbai, Maharashtra",
    locationType: "On-site",
    experienceLevel: "Fresher",
    employmentType: "Full-time",
    salary: "₹8,00,000 - ₹12,00,000",
    skills: ["Java", "SQL", "OOP Design", "HTML/CSS", "Git"],
    description:
      "Great opportunity for new engineering graduates to build financial ledger components and backend services.",
    responsibilities: [
      "Participate in daily agile standups and write clean, modular Java code.",
      "Implement unit test suites ensuring comprehensive branch coverage.",
      "Write SQL migration scripts and verify relational constraints.",
    ],
  },
  {
    id: "opp-7",
    title: "Business Intelligence & Reporting Analyst",
    company: "Matrix Global Analytics",
    location: "Bengaluru, Karnataka",
    locationType: "Hybrid",
    experienceLevel: "0 - 2 Years",
    employmentType: "Full-time",
    salary: "₹9,00,000 - ₹14,00,000",
    skills: ["Power BI", "SQL", "Statistics", "Excel", "Tableau"],
    description:
      "Deliver automated reporting pipelines and actionable placement analytics to senior leadership.",
    responsibilities: [
      "Analyze hiring cohort trends and generate quarterly performance benchmarks.",
      "Validate incoming data batches against structured schema rules.",
      "Design KPI cards and cross-cohort comparative charts.",
    ],
  },
  {
    id: "opp-8",
    title: "Applied Generative AI Associate",
    company: "PromptFlow Systems",
    location: "Remote",
    locationType: "Remote",
    experienceLevel: "Fresher",
    employmentType: "Contract",
    salary: "₹10,00,000 - ₹16,00,000",
    skills: ["Python", "Prompt Engineering", "LLM APIs", "Vector DBs", "RAG"],
    description:
      "Help build context-aware AI assistants, knowledge retrieval pipelines, and structured evaluation benchmarks.",
    responsibilities: [
      "Develop evaluation datasets to measure LLM accuracy and hallucination rates.",
      "Integrate vector search embeddings into document retrieval flows.",
      "Write automated integration tests for AI agent tools and endpoints.",
    ],
  },
];

function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [activeModalOpportunity, setActiveModalOpportunity] = useState<Opportunity | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantNotes, setApplicantNotes] = useState("");

  const filteredOpportunities = OPPORTUNITIES_DATA.filter((opp) => {
    const matchesSearch =
      searchQuery === "" ||
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExperience =
      experienceFilter === "All" || opp.experienceLevel === experienceFilter;

    const matchesType = typeFilter === "All" || opp.employmentType === typeFilter;

    const matchesLocation = locationFilter === "All" || opp.locationType === locationFilter;

    return matchesSearch && matchesExperience && matchesType && matchesLocation;
  });

  const handleOpenModal = (opp: Opportunity) => {
    setActiveModalOpportunity(opp);
    setApplicationSubmitted(false);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplicationSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Career Discovery
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
                Find Career Opportunities
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Explore verified career openings across top technology companies and enterprise hiring teams, filtered by required skills and experience level.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground shrink-0">
              <Info className="size-4 text-primary" />
              <span>Platform Demonstration Dataset</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="surface-card rounded-2xl p-4 sm:p-6 border border-border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search by Query */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Experience Filter */}
              <div>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Experience Tiers</option>
                  <option value="Fresher">Fresher</option>
                  <option value="0 - 2 Years">0 - 2 Years</option>
                  <option value="2 - 5 Years">2 - 5 Years</option>
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Employment Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Location Type */}
              <div>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Work Modes</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
              <span>
                Displaying <strong>{filteredOpportunities.length}</strong> matching career opportunities
              </span>
              <span>All listings verified for credential eligibility</span>
            </div>
          </div>

          {/* Opportunities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between hover:shadow-md transition-all hover:border-primary/40"
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground">
                        <Building2 className="size-4 text-primary shrink-0" />
                        <span className="truncate">{opp.company}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-normal shrink-0">
                          {opp.locationType}
                        </span>
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-1 break-words">
                        {opp.title}
                      </h3>
                    </div>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0 self-start">
                      {opp.salary}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {opp.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5 text-muted-foreground" />
                      {opp.experienceLevel}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {opp.employmentType}
                    </span>
                  </div>

                  {/* Required Skills Chips */}
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
                  <span className="text-[11px] text-muted-foreground">
                    Direct hiring application
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenModal(opp)}
                    className="rounded-full text-xs px-4"
                  >
                    View Details & Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* VIEW DETAILS & APPLY MODAL */}
      {activeModalOpportunity && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveModalOpportunity(null)}
              className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>

            {/* Modal Content */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                  <Building2 className="size-4" />
                  <span>{activeModalOpportunity.company}</span>
                  <span>•</span>
                  <span>{activeModalOpportunity.location}</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-foreground mt-1">
                  {activeModalOpportunity.title}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                    {activeModalOpportunity.experienceLevel}
                  </span>
                  <span className="rounded-md bg-secondary px-2.5 py-0.5 text-secondary-foreground font-medium">
                    {activeModalOpportunity.employmentType}
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {activeModalOpportunity.salary}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Role Description
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {activeModalOpportunity.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Key Responsibilities
                </h4>
                <ul className="space-y-1.5 list-disc pl-4 text-muted-foreground">
                  {activeModalOpportunity.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* Required Skills */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Required Technical Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalOpportunity.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* APPLICATION FORM OR CONFIRMATION */}
              <div className="border-t border-border pt-6">
                {applicationSubmitted ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">
                        Application submitted successfully to {activeModalOpportunity.company}!
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-1">
                        Your verified profile credentials and contact coordinates have been transmitted directly to the hiring coordinator.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveModalOpportunity(null)}
                        className="mt-3 text-xs rounded-full border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/20"
                      >
                        Close & Continue Browsing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      Quick Application with Career Connect Profile
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Applicant Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Brief Cover Note / Candidate Summary
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Describe your background and why you are interested in this position..."
                        value={applicantNotes}
                        onChange={(e) => setApplicantNotes(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-muted-foreground">
                        Verified credentials will be automatically attached.
                      </span>
                      <Button type="submit" size="sm" className="rounded-full text-xs px-5 gap-1.5 w-full sm:w-auto shrink-0">
                        <Send className="size-3.5" /> Submit Application
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfessionalFooter />
    </div>
  );
}
