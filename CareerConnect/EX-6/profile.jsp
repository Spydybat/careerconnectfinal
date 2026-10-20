<%@ page contentType="text/html;charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head>
<title>Career Connect - Exercise 6(B)</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
body{min-height:100vh;background:linear-gradient(135deg,#e8f5e9,#e3f2fd);display:flex;justify-content:center;align-items:center;padding:20px}
.container{width:900px;max-width:100%;background:#fff;border-radius:20px;overflow:hidden;display:flex;box-shadow:0 10px 30px rgba(0,0,0,0.12)}
.left{width:40%;padding:40px 30px;color:#fff;background:linear-gradient(160deg,#238636,#176b2c)}
.logo{width:65px;height:65px;background:#fff;color:#238636;border-radius:50%;display:grid;place-items:center;font-size:25px;font-weight:bold;margin-bottom:20px}
h1{font-size:28px;margin-bottom:12px}
.left>p{line-height:1.6;font-size:14px;opacity:0.95}
.features{margin-top:20px}
.features p{margin:10px 0;font-size:14px}
.right{width:60%;padding:35px 40px}
h2{font-size:26px;margin-bottom:6px;color:#1a202c}
.subtitle{color:#777;margin-bottom:20px;font-size:14px}
.group{margin-bottom:13px}
label{display:block;font-size:13px;font-weight:bold;color:#444;margin-bottom:5px}
input,select,textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:0}
textarea{resize:vertical;min-height:70px}
input:focus,select:focus,textarea:focus{border-color:#238636}
.row{display:flex;gap:12px}
.row .group{width:50%}
.button{width:100%;padding:12px;border:0;border-radius:8px;background:#238636;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;transition:background 0.2s}
.button:hover{background:#176b2c}
.note{text-align:center;color:#888;font-size:11px;margin-top:10px}
@media(max-width:700px){.container{flex-direction:column}.left,.right{width:100%;padding:30px}.row{display:block}.row .group{width:100%}}
</style>
</head>
<body>
<div class="container">
<div class="left">
<div class="logo">CC</div>
<h1>Career Connect</h1>
<p>Transform your career data into career intelligence and discover opportunities based on your skills, education and career goals.</p>
<div class="features">
<p>&#9825; Smart Career Profiles</p>
<p>&#10022; Skill-Based Opportunities</p>
<p>&#9673; Career Intelligence</p>
<p>&#9733; Professional Growth</p>
<p>&#10003; Secure Profile Storage</p>
</div>
</div>
<div class="right">
<h2>Career Profile</h2>
<p class="subtitle">Enter your details to create your professional profile (MVC 3-Tier Architecture).</p>
<form action="CareerServlet" method="post">
<div class="group">
<label>Full Name</label>
<input type="text" name="name" placeholder="Enter your full name" required>
</div>
<div class="row">
<div class="group">
<label>Email Address</label>
<input type="email" name="email" placeholder="Enter your email" required>
</div>
<div class="group">
<label>Phone Number</label>
<input type="text" name="phone" placeholder="Enter phone number" maxlength="10" required>
</div>
</div>
<div class="group">
<label>Education</label>
<select name="education" required>
<option value="">Select Education</option>
<option>B.E / B.Tech</option>
<option>M.E / M.Tech</option>
<option>B.Sc</option>
<option>M.Sc</option>
<option>MBA</option>
</select>
</div>
<div class="group">
<label>Skills</label>
<input type="text" name="skills" placeholder="Example: HTML, CSS, JavaScript, Python" required>
</div>
<div class="group">
<label>Career Goal</label>
<select name="careerGoal" required>
<option value="">Select Career Goal</option>
<option>Software Developer</option>
<option>Data Analyst</option>
<option>Data Engineer</option>
<option>AI / ML Engineer</option>
<option>Web Developer</option>
</select>
</div>
<div class="group">
<label>Experience</label>
<select name="experience" required>
<option value="">Select Experience</option>
<option>Fresher</option>
<option>0 - 2 Years</option>
<option>2 - 5 Years</option>
<option>5+ Years</option>
</select>
</div>
<div class="group">
<label>Career Goals</label>
<textarea name="goals" placeholder="Enter your career goals" required></textarea>
</div>
<input class="button" type="submit" value="Create Career Profile">
</form>
<p class="note">Your information will be securely stored in the database via DAO.</p>
</div>
</div>
</body>
</html>
