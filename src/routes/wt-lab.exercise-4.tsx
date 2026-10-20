import { createFileRoute } from "@tanstack/react-router";
import { Exercise4Tomcat } from "@/features/wt-lab/exercises/Exercise4Tomcat";

export const Route = createFileRoute("/wt-lab/exercise-4")({
  head: () => ({
    meta: [
      { title: "Server & Cloud Infrastructure — Career Connect" },
      {
        name: "description",
        content:
          "Enterprise web server deployment and runtime configuration procedures.",
      },
    ],
  }),
  component: Exercise4Tomcat,
});
