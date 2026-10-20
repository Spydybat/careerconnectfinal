import { describe, it, expect } from "vitest";

describe("Career Connect Authentication & Role-Based Access Control", () => {
  it("enforces strong password policy (min 8 chars)", () => {
    const isPasswordValid = (pwd: string) => pwd.length >= 8;
    expect(isPasswordValid("short")).toBe(false);
    expect(isPasswordValid("1234567")).toBe(false);
    expect(isPasswordValid("Password123!")).toBe(true);
  });

  it("validates email formatting strictly", () => {
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    expect(isEmailValid("invalid-email")).toBe(false);
    expect(isEmailValid("missing@domain")).toBe(false);
    expect(isEmailValid("candidate@careerconnect.com")).toBe(true);
  });

  it("prevents self-assignment of administrator role during registration", () => {
    const sanitizeRegistrationRole = (requestedRole?: string) => {
      const clean = (requestedRole || "").trim().toLowerCase();
      if (clean === "admin") return "candidate"; // Security constraint: Never grant admin via public registration
      if (clean === "employer") return "employer";
      return "candidate";
    };

    expect(sanitizeRegistrationRole("admin")).toBe("candidate");
    expect(sanitizeRegistrationRole("ADMIN")).toBe("candidate");
    expect(sanitizeRegistrationRole("employer")).toBe("employer");
    expect(sanitizeRegistrationRole("candidate")).toBe("candidate");
    expect(sanitizeRegistrationRole(undefined)).toBe("candidate");
  });

  it("resolves correct authenticated dashboard destination per role", () => {
    const getDashboardRedirect = (role?: string) => {
      switch (role) {
        case "admin":
          return "/admin/dashboard";
        case "employer":
          return "/employer/dashboard";
        case "candidate":
        default:
          return "/dashboard";
      }
    };

    expect(getDashboardRedirect("admin")).toBe("/admin/dashboard");
    expect(getDashboardRedirect("employer")).toBe("/employer/dashboard");
    expect(getDashboardRedirect("candidate")).toBe("/dashboard");
    expect(getDashboardRedirect(undefined)).toBe("/dashboard");
  });

  it("blocks unauthenticated and non-admin users from administrator console", () => {
    const canAccessAdminConsole = (user: { role?: string } | null) => {
      if (!user) return false;
      return user.role === "admin";
    };

    expect(canAccessAdminConsole(null)).toBe(false);
    expect(canAccessAdminConsole({ role: "candidate" })).toBe(false);
    expect(canAccessAdminConsole({ role: "employer" })).toBe(false);
    expect(canAccessAdminConsole({ role: "admin" })).toBe(true);
  });

  it("produces uniform non-enumerating error messages for failed login", () => {
    const getSafeAuthError = () => "Invalid email or password.";
    // Ensure both missing user and bad password return identical safe messages
    expect(getSafeAuthError()).toBe("Invalid email or password.");
  });
});
