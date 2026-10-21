import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getApiBaseUrl, isLocalEnvironment } from "@/lib/api-config";
import {
  UserRound,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Target,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  Loader2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — CAREER CONNECT" },
      {
        name: "description",
        content:
          "Create and manage your professional career profile, verified qualifications, skills, and career goals.",
      },
    ],
  }),
  component: ProfileCreationPage,
});

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  careerGoal: string;
  experience: string;
  careerGoalsSummary: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  education?: string;
  skills?: string;
  careerGoal?: string;
  experience?: string;
  careerGoalsSummary?: string;
}

function ProfileCreationPage() {
  const { user: authUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    email: "",
    phone: "",
    education: "",
    skills: "",
    careerGoal: "",
    experience: "",
    careerGoalsSummary: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || authUser.fullName || "",
        email: prev.email || authUser.email || "",
      }));
    }
  }, [authUser]);

  const [errors, setErrors] = useState<FormErrors>({});
  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedProfile, setSavedProfile] = useState<ProfileFormData | null>(null);
  const [profileDbId, setProfileDbId] = useState<number | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Resiliently requests CareerServlet across multiple network fallback endpoints:
   * 1. Same-Origin Relative Proxy (`/CareerServlet`) — routed via Vite dev server proxy to Tomcat on port 8085 (eliminates CORS / Private Network Access / port mismatch)
   * 2. Direct localhost:8085 (`http://localhost:8085/CareerServlet`) — direct Tomcat container binding
   * 3. Direct IPv4 loopback (`http://127.0.0.1:8085/CareerServlet`) — explicit IPv4 loopback address
   */
  const fetchCareerServlet = async (pathAndQuery: string, init?: RequestInit): Promise<Response> => {
    const cleanPath = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
    const customBase = getApiBaseUrl();
    const isLocal = isLocalEnvironment();

    const candidates: string[] = [];
    if (customBase) {
      candidates.push(`${customBase}${cleanPath}`);
    }
    if (isLocal) {
      candidates.push(cleanPath);
      candidates.push(`http://localhost:8085${cleanPath}`);
      candidates.push(`http://127.0.0.1:8085${cleanPath}`);
    } else if (!customBase) {
      candidates.push(cleanPath);
    }

    let lastError: Error | null = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, init);
        if (res.status === 404 && !isLocal && !customBase) {
          throw new Error(
            "Career Connect backend is not connected. In production, configure VITE_BACKEND_URL in Vercel to point to your deployed Tomcat backend."
          );
        }
        if (res.status === 200 || res.status === 400 || res.status === 404 || res.status === 500) {
          return res;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!isLocal && !customBase) {
      throw new Error(
        "Backend service URL is not configured. Set VITE_BACKEND_URL in Vercel to point to your deployed Java Tomcat backend."
      );
    }

    throw lastError || new Error("Failed to connect to backend CareerServlet.");
  };

  // Retrieve persistent profile from SQL Server on initial page load / refresh
  useEffect(() => {
    const storedId = localStorage.getItem("career_connect_profile_id");
    let queryParam = "";
    if (storedId && !isNaN(parseInt(storedId, 10))) {
      queryParam = `?id=${storedId}`;
    } else if (authUser?.email) {
      queryParam = `?email=${encodeURIComponent(authUser.email)}`;
    }

    if (queryParam) {
      setIsLoadingProfile(true);
      fetchCareerServlet(`/CareerServlet${queryParam}`, {
        headers: { Accept: "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Profile not found in database");
          return res.json();
        })
        .then((data) => {
          if (data.success && data.profile) {
            setProfileDbId(data.profile.id);
            localStorage.setItem("career_connect_profile_id", String(data.profile.id));
            setSavedProfile({
              fullName: data.profile.name,
              email: data.profile.email,
              phone: data.profile.phone,
              education: data.profile.education,
              skills: data.profile.skills,
              careerGoal: data.profile.careerGoal,
              experience: data.profile.experience,
              careerGoalsSummary: data.profile.goals || "",
            });
            setIsSubmitted(true);
          }
        })
        .catch(() => {
          // If the record cannot be located, clear the stale ID if it was an ID lookup
          if (storedId) localStorage.removeItem("career_connect_profile_id");
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [authUser?.email]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name: letters and spaces only, min 2 chars
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    } else if (!/^[A-Za-z\s.]{2,50}$/.test(formData.fullName.trim())) {
      newErrors.fullName = "Full Name must contain only alphabetic characters (min 2).";
    }

    // Email: valid email format with @ and domain
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid professional email address.";
    }

    // Phone: exactly 10 digits
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 numeric digits.";
    }

    // Education
    if (!formData.education.trim()) {
      newErrors.education = "Please select your educational qualification.";
    }

    // Skills
    if (!formData.skills.trim()) {
      newErrors.skills = "Please list at least one core skill or competency.";
    }

    // Career Goal
    if (!formData.careerGoal.trim()) {
      newErrors.careerGoal = "Please specify your target career designation.";
    }

    // Experience
    if (!formData.experience.trim()) {
      newErrors.experience = "Please select your experience level.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const params = new URLSearchParams({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        education: formData.education.trim(),
        skills: formData.skills.trim(),
        careerGoal: formData.careerGoal.trim(),
        experience: formData.experience.trim(),
        careerGoalsSummary: (formData.careerGoalsSummary || "").trim(),
        format: "json",
      });

      const response = await fetchCareerServlet("/CareerServlet", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(
          errJson?.error || `Server responded with status ${response.status}: Failed to persist profile.`
        );
      }

      const result = await response.json();
      if (!result.success || !result.id) {
        throw new Error(result.error || "Database did not confirm record insertion.");
      }

      // Confirmed persistent insertion in database!
      const generatedId = result.id;
      localStorage.setItem("career_connect_profile_id", String(generatedId));
      setProfileDbId(generatedId);

      const confirmedProfile: ProfileFormData = {
        fullName: result.profile.name || formData.fullName,
        email: result.profile.email || formData.email,
        phone: result.profile.phone || formData.phone,
        education: result.profile.education || formData.education,
        skills: result.profile.skills || formData.skills,
        careerGoal: result.profile.careerGoal || formData.careerGoal,
        experience: result.profile.experience || formData.experience,
        careerGoalsSummary: result.profile.goals || formData.careerGoalsSummary,
      };

      setSavedProfile(confirmedProfile);
      setIsSubmitted(true);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setIsSubmitting(false);
      let errMsg = err instanceof Error ? err.message : "Failed to persist profile to database.";
      if (errMsg === "Failed to fetch" || errMsg.includes("NetworkError")) {
        errMsg = "Could not establish connection to the CareerServlet backend. Please ensure the backend server is running.";
      }
      setSubmitError(errMsg);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("career_connect_profile_id");
    setIsSubmitted(false);
    setSavedProfile(null);
    setProfileDbId(null);
    setSubmitError(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      education: "",
      skills: "",
      careerGoal: "",
      experience: "",
      careerGoalsSummary: "",
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Profile Management
            </span>
            <h1 className="text-3xl font-extrabold font-display text-foreground mt-1">
              {isSubmitted ? "Profile Confirmation" : "Create Your Professional Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isSubmitted
                ? "Your career credentials have been recorded in the database and are ready for enterprise matching."
                : "Publish your credentials, skills, and target objectives to connect with hiring partners."}
            </p>
          </div>

          {/* Database Profile Retrieval Loading State */}
          {isLoadingProfile && (
            <div className="surface-card rounded-2xl p-8 border border-border text-center space-y-3 mb-8">
              <Loader2 className="size-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                Retrieving persistent candidate profile from database...
              </p>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Profile Persistence Error</h4>
                  <p className="text-xs mt-1 text-destructive/90">{submitError}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Retry Submission
              </Button>
            </div>
          )}

          {/* SUCCESS CONFIRMATION STATE */}
          {isSubmitted && savedProfile && !isLoadingProfile && (
            <div className="space-y-6">
              {/* Official Confirmation Banner */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-800 dark:text-emerald-300 shadow-sm flex items-start gap-4">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold">
                    Your professional profile has been created successfully.
                  </h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/90">
                    Your profile credentials have passed validation checks and are persistently stored in the Microsoft SQL Server database.
                  </p>
                  {profileDbId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 text-xs font-semibold mt-1">
                      <Database className="size-3.5" />
                      <span>SQL Server Record ID: #{profileDbId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Profile Executive Card */}
              <div className="surface-card rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                  <div className="flex items-center gap-4">
                    <div className="grid size-14 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-foreground shadow-sm">
                      {savedProfile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                        {savedProfile.fullName}
                        <ShieldCheck className="size-4 text-primary" />
                      </h3>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {savedProfile.careerGoal}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {savedProfile.education} • {savedProfile.experience}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Active Candidate
                    </span>
                  </div>
                </div>

                {/* Profile Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-border/80 p-4 bg-muted/20">
                    <span className="text-muted-foreground font-medium">Contact Coordinates</span>
                    <div className="mt-2 space-y-1 font-mono text-[11px] text-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span>{savedProfile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span>+91 {savedProfile.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 p-4 bg-muted/20">
                    <span className="text-muted-foreground font-medium">Academic & Experience</span>
                    <div className="mt-2 space-y-1 text-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="size-3.5 text-muted-foreground" />
                        <span>{savedProfile.education}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-3.5 text-muted-foreground" />
                        <span>Experience Tier: {savedProfile.experience}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Verified Competencies & Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {savedProfile.skills.split(",").map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Professional Summary */}
                {savedProfile.careerGoalsSummary && (
                  <div className="rounded-xl border border-border bg-muted/10 p-4 text-xs">
                    <h4 className="font-semibold text-foreground mb-1">
                      Career Goals & Professional Summary
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {savedProfile.careerGoalsSummary}
                    </p>
                  </div>
                )}

                {/* Useful Navigation Links */}
                <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-full text-xs">
                      <Link to="/career-profiles">
                        Browse Career Profiles <ArrowRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                      <Link to="/opportunities">Find Opportunities</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                      <Link to="/skills">Discover Skills</Link>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="size-3 mr-1" /> Create Another Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE CREATION FORM */}
          {!isSubmitted && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Contact Coordinates */}
              <div className="surface-card rounded-2xl p-6 sm:p-8 border border-border space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <UserRound className="size-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    1. Candidate Identity & Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="fullName">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        clearError("fullName");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.fullName ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Enter your legal full name as presented on official qualifications.
                    </p>
                    {errors.fullName && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="email">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        clearError("email");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.email ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Primary email for notifications and opportunity matches.
                    </p>
                    {errors.email && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="phone">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="Enter your 10-digit phone number"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        clearError("phone");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.phone ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Must be exactly 10 numeric digits.
                    </p>
                    {errors.phone && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Education & Career Goals */}
              <div className="surface-card rounded-2xl p-6 sm:p-8 border border-border space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <GraduationCap className="size-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    2. Academic Qualification & Target Role
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Education */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="education">
                      Education *
                    </label>
                    <select
                      id="education"
                      value={formData.education}
                      onChange={(e) => {
                        setFormData({ ...formData, education: e.target.value });
                        clearError("education");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.education ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    >
                      <option value="">Select your qualification</option>
                      <option value="B.E / B.Tech">B.E / B.Tech</option>
                      <option value="M.E / M.Tech">M.E / M.Tech</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="MCA">MCA</option>
                      <option value="MBA">MBA</option>
                    </select>
                    {errors.education && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.education}
                      </p>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="experience">
                      Experience Tier *
                    </label>
                    <select
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => {
                        setFormData({ ...formData, experience: e.target.value });
                        clearError("experience");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.experience ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    >
                      <option value="">Select your experience level</option>
                      <option value="Fresher">Fresher (New Graduate)</option>
                      <option value="0 - 2 Years">0 - 2 Years (Early Career)</option>
                      <option value="2 - 5 Years">2 - 5 Years (Mid-Level)</option>
                      <option value="5+ Years">5+ Years (Senior)</option>
                    </select>
                    {errors.experience && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.experience}
                      </p>
                    )}
                  </div>

                  {/* Career Goal */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="careerGoal">
                      Career Goal / Target Role *
                    </label>
                    <input
                      id="careerGoal"
                      type="text"
                      placeholder="e.g., Software Developer"
                      value={formData.careerGoal}
                      onChange={(e) => {
                        setFormData({ ...formData, careerGoal: e.target.value });
                        clearError("careerGoal");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.careerGoal ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Specify your target profession or immediate career destination.
                    </p>
                    {errors.careerGoal && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.careerGoal}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Skills & Summary */}
              <div className="surface-card rounded-2xl p-6 sm:p-8 border border-border space-y-5">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-foreground">
                    3. Core Skills & Professional Summary
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Skills */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="skills">
                      Core Skills & Technologies *
                    </label>
                    <input
                      id="skills"
                      type="text"
                      placeholder="e.g., Java, Python, SQL, React"
                      value={formData.skills}
                      onChange={(e) => {
                        setFormData({ ...formData, skills: e.target.value });
                        clearError("skills");
                      }}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.skills ? "border-destructive ring-1 ring-destructive/30" : "border-border"
                      }`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Comma-separated list of programming languages, frameworks, and technical competencies.
                    </p>
                    {errors.skills && (
                      <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.skills}
                      </p>
                    )}
                  </div>

                  {/* Career Goals Description / Summary */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="careerGoalsSummary">
                      Career Goals & Professional Summary
                    </label>
                    <textarea
                      id="careerGoalsSummary"
                      rows={4}
                      placeholder="Describe your skills, strengths, and career aspirations..."
                      value={formData.careerGoalsSummary}
                      onChange={(e) =>
                        setFormData({ ...formData, careerGoalsSummary: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      A brief summary highlighting your strengths, passions, and long-term career aspirations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  By saving, your profile adheres to platform data validation standards.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="rounded-full px-8 text-xs font-semibold shadow-md flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Persisting to Database...</span>
                    </>
                  ) : (
                    "Save Professional Profile"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
