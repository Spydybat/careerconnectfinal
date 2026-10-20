import { createFileRoute } from "@tanstack/react-router";
import { Exercise6bThreeTierMvc } from "@/features/wt-lab/exercises/Exercise6bThreeTierMvc";

export const Route = createFileRoute("/wt-lab/exercise-6b")({
  head: () => ({
    meta: [
      { title: "Enterprise Candidate Management — Career Connect" },
      {
        name: "description",
        content:
          "Model-View-Controller candidate management architecture and persistence.",
      },
    ],
  }),
  component: Exercise6bThreeTierMvc,
});
