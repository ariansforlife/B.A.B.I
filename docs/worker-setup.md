# Local database migrations and host worker

Start with `cp .env.example .env` and replace both passwords with unique secrets. Use the same `BABI_WORKER_TOKEN` in Compose and in the host terminal.

```sh
docker compose up --build -d
BABI_WORKER_TOKEN='your-unique-secret-at-least-32-characters' npm run worker
```

The host worker must run on macOS for local iOS simulators and physical devices. Playwright, Maestro, Appium, Node, Xcode/Android SDK and the relevant test dependencies must be installed separately.

**Existing PostgreSQL volumes:** Docker's `/docker-entrypoint-initdb.d` scripts run only on first database creation. Apply migrations 002, 003 and 004 to existing volumes, in order, using `docker compose exec -T db psql -U babi -d babi < infra/postgres/init/00X_....sql` (adjust database/user to your .env). Never delete the volume to force migrations on a database containing user data.

**Known limitations:** Go master-data CRUD endpoints are not yet wired to every dashboard editor; execution status/results are not yet shown in a dedicated job detail screen; worker claim has no stale-job recovery or heartbeats; scripts and artifacts are stored on the host and are not yet accessible through the PostgreSQL results API. API and web are localhost-only by default, but the Next proxy and Go CRUD endpoints do not yet implement user authentication. Do not expose publicly.

**Verification:** `npm test && npm run typecheck && npm run build`, `docker compose config`, `docker compose up --build`, then create a release with a bound script and queue an execution. Check `GET /api/v1/executions` and the `execution_job_results` table. CI passing is not proof of successful execution on actual Android/iOS devices.
