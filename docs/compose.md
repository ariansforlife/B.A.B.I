# Docker Compose foundation

This is the **first infrastructure slice**, not the complete database migration.

## Start

1. Copy `.env.example` to `.env` and replace the PostgreSQL password.
2. Run `docker compose up --build -d`.
3. Open the dashboard at http://localhost:3000.
4. Check the API at http://localhost:8080/health.
5. Check the initial database-backed endpoint at http://localhost:8080/api/v1/projects.

PostgreSQL data persists in the named `postgres_data` volume. Schema SQL in `infra/postgres/init` is applied only on the first initialization of an empty volume.

## Architecture and current limitations

- The Next.js UI still uses its existing local workspace / local bridge. It **does not yet write to PostgreSQL**.
- The Go API currently provides a database-aware health endpoint and read-only project listing. CRUD APIs, authentication, migrations, worker queue, and execution orchestration are follow-up work.
- The local runner remains on the host: `npm run runner`. Android ADB, iOS Simulator, Xcode, and macOS device tooling cannot be assumed to work inside a Linux Docker container.
- The API is bound to localhost by default. No authentication is implemented yet; do not expose it to a public network.
- This foundation stores release features and regression suite snapshots separately, along with execution metadata and result artifacts references.
- Existing `babi-data/workspace.json` content is not automatically imported. A controlled import and reconciliation tool is needed before switching persistence.
