-- Job Queue Table for durable job storage
-- This replaces the JSON file-based queue for production reliability

-- Create job_queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_by VARCHAR(255),
  locked_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Indexes for efficient job retrieval
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority_created ON job_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_locked ON job_queue(locked_by, locked_at) WHERE status = 'running';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_job_queue_updated_at ON job_queue;
CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_job_queue_updated_at();

-- Function to claim and lock a job for processing
CREATE OR REPLACE FUNCTION claim_job(
  worker_id VARCHAR(255),
  job_types VARCHAR(100)[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  claimed_job_id UUID;
BEGIN
  -- Select and lock a pending job
  UPDATE job_queue
  SET
    status = 'running',
    locked_by = worker_id,
    locked_at = NOW(),
    started_at = COALESCE(started_at, NOW()),
    attempts = attempts + 1
  WHERE id = (
    SELECT id FROM job_queue
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND (job_types IS NULL OR type = ANY(job_types))
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING id INTO claimed_job_id;

  RETURN claimed_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a job successfully
CREATE OR REPLACE FUNCTION complete_job(
  job_id UUID,
  job_result JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE job_queue
  SET
    status = 'completed',
    completed_at = NOW(),
    result = job_result,
    locked_by = NULL,
    locked_at = NULL
  WHERE id = job_id AND status = 'running';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to fail a job
CREATE OR REPLACE FUNCTION fail_job(
  job_id UUID,
  error_message TEXT,
  should_retry BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
  job_record job_queue%ROWTYPE;
BEGIN
  SELECT * INTO job_record FROM job_queue WHERE id = job_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if we should retry
  IF should_retry AND job_record.attempts < job_record.max_attempts THEN
    -- Return to pending for retry with exponential backoff
    UPDATE job_queue
    SET
      status = 'pending',
      error = error_message,
      locked_by = NULL,
      locked_at = NULL,
      scheduled_for = NOW() + (INTERVAL '1 minute' * POWER(2, job_record.attempts - 1))
    WHERE id = job_id;
  ELSE
    -- Mark as permanently failed
    UPDATE job_queue
    SET
      status = 'failed',
      completed_at = NOW(),
      error = error_message,
      locked_by = NULL,
      locked_at = NULL
    WHERE id = job_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale locks (jobs that have been running too long)
CREATE OR REPLACE FUNCTION cleanup_stale_jobs(
  stale_threshold INTERVAL DEFAULT INTERVAL '30 minutes'
)
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE job_queue
  SET
    status = 'pending',
    locked_by = NULL,
    locked_at = NULL,
    scheduled_for = NOW()
  WHERE status = 'running'
    AND locked_at < NOW() - stale_threshold;

  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE (
  total_jobs BIGINT,
  pending_jobs BIGINT,
  running_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  avg_wait_time INTERVAL,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'running')::BIGINT as running_jobs,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_jobs,
    AVG(started_at - created_at) FILTER (WHERE started_at IS NOT NULL) as avg_wait_time,
    AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_processing_time
  FROM job_queue
  WHERE created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON job_queue TO authenticated;
-- GRANT ALL ON job_queue TO service_role;

-- RLS Policies (optional - enable if needed)
-- ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role has full access" ON job_queue FOR ALL TO service_role USING (true);
