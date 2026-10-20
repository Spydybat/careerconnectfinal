import { createFileRoute } from "@tanstack/react-router";
import { handleReadiness } from "@/observability/health.server";

/** Unauthenticated mirror of /readiness for load-balancer probes. */
export const Route = createFileRoute("/api/public/readiness")({
  server: { handlers: { GET: async ({ request }) => handleReadiness(request) } },
});
