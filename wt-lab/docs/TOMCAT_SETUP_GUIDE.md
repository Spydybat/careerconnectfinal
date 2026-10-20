# Apache Tomcat Web Server Installation & Configuration Guide

## Web Technology Lab — Exercise 4

This guide covers the complete procedure for installing, configuring, deploying, and managing Apache Tomcat Web Server for the Career Connect Web Technology lab exercises (Exercise 5A, 5B, 6A, 6B).

---

### Prerequisites

1. **Java Development Kit (JDK)**: JDK 8, 11, 17, 21, or newer installed.
   - Verify in terminal: `java -version` and `javac -version`
   - Set environment variable `JAVA_HOME` pointing to your JDK root (e.g. `C:\Program Files\Java\jdk-21`).
2. **Administrator Privileges**: Required for Windows Service installation.

---

### Step-by-Step Installation Procedure (from Lab Manual)

#### STEP 1: Visit the Apache Tomcat Website

- Open your web browser and navigate to the official Apache Tomcat download portal: [https://tomcat.apache.org](https://tomcat.apache.org).
- Under **Download**, select the appropriate Tomcat version (Tomcat 9.0 or 10.1).
- Download the **32-bit/64-bit Windows Service Installer** (`.exe`).

#### STEP 2: Launch the Installer

- Locate the downloaded installer file (e.g., `apache-tomcat-9.0.xx.exe`).
- Right-click and choose **Run as administrator**.
- The Apache Tomcat Setup Wizard opens. Click **Next** to proceed.

#### STEP 3: Accept the License Agreement

- Review the Apache Software Foundation License terms.
- Click **I Agree** to proceed with the installation.

#### STEP 4: Select Required Components

- In the **Choose Components** screen, select:
  - **Tomcat**: Core, Native
  - **Service Startup**: Automatically runs Tomcat on Windows boot
  - **Tomcat Host Manager**: Virtual host management tool
  - **Tomcat Manager App**: Web application deployment manager
- Click **Next**.

#### STEP 5: Configure Ports & Administrative Credentials

- **HTTP Connector Port**: Default is `8080` (can be changed to `8085` or `8090` if 8080 is used by another service).
- **Tomcat Administrator Login**:
  - **User Name**: `admin` (or `tomcat` / `MZ`)
  - **Password**: Secure password (e.g., `mzcet@1234` or custom)
  - **Roles**: `manager-gui,admin-gui`
- Click **Next**.

#### STEP 6: Specify JDK Location

- The installer detects the installed Java Virtual Machine (JVM).
- If prompted, browse to your installed JDK/JRE directory:
  - Example: `C:\Program Files\Java\jdk-xx`
- Click **Next**.

#### STEP 7: Select Install Location & Complete Setup

- Choose destination directory (default: `C:\Program Files\Apache Software Foundation\Tomcat 9.0`).
- Click **Install**.
- Once files are copied, check **Run Apache Tomcat** and click **Finish**.

---

### Server Verification & Management

#### STEP 8: Verify Tomcat Localhost Welcome Page

- Open browser and navigate to:
  ```
  http://localhost:8080/
  ```
- If Tomcat is running correctly, the Apache Tomcat Welcome page appears with server status.

#### STEP 9: Access Tomcat Web Application Manager

- Click **Manager App** button on the welcome page, or navigate directly to:
  ```
  http://localhost:8080/manager/html
  ```
- Enter the administrator username and password created during Step 5.
- The **Tomcat Web Application Manager** interface opens, showing deployed web applications, sessions, and memory metrics.

---

### Deploying Career Connect WT-Lab Module to Tomcat

#### Method A: Deploying Directory / WAR

1. Copy the `wt-lab/java-web/web` folder to Tomcat's `webapps` folder:
   - Destination: `C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps\CareerConnect`
2. Ensure `web/WEB-INF/web.xml` is located inside `webapps/CareerConnect/WEB-INF/web.xml`.
3. Put compiled `.class` files into `webapps/CareerConnect/WEB-INF/classes/`.
4. Copy database driver JAR (`mssql-jdbc-xx.jar`) into `webapps/CareerConnect/WEB-INF/lib/` or Tomcat's `lib/`.
5. Access the deployed application in browser:
   - Form to Servlet: `http://localhost:8080/CareerConnect/index-5a.html`
   - Session Tracking: `http://localhost:8080/CareerConnect/index-5b.html`
   - 3-Tier JSP App: `http://localhost:8080/CareerConnect/career.jsp`
   - MVC Profile App: `http://localhost:8080/CareerConnect/profile.jsp`

#### Method B: Standalone Built-in Runner (Instant Verification)

If Tomcat GUI installer is not yet downloaded, you can run our included zero-dependency Java server immediately:

```bash
cd wt-lab/java-web
javac EmbeddedLabServer.java
java EmbeddedLabServer
```

Open: `http://localhost:8085/index-5a.html`

---

### Common Troubleshooting

| Issue                                     | Cause                                                        | Solution                                                                                             |
| :---------------------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| Port 8080 already in use                  | Another process (e.g. IIS, Jenkins, Oracle) is bound to 8080 | Change `<Connector port="8080">` to `8085` in `conf/server.xml` and restart Tomcat.                  |
| 403 Access Denied on Manager              | Missing roles in `conf/tomcat-users.xml`                     | Add `<role rolename="manager-gui"/><user username="admin" password="secret" roles="manager-gui"/>`.  |
| `ClassNotFoundException: SQLServerDriver` | JDBC driver missing in classpath                             | Download `mssql-jdbc` JAR and place into `webapps/<app>/WEB-INF/lib/` or Tomcat `lib/`.              |
| JVM not found                             | `JAVA_HOME` not set                                          | Set system environment variable `JAVA_HOME` to JDK directory and append `%JAVA_HOME%\bin` to `PATH`. |
