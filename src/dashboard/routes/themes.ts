/**
 * Themes API Router
 *
 * Provides endpoints for theme builder functionality:
 * - Theme presets (curated DNA combinations)
 * - Font pairings
 * - Live preview generation
 * - User theme management
 */

import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../utils/supabase';
import {
  HERO_VARIANTS,
  LAYOUT_VARIANTS,
  COLOR_VARIANTS,
  NAV_VARIANTS,
  DESIGN_VARIANTS,
  generateDNACode,
  getDNADescription,
  DNACode
} from '../../themes/variance-planner';
import { logger } from '../../utils/logger';

/**
 * Create themes router
 */
export function createThemesRouter(): Router {
  const router = Router();

  /**
   * GET /api/themes/variants
   * Get all variant options for each DNA dimension
   */
  router.get('/variants', async (req: Request, res: Response) => {
    try {
      const variants = {
        hero: Object.entries(HERO_VARIANTS).map(([code, info]) => ({
          code,
          name: info.name,
          description: info.description
        })),
        layout: Object.entries(LAYOUT_VARIANTS).map(([code, info]) => ({
          code,
          name: info.name,
          description: info.description
        })),
        color: Object.entries(COLOR_VARIANTS).map(([code, info]) => ({
          code,
          name: info.name,
          colors: info.colors
        })),
        nav: Object.entries(NAV_VARIANTS).map(([code, info]) => ({
          code,
          name: info.name,
          description: info.description
        })),
        design: Object.entries(DESIGN_VARIANTS).map(([code, info]) => ({
          code,
          name: info.name,
          borderRadius: info.borderRadius,
          shadow: info.shadow,
          style: info.style
        }))
      };

      res.json({ success: true, data: variants });
    } catch (error: any) {
      logger.error('Failed to get variants', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get variants' });
    }
  });

  /**
   * GET /api/themes/presets
   * List curated theme presets
   */
  router.get('/presets', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseClient();
      const { category, industry } = req.query;

      let query = supabase
        .from('theme_presets')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      if (industry) {
        query = query.contains('industries', [industry]);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Failed to get theme presets', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get theme presets' });
    }
  });

  /**
   * GET /api/themes/fonts
   * List font pairings
   */
  router.get('/fonts', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseClient();
      const { category } = req.query;

      let query = supabase
        .from('font_pairings')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Failed to get font pairings', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get font pairings' });
    }
  });

  /**
   * GET /api/themes/preview
   * Generate live preview HTML for a DNA code
   */
  router.get('/preview', async (req: Request, res: Response) => {
    try {
      const { dna, template = 'plumber' } = req.query;

      if (!dna || typeof dna !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'DNA code is required (format: H1-L1-C1-N1-D1)'
        });
      }

      // Parse DNA code
      const parts = dna.split('-');
      if (parts.length !== 5) {
        return res.status(400).json({
          success: false,
          error: 'Invalid DNA code format. Expected: H#-L#-C#-N#-D#'
        });
      }

      const [hero, layout, color, nav, design] = parts;
      const dnaCode: DNACode = { hero, layout, color, nav, design };

      // Validate each part exists
      if (!HERO_VARIANTS[hero] || !LAYOUT_VARIANTS[layout] ||
          !COLOR_VARIANTS[color] || !NAV_VARIANTS[nav] || !DESIGN_VARIANTS[design]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid DNA code. One or more variant codes not found.'
        });
      }

      // Generate preview HTML
      const colorScheme = COLOR_VARIANTS[color].colors;
      const designStyle = DESIGN_VARIANTS[design];
      const description = getDNADescription(dnaCode);

      const previewHtml = generatePreviewHtml({
        dna: dnaCode,
        colors: colorScheme,
        design: designStyle,
        description,
        template: template as string
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(previewHtml);
    } catch (error: any) {
      logger.error('Failed to generate preview', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to generate preview' });
    }
  });

  /**
   * GET /api/themes/random
   * Generate a random DNA code
   */
  router.get('/random', async (req: Request, res: Response) => {
    try {
      const dna = generateDNACode();
      const dnaString = `${dna.hero}-${dna.layout}-${dna.color}-${dna.nav}-${dna.design}`;
      const description = getDNADescription(dna);

      res.json({
        success: true,
        data: {
          dna,
          dnaString,
          description
        }
      });
    } catch (error: any) {
      logger.error('Failed to generate random DNA', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to generate random DNA' });
    }
  });

  /**
   * POST /api/themes/save
   * Save a user's custom theme
   */
  router.post('/save', async (req: Request, res: Response) => {
    try {
      const { name, dna_code, custom_colors, custom_fonts } = req.body;

      if (!name || !dna_code) {
        return res.status(400).json({
          success: false,
          error: 'Name and DNA code are required'
        });
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('user_themes')
        .insert({
          name,
          dna_code,
          custom_colors: custom_colors || null,
          custom_fonts: custom_fonts || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to save theme', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to save theme' });
    }
  });

  /**
   * GET /api/themes/user
   * Get user's saved themes
   */
  router.get('/user', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('user_themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Failed to get user themes', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to get user themes' });
    }
  });

  /**
   * DELETE /api/themes/user/:id
   * Delete a user's saved theme
   */
  router.delete('/user/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('user_themes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({ success: true, message: 'Theme deleted' });
    } catch (error: any) {
      logger.error('Failed to delete theme', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to delete theme' });
    }
  });

  /**
   * PATCH /api/themes/user/:id/favorite
   * Toggle favorite status on a saved theme
   */
  router.patch('/user/:id/favorite', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const supabase = getSupabaseClient();

      // Get current status
      const { data: current, error: getError } = await supabase
        .from('user_themes')
        .select('is_favorite')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      // Toggle it
      const { data, error } = await supabase
        .from('user_themes')
        .update({ is_favorite: !current.is_favorite })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Failed to toggle favorite', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
    }
  });

  return router;
}

/**
 * Generate preview HTML for a DNA configuration
 */
interface PreviewConfig {
  dna: DNACode;
  colors: { bg: string; text: string; primary: string; accent: string };
  design: { name: string; borderRadius: string; shadow: string; style: string };
  description: string;
  template: string;
}

function generatePreviewHtml(config: PreviewConfig): string {
  const { dna, colors, design, description } = config;

  // Get variant names for display
  const heroName = HERO_VARIANTS[dna.hero]?.name || dna.hero;
  const layoutName = LAYOUT_VARIANTS[dna.layout]?.name || dna.layout;
  const navName = NAV_VARIANTS[dna.nav]?.name || dna.nav;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Theme Preview - ${dna.hero}-${dna.layout}-${dna.color}-${dna.nav}-${dna.design}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${colors.bg};
      --text: ${colors.text};
      --primary: ${colors.primary};
      --accent: ${colors.accent};
      --border-radius: ${design.borderRadius};
      --shadow: ${design.shadow};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* DNA Info Bar */
    .dna-bar {
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dna-code {
      font-family: monospace;
      background: rgba(255,255,255,0.1);
      padding: 4px 12px;
      border-radius: 4px;
    }

    /* Header */
    header {
      background: ${dna.nav === 'N2' ? 'transparent' : 'white'};
      padding: 16px 0;
      border-bottom: ${dna.nav === 'N2' ? 'none' : '1px solid #e5e7eb'};
      ${dna.nav === 'N1' || dna.nav === 'N7' ? 'position: sticky; top: 0; z-index: 100;' : ''}
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
    }

    nav {
      display: flex;
      gap: 32px;
    }

    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 600;
      box-shadow: var(--shadow);
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: white;
      padding: ${dna.hero === 'H3' ? '60px 0' : '80px 0'};
      ${dna.hero === 'H1' ? 'min-height: 500px; display: flex; align-items: center;' : ''}
    }

    .hero-content {
      ${dna.hero === 'H2' || dna.hero === 'H8' ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;' : ''}
      ${dna.hero === 'H9' ? 'text-align: center; max-width: 800px; margin: 0 auto;' : ''}
    }

    .hero h1 {
      font-size: ${dna.hero === 'H9' ? '56px' : '48px'};
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .hero p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      ${dna.hero === 'H9' ? 'justify-content: center;' : ''}
    }

    .btn-white {
      background: white;
      color: var(--primary);
      padding: 16px 32px;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 700;
      box-shadow: var(--shadow);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: var(--border-radius);
      text-decoration: none;
      font-weight: 600;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: var(--border-radius);
      height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }

    /* Services Section */
    .services {
      padding: 80px 0;
      background: #f9fafb;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .section-header p {
      color: #6b7280;
      font-size: 18px;
    }

    .services-grid {
      display: grid;
      ${dna.layout === 'L2' ? 'grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));' : ''}
      ${dna.layout === 'L3' || dna.layout === 'L10' ? 'grid-template-columns: repeat(3, 1fr);' : ''}
      ${dna.layout === 'L5' ? 'grid-template-columns: 1fr; max-width: 600px; margin: 0 auto;' : ''}
      ${!['L2', 'L3', 'L5', 'L10'].includes(dna.layout) ? 'grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));' : ''}
      gap: 24px;
    }

    .service-card {
      background: white;
      border-radius: var(--border-radius);
      padding: 32px;
      border: ${design.style === 'outlined' ? '2px solid #e5e7eb' : '1px solid #e5e7eb'};
      box-shadow: ${design.style === 'flat' ? 'none' : design.shadow};
      transition: all 0.2s ease;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    }

    .service-icon {
      width: 56px;
      height: 56px;
      background: var(--primary);
      border-radius: ${dna.design === 'D8' ? '9999px' : '12px'};
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 24px;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .service-card p {
      color: #6b7280;
      font-size: 15px;
    }

    /* Stats Section */
    .stats {
      padding: 60px 0;
      background: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      text-align: center;
    }

    .stat-number {
      font-size: 48px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 16px;
      font-weight: 600;
    }

    /* Footer */
    footer {
      background: #1f2937;
      color: white;
      padding: 40px 0;
      text-align: center;
    }

    footer p {
      color: #9ca3af;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      nav { display: none; }
      .hero-content { grid-template-columns: 1fr !important; }
      .hero-image { display: none; }
      .hero h1 { font-size: 32px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .services-grid { grid-template-columns: 1fr !important; }
    }
  </style>
</head>
<body>
  <div class="dna-bar">
    <span>${description}</span>
    <span class="dna-code">${dna.hero}-${dna.layout}-${dna.color}-${dna.nav}-${dna.design}</span>
  </div>

  <header>
    <div class="container header-content">
      <div class="logo">Business Name</div>
      <nav>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#" class="header-cta">Get Started</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-content">
      <div>
        <h1>Professional Service for Your Needs</h1>
        <p>We provide exceptional quality and reliable service you can trust.</p>
        <div class="hero-buttons">
          <a href="#" class="btn-white">Get Free Quote</a>
          <a href="#" class="btn-outline">Learn More</a>
        </div>
      </div>
      ${dna.hero === 'H2' || dna.hero === 'H8' ? '<div class="hero-image">📸</div>' : ''}
    </div>
  </section>

  <section class="services">
    <div class="container">
      <div class="section-header">
        <h2>Our Services</h2>
        <p>Professional solutions tailored to your needs</p>
      </div>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">⭐</div>
          <h3>Service One</h3>
          <p>Expert solutions with attention to detail and quality craftsmanship.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">🔧</div>
          <h3>Service Two</h3>
          <p>Reliable and efficient service you can count on every time.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">💡</div>
          <h3>Service Three</h3>
          <p>Innovative approaches to solve your unique challenges.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="stats">
    <div class="container">
      <div class="stats-grid">
        <div>
          <div class="stat-number">15+</div>
          <div class="stat-label">Years Experience</div>
        </div>
        <div>
          <div class="stat-number">500+</div>
          <div class="stat-label">Happy Customers</div>
        </div>
        <div>
          <div class="stat-number">24/7</div>
          <div class="stat-label">Support</div>
        </div>
        <div>
          <div class="stat-number">100%</div>
          <div class="stat-label">Satisfaction</div>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} Business Name. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
}
