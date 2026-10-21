CREATE TABLE IF NOT EXISTS master_records (
 kind TEXT NOT NULL CHECK(kind IN ('features','scenarios','test-cases','test-suites','scripts','bindings','environments','devices','runners')),
 id TEXT NOT NULL,
 project_id TEXT NOT NULL DEFAULT '',
 name TEXT NOT NULL,
 data JSONB NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(kind,id)
);
CREATE INDEX IF NOT EXISTS idx_master_records_project ON master_records(project_id,kind);
