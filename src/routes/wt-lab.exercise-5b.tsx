import { createFileRoute } from "@tanstack/react-router";
import { Exercise5bSession } from "@/features/wt-lab/exercises/Exercise5bSession";

export const Route = createFileRoute("/wt-lab/exercise-5b")({
  head: () => ({
    meta: [
      { title: "Session & State Manager — Career Connect" },
      {
        name: "description",
        content:
          "High-security user session lifecycle, tracking, and state management.",
      },
    ],
  }),
  component: Exercise5bSession,
});
