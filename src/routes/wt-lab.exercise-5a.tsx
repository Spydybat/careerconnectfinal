import { createFileRoute } from "@tanstack/react-router";
import { Exercise5aServlet } from "@/features/wt-lab/exercises/Exercise5aServlet";

export const Route = createFileRoute("/wt-lab/exercise-5a")({
  head: () => ({
    meta: [
      { title: "Profile Submission Gateway — Career Connect" },
      {
        name: "description",
        content: "Secure profile submission service with server parameter processing.",
      },
    ],
  }),
  component: Exercise5aServlet,
});
