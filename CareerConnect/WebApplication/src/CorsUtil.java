import java.util.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Career Connect - Centralized CORS & Security Policy Utility
 *
 * Enforces strict origin allowlisting, credentials validation,
 * and preflight OPTIONS handling.
 *
 * Production Origin: https://careerconnectfinal.vercel.app
 *
 * Author: Kalaiyarasan K (9943)
 */
public class CorsUtil {

    public static final String PRODUCTION_ORIGIN = "https://careerconnectfinal.vercel.app";

    private static final Set<String> ALLOWED_ORIGINS = new HashSet<>(Arrays.asList(
        "https://careerconnectfinal.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8085",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8085"
    ));

    static {
        // Allow dynamic injection of frontend origins via environment variables
        String envOrigins = System.getenv("ALLOWED_ORIGINS");
        if (envOrigins != null && !envOrigins.trim().isEmpty()) {
            for (String origin : envOrigins.split(",")) {
                String clean = origin.trim();
                if (!clean.isEmpty()) {
                    ALLOWED_ORIGINS.add(normalizeOrigin(clean));
                }
            }
        }
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl != null && !frontendUrl.trim().isEmpty()) {
            ALLOWED_ORIGINS.add(normalizeOrigin(frontendUrl.trim()));
        }
    }

    /**
     * Normalizes an origin string by stripping trailing slashes and trimming whitespace.
     */
    public static String normalizeOrigin(String origin) {
        if (origin == null) return null;
        String trimmed = origin.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    /**
     * Verifies if the request Origin is an authorized frontend origin.
     * Wildcards ('*') are strictly disallowed.
     */
    public static boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.trim().isEmpty() || "*".equals(origin.trim())) {
            return false;
        }
        String normalized = normalizeOrigin(origin);
        if (ALLOWED_ORIGINS.contains(normalized)) {
            return true;
        }
        // Allow Vercel preview deployments for this project
        if (normalized.startsWith("https://careerconnectfinal-") && normalized.endsWith(".vercel.app")) {
            return true;
        }
        return false;
    }

    /**
     * Applies CORS headers to the HTTP response.
     * If the origin is allowed, sets the exact matching origin and Access-Control-Allow-Credentials: true.
     * NEVER sets Access-Control-Allow-Origin: * when credentials are true.
     * If origin is null, empty, or disallowed, no CORS origin headers are added.
     */
    public static void applyCors(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (isAllowedOrigin(origin)) {
            String normalized = normalizeOrigin(origin);
            response.setHeader("Access-Control-Allow-Origin", normalized);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
            response.setHeader("Access-Control-Max-Age", "86400");
            response.setHeader("Vary", "Origin");
        }
    }

    /**
     * Handles HTTP OPTIONS preflight requests.
     * Returns true if request was an OPTIONS preflight (and responds with 200 or 403),
     * or false if it is a regular method that should continue down the pipeline.
     */
    public static boolean handlePreflight(HttpServletRequest request, HttpServletResponse response) {
        if (!"OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String origin = request.getHeader("Origin");
        if (isAllowedOrigin(origin)) {
            applyCors(request, response);
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentLength(0);
        } else if (origin != null && !origin.trim().isEmpty()) {
            // Disallowed origin attempting cross-origin preflight
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentLength(0);
        } else {
            // Non-CORS direct OPTIONS query
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentLength(0);
        }
        return true;
    }

    /**
     * Formats cookie attributes for cross-site / local context.
     * On HTTPS / production: ensures "; Secure; SameSite=None" is appended.
     * On HTTP / local dev: ensures "; SameSite=Lax" without "; Secure".
     */
    public static String formatCookie(String cookieHeader, boolean isHttps) {
        if (cookieHeader == null || cookieHeader.trim().isEmpty()) {
            return cookieHeader;
        }

        String result = cookieHeader;
        if (isHttps) {
            // HTTPS production cross-site cookies must have both Secure and SameSite=None
            if (!result.toLowerCase().contains("secure")) {
                result = result + "; Secure";
            }
            if (!result.toLowerCase().contains("samesite")) {
                result = result + "; SameSite=None";
            } else if (!result.toLowerCase().contains("samesite=none")) {
                result = result.replaceAll("(?i)SameSite=[^;]+", "SameSite=None");
            }
        } else {
            // Local HTTP development: do NOT add Secure (browsers reject Secure cookies over plain HTTP)
            if (!result.toLowerCase().contains("samesite")) {
                result = result + "; SameSite=Lax";
            }
        }
        return result;
    }

    /**
     * Inspects whether the request represents an HTTPS / secure connection.
     * Recognizes direct TLS, reverse proxy headers (X-Forwarded-Proto), and secure client Origin.
     */
    public static boolean isHttpsRequest(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        if ("https".equalsIgnoreCase(proto)) {
            return true;
        }
        String origin = request.getHeader("Origin");
        if (origin != null && origin.toLowerCase().startsWith("https://")) {
            return true;
        }
        return false;
    }
}
