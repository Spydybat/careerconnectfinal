import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Check,
  Search,
  Building2,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Professional Network — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Connect with industry peers, alumni, hiring mentors, and engineering leaders on Career Connect.",
      },
    ],
  }),
  component: NetworkPage,
});

interface Connection {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  mutualCount: number;
  skills: string[];
  status: "idle" | "connected" | "pending";
}

const INVITATIONS_INIT = [
  {
    id: "inv-1",
    name: "Vikram R.",
    role: "Senior Engineering Manager",
    company: "CloudScale Technologies",
    mutual: 8,
    time: "2 days ago",
  },
  {
    id: "inv-2",
    name: "Ananya Sharma",
    role: "Lead AI Researcher",
    company: "Cognitive Intelligence Labs",
    mutual: 5,
    time: "4 days ago",
  },
];

const CONNECTIONS_DATA: Connection[] = [
  {
    id: "conn-1",
    name: "Siddharth Nair",
    role: "Staff Software Engineer",
    company: "Enterprise Cloud Systems",
    location: "Bengaluru, India",
    mutualCount: 14,
    skills: ["Java", "Spring Boot", "Microservices"],
    status: "idle",
  },
  {
    id: "conn-2",
    name: "Meera Krishnan",
    role: "Principal Data Architect",
    company: "Synthesize Global Solutions",
    location: "Chennai, India",
    mutualCount: 9,
    skills: ["SQL", "Data Modeling", "Power BI"],
    status: "idle",
  },
  {
    id: "conn-3",
    name: "Rohit Verma",
    role: "AI & ML Systems Engineer",
    company: "NextGen AI Labs",
    location: "Hyderabad, India",
    mutualCount: 12,
    skills: ["Python", "PyTorch", "MLOps"],
    status: "idle",
  },
  {
    id: "conn-4",
    name: "Sneha Patel",
    role: "Cloud DevOps Specialist",
    company: "Aura Cloud Networks",
    location: "Pune, India",
    mutualCount: 6,
    skills: ["Kubernetes", "AWS", "Docker"],
    status: "idle",
  },
  {
    id: "conn-5",
    name: "Harish Sundaram",
    role: "Frontend Design Lead",
    company: "Nexus Interactive",
    location: "Gurugram, India",
    mutualCount: 11,
    skills: ["React", "TypeScript", "Tailwind CSS"],
    status: "idle",
  },
  {
    id: "conn-6",
    name: "Pooja Hegde",
    role: "Placement & Talent Coordinator",
    company: "Apex Tech Talent",
    location: "Mumbai, India",
    mutualCount: 19,
    skills: ["Hiring", "Career Coaching", "Campus Relations"],
    status: "idle",
  },
];

const MENTORS_DATA = [
  {
    id: "men-1",
    name: "Dr. Arvind Ramesh",
    title: "VP of Engineering & Alumnus Mentor",
    focus: "System Design, Java Microservices, Engineering Leadership",
    sessions: 42,
  },
  {
    id: "men-2",
    name: "Kavita Rao",
    title: "Senior Director of Data Science",
    focus: "Machine Learning, Analytics Strategy, AI Model Scaling",
    sessions: 38,
  },
  {
    id: "men-3",
    name: "Manish Gupta",
    title: "Principal Cloud Solutions Architect",
    focus: "AWS Architecture, Kubernetes, Cloud Security & FinOps",
    sessions: 29,
  },
];

function NetworkPage() {
  const [invitations, setInvitations] = useState(INVITATIONS_INIT);
  const [connections, setConnections] = useState<Connection[]>(CONNECTIONS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestedMentors, setRequestedMentors] = useState<string[]>([]);

  const handleAccept = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  const handleIgnore = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  const handleConnect = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "pending" } : c))
    );
  };

  const handleRequestMentorship = (id: string) => {
    if (!requestedMentors.includes(id)) {
      setRequestedMentors((prev) => [...prev, id]);
    }
  };

  const filteredConnections = connections.filter(
    (c) =>
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Network & Community
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground mt-1">
                Professional Network
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl">
                Connect with industry professionals, alumni mentors, recruiters, and fellow engineers across verified enterprise domains.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="rounded-full text-xs">
                <Link to="/career-profiles">
                  Explore Candidate Directory <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Pending Invitations Section */}
          {invitations.length > 0 && (
            <div className="surface-card rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <UserPlus className="size-4 text-primary" />
                  Pending Connection Invitations ({invitations.length})
                </h3>
                <span className="text-xs text-muted-foreground">Manage Requests</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/80 p-4 bg-muted/15 gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl bg-primary/10 font-bold text-sm text-primary">
                        {inv.name[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{inv.name}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {inv.role} • {inv.company}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          {inv.mutual} mutual connections • {inv.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(inv.id)}
                        className="rounded-full text-xs px-3.5 h-8 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs flex-1 sm:flex-initial"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIgnore(inv.id)}
                        className="rounded-full text-xs px-3.5 h-8 font-medium text-slate-600 hover:text-foreground dark:text-slate-400 border-border flex-1 sm:flex-initial"
                      >
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Industry Connections */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-foreground">
                  Recommended Industry Connections
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Professionals in your field and shared enterprise networks.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, role, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-background pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="surface-card rounded-2xl p-6 border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="grid size-12 place-items-center rounded-xl bg-primary/10 font-bold text-sm text-primary shrink-0">
                        {conn.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {conn.name}
                        </h4>
                        <p className="text-xs text-primary font-medium truncate mt-0.5">
                          {conn.role}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conn.company}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{conn.location}</span>
                      <span>{conn.mutualCount} mutual connections</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {conn.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant={conn.status === "idle" ? "outline" : "secondary"}
                      disabled={conn.status !== "idle"}
                      onClick={() => handleConnect(conn.id)}
                      className="w-full rounded-full text-xs font-semibold gap-1.5 h-9"
                    >
                      {conn.status === "idle" && (
                        <>
                          <UserPlus className="size-3.5" /> Connect
                        </>
                      )}
                      {conn.status === "pending" && (
                        <>
                          <Check className="size-3.5" /> Invitation Sent
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mentorship Network Section */}
          <div className="surface-card rounded-3xl p-6 sm:p-10 border border-border space-y-6 bg-gradient-to-r from-card via-card to-primary/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                  <GraduationCap className="size-3.5" />
                  <span>Alumni & Industry Mentorship</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground">
                  Connect with Experienced Career Mentors
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                  Get personalized 1-on-1 interview feedback, architecture reviews, and career guidance from proven engineering leaders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MENTORS_DATA.map((mentor) => {
                const isRequested = requestedMentors.includes(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{mentor.name}</h4>
                      <p className="text-xs font-semibold text-primary mt-0.5">{mentor.title}</p>
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        <strong>Focus Areas:</strong> {mentor.focus}
                      </p>
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {mentor.sessions}+ mentorship sessions completed
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant={isRequested ? "secondary" : "outline"}
                        disabled={isRequested}
                        onClick={() => handleRequestMentorship(mentor.id)}
                        className="w-full rounded-full text-xs font-semibold gap-1.5 h-9"
                      >
                        {isRequested ? (
                          <>
                            <Check className="size-3.5" /> Mentorship Requested
                          </>
                        ) : (
                          <>
                            <MessageSquare className="size-3.5" /> Request Mentorship Session
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
