import { useState } from "react";
import { getApiUrl } from "@/lib/api-config";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { Layers, Send, CheckCircle2, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Exercise6bThreeTierMvc() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-6b")!;

  const [form, setForm] = useState({
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "9876543210",
    education: "B.E / B.Tech",
    skills: "HTML, CSS, JavaScript, Java, Spring",
    careerGoal: "Software Developer",
    experience: "Fresher",
    goals: "Master enterprise MVC architectures and full-stack software development.",
  });

  const [mvcPipeline, setMvcPipeline] = useState<{
    step: "idle" | "model" | "dao" | "controller" | "view";
    profile: typeof form | null;
  }>({
    step: "idle",
    profile: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMvcPipeline({ step: "view", profile: { ...form } });
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
        externalLink={getApiUrl("/profile.jsp")}
      />

      <div className="space-y-8">
        {/* MVC Architecture Card */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Cpu className="size-5 text-primary" />
                Enterprise Model-View-Controller Architecture
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Decouples presentation from data access through strict JavaBean Model, DAO, and Controller layering.
              </p>
            </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Enterprise Design Pattern
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-500">
                  View (JSP)
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">profile.jsp</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Collects user inputs and posts to CareerServlet.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-500">
                  Controller (Servlet)
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">CareerServlet.java</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Instantiates Model & DAO, forwards to profile-result.jsp.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-500">
                  Model (JavaBean)
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">CareerProfile.java</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Encapsulates profile entity attributes & getters.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-500">
                  Data Access (DAO)
                </span>
                <h4 className="mt-1 font-bold text-sm text-foreground">CareerProfileDAO.java</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  PreparedStatement JDBC queries against SQL Server.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Form & Result */}
          <div className="grid gap-6 lg:grid-cols-12 min-w-0">
            {/* Form */}
            <div className="surface-card p-4 sm:p-6 lg:col-span-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <div className="min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                    Career Profile View (profile.jsp)
                  </h3>
                  <p className="text-xs text-muted-foreground break-words">
                    Action: <code className="text-primary font-mono">CareerServlet</code> • Method:
                    POST
                  </p>
                </div>
                <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-mono font-semibold text-primary">
                  View Layer
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
                  <span>Execute MVC Pipeline (CareerServlet &rarr; DAO &rarr; profile-result.jsp)</span>
                </Button>
              </form>
            </div>

            {/* MVC Execution Output */}
            <div className="space-y-6 lg:col-span-6 min-w-0">
              <div className="surface-card p-4 sm:p-6 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <h4 className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                    <span>profile-result.jsp (Forwarded View)</span>
                  </h4>
                  {mvcPipeline.profile && (
                    <span className="font-mono text-xs font-bold text-emerald-500 shrink-0">
                      RequestDispatcher.forward()
                    </span>
                  )}
                </div>

                {mvcPipeline.profile ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-white p-6 shadow-md dark:bg-slate-900">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#20c997] text-white text-2xl font-bold">
                      ✓
                    </div>
                    <h3 className="mt-3 text-center text-lg font-bold text-[#238636]">
                      Career Profile Created
                    </h3>
                    <p className="text-center text-xs text-muted-foreground">
                      Your Career Connect profile has been successfully processed by the MVC
                      Controller and stored via DAO.
                    </p>

                    <div className="mt-4 rounded-lg bg-[#f7f9fc] p-4 text-xs space-y-1.5 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                      <p>
                        <b>Full Name:</b> {mvcPipeline.profile.name}
                      </p>
                      <p>
                        <b>Email:</b> {mvcPipeline.profile.email}
                      </p>
                      <p>
                        <b>Phone Number:</b> {mvcPipeline.profile.phone}
                      </p>
                      <p>
                        <b>Education:</b> {mvcPipeline.profile.education}
                      </p>
                      <p>
                        <b>Skills:</b> {mvcPipeline.profile.skills}
                      </p>
                      <p>
                        <b>Career Goal:</b> {mvcPipeline.profile.careerGoal}
                      </p>
                      <p>
                        <b>Experience:</b> {mvcPipeline.profile.experience}
                      </p>
                      <p>
                        <b>Career Goals:</b> {mvcPipeline.profile.goals}
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      request.setAttribute(...) &rarr; rd.forward(request, response)
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
                    Submit a profile from the left form to simulate the full MVC lifecycle.
                  </div>
                )}
              </div>

              {/* Architecture Overview */}
              <div className="surface-card p-6 border-l-4 border-l-emerald-500">
                <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  Enterprise MVC Separation of Concerns
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  By isolating presentation, controller orchestration, and data access objects, the candidate management pipeline enables modular testing, reliable database transactions, and scalable API expansion.
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
