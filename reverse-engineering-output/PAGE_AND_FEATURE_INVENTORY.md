# Career Connect — Page & Feature Inventory

This document provides a comprehensive inventory of all pages, routes, layouts, interactive components, workflows, and UI states discovered in the Career Connect application.

---

## 1. Global Layouts & Shells

### A. `ProfessionalHeader` (`src/components/ProfessionalHeader.tsx`)
- **Rendered On:** All public marketing pages (`/`, `/opportunities`, `/skills`, `/insights`, `/network`, `/career-profiles`, `/profile`, `/login`, `/register`, `/admin/login`, `/admin/dashboard`).
- **Elements:**
  - **Brand Logo:** Squircle container with `/career-connect-icon.png`, bold title `"Career Connect"`, subtext `"Professional Network"`. Links to `/`.
  - **Desktop Navigation Links:**
    - Home (`/`)
    - Find Opportunities (`/opportunities`)
    - Career Insights (`/insights`)
    - Discover Skills (`/skills`)
    - Directory (`/career-profiles`)
    - Professional Network (`/network`)
    - WT Lab Suite (`/wt-lab`) with badge `"CS3481"`
  - **Right Actions:**
    - When unauthenticated: `"Sign In"` (outline button -> `/login`) and `"Get Started"` (primary button -> `/register`).
    - When authenticated: Role badge (`Candidate`, `Employer`, `Admin`), user avatar with initials, and dropdown menu with: Profile (`/profile`), Dashboard (`/dashboard` or `/admin/dashboard`), Settings, and Sign Out (clears session and redirects).
  - **Mobile Hamburger Menu:** Responsive sheet opening a full-height navigation drawer on screens $< 1024\text{px}$.

### B. `ProfessionalFooter` (`src/components/ProfessionalFooter.tsx`)
- **Rendered On:** All public pages.
- **Sections:**
  - **Brand Column:** Logo, mission statement, verified enterprise network badge (`ShieldCheck`).
  - **Column 1 — Platform Navigation:** Home, Find Opportunities, Career Insights, Companies Directory.
  - **Column 2 — Skills & Development:** Discover Skills, Career Paths, Resume AI Reviewer, Professional Network.
  - **Column 3 — Portals & Access:** Candidate Sign In (`/login`), Create Account (`/register`), Employer Talent Hub (`/employer/dashboard`), Administrator Portal (`/admin/login`).
  - **Bottom Bar:** Copyright notice (`© 2026 Career Connect`), links to Privacy Policy, Terms of Service, Security.

### C. Authenticated `AppShell` (`src/components/app-shell.tsx` & `src/routes/_authenticated/route.tsx`)
- **Rendered On:** All `/_authenticated/*` routes.
- **Features:**
  - Collapsible responsive sidebar with navigation groups:
    - **Core:** Dashboard (`/dashboard`), Profile (`/profile`), Applications (`/applications`), Saved Jobs.
    - **AI Acceleration:** Career Coach (`/ai/career-coach`), Mock Interview (`/ai/mock-interview`), Skill Gap (`/ai/skill-gap`).
    - **Discovery:** Jobs (`/jobs`), Companies (`/companies`), Career Paths (`/careers`), Resume Reviewer (`/resume`).
    - **Role Portals:** Recruiter Talent Hub (`/recruiter`), Placement Hub (`/placement`), Executive Analytics (`/analytics`), Administration (`/admin`).
  - Sticky Top Header: Search command bar (`Cmd/Ctrl + K`), notification bell with unread badge, dark/light theme toggle, user profile avatar.
  - Breadcrumb navigation auto-generated from route path tokens.

---

## 2. Public Marketing & Exploration Pages

### Route 1: Landing Page (`/` — `src/routes/index.tsx`)
- **Layout:** `ProfessionalHeader` + Body + `ProfessionalFooter`.
- **Sections in Order:**
  1. **Hero Section:**
     - Badge: `THE PROFESSIONAL CAREER NETWORK` with `ShieldCheck`.
     - H1: `Build Your Professional Future.` with royal blue highlight.
     - Subtitle: `Discover verified opportunities, showcase your skills, grow your professional network...`
     - Action Buttons: `Create Your Profile` (primary pill -> `/profile`), `Explore Opportunities` (outline pill -> `/opportunities`).
     - Live KPI Ticker (4 cards): `8+ Verified Profiles`, `100% Schema Validated`, `30+ Skill Pathways`, `92% Placement Rate`.
     - Right Column Card: Interactive Career Intelligence Showcase (AI badge, Live pulse dot, Profile readiness bar at 94%, matched role snippet for CloudScale Technologies at ₹18-26 LPA, quick links to Skills Matrix and Mentors).
  2. **Featured Opportunities Section:**
     - Section Header: `Live Openings` / `Featured Career Opportunities`.
     - 3 Opportunity Cards:
       - Senior Full-Stack Software Engineer (CloudScale Technologies, Bengaluru, ₹18 - 26 LPA).
       - AI & Machine Learning Engineer (Cognitive Intelligence Labs, Hyderabad, ₹14 - 20 LPA).
       - Enterprise Data & Analytics Specialist (Synthesize Global Solutions, Chennai, ₹10 - 15 LPA).
     - Each card features: Company name, job title, location pin, experience level, skill tags, salary badge, `"View Details"` CTA.
     - Top-right CTA: `"View All Opportunities"`.
  3. **Skills Intelligence Section:**
     - 4 In-Demand Skill Pathway Cards with YoY growth pills:
       - `Java & Enterprise Spring Boot` (+38% YoY, Very High 94%)
       - `Python & Machine Learning` (+62% YoY, High 91%)
       - `Modern React & TypeScript` (+29% YoY, High 89%)
       - `Enterprise Data Warehousing & SQL` (+34% YoY, Very High 95%)
  4. **Interactive Career Ecosystem Explorer (Image Map):**
     - Modern implementation of WT Lab Exercise 1.
     - Responsive image container embedding `/career-connect.png` with 4 clickable quadrant hotspots:
       - Top-Left Hotspot: Profile Domain
       - Top-Right Hotspot: Opportunities Domain
       - Bottom-Left Hotspot: Skills Domain
       - Bottom-Right Hotspot: Insights Domain
     - Active Quadrant Detail Card on right: Displays domain title, description, and direct navigation button. Defaults to exploratory prompt when no quadrant is clicked.
  5. **Executive Market Intelligence Banner:**
     - Gradient banner with callout to explore salary benchmarks and hiring velocity charts, leading to `/insights` and `/career-profiles`.

---

### Route 2: Opportunities & Jobs Directory (`/opportunities` — `src/routes/opportunities.tsx`)
- **Purpose:** Searchable and filterable job marketplace.
- **Components & Features:**
  - **Search Header:** Live search input querying title, company, or keywords.
  - **Filter Toolbar:**
    - Location Type: `All`, `Remote`, `Hybrid`, `On-site`.
    - Experience Tier: `All`, `Fresher`, `0 - 2 Years`, `2 - 5 Years`, `5+ Years`.
    - Active Skill Tag filters (pills that toggle on/off).
  - **Results Grid:**
    - Cards showing title, verified company, location, salary tier, experience required, and responsibility list.
    - Button: `"View Job Details"` opens slide-over modal.
    - Button: `"Apply Now"` launches inline submission modal with resume attachment and immediate confirmation toast.

---

### Route 3: Candidate Profile Creation & 3-Tier Registration (`/profile` — `src/routes/profile.tsx`)
- **Purpose:** Candidate profile registration and live database record retrieval.
- **Form Fields (with Real-Time Validation):**
  - Full Name (required, min 2 chars)
  - Email (required, valid email pattern)
  - Phone Number (required, 10-digit Indian/international mobile format)
  - Education (Dropdown: B.E / B.Tech, M.E / M.Tech, MCA, B.Sc / BCA, MBA, Ph.D, Other)
  - Technical Skills (required, comma-separated string)
  - Career Goal (required, target job title)
  - Experience Level (Dropdown: Fresher, Entry-Level, Mid-Level, Senior, Lead/Executive)
  - Career Goals Summary (required, textarea, min 10 chars)
- **Persistence Mechanism:**
  - POSTs to Java backend (`/CareerServlet`).
  - Auto-fallback to `/career-result.jsp` if running in legacy servlet mode.
- **UI States:**
  - Idle Form.
  - Submitting: Button displays `"Persisting to Database..."` with spinning loader.
  - Success State: Renders confirmed registration card with:
    - Green checkmark icon.
    - SQL Server persistence confirmation notice with generated DB ID (`#16`).
    - Summary grid with submitted credentials.
    - Action buttons: `"Submit Another Profile"` or `"View in Candidate Directory"`.
  - Error State: Red alert banner displaying specific validation or network failure reason.

---

### Route 4: Career Profiles Directory (`/career-profiles` — `src/routes/career-profiles.tsx`)
- **Purpose:** Search and explore verified candidate profiles. Backed by XML schema standards (`career.xsd`).
- **Features:**
  - Search input filtering by name, skills, goal, and degree.
  - View Toggle: Switch between **Card Grid View** and **Dense Table View**.
  - 8 Authoritative Pre-seeded Profiles (Alex Morgan, Arun Kumar, Priya, Vijay, Divya, Rahul, Sneha, Vignesh) plus live backend rows.
  - Detailed Candidate Profile Modal: Click on any profile to inspect full contact info, bio, and competencies.
  - Action Button: `"Export XML/XSL Schema"` linking to WT Lab Exercise 7.

---

### Route 5: Skills Matrix & Learning Paths (`/skills` — `src/routes/skills.tsx`)
- **Purpose:** In-demand skill catalog and learning roadmap explorer.
- **Features:**
  - Category Filter Tabs: `All Skills`, `Technical Skills`, `Professional Skills`, `Emerging Skills`.
  - Search input with instant filtering.
  - Catalog Cards with: Demand Level (`Very High`, `High`, `Moderate`), YoY Growth Rate, Associated Job Roles, Core Subskills, and Recommended Learning Areas.
  - Interactive Skill Drawer: Clicking a skill opens deep-dive learning modules and certifications.

---

### Route 6: Market Insights & Salary Analytics (`/insights` — `src/routes/insights.tsx`)
- **Purpose:** Platform market intelligence and compensation benchmarks.
- **Features:**
  - **Demand Metrics Table:** Role name, demand score (0-100), YoY growth rate, demand tier, and active hiring count.
  - **Interactive Salary Benchmark Calculator:** Experience tier selector (`Fresher`, `Early Career 1-3y`, `Mid-Level 3-5y+`). Dynamically updates salary ranges across domains (Software Engineering, AI/ML, Data Analytics, Cloud/DevOps).
  - **Skill Velocity Matrix:** Momentum cards (`Accelerating`, `Steady High`, `Core Staple`) showing growth percentages.
  - **Placement Outcome Metrics:** Placement percentage (92%), highest package (₹42 LPA), average package (₹14.2 LPA), total hiring partners (120+).

---

### Route 7: Professional Network (`/network` — `src/routes/network.tsx`)
- **Purpose:** Peer networking and alumni mentorship portal.
- **Features:**
  - **Invitations Manager:** List of pending invitations with Accept / Ignore buttons.
  - **People You May Know Grid:** Cards featuring name, title, company, mutual connection count, skills, and interactive `"Connect"` button (toggles `idle` -> `pending` with instant feedback).
  - Filter by industry or company.

---

## 3. Authentication & Access Control Pages

### Route 8: Candidate & Employer Sign In (`/login` — `src/routes/login.tsx`)
- **Component:** `LoginForm` (`src/components/LoginForm.tsx`).
- **Features:**
  - Mode Tabs: `Candidate Login` vs. `Employer Login`.
  - Fields: Email Address, Password (with toggleable show/hide eye icon), `"Remember this device"` checkbox.
  - Action Button: `"Sign In to Career Connect"`.
  - Helper Links: `"Forgot password?"` -> `/forgot-password`, `"Need an account? Register"` -> `/register`, `"Platform Administrator Portal"` -> `/admin/login`.
  - Submits to `POST /AuthServlet?action=login` with JSON payload.
  - On Success: Sets backend `JSESSIONID` cookie (`SameSite=None; Secure`), caches user in `localStorage`, and redirects based on role:
    - Candidate -> `/dashboard`
    - Employer -> `/employer/dashboard`
    - Admin -> `/admin/dashboard`

### Route 9: Executive Administrator Portal (`/admin/login` — `src/routes/admin.login.tsx`)
- **Features:**
  - Styled with Amber/Gold security badge: `"Authorized Administrative Clearance Required"`.
  - Enforces `expectedRole: "admin"` during authentication.
  - Blocks candidates and employers with `HTTP 403 Access Denied`.
  - Automatically redirects authenticated admins to `/admin/dashboard`.

### Route 10: Registration Portal (`/register` — `src/routes/register.tsx`)
- **Features:**
  - Role Selector: `Candidate / Student` vs. `Hiring Employer / Partner`.
  - Form Fields: Full Name, Professional Email, Password (min 8 chars, strength indicator), Organization / College Name.
  - Client-side validation: Blocks attempts to self-provision the `admin` role.
  - Submits to `POST /AuthServlet?action=register`.
  - Automatically logs in the user and redirects to their dashboard.

### Route 11: Password Reset Flow (`/forgot-password` — `src/routes/forgot-password.tsx`)
- **Features:**
  - Input: Registered account email.
  - Verifies account existence in database.
  - Provides password reset guidance or triggers recovery procedure via `/AuthServlet?action=forgot-password`.

---

## 4. Role-Specific Dashboards & Authenticated Modules

### Route 12: Candidate Dashboard (`/dashboard` — `src/routes/_authenticated/dashboard.tsx`)
- **Access:** Authenticated Candidates.
- **Sections:**
  - Welcome Banner with candidate name and career readiness level.
  - Readiness Score Dial: 0-100 visual progress ring.
  - Quick Actions: Practice AI Interview, Analyze Skill Gap, View Saved Jobs, Update Profile.
  - Active Applications Kanban: Count of Applied, Under Review, Interview Scheduled, Offer Extended.
  - Recommended Jobs carousel based on candidate skills.

### Route 13: Employer / Recruiter Hub (`/employer/dashboard` & `recruiter.*`)
- **Access:** Authenticated Employers / Recruiters.
- **Features:**
  - Talent pipeline metrics: Active job listings, total applicants, shortlisted talent, interview scheduled.
  - Candidate Search Table: Filter candidates by skills, experience tier, education, and graduation year.
  - Resume preview modal and candidate status updater (Shortlist / Reject).
  - Job creation form with skill tag builder and salary range inputs.

### Route 14: Campus Placement Portal (`placement.*`)
- **Access:** Placement Officers and Academic Staff.
- **Features:**
  - Campus Placement Drives: Calendar of upcoming enterprise drives, eligibility criteria, and registered student counts.
  - Student Placement Records: Searchable table of offers received, companies, packages (LPA), and offer letters.
  - Placement Velocity Analytics: Historical charts showing placement curves over semesters.

### Route 15: Executive Administration Console (`/admin/dashboard` & `admin.*`)
- **Access:** Strictly restricted to `admin` role (`id=1` or `id=6`).
- **Dashboard Sections:**
  1. **Header Banner:** Executive badge, platform settings link, user directory shortcut.
  2. **Platform Metric Cards:**
     - Total Database Users (count from SQL Server `CareerUsers`).
     - Candidate Accounts count.
     - Employer Accounts count.
     - System Administrators count.
  3. **Infrastructure Health Status Card:**
     - **Microsoft SQL Server:** Status indicator showing connected database name (`CSE9943 @ 103.207.1.91`).
     - **Java AuthServlet Gateway:** Connection status to deployed Render Tomcat backend.
     - **Role Authorization:** Enforcement policy indicator.
  4. **Management Module Navigation Cards:**
     - User Management (`/admin/users`): Full CRUD on SQL Server user directory.
     - Access Roles & RBAC (`/admin/roles`): Role permissions table.
     - System Operations (`/admin/operations`): Database latency, slow queries, p95 response time.
     - Compliance Audit (`/admin/audit`): Security audit log table.
     - AI Gateway Management (`/admin/ai`): Token quotas, cost tracking, model routing.
     - Platform Settings (`/admin/settings`): Global configurations.
  5. **`RegisteredUserDirectory` Component:**
     - Real-time table fetching all users via `GET /AuthServlet?action=users`.
     - Displays: ID, Full Name, Email, Role badge, Organization, Status (`active` / `suspended`), Created Date.
     - Actions per row: View User Modal, Edit User Details, Toggle Suspend/Activate, Delete User.
     - Add User Modal: Direct administrative provisioning of new users with PBKDF2 password generation.
     - Clear session expiration notice if cookie expires (`HTTP 401/403`).

---

## 5. AI Career Acceleration Suite

### Route 16: AI Career Coach (`/ai/career-coach` — `src/routes/_authenticated/ai.career-coach.tsx`)
- **Features:**
  - Conversational chat interface with streaming responses.
  - Contextual career guidance taking candidate's profile and skills into account.
  - Quick Prompt Pills: `"How do I transition from Java to Cloud Architecture?"`, `"Review my skills for an AI Engineer role"`, `"What questions will I be asked for a Mid-Level Full Stack interview?"`.
  - Message history persistence and markdown code syntax highlighting.

### Route 17: AI Mock Interview Simulator (`/ai/mock-interview` — `src/routes/_authenticated/ai.mock-interview.tsx`)
- **Features:**
  - Role & Level Selection: Choose target job role (e.g., Full Stack Engineer, Data Scientist) and difficulty level (Junior, Mid, Senior).
  - Turn-by-Turn Conversational Interviewer: AI asks one question at a time (technical, system design, or behavioral).
  - Candidate Answer Submission: Text or speech input.
  - Instant Feedback & Scoring: Evaluates accuracy, clarity, and depth; provides a score dial (0-100) and improvement tips after each answer.
  - Final Interview Performance Report with downloadable summary.

### Route 18: AI Skill Gap Analyzer (`/ai/skill-gap` — `src/routes/_authenticated/ai.skill-gap.tsx`)
- **Features:**
  - Select existing candidate profile or paste a resume.
  - Target Role selector with industry benchmark skill profiles.
  - Visual Venn / Radar Gap Diagram: Matched skills (Green), Partial skills (Yellow), Missing skills (Red).
  - Tailored 30-60-90 Day Actionable Learning Pathway with recommended courses and project ideas.

### Route 19: ATS AI Resume Reviewer (`/resume` — `src/routes/_authenticated/resume.*`)
- **Features:**
  - PDF Resume Upload & Parsing (`pdfjs-dist`).
  - ATS Compatibility Score Dial (0-100).
  - Detailed Audit Tabs: Keyword Match, Formatting & Typography, Section Completeness, Impact Action Verbs.
  - One-click AI resume optimization suggestions.

---

## 6. Academic Web Technology (WT) Lab Suite

Integrated under `/wt-lab` with dedicated interactive runner pages for each exercise:

| Route | Exercise Title | Core Technologies | Implemented Features |
| :--- | :--- | :--- | :--- |
| `/wt-lab/exercise-1` | **Interactive Career Ecosystem Explorer** | HTML, Client Image Map | Interactive ecosystem map with 4 clickable coordinates (`coords="60,120,300,300"` etc.), domain preview panel, code viewer. |
| `/wt-lab/exercise-2` | **Multi-Tier Design System & Theme Showcase** | CSS Types, Cascading Rules | External, internal, and inline CSS demonstration; live style switcher; responsive card layout. |
| `/wt-lab/exercise-3` | **JavaScript Form Validation & Security** | Client JS, Regex, Event Handlers | Real-time candidate form validation (Phone 10-digits, Email regex, Password length, Checkbox validation); error highlights. |
| `/wt-lab/exercise-4` | **Apache Tomcat Architecture & Deployment** | Java Servlet 3.1, Tomcat 9, XML | Tomcat directory structure viewer; `web.xml` deployment descriptor inspection; virtual host and port configuration guide. |
| `/wt-lab/exercise-5a` | **HTTP Servlet Form Processing** | Java Servlets, `HttpServletResponse` | Live form posting to `/CareerServlet`; server-side extraction of parameters; structured HTML response generation. |
| `/wt-lab/exercise-5b` | **Candidate Session Tracking Engine** | `HttpSession`, Cookies, State | Live visitor session counter; creation time and last accessed timestamps; cookie inspection (`JSESSIONID`). |
| `/wt-lab/exercise-6a` | **Three-Tier Database Persistence** | JSP, JDBC, SQL Server | Form submission through `career.jsp`; JDBC `PreparedStatement` insertion into SQL Server; results rendering via `career-result.jsp`. |
| `/wt-lab/exercise-6b` | **MVC Architecture with DAOs & Servlets** | Java MVC, DAO Pattern, JSPs | Controller servlet (`CareerServlet6B`); Model (`CareerProfile`); DAO (`CareerProfileDAO`); View (`profile.jsp`, `profile-result.jsp`). |
| `/wt-lab/exercise-7` | **XML Schema & XSL Transformation** | XML, XSD, XSLT, DOM Parser | Authoritative `career.xml` candidate dataset; XML Schema validation (`career.xsd`); XSLT styling into formatted HTML table (`career.xsl`). |

Each lab exercise page includes:
1. **Interactive Demo Tab:** Live, working UI executing the exercise logic.
2. **Source Code Tab:** Syntax-highlighted viewer showing the exact lab code (`.html`, `.css`, `.java`, `.jsp`, `.xml`, `.xsd`, `.xsl`).
3. **Lab Manual Documentation:** Objectives, algorithms, prerequisites, and expected viva-voce questions.
