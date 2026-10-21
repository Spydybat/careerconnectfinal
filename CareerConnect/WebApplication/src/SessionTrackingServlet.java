import java.io.*;
import java.util.Date;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Exercise 5(B) - Session Tracking Using Servlets
 * Career Connect AI Career Intelligence Platform
 * Author: Kalaiyarasan K (9943)
 */
public class SessionTrackingServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (!CorsUtil.handlePreflight(request, response)) {
            response.setStatus(HttpServletResponse.SC_OK);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        CorsUtil.applyCors(request, response);
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String careerGoal = request.getParameter("careerGoal");

        // Obtain existing session or create a new session if none exists
        HttpSession session = request.getSession(true);
        session.setAttribute("name", name);
        session.setAttribute("email", email);
        session.setAttribute("careerGoal", careerGoal);

        String sessionId = session.getId();
        long creationTime = session.getCreationTime();
        long lastAccessedTime = session.getLastAccessedTime();
        int maxInactiveInterval = session.getMaxInactiveInterval();

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head>");
        out.println("<title>Career Connect Session</title>");
        out.println("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
        out.println("<style>");
        out.println("body{font-family:Arial,sans-serif;background:#f2f2f2;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;}");
        out.println(".container{background:white;padding:40px;border-radius:18px;box-shadow:0 5px 25px #cccccc;max-width:520px;width:100%;box-sizing:border-box;}");
        out.println("h1{color:#238636;text-align:center;margin-top:0;font-size:28px;}");
        out.println("h2{color:#333;font-size:20px;margin-top:20px;}");
        out.println("p{font-size:16px;line-height:1.8;margin:8px 0;}");
        out.println("b{color:#238636;}");
        out.println(".session{background:#eaf7ed;padding:18px;border-radius:10px;margin-top:20px;border-left:4px solid #238636;}");
        out.println(".session p{font-size:14px;line-height:1.6;margin:6px 0;word-break:break-all;}");
        out.println(".button{display:inline-block;margin-top:20px;padding:12px 20px;background:#238636;color:white;text-decoration:none;border-radius:8px;font-weight:bold;text-align:center;}");
        out.println(".button:hover{background:#176b2c;}");
        out.println("</style>");
        out.println("</head>");
        out.println("<body>");
        out.println("<div class='container'>");
        out.println("<h1>CAREER CONNECT</h1>");
        out.println("<h2>Career Session Started Successfully</h2>");
        out.println("<p><b>Name:</b> " + (name != null ? name : "") + "</p>");
        out.println("<p><b>Email:</b> " + (email != null ? email : "") + "</p>");
        out.println("<p><b>Career Goal:</b> " + (careerGoal != null ? careerGoal : "") + "</p>");
        
        out.println("<div class='session'>");
        out.println("<p><b>Session ID:</b> " + sessionId + "</p>");
        out.println("<p><b>Session Created:</b> " + new Date(creationTime) + "</p>");
        out.println("<p><b>Last Accessed:</b> " + new Date(lastAccessedTime) + "</p>");
        out.println("<p><b>Max Inactive Interval:</b> " + maxInactiveInterval + " seconds</p>");
        out.println("<p><b>Is New Session:</b> " + session.isNew() + "</p>");
        out.println("<p style='margin-top:10px;color:#176b2c;font-weight:600;'>Your career session is successfully maintained using HttpSession.</p>");
        out.println("</div>");
        
        out.println("<div style='text-align:center;'>");
        out.println("<a href='index-5b.html' class='button'>Start Another Session</a>");
        out.println("</div>");
        out.println("</div>");
        out.println("</body>");
        out.println("</html>");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }
}
