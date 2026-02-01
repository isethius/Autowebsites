-- Migration: 004_scheduler_locks
-- Description: Add distributed lock table for scheduler mutex
-- Created: 2026-01-26

CREATE TABLE IF NOT EXISTS scheduler_locks (
  name TEXT PRIMARY KEY,
  locked_by TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduler_locks_expires_at ON scheduler_locks(expires_at);

COMMENT ON TABLE scheduler_locks IS 'Distributed locks for scheduler processes';
