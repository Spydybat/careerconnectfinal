<%@ page contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
<title>Career Profile - Exercise 6(B)</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{box-sizing:border-box;font-family:Arial,sans-serif}
body{margin:0;min-height:100vh;background:linear-gradient(135deg,#e8f5e9,#e3f2fd);display:flex;justify-content:center;align-items:center;padding:20px}
.card{width:600px;max-width:95%;background:#fff;padding:35px;border-radius:20px;box-shadow:0 15px 40px rgba(0,0,0,0.12);text-align:center}
.success{width:65px;height:65px;margin:0 auto 15px;border-radius:50%;background:#20c997;color:#fff;font-size:38px;display:grid;place-items:center}
h1{color:#238636;margin:10px 0;font-size:24px;}
.message{color:#666;margin-bottom:20px;font-size:14px;}
.details{text-align:left;background:#f7f9fc;padding:18px;border-radius:10px;border-left:4px solid #238636;}
.details p{margin:8px 0;color:#333;font-size:14px;}
.home{display:inline-block;margin-top:20px;padding:12px 22px;background:#238636;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold}
.home:hover{background:#176b2c;}
.badge{display:inline-block;padding:3px 8px;background:#e2e8f0;border-radius:4px;font-size:12px;color:#4a5568;}
</style>
</head>
<body>
<div class="card">
<div class="success">✓</div>
<h1>Career Profile Created</h1>
<p class="message">Your Career Connect profile has been successfully processed by the MVC Controller and stored in the database via DAO.</p>
<div class="details">
<p><b>Full Name:</b> <%=request.getAttribute("name") != null ? request.getAttribute("name") : ""%></p>
<p><b>Email:</b> <%=request.getAttribute("email") != null ? request.getAttribute("email") : ""%></p>
<p><b>Phone Number:</b> <%=request.getAttribute("phone") != null ? request.getAttribute("phone") : ""%></p>
<p><b>Education:</b> <%=request.getAttribute("education") != null ? request.getAttribute("education") : ""%></p>
<p><b>Skills:</b> <%=request.getAttribute("skills") != null ? request.getAttribute("skills") : ""%></p>
<p><b>Career Goal:</b> <%=request.getAttribute("careerGoal") != null ? request.getAttribute("careerGoal") : ""%></p>
<p><b>Experience:</b> <%=request.getAttribute("experience") != null ? request.getAttribute("experience") : ""%></p>
<p><b>Career Goals:</b> <%=request.getAttribute("goals") != null ? request.getAttribute("goals") : ""%></p>
<p><b>Architecture Tier:</b> <span class="badge">MVC (View: JSP &rarr; Controller: Servlet &rarr; Model: DAO/JDBC &rarr; DB: SQL Server)</span></p>
</div>
<a class="home" href="profile.jsp">Create Another Profile</a>
</div>
</body>
</html>
