import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OperationsSnapshot } from "@/observability/operations";

/**
 * Sprint 14 — admin-only operational snapshot.
 *
 * Aggregates the existing signals (request metrics, pipeline control plane,
 * quality framework, ai_usage_logs, audit_logs) into one operational view.
 * No new monitoring system, no business analytics, no sensitive content.
 */
export const getOperationsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OperationsSnapshot> => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);

    const { buildOperationsSnapshot } = await import("@/observability/snapshot.server");
    return buildOperationsSnapshot();
  });
