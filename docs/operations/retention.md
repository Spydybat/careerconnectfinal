# Retention

Declared in `src/observability/retention.ts` (declarative register — nothing in
the codebase deletes data automatically unless a policy says `auto_purge`).

| Data             | Store                     | Retention             | Auto purge            |
| ---------------- | ------------------------- | --------------------- | --------------------- |
| Application logs | platform log stream       | 30 days               | yes                   |
| Audit logs       | `audit_logs`              | indefinite            | no                    |
| AI usage logs    | `ai_usage_logs`           | operational window    | per policy            |
| Metrics          | in-process rolling window | minutes               | yes (window eviction) |
| Alert records    | log stream                | with application logs | yes                   |

Principles:

- Audit records are never expired automatically — they are the security record.
- Metrics are ephemeral and per-instance by design; they carry no personal data.
- Log retention is short because logs are debugging aids, not a data store.
- No observability dataset stores resume content, prompts or message bodies, so
  retention never becomes a personal-data exposure.
