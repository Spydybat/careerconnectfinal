import { useState } from "react";
import { getApiUrl } from "@/lib/api-config";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { Server, Send, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Exercise5aServlet() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-5a")!;

  // Form state
  const [formData, setFormData] = useState({
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "9876543210",
    education: "B.E / B.Tech",
    skills: "HTML, CSS, JavaScript, Java, SQL",
    careerGoal: "Software Developer",
    experience: "Fresher",
  });

  const [servletResponse, setServletResponse] = useState<{
    status: number;
    executedAt: string;
    params: typeof formData;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServletResponse({
      status: 200,
      executedAt: new Date().toLocaleTimeString(),
      params: { ...formData },
    });
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
        externalLink={getApiUrl("/index-5a.html")}
      />

      <div className="grid gap-6 lg:grid-cols-12 min-w-0">
        {/* Profile Submission Form */}
        <div className="surface-card p-4 sm:p-6 lg:col-span-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                Candidate Profile Submission Portal
              </h3>
              <p className="text-xs text-muted-foreground break-words">
                Endpoint:{" "}
                <code className="text-primary font-mono font-semibold">/CareerServlet</code> •
                Method: <code className="text-primary font-mono font-semibold">POST</code>
              </p>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary shrink-0">
              Servlet 3.1
            </span>
          </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    name="education"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
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
                    name="careerGoal"
                    value={formData.careerGoal}
                    onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
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
                  name="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Experience
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                >
                  <option>Fresher</option>
                  <option>0 - 2 Years</option>
                  <option>2 - 5 Years</option>
                  <option>5+ Years</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 bg-[#238636] hover:bg-[#176b2c] text-white whitespace-normal h-auto py-2.5 text-center text-xs sm:text-sm"
              >
                <Send className="size-4 shrink-0" />
                <span>Invoke CareerServlet (POST /CareerServlet)</span>
              </Button>
            </form>
          </div>

          {/* Servlet Execution & HTTP Response Container */}
          <div className="space-y-6 lg:col-span-6 min-w-0">
            {/* Request/Response Inspector */}
            <div className="surface-card p-4 sm:p-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <h4 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Server className="size-4 text-emerald-500 shrink-0" />
                  <span>Servlet Engine Response</span>
                </h4>
                {servletResponse && (
                  <span className="font-mono text-xs text-emerald-500 font-bold shrink-0">
                    HTTP/1.1 200 OK ({servletResponse.executedAt})
                  </span>
                )}
              </div>

              {servletResponse ? (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-[#eaf6ff] p-6 text-slate-900 shadow-md">
                  <div className="rounded-lg bg-[#238636] p-4 text-center text-white">
                    <h2 className="text-xl font-bold tracking-wide">CAREER CONNECT</h2>
                    <p className="text-xs text-emerald-100">AI Career Intelligence Platform</p>
                  </div>

                  <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
                    <h3 className="text-center text-lg font-bold text-[#238636]">
                      Career Profile Created Successfully!
                    </h3>
                    <p className="text-center text-sm font-semibold text-[#238636] mt-0.5">
                      Welcome to Career Connect
                    </p>

                    <h4 className="mt-4 text-sm font-bold text-[#238636] border-b border-slate-200 pb-1">
                      Profile Details
                    </h4>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-800 divide-y divide-slate-100">
                      <p className="pt-1.5">
                        <b>Full Name:</b> {servletResponse.params.name}
                      </p>
                      <p className="pt-1.5">
                        <b>Email Address:</b> {servletResponse.params.email}
                      </p>
                      <p className="pt-1.5">
                        <b>Phone Number:</b> {servletResponse.params.phone}
                      </p>
                      <p className="pt-1.5">
                        <b>Education:</b> {servletResponse.params.education}
                      </p>
                      <p className="pt-1.5">
                        <b>Skills:</b> {servletResponse.params.skills}
                      </p>
                      <p className="pt-1.5">
                        <b>Career Goal:</b> {servletResponse.params.careerGoal}
                      </p>
                      <p className="pt-1.5">
                        <b>Experience:</b> {servletResponse.params.experience}
                      </p>
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-[#238636] border-b border-slate-200 pb-1">
                      Career Intelligence
                    </h4>
                    <div className="mt-2 space-y-1 text-xs text-slate-800">
                      <p>
                        <b>Profile Status:</b> Active
                      </p>
                      <p>
                        <b>Target Career:</b> {servletResponse.params.careerGoal}
                      </p>
                      <p>
                        <b>Skill Analysis:</b> Skills successfully recorded
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                  Submit the form on the left to simulate invoking{" "}
                  <code className="text-primary font-mono">CareerServlet</code>.
                </div>
              )}
            </div>

            {/* Enterprise Service Health Indicator */}
            <div className="surface-card p-6 border-l-4 border-l-emerald-500">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Server className="size-4 text-emerald-500" />
                Backend Service Operational
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                The career dispatch pipeline is active and handling incoming profile requests through high-throughput servlet workers.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
