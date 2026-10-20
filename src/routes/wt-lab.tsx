import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers } from "lucide-react";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { ProfessionalFooter } from "@/components/ProfessionalFooter";

export const Route = createFileRoute("/wt-lab")({
  head: () => ({
    meta: [
      { title: "Platform Services — CAREER CONNECT" },
      {
        name: "description",
        content: "Career Connect full-stack platform architecture and interactive services.",
      },
    ],
  }),
  component: WtLabLayout,
});

function WtLabLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ProfessionalHeader />

      {/* Sub-navigation bar when navigating sub-services */}
      {pathname !== "/wt-lab" && (
        <div className="border-b border-border/80 bg-muted/30 py-2.5">
          <div className="mx-auto flex flex-wrap max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Link to="/wt-lab">
                <ArrowLeft className="size-3.5" /> Back to Platform Services Hub
              </Link>
            </Button>
            <span className="text-xs font-mono text-muted-foreground">
              Active Module Service
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full min-w-0">
        <Outlet />
      </main>

      <ProfessionalFooter />
    </div>
  );
}
