-- Migration: Add auth persistence tables for login attempts and token versions
-- Run this in your Supabase SQL editor

-- =====================
-- LOGIN ATTEMPTS TABLE
-- =====================
-- Tracks failed login attempts for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INT DEFAULT 0,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy (allow all for service role)
CREATE POLICY "Allow all for service role" ON login_attempts FOR ALL USING (true);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- =====================
-- TOKEN VERSIONS TABLE
-- =====================
-- Tracks JWT token versions for logout/invalidation
CREATE TABLE IF NOT EXISTS token_versions (
  user_id TEXT PRIMARY KEY,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE token_versions ENABLE ROW LEVEL SECURITY;

-- Policy (allow all for service role)
CREATE POLICY "Allow all for service role" ON token_versions FOR ALL USING (true);

-- =====================
-- RPC FUNCTIONS
-- =====================

-- Function to get token version for a user
CREATE OR REPLACE FUNCTION get_token_version(p_user_id TEXT)
RETURNS INT AS $$
DECLARE
  v INT;
BEGIN
  SELECT version INTO v
  FROM token_versions
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 1; -- Default version
  END IF;

  RETURN v;
END;
$$ LANGUAGE plpgsql;

-- Function to increment token version (invalidates all existing tokens)
CREATE OR REPLACE FUNCTION increment_token_version(p_user_id TEXT)
RETURNS INT AS $$
DECLARE
  new_version INT;
BEGIN
  INSERT INTO token_versions (user_id, version)
  VALUES (p_user_id, 2)
  ON CONFLICT (user_id)
  DO UPDATE SET
    version = token_versions.version + 1,
    updated_at = NOW()
  RETURNING version INTO new_version;

  RETURN new_version;
END;
$$ LANGUAGE plpgsql;

-- Function to record a failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(p_key TEXT, p_max_attempts INT DEFAULT 5, p_lockout_minutes INT DEFAULT 15)
RETURNS TABLE(attempts INT, is_locked BOOLEAN, locked_until TIMESTAMPTZ) AS $$
DECLARE
  current_count INT;
  lock_time TIMESTAMPTZ;
BEGIN
  -- Upsert the login attempt
  INSERT INTO login_attempts (key, count, last_attempt)
  VALUES (p_key, 1, NOW())
  ON CONFLICT (key)
  DO UPDATE SET
    count = CASE
      -- Reset count if last attempt was more than lockout period ago
      WHEN login_attempts.last_attempt < NOW() - (p_lockout_minutes || ' minutes')::INTERVAL THEN 1
      ELSE login_attempts.count + 1
    END,
    last_attempt = NOW(),
    locked_until = CASE
      WHEN login_attempts.count + 1 >= p_max_attempts THEN NOW() + (p_lockout_minutes || ' minutes')::INTERVAL
      ELSE login_attempts.locked_until
    END,
    updated_at = NOW()
  RETURNING login_attempts.count, login_attempts.locked_until INTO current_count, lock_time;

  RETURN QUERY SELECT
    current_count,
    lock_time IS NOT NULL AND lock_time > NOW(),
    lock_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check login attempts status
CREATE OR REPLACE FUNCTION check_login_attempts(p_key TEXT)
RETURNS TABLE(attempts INT, is_locked BOOLEAN, locked_until TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(la.count, 0)::INT,
    la.locked_until IS NOT NULL AND la.locked_until > NOW(),
    la.locked_until
  FROM login_attempts la
  WHERE la.key = p_key;

  -- Return defaults if no record exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::INT, FALSE, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clear login attempts (on successful login)
CREATE OR REPLACE FUNCTION clear_login_attempts(p_key TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM login_attempts WHERE key = p_key;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE login_attempts IS 'Tracks failed login attempts for rate limiting and lockout';
COMMENT ON TABLE token_versions IS 'Tracks JWT token versions for logout/invalidation across server restarts';
