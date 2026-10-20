# Production runbook

Start at `/admin/operations`. The failing component points to the page below.

| Scenario                                          | Page                                                    |
| ------------------------------------------------- | ------------------------------------------------------- |
| Application returns 5xx / slow                    | [application.md](./application.md)                      |
| Database unavailable or slow                      | [database.md](./database.md)                            |
| Pipeline failed, records dropped, quality dropped | [etl.md](./etl.md)                                      |
| Dashboards showing old data                       | [warehouse.md](./warehouse.md)                          |
| AI features failing, slow or expensive            | [ai.md](./ai.md)                                        |
| Auth failure spike or suspicious access           | [security.md](./security.md)                            |
| Storage upload/download failures                  | see storage section in [monitoring.md](./monitoring.md) |

## Deployment rollback

The container image is immutable and the app is stateless (see
`docs/deployment/`). Roll back by redeploying the previous image tag; no
database rollback is implied because migrations are forward-only. After
rollback, confirm `/readiness` is 200 and the operations console is healthy.

## Daily checks

1. `/admin/operations` overall status is healthy.
2. Warehouse freshness is `fresh` and the last pipeline run is `SUCCESS`.
3. Quality score at or above the floor, no failing rules.
4. AI failure rate and estimated spend within thresholds.
5. No P1/P2 alerts firing, no unexplained security counters.
