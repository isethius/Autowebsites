-- Migration: Add email_daily_stats table for Gmail quota tracking
-- Run this in your Supabase SQL editor

-- =====================
-- EMAIL DAILY STATS TABLE
-- =====================
-- Tracks daily email sends to respect Gmail's 500/day quota
CREATE TABLE IF NOT EXISTS email_daily_stats (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  emails_sent INT DEFAULT 0,
  quota_limit INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy (allow all for service role)
CREATE POLICY "Allow all for service role" ON email_daily_stats FOR ALL USING (true);

-- Function to increment email count for a date
CREATE OR REPLACE FUNCTION increment_email_daily_count(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO email_daily_stats (date, emails_sent, quota_limit)
  VALUES (target_date, 1, 500)
  ON CONFLICT (date)
  DO UPDATE SET
    emails_sent = email_daily_stats.emails_sent + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining quota for a date
CREATE OR REPLACE FUNCTION get_email_quota_remaining(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INT AS $$
DECLARE
  sent INT;
  quota INT;
BEGIN
  SELECT emails_sent, quota_limit INTO sent, quota
  FROM email_daily_stats
  WHERE date = target_date;

  IF NOT FOUND THEN
    RETURN 500; -- Default quota
  END IF;

  RETURN GREATEST(0, quota - sent);
END;
$$ LANGUAGE plpgsql;

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_email_daily_stats_date ON email_daily_stats(date DESC);

COMMENT ON TABLE email_daily_stats IS 'Tracks daily email sends for quota management (Gmail 500/day limit)';
