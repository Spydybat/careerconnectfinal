# Web Technology Lab — Integrated Suite & Practical Guide

## Career Connect AI Career Intelligence Platform

**Author:** Kalaiyarasan K (Reg. No: 9943)  
**Curriculum:** Anna University / Autonomous Web Technology Lab (CS3481)  
**Status:** All 7 Exercises (Ex 1, 2, 3, 4, 5A, 5B, 6A, 6B, 7) Fully Implemented and Verified

---

## 1. Quick Start Guide

### A. Run Frontend Application (Career Connect + WT Lab Dashboard)

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start local development server
npm run dev
```

Open your browser and navigate to:

- **WT Lab Dashboard:** [http://localhost:5173/wt-lab](http://localhost:5173/wt-lab)
- **Career Connect Main Platform:** [http://localhost:5173/](http://localhost:5173/)

### B. Run Embedded Java Web Server (Exercises 5A, 5B, 6A, 6B)

Zero external dependencies required! Uses standard Java SE 26 / 21 / 17:

```bash
cd wt-lab/java-web
javac EmbeddedLabServer.java
java EmbeddedLabServer
```

Open your browser to test live Java Servlet and JSP endpoints:

- Ex 5(A) Form & Servlet: [http://localhost:8085/index-5a.html](http://localhost:8085/index-5a.html)
- Ex 5(B) Session Tracking: [http://localhost:8085/index-5b.html](http://localhost:8085/index-5b.html)
- Ex 6(A) 3-Tier JSP App: [http://localhost:8085/career.jsp](http://localhost:8085/career.jsp)
- Ex 6(B) MVC Profile App: [http://localhost:8085/profile.jsp](http://localhost:8085/profile.jsp)

### C. Run Java XML Validator & XSL Transformer (Exercise 7)

```bash
cd wt-lab/xml
javac XmlProcessor.java
java XmlProcessor
```

This validates `career.xml` and `career-invalid.xml` against `career.xsd` and transforms `career.xml` using `career.xsl` to generate `career-output.html`.

---

## 2. Complete Exercise-to-File Mapping

| Exercise       | Title                                     | Technologies            | Source Files & Locations                                                                                                                                                                                                                                                             | Route in Career Connect |
| :------------- | :---------------------------------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| **EX.NO.1**    | HTML Image Map                            | HTML5                   | `public/career-connect.png`<br>`src/features/wt-lab/exercises/Exercise1ImageMap.tsx`                                                                                                                                                                                                 | `/wt-lab/exercise-1`    |
| **EX.NO.2**    | Types of CSS (Inline, Internal, External) | HTML5, CSS3             | `src/features/wt-lab/exercises/Exercise2CssTypes.tsx`<br>`ALL CODE EX WISE IN WT .txt`                                                                                                                                                                                               | `/wt-lab/exercise-2`    |
| **EX.NO.3**    | Client-Side DHTML Form Validation         | HTML, JavaScript, DHTML | `src/features/wt-lab/exercises/Exercise3FormValidation.tsx`<br>`src/features/wt-lab/__tests__/wt-lab.test.ts`                                                                                                                                                                        | `/wt-lab/exercise-3`    |
| **EX.NO.4**    | Apache Tomcat Web Server Installation     | Tomcat, JVM             | `wt-lab/docs/TOMCAT_SETUP_GUIDE.md`<br>`src/features/wt-lab/exercises/Exercise4Tomcat.tsx`                                                                                                                                                                                           | `/wt-lab/exercise-4`    |
| **EX.NO.5(A)** | Invoke Servlets from HTML Forms           | HTML, Servlet 3.1       | `wt-lab/java-web/src/CareerServlet.java`<br>`wt-lab/java-web/web/index-5a.html`<br>`wt-lab/java-web/web/WEB-INF/web.xml`<br>`src/features/wt-lab/exercises/Exercise5aServlet.tsx`                                                                                                    | `/wt-lab/exercise-5a`   |
| **EX.NO.5(B)** | Session Tracking Using Servlets           | Servlet, HttpSession    | `wt-lab/java-web/src/SessionTrackingServlet.java`<br>`wt-lab/java-web/web/index-5b.html`<br>`wt-lab/java-web/web/WEB-INF/web.xml`<br>`src/features/wt-lab/exercises/Exercise5bSession.tsx`                                                                                           | `/wt-lab/exercise-5b`   |
| **EX.NO.6(A)** | Three-Tier JSP & Database Application     | JSP, JDBC, SQL Server   | `wt-lab/java-web/web/career.jsp`<br>`wt-lab/java-web/web/career-result.jsp`<br>`wt-lab/database/schema.sql`<br>`src/features/wt-lab/exercises/Exercise6aThreeTier.tsx`                                                                                                               | `/wt-lab/exercise-6a`   |
| **EX.NO.6(B)** | Three-Tier MVC Architecture               | JSP, Servlet, DAO, SQL  | `wt-lab/java-web/src/CareerProfile.java`<br>`wt-lab/java-web/src/CareerProfileDAO.java`<br>`wt-lab/java-web/src/CareerServlet6B.java`<br>`wt-lab/java-web/web/profile.jsp`<br>`wt-lab/java-web/web/profile-result.jsp`<br>`src/features/wt-lab/exercises/Exercise6bThreeTierMvc.tsx` | `/wt-lab/exercise-6b`   |
| **EX.NO.7**    | XML Validation & Display (XSD & XSL)      | XML, XSD, XSLT, JAXP    | `wt-lab/xml/career.xml`<br>`wt-lab/xml/career.xsd`<br>`wt-lab/xml/career.xsl`<br>`wt-lab/xml/career-invalid.xml`<br>`wt-lab/xml/XmlProcessor.java`<br>`src/features/wt-lab/exercises/Exercise7XmlXsdXsl.tsx`                                                                         | `/wt-lab/exercise-7`    |

---

## 3. Database Schema & Configuration (Exercises 6A & 6B)

The database table `CareerProfiles` can be set up in Microsoft SQL Server, PostgreSQL, MySQL, or SQLite.

### SQL Server DDL (`wt-lab/database/schema.sql`)

```sql
USE CSE9943;
GO

CREATE TABLE CareerProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    education VARCHAR(100) NOT NULL,
    skills VARCHAR(500) NOT NULL,
    careerGoal VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    goals VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO
```

### Configurable Environment Variables

To connect to your own database server without exposing passwords:

- `DB_URL`: JDBC connection string (default: SQL Server `jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9596...`)
- `DB_USER`: Database login username (default: `MZ`)
- `DB_PASSWORD`: Database login password (default: `mzcet@1234`)

---

## 4. Apache Tomcat Web Server Deployment

For deploying the WAR or web application directory to Apache Tomcat 9/10:

1. Copy the `wt-lab/java-web/web` directory to Tomcat's `webapps/CareerConnect` directory.
2. Compile Java classes into `WEB-INF/classes`:
   ```bash
   javac -cp "%CATALINA_HOME%\lib\servlet-api.jar" -d wt-lab/java-web/web/WEB-INF/classes wt-lab/java-web/src/*.java
   ```
3. Place SQL Server JDBC driver JAR (`mssql-jdbc-xx.jar`) into `webapps/CareerConnect/WEB-INF/lib/` or Tomcat's `lib/` directory.
4. Start Tomcat and visit:
   `http://localhost:8080/CareerConnect/`

---

## 5. Verification & Test Suite

Run the automated test suite:

```bash
npm test
```

Runs 10 test suites (144 unit tests passing), verifying:

- All 9 WT Lab exercise modules catalog integrity.
- DHTML form validation rules (email `@`, 10-digit phone, regex character masks, error clear on update).
- Database table schema column alignments.
- XML/XSD/XSL data contracts.
