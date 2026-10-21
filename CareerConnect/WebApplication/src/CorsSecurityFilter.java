import java.io.IOException;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Career Connect - Global CORS & Cross-Site Cookie Filter
 *
 * Intercepts all requests entering the web container:
 * 1. Validates Origin against the authorized allowlist.
 * 2. Emits compliant CORS preflight and response headers.
 * 3. Rewrites session Set-Cookie headers on HTTPS to inject "SameSite=None; Secure",
 *    enabling cross-site credentials between Vercel and the Java Tomcat backend.
 *
 * Author: Kalaiyarasan K (9943)
 */
public class CorsSecurityFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest) || !(response instanceof HttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Apply CORS headers for allowed origins
        CorsUtil.applyCors(httpRequest, httpResponse);

        // Terminate OPTIONS preflight queries immediately
        if (CorsUtil.handlePreflight(httpRequest, httpResponse)) {
            return;
        }

        // Determine if connection is secure / HTTPS
        boolean isHttps = CorsUtil.isHttpsRequest(httpRequest);

        // Wrap response to intercept and format Set-Cookie headers
        HttpServletResponse wrappedResponse = new CookieHeaderResponseWrapper(httpResponse, isHttps);
        chain.doFilter(request, wrappedResponse);
    }

    @Override
    public void destroy() {}

    /**
     * Response wrapper that ensures all Set-Cookie headers have compliant
     * SameSite and Secure flags for cross-origin or local operations.
     */
    private static class CookieHeaderResponseWrapper extends HttpServletResponseWrapper {
        private final boolean isHttps;

        public CookieHeaderResponseWrapper(HttpServletResponse response, boolean isHttps) {
            super(response);
            this.isHttps = isHttps;
        }

        @Override
        public void addCookie(Cookie cookie) {
            if (isHttps) {
                cookie.setSecure(true);
            }
            super.addCookie(cookie);
        }

        @Override
        public void setHeader(String name, String value) {
            if ("Set-Cookie".equalsIgnoreCase(name)) {
                value = CorsUtil.formatCookie(value, isHttps);
            }
            super.setHeader(name, value);
        }

        @Override
        public void addHeader(String name, String value) {
            if ("Set-Cookie".equalsIgnoreCase(name)) {
                value = CorsUtil.formatCookie(value, isHttps);
            }
            super.addHeader(name, value);
        }
    }
}
