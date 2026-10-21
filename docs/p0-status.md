# P0 API foundations

The Go API exposes:
- GET/PUT `/api/v1/workspace` — workspace JSONB document with optimistic revision control (409 on conflict).
- GET/POST `/api/v1/executions` — immutable execution input snapshot and queued job metadata.

The SQL schema includes `workspace_snapshots`, `execution_jobs`, and `execution_job_results`.

**Migration note:** `infra/postgres/init/002_workspace_execution.sql` runs automatically only on a fresh PostgreSQL volume. For an existing volume, apply the SQL explicitly with psql or a proper migration runner before starting the updated API.

**Security:** These endpoints currently have no authentication. Docker Compose binds API to 127.0.0.1 only. Do not expose the service to a public network.

**Remaining P0:** frontend persistence wiring; CRUD relational normalization; master test suite editor and mandatory regression inclusion; script binding and runner dispatch; device/runner preflight; execution results ingestion; automated tests. The POST endpoint queues records only: no worker currently consumes them. Do not interpret queued as executed.
