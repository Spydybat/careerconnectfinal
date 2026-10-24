<%@ page import="java.sql.*" %>
<%@ page contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
<title>Career Profile Confirmation - Exercise 6(A)</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{box-sizing:border-box;font-family:Arial,sans-serif}
body{margin:0;min-height:100vh;background:linear-gradient(135deg,#e8f5e9,#e3f2fd);display:flex;justify-content:center;align-items:center;padding:20px}
.card{width:580px;max-width:95%;background:#fff;padding:35px;border-radius:20px;box-shadow:0 15px 40px rgba(0,0,0,0.12);text-align:center}
.success{width:65px;height:65px;margin:0 auto 15px;border-radius:50%;background:#20c997;color:#fff;font-size:38px;display:grid;place-items:center}
.error-icon{width:65px;height:65px;margin:0 auto 15px;border-radius:50%;background:#e53e3e;color:#fff;font-size:38px;display:grid;place-items:center}
h1{color:#238636;margin:10px 0;font-size:24px;}
.message{color:#666;margin-bottom:20px;font-size:14px;}
.details{text-align:left;background:#f7f9fc;padding:18px;border-radius:10px;border-left:4px solid #238636;}
.details p{margin:8px 0;color:#333;font-size:14px;}
.home{display:inline-block;margin-top:20px;padding:12px 22px;background:#238636;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold}
.home:hover{background:#176b2c;}
.error-box{background:#fff5f5;border:1px solid #feb2b2;color:#c53030;padding:15px;border-radius:8px;margin:15px 0;text-align:left;font-size:13px;}
</style>
</head>
<body>
<%
String name = request.getParameter("name");
String email = request.getParameter("email");
String phone = request.getParameter("phone");
String education = request.getParameter("education");
String skills = request.getParameter("skills");
String careerGoal = request.getParameter("careerGoal");
String experience = request.getParameter("experience");
String goals = request.getParameter("goals");

String url = System.getenv("DB_URL") != null 
    ? System.getenv("DB_URL") 
    : "jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9943;encrypt=true;trustServerCertificate=true";
String username = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "MZ";
String password = System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "mzcet@1234";

boolean dbSuccess = false;
String dbError = null;

try {
    if (url.startsWith("jdbc:sqlserver:")) {
        Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
    } else if (url.startsWith("jdbc:sqlite:")) {
        Class.forName("org.sqlite.JDBC");
    } else if (url.startsWith("jdbc:postgresql:")) {
        Class.forName("org.postgresql.Driver");
    } else if (url.startsWith("jdbc:mysql:")) {
        Class.forName("com.mysql.cj.jdbc.Driver");
    }

    try (Connection con = DriverManager.getConnection(url, username, password);
         PreparedStatement ps = con.prepareStatement(
            "INSERT INTO CareerProfiles(name,email,phone,education,skills,careerGoal,experience,goals) VALUES(?,?,?,?,?,?,?,?)")) {
        ps.setString(1, name);
        ps.setString(2, email);
        ps.setString(3, phone);
        ps.setString(4, education);
        ps.setString(5, skills);
        ps.setString(6, careerGoal);
        ps.setString(7, experience);
        ps.setString(8, goals);
        int rows = ps.executeUpdate();
        dbSuccess = (rows > 0);
    }
} catch (Exception e) {
    dbError = e.getMessage();
}
%>
<div class="card">
<% if (dbSuccess) { %>
    <div class="success">✓</div>
    <h1>Career Profile Created</h1>
    <p class="message">Your Career Connect profile has been successfully saved to the database.</p>
<% } else { %>
    <div class="error-icon">!</div>
    <h1 style="color:#e53e3e;">Database Notice</h1>
    <p class="message">Form processed successfully. Database connection status details below:</p>
    <div class="error-box">
        <strong>Database Notice / Fallback:</strong><br>
        <%= dbError != null ? dbError : "Unable to establish connection to database server." %>
        <br><br>
        <em>Note: If using remote SQL Server (103.207.1.91), ensure firewall port 1433 is accessible or configure a local DB via DB_URL environment variable.</em>
    </div>
<% } %>

<div class="details">
    <p><b>Full Name:</b> <%= name != null ? name : "" %></p>
    <p><b>Email:</b> <%= email != null ? email : "" %></p>
    <p><b>Phone Number:</b> <%= phone != null ? phone : "" %></p>
    <p><b>Education:</b> <%= education != null ? education : "" %></p>
    <p><b>Skills:</b> <%= skills != null ? skills : "" %></p>
    <p><b>Career Goal:</b> <%= careerGoal != null ? careerGoal : "" %></p>
    <p><b>Experience:</b> <%= experience != null ? experience : "" %></p>
    <p><b>Career Goals:</b> <%= goals != null ? goals : "" %></p>
</div>
<a class="home" href="career.jsp">Create Another Profile</a>
</div>
</body>
</html>
