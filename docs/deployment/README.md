# Career Connect — Deployment Documentation

This folder documents how Career Connect is configured, continuously integrated
and deployed. It does not change any product feature, UI, OLTP schema,
warehouse, BI or AI architecture.

Canonical production runtime: **Cloudflare Worker** built to `dist/`.

| Document                             | Purpose                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| [environments.md](./environments.md) | Development / staging / production strategy and every variable the app reads |
| [cloud.md](./cloud.md)               | Cloudflare build contract, deploy sequence, topology, probes                 |
| [ci-cd.md](./ci-cd.md)               | GitHub Actions pipelines and quality gates                                   |
| [docker.md](./docker.md)             | Why containers are not a production target                                   |
| [runbook.md](./runbook.md)           | Release, rollback and incident procedures                                    |

## Quick reference

```bash
bun install                       # install dependencies
bun run dev                       # local dev server (http://localhost:8080)
bun run lint                      # eslint
bun run typecheck                 # tsc --noEmit
bun run test                      # vitest unit + integration tests
bun run build                     # production build -> dist/ (Cloudflare Worker)
npx wrangler --cwd ./dist dev     # run the built Worker locally
npx wrangler --cwd ./dist deploy  # manual deploy (managed publish does this for you)
```
