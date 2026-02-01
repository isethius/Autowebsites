-- Migration 008: Template Registry
-- Centralized template management and analytics

-- Templates registry
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(50) PRIMARY KEY,     -- e.g., 'plumber', 'dentist', 'restaurant'
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- 'service', 'professional', 'health', 'creative'
  description TEXT,
  thumbnail_url TEXT,
  sections JSONB NOT NULL,        -- Array of section types
  color_palettes JSONB NOT NULL,  -- Array of color palette objects
  suggested_ctas JSONB,           -- Array of CTA strings
  trust_signals JSONB,            -- Array of trust signal strings
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template usage analytics
CREATE TABLE IF NOT EXISTS template_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) REFERENCES templates(id) ON DELETE CASCADE,
  lead_id UUID,                   -- Optional link to lead
  user_id UUID,                   -- Optional link to user
  action VARCHAR(50) NOT NULL,    -- 'preview', 'generate', 'deploy', 'select'
  metadata JSONB,                 -- Additional context (palette used, DNA code, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_template_analytics_template ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_action ON template_analytics(action);
CREATE INDEX IF NOT EXISTS idx_template_analytics_created ON template_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_sort ON templates(sort_order, display_name) WHERE is_active = TRUE;

-- Insert default templates
INSERT INTO templates (id, display_name, category, description, sections, color_palettes, suggested_ctas, trust_signals, sort_order) VALUES
  ('plumber', 'Plumbing Services', 'service', 'Professional template for plumbing businesses with emergency service focus',
   '["hero", "services", "service-areas", "emergency", "reviews", "about", "contact"]'::jsonb,
   '[{"name": "Trust Blue", "primary": "#1e5a8a", "secondary": "#164768", "accent": "#2980b9", "background": "#ffffff", "text": "#1f2937", "muted": "#6b7280"}]'::jsonb,
   '["Call Now", "Get a Free Quote", "Schedule Service", "Emergency Service"]'::jsonb,
   '["Licensed & Insured", "24/7 Emergency", "Satisfaction Guaranteed", "Years in Business"]'::jsonb,
   1),

  ('hvac', 'HVAC Services', 'service', 'Template for heating and cooling businesses with financing options',
   '["hero", "services", "maintenance-plans", "financing", "certifications", "service-areas", "contact"]'::jsonb,
   '[{"name": "Cool Comfort", "primary": "#0369a1", "secondary": "#075985", "accent": "#0ea5e9", "background": "#ffffff", "text": "#1f2937", "muted": "#6b7280"}]'::jsonb,
   '["Schedule Service", "Get a Free Estimate", "Call for Emergency", "Learn About Financing"]'::jsonb,
   '["NATE Certified", "EPA Certified", "Financing Available", "24/7 Service"]'::jsonb,
   2),

  ('therapist', 'Therapist / Counselor', 'health', 'Calming template for mental health professionals',
   '["hero", "specialties", "approach", "about", "sessions", "faq", "contact"]'::jsonb,
   '[{"name": "Calm Sage", "primary": "#5f7161", "secondary": "#4a5a4c", "accent": "#8ba889", "background": "#faf9f7", "text": "#2d3436", "muted": "#636e72"}]'::jsonb,
   '["Schedule a Consultation", "Book Your First Session", "Get Started", "Connect With Me"]'::jsonb,
   '["Licensed Professional", "Years of Experience", "Specializations", "Confidential"]'::jsonb,
   10),

  ('gym', 'Fitness Center', 'health', 'Energetic template for gyms and fitness centers',
   '["hero", "programs", "trainers", "membership", "schedule", "facility", "free-trial", "contact"]'::jsonb,
   '[{"name": "Power Red", "primary": "#dc2626", "secondary": "#b91c1c", "accent": "#ef4444", "background": "#ffffff", "text": "#1f2937", "muted": "#6b7280"}]'::jsonb,
   '["Start Free Trial", "Join Now", "Book a Tour", "Get Your Free Pass"]'::jsonb,
   '["Certified Trainers", "State-of-the-Art Equipment", "Flexible Hours", "Results Guaranteed"]'::jsonb,
   11)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  color_palettes = EXCLUDED.color_palettes,
  suggested_ctas = EXCLUDED.suggested_ctas,
  trust_signals = EXCLUDED.trust_signals,
  updated_at = NOW();

-- Helper function to log template actions
CREATE OR REPLACE FUNCTION log_template_action(
  p_template_id VARCHAR(50),
  p_action VARCHAR(50),
  p_lead_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO template_analytics (template_id, action, lead_id, user_id, metadata)
  VALUES (p_template_id, p_action, p_lead_id, p_user_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Get template usage stats
CREATE OR REPLACE FUNCTION get_template_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  template_id VARCHAR(50),
  display_name VARCHAR(100),
  previews BIGINT,
  generations BIGINT,
  deployments BIGINT,
  total_actions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as template_id,
    t.display_name,
    COUNT(*) FILTER (WHERE ta.action = 'preview') as previews,
    COUNT(*) FILTER (WHERE ta.action = 'generate') as generations,
    COUNT(*) FILTER (WHERE ta.action = 'deploy') as deployments,
    COUNT(*) as total_actions
  FROM templates t
  LEFT JOIN template_analytics ta ON t.id = ta.template_id
    AND ta.created_at >= NOW() - (p_days || ' days')::INTERVAL
  WHERE t.is_active = TRUE
  GROUP BY t.id, t.display_name
  ORDER BY total_actions DESC;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
DROP TRIGGER IF EXISTS templates_updated_at ON templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_theme_updated_at();
