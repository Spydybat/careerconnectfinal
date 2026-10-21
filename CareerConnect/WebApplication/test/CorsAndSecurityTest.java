import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Automated Verification Suite for CORS & Cross-Site Cookie Policy
 */
public class CorsAndSecurityTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println(" Career Connect — CORS & Cookie Policy Test Suite");
        System.out.println("=================================================");

        testOriginAllowlist();
        testWildcardDisallowed();
        testCorsHeaderEmissionOnAllowedOrigin();
        testCorsHeaderSuppressionOnDisallowedOrigin();
        testOptionsPreflightHandling();
        testHttpsCookieFormatting();
        testHttpLocalCookieFormatting();
        testAuthServletPreflight();
        testCareerServletPreflight();

        System.out.println("=================================================");
        System.out.printf(" Results: %d Passed, %d Failed%n", passed, failed);
        System.out.println("=================================================");

        if (failed > 0) {
            System.exit(1);
        }
    }

    private static void assertTrue(String testName, boolean condition) {
        if (condition) {
            System.out.println(" [PASS] " + testName);
            passed++;
        } else {
            System.err.println(" [FAIL] " + testName);
            failed++;
        }
    }

    private static void assertEquals(String testName, Object expected, Object actual) {
        if (Objects.equals(expected, actual)) {
            System.out.println(" [PASS] " + testName);
            passed++;
        } else {
            System.err.println(" [FAIL] " + testName + " | Expected: " + expected + ", Got: " + actual);
            failed++;
        }
    }

    private static void testOriginAllowlist() {
        assertTrue("Allows exact production Vercel frontend",
            CorsUtil.isAllowedOrigin("https://careerconnectfinal.vercel.app"));

        assertTrue("Allows production frontend with trailing slash",
            CorsUtil.isAllowedOrigin("https://careerconnectfinal.vercel.app/"));

        assertTrue("Allows local Vite dev port 5173",
            CorsUtil.isAllowedOrigin("http://localhost:5173"));

        assertTrue("Allows local React dev port 3000",
            CorsUtil.isAllowedOrigin("http://localhost:3000"));

        assertTrue("Allows local Tomcat port 8080",
            CorsUtil.isAllowedOrigin("http://localhost:8080"));

        assertTrue("Allows local Embedded port 8085",
            CorsUtil.isAllowedOrigin("http://localhost:8085"));

        assertTrue("Allows IPv4 loopback 127.0.0.1:5173",
            CorsUtil.isAllowedOrigin("http://127.0.0.1:5173"));

        assertTrue("Allows Vercel branch preview deployment",
            CorsUtil.isAllowedOrigin("https://careerconnectfinal-preview.vercel.app"));

        assertTrue("Rejects unknown external origin",
            !CorsUtil.isAllowedOrigin("https://malicious-attacker.com"));

        assertTrue("Rejects spoofed origin containing vercel.app in subdomain",
            !CorsUtil.isAllowedOrigin("https://evil.vercel.app"));

        assertTrue("Rejects null origin",
            !CorsUtil.isAllowedOrigin(null));

        assertTrue("Rejects empty origin",
            !CorsUtil.isAllowedOrigin(""));
    }

    private static void testWildcardDisallowed() {
        assertTrue("Wildcard '*' must never be considered an allowed origin",
            !CorsUtil.isAllowedOrigin("*"));
    }

    private static void testCorsHeaderEmissionOnAllowedOrigin() {
        MockRequest req = new MockRequest("GET", "https://careerconnectfinal.vercel.app");
        MockResponse res = new MockResponse();

        CorsUtil.applyCors(req, res);

        assertEquals("Access-Control-Allow-Origin equals exact origin",
            "https://careerconnectfinal.vercel.app", res.getHeader("Access-Control-Allow-Origin"));
        assertEquals("Access-Control-Allow-Credentials is true",
            "true", res.getHeader("Access-Control-Allow-Credentials"));
        assertEquals("Vary header contains Origin",
            "Origin", res.getHeader("Vary"));
        assertTrue("Never uses wildcard origin with credentials",
            !"*".equals(res.getHeader("Access-Control-Allow-Origin")));
    }

    private static void testCorsHeaderSuppressionOnDisallowedOrigin() {
        MockRequest req = new MockRequest("GET", "https://hacker.com");
        MockResponse res = new MockResponse();

        CorsUtil.applyCors(req, res);

        assertTrue("Disallowed origin must NOT receive Access-Control-Allow-Origin",
            res.getHeader("Access-Control-Allow-Origin") == null);
        assertTrue("Disallowed origin must NOT receive Access-Control-Allow-Credentials",
            res.getHeader("Access-Control-Allow-Credentials") == null);
    }

    private static void testOptionsPreflightHandling() {
        // Valid preflight
        MockRequest validReq = new MockRequest("OPTIONS", "https://careerconnectfinal.vercel.app");
        MockResponse validRes = new MockResponse();

        boolean handled = CorsUtil.handlePreflight(validReq, validRes);
        assertTrue("OPTIONS preflight returns handled = true", handled);
        assertEquals("Preflight status is 200 OK", 200, validRes.getStatus());
        assertEquals("Preflight origin matches",
            "https://careerconnectfinal.vercel.app", validRes.getHeader("Access-Control-Allow-Origin"));
        assertEquals("Preflight credentials true",
            "true", validRes.getHeader("Access-Control-Allow-Credentials"));

        // Malicious preflight
        MockRequest evilReq = new MockRequest("OPTIONS", "https://evil.com");
        MockResponse evilRes = new MockResponse();

        boolean evilHandled = CorsUtil.handlePreflight(evilReq, evilRes);
        assertTrue("Evil OPTIONS preflight handled", evilHandled);
        assertEquals("Evil preflight receives 403 Forbidden", 403, evilRes.getStatus());
        assertTrue("Evil preflight has no Allow-Origin",
            evilRes.getHeader("Access-Control-Allow-Origin") == null);
    }

    private static void testHttpsCookieFormatting() {
        String raw = "JSESSIONID=E5B9F045AA18; Path=/; HttpOnly";
        String formatted = CorsUtil.formatCookie(raw, true);

        assertTrue("HTTPS cookie must contain 'Secure'",
            formatted.contains("Secure"));
        assertTrue("HTTPS cookie must contain 'SameSite=None'",
            formatted.contains("SameSite=None"));
        assertTrue("HTTPS cookie preserves HttpOnly",
            formatted.contains("HttpOnly"));
        assertTrue("HTTPS cookie preserves Path=/",
            formatted.contains("Path=/"));
    }

    private static void testHttpLocalCookieFormatting() {
        String raw = "JSESSIONID=E5B9F045AA18; Path=/; HttpOnly";
        String formatted = CorsUtil.formatCookie(raw, false);

        assertTrue("Local HTTP cookie must NOT contain 'Secure' (prevents browser rejection)",
            !formatted.toLowerCase().contains("secure"));
        assertTrue("Local HTTP cookie must contain 'SameSite=Lax'",
            formatted.contains("SameSite=Lax"));
    }

    private static void testAuthServletPreflight() {
        AuthServlet servlet = new AuthServlet();
        MockRequest req = new MockRequest("OPTIONS", "https://careerconnectfinal.vercel.app");
        MockResponse res = new MockResponse();

        try {
            servlet.doOptions(req, res);
            assertEquals("AuthServlet preflight status is 200", 200, res.getStatus());
            assertEquals("AuthServlet preflight origin set",
                "https://careerconnectfinal.vercel.app", res.getHeader("Access-Control-Allow-Origin"));
            assertEquals("AuthServlet preflight credentials set",
                "true", res.getHeader("Access-Control-Allow-Credentials"));
        } catch (Exception e) {
            assertTrue("AuthServlet preflight exception: " + e.getMessage(), false);
        }
    }

    private static void testCareerServletPreflight() {
        CareerServlet servlet = new CareerServlet();
        MockRequest req = new MockRequest("OPTIONS", "https://careerconnectfinal.vercel.app");
        MockResponse res = new MockResponse();

        try {
            servlet.doOptions(req, res);
            assertEquals("CareerServlet preflight status is 200", 200, res.getStatus());
            assertEquals("CareerServlet preflight origin set",
                "https://careerconnectfinal.vercel.app", res.getHeader("Access-Control-Allow-Origin"));
            assertEquals("CareerServlet preflight credentials set",
                "true", res.getHeader("Access-Control-Allow-Credentials"));
        } catch (Exception e) {
            assertTrue("CareerServlet preflight exception: " + e.getMessage(), false);
        }
    }

    // Minimal Mock Implementations for testing
    private static class MockRequest extends HttpServletRequestWrapper {
        private final String method;
        private final String origin;

        public MockRequest(String method, String origin) {
            super(new DummyHttpServletRequest());
            this.method = method;
            this.origin = origin;
        }

        @Override
        public String getMethod() {
            return method;
        }

        @Override
        public String getHeader(String name) {
            if ("Origin".equalsIgnoreCase(name)) return origin;
            if ("X-Forwarded-Proto".equalsIgnoreCase(name) && origin != null && origin.startsWith("https")) return "https";
            return null;
        }

        @Override
        public boolean isSecure() {
            return origin != null && origin.startsWith("https");
        }
    }

    private static class MockResponse extends HttpServletResponseWrapper {
        private int status = 200;
        private final Map<String, String> headers = new LinkedHashMap<>();

        public MockResponse() {
            super(new DummyHttpServletResponse());
        }

        @Override
        public void setStatus(int sc) {
            this.status = sc;
        }

        @Override
        public int getStatus() {
            return this.status;
        }

        @Override
        public void setHeader(String name, String value) {
            headers.put(name, value);
        }

        @Override
        public void addHeader(String name, String value) {
            headers.put(name, value);
        }

        @Override
        public String getHeader(String name) {
            return headers.get(name);
        }

        @Override
        public void setContentLength(int len) {}
    }

    private static class DummyHttpServletRequest implements HttpServletRequest {
        public String getAuthType() { return null; }
        public Cookie[] getCookies() { return new Cookie[0]; }
        public long getDateHeader(String name) { return 0; }
        public String getHeader(String name) { return null; }
        public Enumeration<String> getHeaders(String name) { return Collections.emptyEnumeration(); }
        public Enumeration<String> getHeaderNames() { return Collections.emptyEnumeration(); }
        public int getIntHeader(String name) { return 0; }
        public String getMethod() { return "GET"; }
        public String getPathInfo() { return null; }
        public String getPathTranslated() { return null; }
        public String getContextPath() { return ""; }
        public String getQueryString() { return null; }
        public String getRemoteUser() { return null; }
        public boolean isUserInRole(String role) { return false; }
        public java.security.Principal getUserPrincipal() { return null; }
        public String getRequestedSessionId() { return null; }
        public String getRequestURI() { return "/"; }
        public StringBuffer getRequestURL() { return new StringBuffer("http://localhost/"); }
        public String getServletPath() { return ""; }
        public HttpSession getSession(boolean create) { return null; }
        public HttpSession getSession() { return null; }
        public String changeSessionId() { return null; }
        public boolean isRequestedSessionIdValid() { return false; }
        public boolean isRequestedSessionIdFromCookie() { return false; }
        public boolean isRequestedSessionIdFromURL() { return false; }
        public boolean isRequestedSessionIdFromUrl() { return false; }
        public boolean authenticate(HttpServletResponse response) { return false; }
        public void login(String username, String password) {}
        public void logout() {}
        public Collection<Part> getParts() { return Collections.emptyList(); }
        public Part getPart(String name) { return null; }
        public <T extends HttpUpgradeHandler> T upgrade(Class<T> handlerClass) { return null; }
        public Object getAttribute(String name) { return null; }
        public Enumeration<String> getAttributeNames() { return Collections.emptyEnumeration(); }
        public String getCharacterEncoding() { return "UTF-8"; }
        public void setCharacterEncoding(String env) {}
        public int getContentLength() { return 0; }
        public long getContentLengthLong() { return 0; }
        public String getContentType() { return null; }
        public ServletInputStream getInputStream() { return null; }
        public String getParameter(String name) { return null; }
        public Enumeration<String> getParameterNames() { return Collections.emptyEnumeration(); }
        public String[] getParameterValues(String name) { return new String[0]; }
        public Map<String, String[]> getParameterMap() { return Collections.emptyMap(); }
        public String getProtocol() { return "HTTP/1.1"; }
        public String getScheme() { return "http"; }
        public String getServerName() { return "localhost"; }
        public int getServerPort() { return 8080; }
        public BufferedReader getReader() { return null; }
        public String getRemoteAddr() { return "127.0.0.1"; }
        public String getRemoteHost() { return "localhost"; }
        public void setAttribute(String name, Object o) {}
        public void removeAttribute(String name) {}
        public Locale getLocale() { return Locale.getDefault(); }
        public Enumeration<Locale> getLocales() { return Collections.emptyEnumeration(); }
        public boolean isSecure() { return false; }
        public RequestDispatcher getRequestDispatcher(String path) { return null; }
        public String getRealPath(String path) { return null; }
        public int getRemotePort() { return 0; }
        public String getLocalName() { return "localhost"; }
        public String getLocalAddr() { return "127.0.0.1"; }
        public int getLocalPort() { return 8080; }
        public ServletContext getServletContext() { return null; }
        public AsyncContext startAsync() { return null; }
        public AsyncContext startAsync(ServletRequest servletRequest, ServletResponse servletResponse) { return null; }
        public boolean isAsyncStarted() { return false; }
        public boolean isAsyncSupported() { return false; }
        public AsyncContext getAsyncContext() { return null; }
        public DispatcherType getDispatcherType() { return DispatcherType.REQUEST; }
    }

    private static class DummyHttpServletResponse implements HttpServletResponse {
        public void addCookie(Cookie cookie) {}
        public boolean containsHeader(String name) { return false; }
        public String encodeURL(String url) { return url; }
        public String encodeRedirectURL(String url) { return url; }
        public String encodeUrl(String url) { return url; }
        public String encodeRedirectUrl(String url) { return url; }
        public void sendError(int sc, String msg) {}
        public void sendError(int sc) {}
        public void sendRedirect(String location) {}
        public void setDateHeader(String name, long date) {}
        public void addDateHeader(String name, long date) {}
        public void setHeader(String name, String value) {}
        public void addHeader(String name, String value) {}
        public void setIntHeader(String name, int value) {}
        public void addIntHeader(String name, int value) {}
        public void setStatus(int sc) {}
        public void setStatus(int sc, String sm) {}
        public int getStatus() { return 200; }
        public String getHeader(String name) { return null; }
        public Collection<String> getHeaders(String name) { return Collections.emptyList(); }
        public Collection<String> getHeaderNames() { return Collections.emptyList(); }
        public String getCharacterEncoding() { return "UTF-8"; }
        public String getContentType() { return null; }
        public ServletOutputStream getOutputStream() { return null; }
        public PrintWriter getWriter() { return new PrintWriter(new StringWriter()); }
        public void setCharacterEncoding(String charset) {}
        public void setContentLength(int len) {}
        public void setContentLengthLong(long len) {}
        public void setContentType(String type) {}
        public void setBufferSize(int size) {}
        public int getBufferSize() { return 0; }
        public void flushBuffer() {}
        public void resetBuffer() {}
        public boolean isCommitted() { return false; }
        public void reset() {}
        public void setLocale(Locale loc) {}
        public Locale getLocale() { return Locale.getDefault(); }
    }
}
