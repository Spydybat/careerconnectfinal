import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/jobs/")({
  beforeLoad: () => {
    throw redirect({ to: "/opportunities" });
  },
  component: () => null,
});
