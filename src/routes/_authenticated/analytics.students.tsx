import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/students")({
  head: () => ({
    meta: [
      { title: "Student analytics — Career Connect" },
      {
        name: "description",
        content: "Student readiness, eligibility, application activity and outcomes.",
      },
      { property: "og:title", content: "Student analytics — Career Connect" },
      {
        property: "og:description",
        content: "Student readiness, eligibility, application activity and outcomes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="students" />,
});
