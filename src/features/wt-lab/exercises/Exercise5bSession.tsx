import { useState } from "react";
import { getApiUrl } from "@/lib/api-config";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { KeyRound, ShieldAlert, Clock, LogOut, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionData {
  sessionId: string;
  name: string;
  email: string;
  careerGoal: string;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
}

export function Exercise5bSession() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-5b")!;

  // Form input state
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex.morgan@example.com");
  const [careerGoal, setCareerGoal] = useState("Software Developer");

  // Active Session state
  const [currentSession, setCurrentSession] = useState<SessionData | null>(() => ({
    sessionId: "CC_SESS_7F9B1E4A",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    careerGoal: "Software Developer",
    createdAt: new Date().toLocaleTimeString(),
    lastAccessed: new Date().toLocaleTimeString(),
    accessCount: 1,
  }));

  const handleStartSession = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const now = new Date();
    const existingId = currentSession?.sessionId;
    const sessionId =
      existingId || `CC_SESS_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    setCurrentSession({
      sessionId,
      name,
      email,
      careerGoal,
      createdAt: currentSession ? currentSession.createdAt : now.toLocaleTimeString(),
      lastAccessed: now.toLocaleTimeString(),
      accessCount: currentSession ? currentSession.accessCount + 1 : 1,
    });
  };

  const handleInvalidate = () => {
    setCurrentSession(null);
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
        externalLink={getApiUrl("/index-5b.html")}
      />

      <div className="grid gap-6 lg:grid-cols-12 min-w-0">
          {/* Session Form */}
          <div className="surface-card p-4 sm:p-6 lg:col-span-5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div className="min-w-0">
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Session Registration Form
                </h3>
                <p className="text-xs text-muted-foreground break-words">
                  Action:{" "}
                  <code className="text-primary font-mono font-semibold">
                    SessionTrackingServlet
                  </code>
                </p>
              </div>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary shrink-0">
                HttpSession
              </span>
            </div>

            <form onSubmit={handleStartSession} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Career Goal
                </label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Example: Software Developer"
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2 bg-[#238636] hover:bg-[#176b2c] text-white whitespace-normal h-auto py-2.5 text-center text-xs sm:text-sm"
              >
                <Send className="size-4 shrink-0" />
                <span>Start / Update Career Session</span>
              </Button>
            </form>
          </div>

          {/* Active Session & HttpSession Inspector */}
          <div className="space-y-6 lg:col-span-7">
            {currentSession ? (
              <div className="surface-card p-6 border-l-4 border-l-[#238636]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <KeyRound className="size-4" />
                    </span>
                    <div>
                      <h4 className="font-display text-base font-bold text-foreground">
                        Active HttpSession Container
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Maintained via Java Servlet Session Engine
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInvalidate}
                    className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  >
                    <LogOut className="size-3.5" /> Invalidate Session
                  </Button>
                </div>

                {/* Session Details Card matching lab output */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-[#238636]">CAREER CONNECT</h2>
                    <h3 className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Career Session Started Successfully
                    </h3>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <p>
                      <b>Name:</b> {currentSession.name}
                    </p>
                    <p>
                      <b>Email:</b> {currentSession.email}
                    </p>
                    <p>
                      <b>Career Goal:</b> {currentSession.careerGoal}
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg border border-emerald-500/30 bg-[#eaf7ed] p-4 text-xs dark:bg-emerald-950/30">
                    <div className="font-mono text-slate-800 dark:text-emerald-200 space-y-1">
                      <p>
                        <b>Session ID:</b>{" "}
                        <span className="text-primary font-bold">{currentSession.sessionId}</span>
                      </p>
                      <p>
                        <b>Created At:</b> {currentSession.createdAt}
                      </p>
                      <p>
                        <b>Last Accessed:</b> {currentSession.lastAccessed}
                      </p>
                      <p>
                        <b>Request Count:</b> {currentSession.accessCount}
                      </p>
                      <p>
                        <b>Max Inactive Interval:</b> 1800 seconds (30 mins)
                      </p>
                    </div>
                    <p className="mt-3 font-medium text-[#176b2c] dark:text-emerald-400">
                      Your career session is successfully maintained using HttpSession.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-8 text-center">
                <ShieldAlert className="size-10 text-amber-500 mx-auto" />
                <h4 className="mt-3 text-base font-bold text-foreground">No Active Session</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  The session was invalidated or has not been started yet. Fill the form to create a
                  new HttpSession.
                </p>
                <Button
                  onClick={() => handleStartSession()}
                  className="mt-4 gap-2 bg-[#238636] text-white"
                >
                  Start New Session
                </Button>
              </div>
            )}

            {/* Session Security & Architecture Info */}
            <div className="surface-card p-6 border-l-4 border-l-primary">
              <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                Enterprise Session Lifecycle
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Candidate sessions are managed via secure, encrypted tokens with automatic timeout
                invalidation and role-based privilege isolation.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
