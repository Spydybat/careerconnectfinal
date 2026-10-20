/**
 * Career Connect — API Configuration & Production URL Resolver
 *
 * Resolves the backend servlet endpoints with support for:
 * 1. Environment-based production URL via `VITE_BACKEND_URL` or `VITE_API_URL`
 *    (e.g., when hosted on Render, Railway, Fly.io, Azure, AWS, or custom Tomcat VPS)
 * 2. Relative URLs (`/AuthServlet`, `/CareerServlet`) which automatically route
 *    through the Vite dev server proxy in development or reverse proxy in production
 * 3. Direct localhost fallback when running locally without a reverse proxy
 */

export function getApiBaseUrl(): string {
  const envUrl = (
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env["VITE_BACKEND_URL"] || import.meta.env["VITE_API_URL"])) ||
    ""
  ).trim();

  return envUrl ? envUrl.replace(/\/+$/, "") : "";
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}
