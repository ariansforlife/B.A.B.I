CREATE TABLE IF NOT EXISTS workspace_snapshots (
 id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
 document JSONB NOT NULL,
 revision BIGINT NOT NULL DEFAULT 1,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS execution_jobs (
 id UUID PRIMARY KEY,
 project_id TEXT NOT NULL,
 release_id TEXT NOT NULL,
 scope TEXT NOT NULL CHECK(scope IN ('full','feature','regression','custom')),
 engine TEXT NOT NULL CHECK(engine IN ('playwright','appium','maestro')),
 environment_id TEXT,
 device_id TEXT,
 test_case_ids JSONB NOT NULL,
 snapshot JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 started_at TIMESTAMPTZ,
 finished_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS execution_job_results (
 execution_id UUID NOT NULL REFERENCES execution_jobs(id) ON DELETE CASCADE,
 test_case_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('passed','failed','skipped')),
 duration_ms BIGINT NOT NULL DEFAULT 0,
 logs JSONB NOT NULL DEFAULT '[]',
 artifacts JSONB NOT NULL DEFAULT '[]',
 PRIMARY KEY(execution_id,test_case_id)
);
CREATE INDEX IF NOT EXISTS idx_execution_jobs_status ON execution_jobs(status,created_at);
