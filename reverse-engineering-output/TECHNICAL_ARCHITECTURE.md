# Career Connect — Technical Architecture & Implementation Guide

This document specifies the technical architecture, data contracts, API endpoints, database schemas, authentication systems, and deployment configurations of Career Connect.

---

## 1. Full Technology Stack

### A. Frontend Tier (Global Edge / Vercel)
- **Core Runtime & Framework:** React 19 (`react` 19.2.0, `react-dom` 19.2.0).
- **Language & Compiler:** TypeScript 5.8.3 (`strict: true`, ESNext target).
- **Bundler & Build Tool:** Vite 8.1.5 (`@vitejs/plugin-react` 5.2.0, `nitro` 3.0 server entry).
- **Routing & SSR Engine:** TanStack Router 1.170.41 & TanStack Start 1.168.60 (file-based routing under `src/routes/`).
- **Styling & Design System:** Tailwind CSS v4.2.1 (`@tailwindcss/vite`, `tw-animate-css` 1.3.4, OKLCH color space).
- **Component Primitives:** Radix UI primitives (`@radix-ui/react-*`), Lucide Icons (`lucide-react` 0.575.0).
- **Data Fetching & State:** `@tanstack/react-query` 5.101.1, React Context for Auth.
- **Charts & Visualizations:** `recharts` 2.15.4.
- **Form Handling & Validation:** `react-hook-form` 7.71.2, `@hookform/resolvers`, `zod` 3.24.2.
- **Document Handling:** `pdfjs-dist` 6.2.108 (client-side ATS resume parsing).
- **Test Runner:** `vitest` 4.1.10.

### B. Backend Tier (JVM Container / Render)
- **Container Base:** Apache Tomcat 9.0 (`tomcat:9.0-jdk17-temurin`).
- **Runtime:** Eclipse Temurin OpenJDK 17 LTS (Java bytecode format 61.0).
- **Servlet Specification:** Java Servlet 3.1 & JSP 2.3 (`javax.servlet-api`, `javax.servlet.jsp-api`).
- **JDBC Driver:** Microsoft JDBC Driver for SQL Server (`mssql-jdbc-12.8.1`).
- **Packaging:** Standard Web Application Archive (`CareerConnect.war` mounted as `ROOT.war`).

### C. Database Engines & Persistence
1. **Microsoft SQL Server 2022 (Primary Lab & Auth Database):**
   - Host: `103.207.1.91:1433`
   - Active Database Context: `CSE9943`
   - Authorized Login: `MZ`
   - Role: Secure user directory (`CareerUsers`), password hashes/salts, multi-tier candidate profiles (`CareerProfiles`).
2. **Supabase PostgreSQL (Cloud Relational & Data Warehouse):**
   - Managed PostgreSQL instance with Row Level Security (RLS).
   - Role: Complex applicant tracking, interview turns, AI conversation histories, and analytics warehouse marts.

---

## 2. Project Directory Structure

```text
WTCC2/
├── .github/                      # CI/CD Workflows (GitHub Actions ci.yml, security.yml)
├── CareerConnect/                # Native Java 3-Tier Web Application
│   ├── Dockerfile                # Tomcat 9 with OpenJDK 17 LTS container definition
│   ├── start-tomcat.sh           # Dynamic port mapping script for Render/Railway
│   ├── EX-6/                     # Lab exercise reference scripts & schema definitions
│   └── WebApplication/           # Servlet & JSP source workspace
│       ├── BUILD_AND_RUN.md      # Compilation & deployment documentation
│       ├── CareerConnect.war     # Compiled, production-ready deployable WAR
│       ├── src/                  # Java source files
│       │   ├── AuthServlet.java             # User authentication, registration, CRUD
│       │   ├── CareerProfile.java           # Candidate entity model
│       │   ├── CareerProfileDAO.java        # Candidate JDBC data access object
│       │   ├── CareerServlet.java           # Form ingestion & JSON REST endpoint
│       │   ├── CareerServlet6B.java         # MVC Controller servlet
│       │   ├── CorsSecurityFilter.java      # CORS filter & dynamic cookie wrapper
│       │   ├── CorsUtil.java                # CORS origins & cookie format utilities
│       │   ├── SessionTrackingServlet.java  # HttpSession state tracker
│       │   ├── UserAccount.java             # User entity model
│       │   └── UserAccountDAO.java          # User JDBC DAO with PBKDF2 hashing
│       └── web/                  # Webapp root packaged into WAR
│           ├── career-result.jsp # Three-tier JDBC submission result view
│           ├── career.jsp        # Three-tier candidate entry form
│           ├── index-5a.html     # HTML form posting to CareerServlet
│           ├── index-5b.html     # HTML form posting to SessionTrackingServlet
│           ├── profile-result.jsp# MVC profile result view
│           ├── profile.jsp       # MVC candidate entry form
│           ├── META-INF/
│           │   └── context.xml   # Rfc6265CookieProcessor (sameSiteCookies="none")
│           └── WEB-INF/
│               ├── web.xml       # Servlet 4.0 deployment descriptor
│               ├── classes/      # Compiled .class files (Target: Java 17 / v61)
│               └── lib/          # Runtime dependencies (mssql-jdbc.jar)
├── public/                       # Static public assets (icons, architecture diagrams)
├── src/                          # Modern React / Vite / TypeScript Frontend
│   ├── ai/                       # AI Career Intelligence Engine (Coach, Interview, Skill Gap)
│   ├── components/               # Reusable UI component library (Shadcn/Radix)
│   │   ├── admin/                # RegisteredUserDirectory and admin widgets
│   │   ├── analytics/            # Recharts analytics dashboards
│   │   ├── ui/                   # 50+ Radix/Tailwind component primitives
│   │   ├── app-shell.tsx         # Authenticated platform sidebar and header
│   │   ├── LoginForm.tsx         # Unified candidate, employer, and admin sign-in form
│   │   ├── ProfessionalFooter.tsx# Global brand footer
│   │   └── ProfessionalHeader.tsx# Global brand navigation bar
│   ├── data-platform/            # ETL pipeline, lakehouse store, data quality, marts
│   ├── features/wt-lab/          # Web Technology Lab Suite (Exercises 1 through 7)
│   ├── lib/                      # Utilities, API URL resolvers, auth context
│   │   ├── api-config.ts         # Environment URL resolver (VITE_BACKEND_URL)
│   │   └── auth-context.tsx      # Unified React AuthProvider & session lifecycle
│   ├── observability/            # Logging, metrics, alert triggers, health probes
│   ├── routes/                   # TanStack Router file-based route definitions
│   ├── security/                 # Rate limiting, CSP headers, input sanitization
│   └── styles.css                # Tailwind v4 theme, OKLCH design tokens, gradients
├── supabase/                     # Supabase database migrations and configuration
├── wt-lab/                       # Standalone lab scripts, XML/XSD/XSL files, and docs
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript compiler options
├── vercel.json                   # Vercel deployment configuration
└── vite.config.ts                # Vite config with TanStack Start & API proxy
```

---

## 3. Java Backend API Specification (`https://careerconnectfinal-3.onrender.com`)

### A. Global Filters
All incoming requests pass through [`CorsSecurityFilter.java`](file:///d:/Downloads/WTCC2/CareerConnect/WebApplication/src/CorsSecurityFilter.java):
1. **Origin Validation:** Inspects `Origin` against allowed regex (permitting `https://*.vercel.app` and localhost). Sets:
   - `Access-Control-Allow-Origin: <matching-origin>`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin`
   - `Access-Control-Max-Age: 86400`
2. **Preflight Termination:** Responds to `OPTIONS` queries immediately with `200 OK` and empty content.
3. **Cookie Wrapping:** Dynamic `CookieHeaderResponseWrapper` intercepts all `Set-Cookie` headers. On HTTPS, it automatically appends `; Secure; SameSite=None`, enabling cross-origin session persistence.

---

### B. `AuthServlet` API Endpoints (`/AuthServlet`)

| Method | Query / Action | Purpose | Access Rule | Request Payload | Response Format |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `?action=session` | Verify active session | Public | None | `{"authenticated": true, "user": {...}}` or `{"authenticated": false, "user": null}` |
| `GET` | `?action=users` | Fetch all user accounts | Admin Only | None | `{"success": true, "count": N, "users": [...]}` (Returns 403 if unauthenticated) |
| `GET` | `?action=user&id=N` | Fetch single user by ID | Admin Only | None | `{"success": true, "user": {...}}` |
| `POST` | `action=login` | Authenticate user | Public | `email`, `password`, `expectedRole` (optional) | `{"success": true, "message": "...", "user": {...}, "redirect": "/dashboard"}` |
| `POST` | `action=admin-login`| Authenticate admin | Admin Only | `email`, `password` | Same as login with enforce `role === 'admin'` |
| `POST` | `action=register` | Register new account | Public | `fullName`, `email`, `password`, `role`, `organization` | `{"success": true, "user": {...}, "redirect": "..."}` |
| `POST` | `action=logout` | Terminate session | Authenticated | None | `{"success": true, "message": "Logged out"}` |
| `POST` | `action=create-user`| Admin provision user| Admin Only | `fullName`, `email`, `password`, `role`, `organization`, `status` | `{"success": true, "user": {...}}` |
| `POST` | `action=update-user`| Admin update user | Admin Only | `id`, `fullName`, `email`, `role`, `organization`, `status` | `{"success": true, "user": {...}}` |
| `POST` | `action=delete-user`| Admin delete user | Admin Only | `id` | `{"success": true, "message": "User deleted"}` (Protected admins 1 & 6 blocked) |
| `POST` | `action=update-status`| Toggle active/suspend| Admin Only | `id`, `status` (`active`/`suspended`) | `{"success": true, "status": "..."}` |

---

### C. `CareerServlet` API Endpoints (`/CareerServlet`)

| Method | Query / Action | Purpose | Request Payload | Response Format |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | None | Get all candidate profiles | None | `{"success": true, "count": N, "profiles": [...]}` |
| `GET` | `?id=N` | Get profile by numeric ID | None | `{"success": true, "profile": {...}}` |
| `GET` | `?email=...` | Get profile by candidate email | None | `{"success": true, "profile": {...}}` |
| `GET` | `?latest=true` | Get newest registered profile | None | `{"success": true, "profile": {...}}` |
| `POST` | Form or JSON | Ingest candidate profile | `name`, `email`, `phone`, `education`, `skills`, `careerGoal`, `experience`, `goals` | `{"success": true, "id": 16, "message": "Profile created successfully"}` |

---

### D. `SessionTrackingServlet` (`/SessionTrackingServlet`)
- **Method:** `GET` or `POST`.
- **Purpose:** Stateful candidate visit tracker utilizing `request.getSession(true)`.
- **Response:** Renders HTML / JSON showing:
  - Session ID (`session.getId()`).
  - Creation Time (`session.getCreationTime()`).
  - Last Accessed Time (`session.getLastAccessedTime()`).
  - Visit Count counter stored in session attribute (`session.getAttribute("visitCount")`).

---

## 4. Microsoft SQL Server Database Schema (`CSE9943`)

The application automatically creates or validates the following tables upon DAO initialization:

```sql
-- 1. User Directory Table
IF OBJECT_ID('dbo.CareerUsers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareerUsers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fullName NVARCHAR(150) NOT NULL,
        email NVARCHAR(150) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        passwordSalt NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'candidate',
        organization NVARCHAR(150) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active',
        failedLoginAttempts INT NOT NULL DEFAULT 0,
        lockoutUntil DATETIME NULL,
        lastLoginAt DATETIME NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_CareerUsers_Email ON dbo.CareerUsers(email);
    CREATE INDEX IX_CareerUsers_Role ON dbo.CareerUsers(role);
END;

-- 2. Multi-Tier Candidate Profiles Table
IF OBJECT_ID('dbo.CareerProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CareerProfiles (
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
END;
```

### Password Security Implementation:
- **Algorithm:** PBKDF2 with HMAC-SHA256 (`PBKDF2WithHmacSHA256`).
- **Iterations:** 65,536 iterations.
- **Key Length:** 256 bits (32 bytes).
- **Salt:** 16 cryptographically random bytes generated via `SecureRandom`, stored in Base64 encoding.

---

## 5. Environment Variables & Configuration

### A. Client-Side (Vercel Frontend)
Configured in Vercel Project Settings (or local `.env`):
- `VITE_BACKEND_URL`: URL of the deployed Java Tomcat backend (e.g. `https://careerconnectfinal-3.onrender.com`).
- `VITE_API_URL`: Optional alias for `VITE_BACKEND_URL`.
- `VITE_SUPABASE_URL`: Supabase client endpoint.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase client anon/publishable key.
- `NODE_ENV`: `production` or `development`.

### B. Server-Side (Render JVM Backend)
Configured in Render Service Environment Variables:
- `PORT`: Automatically injected by Render (default: 8080).
- `JAVA_OPTS`: JVM tuning parameters (`-Dfile.encoding=UTF-8 -Xms256m -Xmx512m`).
- `DB_URL`: JDBC connection string for Microsoft SQL Server:
  `jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9943;encrypt=true;trustServerCertificate=true`
- `DB_USER`: SQL Server login (`MZ`).
- `DB_PASSWORD`: SQL Server password.

---

## 6. Build, Test & Deployment Commands

### A. Frontend Build & Test
```powershell
# Install dependencies
npm install

# TypeScript type validation
npm run typecheck

# Execute Vitest test suite
npm test

# Build production bundle for Vercel
npm run build
```

### B. Java Backend Compilation & Packaging
```powershell
# Compile all Java sources targeting Java 17 LTS for Tomcat 9
javac --release 17 `
      -cp ".;apache-tomcat-9.0.86\lib\servlet-api.jar;apache-tomcat-9.0.86\lib\jsp-api.jar;apache-tomcat-9.0.86\lib\mssql-jdbc.jar" `
      -d "CareerConnect\WebApplication\web\WEB-INF\classes" `
      "CareerConnect\WebApplication\src\*.java"

# Package into deployable WAR
cd CareerConnect\WebApplication\web
jar -cvf "..\CareerConnect.war" *
cd ..\..\..
```

### C. Docker Container Build (Local or Render)
```bash
docker build -t career-connect-backend CareerConnect/
docker run -p 8080:8080 -e PORT=8080 career-connect-backend
```
