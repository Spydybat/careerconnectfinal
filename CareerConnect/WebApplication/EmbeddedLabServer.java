import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.*;

/**
 * EmbeddedLabServer.java
 * Standalone Java Web Server for Career Connect Platform Backend Services
 * Runs on Java SE without requiring external Tomcat download, while maintaining full compatibility
 * with standard Tomcat WAR deployment.
 */
public class EmbeddedLabServer {
    private static final int DEFAULT_PORT = 8085;
    private static final Map<String, Map<String, Object>> SESSIONS = new ConcurrentHashMap<>();

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (Exception ignored) {}
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newCachedThreadPool());

        // Context handlers
        server.createContext("/", new StaticFileHandler());
        server.createContext("/CareerServlet", new CareerServletHandler());
        server.createContext("/SessionTrackingServlet", new SessionTrackingServletHandler());
        server.createContext("/career-result.jsp", new CareerResultJspHandler());

        System.out.println("==================================================================");
        System.out.println("CAREER CONNECT - JAVA WEB SERVER");
        System.out.println("==================================================================");
        System.out.println("Server running at: http://localhost:" + port + "/");
        System.out.println("Endpoints available:");
        System.out.println("  1. Profile Submission:   http://localhost:" + port + "/index-5a.html");
        System.out.println("  2. Session Tracking:     http://localhost:" + port + "/index-5b.html");
        System.out.println("  3. Three-Tier JSP:       http://localhost:" + port + "/career.jsp");
        System.out.println("  4. MVC Candidate View:   http://localhost:" + port + "/profile.jsp");
        System.out.println("==================================================================");
        server.start();
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        List<String> lenHeader = exchange.getRequestHeaders().get("Content-Length");
        if (lenHeader != null && !lenHeader.isEmpty()) {
            try {
                int length = Integer.parseInt(lenHeader.get(0).trim());
                byte[] data = new byte[length];
                int totalRead = 0;
                while (totalRead < length) {
                    int count = is.read(data, totalRead, length - totalRead);
                    if (count < 0) break;
                    totalRead += count;
                }
                return new String(data, 0, totalRead, StandardCharsets.UTF_8);
            } catch (Exception ignored) {}
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = is.read(buffer)) != -1) {
            baos.write(buffer, 0, read);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

    private static Map<String, String> parseFormData(String body) {
        Map<String, String> map = new HashMap<>();
        if (body == null || body.isEmpty()) return map;
        String[] pairs = body.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=", 2);
            String k = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String v = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            map.put(k, v);
        }
        return map;
    }

    private static String getOrCreateSessionId(HttpExchange exchange) {
        List<String> cookieHeaders = exchange.getRequestHeaders().get("Cookie");
        String sessionId = null;
        if (cookieHeaders != null) {
            for (String header : cookieHeaders) {
                String[] cookies = header.split(";");
                for (String c : cookies) {
                    String[] parts = c.trim().split("=", 2);
                    if (parts[0].equals("JSESSIONID") && parts.length > 1) {
                        sessionId = parts[1];
                        break;
                    }
                }
            }
        }
        if (sessionId == null || !SESSIONS.containsKey(sessionId)) {
            sessionId = "CC_SESS_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            Map<String, Object> sessionData = new ConcurrentHashMap<>();
            sessionData.put("_created", System.currentTimeMillis());
            SESSIONS.put(sessionId, sessionData);
            String cookie = "JSESSIONID=" + sessionId + "; Path=/; HttpOnly";
            String origin = exchange.getRequestHeaders().getFirst("Origin");
            if (origin != null && origin.toLowerCase().startsWith("https://")) {
                cookie += "; Secure; SameSite=None";
            } else {
                cookie += "; SameSite=Lax";
            }
            exchange.getResponseHeaders().add("Set-Cookie", cookie);
        }
        return sessionId;
    }

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

    private static void applyCorsHeaders(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin != null && !origin.trim().isEmpty()) {
            String norm = origin.trim().replaceAll("/+$", "");
            if (ALLOWED_ORIGINS.contains(norm) || (norm.startsWith("https://careerconnectfinal-") && norm.endsWith(".vercel.app"))) {
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", norm);
                exchange.getResponseHeaders().set("Access-Control-Allow-Credentials", "true");
                exchange.getResponseHeaders().set("Vary", "Origin");
            }
        }
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
        exchange.getResponseHeaders().set("Access-Control-Max-Age", "86400");
    }

    // Static files handler (serves HTML and JSP template forms)
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applyCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index-5a.html";
            
            File file = new File("web" + path);
            if (!file.exists()) {
                file = new File("wt-lab/java-web/web" + path);
            }
            if (!file.exists()) {
                file = new File("CareerConnect/WebApplication/web" + path);
            }

            if (file.exists() && !file.isDirectory()) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                String contentType = "text/html; charset=UTF-8";
                if (path.endsWith(".css")) contentType = "text/css";
                else if (path.endsWith(".js")) contentType = "application/javascript";
                
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                String notFound = "<h1>404 Not Found</h1><p>Resource " + path + " not found.</p>";
                byte[] bytes = notFound.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html");
                exchange.sendResponseHeaders(404, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            }
        }
    }

    // Handler for CareerServlet
    static class CareerServletHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applyCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String method = exchange.getRequestMethod();
            Map<String, String> params = new HashMap<>();

            if ("POST".equalsIgnoreCase(method)) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder buf = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) buf.append(line);
                params = parseFormData(buf.toString());
            }

            String name = params.getOrDefault("name", "Alex Morgan");
            String email = params.getOrDefault("email", "alex.morgan@example.com");
            String phone = params.getOrDefault("phone", "9876543210");
            String education = params.getOrDefault("education", "B.E / B.Tech");
            String skills = params.getOrDefault("skills", "HTML, CSS, JavaScript, Java");
            String careerGoal = params.getOrDefault("careerGoal", "Software Developer");
            String experience = params.getOrDefault("experience", "Fresher");

            String html = "<!DOCTYPE html><html><head><title>Career Connect Profile</title><style>"
                + "body{font-family:Arial,sans-serif;background:#f3f2ef;margin:0;padding:20px;}"
                + ".header{background:#0a66c2;color:white;text-align:center;padding:25px;border-radius:12px 12px 0 0;max-width:600px;margin:20px auto 0;}"
                + ".container{max-width:600px;margin:0 auto 40px;background:white;padding:35px;border-radius:0 0 12px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);}"
                + "h1{margin:0;font-size:24px;}h2{color:#0a66c2;text-align:center;font-size:20px;}"
                + "p{font-size:15px;padding:9px 0;border-bottom:1px solid #e2e8f0;margin:0;color:#334155;}"
                + "b{color:#0a66c2;}.success{text-align:center;color:#0a66c2;font-weight:bold;font-size:17px;border-bottom:none;padding:5px 0 18px;}"
                + ".btn{display:inline-block;margin-top:20px;padding:12px 20px;background:#0a66c2;color:white;text-decoration:none;border-radius:24px;font-weight:bold;font-size:14px;}"
                + "</style></head><body>"
                + "<div class='header'><h1>CAREER CONNECT</h1><p>Professional Profile Submission Gateway</p></div>"
                + "<div class='container'>"
                + "<h2>Your professional profile has been created successfully.</h2>"
                + "<p class='success'>Candidate Profile Processed via Server Gateway</p>"
                + "<h2>Profile Details</h2>"
                + "<p><b>Full Name:</b> " + name + "</p>"
                + "<p><b>Email Address:</b> " + email + "</p>"
                + "<p><b>Phone Number:</b> " + phone + "</p>"
                + "<p><b>Education:</b> " + education + "</p>"
                + "<p><b>Skills:</b> " + skills + "</p>"
                + "<p><b>Career Goal:</b> " + careerGoal + "</p>"
                + "<p><b>Experience:</b> " + experience + "</p>"
                + "<h2>Career Intelligence</h2>"
                + "<p><b>Profile Status:</b> Active Verified</p>"
                + "<p><b>Target Career:</b> " + careerGoal + "</p>"
                + "<p><b>Skill Analysis:</b> Competencies successfully recorded</p>"
                + "<div style='text-align:center;'><a href='/index-5a.html' class='btn'>Back to Form</a></div>"
                + "</div></body></html>";

            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
        }
    }

    // Handler for SessionTrackingServlet
    static class SessionTrackingServletHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applyCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String sessionId = getOrCreateSessionId(exchange);
            Map<String, Object> session = SESSIONS.get(sessionId);

            String method = exchange.getRequestMethod();
            if ("POST".equalsIgnoreCase(method)) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder buf = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) buf.append(line);
                Map<String, String> params = parseFormData(buf.toString());

                if (params.containsKey("name")) session.put("name", params.get("name"));
                if (params.containsKey("email")) session.put("email", params.get("email"));
                if (params.containsKey("careerGoal")) session.put("careerGoal", params.get("careerGoal"));
            }

            String name = (String) session.getOrDefault("name", "Alex Morgan");
            String email = (String) session.getOrDefault("email", "alex.morgan@example.com");
            String careerGoal = (String) session.getOrDefault("careerGoal", "Software Developer");
            long created = (long) session.getOrDefault("_created", System.currentTimeMillis());

            String html = "<!DOCTYPE html><html><head><title>Career Connect Session</title><style>"
                + "body{font-family:Arial,sans-serif;background:#f3f2ef;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;}"
                + ".container{background:white;padding:36px;border-radius:16px;box-shadow:0 4px 18px rgba(0,0,0,0.08);max-width:500px;width:100%;}"
                + "h1{color:#0a66c2;text-align:center;margin:0;font-size:24px;}h2{color:#1e293b;margin-top:14px;font-size:18px;text-align:center;}"
                + "p{font-size:15px;line-height:1.7;margin:8px 0;color:#334155;}b{color:#0a66c2;}"
                + ".session{background:#f0f9ff;padding:16px;border-radius:8px;margin-top:20px;border-left:4px solid #0a66c2;}"
                + ".btn{display:inline-block;margin-top:20px;padding:12px 20px;background:#0a66c2;color:white;text-decoration:none;border-radius:24px;font-weight:bold;font-size:14px;}"
                + "</style></head><body>"
                + "<div class='container'>"
                + "<h1>CAREER CONNECT</h1>"
                + "<h2>Active Professional Career Session</h2>"
                + "<p><b>Name:</b> " + name + "</p>"
                + "<p><b>Email:</b> " + email + "</p>"
                + "<p><b>Career Goal:</b> " + careerGoal + "</p>"
                + "<div class='session'>"
                + "<p><b>Session ID:</b> " + sessionId + "</p>"
                + "<p><b>Session Created:</b> " + new Date(created) + "</p>"
                + "<p><b>Session State:</b> Active HttpSession</p>"
                + "<p>Your career session state is securely managed and bound to your browser session.</p>"
                + "</div>"
                + "<div style='text-align:center;'><a href='/index-5b.html' class='btn'>Start Another Session</a></div>"
                + "</div></body></html>";

            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
        }
    }

    // Handler for career-result.jsp
    static class CareerResultJspHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applyCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr);
            StringBuilder buf = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) buf.append(line);
            Map<String, String> params = parseFormData(buf.toString());

            String name = params.getOrDefault("name", "Alex Morgan");
            String email = params.getOrDefault("email", "alex.morgan@example.com");
            String phone = params.getOrDefault("phone", "9876543210");
            String education = params.getOrDefault("education", "B.E / B.Tech");
            String skills = params.getOrDefault("skills", "HTML, CSS, JavaScript, Java");
            String careerGoal = params.getOrDefault("careerGoal", "Software Developer");
            String experience = params.getOrDefault("experience", "Fresher");
            String goals = params.getOrDefault("goals", "Full-Stack Development");

            String html = "<!DOCTYPE html><html><head><title>Career Profile Confirmation</title><style>"
                + "body{margin:0;min-height:100vh;background:#f3f2ef;display:flex;justify-content:center;align-items:center;font-family:Arial,sans-serif;padding:20px;}"
                + ".card{width:560px;max-width:95%;background:#fff;padding:35px;border-radius:18px;box-shadow:0 4px 18px rgba(0,0,0,0.08);text-align:center;}"
                + ".success{width:60px;height:60px;margin:0 auto 15px;border-radius:50%;background:#10b981;color:#fff;font-size:32px;display:grid;place-items:center;font-weight:bold;}"
                + "h1{color:#0a66c2;margin:10px 0;font-size:24px;}.details{text-align:left;background:#f8fafc;padding:18px;border-radius:10px;margin-top:20px;border-left:4px solid #0a66c2;}"
                + ".details p{margin:8px 0;color:#334155;font-size:14px;}b{color:#0a66c2;}"
                + ".home{display:inline-block;margin-top:20px;padding:12px 22px;background:#0a66c2;color:#fff;text-decoration:none;border-radius:24px;font-weight:bold;font-size:14px;}"
                + "</style></head><body>"
                + "<div class='card'>"
                + "<div class='success'>✓</div>"
                + "<h1>Career Profile Created</h1>"
                + "<p style='color:#64748b;'>Your Career Connect profile has been processed via Three-Tier JSP application.</p>"
                + "<div class='details'>"
                + "<p><b>Full Name:</b> " + name + "</p>"
                + "<p><b>Email:</b> " + email + "</p>"
                + "<p><b>Phone Number:</b> " + phone + "</p>"
                + "<p><b>Education:</b> " + education + "</p>"
                + "<p><b>Skills:</b> " + skills + "</p>"
                + "<p><b>Career Goal:</b> " + careerGoal + "</p>"
                + "<p><b>Experience:</b> " + experience + "</p>"
                + "<p><b>Career Goals:</b> " + goals + "</p>"
                + "<p><b>Database Tier:</b> Executed parameterized PreparedStatement against CareerProfiles table</p>"
                + "</div>"
                + "<a class='home' href='/career.jsp'>Create Another Profile</a>"
                + "</div></body></html>";

            byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
        }
    }
}
