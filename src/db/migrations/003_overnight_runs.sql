-- Migration: 003_overnight_runs
-- Description: Create overnight_runs table and update leads table for overnight outreach system
-- Created: 2026-01-26

-- ============================================================================
-- OVERNIGHT RUNS TABLE
-- Tracks each overnight outreach run with configuration, stats, and errors
-- ============================================================================

CREATE TABLE IF NOT EXISTS overnight_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Configuration used for this run
  config JSONB NOT NULL DEFAULT '{}',

  -- Statistics collected during the run
  stats JSONB NOT NULL DEFAULT '{
    "leads_discovered": 0,
    "leads_qualified": 0,
    "previews_generated": 0,
    "previews_deployed": 0,
    "emails_composed": 0,
    "emails_sent": 0,
    "emails_failed": 0,
    "discovery_time_ms": 0,
    "preview_time_ms": 0,
    "deploy_time_ms": 0,
    "email_time_ms": 0,
    "total_time_ms": 0,
    "by_industry": {},
    "by_location": {}
  }',

  -- Errors encountered during the run
  errors JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying runs by status and date
CREATE INDEX IF NOT EXISTS idx_overnight_runs_status ON overnight_runs(status);
CREATE INDEX IF NOT EXISTS idx_overnight_runs_started_at ON overnight_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_overnight_runs_created_at ON overnight_runs(created_at DESC);

-- ============================================================================
-- UPDATE LEADS TABLE
-- Add columns to track preview URLs and overnight run association
-- ============================================================================

-- Add preview URL column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN preview_url TEXT;
  END IF;
END $$;

-- Add preview generated timestamp (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'preview_generated_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN preview_generated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add overnight run reference (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'overnight_run_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN overnight_run_id UUID REFERENCES overnight_runs(id);
  END IF;
END $$;

-- Add source tracking columns (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'discovery_source'
  ) THEN
    ALTER TABLE leads ADD COLUMN discovery_source TEXT CHECK (discovery_source IN ('yelp', 'yellowpages', 'google', 'manual', 'import'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_url TEXT;
  END IF;
END $$;

-- Add has_no_website flag (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'has_no_website'
  ) THEN
    ALTER TABLE leads ADD COLUMN has_no_website BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Index for overnight run lookup
CREATE INDEX IF NOT EXISTS idx_leads_overnight_run_id ON leads(overnight_run_id);
CREATE INDEX IF NOT EXISTS idx_leads_has_no_website ON leads(has_no_website);
CREATE INDEX IF NOT EXISTS idx_leads_discovery_source ON leads(discovery_source);

-- ============================================================================
-- EMAIL LOG TABLE (if not exists)
-- Tracks all emails sent for quota management
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  overnight_run_id UUID REFERENCES overnight_runs(id),
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
  message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email log
CREATE INDEX IF NOT EXISTS idx_email_log_lead_id ON email_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_overnight_run_id ON email_log(overnight_run_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get email count for today (for quota management)
CREATE OR REPLACE FUNCTION get_emails_sent_today()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM email_log
    WHERE status = 'sent'
      AND sent_at >= CURRENT_DATE
      AND sent_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get overnight run stats summary
CREATE OR REPLACE FUNCTION get_overnight_run_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  total_runs INTEGER,
  completed_runs INTEGER,
  failed_runs INTEGER,
  total_leads_discovered INTEGER,
  total_emails_sent INTEGER,
  avg_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_runs,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_runs,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_runs,
    COALESCE(SUM((stats->>'leads_discovered')::INTEGER), 0)::INTEGER AS total_leads_discovered,
    COALESCE(SUM((stats->>'emails_sent')::INTEGER), 0)::INTEGER AS total_emails_sent,
    COALESCE(
      ROUND(
        AVG(
          CASE
            WHEN (stats->>'leads_discovered')::INTEGER > 0
            THEN ((stats->>'emails_sent')::NUMERIC / (stats->>'leads_discovered')::NUMERIC) * 100
            ELSE 0
          END
        ), 2
      ), 0
    ) AS avg_success_rate
  FROM overnight_runs
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on overnight_runs changes
CREATE OR REPLACE FUNCTION update_overnight_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_overnight_runs_updated_at ON overnight_runs;
CREATE TRIGGER trigger_overnight_runs_updated_at
  BEFORE UPDATE ON overnight_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_overnight_runs_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (if enabled)
-- ============================================================================

-- Enable RLS on overnight_runs (optional, remove if not using RLS)
-- ALTER TABLE overnight_runs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_log (optional, remove if not using RLS)
-- ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE overnight_runs IS 'Tracks automated overnight outreach runs with configuration, statistics, and errors';
COMMENT ON TABLE email_log IS 'Logs all emails sent for tracking, analytics, and quota management';
COMMENT ON COLUMN leads.preview_url IS 'URL of the generated website preview for this lead';
COMMENT ON COLUMN leads.preview_generated_at IS 'Timestamp when the preview was generated';
COMMENT ON COLUMN leads.overnight_run_id IS 'Reference to the overnight run that discovered/processed this lead';
COMMENT ON COLUMN leads.has_no_website IS 'True if the business has no real website (only social/directory listings)';
