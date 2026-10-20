# Docker — not required for production

**Status: NOT SUPPORTED as a production runtime. No Dockerfile is maintained.**

## Decision

Career Connect builds to a **Cloudflare Worker module** (Nitro preset
`cloudflare-module`). The build output is:

```
dist/
├── client/            # static assets, served through the ASSETS binding
├── server/index.mjs   # Worker module with a `fetch` export
├── server/wrangler.json
└── nitro.json         # preset: cloudflare-module
```

`dist/server/index.mjs` is **not** a Node/Bun HTTP server. It exports a Worker
`fetch` handler and expects the Workers runtime (`ASSETS` binding, per-request
env injection, `nodejs_compat`). Starting it with `bun run` cannot work, and the
previous Dockerfile — which copied a non-existent `.output/` and ran
`bun run .output/server/index.mjs` — was broken by construction.

Two options were considered:

- **Option A (chosen)** — declare the Cloudflare Worker the canonical production
  runtime and drop the container target. The managed deployment already uses it;
  no product requirement asks for self-hosting.
- **Option B (rejected)** — add a second Nitro `node-server` build target plus a
  Docker-specific pipeline. That means a second runtime to build, test, patch and
  security-scan for zero current benefit.

Accordingly `Dockerfile`, `docker-compose.yml` and `.dockerignore` were removed,
and the `docker` job was removed from CI.

## If a container is ever genuinely required

Do **not** repoint the existing build at `.output/`. Add a _separate_ target:

1. Add a second build script with the Nitro `node-server` preset writing to a
   distinct directory (e.g. `dist-node/`).
2. Add `Dockerfile.node` that runs that script and starts
   `node dist-node/server/index.mjs`.
3. Supply every server variable from [environments.md](./environments.md) at
   runtime and every `VITE_*` variable at build time.
4. Keep the Cloudflare build untouched — it stays the production runtime.

## Local tooling

Local development uses `bun run dev` (no container). Batch data-platform jobs
(`bun run data:build`) run as plain Bun scripts; containerising them is optional
and unrelated to the web runtime.
