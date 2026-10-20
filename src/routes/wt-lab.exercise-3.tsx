import { createFileRoute } from "@tanstack/react-router";
import { Exercise3FormValidation } from "@/features/wt-lab/exercises/Exercise3FormValidation";

export const Route = createFileRoute("/wt-lab/exercise-3")({
  head: () => ({
    meta: [
      { title: "Candidate Profile Registration — Career Connect" },
      {
        name: "description",
        content: "Career Profile registration portal with real-time field validation.",
      },
    ],
  }),
  component: Exercise3FormValidation,
});
