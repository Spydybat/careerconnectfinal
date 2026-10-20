import { createFileRoute } from "@tanstack/react-router";
import { RegisteredUserDirectory } from "@/components/admin/RegisteredUserDirectory";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Career Connect Administrator" },
      {
        name: "description",
        content: "Live Microsoft SQL Server user records management, roles, and administrative oversight.",
      },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <RegisteredUserDirectory showHeader={true} />
    </div>
  );
}
