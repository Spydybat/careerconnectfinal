import { createFileRoute, useSearch } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

interface LoginSearch {
  redirect?: string | undefined;
  registered?: string | undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
    registered: typeof search["registered"] === "string" ? (search["registered"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — CAREER CONNECT" },
      {
        name: "description",
        content: "Sign in to your Career Connect professional account to access jobs, matching intelligence, and career tools.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/login" });

  return (
    <LoginForm
      isAdmin={false}
      title="Welcome Back"
      subtitle="Sign in to continue building your professional future."
      redirectUrl={search["redirect"]}
      registeredSuccess={Boolean(search["registered"])}
    />
  );
}
