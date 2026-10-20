import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — CAREER CONNECT" },
      {
        name: "description",
        content: "Reset your Career Connect account password securely.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid registered email address.");
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(cleanEmail);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Unable to process password reset.");
      return;
    }

    setSuccessMessage(
      result.message ||
        `If an account exists for ${cleanEmail}, we have dispatched an encrypted password recovery link.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <ProfessionalHeader />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary font-bold text-xl shadow-xs mb-2">
              <KeyRound className="size-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Enter your registered email address and we'll send you verification instructions.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">
                <p>{error}</p>
              </div>
            </div>
          )}

          {successMessage ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Recovery Instructions Sent</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{successMessage}</p>
              <div className="pt-2">
                <Button asChild className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs">
                  <Link to="/login">Return to Sign In</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 text-sm bg-background border-input rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying account...</span>
                    </>
                  ) : (
                    <span>Send Recovery Instructions</span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/80 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <ProfessionalFooter />
    </div>
  );
}
