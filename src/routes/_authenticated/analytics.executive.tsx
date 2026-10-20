import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/executive")({
  head: () => ({
    meta: [
      { title: "Executive analytics — Career Connect" },
      {
        name: "description",
        content:
          "Platform-wide placement, hiring and revenue-critical KPIs from the governed warehouse.",
      },
      { property: "og:title", content: "Executive analytics — Career Connect" },
      {
        property: "og:description",
        content:
          "Platform-wide placement, hiring and revenue-critical KPIs from the governed warehouse.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="executive" />,
});
