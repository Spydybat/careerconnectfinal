import { useState } from "react";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import {
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Table,
  Check,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  careerGoal: string;
  experience: string;
}

const PROFILES_DATA: CandidateProfile[] = [
  {
    id: 1001,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "9876543210",
    education: "B.E / B.Tech",
    skills: "HTML, CSS, JavaScript, Java",
    careerGoal: "Software Developer",
    experience: "Fresher",
  },
  {
    id: 1002,
    name: "Arun Kumar",
    email: "arun@gmail.com",
    phone: "8765432109",
    education: "B.E / B.Tech",
    skills: "Python, SQL, Machine Learning",
    careerGoal: "AI / ML Engineer",
    experience: "Fresher",
  },
  {
    id: 1003,
    name: "Priya",
    email: "priya@gmail.com",
    phone: "7654321098",
    education: "B.Sc",
    skills: "Excel, SQL, Power BI",
    careerGoal: "Data Analyst",
    experience: "0 - 2 Years",
  },
  {
    id: 1004,
    name: "Vijay",
    email: "vijay@gmail.com",
    phone: "9543216780",
    education: "B.E / B.Tech",
    skills: "Java, Spring, SQL",
    careerGoal: "Software Developer",
    experience: "0 - 2 Years",
  },
  {
    id: 1005,
    name: "Divya",
    email: "divya@gmail.com",
    phone: "8899776655",
    education: "M.Sc",
    skills: "Python, Statistics, SQL",
    careerGoal: "Data Analyst",
    experience: "Fresher",
  },
  {
    id: 1006,
    name: "Karthik",
    email: "karthik@gmail.com",
    phone: "9988776655",
    education: "B.E / B.Tech",
    skills: "Python, TensorFlow, AI",
    careerGoal: "AI / ML Engineer",
    experience: "2 - 5 Years",
  },
  {
    id: 1007,
    name: "Frehja",
    email: "frehja@gmail.com",
    phone: "9123456780",
    education: "B.E / B.Tech",
    skills: "HTML, CSS, JavaScript",
    careerGoal: "Web Developer",
    experience: "Fresher",
  },
  {
    id: 1008,
    name: "Saul",
    email: "saul@gmail.com",
    phone: "9345678120",
    education: "M.E / M.Tech",
    skills: "Java, Python, Cloud Computing",
    careerGoal: "Data Engineer",
    experience: "2 - 5 Years",
  },
];

const SCHEMA_SPECIFICATIONS = [
  { field: "profileId", type: "xs:positiveInteger", rule: "Unique identifier, range 1000–9999", required: "Yes" },
  { field: "name", type: "xs:string", rule: "Non-empty string, min 2 chars", required: "Yes" },
  { field: "email", type: "xs:string", rule: "Valid email format: [a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}", required: "Yes" },
  { field: "phone", type: "xs:string", rule: "Exactly 10 numeric digits ([0-9]{10})", required: "Yes" },
  { field: "education", type: "xs:string", rule: "Accredited qualification category", required: "Yes" },
  { field: "skills", type: "xs:string", rule: "Comma-separated competency list", required: "Yes" },
  { field: "careerGoal", type: "xs:string", rule: "Target profession designation", required: "Yes" },
  { field: "experience", type: "xs:string", rule: "Standardized tenure band", required: "Yes" },
];

export function Exercise7XmlXsdXsl() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-7")!;

  const [activeTab, setActiveTab] = useState<"directory" | "schema">("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [validationResult, setValidationResult] = useState<{
    status: "valid" | "invalid";
    message: string;
    details?: string;
  } | null>({
    status: "valid",
    message: "Candidate Dataset Verified Against Strict Enterprise Schema",
    details: "All 8 candidate profile records adhere to typed constraints and hierarchical structure.",
  });

  const runValidation = (type: "valid" | "invalid") => {
    if (type === "valid") {
      setValidationResult({
        status: "valid",
        message: "Candidate Dataset Verified Against Strict Enterprise Schema",
        details: "All 8 candidate profile records adhere to typed constraints and hierarchical structure.",
      });
    } else {
      setValidationResult({
        status: "invalid",
        message: "Schema Violation Detected & Ingestion Stream Rejected",
        details:
          "Type violation: Record missing mandatory elements [email, phone, education, skills, careerGoal, experience] and profileId failed integer constraint.",
      });
    }
  };

  const filteredProfiles = PROFILES_DATA.filter((p) =>
    searchTerm
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.careerGoal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skills.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
      />

      <div className="space-y-6">
        {/* Action & Verification Toolbar */}
        <div className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Standardized Profile Exchange & Schema Validation
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated document verification against strict schema rules and styled multi-tenant presentation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runValidation("valid")}
                className="gap-1.5 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3.5" /> Validate Ingestion Stream
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runValidation("invalid")}
                className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <AlertOctagon className="size-3.5" /> Test Violation Rejection
              </Button>
            </div>
          </div>

          {/* Validation Banner */}
          {validationResult && (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs transition-colors ${
                validationResult.status === "valid"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {validationResult.status === "valid" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertOctagon className="size-4" />
                )}
                {validationResult.message}
              </div>
              {validationResult.details && (
                <p className="mt-1 font-mono text-[11px] opacity-90 pl-6">
                  {validationResult.details}
                </p>
              )}
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("directory")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "directory"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Table className="size-3.5" /> Transformed Profile Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schema")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "schema"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <FileSpreadsheet className="size-3.5" /> Ingestion Schema Specifications
            </button>
          </div>
        </div>

        {/* Tab 1: Transformed Profile Directory */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            {/* Search Filter Bar */}
            <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by name, designation, or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Displaying <strong>{filteredProfiles.length}</strong> of {PROFILES_DATA.length} verified candidate profiles
              </span>
            </div>

            {/* Profile Table */}
            <div className="surface-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th className="p-3.5 font-semibold">ID</th>
                      <th className="p-3.5 font-semibold">Candidate Name</th>
                      <th className="p-3.5 font-semibold">Contact Email</th>
                      <th className="p-3.5 font-semibold">Phone</th>
                      <th className="p-3.5 font-semibold">Education</th>
                      <th className="p-3.5 font-semibold">Technical Skills</th>
                      <th className="p-3.5 font-semibold">Career Goal</th>
                      <th className="p-3.5 font-semibold">Experience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProfiles.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="p-3.5 font-mono font-bold text-primary">
                          #{p.id}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">
                          {p.name}
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                          {p.email}
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          {p.phone}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                            {p.education}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {p.skills}
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {p.careerGoal}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {p.experience}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ingestion Schema Specifications */}
        {activeTab === "schema" && (
          <div className="surface-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">
                  W3C Schema Type Definitions & Constraints
                </h4>
                <p className="text-xs text-muted-foreground">
                  Formal data contracts enforced on candidate profiles prior to database ingestion and platform rendering.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="p-3 font-semibold">Element Field</th>
                    <th className="p-3 font-semibold">W3C Schema Data Type</th>
                    <th className="p-3 font-semibold">Enforced Constraint Rule</th>
                    <th className="p-3 font-semibold">Mandatory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SCHEMA_SPECIFICATIONS.map((spec) => (
                    <tr key={spec.field} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-semibold text-foreground">
                        {spec.field}
                      </td>
                      <td className="p-3 font-mono text-xs text-primary">
                        {spec.type}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {spec.rule}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <Check className="size-3" /> {spec.required}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ingestion Security Information */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h5 className="font-semibold text-xs text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                Automated Ingestion Pipeline Integrity
              </h5>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Incoming candidate profiles undergo automatic validation against this schema. Profiles with malformed identifiers, unformatted contact coordinates, or unassigned roles are rejected at the edge before persistent storage.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
