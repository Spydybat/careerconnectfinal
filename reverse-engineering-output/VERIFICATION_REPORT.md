# Career Connect — Reverse-Engineering Verification Report

This document records the verification methodology, confirmed findings, test results, inferences, limitations, and safety audit conducted during the reverse-engineering of Career Connect.

---

## 1. Verified Findings & Evidence Table

| Area | Component / Feature | Inspection Evidence | Verification Result |
| :--- | :--- | :--- | :---: |
| **Frontend Runtime** | React 19 + TypeScript + Vite | `package.json`, `vite.config.ts`, `src/routes/` | **VERIFIED** |
| **Design System** | Tailwind v4 with OKLCH tokens | `src/styles.css` (204 lines of custom tokens & utilities) | **VERIFIED** |
| **Type Integrity** | TypeScript Compiler Check | `npm run typecheck` completed with exit code `0` | **VERIFIED (0 errors)** |
| **Unit & Suite Tests** | Vitest Test Suite | `npm test` ran 11 test files, **153 passed (153 total)** | **VERIFIED (100% Pass)** |
| **Java Compilation** | Java 17 LTS Bytecode | Bytecode headers of all 11 classes inspected (major version = `61`) | **VERIFIED** |
| **Backend Packaging** | Deployable WAR Archive | `CareerConnect.war` (1,501,742 bytes, SHA-256 verified) | **VERIFIED** |
| **Live Backend API** | Render Deployment | `GET https://careerconnectfinal-3.onrender.com/AuthServlet?action=session` returned `200 OK` | **VERIFIED** |
| **CORS & Cookies** | Cross-Site Cookie Wrapping | `OPTIONS /AuthServlet` returns `Access-Control-Allow-Credentials: true` and `SameSite=None; Secure; HttpOnly` | **VERIFIED** |
| **Primary Database** | Microsoft SQL Server 2022 | Safe read-only JDBC query against `103.207.1.91:1433` on `CSE9943` returned 9 users, 16 profiles | **VERIFIED** |
| **Live Frontend** | Vercel Global Edge | `GET https://careerconnectfinal.vercel.app/` returned `200 OK` | **VERIFIED** |

---

## 2. Inferences vs. Direct Code Evidence

### A. Direct Evidence (100% Established from Project Files)
1. **Frontend Architecture:** The file structure, TanStack Router configurations, routes, and UI components in `src/` are 100% established directly from code.
2. **Java Servlet Implementation:** The full source of all 6 Java files, 2 DAOs, and deployment descriptors in `CareerConnect/WebApplication/` was read and analyzed.
3. **Database Schema:** The tables `dbo.CareerUsers` and `dbo.CareerProfiles` in SQL Server database `CSE9943` were directly verified via JDBC metadata and SQL statements.
4. **Session Error Handling:** The error handling in `RegisteredUserDirectory.tsx` distinguishing HTTP 401/403 from SQL Server connection errors was verified directly in source code and tested against Vitest.

### B. Inferences & Contextual Reconstruction
1. **Lovable Cloud Platform Connection:** The repository contains `.lovable/project.json` and Lovable config plugins. It is inferred that the project was originally scaffolded using Lovable and subsequently customized with native Java servlets and SQL Server integrations.
2. **Web Technology Lab Integration Context:** The author credit (`Kalaiyarasan K, Reg. No: 9943`) and lab manual alignment (CS3481) were inferred from comments in `schema.sql`, `CareerProfileDAO.java`, and `ALL CODE EX WISE IN WT .txt`.
3. **Supabase vs SQL Server Split:** The project maintains both Supabase migrations and SQL Server JDBC DAOs. The primary production authentication and lab persistence rely on SQL Server (`CSE9943`), while Supabase schemas exist for candidate applications and data warehouse pipelines.

---

## 3. Limitations & External Dependencies

1. **Third-Party AI API Keys:**
   - Real-time AI chat generation (`/ai/career-coach`, `/ai/mock-interview`) requires an active `LOVABLE_API_KEY` or OpenAI-compatible key. In environments where the key is not set, the AI router gracefully falls back or mocks responses as verified in `src/ai/__tests__/hardening.test.ts`.
2. **Browser Third-Party Cookie Policy:**
   - Because the frontend is hosted on `vercel.app` and the backend on `onrender.com`, browsers with strict third-party cookie blocking (e.g. Safari ITP, Brave, or Chrome Incognito) may reject cross-site session cookies unless a custom domain or reverse proxy is configured. The application mitigates this via `SameSite=None; Secure; HttpOnly` headers.
3. **Remote SQL Server Firewall:**
   - Microsoft SQL Server `103.207.1.91:1433` is a remote college laboratory server. Direct access requires that outbound port 1433 is open and not blocked by local network firewalls.

---

## 4. Documentation Artifacts Generated

All reverse-engineering deliverables were generated inside `reverse-engineering-output/`:

1. [`reverse-engineering-output/WEBSITE_OVERVIEW.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/WEBSITE_OVERVIEW.md) — High-level purpose, architecture, persona workflows, and Mermaid diagrams.
2. [`reverse-engineering-output/PAGE_AND_FEATURE_INVENTORY.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/PAGE_AND_FEATURE_INVENTORY.md) — Exhaustive inventory of all 19+ pages, modals, states, and WT Lab exercises.
3. [`reverse-engineering-output/DESIGN_SYSTEM.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/DESIGN_SYSTEM.md) — Complete design tokens, OKLCH color codes, typography, radii, and responsive breakpoints.
4. [`reverse-engineering-output/TECHNICAL_ARCHITECTURE.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/TECHNICAL_ARCHITECTURE.md) — Technical stack, APIs, SQL Server schemas, PBKDF2 hashing, and deployment guides.
5. [`reverse-engineering-output/MASTER_RECREATION_PROMPT.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/MASTER_RECREATION_PROMPT.md) — The complete, self-contained master prompt for recreating the entire platform in a new Antigravity project.
6. [`reverse-engineering-output/VERIFICATION_REPORT.md`](file:///d:/Downloads/WTCC2/reverse-engineering-output/VERIFICATION_REPORT.md) — This verification and integrity audit report.

---

## 5. Original Codebase Safety Confirmation

- **Read-Only Inspection Mode:** All inspection steps were performed strictly in read-only mode.
- **File Modifications:** Zero existing project files, configurations, database records, or environment settings were modified, deleted, or overwritten during this reverse-engineering process.
- **Sensitive Data Protection:** No passwords, cryptographic salts, API keys, or private user credentials were leaked into any documentation files.
