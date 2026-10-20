# Monitoring

## Signals

| Domain                    | Source                                                   | Module                           |
| ------------------------- | -------------------------------------------------------- | -------------------------------- |
| Requests, errors, latency | in-process rolling window fed by request middleware      | `src/observability/metrics.ts`   |
| Errors                    | classified at the boundary, logged with `request_id`     | `src/observability/errors.ts`    |
| Database                  | credential-free probe + latency                          | `src/observability/database.ts`  |
| ETL                       | existing pipeline control plane (`etl_run_log` metadata) | `src/observability/etl.ts`       |
| Data quality              | existing quality framework reports                       | `src/observability/quality.ts`   |
| Warehouse / BI freshness  | single freshness service                                 | `src/observability/freshness.ts` |
| AI                        | `ai_usage_logs`                                          | `src/observability/ai.ts`        |
| Storage                   | object counts and failure tallies                        | `src/observability/storage.ts`   |
| Security                  | `audit_logs` (Sprint 12 trail, not duplicated)           | `src/observability/security.ts`  |

## Logging

Structured JSON, one object per line, via `src/observability/logger.ts`.
Every record carries `timestamp, level, service, environment, event,
request_id, duration_ms, status, message`. Levels: DEBUG/INFO/WARN/ERROR
(INFO+ in production).

Never logged: resume text, AI prompts and completions, message bodies,
credentials, tokens, emails, phone numbers. Redaction is centralised in
`src/observability/redact.ts` and enforced by tests.

## Correlation

The request id from `src/security/headers.ts` is generated (or accepted) once
per request, attached to a child logger, echoed in the response headers and
included in every client-visible error payload.

## Metric cardinality

Route labels are normalised (`/jobs/:id`) before recording; samples older than
the rolling window are dropped and the sample buffer is bounded.
