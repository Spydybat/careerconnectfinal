import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/placement")({
  head: () => ({
    meta: [
      { title: "Placement analytics — Career Connect" },
      {
        name: "description",
        content:
          "Placement rate, offers, drives and season performance by college, department and batch.",
      },
      { property: "og:title", content: "Placement analytics — Career Connect" },
      {
        property: "og:description",
        content:
          "Placement rate, offers, drives and season performance by college, department and batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="placement" />,
});
