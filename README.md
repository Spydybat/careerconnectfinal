# Career Connect — AI Career Intelligence Platform & Web Technology Lab Suite

> **Web Technology Lab Integration (CS3481 / 2026)**  
> **Author:** Kalaiyarasan K (Reg. No: 9943)  
> All 7 Web Technology laboratory exercises (Ex 1 to 7 including Ex 5A, 5B, 6A, 6B) have been implemented, tested, and integrated into Career Connect while fully preserving the original user interface and platform features.

---

## 🚀 Cloud Deployment & Production Hosting Guide

### 📦 GitHub Repository
**Primary Repository:** [https://github.com/Spydybat/careerconnectfinal.git](https://github.com/Spydybat/careerconnectfinal.git)  
**Production Branch:** `main`

---

### 🌐 Architecture Overview & Decoupled Hosting Model

Career Connect operates on a modern enterprise decoupled architecture:
1. **Frontend Client Application:** Built with **React 18 + Vite + TypeScript + TanStack Router & Tailwind CSS**. Optimized for serverless global edge deployment on **Vercel**.
2. **Backend Services & Persistence:** Built with native **Java Servlets 3.1 (`AuthServlet`, `CareerServlet`, `SessionTrackingServlet`)** running in an **Apache Tomcat 9** container with JDBC connectivity.
3. **Database Tier:** **Microsoft SQL Server 2022** storing persistent user credentials (`CareerUsers`), hashed passwords, session logs, and multi-tier candidate profiles (`CareerProfiles`).

---

### ⚡ Vercel Deployment Instructions (Frontend)

To deploy the frontend to Vercel:

1. **Import Project into Vercel:**
   - Log into your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** > **Project**.
   - Select and import the GitHub repository: `Spydybat/careerconnectfinal`.

2. **Configure Build Settings:**
   - **Framework Preset:** `Other` (or `Vite`)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.vercel/output/static` (Nitro automatically builds for Vercel Build Output API v3)
   - **Install Command:** `npm install`

3. **Configure Environment Variables in Vercel:**
   In your Vercel Project Settings > **Environment Variables**, configure the following:

   | Variable Name | Required | Description | Example / Default |
   | :--- | :--- | :--- | :--- |
   | `VITE_BACKEND_URL` | **Yes (in Prod)** | Base URL of your deployed Java Tomcat backend | `https://your-career-connect-backend.onrender.com` |
   | `VITE_API_URL` | Optional | Alias for `VITE_BACKEND_URL` | `https://your-career-connect-backend.onrender.com` |
   | `NODE_ENV` | Yes | Node runtime mode | `production` |
   | `VITE_SUPABASE_URL` | Optional | Supabase client endpoint | `https://placeholder-career-connect.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional | Supabase publishable key | `sb_publishable_placeholder_career_connect_key_123456789` |

4. **Deploy:**
   - Click **Deploy**. Vercel will bundle the application and issue a live URL (e.g., `https://careerconnectfinal.vercel.app`).
   - Client-side navigation, deep links (`/dashboard`, `/opportunities`, `/admin/dashboard`), and page refreshes are handled seamlessly via `vercel.json` and Nitro SPA routing.

---

### ☕ Java Backend Hosting Instructions (Tomcat & SQL Server)

The Java Servlets require a JVM servlet container (Apache Tomcat 9.0.x or 10.1.x) and direct network access to the Microsoft SQL Server database. Because Vercel only executes Node.js/Python serverless functions, the Java backend is hosted separately:

#### Recommended Java Hosting Platforms:
- **Render.com / Railway.app:** Deploy using the provided `Dockerfile` or Tomcat container.
- **AWS Elastic Beanstalk:** Deploy Tomcat 9 platform by uploading `CareerConnect/WebApplication/CareerConnect.war`.
- **Azure App Service (Linux / Tomcat 9):** Native Tomcat container with managed SQL Server integration.
- **DigitalOcean App Platform / Linux VPS:** Run Apache Tomcat 9 directly with `catalina.bat run` or systemd service.

#### Pre-packaged Deployable WAR Archive:
The pre-compiled, production-ready WAR is located at:
`CareerConnect/WebApplication/CareerConnect.war`

To deploy to any standard Tomcat server:
```bash
# Copy WAR to Tomcat webapps folder:
cp CareerConnect/WebApplication/CareerConnect.war /opt/tomcat/webapps/ROOT.war
```

#### CORS & Cookie Configuration:
`AuthServlet.java` and `CareerServlet.java` are pre-configured with origin-echoing CORS and `Access-Control-Allow-Credentials: true`:
- The backend automatically permits cross-origin session cookies from `https://*.vercel.app` as well as local origins (`http://localhost:8080`).

---

### 🗄️ Database Requirements (Microsoft SQL Server 2022)

The backend connects via JDBC `mssql-jdbc-12.8.1.jre11.jar` to SQL Server. Ensure the following tables exist:
1. **`CareerUsers`**: Stores `id`, `fullName`, `email`, `password` (SHA-256 hashed with salt), `role` (`candidate`, `admin`, `employer`), `organization`, `status` (`active`, `suspended`), `lastLoginAt`, `createdAt`.
2. **`CareerProfiles`**: Stores candidate profiles (`id`, `name`, `email`, `phone`, `education`, `skills`, `careerGoal`, `experience`, `submissionTime`).

---

### 💻 Local Development Setup

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Run Local Tomcat Backend (Port 8085):**
   ```powershell
   cmd.exe /c "set JAVA_HOME=C:\Program Files\Java\jdk-26.0.2& set CATALINA_HOME=d:\Downloads\WTCC2\apache-tomcat-9.0.86& d:\Downloads\WTCC2\apache-tomcat-9.0.86\bin\catalina.bat run"
   ```

3. **Run Frontend Dev Server (Port 8080):**
   ```bash
   npm run dev -- --host 0.0.0.0 --port 8080
   ```

4. **Execute Verification Suites:**
   ```bash
   # Run Vitest test suite (153 tests):
   npm test -- --run

   # Run TypeScript compilation:
   npx tsc --noEmit

   # Run production build:
   npm run build
   ```

### Quick Links to Web Technology Lab

- **WT Lab Dashboard:** Navigate to `/wt-lab` in the browser or click **WT Lab Suite** in the navigation header.
- **Standalone Java Web Server:** `wt-lab/java-web/EmbeddedLabServer.java` (Port 8085)
- **Java XML Processor:** `wt-lab/xml/XmlProcessor.java` (Validates `career.xml` vs `career.xsd` and transforms with `career.xsl`)
- **SQL Server Database DDL:** `wt-lab/database/schema.sql` (Creates `CareerProfiles` table)
- **Detailed Lab Manual & Mapping:** See [`wt-lab/README.md`](file:///wt-lab/README.md) and [`wt-lab/docs/TOMCAT_SETUP_GUIDE.md`](file:///wt-lab/docs/TOMCAT_SETUP_GUIDE.md)

| Exercise       | Module Name                       | Route                 | Technologies                              |
| :------------- | :-------------------------------- | :-------------------- | :---------------------------------------- |
| **EX.NO.1**    | HTML Image Map                    | `/wt-lab/exercise-1`  | HTML5 Image Map                           |
| **EX.NO.2**    | Types of Cascading Style Sheets   | `/wt-lab/exercise-2`  | Inline, Internal, External CSS            |
| **EX.NO.3**    | Client-Side DHTML Form Validation | `/wt-lab/exercise-3`  | DHTML, Regex, Form Controls               |
| **EX.NO.4**    | Apache Tomcat Installation        | `/wt-lab/exercise-4`  | Apache Tomcat 9/10, JVM                   |
| **EX.NO.5(A)** | Invoke Servlets from HTML Forms   | `/wt-lab/exercise-5a` | HTML, CareerServlet, web.xml              |
| **EX.NO.5(B)** | Session Tracking Using Servlets   | `/wt-lab/exercise-5b` | Servlet, HttpSession, Session ID          |
| **EX.NO.6(A)** | Three-Tier JSP & Database         | `/wt-lab/exercise-6a` | career.jsp, career-result.jsp, SQL Server |
| **EX.NO.6(B)** | Three-Tier MVC Architecture       | `/wt-lab/exercise-6b` | CareerProfile (Model), DAO, Servlet, JSP  |
| **EX.NO.7**    | XML, XSD Validation & XSL Display | `/wt-lab/exercise-7`  | career.xml, career.xsd, career.xsl        |

---

Senior Solution Architect & Tech Lead Execution Plan

Project: Career Connect — AI Career Intelligence Platform
Execution Model: Agile + Iterative + Risk-Based
Planned Duration: 24 Weeks / 120 Working Days
Primary Goal: Build a production-oriented academic MVP that can evolve into a SaaS platform
Implementation Rule: No code should be written before the corresponding architecture, contract, schema, or acceptance criteria is defined.

1. Implementation Strategy

The project will be implemented in this order:

PRODUCT FOUNDATION
↓
REPOSITORY + DEVOPS FOUNDATION
↓
DATABASE / OLTP
↓
BACKEND CORE
↓
FRONTEND CORE
↓
DATA LAKE
↓
ETL
↓
DATA WAREHOUSE
↓
DATA MARTS + SEMANTIC LAYER
↓
AI
↓
DASHBOARDS
↓
SECURITY HARDENING
↓
TESTING
↓
CLOUD DEPLOYMENT
↓
MONITORING + LOGGING
↓
FINAL INTEGRATION
↓
DOCUMENTATION + DEMO

The most important architectural rule is:

Database before Analytics
Data before AI
Warehouse before BI
Security before Production
Testing before Final Release

2. Target Technology Stack

Frontend

Next.js
TypeScript
Tailwind CSS
shadcn/ui
Recharts / charting layer

Backend

Node.js
NestJS
TypeScript
REST APIs
OpenAPI

AI

Python
FastAPI
Background Workers
OpenAI / Gemini / Claude abstraction
Structured Output
RAG / Tool Calling where needed

Database

PostgreSQL
Supabase
Supabase Auth
Row-Level Security where appropriate

Data Engineering

Python
SQL
Data Lake
Cloud Object Storage
ETL / ELT
Data Quality
Scheduling

Warehouse

BigQuery
or
Snowflake

Cloud / DevOps

Vercel
Render / equivalent container platform
Docker
GitHub
GitHub Actions
Managed Secrets
Managed Monitoring

3. Final Folder Structure

The implementation should use this canonical structure:

career-connect-ai-platform/

├── apps/
│ ├── web/
│ └── admin/
│
├── services/
│ ├── api/
│ ├── ai/
│ ├── worker/
│ ├── reporting/
│ ├── notification/
│ └── analytics/
│
├── packages/
│ ├── ui/
│ ├── types/
│ ├── config/
│ ├── auth/
│ ├── validation/
│ ├── logger/
│ └── api-client/
│
├── database/
│ ├── migrations/
│ ├── seeds/
│ ├── policies/
│ ├── functions/
│ ├── views/
│ └── indexes/
│
├── etl/
│ ├── sources/
│ ├── ingestion/
│ ├── transformations/
│ ├── validation/
│ ├── deduplication/
│ ├── incremental/
│ ├── reconciliation/
│ ├── orchestration/
│ └── tests/
│
├── warehouse/
│ ├── staging/
│ ├── dimensions/
│ ├── facts/
│ ├── marts/
│ ├── semantic/
│ └── tests/
│
├── ai/
│ ├── prompts/
│ ├── evaluation/
│ ├── datasets/
│ └── research/
│
├── dashboard/
│ ├── definitions/
│ ├── metrics/
│ ├── filters/
│ └── exports/
│
├── infrastructure/
│ ├── environments/
│ ├── networking/
│ ├── database/
│ ├── storage/
│ ├── warehouse/
│ └── monitoring/
│
├── docker/
│ ├── web/
│ ├── api/
│ ├── ai/
│ ├── worker/
│ ├── etl/
│ └── reporting/
│
├── scripts/
│ ├── dev/
│ ├── database/
│ ├── data/
│ ├── testing/
│ └── deployment/
│
├── tests/
│ ├── unit/
│ ├── integration/
│ ├── contract/
│ ├── e2e/
│ ├── security/
│ ├── performance/
│ ├── accessibility/
│ └── data/
│
├── data/
│ ├── synthetic/
│ ├── reference/
│ └── samples/
│
├── notebooks/
│ ├── exploratory/
│ ├── ai/
│ ├── analytics/
│ └── research/
│
├── docs/
│
└── .github/
├── workflows/
├── ISSUE_TEMPLATE/
├── CODEOWNERS
├── PULL_REQUEST_TEMPLATE.md
└── dependabot.yml

4. Development Phase Structure

PhaseWeeksPrimary OutputPhase 01Project setupPhase 12Requirements + architecturePhase 23–4UI + foundationPhase 35–8Core applicationPhase 49–12Data platformPhase 513–15AIPhase 616BI dashboardsPhase 717Security hardeningPhase 818–19TestingPhase 920CI/CD + cloudPhase 1021Monitoring + loggingPhase 1122–23StabilizationPhase 1224Final release

5. Sprint Planning Model

Use 2-week sprints.

Sprint 1

Foundation

Sprint 2

Application shell + authentication

Sprint 3

Student + profile

Sprint 4

Resume + careers + jobs

Sprint 5

Recruitment + placements

Sprint 6

Database + warehouse foundation

Sprint 7

ETL + data quality

Sprint 8

AI resume + skills

Sprint 9

Career + matching + learning AI

Sprint 10

BI dashboards

Sprint 11

Security + testing

Sprint 12

Cloud + production + final stabilization

6. Milestone Plan

M1 — Engineering Foundation

End of Week 2

Must have:

GitHub
Monorepo
Architecture
Local Development
Docker
CI Skeleton

M2 — Core Platform

End of Week 8

Must have:

Authentication
Student
Resume
Career
Jobs
Applications
Recruiter
Placement

M3 — Data Platform

End of Week 12

Must have:

Data Lake
ETL
Data Quality
Warehouse
Star Schema
Facts
Dimensions
Data Marts

M4 — AI Intelligence

End of Week 15

Must have:

Resume AI
Skill Extraction
Skill Gap
Career Recommendation
Learning Recommendation
Job Matching
Career Assistant

M5 — BI Platform

End of Week 16

Must have:

Student Dashboard
Recruiter Dashboard
Placement Dashboard
Executive Dashboard
Skill Intelligence
Salary Intelligence

M6 — Production Readiness

End of Week 20

Must have:

Security
Testing
CI/CD
Cloud
Monitoring
Logging

M7 — Final Release

End of Week 24

Must have:

Integrated Product
Cloud Deployment
Test Report
Documentation
README
Demo
Presentation

7. Database Implementation Order

The OLTP database must be implemented before the analytical warehouse.

Database Layer 1 — Foundation

Create:

users
organizations
roles
permissions
role_permissions
user_roles

Database Layer 2 — Reference Data

Create:

countries
locations
employment_types
experience_levels
industries
technologies
skill_categories

Database Layer 3 — Career Domain

Create:

skills
careers
career_skills
courses
course_skills
certifications

Database Layer 4 — Student Domain

Create:

students
education
projects
student_skills
student_certifications
career_goals

Database Layer 5 — Resume Domain

Create:

resumes
resume_versions
resume_analysis
resume_extracted_skills

Database Layer 6 — Company Domain

Create:

companies
company_users
recruiters

Database Layer 7 — Job Domain

Create:

jobs
job_skills
job_locations

Database Layer 8 — Recruitment Domain

Create:

applications
application_events
interviews
interview_feedback
offers

Database Layer 9 — Placement Domain

Create:

placements
placement_verification

Database Layer 10 — Learning Domain

Create:

learning_enrollments
learning_progress
learning_events

Database Layer 11 — Analytics Support

Create:

reports
report_jobs
saved_views
dashboard_preferences

Database Layer 12 — Platform Governance

Create:

audit_logs
notifications
feature_flags
integration_configs

8. Database Implementation Rules

Every table should be reviewed for:

Primary Key
Foreign Keys
Unique Constraints
Indexes
Timestamps
Soft Delete where required
Tenant Scope
Audit Requirements

9. Database Implementation Sequence

The implementation dependency should be:

Users
↓
Organizations
↓
Roles
↓
Reference Data
↓
Students
↓
Companies
↓
Jobs
↓
Applications
↓
Interviews
↓
Placements
↓
Learning
↓
Reports
↓
Audit

10. Data Warehouse Implementation Order

Do not begin by creating all fact tables.

First establish the analytical foundation.

Step 1

Create warehouse environments:

dev
staging
production

Step 2

Create staging schemas.

Step 3

Create dim_date.

Step 4

Create core dimensions.

dim_student
dim_company
dim_skill
dim_job
dim_college
dim_location
dim_technology
dim_course
dim_recruiter

Step 5

Implement SCD strategy.

Step 6

Create facts.

fact_applications
fact_placements
fact_salaries
fact_interviews
fact_hiring
fact_learning
fact_certifications

Step 7

Create data marts.

placement_mart
hiring_mart
skill_mart
salary_mart
student_mart
learning_mart

Step 8

Create semantic metrics.

11. Data Warehouse Dependency

Source
↓
Staging
↓
Dimensions
↓
Facts
↓
Data Marts
↓
Metrics
↓
Dashboards

12. ETL Implementation Order

ETL must be implemented incrementally.

ETL Phase 1 — Pipeline Framework

Build:

Pipeline Runner
Configuration
Logging
Batch IDs
Error Handling
Retry

ETL Phase 2 — Source Connectors

Implement:

CSV
JSON
Database
API
Object Storage

ETL Phase 3 — Raw Ingestion

Load into:

data-lake/raw/

ETL Phase 4 — Data Cleaning

Implement:

Null Handling
Type Conversion
String Normalization
Date Normalization
Salary Normalization
Location Normalization

ETL Phase 5 — Deduplication

Implement:

Business Key
Source ID
Duplicate Detection
Merge Rules

ETL Phase 6 — Skill Normalization

Example:

ReactJS → React
Postgres → PostgreSQL
AWS Cloud → AWS

ETL Phase 7 — Validation

Implement:

Schema Validation
Completeness
Validity
Uniqueness
Referential Integrity
Business Rules

ETL Phase 8 — Quarantine

Invalid data:

curated/

must not automatically contain records that fail critical quality rules.

Move them into:

quarantine/

where appropriate.

ETL Phase 9 — Incremental Loading

Implement:

Watermark
Last Updated
Source Timestamp
Change Detection

ETL Phase 10 — Warehouse Loading

Load:

Dimensions
Facts
Marts

ETL Phase 11 — Reconciliation

Compare:

Source Count
vs
Raw Count
vs
Curated Count
vs
Warehouse Count

13. Backend API Implementation Order

Backend implementation must follow domain dependencies.

Layer 1 — Infrastructure

Configuration
Logging
Error Handling
Validation
Authentication
Authorization
Database Connection

Layer 2 — Users

Users
Organizations
Roles
Permissions

Layer 3 — Student

Profile
Education
Projects
Skills
Certifications

Layer 4 — Resume

Upload
Version
Analysis

Layer 5 — Career

Career Catalog
Career Requirements
Career Goals

Layer 6 — Jobs

Job CRUD
Search
Filters
Job Skills

Layer 7 — Applications

Apply
Withdraw
Status
Events

Layer 8 — Recruitment

Candidate Search
Shortlisting
Interview
Offers

Layer 9 — Placement

Placement
Verification
Analytics Support

Layer 10 — Learning

Courses
Enrollment
Progress
Recommendations

Layer 11 — Analytics

KPIs
Filters
Dashboard Queries
Exports

Layer 12 — AI

AI Gateway
AI Requests
AI Context

14. Frontend Implementation Order

The frontend must not be built screen-by-screen randomly.

Build by reusable system layers.

Frontend Phase 1

App Shell
Navigation
Theme
Typography
Spacing
Responsive Grid

Phase 2

Reusable components:

Button
Card
Modal
Table
Badge
KpiCard
ChartCard
FilterBar
DataTable
Loading
Error
Empty State

Phase 3

Authentication:

Login
Register
OAuth
Protected Routes
Role Redirect

Phase 4

Student:

Dashboard
Profile
Skills
Resume
Career
Learning
Jobs
Applications

Phase 5

Recruiter:

Dashboard
Jobs
Candidates
Interviews
Offers
Analytics

Phase 6

College:

Placement
Students
Companies
Skills
Reports

Phase 7

Executive:

Executive Dashboard
Market
Salary
Skill
Hiring

Phase 8

Admin:

Users
Roles
Audit
ETL
Data Quality
System Health

15. AI Implementation Order

AI should only begin after the profile, skills, career taxonomy, and core data are available.

AI Phase 1 — Provider Abstraction

Implement:

AIProvider
OpenAI Provider
Gemini Provider
Claude Provider
Provider Router

AI Phase 2 — Common AI Infrastructure

Implement:

Prompt Registry
Schemas
Validation
Request IDs
Usage Tracking
Timeouts
Retry

AI Phase 3 — Resume AI

Text Extraction
Section Detection
Skill Extraction
Skill Normalization
Resume Scoring
Recommendations

AI Phase 4 — Skill Gap

Current Skill +
Required Skill
↓
Gap
↓
Priority

AI Phase 5 — Career Recommendation

Student Context +
Career Taxonomy +
Market Data
↓
Candidate Careers
↓
Ranking
↓
Explanation

AI Phase 6 — Learning Recommendation

Skill Gap
↓
Course Mapping
↓
Priority
↓
Learning Roadmap

AI Phase 7 — Job Matching

Student +
Job
↓
Match
↓
Explanation

AI Phase 8 — Career Assistant

Intent
↓
Context
↓
Tool Selection
↓
Model
↓
Validation

AI Phase 9 — Mock Interview

Implement only after core AI is stable.

AI Phase 10 — Natural-Language BI

Implement last among the major AI features because it depends on:

Warehouse
Semantic Layer
Metric Dictionary
Authorization

16. Dashboard Implementation Order

Implement dashboards from highest business value.

Dashboard 1

Student Dashboard

Dashboard 2

Recruiter Dashboard

Dashboard 3

Placement Dashboard

Dashboard 4

Executive Dashboard

Dashboard 5

Skill Intelligence

Dashboard 6

Salary Intelligence

Dashboard 7

Job Market

Dashboard 8

Learning Intelligence

Dashboard 9

AI Intelligence

Dashboard 10

Data Quality

Dashboard 11

ETL Monitoring

Dashboard 12

Admin

17. Dashboard Implementation Pattern

Every dashboard should follow:

Page
↓
Header
↓
Filters
↓
KPI Cards
↓
Primary Insight
↓
Charts
↓
Detailed Table
↓
Export
↓
Freshness Metadata

18. Dashboard Development Rule

Never create a KPI directly in the frontend.

Use:

Warehouse Metric
↓
Semantic Layer
↓
Analytics API
↓
Dashboard

This prevents inconsistent numbers.

19. Cloud Deployment Order

Cloud deployment should happen progressively.

Step 1

GitHub repository.

Step 2

Local Docker.

Step 3

Staging environment.

Step 4

Supabase/PostgreSQL.

Step 5

Object Storage.

Step 6

Warehouse.

Step 7

Backend deployment.

Step 8

AI service.

Step 9

Workers.

Step 10

Frontend.

Step 11

CI/CD.

Step 12

Monitoring.

Step 13

Production.

20. Cloud Environment Order

Development
↓
Staging
↓
Production

Never configure production first.

21. Cloud Deployment Dependency

Database
↓
Backend
↓
AI
↓
Workers
↓
Frontend
↓
ETL
↓
Warehouse
↓
Dashboards

22. Testing Plan

Testing begins on Day 1, not Week 20.

Continuous Testing

Unit
Component
API
Integration
AI Evaluation
ETL
Warehouse
Security

Final Testing

E2E
Performance
Accessibility
UAT
Smoke

23. Test Priority

P0

Authentication
Authorization
Tenant Isolation
Database Integrity
Applications
Placements
AI Data Security
Warehouse Metrics

P1

Resume
Recruitment
Learning
Reports
Dashboards

P2

Optional Advanced Features

24. GitHub Commit Plan

Use small, meaningful, domain-based commits.

Foundation

chore: initialize monorepo
chore: configure workspace
chore: add docker development stack
ci: add base github actions

Database

feat(db): add organization schema
feat(db): add student schema
feat(db): add job schema
feat(db): add application schema
feat(db): add placement schema

Backend

feat(api): add authentication
feat(api): add student profile
feat(api): add skill management
feat(api): add resume endpoints
feat(api): add job search
feat(api): add applications

AI

feat(ai): add provider abstraction
feat(ai): add resume extraction
feat(ai): add skill extraction
feat(ai): add skill gap engine
feat(ai): add career recommendation
feat(ai): add learning recommendation
feat(ai): add job matching
feat(ai): add career assistant

Data

feat(etl): add jobs ingestion
feat(etl): add data validation
feat(etl): add skill normalization
feat(etl): add incremental loading
feat(dw): add student dimension
feat(dw): add placement fact
feat(dw): add placement mart

BI

feat(bi): add student dashboard
feat(bi): add placement dashboard
feat(bi): add executive dashboard

Security

security: add tenant isolation
security: harden resume access
security: add audit logging
security: add api rate limiting

Deployment

chore(devops): add production docker
ci: add staging deployment
ci: add production deployment
ops: add health checks
ops: add monitoring

25. Commit Rules

Avoid:

final changes
final code
all changes
project completed

Prefer:

feat(api): add interview scheduling
fix(ai): reject invalid career score
data(etl): add job deduplication
security(api): restrict resume download
test(dw): validate placement grain

26. Daily Development Checklist

Every development day should begin with:

□ Check current sprint goal
□ Check assigned issue
□ Read relevant architecture document
□ Identify dependencies
□ Confirm test data
□ Confirm acceptance criteria

During development:

□ Work on one bounded task
□ Keep changes modular
□ Validate inputs
□ Follow naming conventions
□ Add logs where necessary
□ Add tests with the feature

Before committing:

□ Run tests
□ Run lint
□ Check type errors
□ Check security implications
□ Check data impact
□ Review diff
□ Remove debug code

Before pushing:

□ Commit message is meaningful
□ No secrets
□ No generated junk
□ No production data
□ Documentation updated where needed

End of day:

□ Push changes
□ Update issue
□ Record blockers
□ Record decisions
□ Note tomorrow's first task

27. Day-by-Day Implementation Plan

Day 1 — Project Kickoff

Define team roles
Confirm repository name
Create GitHub repository
Create project board
Create README skeleton

Output: Empty but professional repository.

Day 2 — Repository Architecture

Create folders
Create workspace configuration
Create docs structure
Create issue templates
Create PR template
Create CODEOWNERS

Output: Repository skeleton.

Day 3 — Development Environment

Configure Node
Configure Python
Configure Docker
Configure local environment
Configure linting
Configure formatting

Output: All developers can run the project.

Day 4 — CI Foundation

GitHub Actions
Lint workflow
Type-check workflow
Basic test workflow

Output: First green CI pipeline.

Day 5 — Architecture Review

Review system architecture
Confirm service boundaries
Confirm database ownership
Confirm cloud responsibilities

Output: Architecture baseline locked.

28. Week 2 — Database Foundation

Day 6

Create:

users
organizations
roles
permissions

Day 7

Create:

reference data
locations
skills
technologies
career categories

Day 8

Create:

students
education
projects
student_skills
certifications

Day 9

Create:

companies
recruiters
jobs
job_skills

Day 10

Create:

applications
interviews
offers
placements

Milestone: Core relational model exists.

29. Week 3 — Authentication + Backend

Day 11

Supabase Auth integration.

Day 12

Session validation.

Day 13

RBAC foundation.

Day 14

User APIs.

Day 15

Organization APIs.

Milestone: Secure backend foundation.

30. Week 4 — Frontend Foundation

Day 16

Next.js app shell.

Day 17

Navigation.

Day 18

Design system.

Day 19

Reusable components.

Day 20

Authentication pages.

Milestone: Frontend platform shell complete.

31. Week 5 — Student Module

Day 21

Student profile.

Day 22

Education.

Day 23

Projects.

Day 24

Skills.

Day 25

Certifications.

32. Week 6 — Resume + Career

Day 26

Resume upload UI.

Day 27

Resume storage.

Day 28

Resume metadata/versioning.

Day 29

Career catalog.

Day 30

Career detail page.

33. Week 7 — Jobs

Day 31

Job creation API.

Day 32

Job listing.

Day 33

Job search.

Day 34

Filters.

Day 35

Job detail page.

34. Week 8 — Applications + Recruiter

Day 36

Apply flow.

Day 37

Application status.

Day 38

Recruiter dashboard.

Day 39

Candidate listing.

Day 40

Shortlisting + interview structure.

Milestone: Core application workflow complete.

35. Week 9 — Placement

Day 41

Placement database/API.

Day 42

Placement verification.

Day 43

Placement officer UI.

Day 44

Placement summary.

Day 45

Placement data validation.

36. Week 10 — Data Lake

Day 46

Cloud storage.

Day 47

Raw folder structure.

Day 48

Synthetic data generation.

Day 49

Source ingestion.

Day 50

Raw dataset validation.

Milestone: Data lake operational.

37. Week 11 — ETL

Day 51

ETL framework.

Day 52

Cleaning.

Day 53

Normalization.

Day 54

Deduplication.

Day 55

Validation + quarantine.

38. Week 12 — Warehouse

Day 56

Warehouse setup.

Day 57

dim_date.

Day 58

Core dimensions.

Day 59

Fact tables.

Day 60

Data marts + reconciliation.

Milestone: Complete data platform.

39. Week 13 — AI Foundation

Day 61

Python AI service.

Day 62

Provider abstraction.

Day 63

Prompt registry.

Day 64

AI schemas.

Day 65

AI validation + logging.

40. Week 14 — Resume AI

Day 66

Text extraction.

Day 67

Resume parsing.

Day 68

Skill extraction.

Day 69

Skill normalization.

Day 70

Resume score + recommendations.

41. Week 15 — Career AI

Day 71

Skill gap engine.

Day 72

Career ranking.

Day 73

Career explanation.

Day 74

Learning recommendation.

Day 75

Job matching.

Milestone: Core AI recommendation engine.

42. Week 16 — Career Assistant + BI

Day 76

Career assistant intent detection.

Day 77

Tool calling/context.

Day 78

Student dashboard.

Day 79

Recruiter dashboard.

Day 80

Placement dashboard.

43. Week 17 — BI Expansion

Day 81

Executive dashboard.

Day 82

Skill intelligence.

Day 83

Salary intelligence.

Day 84

Job market dashboard.

Day 85

Learning / AI dashboard.

Milestone: BI layer complete.

44. Week 18 — Security

Day 86

Tenant isolation.

Day 87

RLS/policies.

Day 88

Rate limiting.

Day 89

Secure file access.

Day 90

Audit logs + security tests.

45. Week 19 — Testing

Day 91

Unit tests.

Day 92

API tests.

Day 93

Integration tests.

Day 94

AI evaluation.

Day 95

ETL + warehouse tests.

46. Week 20 — E2E + Security + Performance

Day 96

E2E student flow.

Day 97

E2E recruiter flow.

Day 98

Placement flow.

Day 99

Security regression.

Day 100

Performance baseline.

Milestone: Release candidate quality baseline.

47. Week 21 — Cloud Deployment

Day 101

Staging infrastructure.

Day 102

Backend deployment.

Day 103

AI/worker deployment.

Day 104

Frontend deployment.

Day 105

Warehouse + ETL deployment.

48. Week 22 — CI/CD + Monitoring

Day 106

Production CI/CD.

Day 107

Health endpoints.

Day 108

Structured logging.

Day 109

Metrics.

Day 110

Alerts + monitoring dashboards.

Milestone: Production platform operational.

49. Week 23 — Stabilization

Day 111

Fix critical bugs.

Day 112

Fix data discrepancies.

Day 113

Optimize API/database.

Day 114

Optimize dashboards/AI.

Day 115

Full regression.

50. Week 24 — Final Release

Day 116

Final security review.

Day 117

Final deployment validation.

Day 118

Screenshots + documentation.

Day 119

Final presentation + viva preparation.

Day 120

Production demo + submission archive.

Final Milestone: Career Connect v1.0.

51. Daily Definition of Done

A task is considered complete only when:

1. Requirement understood
2. Implementation completed
3. Test added
4. Test passed
5. Security impact checked
6. Data impact checked
7. Documentation updated
8. Git commit created
9. PR/branch updated
10. No unresolved blocker remains

11. Weekly Definition of Done

A sprint is complete when:

Feature Complete +
Tests Complete +
Integration Complete +
Documentation Updated +
Demo Ready

53. Release Definition of Done

The project is complete only when:

✓ Core workflows work
✓ AI works
✓ Data warehouse works
✓ ETL works
✓ BI works
✓ Security works
✓ Cloud deployment works
✓ CI/CD works
✓ Monitoring works
✓ Logging works
✓ Testing is documented
✓ README is complete
✓ Demo is reproducible

54. Final Integration Sequence

The final end-to-end validation must follow this order:

1. User Login
   ↓
2. Student Profile
   ↓
3. Skills
   ↓
4. Resume
   ↓
5. Resume AI
   ↓
6. Skill Gap
   ↓
7. Career Recommendation
   ↓
8. Learning Recommendation
   ↓
9. Job Matching
   ↓
10. Application
    ↓
11. Recruiter Workflow
    ↓
12. Interview
    ↓
13. Placement
    ↓
14. ETL
    ↓
15. Warehouse
    ↓
16. Dashboard
    ↓
17. Report
    ↓
18. Monitoring

19. Final Go-Live Checklist

Product

□ Core workflows complete
□ Error states complete
□ Empty states complete
□ Mobile validated

Data

□ ETL complete
□ Data quality complete
□ Warehouse reconciled
□ Metrics verified

AI

□ Provider abstraction
□ Evaluation
□ Guardrails
□ Logging
□ Usage tracking

Security

□ Authentication
□ RBAC
□ Tenant isolation
□ Secure uploads
□ Audit
□ Secrets

Cloud

□ Staging
□ Production
□ CI/CD
□ Backups
□ Monitoring

Documentation

□ 40 documents
□ README
□ Architecture diagrams
□ Test report
□ Deployment guide

56. Final Tech Lead Rule

During implementation, always resolve dependencies in this order:

Can the data exist?
↓
Can the backend access it?
↓
Can the frontend use it?
↓
Can ETL transform it?
↓
Can the warehouse analyze it?
↓
Can AI interpret it?
↓
Can BI visualize it?
↓
Can security protect it?
↓
Can operations monitor it?

This prevents building disconnected features.

57. Final Implementation Sequence

The entire project can be remembered using this master sequence:

PLAN
↓
ARCHITECT
↓
STRUCTURE
↓
DATABASE
↓
BACKEND
↓
FRONTEND
↓
DATA LAKE
↓
ETL
↓
WAREHOUSE
↓
AI
↓
BI
↓
SECURITY
↓
TEST
↓
DEPLOY
↓
MONITOR
↓
STABILIZE
↓
DOCUMENT
↓
DEMO

58. Final Senior Architect Recommendation

The biggest implementation risk is attempting to build all enterprise features simultaneously.

The recommended strategy is to build one vertical slice first:

Student
→ Profile
→ Skills
→ Resume
→ Career
→ Job
→ Application

Then establish the:

Data Pipeline
→ Warehouse
→ Dashboard

Then add:

AI Intelligence

Then add:

Enterprise Security
→ Cloud
→ Monitoring

This produces a working product early while preserving the final enterprise architecture.

59. Final Project Outcome

At the end of Day 120, Career Connect should demonstrate:

A real full-stack application +
A real cloud deployment +
A real PostgreSQL data model +
A real ETL pipeline +
A real data warehouse +
Real analytical dashboards +
Working AI features +
Role-based security +
Automated CI/CD +
Testing +
Monitoring +
Professional GitHub repository

That combination is what turns the project from a college CRUD application into a credible AI + Cloud + Data Engineering + BI portfolio platform.

60. Master Roadmap Summary

AreaImplementation OrderFolder StructureDay 1–2Development EnvironmentDay 3–4ArchitectureDay 5DatabaseDay 6–10BackendDay 11–15, then continuouslyFrontendDay 16–20, then continuouslyStudent/Core ProductDay 21–45Data LakeDay 46–50ETLDay 51–55WarehouseDay 56–60AI FoundationDay 61–65AI FeaturesDay 66–75DashboardsDay 76–85SecurityDay 86–90TestingDay 91–100CloudDay 101–105CI/CDDay 106MonitoringDay 107–110StabilizationDay 111–115Final ReleaseDay 116–120

61. Final Architect Decision

The implementation should be executed as a dependency-driven product build, not as 40 independent documentation items.

The actual engineering dependency is:

Documentation
↓
Architecture
↓
Repository
↓
Database
↓
APIs
↓
Frontend
↓
Data Platform
↓
AI
↓
BI
↓
Security
↓
Testing
↓
Cloud
↓
Operations
↓
Final Product

This is the master implementation roadmap for Career Connect.

---

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a5592ea-0f88-4437-8d63-210eeb4174d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
