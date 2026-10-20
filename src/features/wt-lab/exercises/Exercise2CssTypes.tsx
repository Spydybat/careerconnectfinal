import { useState } from "react";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { Layers, Paintbrush, FileCode2, Sparkles, Eye } from "lucide-react";

export function Exercise2CssTypes() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-2")!;
  const [cssMode, setCssMode] = useState<"all" | "inline" | "internal" | "external">("all");

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
        {/* Concept Explanation Card */}
        <div className="surface-card p-6">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Design System & Multi-Tier Styling Showcase
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore how inline styles, component-scoped styling, and global theme stylesheets cascade
            together across Career Connect interface components.
          </p>

          {/* Mode Selector Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <button
              type="button"
              onClick={() => setCssMode("all")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                cssMode === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5" /> All Styles Combined (Full Visual)
            </button>
            <button
              type="button"
              onClick={() => setCssMode("inline")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                cssMode === "inline"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Paintbrush className="size-3.5" /> Inline Styles Mode
            </button>
            <button
              type="button"
              onClick={() => setCssMode("internal")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                cssMode === "internal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" /> Component Scoped Styles
            </button>
            <button
              type="button"
              onClick={() => setCssMode("external")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                cssMode === "external"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <FileCode2 className="size-3.5" /> Global External Stylesheet
            </button>
          </div>

            {/* Scope explanation pill */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5 text-primary" />
                Active Mode:{" "}
                <strong className="text-foreground capitalize">{cssMode} Stylesheet</strong>
              </span>
              <span className="font-mono text-[11px]">
                {cssMode === "inline" && "Highest Specificity (Element-level)"}
                {cssMode === "internal" && "Document-level Scope (<head><style>)"}
                {cssMode === "external" && "Global Reusable Scope (linked style.css)"}
                {cssMode === "all" && "Cascaded Cascade Resolution (External + Internal + Inline)"}
              </span>
            </div>
          </div>

          {/* Sandbox Preview Container (Scoped styling to prevent page leakage) */}
          <div className="overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80"></span>
                <span className="size-3 rounded-full bg-yellow-500/80"></span>
                <span className="size-3 rounded-full bg-green-500/80"></span>
                <span className="ml-2">http://localhost:5173/wt-lab/exercise-2.html</span>
              </div>
              <span>Isolated CSS Viewport</span>
            </div>

            <div
              className={`p-8 transition-colors duration-500 ${
                cssMode === "external" || cssMode === "all"
                  ? "bg-gradient-to-br from-[#1b99f3] via-[#83ade8] to-[#1e74e6] text-black"
                  : "bg-white text-slate-900"
              }`}
            >
              {/* Hero Section */}
              <div className="text-center">
                {/* Top Label */}
                <div
                  className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider ${
                    cssMode === "external" || cssMode === "all"
                      ? "border border-[#31536a] bg-white/70 text-slate-900"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                  style={
                    cssMode === "inline" || cssMode === "all"
                      ? { letterSpacing: "3px", textTransform: "uppercase" }
                      : {}
                  }
                >
                  AI CAREER INTELLIGENCE PLATFORM
                </div>

                {/* Hero Title */}
                <h1
                  className={`mt-4 text-3xl font-extrabold sm:text-5xl tracking-widest ${
                    cssMode === "external" || cssMode === "all"
                      ? "text-black drop-shadow-md"
                      : "text-slate-900"
                  }`}
                  style={
                    cssMode === "inline" || cssMode === "all"
                      ? { color: "#000000", fontWeight: "900" }
                      : {}
                  }
                >
                  CAREER CONNECT
                </h1>

                {/* Subtitle */}
                <p
                  className="mt-3 text-sm sm:text-base max-w-xl mx-auto"
                  style={
                    cssMode === "inline" || cssMode === "all"
                      ? { color: "#111111", lineHeight: "1.6" }
                      : {}
                  }
                >
                  Connecting people, skills, opportunities and career intelligence through one
                  global platform.
                </p>

                {/* Hero Line */}
                <div
                  className="mx-auto my-6"
                  style={{
                    width: "120px",
                    height: "3px",
                    backgroundColor:
                      cssMode === "external" || cssMode === "all" ? "#04180c" : "#238636",
                    boxShadow:
                      cssMode === "external" || cssMode === "all"
                        ? "0 0 20px rgba(66, 216, 121, 0.8)"
                        : "none",
                  }}
                ></div>
              </div>

              {/* Centered Map Glow Container */}
              <div className="mx-auto max-w-2xl text-center my-8">
                <div className="relative inline-block rounded-2xl overflow-hidden border border-[#31536a] shadow-2xl bg-slate-900">
                  <img
                    src="/career-connect.png"
                    alt="Career Connect Architecture"
                    className="max-h-[350px] w-auto object-contain mx-auto"
                  />
                </div>
                <p
                  className="mt-4 text-xs tracking-widest font-semibold uppercase"
                  style={
                    cssMode === "inline" || cssMode === "all"
                      ? { color: "#000000", letterSpacing: "3px" }
                      : {}
                  }
                >
                  Click the hotspots to explore Career Connect.
                </p>
              </div>

              {/* Content Section: 01 Profile Table Card */}
              <div
                className={`mx-auto max-w-3xl rounded-2xl p-6 sm:p-8 my-8 relative transition-all ${
                  cssMode === "external" || cssMode === "all"
                    ? "bg-white/90 border border-[#263f52] shadow-2xl backdrop-blur-sm"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <div className="absolute right-6 top-6 text-4xl sm:text-5xl font-black text-slate-800/20">
                  01
                </div>
                <h2
                  className="text-2xl font-bold tracking-wide"
                  style={
                    cssMode === "inline" || cssMode === "all"
                      ? {
                          color: "#000000",
                          borderBottom: "2px solid #238636",
                          display: "inline-block",
                          paddingBottom: "4px",
                        }
                      : {}
                  }
                >
                  PROFILE
                </h2>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed max-w-xl">
                  Career Connect brings education, experience, projects, skills, certifications and
                  career goals into one professional profile.
                </p>

                {/* Table with External/Internal/Inline styles */}
                <div className="mt-6 overflow-x-auto rounded-xl">
                  <table className="w-full text-left text-xs border-collapse bg-white shadow-md">
                    <thead>
                      <tr
                        style={
                          cssMode === "external" || cssMode === "all"
                            ? { backgroundColor: "#173047", color: "#42d879" }
                            : { backgroundColor: "#f1f5f9", color: "#0f172a" }
                        }
                      >
                        <th className="p-3 font-bold border border-[#263d51]">Profile Area</th>
                        <th className="p-3 font-bold border border-[#263d51]">Information</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-semibold border border-[#263d51]">
                          Personal Information
                        </td>
                        <td className="p-3 border border-[#263d51] text-slate-800">
                          Professional identity and basic career information
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-semibold border border-[#263d51]">Education</td>
                        <td className="p-3 border border-[#263d51] text-slate-800">
                          Academic qualifications and educational background
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-semibold border border-[#263d51]">Experience</td>
                        <td className="p-3 border border-[#263d51] text-slate-800">
                          Internships, employment and professional experience
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-semibold border border-[#263d51]">Skills</td>
                        <td className="p-3 border border-[#263d51] text-slate-800">
                          Technical and professional capabilities
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <footer
                className="mt-12 text-center p-6 rounded-xl text-white"
                style={
                  cssMode === "external" || cssMode === "all"
                    ? {
                        background: "linear-gradient(#201b1bd6, #0066ff)",
                        borderTop: "1px solid #4397d7",
                      }
                    : { background: "#0f172a" }
                }
              >
                <div
                  className="text-lg font-bold tracking-widest"
                  style={{ color: "#42d879", letterSpacing: "4px" }}
                >
                  CAREER CONNECT
                </div>
                <p className="text-xs text-white/80 mt-1 tracking-widest uppercase">
                  Transforming Career Data Into Career Intelligence
                </p>
              </footer>
            </div>
          </div>
        </div>
    </div>
  );
}
