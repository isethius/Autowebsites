/**
 * Templates API Router
 *
 * Provides endpoints for industry template preview functionality:
 * - Template preview generation by template ID
 * - Template listing (available templates)
 */

import { Router, Request, Response } from 'express';
import { INDUSTRY_CONFIGS } from '../../preview/industry-templates';
import { logger } from '../../utils/logger';
import { ColorPalette, IndustryTemplateConfig } from '../../overnight/types';

/**
 * Create templates router
 */
export function createTemplatesRouter(): Router {
  const router = Router();

  /**
   * GET /api/templates/list
   * List all available templates
   */
  router.get('/list', async (req: Request, res: Response) => {
    try {
      const templates = Object.entries(INDUSTRY_CONFIGS).map(([id, config]) => ({
        id,
        display_name: config.display_name,
        industry: config.industry,
        sections: config.sections,
        suggested_ctas: config.suggested_ctas,
        trust_signals: config.trust_signals,
        palette_count: config.color_palettes.length,
      }));

      res.json({ success: true, data: templates });
    } catch (error: any) {
      logger.error('Failed to list templates', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to list templates' });
    }
  });

  /**
   * GET /api/templates/preview
   * Generate preview HTML for a template by ID
   */
  router.get('/preview', async (req: Request, res: Response) => {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Template ID is required (e.g., ?id=plumber)'
        });
      }

      // Look up template configuration
      const config = INDUSTRY_CONFIGS[id];
      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Template not found: ${id}. Available templates: ${Object.keys(INDUSTRY_CONFIGS).join(', ')}`
        });
      }

      // Select the first color palette (or could randomize)
      const palette = config.color_palettes[0];

      // Generate preview HTML
      const previewHtml = generateTemplatePreviewHtml(id, config, palette);

      res.setHeader('Content-Type', 'text/html');
      res.send(previewHtml);
    } catch (error: any) {
      logger.error('Failed to generate template preview', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to generate template preview' });
    }
  });

  return router;
}

/**
 * Generate preview HTML for an industry template
 */
function generateTemplatePreviewHtml(
  templateId: string,
  config: IndustryTemplateConfig,
  palette: ColorPalette
): string {
  // Get sample content based on template type
  const content = getTemplateContent(templateId, config);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.display_name} Template Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--background);
      color: var(--text);
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Template Info Bar */
    .template-bar {
      background: #1f2937;
      color: white;
      padding: 12px 20px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .template-name {
      font-weight: 600;
    }

    .palette-name {
      font-family: monospace;
      background: rgba(255,255,255,0.1);
      padding: 4px 12px;
      border-radius: 4px;
    }

    .template-sections {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .section-tag {
      background: rgba(255,255,255,0.15);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* Header */
    header {
      background: white;
      padding: 16px 0;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
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

    nav a:hover {
      color: var(--primary);
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }

    .header-cta:hover {
      background: var(--secondary);
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 80px 0;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero h1 {
      font-size: 48px;
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
    }

    .btn-white {
      background: white;
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      transition: transform 0.2s;
    }

    .btn-white:hover {
      transform: translateY(-2px);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
    }

    /* Trust Signals */
    .trust-signals {
      background: white;
      padding: 24px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .trust-grid {
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--muted);
    }

    .trust-icon {
      color: var(--primary);
      font-size: 20px;
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
      color: var(--muted);
      font-size: 18px;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .service-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #e5e7eb;
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
      border-radius: 12px;
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
      color: var(--muted);
      font-size: 15px;
    }

    /* CTA Section */
    .cta-section {
      padding: 80px 0;
      background: var(--primary);
      color: white;
      text-align: center;
    }

    .cta-section h2 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .cta-section p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .cta-buttons .btn-white {
      background: white;
      color: var(--primary);
    }

    /* Footer */
    footer {
      background: #1f2937;
      color: white;
      padding: 48px 0;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 48px;
    }

    .footer-brand .logo {
      color: white;
      margin-bottom: 16px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
    }

    .footer-column h4 {
      font-weight: 600;
      margin-bottom: 16px;
    }

    .footer-column a {
      display: block;
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .footer-column a:hover {
      color: white;
    }

    .footer-bottom {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #374151;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      nav { display: none; }
      .hero-content { grid-template-columns: 1fr; }
      .hero-image { display: none; }
      .hero h1 { font-size: 32px; }
      .trust-grid { gap: 24px; }
      .services-grid { grid-template-columns: 1fr; }
      .footer-content { grid-template-columns: 1fr; gap: 32px; }
    }
  </style>
</head>
<body>
  <div class="template-bar">
    <span class="template-name">${config.display_name} Template</span>
    <span class="palette-name">${palette.name}</span>
    <div class="template-sections">
      ${config.sections.map(s => `<span class="section-tag">${s}</span>`).join('')}
    </div>
  </div>

  <header>
    <div class="container header-content">
      <div class="logo">${content.businessName}</div>
      <nav>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#" class="header-cta">${config.suggested_ctas[0]}</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-content">
      <div>
        <h1>${content.headline}</h1>
        <p>${content.subheadline}</p>
        <div class="hero-buttons">
          <a href="#" class="btn-white">${config.suggested_ctas[0]}</a>
          <a href="#" class="btn-outline">${config.suggested_ctas[1] || 'Learn More'}</a>
        </div>
      </div>
      <div class="hero-image">${content.heroIcon}</div>
    </div>
  </section>

  <section class="trust-signals">
    <div class="container">
      <div class="trust-grid">
        ${config.trust_signals.map(signal => `
          <div class="trust-item">
            <span class="trust-icon">✓</span>
            <span>${signal}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="services">
    <div class="container">
      <div class="section-header">
        <h2>${content.servicesTitle}</h2>
        <p>${content.servicesSubtitle}</p>
      </div>
      <div class="services-grid">
        ${content.services.map(service => `
          <div class="service-card">
            <div class="service-icon">${service.icon}</div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="cta-section">
    <div class="container">
      <h2>${content.ctaHeadline}</h2>
      <p>${content.ctaSubheadline}</p>
      <div class="cta-buttons">
        ${config.suggested_ctas.slice(0, 2).map(cta => `
          <a href="#" class="btn-white">${cta}</a>
        `).join('')}
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="logo">${content.businessName}</div>
          <p>${content.footerDescription}</p>
        </div>
        <div class="footer-column">
          <h4>Services</h4>
          ${content.services.slice(0, 4).map(s => `<a href="#">${s.name}</a>`).join('')}
        </div>
        <div class="footer-column">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Our Team</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>
        <div class="footer-column">
          <h4>Contact</h4>
          <a href="#">(555) 123-4567</a>
          <a href="#">info@example.com</a>
          <a href="#">123 Main Street</a>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} ${content.businessName}. All rights reserved.
      </div>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Get sample content for a template
 */
interface TemplateContent {
  businessName: string;
  headline: string;
  subheadline: string;
  heroIcon: string;
  servicesTitle: string;
  servicesSubtitle: string;
  services: Array<{ name: string; icon: string; description: string }>;
  ctaHeadline: string;
  ctaSubheadline: string;
  footerDescription: string;
}

function getTemplateContent(templateId: string, config: IndustryTemplateConfig): TemplateContent {
  // Industry-specific content
  const contentMap: Record<string, TemplateContent> = {
    plumber: {
      businessName: 'Pro Plumbing Co.',
      headline: 'Expert Plumbing Services You Can Trust',
      subheadline: 'Fast, reliable plumbing repairs and installations. Available 24/7 for emergencies.',
      heroIcon: '🔧',
      servicesTitle: 'Our Plumbing Services',
      servicesSubtitle: 'From leaky faucets to complete remodels',
      services: [
        { name: 'Emergency Repairs', icon: '🚨', description: '24/7 emergency plumbing service for burst pipes, major leaks, and urgent issues.' },
        { name: 'Drain Cleaning', icon: '🚿', description: 'Professional drain cleaning to remove clogs and prevent future blockages.' },
        { name: 'Water Heaters', icon: '🔥', description: 'Installation, repair, and maintenance of all water heater types.' },
        { name: 'Pipe Repair', icon: '🔧', description: 'Expert pipe repair and replacement services for your home or business.' },
      ],
      ctaHeadline: 'Need a Plumber?',
      ctaSubheadline: 'Get fast, reliable service from licensed professionals.',
      footerDescription: 'Serving the community with quality plumbing services for over 20 years.',
    },
    hvac: {
      businessName: 'Climate Control HVAC',
      headline: 'Stay Comfortable Year-Round',
      subheadline: 'Professional heating and cooling services for homes and businesses.',
      heroIcon: '❄️',
      servicesTitle: 'HVAC Services',
      servicesSubtitle: 'Heating, cooling, and air quality solutions',
      services: [
        { name: 'AC Installation', icon: '❄️', description: 'Expert installation of energy-efficient air conditioning systems.' },
        { name: 'Heating Services', icon: '🔥', description: 'Furnace and heat pump installation, repair, and maintenance.' },
        { name: 'Maintenance Plans', icon: '📋', description: 'Regular maintenance to keep your system running efficiently.' },
        { name: 'Indoor Air Quality', icon: '💨', description: 'Air purification and filtration solutions for cleaner air.' },
      ],
      ctaHeadline: 'Schedule Your Service Today',
      ctaSubheadline: 'NATE certified technicians ready to help.',
      footerDescription: 'Your trusted partner for all heating and cooling needs.',
    },
    dentist: {
      businessName: 'Smile Dental Care',
      headline: 'Your Smile, Our Priority',
      subheadline: 'Gentle, comprehensive dental care for the whole family.',
      heroIcon: '🦷',
      servicesTitle: 'Dental Services',
      servicesSubtitle: 'Complete care for beautiful, healthy smiles',
      services: [
        { name: 'General Dentistry', icon: '🦷', description: 'Routine exams, cleanings, and preventive care.' },
        { name: 'Cosmetic Dentistry', icon: '✨', description: 'Whitening, veneers, and smile makeovers.' },
        { name: 'Restorative Care', icon: '🔧', description: 'Fillings, crowns, bridges, and implants.' },
        { name: 'Emergency Care', icon: '🚨', description: 'Same-day appointments for dental emergencies.' },
      ],
      ctaHeadline: 'Ready for a Healthier Smile?',
      ctaSubheadline: 'New patients welcome. Insurance accepted.',
      footerDescription: 'Providing quality dental care with a gentle touch.',
    },
    lawyer: {
      businessName: 'Justice Law Firm',
      headline: 'Fighting for Your Rights',
      subheadline: 'Experienced legal representation when you need it most.',
      heroIcon: '⚖️',
      servicesTitle: 'Practice Areas',
      servicesSubtitle: 'Comprehensive legal services',
      services: [
        { name: 'Personal Injury', icon: '🏥', description: 'Get the compensation you deserve for your injuries.' },
        { name: 'Family Law', icon: '👨‍👩‍👧', description: 'Divorce, custody, and family legal matters.' },
        { name: 'Criminal Defense', icon: '⚖️', description: 'Aggressive defense for criminal charges.' },
        { name: 'Business Law', icon: '💼', description: 'Contracts, disputes, and corporate matters.' },
      ],
      ctaHeadline: 'Free Consultation',
      ctaSubheadline: 'Speak with an experienced attorney today.',
      footerDescription: 'Dedicated to achieving justice for our clients.',
    },
    realtor: {
      businessName: 'Premier Realty',
      headline: 'Find Your Dream Home',
      subheadline: 'Expert guidance through every step of your real estate journey.',
      heroIcon: '🏠',
      servicesTitle: 'Real Estate Services',
      servicesSubtitle: 'Buying, selling, and investing',
      services: [
        { name: 'Home Buying', icon: '🏠', description: 'Find the perfect home with expert guidance.' },
        { name: 'Home Selling', icon: '💰', description: 'Get top dollar for your property.' },
        { name: 'Market Analysis', icon: '📊', description: 'Free home valuations and market insights.' },
        { name: 'Investment Properties', icon: '📈', description: 'Grow your portfolio with smart investments.' },
      ],
      ctaHeadline: 'Ready to Make a Move?',
      ctaSubheadline: 'Contact us for a free consultation.',
      footerDescription: 'Your trusted local real estate experts.',
    },
    restaurant: {
      businessName: 'The Local Kitchen',
      headline: 'Fresh, Local, Delicious',
      subheadline: 'Farm-to-table dining in a warm, welcoming atmosphere.',
      heroIcon: '🍽️',
      servicesTitle: 'Our Menu',
      servicesSubtitle: 'Made with love, served with care',
      services: [
        { name: 'Breakfast', icon: '🍳', description: 'Start your day with our hearty breakfast selections.' },
        { name: 'Lunch', icon: '🥗', description: 'Fresh salads, sandwiches, and daily specials.' },
        { name: 'Dinner', icon: '🍽️', description: 'Elegant dinner options for any occasion.' },
        { name: 'Catering', icon: '🎉', description: 'Let us cater your next event.' },
      ],
      ctaHeadline: 'Reserve Your Table',
      ctaSubheadline: 'Experience dining at its finest.',
      footerDescription: 'A neighborhood favorite since 2010.',
    },
    contractor: {
      businessName: 'BuildRight Construction',
      headline: 'Quality Craftsmanship, On Time & Budget',
      subheadline: 'Full-service general contracting for residential and commercial projects.',
      heroIcon: '🏗️',
      servicesTitle: 'Our Services',
      servicesSubtitle: 'From concept to completion',
      services: [
        { name: 'New Construction', icon: '🏗️', description: 'Custom home and commercial building.' },
        { name: 'Remodeling', icon: '🔨', description: 'Kitchen, bath, and whole-home renovations.' },
        { name: 'Additions', icon: '📐', description: 'Expand your space with quality additions.' },
        { name: 'Commercial', icon: '🏢', description: 'Commercial construction and tenant improvements.' },
      ],
      ctaHeadline: 'Start Your Project',
      ctaSubheadline: 'Free estimates on all projects.',
      footerDescription: 'Building dreams into reality for over 25 years.',
    },
    electrician: {
      businessName: 'Spark Electric',
      headline: 'Safe, Reliable Electrical Services',
      subheadline: 'Licensed electricians for all your residential and commercial needs.',
      heroIcon: '⚡',
      servicesTitle: 'Electrical Services',
      servicesSubtitle: 'Safety first, quality always',
      services: [
        { name: 'Panel Upgrades', icon: '⚡', description: 'Upgrade your electrical panel for safety and capacity.' },
        { name: 'Wiring & Rewiring', icon: '🔌', description: 'New wiring installation and old wiring replacement.' },
        { name: 'Lighting', icon: '💡', description: 'Indoor, outdoor, and landscape lighting.' },
        { name: 'Emergency Service', icon: '🚨', description: '24/7 emergency electrical repairs.' },
      ],
      ctaHeadline: 'Need an Electrician?',
      ctaSubheadline: 'Licensed, insured, and ready to help.',
      footerDescription: 'Powering homes and businesses safely.',
    },
    roofer: {
      businessName: 'TopShield Roofing',
      headline: 'Protecting What Matters Most',
      subheadline: 'Expert roofing services with quality materials and workmanship.',
      heroIcon: '🏠',
      servicesTitle: 'Roofing Services',
      servicesSubtitle: 'Your roof, our expertise',
      services: [
        { name: 'Roof Replacement', icon: '🏠', description: 'Complete roof replacement with premium materials.' },
        { name: 'Roof Repair', icon: '🔧', description: 'Fast repairs for leaks, damage, and wear.' },
        { name: 'Storm Damage', icon: '⛈️', description: 'Emergency storm damage assessment and repair.' },
        { name: 'Inspections', icon: '🔍', description: 'Free roof inspections and estimates.' },
      ],
      ctaHeadline: 'Free Roof Inspection',
      ctaSubheadline: 'Know the condition of your roof.',
      footerDescription: 'Quality roofing that stands the test of time.',
    },
    chiropractor: {
      businessName: 'Align Chiropractic',
      headline: 'Natural Pain Relief & Wellness',
      subheadline: 'Gentle, effective chiropractic care for the whole family.',
      heroIcon: '🦴',
      servicesTitle: 'Chiropractic Services',
      servicesSubtitle: 'Holistic care for lasting relief',
      services: [
        { name: 'Spinal Adjustments', icon: '🦴', description: 'Gentle adjustments to restore proper alignment.' },
        { name: 'Pain Management', icon: '💪', description: 'Relief from back pain, neck pain, and headaches.' },
        { name: 'Sports Injuries', icon: '🏃', description: 'Treatment and rehabilitation for athletes.' },
        { name: 'Wellness Care', icon: '❤️', description: 'Preventive care for optimal health.' },
      ],
      ctaHeadline: 'Start Feeling Better',
      ctaSubheadline: 'New patient special - free consultation.',
      footerDescription: 'Helping patients live pain-free since 2005.',
    },
    veterinarian: {
      businessName: 'Pawsitive Pet Care',
      headline: 'Compassionate Care for Your Pets',
      subheadline: 'Full-service veterinary clinic for dogs, cats, and exotic pets.',
      heroIcon: '🐾',
      servicesTitle: 'Veterinary Services',
      servicesSubtitle: 'Caring for your furry family members',
      services: [
        { name: 'Wellness Exams', icon: '🩺', description: 'Comprehensive health checks and vaccinations.' },
        { name: 'Surgery', icon: '🏥', description: 'Spay, neuter, and surgical procedures.' },
        { name: 'Dental Care', icon: '🦷', description: 'Cleanings, extractions, and oral health.' },
        { name: 'Emergency Care', icon: '🚨', description: 'Urgent care when your pet needs it most.' },
      ],
      ctaHeadline: 'Schedule a Visit',
      ctaSubheadline: 'New patients and walk-ins welcome.',
      footerDescription: 'Where pets are family.',
    },
    photographer: {
      businessName: 'Capture Studios',
      headline: 'Moments Worth Remembering',
      subheadline: 'Professional photography for life\'s most precious moments.',
      heroIcon: '📸',
      servicesTitle: 'Photography Services',
      servicesSubtitle: 'Creating memories that last forever',
      services: [
        { name: 'Weddings', icon: '💒', description: 'Complete wedding photography packages.' },
        { name: 'Portraits', icon: '👤', description: 'Individual, family, and professional headshots.' },
        { name: 'Events', icon: '🎉', description: 'Corporate events, parties, and celebrations.' },
        { name: 'Commercial', icon: '🏢', description: 'Product and brand photography.' },
      ],
      ctaHeadline: 'Book Your Session',
      ctaSubheadline: 'Let\'s create something beautiful together.',
      footerDescription: 'Award-winning photography since 2012.',
    },
    accountant: {
      businessName: 'Precision Accounting',
      headline: 'Expert Financial Guidance',
      subheadline: 'Tax preparation, bookkeeping, and business advisory services.',
      heroIcon: '📊',
      servicesTitle: 'Accounting Services',
      servicesSubtitle: 'Your financial success is our priority',
      services: [
        { name: 'Tax Preparation', icon: '📋', description: 'Individual and business tax returns.' },
        { name: 'Bookkeeping', icon: '📚', description: 'Monthly bookkeeping and financial statements.' },
        { name: 'Payroll', icon: '💵', description: 'Full-service payroll processing.' },
        { name: 'Advisory', icon: '💼', description: 'Strategic business and financial planning.' },
      ],
      ctaHeadline: 'Get Your Finances in Order',
      ctaSubheadline: 'Schedule a free consultation.',
      footerDescription: 'Trusted financial partners for over 30 years.',
    },
    'financial-advisor': {
      businessName: 'Wealth Partners',
      headline: 'Plan for Your Financial Future',
      subheadline: 'Personalized financial planning and investment management.',
      heroIcon: '📈',
      servicesTitle: 'Financial Services',
      servicesSubtitle: 'Building wealth, securing futures',
      services: [
        { name: 'Financial Planning', icon: '📊', description: 'Comprehensive plans for your goals.' },
        { name: 'Investment Management', icon: '📈', description: 'Professional portfolio management.' },
        { name: 'Retirement Planning', icon: '🏖️', description: 'Strategies for a secure retirement.' },
        { name: 'Estate Planning', icon: '🏠', description: 'Protect and transfer your wealth.' },
      ],
      ctaHeadline: 'Start Planning Today',
      ctaSubheadline: 'Free financial review for new clients.',
      footerDescription: 'Fiduciary advisors putting your interests first.',
    },
    therapist: {
      businessName: 'Mindful Counseling',
      headline: 'A Safe Space to Heal',
      subheadline: 'Compassionate therapy for individuals, couples, and families.',
      heroIcon: '💚',
      servicesTitle: 'Therapy Services',
      servicesSubtitle: 'Supporting your mental wellness',
      services: [
        { name: 'Individual Therapy', icon: '🧠', description: 'One-on-one counseling for personal growth.' },
        { name: 'Couples Therapy', icon: '💑', description: 'Strengthen your relationship.' },
        { name: 'Family Therapy', icon: '👨‍👩‍👧', description: 'Improve family communication and bonds.' },
        { name: 'Anxiety & Depression', icon: '💚', description: 'Evidence-based treatment approaches.' },
      ],
      ctaHeadline: 'Take the First Step',
      ctaSubheadline: 'Schedule your initial consultation.',
      footerDescription: 'Supporting mental wellness in our community.',
    },
    gym: {
      businessName: 'Peak Fitness',
      headline: 'Transform Your Body & Mind',
      subheadline: 'State-of-the-art facilities and expert training.',
      heroIcon: '💪',
      servicesTitle: 'Fitness Programs',
      servicesSubtitle: 'Something for every fitness level',
      services: [
        { name: 'Personal Training', icon: '🏋️', description: 'One-on-one training for maximum results.' },
        { name: 'Group Classes', icon: '👥', description: 'Energizing group fitness classes.' },
        { name: 'Strength Training', icon: '💪', description: 'Full weight room and equipment.' },
        { name: 'Cardio', icon: '🏃', description: 'Latest cardio machines and programs.' },
      ],
      ctaHeadline: 'Start Your Fitness Journey',
      ctaSubheadline: 'Free 7-day trial membership.',
      footerDescription: 'Empowering fitness goals since 2015.',
    },
    yoga: {
      businessName: 'Serenity Yoga',
      headline: 'Find Your Balance',
      subheadline: 'Yoga classes for all levels in a peaceful, welcoming space.',
      heroIcon: '🧘',
      servicesTitle: 'Yoga Classes',
      servicesSubtitle: 'Mind, body, and spirit',
      services: [
        { name: 'Vinyasa Flow', icon: '🌊', description: 'Dynamic, breath-centered practice.' },
        { name: 'Gentle Yoga', icon: '🌸', description: 'Slow, restorative movement.' },
        { name: 'Hot Yoga', icon: '🔥', description: 'Challenging practice in heated room.' },
        { name: 'Meditation', icon: '🧘', description: 'Guided meditation sessions.' },
      ],
      ctaHeadline: 'Your First Class is Free',
      ctaSubheadline: 'Experience the serenity difference.',
      footerDescription: 'A sanctuary for your yoga practice.',
    },
  };

  // Return template-specific content or default content
  return contentMap[templateId] || {
    businessName: config.display_name,
    headline: `Professional ${config.display_name} Services`,
    subheadline: 'Quality service you can trust.',
    heroIcon: '⭐',
    servicesTitle: 'Our Services',
    servicesSubtitle: 'What we offer',
    services: [
      { name: 'Service One', icon: '⭐', description: 'Expert solutions for your needs.' },
      { name: 'Service Two', icon: '🔧', description: 'Reliable and efficient service.' },
      { name: 'Service Three', icon: '💡', description: 'Innovative approaches.' },
      { name: 'Service Four', icon: '✅', description: 'Quality guaranteed.' },
    ],
    ctaHeadline: 'Get Started Today',
    ctaSubheadline: 'Contact us for a free consultation.',
    footerDescription: 'Serving our community with excellence.',
  };
}
