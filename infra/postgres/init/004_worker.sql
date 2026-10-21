ALTER TABLE execution_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE execution_jobs ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_result_case ON execution_job_results(execution_id,test_case_id);
