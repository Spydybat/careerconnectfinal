import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiBaseUrl, isLocalEnvironment } from "@/lib/api-config";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: "candidate" | "admin" | "employer";
  organization?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
  redirect?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: "candidate" | "admin" | "employer" | null;
  login: (email: string, password: string, expectedRole?: string) => Promise<AuthResult>;
  register: (
    fullName: string,
    email: string,
    password: string,
    role?: "candidate" | "employer",
    organization?: string
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "career_connect_auth_user";

/**
 * Resilient multi-endpoint fetcher to communicate with AuthServlet.
 * Order of resolution:
 * 1. Configured Backend URL (`VITE_BACKEND_URL` / `VITE_API_URL`) if deployed separately
 * 2. In local development: Same-Origin Relative Proxy (`/AuthServlet`) or direct local Tomcat ports (8085)
 * 3. In production: Direct to configured cloud backend
 */
async function fetchAuthServlet(pathAndQuery: string, init?: RequestInit): Promise<Response> {
  const cleanPath = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const customBase = getApiBaseUrl();
  const isLocal = isLocalEnvironment();

  const endpoints: string[] = [];
  if (customBase) {
    endpoints.push(`${customBase}${cleanPath}`);
  }
  if (isLocal) {
    endpoints.push(cleanPath);
    endpoints.push(`http://localhost:8085${cleanPath}`);
    endpoints.push(`http://127.0.0.1:8085${cleanPath}`);
  } else if (!customBase) {
    // When running in production on Vercel without VITE_BACKEND_URL, try relative URL
    endpoints.push(cleanPath);
  }

  let lastError: Error | null = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        ...init,
        credentials: "include", // Required to pass and receive HTTP session cookies
      });

      // If in production without a backend URL and Vercel returns 404
      if (res.status === 404 && !isLocal && !customBase) {
        throw new Error(
          "Career Connect Java backend is not connected. In production, configure VITE_BACKEND_URL in Vercel to point to your deployed Tomcat backend."
        );
      }

      // Valid API responses from AuthServlet
      if (
        res.status === 200 ||
        res.status === 400 ||
        res.status === 401 ||
        res.status === 403 ||
        res.status === 429
      ) {
        return res;
      }

      // In local dev, if an endpoint returns 404, try next fallback
      if (res.status === 404 && isLocal) {
        continue;
      }

      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (!isLocal && !customBase) {
    throw new Error(
      "Backend service URL is not configured. Set VITE_BACKEND_URL in Vercel to point to your deployed Java Tomcat backend."
    );
  }

  throw lastError || new Error("Unable to connect to Career Connect Authentication Gateway.");
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Synchronous hydrate from cache to prevent UI flash on page reload
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn("[Auth] Failed to parse local cached user", e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authoritatively verify session against backend on mount
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetchAuthServlet("/AuthServlet?action=session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          return;
        }
      }
      // If server confirms unauthenticated, clear local cache
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("[Auth] Failed to reach AuthServlet for session verification:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string, expectedRole?: string): Promise<AuthResult> => {
    try {
      const params = new URLSearchParams({
        action: "login",
        email: email.trim(),
        password,
      });
      if (expectedRole) {
        params.append("expectedRole", expectedRole);
      }

      const res = await fetchAuthServlet("/AuthServlet", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || `Authentication failed (Status ${res.status})`,
        };
      }

      const authenticatedUser: AuthUser = data.user;
      setUser(authenticatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));

      return {
        success: true,
        user: authenticatedUser,
        redirect: data.redirect || (authenticatedUser.role === "admin" ? "/admin/dashboard" : authenticatedUser.role === "employer" ? "/employer/dashboard" : "/dashboard"),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error during authentication.";
      return {
        success: false,
        error: msg.includes("Failed to fetch") ? "Could not connect to authentication server. Please ensure the backend is running." : msg,
      };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: "candidate" | "employer" = "candidate",
    organization?: string
  ): Promise<AuthResult> => {
    try {
      const params = new URLSearchParams({
        action: "register",
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      if (organization) {
        params.append("organization", organization.trim());
      }

      const res = await fetchAuthServlet("/AuthServlet", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString(),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || `Registration failed (Status ${res.status})`,
        };
      }

      const registeredUser: AuthUser = data.user;
      setUser(registeredUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser));

      return {
        success: true,
        user: registeredUser,
        redirect: data.redirect || (registeredUser.role === "employer" ? "/employer/dashboard" : "/dashboard"),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error during registration.";
      return {
        success: false,
        error: msg.includes("Failed to fetch") ? "Could not connect to authentication server. Please ensure the backend is running." : msg,
      };
    }
  };

  const logout = async () => {
    try {
      await fetchAuthServlet("/AuthServlet", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "action=logout",
      });
    } catch (e) {
      console.warn("[Auth] Logout request error:", e);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("career_connect_profile_id");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const params = new URLSearchParams({ action: "forgot-password", email: email.trim() });
      const res = await fetchAuthServlet("/AuthServlet", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data?.error || "Failed to process password recovery request." };
    } catch (err) {
      return { success: false, error: "Network error during password recovery." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        role: user?.role ?? null,
        login,
        register,
        logout,
        forgotPassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
