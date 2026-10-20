import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const Route = createFileRoute("/_authenticated/analytics/skills")({
  head: () => ({
    meta: [
      { title: "Skills analytics — Career Connect" },
      {
        name: "description",
        content: "Skill demand, supply and gap analysis across jobs and students.",
      },
      { property: "og:title", content: "Skills analytics — Career Connect" },
      {
        property: "og:description",
        content: "Skill demand, supply and gap analysis across jobs and students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AnalyticsDashboard domain="skills" />,
});
