import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { auditDomainEvent } from "@/lib/audit-client";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["company-applications"] });
  queryClient.invalidateQueries({ queryKey: ["company-pipeline"] });
  queryClient.invalidateQueries({ queryKey: ["company-jobs"] });
}

export function useHiringActions() {
  const queryClient = useQueryClient();

  const setStatus = useMutation({
    mutationFn: async (input: {
      applicationId: string;
      from: string;
      to: string;
      note?: string;
    }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: input.to })
        .eq("id", input.applicationId);
      if (error) throw error;
      const event = await supabase.from("application_events").insert({
        application_id: input.applicationId,
        from_status: input.from,
        to_status: input.to,
        note: input.note ?? null,
      });
      if (event.error) throw event.error;
      await auditDomainEvent({
        action: "application.status_changed",
        entityType: "application",
        entityId: input.applicationId,
        metadata: { from: input.from, to: input.to },
      });
    },
    onSuccess: (_d, v) => {
      invalidate(queryClient);
      toast.success(`Candidate moved to ${v.to}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduleInterview = useMutation({
    mutationFn: async (input: {
      applicationId: string;
      from: string;
      roundName: string;
      mode: string;
      scheduledAt: string | null;
    }) => {
      const { data: interview, error } = await supabase
        .from("interviews")
        .insert({
          application_id: input.applicationId,
          round_name: input.roundName,
          mode: input.mode,
          status: "scheduled",
          scheduled_at: input.scheduledAt,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase
        .from("applications")
        .update({ status: "interview" })
        .eq("id", input.applicationId);
      await supabase.from("application_events").insert({
        application_id: input.applicationId,
        from_status: input.from,
        to_status: "interview",
        note: `${input.roundName} scheduled`,
      });
      await auditDomainEvent({
        action: "interview.scheduled",
        entityType: "interview",
        entityId: interview.id,
        metadata: { round: input.roundName, mode: input.mode, scheduled: !!input.scheduledAt },
      });
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Interview scheduled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateInterview = useMutation({
    mutationFn: async (input: {
      interviewId: string;
      status: string;
      feedback?: string;
      rating?: number | null;
    }) => {
      const { error } = await supabase
        .from("interviews")
        .update({
          status: input.status,
          feedback: input.feedback ?? null,
          rating: input.rating ?? null,
        })
        .eq("id", input.interviewId);
      if (error) throw error;
      await auditDomainEvent({
        action: "interview.updated",
        entityType: "interview",
        entityId: input.interviewId,
        metadata: { status: input.status, rating: input.rating ?? null },
      });
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Interview updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendOffer = useMutation({
    mutationFn: async (input: {
      applicationId: string;
      from: string;
      ctc: number | null;
      roleTitle: string;
      joiningDate: string | null;
    }) => {
      const { data: offer, error } = await supabase
        .from("offers")
        .insert({
          application_id: input.applicationId,
          ctc: input.ctc,
          role_title: input.roleTitle,
          joining_date: input.joiningDate,
          status: "extended",
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase
        .from("applications")
        .update({ status: "offered" })
        .eq("id", input.applicationId);
      await supabase.from("application_events").insert({
        application_id: input.applicationId,
        from_status: input.from,
        to_status: "offered",
        note: `Offer extended for ${input.roleTitle}`,
      });
      await auditDomainEvent({
        action: "offer.created",
        entityType: "offer",
        entityId: offer.id,
        metadata: { role: input.roleTitle, ctc: input.ctc },
      });
      await auditDomainEvent({
        action: "application.status_changed",
        entityType: "application",
        entityId: input.applicationId,
        metadata: { from: input.from, to: "offered" },
      });
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Offer sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hire = useMutation({
    mutationFn: async (input: { applicationId: string; from: string; offerId?: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status: "hired" })
        .eq("id", input.applicationId);
      if (error) throw error;
      if (input.offerId) {
        await supabase.from("offers").update({ status: "accepted" }).eq("id", input.offerId);
        await auditDomainEvent({
          action: "offer.updated",
          entityType: "offer",
          entityId: input.offerId,
          metadata: { status: "accepted" },
        });
      }
      await supabase.from("application_events").insert({
        application_id: input.applicationId,
        from_status: input.from,
        to_status: "hired",
        note: "Candidate hired",
      });
      await auditDomainEvent({
        action: "application.status_changed",
        entityType: "application",
        entityId: input.applicationId,
        metadata: { from: input.from, to: "hired" },
      });
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Candidate hired");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { setStatus, scheduleInterview, updateInterview, sendOffer, hire };
}
