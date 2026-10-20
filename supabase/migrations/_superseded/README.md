# Superseded migration files (NOT part of the canonical history)

These files were written during development and were later folded into larger,
consolidated migrations. They are **not recorded in `supabase_migrations.schema_migrations`**
and must not be replayed: several of them would fail on a clean database
(duplicate types, duplicate policies) or would duplicate statements that the
canonical files already contain.

| Superseded file                       | Superseded by                   | Relationship                                                     |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| 20260806144201 (recruiter access)     | 20260809094110                  | superset (adds storage policy)                                   |
| 20260808122254 (full schema snapshot) | 20260804171823                  | snapshot of initial schema; replays would fail on existing types |
| 20260808122333 (storage policies)     | 20260805140457 + 20260809094110 | split across canonical files                                     |
| 20260809085014 (resume/AI columns)    | 20260805140401 + 20260809094110 | superset re-issue                                                |
| 20260809085339 (audit + indexes)      | 20260809094334                  | superset (adds function REVOKEs)                                 |
| 20260809085417 (function REVOKEs)     | 20260809094334                  | folded in                                                        |
| 20260809094303 (AI tables)            | 20260809055543                  | byte-identical duplicate (same md5)                              |

Canonical order for a clean database — see `docs/release/RELEASE_STATUS.md`.
