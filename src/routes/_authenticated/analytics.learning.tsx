import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/learning")({
  head: () => ({
    meta: [
      { title: "Learning analytics — Career Connect" },
      {
        name: "description",
        content: "Course completion, certifications and learning-to-placement impact.",
      },
      { property: "og:title", content: "Learning analytics — Career Connect" },
      {
        property: "og:description",
        content: "Course completion, certifications and learning-to-placement impact.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="learning" />,
});
