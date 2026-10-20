import { createFileRoute } from "@tanstack/react-router";
import { handleHealth } from "@/observability/health.server";

/** Liveness probe. Safe operational information only. */
export const Route = createFileRoute("/health")({
  server: { handlers: { GET: async ({ request }) => handleHealth(request) } },
});
