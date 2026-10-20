import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  Table,
  LayoutGrid,
  CheckCircle2,
  X,
  ExternalLink,
  Download,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/career-profiles")({
  head: () => ({
    meta: [
      { title: "Career Profiles Directory — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Browse verified professional candidate profiles, technical competencies, education credentials, and career goals.",
      },
    ],
  }),
  component: CareerProfilesPage,
});

interface CandidateProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  education: string;
  skills: string[];
  careerGoal: string;
  experience: "Fresher" | "0 - 2 Years" | "2 - 5 Years" | "5+ Years";
  bio: string;
}

// Authoritative 8 candidate profiles backed by standardized XML schema
const XML_BACKED_PROFILES: CandidateProfile[] = [
  {
    id: 1001,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "9876543210",
    education: "B.E / B.Tech",
    skills: ["HTML", "CSS", "JavaScript", "Java", "Spring Boot"],
    careerGoal: "Software Developer",
    experience: "Fresher",
    bio: "Focused on scalable distributed web applications, enterprise Java architectures, and modern component systems.",
  },
  {
    id: 1002,
    name: "Arun Kumar",
    email: "arun@gmail.com",
    phone: "8765432109",
    education: "B.E / B.Tech",
    skills: ["Python", "SQL", "Machine Learning", "PyTorch"],
    careerGoal: "AI / ML Engineer",
    experience: "Fresher",
    bio: "Passionate about applied machine learning models, predictive intelligence pipelines, and neural networks.",
  },
  {
    id: 1003,
    name: "Priya",
    email: "priya@gmail.com",
    phone: "7654321098",
    education: "B.Sc",
    skills: ["Excel", "SQL", "Power BI", "Data Analytics"],
    careerGoal: "Data Analyst",
    experience: "0 - 2 Years",
    bio: "Experienced in operational data modeling, business intelligence dashboards, and statistical KPI analysis.",
  },
  {
    id: 1004,
    name: "Vijay",
    email: "vijay@gmail.com",
    phone: "9543216780",
    education: "B.E / B.Tech",
    skills: ["Java", "Spring Boot", "SQL", "REST APIs"],
    careerGoal: "Software Developer",
    experience: "0 - 2 Years",
    bio: "Backend software engineer building microservices, database transactions, and high-concurrency systems.",
  },
  {
    id: 1005,
    name: "Divya",
    email: "divya@gmail.com",
    phone: "8899776655",
    education: "M.Sc",
    skills: ["Python", "Statistics", "SQL", "R"],
    careerGoal: "Data Analyst",
    experience: "Fresher",
    bio: "Specializing in statistical hypothesis testing, data visualization, and exploratory data intelligence.",
  },
  {
    id: 1006,
    name: "Karthik",
    email: "karthik@gmail.com",
    phone: "9988776655",
    education: "B.E / B.Tech",
    skills: ["Python", "TensorFlow", "Deep Learning", "AI"],
    careerGoal: "AI / ML Engineer",
    experience: "2 - 5 Years",
    bio: "Senior AI engineer delivering production computer vision and natural language processing pipelines.",
  },
  {
    id: 1007,
    name: "Frehja",
    email: "frehja@gmail.com",
    phone: "9123456780",
    education: "B.E / B.Tech",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    careerGoal: "Web Developer",
    experience: "Fresher",
    bio: "Frontend engineer dedicated to responsive UI architecture, accessible design tokens, and smooth user interactions.",
  },
  {
    id: 1008,
    name: "Saul",
    email: "saul@gmail.com",
    phone: "9345678120",
    education: "M.E / M.Tech",
    skills: ["Java", "Python", "Cloud Computing", "AWS", "Docker"],
    careerGoal: "Data Engineer",
    experience: "2 - 5 Years",
    bio: "Data platform engineer building robust ETL pipelines, cloud storage architectures, and big data clusters.",
  },
];

function CareerProfilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeProfileModal, setActiveProfileModal] = useState<CandidateProfile | null>(null);

  const filteredProfiles = XML_BACKED_PROFILES.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.careerGoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExp = experienceFilter === "All" || p.experience === experienceFilter;
    const matchesRole = roleFilter === "All" || p.careerGoal === roleFilter;

    return matchesSearch && matchesExp && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Talent Directory
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
                Career Profiles Directory
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Browse verified professional candidate profiles, technical competencies, educational qualifications, and career goals.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="rounded-full text-xs">
                <Link to="/profile">Create Your Profile</Link>
              </Button>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="surface-card rounded-2xl p-4 sm:p-6 border border-border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search by Query */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by candidate name, skill, or goal..."
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

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="All">All Career Goals</option>
                  <option value="Software Developer">Software Developer</option>
                  <option value="AI / ML Engineer">AI / ML Engineer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Web Developer">Web Developer</option>
                  <option value="Data Engineer">Data Engineer</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-background">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    viewMode === "cards"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-3.5" /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    viewMode === "table"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Table className="size-3.5" /> Directory
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
              <span>
                Displaying <strong>{filteredProfiles.length}</strong> of {XML_BACKED_PROFILES.length} verified candidate profiles
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="size-3.5" /> Standardized Profile Registry
              </span>
            </div>
          </div>

          {/* VIEW MODE 1: CARDS GRID */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="grid size-12 place-items-center rounded-xl bg-primary/10 font-bold font-display text-primary text-sm">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                        #{p.id}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground">
                      {p.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {p.careerGoal}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      <span>{p.education}</span>
                      <span>•</span>
                      <span>{p.experience}</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {p.bio}
                    </p>

                    {/* Skill Tags */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {p.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                      {p.skills.length > 3 && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                          +{p.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {p.phone}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveProfileModal(p)}
                      className="rounded-full text-xs px-3 h-8"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: STRUCTURED DIRECTORY TABLE */}
          {viewMode === "table" && (
            <div className="surface-card rounded-2xl overflow-hidden border border-border shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="p-3.5 font-semibold">Profile ID</th>
                      <th className="p-3.5 font-semibold">Candidate Name</th>
                      <th className="p-3.5 font-semibold">Contact Email</th>
                      <th className="p-3.5 font-semibold">Phone</th>
                      <th className="p-3.5 font-semibold">Education</th>
                      <th className="p-3.5 font-semibold">Technical Competencies</th>
                      <th className="p-3.5 font-semibold">Career Goal</th>
                      <th className="p-3.5 font-semibold">Experience</th>
                      <th className="p-3.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">
                          #{p.id}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">
                          {p.name}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-[11px]">
                          {p.email}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {p.phone}
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {p.education}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {p.skills.join(", ")}
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {p.careerGoal}
                        </td>
                        <td className="p-3.5">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {p.experience}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveProfileModal(p)}
                            className="h-7 text-xs px-2"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FULL CANDIDATE PROFILE MODAL */}
      {activeProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveProfileModal(null)}
              className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>

            <div className="space-y-6">
              {/* Member Card Header */}
              <div className="flex items-center gap-4 border-b border-border pb-5">
                <div className="grid size-16 place-items-center rounded-2xl bg-primary font-display text-2xl font-bold text-primary-foreground shadow-sm">
                  {activeProfileModal.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                    {activeProfileModal.name}
                    <ShieldCheck className="size-4 text-primary" />
                  </h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {activeProfileModal.careerGoal}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Profile ID #{activeProfileModal.id} • {activeProfileModal.education}
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">
                    Professional Summary
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {activeProfileModal.bio}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Email Address</span>
                    <span className="font-mono text-foreground font-semibold mt-0.5 block">
                      {activeProfileModal.email}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <span className="text-muted-foreground block text-[11px]">Mobile Phone</span>
                    <span className="font-mono text-foreground font-semibold mt-0.5 block">
                      +91 {activeProfileModal.phone}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-2">
                    Verified Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProfileModal.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 bg-muted/15 flex items-center justify-between">
                  <span className="text-muted-foreground">Experience Tier:</span>
                  <span className="font-bold text-foreground">{activeProfileModal.experience}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveProfileModal(null)}
                  className="rounded-full text-xs"
                >
                  Close
                </Button>
                <Button asChild size="sm" className="rounded-full text-xs">
                  <Link to="/opportunities">View Matched Opportunities</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfessionalFooter />
    </div>
  );
}
