import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/salary")({
  head: () => ({
    meta: [
      { title: "Salary analytics — Career Connect" },
      {
        name: "description",
        content:
          "Compensation distribution, medians and percentiles by role, industry and location.",
      },
      { property: "og:title", content: "Salary analytics — Career Connect" },
      {
        property: "og:description",
        content:
          "Compensation distribution, medians and percentiles by role, industry and location.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="salary" />,
});
