import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Career Connect - Authentication & Identity Gateway Servlet
 * Handles user registration, cryptographically verified login, role-based session management,
 * password recovery, and administrative account oversight.
 * Author: Kalaiyarasan K (9943)
 */
public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private UserAccountDAO dao;

    @Override
    public void init() throws ServletException {
        super.init();
        this.dao = new UserAccountDAO();
    }

    private void applyCors(HttpServletRequest request, HttpServletResponse response) {
        CorsUtil.applyCors(request, response);
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (!CorsUtil.handlePreflight(request, response)) {
            response.setStatus(HttpServletResponse.SC_OK);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCors(request, response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        if (action == null || action.trim().isEmpty()) {
            action = "session";
        }

        HttpSession session = request.getSession(false);
        UserAccount currentUser = session != null ? (UserAccount) session.getAttribute("user") : null;

        if ("session".equalsIgnoreCase(action)) {
            if (currentUser != null) {
                out.println("{\"authenticated\":true,\"user\":" + currentUser.toJson() + "}");
            } else {
                out.println("{\"authenticated\":false,\"user\":null}");
            }
            return;
        }

        if ("users".equalsIgnoreCase(action)) {
            // Restricted to Administrator role only
            if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.println("{\"success\":false,\"error\":\"Administrator privileges required to access user directory.\"}");
                return;
            }

            List<UserAccount> users = dao.getAllUsers();
            StringBuilder sb = new StringBuilder();
            sb.append("{\"success\":true,\"count\":").append(users.size()).append(",\"users\":[");
            for (int i = 0; i < users.size(); i++) {
                sb.append(users.get(i).toJson());
                if (i < users.size() - 1) sb.append(",");
            }
            sb.append("]}");
            out.println(sb.toString());
            return;
        }

        if ("user".equalsIgnoreCase(action)) {
            // Restricted to Administrator role only
            if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.println("{\"success\":false,\"error\":\"Administrator privileges required.\"}");
                return;
            }

            String idParam = request.getParameter("id");
            if (idParam == null || idParam.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.println("{\"success\":false,\"error\":\"User ID is required.\"}");
                return;
            }

            try {
                int id = Integer.parseInt(idParam.trim());
                UserAccount u = dao.getUserById(id);
                if (u != null) {
                    out.println("{\"success\":true,\"user\":" + u.toJson() + "}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.println("{\"success\":false,\"error\":\"User record with ID #" + id + " not found.\"}");
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.println("{\"success\":false,\"error\":\"Invalid user ID format.\"}");
            }
            return;
        }

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        out.println("{\"success\":false,\"error\":\"Invalid GET action specified.\"}");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        applyCors(request, response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        if (action == null || action.trim().isEmpty()) {
            action = "login";
        }

        try {
            if ("register".equalsIgnoreCase(action)) {
                handleRegister(request, response, out);
            } else if ("login".equalsIgnoreCase(action) || "admin-login".equalsIgnoreCase(action)) {
                handleLogin(request, response, out, "admin-login".equalsIgnoreCase(action));
            } else if ("logout".equalsIgnoreCase(action)) {
                handleLogout(request, response, out);
            } else if ("forgot-password".equalsIgnoreCase(action)) {
                handleForgotPassword(request, response, out);
            } else if ("create-user".equalsIgnoreCase(action)) {
                handleAdminCreateUser(request, response, out);
            } else if ("update-user".equalsIgnoreCase(action)) {
                handleAdminUpdateUser(request, response, out);
            } else if ("delete-user".equalsIgnoreCase(action)) {
                handleAdminDeleteUser(request, response, out);
            } else if ("update-status".equalsIgnoreCase(action)) {
                handleUpdateStatus(request, response, out);
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.println("{\"success\":false,\"error\":\"Unknown action: " + escapeJson(action) + "\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleRegister(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws Exception {
        String fullName = request.getParameter("fullName");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String role = request.getParameter("role");
        String organization = request.getParameter("organization");

        if (fullName == null || fullName.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Full name is required.\"}");
            return;
        }

        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"A valid professional email address is required.\"}");
            return;
        }

        if (password == null || password.length() < 8) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Password must be at least 8 characters long.\"}");
            return;
        }

        // Security check: reject attempts to self-provision admin
        if ("admin".equalsIgnoreCase(role)) {
            role = "candidate";
        } else if (!"employer".equalsIgnoreCase(role)) {
            role = "candidate";
        }

        UserAccount newAccount = new UserAccount(fullName.trim(), email.trim(), role, organization);
        try {
            UserAccount saved = dao.registerUser(newAccount, password);

            // Establish authenticated session
            HttpSession session = request.getSession(true);
            session.setAttribute("user", saved);
            session.setMaxInactiveInterval(1800); // 30 minutes

            String redirectPath = "employer".equalsIgnoreCase(saved.getRole()) ? "/employer/dashboard" : "/dashboard";

            response.setStatus(HttpServletResponse.SC_OK);
            out.println("{\"success\":true,\"message\":\"Account registered successfully.\",\"user\":" + 
                        saved.toJson() + ",\"redirect\":\"" + redirectPath + "\"}");
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response, PrintWriter out, boolean requireAdmin)
            throws Exception {
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String expectedRole = request.getParameter("expectedRole");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Email address and password are required.\"}");
            return;
        }

        try {
            UserAccount user = dao.authenticate(email, password);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.println("{\"success\":false,\"error\":\"Invalid email or password.\"}");
                return;
            }

            // Role-based authorization gate
            if (requireAdmin || "admin".equalsIgnoreCase(expectedRole)) {
                if (!"admin".equalsIgnoreCase(user.getRole())) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.println("{\"success\":false,\"error\":\"Access denied: Administrator privileges required for this portal.\"}");
                    return;
                }
            }

            // Establish authenticated session
            HttpSession session = request.getSession(true);
            session.setAttribute("user", user);
            session.setMaxInactiveInterval(1800);

            String redirectPath = "/dashboard";
            if ("admin".equalsIgnoreCase(user.getRole())) {
                redirectPath = "/admin/dashboard";
            } else if ("employer".equalsIgnoreCase(user.getRole())) {
                redirectPath = "/employer/dashboard";
            }

            response.setStatus(HttpServletResponse.SC_OK);
            out.println("{\"success\":true,\"message\":\"Authentication successful.\",\"user\":" + 
                        user.toJson() + ",\"redirect\":\"" + redirectPath + "\"}");

        } catch (SecurityException se) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(se.getMessage()) + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleLogout(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute("user");
            session.invalidate();
        }
        response.setStatus(HttpServletResponse.SC_OK);
        out.println("{\"success\":true,\"message\":\"Session terminated successfully.\",\"redirect\":\"/\"}");
    }

    private void handleForgotPassword(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        String email = request.getParameter("email");
        if (email == null || email.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Please provide your registered email address.\"}");
            return;
        }

        // Generic safe message (does not reveal account existence)
        dao.requestPasswordReset(email);
        response.setStatus(HttpServletResponse.SC_OK);
        out.println("{\"success\":true,\"message\":\"If an account is associated with " + escapeJson(email) + 
                    ", password reset instructions have been dispatched.\"}");
    }

    private void handleAdminCreateUser(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws Exception {
        HttpSession session = request.getSession(false);
        UserAccount currentUser = session != null ? (UserAccount) session.getAttribute("user") : null;

        if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"Administrative access required to create user accounts.\"}");
            return;
        }

        String fullName = request.getParameter("fullName");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String role = request.getParameter("role");
        String organization = request.getParameter("organization");
        String status = request.getParameter("status");

        if (fullName == null || fullName.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Full name is required.\"}");
            return;
        }

        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"A valid email address is required.\"}");
            return;
        }

        if (password == null || password.length() < 8) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Password must be at least 8 characters long.\"}");
            return;
        }

        UserAccount newAccount = new UserAccount(fullName.trim(), email.trim(), role, organization);
        if (status != null && !status.trim().isEmpty()) {
            newAccount.setStatus(status.trim().toLowerCase());
        }

        try {
            UserAccount saved = dao.adminCreateUser(newAccount, password, currentUser.getId());
            response.setStatus(HttpServletResponse.SC_OK);
            out.println("{\"success\":true,\"message\":\"User account created successfully in Microsoft SQL Server.\",\"user\":" + saved.toJson() + "}");
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (SecurityException se) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(se.getMessage()) + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleAdminUpdateUser(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws Exception {
        HttpSession session = request.getSession(false);
        UserAccount currentUser = session != null ? (UserAccount) session.getAttribute("user") : null;

        if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"Administrative access required to modify user accounts.\"}");
            return;
        }

        String idParam = request.getParameter("id");
        String fullName = request.getParameter("fullName");
        String email = request.getParameter("email");
        String role = request.getParameter("role");
        String organization = request.getParameter("organization");
        String status = request.getParameter("status");

        if (idParam == null || idParam.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"User ID is required.\"}");
            return;
        }

        try {
            int id = Integer.parseInt(idParam.trim());
            UserAccount updated = dao.adminUpdateUser(id, fullName, email, role, organization, status, currentUser.getId());
            response.setStatus(HttpServletResponse.SC_OK);
            out.println("{\"success\":true,\"message\":\"User account updated successfully in Microsoft SQL Server.\",\"user\":" + updated.toJson() + "}");
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Invalid user ID format.\"}");
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (SecurityException se) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(se.getMessage()) + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleAdminDeleteUser(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws Exception {
        HttpSession session = request.getSession(false);
        UserAccount currentUser = session != null ? (UserAccount) session.getAttribute("user") : null;

        if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"Administrative access required to delete accounts.\"}");
            return;
        }

        String idParam = request.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"User ID is required.\"}");
            return;
        }

        try {
            int id = Integer.parseInt(idParam.trim());
            boolean ok = dao.adminDeleteUser(id, currentUser.getId());
            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.println("{\"success\":true,\"message\":\"User record permanently deleted from Microsoft SQL Server.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.println("{\"success\":false,\"error\":\"User record with ID #" + id + " was not found.\"}");
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Invalid user ID format.\"}");
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (SecurityException se) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(se.getMessage()) + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleUpdateStatus(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        HttpSession session = request.getSession(false);
        UserAccount currentUser = session != null ? (UserAccount) session.getAttribute("user") : null;

        if (currentUser == null || !"admin".equalsIgnoreCase(currentUser.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"Administrative access required.\"}");
            return;
        }

        String idParam = request.getParameter("id");
        String status = request.getParameter("status");

        if (idParam == null || status == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"User ID and target status are required.\"}");
            return;
        }

        try {
            int id = Integer.parseInt(idParam.trim());
            boolean ok = dao.adminUpdateStatus(id, status.trim().toLowerCase(), currentUser.getId());
            if (ok) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.println("{\"success\":true,\"message\":\"User status updated successfully in Microsoft SQL Server.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.println("{\"success\":false,\"error\":\"User record not found.\"}");
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"Invalid user ID format.\"}");
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (SecurityException se) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.println("{\"success\":false,\"error\":\"" + escapeJson(se.getMessage()) + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.println("{\"success\":false,\"error\":\"Server error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
