import { useState } from "react";
import { getApiUrl } from "@/lib/api-config";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { Database, Server, Send, CheckCircle2, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  careerGoal: string;
  experience: string;
  goals: string;
}

const INITIAL_RECORDS: ProfileRecord[] = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "9876543210",
    education: "B.E / B.Tech",
    skills: "HTML, CSS, JavaScript, Java, SQL",
    careerGoal: "Software Developer",
    experience: "Fresher",
    goals: "Build scalable cloud applications and enterprise career intelligence systems.",
  },
  {
    id: 2,
    name: "Arun Kumar",
    email: "arun@gmail.com",
    phone: "8765432109",
    education: "B.E / B.Tech",
    skills: "Python, SQL, Machine Learning",
    careerGoal: "AI / ML Engineer",
    experience: "Fresher",
    goals: "Work on foundation AI models and machine learning pipelines.",
  },
];

export function Exercise6aThreeTier() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-6a")!;
  const [records, setRecords] = useState<ProfileRecord[]>(INITIAL_RECORDS);

  const [form, setForm] = useState({
    name: "Priya Raman",
    email: "priya@gmail.com",
    phone: "7654321098",
    education: "B.Sc",
    skills: "Excel, SQL, Power BI, Statistics",
    careerGoal: "Data Analyst",
    experience: "0 - 2 Years",
    goals: "Lead enterprise data visualization and BI initiatives.",
  });

  const [lastInserted, setLastInserted] = useState<ProfileRecord | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: ProfileRecord = {
      id: records.length + 1,
      ...form,
    };
    setRecords((prev) => [newRecord, ...prev]);
    setLastInserted(newRecord);
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
        externalLink={getApiUrl("/career.jsp")}
      />

      <div className="space-y-8">
          {/* 3-Tier Architecture Diagram */}
          <div className="surface-card p-6">
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Server className="size-4 text-primary" />
              Three-Tier Application Architecture
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                <span className="text-[11px] font-mono font-bold uppercase text-blue-500">
                  Tier 1
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">Presentation Layer</h4>
                <p className="mt-1 text-xs text-muted-foreground font-mono">career.jsp</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  HTML form UI collecting student profile details.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <span className="text-[11px] font-mono font-bold uppercase text-emerald-500">
                  Tier 2
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">Application Layer</h4>
                <p className="mt-1 text-xs text-muted-foreground font-mono">career-result.jsp</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  JSP Scriptlet processing request parameters & JDBC business logic.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-center">
                <span className="text-[11px] font-mono font-bold uppercase text-purple-500">
                  Tier 3
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">Database Layer</h4>
                <p className="mt-1 text-xs text-muted-foreground font-mono">Career Database (CC_PROD_DB)</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  CareerProfiles table storing persistent records via PreparedStatement.
                </p>
              </div>
            </div>
          </div>

          {/* Form and Submission Result */}
          <div className="grid gap-6 lg:grid-cols-12 min-w-0">
            {/* Candidate Entry Form */}
            <div className="surface-card p-4 sm:p-6 lg:col-span-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                    Candidate Profile Entry Form
                  </h3>
                  <p className="text-xs text-muted-foreground break-words">
                    Submits to <code className="text-primary font-mono">/career-result.jsp</code>
                  </p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                  Tier 1 & 2
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Education
                    </label>
                    <select
                      value={form.education}
                      onChange={(e) => setForm({ ...form, education: e.target.value })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                    >
                      <option>B.E / B.Tech</option>
                      <option>M.E / M.Tech</option>
                      <option>B.Sc</option>
                      <option>M.Sc</option>
                      <option>MBA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Career Goal
                    </label>
                    <select
                      value={form.careerGoal}
                      onChange={(e) => setForm({ ...form, careerGoal: e.target.value })}
                      required
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                    >
                      <option>Software Developer</option>
                      <option>Data Analyst</option>
                      <option>Data Engineer</option>
                      <option>AI / ML Engineer</option>
                      <option>Web Developer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Skills</label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Experience
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  >
                    <option>Fresher</option>
                    <option>0 - 2 Years</option>
                    <option>2 - 5 Years</option>
                    <option>5+ Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Career Goals
                  </label>
                  <textarea
                    value={form.goals}
                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                    required
                    rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 bg-[#238636] hover:bg-[#176b2c] text-white whitespace-normal h-auto py-2.5 text-center text-xs sm:text-sm"
                >
                  <Send className="size-4 shrink-0" />
                  <span>Submit to career-result.jsp (JDBC INSERT)</span>
                </Button>
              </form>
            </div>

            {/* Tier 2 & 3 Confirmation (career-result.jsp output) */}
            <div className="space-y-6 lg:col-span-6 min-w-0">
              <div className="surface-card p-4 sm:p-6 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <h4 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Database className="size-4 text-emerald-500 shrink-0" />
                    <span>career-result.jsp (Database Tier Result)</span>
                  </h4>
                  {lastInserted && (
                    <span className="text-xs font-mono text-emerald-500 font-bold shrink-0">
                      PreparedStatement Executed
                    </span>
                  )}
                </div>

                {lastInserted ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-white p-6 shadow-md dark:bg-slate-900">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#20c997] text-white text-2xl font-bold">
                      ✓
                    </div>
                    <h3 className="mt-3 text-center text-lg font-bold text-[#238636]">
                      Career Profile Created
                    </h3>
                    <p className="text-center text-xs text-muted-foreground">
                      Your Career Connect profile has been successfully saved to the database.
                    </p>

                    <div className="mt-4 rounded-lg bg-[#f7f9fc] p-4 text-xs space-y-1.5 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                      <p>
                        <b>Full Name:</b> {lastInserted.name}
                      </p>
                      <p>
                        <b>Email:</b> {lastInserted.email}
                      </p>
                      <p>
                        <b>Phone Number:</b> {lastInserted.phone}
                      </p>
                      <p>
                        <b>Education:</b> {lastInserted.education}
                      </p>
                      <p>
                        <b>Skills:</b> {lastInserted.skills}
                      </p>
                      <p>
                        <b>Career Goal:</b> {lastInserted.careerGoal}
                      </p>
                      <p>
                        <b>Experience:</b> {lastInserted.experience}
                      </p>
                      <p>
                        <b>Career Goals:</b> {lastInserted.goals}
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      INSERT INTO CareerProfiles VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                    Submit a profile from the left form to simulate the 3-Tier JSP + JDBC execution.
                  </div>
                )}
              </div>

              {/* Database Schema Overview */}
              <div className="surface-card p-6 border-l-4 border-l-purple-500">
                <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <TableIcon className="size-4 text-purple-500" />
                  Database Schema: CareerProfiles
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Persistent transactional schema storing candidate profile details, educational credentials, and verified skills.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">id (PK)</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">name</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">email</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">phone</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">education</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">skills</span>
                  <span className="rounded bg-muted px-2 py-1 text-[11px] font-mono">careerGoal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Live Table View */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Database className="size-4 text-emerald-500" />
                  Live CareerProfiles Records Table
                </h4>
                <p className="text-xs text-muted-foreground">
                  Live database query: {records.length} records indexed
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Education</th>
                    <th className="p-3 font-semibold">Skills</th>
                    <th className="p-3 font-semibold">Career Goal</th>
                    <th className="p-3 font-semibold">Experience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <td className="p-3 font-mono font-bold text-primary">{r.id}</td>
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3 text-muted-foreground">{r.email}</td>
                      <td className="p-3">{r.education}</td>
                      <td className="p-3 text-muted-foreground">{r.skills}</td>
                      <td className="p-3 font-medium text-emerald-600 dark:text-emerald-400">
                        {r.careerGoal}
                      </td>
                      <td className="p-3">{r.experience}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
}
