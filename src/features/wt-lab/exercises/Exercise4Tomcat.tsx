import { useState } from "react";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import {
  Server,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Terminal,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOMCAT_STEPS = [
  {
    step: 1,
    title: "Visit the Apache Tomcat Website",
    detail:
      "Open a web browser and go to the official Apache Tomcat website (tomcat.apache.org). Download the Windows Service Installer (.exe) for the required version (Tomcat 9.0 or 10.1).",
  },
  {
    step: 2,
    title: "Launch the Installer",
    detail:
      "Locate the downloaded Tomcat .exe file and open it. The Apache Tomcat Setup Wizard will be displayed. Click Next to proceed.",
  },
  {
    step: 3,
    title: "Accept the License Agreement",
    detail:
      "The license agreement will be shown on the screen. Review the terms and select 'I Agree' to proceed with the installation.",
  },
  {
    step: 4,
    title: "Select Required Components",
    detail:
      "The installer displays Choose Components screen. Ensure Tomcat, Core, Service Startup, Native, Tomcat Host Manager, and Manager App are selected.",
  },
  {
    step: 5,
    title: "Configure Tomcat Port & Credentials",
    detail:
      "Specify the HTTP connector port, default 8080 (or 8085 if occupied). Enter administrator username and password (e.g., MZ / mzcet@1234 or admin) for management app access.",
  },
  {
    step: 6,
    title: "Proceed with the Installation",
    detail:
      "The installer extracts and installs the necessary binaries and configuration files. Allow the installation progress bar to complete.",
  },
  {
    step: 7,
    title: "Specify JDK Location",
    detail:
      "When the Java Virtual Machine (JVM) path is requested, browse to the location where the JDK is installed (e.g., C:\\Program Files\\Java\\jdk-xx). Select the folder and click Next.",
  },
  {
    step: 8,
    title: "Finish the Setup",
    detail:
      "After configuration is complete, the Setup Wizard Completed screen appears. Ensure 'Run Apache Tomcat' is checked, and click Finish.",
  },
  {
    step: 9,
    title: "Verify Tomcat Through Localhost",
    detail:
      "Open a web browser and enter http://localhost:8080 in the address bar. The Apache Tomcat welcome page will display if Tomcat is running correctly.",
  },
  {
    step: 10,
    title: "Open the Management Application",
    detail:
      "From the Tomcat welcome page, click 'Manager App' or 'Host Manager'. Provide the administrator credentials created during configuration.",
  },
  {
    step: 11,
    title: "Access Tomcat Web Application Manager",
    detail:
      "After successful authentication, the Tomcat Web Application Manager dashboard opens. It allows deploying WAR files, starting/stopping servlets, and monitoring active sessions.",
  },
];

export function Exercise4Tomcat() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-4")!;
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  ]);

  const toggleStep = (s: number) => {
    setCompletedSteps((prev) => (prev.includes(s) ? prev.filter((i) => i !== s) : [...prev, s]));
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

      <div className="space-y-6">
          {/* Status & Architecture Banner */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card p-5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Java SE Runtime
              </span>
              <p className="mt-2 text-xl font-bold font-mono">Java 26 SE</p>
              <p className="mt-1 text-xs text-muted-foreground">Installed and available locally</p>
            </div>

            <div className="surface-card p-5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                <Server className="size-4" /> Default HTTP Port
              </span>
              <p className="mt-2 text-xl font-bold font-mono">8080 / 8085</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Connector configured in server.xml
              </p>
            </div>

            <div className="surface-card p-5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">
                <Shield className="size-4" /> Manager Role
              </span>
              <p className="mt-2 text-xl font-bold font-mono">manager-gui</p>
              <p className="mt-1 text-xs text-muted-foreground">Declared in tomcat-users.xml</p>
            </div>
          </div>

          {/* Interactive Step-by-Step Procedure */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="surface-card p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Step-by-Step Installation Procedure
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Follow each step exactly as specified in the lab manual.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                  {completedSteps.length} of {TOMCAT_STEPS.length} Completed
                </span>
              </div>

              <div className="mt-4 divide-y divide-border/60">
                {TOMCAT_STEPS.map((s) => {
                  const isDone = completedSteps.includes(s.step);
                  const isCurrent = activeStep === s.step;
                  return (
                    <div
                      key={s.step}
                      onClick={() => setActiveStep(s.step)}
                      className={`cursor-pointer p-3.5 transition-colors rounded-lg my-1 ${
                        isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStep(s.step);
                            }}
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border text-xs transition-colors ${
                              isDone
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/40 bg-background text-transparent"
                            }`}
                          >
                            ✓
                          </button>
                          <div>
                            <span className="text-[11px] font-mono font-bold uppercase text-primary">
                              STEP {s.step}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {s.detail}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`size-4 shrink-0 transition-transform ${isCurrent ? "rotate-90 text-primary" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification & Embedded Server Runner Box */}
            <div className="space-y-6 lg:col-span-5">
              {/* Localhost Verification Simulator */}
              <div className="surface-card p-6">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Globe className="size-4 text-emerald-500" />
                  Tomcat Verification Sandbox
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Simulate connection to the Tomcat web server at localhost:8080.
                </p>

                <div className="mt-4 rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                    <span>GET http://localhost:8080/</span>
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </div>
                  <div className="mt-3 space-y-1 text-slate-300">
                    <p className="text-emerald-400 font-bold">HTTP/1.1 200 OK</p>
                    <p>Server: Apache-Coyote/1.1</p>
                    <p>Content-Type: text/html;charset=UTF-8</p>
                    <p className="pt-2 text-slate-400">
                      &lt;!-- Apache Tomcat Welcome Screen --&gt;
                    </p>
                    <p className="text-emerald-400">
                      If you're seeing this, you've successfully installed Tomcat. Congratulations!
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <a href="http://localhost:8080" target="_blank" rel="noreferrer">
                      Open http://localhost:8080
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <a href="http://localhost:8080/manager/html" target="_blank" rel="noreferrer">
                      Open Manager App
                    </a>
                  </Button>
                </div>
              </div>

              {/* Standalone Java Runner Box */}
              <div className="surface-card p-6 border-l-4 border-l-primary">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Terminal className="size-4 text-primary" />
                  Built-in Embedded Java Server
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We have included a compiled standalone Java Web Server (
                  <code className="text-primary font-mono">EmbeddedLabServer.java</code>) that runs
                  directly on your Java runtime without requiring third-party software.
                </p>

                <div className="mt-4 rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-200">
                  <p className="text-slate-400"># Start standalone lab server:</p>
                  <p className="text-emerald-400 font-semibold">cd wt-lab/java-web</p>
                  <p className="text-emerald-400 font-semibold">javac EmbeddedLabServer.java</p>
                  <p className="text-emerald-400 font-semibold">java EmbeddedLabServer</p>
                  <p className="mt-2 text-slate-400"># Listening on http://localhost:8085/</p>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="surface-card p-6">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Common Troubleshooting
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Port 8080 Conflict:</strong> Change port to
                    8085 in <code className="bg-muted px-1 rounded">conf/server.xml</code> if
                    another process uses 8080.
                  </li>
                  <li>
                    <strong className="text-foreground">403 Forbidden on Manager App:</strong> Add{" "}
                    <code className="bg-muted px-1 rounded">manager-gui</code> role in{" "}
                    <code className="bg-muted px-1 rounded">conf/tomcat-users.xml</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">JAVA_HOME not set:</strong> Point
                    environment variable <code className="bg-muted px-1 rounded">JAVA_HOME</code> to
                    your JDK installation directory.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
