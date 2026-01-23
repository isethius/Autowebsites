-- AutoWebsites Lead Database Schema
-- Run this in your Supabase SQL Editor to create the leads table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_url TEXT NOT NULL,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 10),
  score_breakdown JSONB,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'scored', 'themes_generated', 'deployed', 'contacted', 'responded', 'converted', 'rejected')
  ),
  notes TEXT,
  gallery_url TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Create index on score for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);

-- Create index on website_url for lookups
CREATE INDEX IF NOT EXISTS idx_leads_website_url ON leads(website_url);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Adjust this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions (for anon/authenticated roles in Supabase)
GRANT ALL ON leads TO anon;
GRANT ALL ON leads TO authenticated;

-- Sample data (optional - uncomment to insert test data)
-- INSERT INTO leads (website_url, business_name, status) VALUES
--   ('https://example.com', 'Example Business', 'new'),
--   ('https://test.com', 'Test Company', 'scored');

-- View to see lead statistics
CREATE OR REPLACE VIEW lead_stats AS
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'scored') as scored_leads,
  COUNT(*) FILTER (WHERE status = 'deployed') as deployed_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  ROUND(AVG(score)::numeric, 1) as avg_score,
  COUNT(*) FILTER (WHERE score >= 7) as high_score_leads,
  COUNT(*) FILTER (WHERE score <= 4) as low_score_leads
FROM leads;

-- Grant read access to the stats view
GRANT SELECT ON lead_stats TO anon;
GRANT SELECT ON lead_stats TO authenticated;
