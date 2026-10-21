CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  target TEXT NOT NULL CHECK (target IN ('web','android','ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  expected TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
);
CREATE TABLE IF NOT EXISTS scenario_test_cases (
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  PRIMARY KEY (scenario_id,test_case_id)
);
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('regression','smoke','custom')),
  mandatory BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS suite_test_cases (
  suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  PRIMARY KEY(suite_id,test_case_id)
);
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS release_features (
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id),
  snapshot JSONB NOT NULL,
  PRIMARY KEY(release_id,feature_id)
);
CREATE TABLE IF NOT EXISTS release_suites (
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  suite_id UUID NOT NULL REFERENCES test_suites(id),
  snapshot JSONB NOT NULL,
  PRIMARY KEY(release_id,suite_id)
);
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  release_id UUID REFERENCES releases(id),
  scope TEXT NOT NULL CHECK (scope IN ('full','feature','regression','custom')),
  config_snapshot JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS execution_results (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  source_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  logs JSONB NOT NULL DEFAULT '[]',
  artifacts JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_project ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_releases_project ON releases(project_id);
CREATE INDEX IF NOT EXISTS idx_executions_release ON executions(release_id);
