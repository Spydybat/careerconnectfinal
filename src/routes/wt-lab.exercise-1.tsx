import { createFileRoute } from "@tanstack/react-router";
import { Exercise1ImageMap } from "@/features/wt-lab/exercises/Exercise1ImageMap";

export const Route = createFileRoute("/wt-lab/exercise-1")({
  head: () => ({
    meta: [
      { title: "Career Ecosystem Explorer — Career Connect" },
      {
        name: "description",
        content:
          "Interactive architectural ecosystem map linking Profile, Jobs, Skills, and Analytics.",
      },
    ],
  }),
  component: Exercise1ImageMap,
});
