import { createFileRoute } from "@tanstack/react-router";
import { handleReadiness } from "@/observability/health.server";

/** Readiness probe — verifies the dependencies a request needs. */
export const Route = createFileRoute("/readiness")({
  server: { handlers: { GET: async ({ request }) => handleReadiness(request) } },
});
