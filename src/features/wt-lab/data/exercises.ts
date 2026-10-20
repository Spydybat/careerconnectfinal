import type { WTExercise } from "../types";

export const WT_EXERCISES: WTExercise[] = [
  {
    id: "ex-1",
    number: "Module 01",
    title: "Interactive Career Ecosystem Explorer",
    shortTitle: "Career Ecosystem Map",
    description:
      "Explore Career Connect domains, candidate profiles, verified skills, and hiring analytics through an interactive architectural ecosystem map.",
    technologies: ["HTML", "Interactive Map"],
    status: "Tested",
    route: "/wt-lab/exercise-1",
    files: [
      {
        name: "index.html",
        language: "html",
        description: "HTML structure embedding image map with 4 hotspots and content sections.",
        code: `<!DOCTYPE html>
<html>
<head>
    <title>Career Connect - Image Map</title>
</head>
<body bgcolor="#d6d6d6" text="#111111">
<center>
    <h1>CAREER CONNECT</h1>
    <p>Connecting people, skills, opportunities and career intelligence through one global platform.</p>
    <br>
    <img src="career-connect.png" width="950" height="650" alt="Career Connect" usemap="#careerconnect">
    <map name="careerconnect">
        <area shape="rect" coords="60,120,300,300" href="#profile" alt="Profile">
        <area shape="rect" coords="600,120,840,300" href="#jobs" alt="Jobs">
        <area shape="rect" coords="60,330,300,510" href="#skills" alt="Skills">
        <area shape="rect" coords="600,330,840,510" href="#analytics" alt="Analytics">
    </map>
    <p>Click the hotspots to explore Career Connect.</p>
</center>
<br>
<hr color="#38a852">
<a name="profile"></a>
<h2>PROFILE</h2>
<p>Career Connect brings education, experience, projects, skills, certifications and career goals into one professional profile.</p>
<!-- Full sections for Skills, Jobs, and Analytics -->
</body>
</html>`,
      },
    ],
  },
  {
    id: "ex-2",
    number: "Module 02",
    title: "Multi-Tier Design System & Theme Showcase",
    shortTitle: "Theme & Design System",
    description:
      "Interactive presentation showcasing inline, component-scoped, and global design stylesheets applied to Career Connect modules.",
    technologies: ["HTML", "CSS", "Design Tokens"],
    status: "Tested",
    route: "/wt-lab/exercise-2",
    files: [
      {
        name: "index.html",
        language: "html",
        description:
          "HTML web page with external stylesheet link and internal inline styling demonstrations.",
        code: `<!DOCTYPE html> 
<html> 
<head> 
    <title>Career Connect - Exercise 2</title> 
    <link rel="stylesheet" href="style.css"> 
</head> 
<body> 
<section class="hero"> 
    <div class="top-label">AI CAREER INTELLIGENCE PLATFORM</div> 
    <h1 class="hero-title">CAREER CONNECT</h1> 
    <p class="hero-subtitle">Connecting people, skills, opportunities and career intelligence through one global platform.</p> 
    <div class="hero-line"></div> 
</section> 
<!-- Profile, Skills, Jobs, Analytics content cards -->
</body> 
</html>`,
      },
      {
        name: "style.css",
        language: "css",
        description:
          "External stylesheet featuring gradients, responsive media queries, and typography.",
        code: `* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 20% 10%, #1b99f3, #83ade8 35%, #1e74e6); color: black; font-family: Arial, sans-serif; }
.top-label { display: inline-block; padding: 8px 18px; border: 1px solid #31536a; border-radius: 30px; font-size: 11px; letter-spacing: 2px; background: rgba(255, 255, 255, 0.7); }
.hero-title { color: black; font-size: 48px; letter-spacing: 5px; text-shadow: 0 0 25px rgba(66, 216, 121, 0.35); }
.content-section { width: 90%; max-width: 1150px; margin: 100px auto; padding: 45px; background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)); border: 1px solid #263f52; border-radius: 20px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45); }
table { width: 90%; min-width: 600px; margin: 20px auto; border-collapse: collapse; background: #ffffff; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45); }
th { padding: 15px; background: #173047; color: #42d879; }
td { padding: 14px; color: black; border: 1px solid #263d51; }`,
      },
    ],
  },
  {
    id: "ex-3",
    number: "Module 03",
    title: "Candidate Profile Registration Portal",
    shortTitle: "Profile Registration",
    description:
      "Interactive candidate profile registration form featuring real-time client-side input constraints: name validation, email formatting, 10-digit phone verification, and dynamic error clearance.",
    technologies: ["HTML", "CSS", "JavaScript", "Client Validation"],
    status: "Tested",
    route: "/wt-lab/exercise-3",
    files: [
      {
        name: "index.html",
        language: "html",
        description: "Registration form layout with validation event hooks.",
        code: `<form id="careerForm" onsubmit="return validateForm()">
    <input type="text" id="name" oninput="this.value = this.value.replace(/[^A-Za-z ]/g, '')">
    <span id="nameError" class="error"></span>
    <input type="email" id="email">
    <span id="emailError" class="error"></span>
    <input type="text" id="phone" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
    <span id="phoneError" class="error"></span>
    <!-- Select boxes for education, careerGoal, experience, goals -->
</form>`,
      },
      {
        name: "script.js",
        language: "javascript",
        description: "Client-side validation function checking all required fields and formats.",
        code: `function validateForm() {
    let valid = true;
    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let phone = document.getElementById("phone").value.trim();
    // Clear previous errors
    // Validate name, email, phone (10 digits), education, skills, careerGoal, experience, goals
    if (valid) {
        document.getElementById("successMessage").innerHTML = "Career Profile Created Successfully!";
    }
    return false;
}`,
      },
    ],
  },
  {
    id: "ex-4",
    number: "Module 04",
    title: "Enterprise Cloud & Server Infrastructure",
    shortTitle: "Server Infrastructure",
    description:
      "Production deployment architecture, application server runtime health, port configuration, and container service verification guide.",
    technologies: ["Tomcat", "Server Infrastructure"],
    status: "Tested",
    route: "/wt-lab/exercise-4",
    files: [
      {
        name: "TOMCAT_SETUP_GUIDE.md",
        language: "markdown",
        description:
          "Complete procedure documentation with troubleshooting and configuration details.",
        code: `# Apache Tomcat Web Server Installation Guide
1. Visit the Apache Tomcat Website & download Windows Installer (.exe)
2. Launch the Installer Setup Wizard
3. Accept the License Agreement
4. Select Required Components
5. Configure HTTP Connector Port (8080) & Admin Credentials
6. Specify JDK Location
7. Complete Installation & Start Server
8. Verify Localhost: http://localhost:8080/
9. Access Tomcat Manager Application: http://localhost:8080/manager/html`,
      },
    ],
  },
  {
    id: "ex-5a",
    number: "Module 05(A)",
    title: "Career Profile Submission Service",
    shortTitle: "Profile Dispatcher",
    description:
      "High-throughput profile ingestion pipeline processing form submissions to server-side business logic and confirmation receipt generation.",
    technologies: ["HTML", "Servlet", "HTTP Dispatch"],
    status: "Tested",
    route: "/wt-lab/exercise-5a",
    files: [
      {
        name: "CareerServlet.java",
        language: "java",
        description: "HttpServlet processing POST request parameters and writing HTML response.",
        code: `import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class CareerServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String education = request.getParameter("education");
        String skills = request.getParameter("skills");
        String careerGoal = request.getParameter("careerGoal");
        String experience = request.getParameter("experience");

        out.println("<h2>Career Profile Created Successfully!</h2>");
        out.println("<p><b>Full Name:</b> " + name + "</p>");
        out.println("<p><b>Career Goal:</b> " + careerGoal + "</p>");
    }
}`,
      },
      {
        name: "web.xml",
        language: "xml",
        description: "Servlet mapping descriptor linking /CareerServlet to CareerServlet class.",
        code: `<web-app>
    <servlet>
        <servlet-name>CareerServlet</servlet-name>
        <servlet-class>CareerServlet</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>CareerServlet</servlet-name>
        <url-pattern>/CareerServlet</url-pattern>
    </servlet-mapping>
</web-app>`,
      },
    ],
  },
  {
    id: "ex-5b",
    number: "Module 05(B)",
    title: "Candidate Session & State Manager",
    shortTitle: "Session Management",
    description:
      "Stateful candidate session management tracking user attributes across requests, session lifetimes, activity metrics, and secure logout lifecycles.",
    technologies: ["Servlet", "Session Tracking", "State Management"],
    status: "Tested",
    route: "/wt-lab/exercise-5b",
    files: [
      {
        name: "SessionTrackingServlet.java",
        language: "java",
        description:
          "HttpServlet managing HttpSession creation, attribute binding, and session ID inspection.",
        code: `import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class SessionTrackingServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String careerGoal = request.getParameter("careerGoal");

        HttpSession session = request.getSession();
        session.setAttribute("name", name);
        session.setAttribute("email", email);
        session.setAttribute("careerGoal", careerGoal);

        out.println("<h2>Career Session Started Successfully</h2>");
        out.println("<p><b>Name:</b> " + name + "</p>");
        out.println("<p><b>Session ID:</b> " + session.getId() + "</p>");
    }
}`,
      },
      {
        name: "web.xml",
        language: "xml",
        description: "Servlet mapping descriptor for SessionTrackingServlet.",
        code: `<web-app>
    <servlet>
        <servlet-name>SessionTrackingServlet</servlet-name>
        <servlet-class>SessionTrackingServlet</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>SessionTrackingServlet</servlet-name>
        <url-pattern>/SessionTrackingServlet</url-pattern>
    </servlet-mapping>
</web-app>`,
      },
    ],
  },
  {
    id: "ex-6a",
    number: "Module 06(A)",
    title: "Career Profile Database Directory",
    shortTitle: "Database Directory",
    description:
      "Three-tier transactional database persistence connecting presentation interfaces directly with JDBC data layers and structured record indexing.",
    technologies: ["JSP", "JDBC", "SQL Database"],
    status: "Tested",
    route: "/wt-lab/exercise-6a",
    sqlQueries: [
      `USE CC_PROD_DB;

CREATE TABLE CareerProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    education VARCHAR(100) NOT NULL,
    skills VARCHAR(500) NOT NULL,
    careerGoal VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    goals VARCHAR(500) NOT NULL
);

SELECT * FROM CareerProfiles;`,
    ],
    files: [
      {
        name: "career.jsp",
        language: "html",
        description: "JSP presentation page collecting profile information.",
        code: `<%@ page contentType="text/html;charset=UTF-8" %>
<form action="career-result.jsp" method="post">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    <input type="text" name="phone" maxlength="10" required>
    <!-- Education, skills, careerGoal, experience, goals -->
    <input type="submit" value="Create Career Profile">
</form>`,
      },
      {
        name: "career-result.jsp",
        language: "java",
        description: "JSP result page executing JDBC PreparedStatement against SQL Server.",
        code: `<%@ page import="java.sql.*" %>
<%@ page contentType="text/html;charset=UTF-8" %>
<%
String name = request.getParameter("name");
String email = request.getParameter("email");
String phone = request.getParameter("phone");
String education = request.getParameter("education");
String skills = request.getParameter("skills");
String careerGoal = request.getParameter("careerGoal");
String experience = request.getParameter("experience");
String goals = request.getParameter("goals");

String url = "jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9596;encrypt=true;trustServerCertificate=true";
String username = "MZ", password = "mzcet@1234";

Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
Connection con = DriverManager.getConnection(url, username, password);

PreparedStatement ps = con.prepareStatement("INSERT INTO CareerProfiles(name,email,phone,education,skills,careerGoal,experience,goals) VALUES(?,?,?,?,?,?,?,?)");
ps.setString(1, name);
ps.setString(2, email);
ps.setString(3, phone);
ps.setString(4, education);
ps.setString(5, skills);
ps.setString(6, careerGoal);
ps.setString(7, experience);
ps.setString(8, goals);
ps.executeUpdate();
ps.close();
con.close();
%>`,
      },
    ],
  },
  {
    id: "ex-6b",
    number: "Module 06(B)",
    title: "Enterprise Candidate Management System",
    shortTitle: "Enterprise MVC",
    description:
      "Enterprise Model-View-Controller architecture orchestrating JavaBean domain models, DAO persistence, and dynamic presentation views.",
    technologies: ["JSP", "Servlet", "JDBC", "MVC Architecture"],
    status: "Tested",
    route: "/wt-lab/exercise-6b",
    files: [
      {
        name: "CareerProfile.java",
        language: "java",
        description: "Model layer: JavaBean encapsulating profile properties and getters/setters.",
        code: `public class CareerProfile {
    private String name, email, phone, education, skills, careerGoal, experience, goals;

    public CareerProfile(String name, String email, String phone, String education, 
                         String skills, String careerGoal, String experience, String goals) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.education = education;
        this.skills = skills;
        this.careerGoal = careerGoal;
        this.experience = experience;
        this.goals = goals;
    }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getEducation() { return education; }
    public String getSkills() { return skills; }
    public String getCareerGoal() { return careerGoal; }
    public String getExperience() { return experience; }
    public String getGoals() { return goals; }
}`,
      },
      {
        name: "CareerProfileDAO.java",
        language: "java",
        description: "Data Access Layer: PreparedStatement database operations.",
        code: `import java.sql.*;

public class CareerProfileDAO {
    private String url = "jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9596;encrypt=true;trustServerCertificate=true";
    private String username = "MZ", password = "mzcet@1234";

    public boolean saveProfile(CareerProfile p) {
        String sql = "INSERT INTO CareerProfiles(name,email,phone,education,skills,careerGoal,experience,goals) VALUES(?,?,?,?,?,?,?,?)";
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            Connection con = DriverManager.getConnection(url, username, password);
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, p.getName());
            ps.setString(2, p.getEmail());
            ps.setString(3, p.getPhone());
            ps.setString(4, p.getEducation());
            ps.setString(5, p.getSkills());
            ps.setString(6, p.getCareerGoal());
            ps.setString(7, p.getExperience());
            ps.setString(8, p.getGoals());
            int result = ps.executeUpdate();
            ps.close();
            con.close();
            return result > 0;
        } catch(Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}`,
      },
      {
        name: "CareerServlet.java",
        language: "java",
        description:
          "Controller: instantiates Model and DAO, forwards request to profile-result.jsp.",
        code: `import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class CareerServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        CareerProfile profile = new CareerProfile(
            request.getParameter("name"),
            request.getParameter("email"),
            request.getParameter("phone"),
            request.getParameter("education"),
            request.getParameter("skills"),
            request.getParameter("careerGoal"),
            request.getParameter("experience"),
            request.getParameter("goals")
        );
        CareerProfileDAO dao = new CareerProfileDAO();
        boolean success = dao.saveProfile(profile);
        if (success) {
            request.setAttribute("name", profile.getName());
            RequestDispatcher rd = request.getRequestDispatcher("/profile-result.jsp");
            rd.forward(request, response);
        }
    }
}`,
      },
    ],
  },
  {
    id: "ex-7",
    number: "Module 07",
    title: "Standardized XML Resume Exchange & XSL Service",
    shortTitle: "XML Resume Exchange",
    description:
      "W3C Schema-validated XML candidate profile exchange transformed into modern responsive presentations via XSLT.",
    technologies: ["XML", "XSD Schema", "XSLT Transform"],
    status: "Tested",
    route: "/wt-lab/exercise-7",
    files: [
      {
        name: "career.xml",
        language: "xml",
        description: "XML data repository containing 8 career profile elements.",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="career.xsl"?>
<careerConnect>
    <profile>
        <profileId>1001</profileId>
        <name>Kalaiyarasan</name>
        <email>kalaiyarasan@gmail.com</email>
        <phone>9876543210</phone>
        <education>B.E / B.Tech</education>
        <skills>HTML, CSS, JavaScript, Java</skills>
        <careerGoal>Software Developer</careerGoal>
        <experience>Fresher</experience>
    </profile>
    <!-- 7 additional profiles -->
</careerConnect>`,
      },
      {
        name: "career.xsd",
        language: "xml",
        description: "W3C XML Schema definition validating structure and data types.",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="careerConnect">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="profile" maxOccurs="unbounded">
                	<xs:complexType>
                    	<xs:sequence>
                        	<xs:element name="profileId" type="xs:integer"/>
                        	<xs:element name="name" type="xs:string"/>
                        	<xs:element name="email" type="xs:string"/>
                        	<xs:element name="phone" type="xs:string"/>
                        	<xs:element name="education" type="xs:string"/>
                        	<xs:element name="skills" type="xs:string"/>
                        	<xs:element name="careerGoal" type="xs:string"/>
                        	<xs:element name="experience" type="xs:string"/>
                    	</xs:sequence>
                	</xs:complexType>
                </xs:element>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
</xs:schema>`,
      },
      {
        name: "career.xsl",
        language: "xml",
        description: "XSL transformation stylesheet transforming XML into styled HTML table.",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
    <html>
    <head>
        <title>Career Connect</title>
        <style>
            body { font-family: Arial; background: #e8f5e9; text-align: center; margin: 0; padding: 30px; }
            h1 { color: #238636; }
            table { margin: auto; border-collapse: collapse; width: 95%; background: white; }
            th { background: #238636; color: white; padding: 12px; }
            td { border: 1px solid #999; padding: 10px; }
        </style>
    </head>
    <body>
        <h1>CAREER CONNECT</h1>
        <h2>Career Profile Details</h2>
        <table>
            <tr><th>Profile ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Education</th><th>Skills</th><th>Career Goal</th><th>Experience</th></tr>
            <xsl:for-each select="careerConnect/profile">
            <tr>
                <td><xsl:value-of select="profileId"/></td>
                <td><xsl:value-of select="name"/></td>
                <td><xsl:value-of select="email"/></td>
                <td><xsl:value-of select="phone"/></td>
                <td><xsl:value-of select="education"/></td>
                <td><xsl:value-of select="skills"/></td>
                <td><xsl:value-of select="careerGoal"/></td>
                <td><xsl:value-of select="experience"/></td>
            </tr>
            </xsl:for-each>
        </table>
    </body>
    </html>
    </xsl:template>
</xsl:stylesheet>`,
      },
    ],
  },
];
