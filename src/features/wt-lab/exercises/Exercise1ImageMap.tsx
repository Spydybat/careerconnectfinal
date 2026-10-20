import { useState, useRef } from "react";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { UserRound, Briefcase, Sparkles, BarChart3, Crosshair, Check } from "lucide-react";

export function Exercise1ImageMap() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-1")!;
  const [selectedSection, setSelectedSection] = useState<
    "profile" | "jobs" | "skills" | "analytics"
  >("profile");
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: "profile" | "jobs" | "skills" | "analytics") => {
    setSelectedSection(section);
    const map: Record<string, React.RefObject<HTMLDivElement | null>> = {
      profile: profileRef,
      jobs: jobsRef,
      skills: skillsRef,
      analytics: analyticsRef,
    };
    map[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
      />

      <div className="space-y-8">
        {/* Top Controls & Inspector */}
        <div className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Interactive Career Connect Architecture Map
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any quadrant hotspot in the ecosystem diagram or use the direct navigation buttons.
              </p>
            </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection("profile")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSection === "profile"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <UserRound className="size-3.5" /> 01. Profile (60,120,300,300)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("jobs")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSection === "jobs"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Briefcase className="size-3.5" /> 02. Jobs (600,120,840,300)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("skills")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSection === "skills"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Sparkles className="size-3.5" /> 03. Skills (60,330,300,510)
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("analytics")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSection === "analytics"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <BarChart3 className="size-3.5" /> 04. Analytics (600,330,840,510)
                </button>
              </div>
            </div>

            {/* Image Map Container */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-slate-900/60 p-4 border border-border/80">
              <div className="relative max-w-full overflow-hidden rounded-lg shadow-xl">
                {/* Real HTML Image Map */}
                <img
                  src="/career-connect.png"
                  alt="Career Connect Architecture"
                  useMap="#careerconnect"
                  className="max-h-[550px] w-auto object-contain select-none"
                  width="950"
                  height="650"
                />

                <map name="careerconnect">
                  <area
                    shape="rect"
                    coords="60,120,300,300"
                    href="#profile"
                    alt="Profile"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("profile");
                    }}
                    onMouseEnter={() => setHoveredHotspot("Profile (60, 120, 300, 300)")}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  />
                  <area
                    shape="rect"
                    coords="600,120,840,300"
                    href="#jobs"
                    alt="Jobs"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("jobs");
                    }}
                    onMouseEnter={() => setHoveredHotspot("Jobs (600, 120, 840, 300)")}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  />
                  <area
                    shape="rect"
                    coords="60,330,300,510"
                    href="#skills"
                    alt="Skills"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("skills");
                    }}
                    onMouseEnter={() => setHoveredHotspot("Skills (60, 330, 300, 510)")}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  />
                  <area
                    shape="rect"
                    coords="600,330,840,510"
                    href="#analytics"
                    alt="Analytics"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("analytics");
                    }}
                    onMouseEnter={() => setHoveredHotspot("Analytics (600, 330, 840, 510)")}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  />
                </map>
              </div>

              {/* Live Coordinate Status Banner */}
              <div className="mt-3 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <Crosshair className="size-3.5 text-primary" />
                <span>
                  {hoveredHotspot ? (
                    <span className="text-emerald-400 font-semibold">
                      Hovering: {hoveredHotspot}
                    </span>
                  ) : (
                    "Move cursor over quadrants or click any hotspot rect to navigate"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Content Modules */}
          <div className="space-y-6">
            {/* Section 01: Profile */}
            <div
              ref={profileRef}
              className={`surface-card p-6 border-l-4 transition-all duration-300 ${
                selectedSection === "profile"
                  ? "border-l-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-l-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Hotspot #01 (coords: 60,120,300,300)
                    </span>
                    <h2 className="font-display text-xl font-bold text-foreground">PROFILE</h2>
                  </div>
                </div>
                {selectedSection === "profile" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                    <Check className="size-3.5" /> Active Section
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Career Connect brings education, experience, projects, skills, certifications and
                career goals into one professional profile.
              </p>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Profile Area</th>
                      <th className="p-3 font-semibold">Information</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="p-3 font-medium">Personal Information</td>
                      <td className="p-3 text-muted-foreground">
                        Professional identity and basic career information
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Education</td>
                      <td className="p-3 text-muted-foreground">
                        Academic qualifications and educational background
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Experience</td>
                      <td className="p-3 text-muted-foreground">
                        Internships, employment and professional experience
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Projects</td>
                      <td className="p-3 text-muted-foreground">
                        Academic and professional projects
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Skills</td>
                      <td className="p-3 text-muted-foreground">
                        Technical and professional capabilities
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Certifications</td>
                      <td className="p-3 text-muted-foreground">
                        Professional certifications and credentials
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Career Goals</td>
                      <td className="p-3 text-muted-foreground">
                        Target careers, industries and career preferences
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 02: Jobs */}
            <div
              ref={jobsRef}
              className={`surface-card p-6 border-l-4 transition-all duration-300 ${
                selectedSection === "jobs"
                  ? "border-l-blue-500 ring-2 ring-blue-500/20"
                  : "border-l-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Briefcase className="size-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                      Hotspot #02 (coords: 600,120,840,300)
                    </span>
                    <h2 className="font-display text-xl font-bold text-foreground">JOBS</h2>
                  </div>
                </div>
                {selectedSection === "jobs" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                    <Check className="size-3.5" /> Active Section
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Career Connect helps users find relevant opportunities based on skills, careers,
                companies, locations and job preferences.
              </p>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Job Intelligence</th>
                      <th className="p-3 font-semibold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="p-3 font-medium">Job Discovery</td>
                      <td className="p-3 text-muted-foreground">
                        Explore opportunities across different industries
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Skill Matching</td>
                      <td className="p-3 text-muted-foreground">
                        Compare required job skills with available skills
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Career Matching</td>
                      <td className="p-3 text-muted-foreground">
                        Connect career goals with suitable job roles
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Company Intelligence</td>
                      <td className="p-3 text-muted-foreground">
                        Explore companies and their hiring opportunities
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Location Intelligence</td>
                      <td className="p-3 text-muted-foreground">
                        Discover opportunities across cities and countries
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 03: Skills */}
            <div
              ref={skillsRef}
              className={`surface-card p-6 border-l-4 transition-all duration-300 ${
                selectedSection === "skills"
                  ? "border-l-amber-500 ring-2 ring-amber-500/20"
                  : "border-l-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                      Hotspot #03 (coords: 60,330,300,510)
                    </span>
                    <h2 className="font-display text-xl font-bold text-foreground">SKILLS</h2>
                  </div>
                </div>
                {selectedSection === "skills" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    <Check className="size-3.5" /> Active Section
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Career Connect analyzes skills to show current strengths, identify skill gaps and
                suggest skills needed for future careers.
              </p>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Skill Intelligence</th>
                      <th className="p-3 font-semibold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="p-3 font-medium">Technical Skills</td>
                      <td className="p-3 text-muted-foreground">
                        Analyze programming, cloud, AI and technology skills
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Professional Skills</td>
                      <td className="p-3 text-muted-foreground">
                        Evaluate communication, leadership and problem-solving skills
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Skill Demand</td>
                      <td className="p-3 text-muted-foreground">
                        Identify skills currently required by the job market
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Skill Gap</td>
                      <td className="p-3 text-muted-foreground">
                        Compare current skills with target career requirements
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Emerging Skills</td>
                      <td className="p-3 text-muted-foreground">
                        Identify rapidly growing technologies and future skills
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 04: Analytics */}
            <div
              ref={analyticsRef}
              className={`surface-card p-6 border-l-4 transition-all duration-300 ${
                selectedSection === "analytics"
                  ? "border-l-purple-500 ring-2 ring-purple-500/20"
                  : "border-l-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                    <BarChart3 className="size-5" />
                  </span>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                      Hotspot #04 (coords: 600,330,840,510)
                    </span>
                    <h2 className="font-display text-xl font-bold text-foreground">ANALYTICS</h2>
                  </div>
                </div>
                {selectedSection === "analytics" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">
                    <Check className="size-3.5" /> Active Section
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Career Connect transforms career data into useful intelligence about jobs, skills,
                salaries, hiring, learning and placement trends.
              </p>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Analytics Area</th>
                      <th className="p-3 font-semibold">Information Provided</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="p-3 font-medium">Career Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Career demand, growth and opportunity trends
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Skill Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Skill demand, skill gaps and emerging technologies
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Salary Intelligence</td>
                      <td className="p-3 text-muted-foreground">
                        Salary ranges and compensation percentiles
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Job Market Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Job growth, role demand and technology demand
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Hiring Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Applications, interviews, offers and hiring trends
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Placement Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Placement rates, salaries and company hiring
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Learning Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Learning progress, completion and career readiness
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
