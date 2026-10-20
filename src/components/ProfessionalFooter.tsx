import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function ProfessionalFooter() {
  return (
    <footer className="border-t border-slate-200/90 bg-white dark:bg-slate-900 text-muted-foreground mt-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="inline-flex items-center gap-3 group focus-visible:outline-none">
              <div className="size-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200/90 dark:border-slate-700/90 shadow-xs group-hover:scale-105 transition-all shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/career-connect-icon.png" alt="Career Connect Logo" className="size-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                  Career Connect
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                  Professional Network
                </span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              Build Your Professional Future. Discover opportunities, showcase your skills, grow your professional network and make informed career decisions through verified intelligence.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-2">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Verified Enterprise Career Network</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-primary transition-colors">
                  Find Opportunities
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-primary transition-colors">
                  Career Insights
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-primary transition-colors">
                  Companies Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Skills & Career Tools */}
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">
              Skills & Development
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/skills" className="hover:text-primary transition-colors">
                  Discover Skills
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary transition-colors">
                  Career Paths
                </Link>
              </li>
              <li>
                <Link to="/resume" className="hover:text-primary transition-colors">
                  Resume AI Reviewer
                </Link>
              </li>
              <li>
                <Link to="/network" className="hover:text-primary transition-colors">
                  Professional Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Access */}
          <div>
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">
              Portals & Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Candidate Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/employer/dashboard" className="hover:text-primary transition-colors">
                  Employer Talent Hub
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-primary transition-colors">
                  Administrator Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/80 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} Career Connect. All rights reserved. Professional Network.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
