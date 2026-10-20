import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Exercise 5(A) - Invoke Servlets from HTML Forms
 * Career Connect AI Career Intelligence Platform
 * Author: Kalaiyarasan K (9943)
 */
public class CareerServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String education = request.getParameter("education");
        String skills = request.getParameter("skills");
        String careerGoal = request.getParameter("careerGoal");
        String experience = request.getParameter("experience");

        // Basic XSS defense for safe rendering in HTML output
        name = escapeHtml(name);
        email = escapeHtml(email);
        phone = escapeHtml(phone);
        education = escapeHtml(education);
        skills = escapeHtml(skills);
        careerGoal = escapeHtml(careerGoal);
        experience = escapeHtml(experience);

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head>");
        out.println("<title>Career Connect Profile</title>");
        out.println("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<style>");
        out.println("body{font-family:Arial,sans-serif;background:#eaf6ff;margin:0;padding:20px;}");
        out.println(".header{background:#238636;color:white;text-align:center;padding:25px;border-radius:12px 12px 0 0;max-width:600px;margin:20px auto 0;}");
        out.println(".container{max-width:600px;margin:0 auto 40px;background:white;padding:35px;border-radius:0 0 12px 12px;box-shadow:0 5px 20px rgba(0,0,0,0.15);box-sizing:border-box;}");
        out.println("h1{margin:0;font-size:26px;}");
        out.println("h2{color:#238636;text-align:center;font-size:22px;margin-top:10px;}");
        out.println("p{font-size:16px;padding:10px 0;border-bottom:1px solid #eee;margin:0;}");
        out.println("b{color:#238636;}");
        out.println(".success{text-align:center;color:#238636;font-weight:bold;font-size:18px;border-bottom:none;padding:5px 0 20px;}");
        out.println(".section-title{color:#1a202c;border-bottom:2px solid #238636;padding-bottom:5px;margin-top:25px;font-size:18px;font-weight:bold;}");
        out.println(".back-link{display:inline-block;margin-top:25px;padding:12px 20px;background:#238636;color:white;text-decoration:none;border-radius:6px;font-weight:bold;text-align:center;}");
        out.println(".back-link:hover{background:#176b2c;}");
        out.println("</style>");
        out.println("</head>");
        out.println("<body>");
        out.println("<div class='header'>");
        out.println("<h1>CAREER CONNECT</h1>");
        out.println("<p style='margin:5px 0 0;color:#e6fffa;border:none;'>AI Career Intelligence Platform</p>");
        out.println("</div>");
        out.println("<div class='container'>");
        out.println("<h2>Career Profile Created Successfully!</h2>");
        out.println("<p class='success'>Welcome to Career Connect</p>");
        
        out.println("<div class='section-title'>Profile Details</div>");
        out.println("<p><b>Full Name:</b> " + name + "</p>");
        out.println("<p><b>Email Address:</b> " + email + "</p>");
        out.println("<p><b>Phone Number:</b> " + phone + "</p>");
        out.println("<p><b>Education:</b> " + education + "</p>");
        out.println("<p><b>Skills:</b> " + skills + "</p>");
        out.println("<p><b>Career Goal:</b> " + careerGoal + "</p>");
        out.println("<p><b>Experience:</b> " + experience + "</p>");
        
        out.println("<div class='section-title'>Career Intelligence</div>");
        out.println("<p><b>Profile Status:</b> Active</p>");
        out.println("<p><b>Target Career:</b> " + careerGoal + "</p>");
        out.println("<p><b>Skill Analysis:</b> Skills successfully recorded and mapped to role profile</p>");
        
        out.println("<div style='text-align:center;'>");
        out.println("<a href='index-5a.html' class='back-link'>Register Another Profile</a>");
        out.println("</div>");
        out.println("</div>");
        out.println("</body>");
        out.println("</html>");
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
