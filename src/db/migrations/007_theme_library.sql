-- Migration 007: Theme Library
-- Theme presets, user themes, and font pairings for the dashboard theme builder

-- Theme presets (curated DNA combinations)
CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  dna_code VARCHAR(20) NOT NULL,  -- e.g., "H7-L3-C5-N2-D8"
  preview_thumbnail_url TEXT,
  category VARCHAR(50),           -- 'professional', 'creative', 'minimal', 'bold'
  industries TEXT[],              -- Industries this preset works well for
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved themes
CREATE TABLE IF NOT EXISTS user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                   -- Links to auth system if implemented
  name VARCHAR(100) NOT NULL,
  dna_code VARCHAR(20) NOT NULL,
  custom_colors JSONB,            -- Custom color overrides
  custom_fonts JSONB,             -- Custom font selections
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Font pairings library
CREATE TABLE IF NOT EXISTS font_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  heading_font VARCHAR(100) NOT NULL,
  body_font VARCHAR(100) NOT NULL,
  category VARCHAR(50),           -- 'modern', 'classic', 'playful', 'professional'
  google_fonts_url TEXT,          -- Full Google Fonts import URL
  preview_text TEXT,              -- Sample text for previewing
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_theme_presets_category ON theme_presets(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_theme_presets_industries ON theme_presets USING GIN(industries) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_font_pairings_category ON font_pairings(category) WHERE is_active = TRUE;

-- Insert default font pairings
INSERT INTO font_pairings (name, heading_font, body_font, category, google_fonts_url, preview_text) VALUES
  ('Modern Sans', 'Inter', 'Inter', 'modern', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', 'Clean and versatile for any business'),
  ('Classic Serif', 'Playfair Display', 'Source Sans Pro', 'classic', 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@400;600&display=swap', 'Elegant and timeless appeal'),
  ('Professional', 'Montserrat', 'Open Sans', 'professional', 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap', 'Corporate and trustworthy'),
  ('Bold Impact', 'Oswald', 'Roboto', 'bold', 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500&display=swap', 'Strong and attention-grabbing'),
  ('Warm Friendly', 'Poppins', 'Nunito', 'playful', 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Nunito:wght@400;600&display=swap', 'Approachable and welcoming'),
  ('Elegant Therapy', 'Cormorant Garamond', 'Lato', 'classic', 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Lato:wght@400;700&display=swap', 'Calm and professional for wellness'),
  ('Tech Modern', 'Space Grotesk', 'IBM Plex Sans', 'modern', 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500&display=swap', 'Contemporary tech aesthetic'),
  ('Creative Display', 'DM Serif Display', 'DM Sans', 'creative', 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap', 'Artistic and distinctive')
ON CONFLICT DO NOTHING;

-- Insert default theme presets
INSERT INTO theme_presets (name, description, dna_code, category, industries) VALUES
  ('Professional Trust', 'Clean, trustworthy design perfect for service businesses', 'H1-L11-C11-N1-D1', 'professional', ARRAY['plumbers', 'hvac', 'electrician', 'contractor']),
  ('Modern Minimal', 'Sleek minimal design with focus on content', 'H3-L5-C1-N9-D4', 'minimal', ARRAY['therapist', 'lawyer', 'accountant']),
  ('Bold Impact', 'High-energy design for fitness and action industries', 'H1-L8-C9-N1-D3', 'bold', ARRAY['fitness', 'gym', 'photographer']),
  ('Warm Welcome', 'Inviting design for hospitality and wellness', 'H5-L3-C3-N2-D1', 'creative', ARRAY['restaurant', 'yoga', 'chiropractor']),
  ('Corporate Classic', 'Traditional professional look for established businesses', 'H2-L1-C11-N1-D11', 'professional', ARRAY['lawyer', 'accountant', 'financial-advisor']),
  ('Health & Care', 'Calming design for medical and wellness providers', 'H3-L11-C4-N1-D1', 'professional', ARRAY['dentist', 'veterinarian', 'chiropractor', 'therapist']),
  ('Creative Portfolio', 'Showcase-focused design for visual industries', 'H7-L2-C6-N7-D6', 'creative', ARRAY['photographer', 'designer', 'artist']),
  ('Emergency Ready', 'High-visibility design for urgent services', 'H1-L8-C3-N1-D2', 'bold', ARRAY['plumbers', 'electrician', 'roofer', 'hvac']),
  ('Luxury Premium', 'Elegant design for high-end services', 'H5-L4-C12-N2-D10', 'creative', ARRAY['realtor', 'financial-advisor', 'restaurant']),
  ('Local Business', 'Friendly community-focused design', 'H2-L3-C5-N1-D1', 'minimal', ARRAY['restaurant', 'contractor', 'veterinarian'])
ON CONFLICT DO NOTHING;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_theme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS theme_presets_updated_at ON theme_presets;
CREATE TRIGGER theme_presets_updated_at
  BEFORE UPDATE ON theme_presets
  FOR EACH ROW EXECUTE FUNCTION update_theme_updated_at();

DROP TRIGGER IF EXISTS user_themes_updated_at ON user_themes;
CREATE TRIGGER user_themes_updated_at
  BEFORE UPDATE ON user_themes
  FOR EACH ROW EXECUTE FUNCTION update_theme_updated_at();
