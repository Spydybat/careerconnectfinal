# CI/CD Pipeline

## Status

The pipeline is **prepared but not yet executed on a real runner** — no GitHub
Actions run has been observed. Do not treat CI as passing until a run is green.

## Workflows

| Workflow | File                             | Triggers                                      |
| -------- | -------------------------------- | --------------------------------------------- |
| CI       | `.github/workflows/ci.yml`       | push to `main`, every PR, manual              |
| Security | `.github/workflows/security.yml` | push to `main`, every PR, weekly cron, manual |

## CI jobs

### 1. `quality`

Sequential gates — the job fails on the first failure:

1. `bun install --frozen-lockfile` — reproducible dependency install
2. `bun run lint` — ESLint
3. `bun run typecheck` — `tsc --noEmit`
4. `bun run test` — Vitest suite
5. `bun run build` — production build (Cloudflare Worker output)
6. `dist/server/index.mjs` + `dist/server/wrangler.json` presence check
7. artifact upload of `dist` (7-day retention)

There is **no `docker` job**: the Cloudflare Worker is the canonical runtime and
no container target is maintained (see [docker.md](./docker.md)).

## Security workflow

- `bun audit --audit-level=high` for vulnerable dependencies (advisory).
- Hard failure if a `.env` file is ever committed.
- Hard failure on secret-shaped strings (`sb_secret_`, service-role JWTs,
  `sk-` provider keys) anywhere outside `.env.example`.

## Concurrency and cost

`concurrency.cancel-in-progress` cancels superseded runs on the same ref, so
rapid pushes do not queue redundant builds.

## Required repository secrets

| Secret                          | Needed for      | Fallback          |
| ------------------------------- | --------------- | ----------------- |
| `VITE_SUPABASE_URL`             | realistic build | placeholder value |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | realistic build | placeholder value |
| `VITE_SUPABASE_PROJECT_ID`      | realistic build | placeholder value |

Only publishable values are ever exposed to CI. Service-role, AI gateway and
Cloudflare deploy tokens are deliberately absent from the pipeline.

## Branch protection (required before production deploys)

Require `quality` (CI) and `audit` (Security) to pass before merging to `main`,
and require the branch to be up to date. **Production deployment must only occur
after CI succeeds on the commit being deployed.**

## Deployment

Production deploys are triggered from the Lovable publish flow on a
CI-green commit; it builds and deploys the Worker output in `dist/`. Backend
migrations apply immediately when merged; frontend changes go live on publish.
A manual equivalent is `npx wrangler --cwd ./dist deploy` — see
[cloud.md](./cloud.md).
