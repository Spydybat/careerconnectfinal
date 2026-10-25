# Career Connect — Master Recreation Prompt
> **Instructions for the User:**  
> Copy and paste the entire prompt below into a **NEW, separate Google Antigravity project**. The prompt is 100% self-contained and instructs the AI agent to build the complete, production-ready Career Connect platform from scratch with zero missing details.

***

```markdown
# TASK: BUILD THE FULL "CAREER CONNECT" ENTERPRISE PLATFORM & WEB TECHNOLOGY LAB SUITE

You are an elite principal full-stack engineer, enterprise Java/Tomcat architect, and UI/UX design systems specialist.

Your mission is to construct the complete, fully-functional **Career Connect** platform — an AI-powered Career Intelligence Platform, Professional Career Network, and academic Web Technology (WT) Lab Suite.

Do not merely generate plans, partial mockups, or static placeholders. You must write the actual, working, production-grade source code for every frontend component, route, design token, Java servlet, DAO, database schema, and test suite.

---

## 1. PROJECT SPECIFICATION & ARCHITECTURE

### Architecture Model: Modern Enterprise Decoupled System
1. **Frontend Tier (Vercel Edge Ready):**
   - **Framework:** React 19 + TypeScript 5.8 + Vite 8.
   - **Routing & SSR:** TanStack Router 1.170 & TanStack Start 1.168 (file-based routing under `src/routes/`).
   - **Styling & Tokens:** Tailwind CSS v4 (`@tailwindcss/vite`, `tw-animate-css`) using modern **OKLCH** color tokens and custom utilities (`surface-card`, `bg-hero`, `bg-accent-gradient`).
   - **Component Library:** Radix UI primitives (`@radix-ui/react-*`), Lucide Icons (`lucide-react`), Recharts (`recharts`) for analytics.
   - **Form & Validation:** `react-hook-form`, `zod`.
   - **Document Engine:** `pdfjs-dist` for client-side ATS resume parsing.
2. **Backend Services Tier (Apache Tomcat 9 Container):**
   - **Container:** Official Apache Tomcat 9 with Eclipse Temurin OpenJDK 17 LTS (`tomcat:9.0-jdk17-temurin`).
   - **Bytecode Compatibility:** Target Java 17 bytecode (Major Version 61.0) using `javac --release 17`.
   - **Servlets & Filters:** `AuthServlet`, `CareerServlet`, `CareerServlet6B`, `SessionTrackingServlet`, `CorsSecurityFilter`, `CorsUtil`.
   - **Security:** PBKDF2 with HMAC-SHA256 password hashing (65,536 iterations, 256-bit key, 16-byte random salt), account lockout (5 failed attempts, 15-minute lockout).
   - **CORS & Cookie Wrapping:** Cross-domain cookie support (`SameSite=None; Secure; HttpOnly`) with origin validation allowing communication between Vercel and Render.
3. **Database Tier:**
   - **Microsoft SQL Server 2022 (Primary Lab & Auth):** `dbo.CareerUsers` and `dbo.CareerProfiles`.
   - **Supabase PostgreSQL (Optional Relational & Analytics):** `profiles`, `jobs`, `applications`, `resumes`, `companies`, `ai_usage_logs`, `audit_logs`.

---

## 2. DESIGN SYSTEM & VISUAL IDENTITY

### A. Typography
- **Display / Headings (`--font-display`):** `"Sora", ui-sans-serif, system-ui, sans-serif` (letter-spacing: -0.02em, weights: 700, 800).
- **Body / Interface (`--font-sans`):** `"Manrope", ui-sans-serif, system-ui, sans-serif` (weights: 400, 500, 600, 700).

### B. OKLCH Color Palette (`src/styles.css`)
Configure Tailwind v4 with the following exact design tokens:

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

:root {
  --radius: 0.75rem;
  --background: oklch(0.985 0.004 235);
  --foreground: oklch(0.22 0.035 245);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.22 0.035 245);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.22 0.035 245);
  --primary: oklch(0.46 0.115 216); /* Deep Sapphire Blue #1D4ED8 */
  --primary-foreground: oklch(0.985 0.005 220);
  --secondary: oklch(0.945 0.014 225);
  --secondary-foreground: oklch(0.3 0.045 240);
  --muted: oklch(0.955 0.008 230);
  --muted-foreground: oklch(0.52 0.028 240);
  --accent: oklch(0.78 0.135 72); /* Radiant Amber #F59E0B */
  --accent-foreground: oklch(0.24 0.05 60);
  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.985 0.005 220);
  --success: oklch(0.58 0.13 158); /* Emerald Green */
  --success-foreground: oklch(0.985 0.005 220);
  --warning: oklch(0.75 0.145 78);
  --warning-foreground: oklch(0.24 0.05 60);
  --info: oklch(0.6 0.11 235);
  --info-foreground: oklch(0.985 0.005 220);
  --border: oklch(0.9 0.012 232);
  --input: oklch(0.9 0.012 232);
  --ring: oklch(0.46 0.115 216);
  --gradient-hero: linear-gradient(140deg, oklch(0.26 0.055 245) 0%, oklch(0.36 0.09 216) 55%, oklch(0.5 0.11 196) 100%);
  --shadow-card: 0 1px 2px oklch(0.22 0.035 245 / 0.04), 0 8px 24px -12px oklch(0.22 0.035 245 / 0.18);
}

.dark {
  --background: oklch(0.19 0.032 245);
  --foreground: oklch(0.95 0.008 225);
  --card: oklch(0.24 0.04 244);
  --card-foreground: oklch(0.95 0.008 225);
  --popover: oklch(0.24 0.04 244);
  --popover-foreground: oklch(0.95 0.008 225);
  --primary: oklch(0.72 0.12 195);
  --primary-foreground: oklch(0.2 0.04 240);
  --secondary: oklch(0.3 0.04 242);
  --secondary-foreground: oklch(0.95 0.008 225);
  --muted: oklch(0.3 0.04 242);
  --muted-foreground: oklch(0.72 0.02 232);
  --accent: oklch(0.8 0.13 74);
  --accent-foreground: oklch(0.22 0.05 60);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.72 0.12 195);
}

@utility surface-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```

---

## 3. COMPLETE PAGE & ROUTE IMPLEMENTATION REQUIREMENTS

Build the full set of routes in `src/routes/`:

### A. Navigation & Framework Components
1. **`ProfessionalHeader` (`src/components/ProfessionalHeader.tsx`):**
   - Brand logo squircle with `/career-connect-icon.png` (or SVG icon) and text `"Career Connect"`.
   - Links: Home (`/`), Opportunities (`/opportunities`), Insights (`/insights`), Skills (`/skills`), Directory (`/career-profiles`), Network (`/network`), WT Lab (`/wt-lab`).
   - Dynamic right actions: Unauthenticated shows `"Sign In"` (`/login`) & `"Get Started"` (`/register`). Authenticated shows Role Badge, User Name, Avatar, and Profile/Dashboard/Logout dropdown.
   - Responsive mobile navigation sheet.
2. **`ProfessionalFooter` (`src/components/ProfessionalFooter.tsx`):**
   - Comprehensive footer with Verified Enterprise Network badge, categorized columns (Platform Navigation, Skills & Development, Portals & Access), and copyright 2026.
3. **`AppShell` (`src/components/app-shell.tsx`):**
   - Modern enterprise layout for authenticated routes (`/_authenticated/*`) with collapsible sidebar, command bar (`Cmd+K`), notification bell, breadcrumbs, and user dropdown.

---

### B. Core Public Pages
1. **Landing Page (`/` — `src/routes/index.tsx`):**
   - **Hero:** H1 `"Build Your Professional Future"`, subtitle, CTA buttons (`"Create Your Profile"` -> `/profile`, `"Explore Opportunities"` -> `/opportunities`), 4-item live ticker (`8+ Verified Profiles`, `100% Schema Validated`, `30+ Skill Pathways`, `92% Placement Rate`).
   - **Showcase Card:** Live candidate matching simulation card with 94% High Fit readiness bar, CloudScale Technologies job snippet, and skill chips.
   - **Featured Opportunities:** 3 curated job opening cards (Full-Stack Engineer, AI/ML Engineer, Data Specialist) with salary ranges and `"View Details"` CTA.
   - **Skills Intelligence:** 4 high-demand skill pathway cards with YoY growth pills (`+38% YoY`, `+62% YoY`).
   - **Interactive Career Ecosystem Map:** Interactive image map container with 4 clickable quadrants (Profile, Jobs, Skills, Insights) and synchronized detail drawer.
   - **Placement Intelligence Callout Banner.**
2. **Opportunities Directory (`/opportunities` — `src/routes/opportunities.tsx`):**
   - Real-time search by title, company, skills.
   - Multi-select filters: Location type (`Remote`, `Hybrid`, `On-site`), Experience level (`Fresher`, `0-2y`, `2-5y`, `5y+`).
   - Job cards with tags, responsibilities, salary range, and slide-over job details drawer.
   - Inline `"Apply Now"` application modal with instant confirmation toast.
3. **Candidate Profile Registration & 3-Tier Submission (`/profile` — `src/routes/profile.tsx`):**
   - Comprehensive validated form: Full Name, Email, Phone (10 digits), Degree, Skills, Career Goal, Experience, Summary.
   - Real-time inline field validation errors.
   - Posts to `/CareerServlet` with fallback handling.
   - Success view rendering confirmed persistent record card with SQL Server ID badge (`#16`).
4. **Career Profiles Directory (`/career-profiles` — `src/routes/career-profiles.tsx`):**
   - Toggle between **Grid View** and **Dense Table View**.
   - Search & filtering by qualification and skills.
   - Candidate inspection modal showing full bio, verified competencies, and contact data.
   - Action button linking to XML/XSD export.
5. **Skills Matrix (`/skills` — `src/routes/skills.tsx`):**
   - Category tabs (`All`, `Technical`, `Professional`, `Emerging`).
   - Catalog cards with demand indicators, growth rates, associated roles, and learning pathways.
   - Interactive deep-dive skill development drawer.
6. **Market Insights & Analytics (`/insights` — `src/routes/insights.tsx`):**
   - Executive role demand metrics table.
   - Interactive salary benchmark calculator by experience band (`Fresher`, `Early Career`, `Mid-Level`).
   - Skill velocity momentum matrix and campus placement metrics.
7. **Professional Network (`/network` — `src/routes/network.tsx`):**
   - Invitations manager with Accept / Ignore actions.
   - People You May Know cards with mutual connections count and interactive `"Connect"` toggle.

---

### C. Authentication & Administration
1. **Unified Sign In (`/login` — `src/routes/login.tsx` & `src/components/LoginForm.tsx`):**
   - Candidate vs Employer tab switcher, password visibility toggle, `"Remember me"`, links to register and admin login. Submits to `/AuthServlet?action=login`.
2. **Administrator Portal (`/admin/login` — `src/routes/admin.login.tsx`):**
   - Executive login enforcing admin authorization.
3. **Registration Portal (`/register` — `src/routes/register.tsx`):**
   - Role picker, validation rules, instant account creation via `/AuthServlet?action=register`.
4. **Executive Administrator Dashboard (`/admin/dashboard` — `src/routes/admin.dashboard.tsx`):**
   - Platform overview KPIs: Total Users, Candidates, Employers, Administrators.
   - Infrastructure status card: Active database indicator (`Connected: CSE9943 @ 103.207.1.91`), Java AuthServlet Gateway status.
   - Module navigation cards (User Directory, Roles, Operations, Audit, AI Gateway).
   - **`RegisteredUserDirectory` (`src/components/admin/RegisteredUserDirectory.tsx`):**
     - Live table consuming `GET /AuthServlet?action=users`.
     - Displays ID, Full Name, Email, Role badge, Status pill, Actions.
     - Add User, Edit User, Suspend/Activate, and Delete User modals.
     - **Session Error Handling:** Distinguishes HTTP 401/403 with: `"Administrator session may have expired or you do not have permission. Please sign in again."`

---

### D. AI Career Acceleration Suite
1. **AI Career Coach (`/ai/career-coach`):**
   - Streaming conversational AI interface grounded in candidate profile credentials.
2. **AI Mock Interview Simulator (`/ai/mock-interview`):**
   - Role and difficulty selector; turn-by-turn question generation; answer scoring dial (0-100); instant feedback.
3. **AI Skill Gap Analyzer (`/ai/skill-gap`):**
   - Profile comparison against target job descriptions with visual matched/missing skill gap analysis.
4. **ATS Resume AI Reviewer (`/resume`):**
   - PDF upload, text parsing (`pdfjs-dist`), ATS compatibility score dial, keyword density audit.

---

### E. Academic Web Technology (WT) Lab Suite (`/wt-lab/*`)
Provide dedicated interactive runner pages for all 7 lab modules:
- `/wt-lab/exercise-1`: Interactive Client-side Image Map with 4 clickable quadrants.
- `/wt-lab/exercise-2`: Multi-Tier CSS (Inline, Internal, External) style switcher.
- `/wt-lab/exercise-3`: JavaScript Form Validation with regex tests.
- `/wt-lab/exercise-4`: Apache Tomcat Architecture & Server Configuration Viewer.
- `/wt-lab/exercise-5a`: HTTP Servlet Form Ingestion & Parameter Processing.
- `/wt-lab/exercise-5b`: Stateful HttpSession Visit Tracker with timestamps.
- `/wt-lab/exercise-6a`: Three-Tier Database Persistence via JSP & JDBC.
- `/wt-lab/exercise-6b`: Three-Tier MVC Architecture with DAOs & JSPs.
- `/wt-lab/exercise-7`: XML Schema (`career.xsd`) & XSL Transformation (`career.xsl`) Table Renderer.

Each lab exercise must include:
1. **Live Runnable Demo Tab.**
2. **Full Source Code Tab with syntax highlighting.**
3. **Lab Manual Documentation Tab with algorithm and viva-voce notes.**

---

## 4. JAVA TOMCAT BACKEND & DATABASE SPECIFICATION

Under `CareerConnect/WebApplication/`:

### A. Java Servlets & DAOs
1. **`UserAccountDAO.java`:**
   - Database URL default: `jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9943;encrypt=true;trustServerCertificate=true` (overridden by `System.getenv("DB_URL")`).
   - PBKDF2 password hashing: `SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")`, 65,536 iterations, 256-bit key length, 16-byte random salt.
   - Brute-force lockout: Lock account for 15 minutes after 5 failed attempts.
   - Methods: `authenticate(email, password)`, `registerUser(account, password)`, `getAllUsers()`, `getUserById(id)`, `adminCreateUser()`, `adminUpdateUser()`, `adminDeleteUser()` (blocks deleting protected admin IDs 1 & 6), `updateStatus(id, status)`.
2. **`CareerProfileDAO.java`:**
   - Methods: `saveProfile(profile)`, `getAllProfiles()`, `getProfileById(id)`, `getProfileByEmail(email)`, `getLatestProfile()`.
3. **`CorsSecurityFilter.java` & `CorsUtil.java`:**
   - Origin-matching CORS filter setting `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials: true`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.
   - `CookieHeaderResponseWrapper` intercepting `Set-Cookie` to append `; Secure; SameSite=None` on HTTPS connections.
4. **`AuthServlet.java`:**
   - Handles `action=session`, `action=login`, `action=admin-login`, `action=register`, `action=logout`, `action=users`, `action=create-user`, `action=update-user`, `action=delete-user`, `action=update-status`.
5. **`CareerServlet.java` & `CareerServlet6B.java`:**
   - Handles JSON and Form profile ingestion and JSON retrieval.
6. **`SessionTrackingServlet.java`:**
   - Tracks session ID, creation time, last accessed time, and visit counter.

### B. Microsoft SQL Server Schema (`CSE9943`)
```sql
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
```

### C. Dockerfile & Build (`CareerConnect/Dockerfile`)
```dockerfile
FROM tomcat:9.0-jdk17-temurin
WORKDIR /usr/local/tomcat
RUN rm -rf /usr/local/tomcat/webapps/*
COPY WebApplication/CareerConnect.war /usr/local/tomcat/webapps/ROOT.war
COPY start-tomcat.sh /usr/local/tomcat/bin/start-tomcat.sh
RUN sed -i 's/\r$//' /usr/local/tomcat/bin/start-tomcat.sh && chmod +x /usr/local/tomcat/bin/start-tomcat.sh
ENV PORT=8080
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Xms256m -Xmx512m"
EXPOSE 8080
CMD ["/usr/local/tomcat/bin/start-tomcat.sh"]
```

---

## 5. ACCEPTANCE CRITERIA & FINAL CHECKLIST

1. **Clean TypeScript Build:** `npm run typecheck` exits with code 0.
2. **Complete Unit Test Suite:** `npm test` runs with all tests passing.
3. **Java 17 Compilation:** All classes compiled with `javac --release 17` verified at bytecode version 61.
4. **Deployable WAR:** Valid `CareerConnect.war` packaged with `WEB-INF/web.xml`, `META-INF/context.xml`, and `mssql-jdbc.jar`.
5. **Zero Hardcoded Secrets:** Prompt user to provide real database credentials via environment variables (`DB_URL`, `DB_USER`, `DB_PASSWORD`, `VITE_BACKEND_URL`).
6. **Fully Responsive:** All pages render flawlessly from 360px mobile viewports to 1536px enterprise monitors.

Build the complete application now!
```
