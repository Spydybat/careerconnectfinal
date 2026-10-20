import { createFileRoute } from "@tanstack/react-router";
import { Exercise6aThreeTier } from "@/features/wt-lab/exercises/Exercise6aThreeTier";

export const Route = createFileRoute("/wt-lab/exercise-6a")({
  head: () => ({
    meta: [
      { title: "Candidate Database Directory — Career Connect" },
      {
        name: "description",
        content:
          "Database directory and query operations for candidate career profiles.",
      },
    ],
  }),
  component: Exercise6aThreeTier,
});
