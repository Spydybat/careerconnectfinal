import { createFileRoute } from "@tanstack/react-router";
import { Exercise2CssTypes } from "@/features/wt-lab/exercises/Exercise2CssTypes";

export const Route = createFileRoute("/wt-lab/exercise-2")({
  head: () => ({
    meta: [
      { title: "Theme & Design System — Career Connect" },
      {
        name: "description",
        content: "Multi-tier design token and style cascade preview on Career Connect.",
      },
    ],
  }),
  component: Exercise2CssTypes,
});
