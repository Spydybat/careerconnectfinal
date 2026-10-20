import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrator Sign In — CAREER CONNECT" },
      {
        name: "description",
        content: "Authorized administrative login portal for Career Connect platform infrastructure.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <LoginForm
      isAdmin={true}
      title="Welcome Back"
      subtitle="Administrator Sign In"
      redirectUrl="/admin/dashboard"
    />
  );
}
