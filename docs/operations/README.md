# Operations

Sprint 14 observability. Everything here describes what exists in the codebase —
no external monitoring vendor is assumed.

| Doc                                            | Purpose                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| [monitoring.md](./monitoring.md)               | What is measured, where signals come from           |
| [health-checks.md](./health-checks.md)         | Liveness/readiness endpoints and expected responses |
| [alerting.md](./alerting.md)                   | Alert definitions, thresholds, severities, delivery |
| [incident-response.md](./incident-response.md) | Severity matrix and response procedure              |
| [runbook.md](./runbook.md)                     | Index of failure scenarios                          |
| [application.md](./application.md)             | Application errors and latency                      |
| [database.md](./database.md)                   | Database availability and slow queries              |
| [etl.md](./etl.md)                             | Pipeline failures, record drops, quality            |
| [warehouse.md](./warehouse.md)                 | Warehouse and BI freshness                          |
| [ai.md](./ai.md)                               | AI reliability, latency and cost                    |
| [security.md](./security.md)                   | Security signals from the audit trail               |
| [retention.md](./retention.md)                 | Retention policy for operational data               |

Operational surface:

- `/health` and `/api/public/health` — liveness
- `/readiness` and `/api/public/readiness` — dependency readiness
- `/admin/operations` — operations console (admin only)
