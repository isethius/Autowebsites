-- Migration: Add atomic increment functions for email counters
-- Run this in your Supabase SQL editor

-- =====================
-- ATOMIC INCREMENT FUNCTIONS
-- =====================
-- These functions provide atomic counter increments to prevent race conditions
-- when multiple processes update the same lead's email stats simultaneously.

-- Function to atomically increment emails_opened counter
CREATE OR REPLACE FUNCTION increment_emails_opened(lead_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    emails_opened = COALESCE(emails_opened, 0) + 1,
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment emails_clicked counter
CREATE OR REPLACE FUNCTION increment_emails_clicked(lead_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    emails_clicked = COALESCE(emails_clicked, 0) + 1,
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment emails_sent counter
CREATE OR REPLACE FUNCTION increment_emails_sent(lead_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    emails_sent = COALESCE(emails_sent, 0) + 1,
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment multiple counters at once (for batch operations)
CREATE OR REPLACE FUNCTION increment_email_stats(
  lead_id UUID,
  p_sent INT DEFAULT 0,
  p_opened INT DEFAULT 0,
  p_clicked INT DEFAULT 0
)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    emails_sent = COALESCE(emails_sent, 0) + p_sent,
    emails_opened = COALESCE(emails_opened, 0) + p_opened,
    emails_clicked = COALESCE(emails_clicked, 0) + p_clicked,
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_emails_opened(UUID) IS 'Atomically increment the emails_opened counter for a lead';
COMMENT ON FUNCTION increment_emails_clicked(UUID) IS 'Atomically increment the emails_clicked counter for a lead';
COMMENT ON FUNCTION increment_emails_sent(UUID) IS 'Atomically increment the emails_sent counter for a lead';
COMMENT ON FUNCTION increment_email_stats(UUID, INT, INT, INT) IS 'Atomically increment multiple email stats counters for a lead';
