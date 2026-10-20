import { createFileRoute } from "@tanstack/react-router";
import { Exercise7XmlXsdXsl } from "@/features/wt-lab/exercises/Exercise7XmlXsdXsl";

export const Route = createFileRoute("/wt-lab/exercise-7")({
  head: () => ({
    meta: [
      { title: "Standardized Profile Exchange — Career Connect" },
      {
        name: "description",
        content:
          "Automated candidate data schema validation and structured profile transformation.",
      },
    ],
  }),
  component: Exercise7XmlXsdXsl,
});
