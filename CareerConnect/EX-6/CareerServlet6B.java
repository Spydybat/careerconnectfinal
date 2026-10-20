import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

/**
 * Exercise 6(B) - Three Tier Application Using JSP and Database
 * Controller Servlet: CareerServlet
 * Author: Kalaiyarasan K (9943)
 */
public class CareerServlet6B extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");

        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String education = request.getParameter("education");
        String skills = request.getParameter("skills");
        String careerGoal = request.getParameter("careerGoal");
        String experience = request.getParameter("experience");
        String goals = request.getParameter("goals");

        CareerProfile profile = new CareerProfile(name, email, phone, education, skills, careerGoal, experience, goals);
        CareerProfileDAO dao = new CareerProfileDAO();
        boolean success = dao.saveProfile(profile);

        if (success) {
            request.setAttribute("name", name);
            request.setAttribute("email", email);
            request.setAttribute("phone", phone);
            request.setAttribute("education", education);
            request.setAttribute("skills", skills);
            request.setAttribute("careerGoal", careerGoal);
            request.setAttribute("experience", experience);
            request.setAttribute("goals", goals);
            request.setAttribute("profile", profile);

            RequestDispatcher rd = request.getRequestDispatcher("/profile-result.jsp");
            rd.forward(request, response);
        } else {
            response.setContentType("text/html;charset=UTF-8");
            PrintWriter out = response.getWriter();
            out.println("<!DOCTYPE html><html><head><title>Career Connect - Error</title></head>");
            out.println("<body style='font-family:Arial;text-align:center;padding:50px;'>");
            out.println("<h2 style='color:#e53e3e;'>Career Profile Creation Failed</h2>");
            out.println("<p>Database insertion failed. Please verify that the database server is running and reachable.</p>");
            out.println("<a href='profile.jsp' style='display:inline-block;margin-top:20px;padding:10px 20px;background:#238636;color:white;text-decoration:none;border-radius:6px;'>Return to Form</a>");
            out.println("</body></html>");
        }
    }
}
