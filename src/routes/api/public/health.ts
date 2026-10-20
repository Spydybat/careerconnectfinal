import { createFileRoute } from "@tanstack/react-router";
import { handleHealth } from "@/observability/health.server";

/** Unauthenticated mirror of /health for external uptime checks. */
export const Route = createFileRoute("/api/public/health")({
  server: { handlers: { GET: async ({ request }) => handleHealth(request) } },
});
