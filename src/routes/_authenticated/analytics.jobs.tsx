import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs analytics — Career Connect" },
      {
        name: "description",
        content: "Job posting volume, openings, fill rates and application intensity.",
      },
      { property: "og:title", content: "Jobs analytics — Career Connect" },
      {
        property: "og:description",
        content: "Job posting volume, openings, fill rates and application intensity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="jobs" />,
});
