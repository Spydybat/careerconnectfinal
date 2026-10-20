# Release & Incident Runbook

## Standard release

1. Open a PR — CI runs lint, typecheck, tests, build, image build and smoke test.
2. Review the diff, including any migration SQL.
3. Merge to `main`. Backend migrations apply immediately.
4. Publish the frontend from the Lovable publish flow.
5. Verify: sign in, load the student dashboard, open a job, run one AI action.

## Migration safety

- Migrations are forward-only and must be additive where possible.
- Every new public table needs `GRANT`s, `ENABLE ROW LEVEL SECURITY` and
  policies in the same migration.
- Never drop a column in the same release that stops writing to it — split it
  across two releases so a rollback stays safe.

## Rollback

| Situation             | Action                                                             |
| --------------------- | ------------------------------------------------------------------ |
| Bad frontend release  | Republish the previous version                                     |
| Bad container release | Redeploy the previous image tag (`career-connect:<sha>`)           |
| Bad migration         | Ship a corrective forward migration; do not restore over live data |

## Incident triage

1. **Scope** — is it one route, one role, or everything?
2. **Signals** — check server logs, then browser console and network traces.
3. **Classify**
   - `401`/empty lists for one role → row-level security policy or missing grant
   - `500` on a server function → inspect server logs for the stack
   - AI failure → check gateway status/body in `ai_usage_logs`
   - Slow dashboards → confirm the expected index is being used
4. **Mitigate** — roll back or disable the affected surface.
5. **Record** — privileged actions are already captured in `audit_logs`; add a
   short post-incident note to the PR that fixes the cause.

## Routine checks

| Cadence       | Check                                                            |
| ------------- | ---------------------------------------------------------------- |
| Every release | CI green, smoke test on the published app                        |
| Weekly        | Security workflow results, dependency audit                      |
| Monthly       | Key rotation review, storage growth, AI spend in `ai_usage_logs` |
