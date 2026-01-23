-- AutoWebsites Pro Database Schema v2
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS TABLE (Dashboard Authentication)
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- LEADS TABLE (Enhanced)
-- =====================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic info
  business_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  industry TEXT DEFAULT 'other',

  -- Contact info
  email TEXT,
  phone TEXT,
  contact_name TEXT,
  contact_title TEXT,

  -- Business details
  company_size TEXT CHECK (company_size IN ('solo', 'small', 'medium', 'large')),
  budget_range TEXT CHECK (budget_range IN ('low', 'medium', 'high', 'enterprise')),
  decision_maker BOOLEAN DEFAULT false,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',

  -- Pipeline
  pipeline_stage TEXT DEFAULT 'new' CHECK (pipeline_stage IN ('new', 'qualified', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost')),
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES users(id),

  -- Scoring
  website_score DECIMAL(3,1),
  lead_score DECIMAL(3,1),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Analysis
  ai_analysis JSONB,
  issues_found TEXT[],
  recommendations TEXT[],

  -- Assets
  screenshot_url TEXT,
  gallery_url TEXT,
  proposal_url TEXT,

  -- Engagement
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,

  -- Custom fields
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,

  -- Status
  is_unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  lost_reason TEXT,
  won_value DECIMAL(10,2)
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_website_url ON leads(website_url);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_website_score ON leads(website_score);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- =====================
-- ACTIVITIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- =====================
-- PROPOSALS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Content
  executive_summary TEXT,
  problems_identified TEXT[],
  solutions_proposed TEXT[],
  pricing_tiers JSONB,
  selected_tier TEXT,

  -- Metadata
  pdf_url TEXT,
  viewed_at TIMESTAMPTZ,
  viewed_count INTEGER DEFAULT 0,
  signed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'))
);

-- Indexes for proposals
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- =====================
-- CONTRACTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Parties
  client_name TEXT,
  client_email TEXT,
  client_address TEXT,

  -- Terms
  selected_tier JSONB,
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  payment_schedule JSONB,

  -- Scope
  scope_of_work TEXT[],
  deliverables TEXT[],
  timeline TEXT,
  start_date DATE,
  estimated_completion DATE,

  -- Status
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signature_ip TEXT
);

-- Indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_lead_id ON contracts(lead_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- =====================
-- PAYMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stripe
  stripe_payment_id TEXT,
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT,

  -- Metadata
  description TEXT,
  invoice_url TEXT,
  receipt_url TEXT,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================
-- EMAIL EVENTS TABLE (SendGrid Webhooks)
-- =====================
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email_id TEXT, -- SendGrid message ID
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed', 'dropped', 'deferred')),

  -- Details
  email_to TEXT,
  email_subject TEXT,
  url_clicked TEXT,
  bounce_reason TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  sendgrid_event_id TEXT,
  raw_payload JSONB
);

-- Indexes for email_events
CREATE INDEX IF NOT EXISTS idx_email_events_lead_id ON email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC);

-- =====================
-- EMAIL SEQUENCES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Steps
  steps JSONB NOT NULL DEFAULT '[]',
  -- Each step: { delay_days, subject, template, condition }

  -- Stats
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0
);

-- =====================
-- SEQUENCE ENROLLMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Progress
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),

  -- Timing
  next_email_at TIMESTAMPTZ,
  last_email_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Reason for stop
  stop_reason TEXT,

  UNIQUE(sequence_id, lead_id)
);

-- Indexes for sequence_enrollments
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_lead_id ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_email ON sequence_enrollments(next_email_at);

-- =====================
-- UNSUBSCRIBES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Details
  reason TEXT,
  source TEXT, -- 'link_click', 'manual', 'bounce', 'spam'

  UNIQUE(email)
);

-- Index for unsubscribes
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);

-- =====================
-- FUNCTIONS
-- =====================

-- Function to increment emails_sent
CREATE OR REPLACE FUNCTION increment_emails_sent(lead_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET
    emails_sent = emails_sent + 1,
    last_contacted_at = NOW(),
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS email_sequences_updated_at ON email_sequences;
CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for service role, customize as needed)
-- For development, we'll use permissive policies

CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON proposals FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON email_events FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON email_sequences FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON sequence_enrollments FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON unsubscribes FOR ALL USING (true);

-- =====================
-- SAMPLE DATA (Optional)
-- =====================

-- Insert a default admin user (password: admin123)
-- In production, change this immediately!
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@autowebsites.com', '$2a$10$rQEY7xzG1bJqYzQ.9Qz3/.qUGqN7Lx5v1I2xVZvKxYO0F5Kp5mVq2', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create a sample email sequence
INSERT INTO email_sequences (name, description, steps)
VALUES (
  'Default Outreach',
  'Standard 3-email outreach sequence',
  '[
    {"delay_days": 0, "subject": "Quick question about {business_name}", "template": "initial_outreach"},
    {"delay_days": 3, "subject": "Following up - {business_name}", "template": "follow_up_1", "condition": "not_opened"},
    {"delay_days": 7, "subject": "Last chance - {business_name}", "template": "follow_up_2", "condition": "not_replied"}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================
-- VIEWS
-- =====================

-- Pipeline summary view
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT
  pipeline_stage,
  COUNT(*) as count,
  COALESCE(SUM(won_value), 0) as total_value,
  AVG(website_score) as avg_score
FROM leads
WHERE is_unsubscribed = false
GROUP BY pipeline_stage;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT
  a.id,
  a.lead_id,
  l.business_name,
  a.type,
  a.title,
  a.created_at
FROM activities a
JOIN leads l ON a.lead_id = l.id
ORDER BY a.created_at DESC
LIMIT 50;

-- Email performance view
CREATE OR REPLACE VIEW email_performance AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'sent') as sent,
  COUNT(*) FILTER (WHERE event_type = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE event_type = 'opened') as opened,
  COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE event_type = 'bounced') as bounced,
  COUNT(*) FILTER (WHERE event_type = 'spam') as spam
FROM email_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON TABLE leads IS 'Main leads table with full CRM functionality';
COMMENT ON TABLE activities IS 'Activity timeline for all lead interactions';
COMMENT ON TABLE proposals IS 'Generated proposals for leads';
COMMENT ON TABLE contracts IS 'Contracts generated from proposals';
COMMENT ON TABLE payments IS 'Payment records from Stripe';
COMMENT ON TABLE email_events IS 'Email tracking events from SendGrid webhooks';
COMMENT ON TABLE email_sequences IS 'Automated email sequence definitions';
COMMENT ON TABLE sequence_enrollments IS 'Lead enrollments in email sequences';
