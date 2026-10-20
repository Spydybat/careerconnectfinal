import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Your Account — CAREER CONNECT" },
      {
        name: "description",
        content: "Register as a candidate or recruiter on Career Connect to access matching intelligence and career opportunities.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && user) {
    navigate({ to: user.role === "employer" ? "/employer/dashboard" : "/dashboard" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full professional name (minimum 2 characters).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid professional email address.");
      return;
    }

    if (role === "employer" && !organization.trim()) {
      setError("Please enter your company or organization name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const result = await register(cleanName, cleanEmail, password, role, organization);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to create account. Please try again.");
      return;
    }

    const destination = result.redirect || (role === "employer" ? "/employer/dashboard" : "/dashboard");
    navigate({ to: destination });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <ProfessionalHeader />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Header Card / Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white dark:bg-slate-800 p-2 border border-slate-200/90 dark:border-slate-700/90 shadow-sm mb-2 overflow-hidden">
              <img src="/career-connect-icon.png" alt="Career Connect Logo" className="size-full object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              Create Your Professional Account
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Join Career Connect to connect with hiring partners, access skill benchmarks, and accelerate your career.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Registration Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Type Selection */}
              <div className="space-y-2 pb-2">
                <Label className="text-xs font-semibold text-foreground">Select Account Type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole("candidate")}
                    className={`cursor-pointer border rounded-xl p-3.5 flex items-start gap-3 transition-all ${
                      role === "candidate"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Briefcase className={`size-5 mt-0.5 shrink-0 ${role === "candidate" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">Candidate</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Job seeker or professional</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setRole("employer")}
                    className={`cursor-pointer border rounded-xl p-3.5 flex items-start gap-3 transition-all ${
                      role === "employer"
                        ? "border-purple-600 bg-purple-500/5 ring-1 ring-purple-600"
                        : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Building2 className={`size-5 mt-0.5 shrink-0 ${role === "employer" ? "text-purple-600" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">Employer</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Recruiter or hiring manager</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Work / Primary Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="alex.morgan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                  />
                </div>
              </div>

              {/* Company / Organization (Shown only if Employer) */}
              {role === "employer" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label htmlFor="organization" className="text-xs font-semibold text-foreground">
                    Organization / Company Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="organization"
                      type="text"
                      required
                      placeholder="e.g. TechCorp Solutions Ltd"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password (min. 8 characters)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 text-sm bg-background border-input rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs gap-2 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Create Account</span>
                  </>
                )}
              </Button>
            </form>

            {/* Switch to Login */}
            <div className="mt-6 pt-6 border-t border-border/80 text-center">
              <p className="text-xs text-muted-foreground">
                Already registered with Career Connect?{" "}
                <Link
                  to="/login"
                  className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Sign in here</span>
                  <ArrowRight className="size-3" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
