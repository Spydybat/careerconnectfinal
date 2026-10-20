# Environment Strategy

## Environments

| Environment   | Purpose                                  | Runtime                                | Backend instance | URL shape                                                             |
| ------------- | ---------------------------------------- | -------------------------------------- | ---------------- | --------------------------------------------------------------------- |
| `development` | Developer machine (`bun run dev`)        | Vite dev server                        | Test backend     | `http://localhost:8080`                                               |
| `staging`     | Pre-release verification of every change | Cloudflare Worker (preview deployment) | Test backend     | `id-preview--<project>.lovable.app` / `project--<id>-dev.lovable.app` |
| `production`  | Live application                         | Cloudflare Worker                      | Live backend     | published domain / custom domain                                      |

Staging and production use separate backend instances, so seeding or
destructive experiments in staging can never touch live records. Staging is the
same Worker artefact as production, built from the same `bun run build`.

## Variable classes

1. **Client (`VITE_*`)** — inlined into the browser bundle at _build_ time.
   Only publishable values belong here. Changing one requires a rebuild.
2. **Server** — read inside server-function or route handlers via
   `process.env['NAME']`. Never read at module scope: on the Worker runtime the
   environment is injected per request.
3. **Managed secrets** — injected by the platform (`LOVABLE_API_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`). They are not stored in the repository, never
   reach the browser bundle, and are set as Worker secrets when deploying with
   `wrangler`.

## Variable reference

| Variable                        | Class         | Required       | Description                                      |
| ------------------------------- | ------------- | -------------- | ------------------------------------------------ |
| `VITE_SUPABASE_URL`             | client        | yes            | Backend API base URL                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client        | yes            | Publishable (anon) key                           |
| `VITE_SUPABASE_PROJECT_ID`      | client        | yes            | Backend project reference                        |
| `SUPABASE_URL`                  | server        | yes            | Backend API base URL for SSR/server fns          |
| `SUPABASE_PUBLISHABLE_KEY`      | server        | yes            | Publishable key for server reads                 |
| `SUPABASE_PROJECT_ID`           | server        | no             | Backend project reference                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | server secret | admin only     | Privileged key; bypasses row-level security      |
| `LOVABLE_API_KEY`               | server secret | AI features    | Auth for the AI gateway                          |
| `ANALYTICS_SCALE`               | build script  | no             | Row multiplier for `bun run data:build`          |
| `CLOUDFLARE_API_TOKEN`          | deploy secret | manual deploys | Used by `wrangler deploy` only; never by the app |

## Production checklist

- [ ] `VITE_*` values point at the **live** backend at build time.
- [ ] `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` set as Worker vars.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` set as Worker **secrets**.
- [ ] No secret carries a `VITE_` prefix (it would ship to the browser).
- [ ] `.env` is not committed (enforced by the security workflow).

## Rules

- `.env` is git-ignored; `.env.example` is the committed template and must be
  updated whenever a new variable is introduced.
- Secrets are server-side only: service-role key, AI gateway key, JWT/auth
  secrets, storage credentials and admin credentials are never referenced in
  client code, never logged, and never returned by health endpoints.
- Rotate the service-role key and AI gateway key on any suspected exposure.
- CI never receives production secrets; it builds with placeholder publishable
  values because the build must not depend on live data.
