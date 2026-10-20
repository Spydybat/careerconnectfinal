# Career Connect — Release Status

**Phase:** Managed cloud deployment readiness (post release-gate)
**Date:** 2026-08-10
**Verdict:**

- Application: ✅ **READY**
- Managed cloud (Cloudflare Worker): ✅ **READY FOR DEPLOYMENT**
- Self-hosted Docker: ⛔ **NOT SUPPORTED / NOT READY** (removed by decision, §4)
- Load testing: ⏳ **PENDING**
- CI execution: ⏳ **PENDING REAL RUNNER**

---

## 1. Canonical production runtime

**Cloudflare Worker** (Nitro preset `cloudflare-module`, `nodeCompat: true`),
verified against a real `bun run build`:

| Item                    | Verified value                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Build command           | `bun run build`                                                                                       |
| Output directory        | `dist/` (`dist/client`, `dist/server`, `dist/nitro.json`)                                             |
| Worker entrypoint       | `dist/server/index.mjs` (ESM module, `fetch` export)                                                  |
| Generated Worker config | `dist/server/wrangler.json` (`main`, `compatibility_date`, `ASSETS` → `../client`, `no_bundle: true`) |
| Preview / deploy        | `npx wrangler --cwd ./dist dev` / `… deploy`                                                          |
| Extra bindings required | none (KV/D1/R2/DO/Queues unused)                                                                      |

No Cloudflare values were invented: everything above is read from the generated
`dist/nitro.json` and `dist/server/wrangler.json`.

## 2. Cloud deployment configuration

Documented in [docs/deployment/cloud.md](../deployment/cloud.md): build
contract, deploy sequence, topology, and the probe matrix. The generated
`wrangler.json` is the source of truth — no competing root `wrangler.toml` is
committed and the file is not hand-edited.

Managed publish performs the same build + Worker deploy and injects backend/AI
configuration; the manual path is `npx wrangler --cwd ./dist deploy`.

## 3. Environment configuration

[docs/deployment/environments.md](../deployment/environments.md) now defines
three environments — **development** (local Vite), **staging** (preview Worker,
test backend), **production** (Worker, live backend) — plus the full variable
table and a production checklist.

Secrets posture (verified): `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`,
auth/JWT and storage credentials are server-only, read inside handlers, never
`VITE_`-prefixed, never logged, never returned by health endpoints, and absent
from CI. `.env` is git-ignored and CI hard-fails if one is committed.

## 4. Docker decision — Option A

The former image copied `/app/.output` and ran `bun run .output/server/index.mjs`.
That path does not exist, and `dist/server/index.mjs` is a Worker module, not a
Node/Bun HTTP server — it cannot be started that way at all.

**Decision: Cloudflare Worker is the canonical production runtime; the container
target is unsupported.** `Dockerfile`, `docker-compose.yml` and `.dockerignore`
were deleted rather than papered over by renaming `dist/` → `.output/server/`.
[docs/deployment/docker.md](../deployment/docker.md) records the rationale and
the correct way to add a _separate_ Node target if one is ever genuinely needed.

## 5. Health verification

Verified live on the running server:

| Endpoint                | Status | Body                                              |
| ----------------------- | ------ | ------------------------------------------------- |
| `/health`               | 200    | `healthy` — application + configuration checks    |
| `/readiness`            | 200    | `healthy` — configuration + database reachability |
| `/api/public/health`    | 200    | `healthy`                                         |
| `/api/public/readiness` | 200    | `healthy`                                         |

Contract: `200` healthy/ready, `503` unhealthy/not ready
(`HTTP_STATUS_FOR` in `src/observability/health.ts`; readiness requires every
component healthy). Payloads contain only status, component name, detail,
latency and request id — **no** secrets, env values, connection strings or
stack traces. Not yet re-run against the deployed Worker URL (post-deploy step).

## 6. Production smoke test

Executed during the release gate against the running application with real
sessions (no auth bypass):

| Surface                                                                                             | Result |
| --------------------------------------------------------------------------------------------------- | ------ |
| Public: `/`, `/jobs`, `/careers`, `/companies`, `/auth`                                             | ✅ 200 |
| Student: login, dashboard, profile, resume, career, jobs, applications, AI                          | ✅     |
| Recruiter: dashboard, jobs, candidates, analytics                                                   | ✅     |
| Placement: dashboard, students, drives, companies, records, analytics                               | ✅     |
| Admin: dashboard, users, organizations, roles, audit, settings, AI, operations, executive analytics | ✅     |

These results are from the pre-deployment environment. The identical matrix must
be re-run against the published URL immediately after the first production
deploy.

## 7. Security verification

- **RLS** enabled on every application table, with explicit `GRANT`s per table.
- **RBAC** verified live: a student session is denied every `/admin/*` route and
  the executive analytics domain, while student surfaces keep working.
- **Tenant isolation** — recruiter access is scoped by `my_company_id` /
  `job_is_mine` / `student_applied_to_me`; cross-company reads are rejected.
- **Storage** — private `resumes` bucket; owners read their own objects,
  recruiters only objects of candidates who applied to their jobs.
- **CSP and headers** re-verified on live responses: `default-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, restricted
  `frame-ancestors`, `nosniff`, `strict-origin-when-cross-origin`,
  permissions-policy denying camera/mic/geo/payment/usb, COOP `same-origin`,
  `cache-control: private, no-store` on HTML, per-request `x-request-id`.
- **CSRF** — `createCsrfMiddleware` filtered to `serverFn` handlers in `src/start.ts`.
- **Rate limiting** — `src/security/rate-limit.ts` + `src/lib/rate-limit.server.ts`
  applied to AI and abuse-prone server functions.
- **Audit logging** — privileged actions written to `audit_logs`, readable only
  by placement officers and admins.
- **Dependencies** — no high or critical vulnerabilities.

### The 8 `SECURITY DEFINER` warnings — reviewed, ACCEPTED

`has_role`, `is_staff`, `my_company_id`, `job_is_mine`, `owns_conversation`,
`owns_interview_session`, `owns_student`, `student_applied_to_me` are RLS
predicate helpers. They must be `SECURITY DEFINER` (they read the same tables
their policies protect), are `STABLE` and read-only, return only a boolean or
the caller's own company id, pin `SET search_path = public`, and take typed
`uuid`/`app_role` arguments. `EXECUTE` cannot be revoked from `authenticated`
without breaking every policy; the `PUBLIC` grant was revoked in
`20260809094334`.

## 8. AI verification

Gateway health, Career Coach, Skill Gap and Mock Interview all verified working
through real sessions. Hardening is covered by `src/ai/__tests__/hardening.test.ts`
(fallback, timeout, redaction) inside the 138-test suite:

- usage + cost logging into `ai_usage_logs` (visible in `/admin/ai`)
- per-user rate limits and request timeouts
- safe, non-leaking error messages
- `LOVABLE_API_KEY` read server-side inside handlers only — never bundled,
  logged or returned

## 9. Data platform

Architecture unchanged and enforced: `OLTP → Data Lake → ETL → Warehouse →
Marts → BI`. No route, loader or server function runs the pipeline; BI reads
pre-built marts only. Production triggering is documented in
[docs/operations/etl.md](../operations/etl.md): scheduled batch invocation of
`bun run data:build` (`scripts/build-data-platform.ts`) out of band, manual
idempotent re-run on failure, and `etl.stale` alerting when the scheduler stops.

## 10. CI/CD readiness

⏳ **Not executed — no runner available. CI is NOT claimed to be passing.**

`.github/workflows/ci.yml` `quality` job: install (frozen lockfile) → lint →
typecheck → tests → build → **Worker output verification**
(`dist/server/index.mjs`, `dist/server/wrangler.json`, `dist/client`) → artifact
upload of `dist`. The obsolete `docker` job was removed. `security.yml` runs
`bun audit`, the committed-`.env` check and the hardcoded-secret grep.

Required: branch protection on `main` for `quality` + `audit`, and production
deployment only from a CI-green commit.

## 11. Docker status

**NOT REQUIRED FOR PRODUCTION RUNTIME.** No Dockerfile is maintained; the broken
one was removed rather than kept as a false capability. Local development uses
`bun run dev`; data-platform batch jobs run as plain Bun scripts.

## 12. Performance status

Indicative single-request measurements from the sandbox dev server — **not** a
load benchmark, and no figures are invented:

| Surface                 | P50                       | P99     |
| ----------------------- | ------------------------- | ------- |
| Health                  | 4.3 ms                    | 9.1 ms  |
| Application (SSR pages) | 10.8 ms                   | 19.4 ms |
| Readiness (hits DB)     | 140 ms                    | 382 ms  |
| Admin analytics         | ~2.2 s (development mode) | —       |

Concurrency / sustained load / throughput ceiling / cold start: ⏳ **PENDING**.

## 13. Verified engineering state (carried forward)

Build ✅ · Typecheck ✅ 0 errors · Lint ✅ 0 errors (14 advisory warnings) ·
Tests ✅ **138/138** (9 files) · Public/Student/Recruiter/Placement/Admin E2E ✅ ·
Negative RBAC ✅ · Email verification enabled (`auto_confirm_email` disabled) ✅ ·
Canonical migrations documented ✅ · Admin analytics 500 fixed ✅.

### Canonical migration order

| #   | Migration        | Contents                                                  |
| --- | ---------------- | --------------------------------------------------------- |
| 1   | `20260804171823` | core schema + RLS/GRANTs                                  |
| 2   | `20260805140401` | resume AI fields, learning paths                          |
| 3   | `20260805140457` | resume storage bucket + object policies                   |
| 4   | `20260809055543` | AI tables: logs, conversations, interview sessions        |
| 5   | `20260809094110` | recruiter access predicates, storage policy consolidation |
| 6   | `20260809094334` | audit logs, performance indexes, function hardening       |

Superseded development files live in `supabase/migrations/_superseded/` and must
not be replayed.

## 14. Known limitations

1. **Self-hosted container path unsupported** — deliberate (§4).
2. **CI never executed on a real runner** — do not report CI as green until it is.
3. **No load/stress testing** — all latency figures are single-request, dev-mode.
4. **Admin/analytics ~2.2 s in dev mode**; production-build numbers unmeasured.
5. **8 accepted `SECURITY DEFINER` linter warnings** recur on every scan by design.
6. **Email deliverability unverified** — auth email uses the managed sender; no
   custom sending domain configured.
7. **Release-gate test accounts** (`*@careerconnect.test`) still exist — remove
   via [test-account-cleanup.md](./test-account-cleanup.md).
8. **Post-deploy verification outstanding** — health, probes and the full smoke
   matrix must be re-run against the published Worker URL.

## 15. Final deployment recommendation

**GO — deploy to managed cloud (Cloudflare Worker).** Application code,
database, authentication, authorization, AI, data platform and observability all
pass. Deploy from a CI-green commit, then immediately: re-run the health/readiness
probes and the role smoke matrix against the published URL, run a concurrency
load test, and execute the test-account cleanup procedure.

**NO-GO for any self-hosted container release** — unsupported by design.
