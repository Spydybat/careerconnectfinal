import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export interface LoginFormProps {
  isAdmin?: boolean;
  title?: string;
  subtitle?: string;
  redirectUrl?: string | undefined;
  registeredSuccess?: boolean;
}

export function LoginForm({
  isAdmin = false,
  title = "Welcome Back",
  subtitle = isAdmin ? "Administrator Sign In" : "Sign in to continue building your professional future.",
  redirectUrl,
  registeredSuccess = false,
}: LoginFormProps) {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated with required privileges, redirect to appropriate workspace
  if (isAuthenticated && user) {
    if (isAdmin && user.role === "admin") {
      navigate({ to: "/admin/dashboard" });
      return null;
    }
    if (!isAdmin) {
      const destination =
        redirectUrl ||
        (user.role === "admin"
          ? "/admin/dashboard"
          : user.role === "employer"
            ? "/employer/dashboard"
            : "/dashboard");
      navigate({ to: destination });
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(
        isAdmin
          ? "Please enter your administrator email address."
          : "Please enter your registered email address.",
      );
      return;
    }
    if (!password) {
      setError(
        isAdmin
          ? "Please enter your administrator password."
          : "Please enter your account password.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = isAdmin
      ? await login(cleanEmail, password, "admin")
      : await login(cleanEmail, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(
        result.error ||
          (isAdmin
            ? "Authentication failed. Administrator privileges required."
            : "Invalid email or password."),
      );
      return;
    }

    const destination =
      redirectUrl ||
      result.redirect ||
      (isAdmin ? "/admin/dashboard" : "/dashboard");
    navigate({ to: destination });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <ProfessionalHeader />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card / Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white dark:bg-slate-800 p-2 border border-slate-200/90 dark:border-slate-700/90 shadow-sm mb-2 overflow-hidden">
              <img
                src="/career-connect-icon.png"
                alt="Career Connect Logo"
                className="size-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Success Banner if redirected after registration */}
          {registeredSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs font-medium">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Your account has been registered successfully. Please sign in below.</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Login Card Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  {isAdmin ? "Administrator Email" : "Email Address"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={isAdmin ? "admin@careerconnect.internal" : "name@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                  {!isAdmin && (
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
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

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-muted-foreground font-medium cursor-pointer"
                >
                  Remember my session on this device
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </form>

            {/* Separator / Footer Links */}
            <div className="mt-6 pt-6 border-t border-border/80 text-center space-y-4">
              {!isAdmin ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    New to Career Connect?{" "}
                    <Link
                      to="/register"
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Create an account</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </p>

                  <div className="pt-2">
                    <Link
                      to="/admin/login"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-foreground transition-colors"
                    >
                      <Shield className="size-3 text-amber-500" />
                      <span>Administrative Portal Access</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Looking for candidate or employer login?{" "}
                    <Link
                      to="/login"
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Return to Standard Login</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@careerconnect.internal");
                        setPassword("Admin@Career2026!");
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <Shield className="size-3 text-amber-500" />
                      <span>Populate default administrator credentials</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
