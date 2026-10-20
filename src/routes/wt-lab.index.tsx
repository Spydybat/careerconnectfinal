import { createFileRoute } from "@tanstack/react-router";
import { LabDashboard } from "@/features/wt-lab/components/LabDashboard";

export const Route = createFileRoute("/wt-lab/")({
  head: () => ({
    meta: [
      { title: "Platform Services — Career Connect" },
      {
        name: "description",
        content: "Enterprise services suite and integrated platform modules.",
      },
    ],
  }),
  component: LabDashboard,
});
