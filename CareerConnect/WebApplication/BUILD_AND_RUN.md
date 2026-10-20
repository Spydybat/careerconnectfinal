# Career Connect Java Backend — Build & Execution Guide

This document describes how to compile, package, run, and deploy the native Java Servlets, JSP applications, and JDBC database modules for the Career Connect platform.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** JDK 8 through JDK 26 (verified on Oracle JDK 26.0.2).
- **Servlet / JSP Container:** Apache Tomcat 9.0.x (or Tomcat 10.1+ with Jakarta EE migration).
- **Database:** Microsoft SQL Server (or PostgreSQL/MySQL/SQLite compatible).

---

## 2. Compilation Instructions

To compile the Java source files (`CareerProfile.java`, `CareerProfileDAO.java`, `CareerServlet.java`, `CareerServlet6B.java`, `SessionTrackingServlet.java`) against the Apache Tomcat Servlet & JSP APIs:

```powershell
# From project root (d:\Downloads\WTCC2):
javac -cp ".;apache-tomcat-9.0.86\lib\servlet-api.jar;apache-tomcat-9.0.86\lib\jsp-api.jar;apache-tomcat-9.0.86\lib\mssql-jdbc.jar" `
      -d "CareerConnect\WebApplication\web\WEB-INF\classes" `
      "CareerConnect\WebApplication\src\*.java"
```

---

## 3. Running with Apache Tomcat 9 (Native Servlets & JSP)

### Step 1: Deploy WebApp to Tomcat
Copy the `web` folder contents to Tomcat's `webapps/ROOT`:
```powershell
Copy-Item -Path "CareerConnect\WebApplication\web\*" -Destination "apache-tomcat-9.0.86\webapps\ROOT" -Recurse -Force
```

### Step 2: Configure Port (if using 8085)
In `apache-tomcat-9.0.86/conf/server.xml`, ensure:
```xml
<Connector port="8085" protocol="HTTP/1.1" connectionTimeout="20000" redirectPort="8443" />
```

### Step 3: Launch Tomcat
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-26.0.2"
$env:CATALINA_HOME = "d:\Downloads\WTCC2\apache-tomcat-9.0.86"
& "$env:CATALINA_HOME\bin\catalina.bat" run
```

Endpoints will be live at:
- **Profile Submission (Form to Servlet):** `http://localhost:8085/index-5a.html`
- **CareerServlet Gateway:** `POST http://localhost:8085/CareerServlet`
- **Session Tracking (HttpSession):** `http://localhost:8085/index-5b.html`
- **Three-Tier JSP + JDBC App:** `http://localhost:8085/career.jsp`
- **Candidate MVC App:** `http://localhost:8085/profile.jsp`

---

## 4. Alternative: Running Standalone Fallback Runner (`EmbeddedLabServer`)

If Apache Tomcat is unavailable, run the zero-dependency Java SE server:

```powershell
cd CareerConnect\WebApplication
javac EmbeddedLabServer.java
java EmbeddedLabServer 8085
```

---

## 5. Building Deployable WAR Archive (`CareerConnect.war`)

To produce a production WAR for cloud hosting (AWS Elastic Beanstalk, Azure App Service, Docker):

```powershell
cd CareerConnect\WebApplication\web
jar -cvf ..\CareerConnect.war *
```

The resulting `CareerConnect.war` can be dropped into any standard Tomcat `webapps/` folder.
