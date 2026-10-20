# Health checks

| Endpoint                              | Meaning                                                          | Status codes                        |
| ------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| `/health`, `/api/public/health`       | process is alive; no dependency calls that can hang              | 200 healthy/degraded, 503 unhealthy |
| `/readiness`, `/api/public/readiness` | dependencies (database, configuration, AI gateway config) usable | 200 ready, 503 not ready            |

Both are unauthenticated and deliberately safe: they return status, service,
environment, version, uptime, request id and per-component status/detail.
They never return connection strings, environment variable values, keys or
stack traces — asserted in `src/observability/__tests__/observability.test.ts`.

Readiness is stricter than health: a _degraded_ required dependency is not
ready, so orchestrators drain the instance instead of serving broken traffic.

Recommended probe configuration: liveness every 10s (3 failures → restart),
readiness every 10s (2 failures → remove from rotation).
