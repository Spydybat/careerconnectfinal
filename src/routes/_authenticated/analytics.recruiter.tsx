import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/recruiter")({
  head: () => ({
    meta: [
      { title: "Recruiter analytics — Career Connect" },
      {
        name: "description",
        content: "Company hiring funnel, interview throughput and offer conversion.",
      },
      { property: "og:title", content: "Recruiter analytics — Career Connect" },
      {
        property: "og:description",
        content: "Company hiring funnel, interview throughput and offer conversion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="recruiter" />,
});
