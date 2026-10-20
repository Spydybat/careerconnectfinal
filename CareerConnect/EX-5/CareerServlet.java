import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Exercise 5(A) & 6(B) - CareerServlet
 * Handles candidate profile creation, real-time validation,
 * database persistence via CareerProfileDAO, and profile retrieval.
 * Supports both JSON API requests (for modern SPA frontends)
 * and traditional HTML form submissions.
 */
public class CareerServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private void applyCors(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCors(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCors(response);

        CareerProfileDAO dao = new CareerProfileDAO();
        String idParam = request.getParameter("id");
        String emailParam = request.getParameter("email");
        String latestParam = request.getParameter("latest");

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int id = Integer.parseInt(idParam.trim());
                CareerProfile profile = dao.getProfileById(id);
                if (profile != null) {
                    out.println(buildProfileJson(profile, true, "Profile retrieved successfully"));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.println("{\"success\":false,\"error\":\"Profile with ID " + id + " not found\"}");
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.println("{\"success\":false,\"error\":\"Invalid ID format\"}");
            }
            return;
        }

        if (emailParam != null && !emailParam.trim().isEmpty()) {
            CareerProfile profile = dao.getProfileByEmail(emailParam.trim());
            if (profile != null) {
                out.println(buildProfileJson(profile, true, "Profile retrieved successfully"));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.println("{\"success\":false,\"error\":\"Profile with email " + escapeJson(emailParam) + " not found\"}");
            }
            return;
        }

        if ("true".equalsIgnoreCase(latestParam)) {
            CareerProfile profile = dao.getLatestProfile();
            if (profile != null) {
                out.println(buildProfileJson(profile, true, "Latest profile retrieved successfully"));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.println("{\"success\":false,\"error\":\"No profiles found in database\"}");
            }
            return;
        }

        // Return all profiles as JSON array
        List<CareerProfile> list = dao.getAllProfiles();
        StringBuilder sb = new StringBuilder();
        sb.append("{\"success\":true,\"count\":").append(list.size()).append(",\"profiles\":[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(buildProfileJsonBody(list.get(i)));
        }
        sb.append("]}");
        out.println(sb.toString());
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCors(response);
        request.setCharacterEncoding("UTF-8");

        String contentType = request.getContentType();
        String acceptHeader = request.getHeader("Accept");
        String formatParam = request.getParameter("format");

        boolean wantsJson = "json".equalsIgnoreCase(formatParam)
                || (acceptHeader != null && acceptHeader.contains("application/json"))
                || (contentType != null && contentType.contains("application/json"));

        String name = null;
        String email = null;
        String phone = null;
        String education = null;
        String skills = null;
        String careerGoal = null;
        String experience = null;
        String goals = null;

        if (contentType != null && contentType.contains("application/json")) {
            // Parse JSON body
            StringBuilder jsonBuffer = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    jsonBuffer.append(line);
                }
            }
            Map<String, String> jsonMap = parseJsonSimple(jsonBuffer.toString());
            name = jsonMap.get("fullName");
            if (name == null) name = jsonMap.get("name");
            email = jsonMap.get("email");
            phone = jsonMap.get("phone");
            education = jsonMap.get("education");
            skills = jsonMap.get("skills");
            careerGoal = jsonMap.get("careerGoal");
            experience = jsonMap.get("experience");
            goals = jsonMap.get("careerGoalsSummary");
            if (goals == null) goals = jsonMap.get("goals");
        } else {
            // Form URL-encoded parameters
            name = request.getParameter("fullName");
            if (name == null || name.isEmpty()) name = request.getParameter("name");
            email = request.getParameter("email");
            phone = request.getParameter("phone");
            education = request.getParameter("education");
            skills = request.getParameter("skills");
            careerGoal = request.getParameter("careerGoal");
            experience = request.getParameter("experience");
            goals = request.getParameter("careerGoalsSummary");
            if (goals == null) goals = request.getParameter("goals");
        }

        // Validate required fields
        List<String> validationErrors = new ArrayList<>();
        if (name == null || name.trim().isEmpty()) {
            validationErrors.add("Full Name is required.");
        }
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            validationErrors.add("Valid email address is required.");
        }
        if (phone == null || phone.trim().isEmpty() || !phone.trim().matches("^[0-9]{10}$")) {
            validationErrors.add("Phone number must be exactly 10 digits.");
        }
        if (education == null || education.trim().isEmpty()) {
            validationErrors.add("Education qualification is required.");
        }
        if (skills == null || skills.trim().isEmpty()) {
            validationErrors.add("At least one skill is required.");
        }
        if (careerGoal == null || careerGoal.trim().isEmpty()) {
            validationErrors.add("Career goal / target role is required.");
        }
        if (experience == null || experience.trim().isEmpty()) {
            validationErrors.add("Experience tier is required.");
        }

        if (goals == null) goals = "";

        if (!validationErrors.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            if (wantsJson) {
                response.setContentType("application/json;charset=UTF-8");
                PrintWriter out = response.getWriter();
                out.println("{\"success\":false,\"error\":\"Validation failed: " + escapeJson(String.join("; ", validationErrors)) + "\"}");
            } else {
                renderHtmlError(response, "Validation Error", String.join("<br>", validationErrors));
            }
            return;
        }

        // Create CareerProfile and persist to Database via CareerProfileDAO
        CareerProfile profile = new CareerProfile(
            name.trim(),
            email.trim(),
            phone.trim(),
            education.trim(),
            skills.trim(),
            careerGoal.trim(),
            experience.trim(),
            goals.trim()
        );

        CareerProfileDAO dao = new CareerProfileDAO();
        boolean saved = dao.saveProfile(profile);

        if (!saved) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            if (wantsJson) {
                response.setContentType("application/json;charset=UTF-8");
                PrintWriter out = response.getWriter();
                out.println("{\"success\":false,\"error\":\"Database persistence failure: Unable to insert record into CareerProfiles table.\"}");
            } else {
                renderHtmlError(response, "Database Persistence Error", "Could not persist profile into the database. Please verify SQL Server connection.");
            }
            return;
        }

        // Success: Return confirmed database record
        if (wantsJson) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json;charset=UTF-8");
            PrintWriter out = response.getWriter();
            out.println(buildProfileJson(profile, true, "Profile successfully saved to database."));
        } else {
            renderHtmlSuccess(response, profile);
        }
    }

    private void renderHtmlSuccess(HttpServletResponse response, CareerProfile profile) throws IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        out.println("<!DOCTYPE html><html><head><title>Career Connect Profile Confirmation</title>");
        out.println("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<style>");
        out.println("body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b;}");
        out.println(".header{background:#0a66c2;color:white;text-align:center;padding:24px;border-radius:12px 12px 0 0;max-width:560px;margin:20px auto 0;}");
        out.println(".container{max-width:560px;margin:0 auto 40px;background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);}");
        out.println("h1{margin:0;font-size:24px;}h2{color:#0a66c2;font-size:20px;margin-top:0;}");
        out.println(".badge{background:#e0f2fe;color:#0284c7;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;display:inline-block;margin-bottom:15px;}");
        out.println("p{font-size:14px;padding:8px 0;border-bottom:1px solid #f1f5f9;margin:0;}b{color:#0a66c2;}");
        out.println(".btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#0a66c2;color:white;text-decoration:none;border-radius:24px;font-weight:bold;font-size:14px;}");
        out.println("</style></head><body>");
        out.println("<div class='header'><h1>CAREER CONNECT</h1><p style='margin:4px 0 0;opacity:0.9;'>Professional Profile Gateway</p></div>");
        out.println("<div class='container'>");
        out.println("<h2>Profile Created & Persisted Successfully!</h2>");
        out.println("<div class='badge'>Database Record ID: #" + profile.getId() + "</div>");
        out.println("<p><b>Full Name:</b> " + escapeHtml(profile.getName()) + "</p>");
        out.println("<p><b>Email Address:</b> " + escapeHtml(profile.getEmail()) + "</p>");
        out.println("<p><b>Phone Number:</b> " + escapeHtml(profile.getPhone()) + "</p>");
        out.println("<p><b>Education:</b> " + escapeHtml(profile.getEducation()) + "</p>");
        out.println("<p><b>Skills:</b> " + escapeHtml(profile.getSkills()) + "</p>");
        out.println("<p><b>Career Goal:</b> " + escapeHtml(profile.getCareerGoal()) + "</p>");
        out.println("<p><b>Experience:</b> " + escapeHtml(profile.getExperience()) + "</p>");
        out.println("<p><b>Summary:</b> " + escapeHtml(profile.getGoals()) + "</p>");
        out.println("<div style='text-align:center;'><a href='/index-5a.html' class='btn'>Back to Form</a></div>");
        out.println("</div></body></html>");
    }

    private void renderHtmlError(HttpServletResponse response, String title, String message) throws IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<!DOCTYPE html><html><head><title>Career Connect - Error</title>");
        out.println("<style>body{font-family:Arial,sans-serif;background:#fff5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;}</style></head>");
        out.println("<body><div style='background:white;padding:36px;border-radius:12px;border:1px solid #fed7d7;max-width:480px;text-align:center;'>");
        out.println("<h2 style='color:#e53e3e;margin-top:0;'>" + escapeHtml(title) + "</h2>");
        out.println("<p style='color:#4a5568;line-height:1.6;'>" + message + "</p>");
        out.println("<a href='/index-5a.html' style='display:inline-block;margin-top:20px;padding:10px 20px;background:#e53e3e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;'>Return to Form</a>");
        out.println("</div></body></html>");
    }

    private String buildProfileJson(CareerProfile p, boolean success, String message) {
        return "{\"success\":" + success +
               ",\"id\":" + p.getId() +
               ",\"message\":\"" + escapeJson(message) + "\"" +
               ",\"profile\":" + buildProfileJsonBody(p) + "}";
    }

    private String buildProfileJsonBody(CareerProfile p) {
        return "{\"id\":" + p.getId() +
               ",\"name\":\"" + escapeJson(p.getName()) + "\"" +
               ",\"email\":\"" + escapeJson(p.getEmail()) + "\"" +
               ",\"phone\":\"" + escapeJson(p.getPhone()) + "\"" +
               ",\"education\":\"" + escapeJson(p.getEducation()) + "\"" +
               ",\"skills\":\"" + escapeJson(p.getSkills()) + "\"" +
               ",\"careerGoal\":\"" + escapeJson(p.getCareerGoal()) + "\"" +
               ",\"experience\":\"" + escapeJson(p.getExperience()) + "\"" +
               ",\"goals\":\"" + escapeJson(p.getGoals()) + "\"}";
    }

    private Map<String, String> parseJsonSimple(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;
        String clean = json.trim();
        if (clean.startsWith("{")) clean = clean.substring(1);
        if (clean.endsWith("}")) clean = clean.substring(0, clean.length() - 1);
        
        // Simple regex parser for JSON key-value string pairs
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");
        java.util.regex.Matcher m = p.matcher(clean);
        while (m.find()) {
            map.put(m.group(1), m.group(2));
        }
        return map;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
    }
}
