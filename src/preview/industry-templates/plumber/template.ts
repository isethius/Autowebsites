/**
 * Plumber Template - DNA-Aware Version
 *
 * A professional, trust-focused template designed for plumbing services.
 * Now DNA-aware: renders differently based on DNA codes for hero, layout, nav, design, typography, and motion.
 */

import { PreviewContent, ColorPalette } from '../../../overnight/types';
import { DNACode } from '../../../themes/variance-planner';
import { PLUMBER_PALETTES } from '../index';

// DNA-aware components
import { generateDNAStyles, generateFontImports, getDefaultDNA } from '../_shared/styles/dna-styles';
import { generateDNAHero, DNAHeroConfig } from '../_shared/sections/hero-variants';
import { generateDNANav, NavConfig } from '../_shared/sections/dna-nav';
import { generateDNAServices, DNAServicesConfig } from '../_shared/sections/services-grid';

export interface PlumberTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  serviceAreas?: string[];
  licenseNumber?: string;
  yearsInBusiness?: number;
  dna?: DNACode;  // Optional DNA codes for layout/style variance
}

/**
 * Generate plumber template HTML using DNA-aware components
 */
export function generatePlumberTemplate(input: PlumberTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    serviceAreas,
    licenseNumber,
    yearsInBusiness,
  } = input;

  // Use provided DNA or default
  const dna = input.dna || getDefaultDNA();
  const location = [city, state].filter(Boolean).join(', ');

  // Default service areas if not provided
  const displayAreas = serviceAreas?.length ? serviceAreas : [
    city || 'Local Area',
    'Surrounding Communities',
  ];

  // Generate DNA-aware styles
  const { css: dnaStylesCss } = generateDNAStyles(dna, palette);
  const fontImportUrl = generateFontImports(dna.typography || 'T1');

  // Generate DNA-aware navigation
  const navConfig: NavConfig = {
    businessName,
    dna,
    links: [
      { text: 'Services', href: '#services' },
      { text: 'Why Choose Us', href: '#why-us' },
      { text: 'Service Areas', href: '#areas' },
      { text: 'Contact', href: '#contact' },
    ],
    ctaText: 'Get Free Quote',
    ctaHref: '#contact',
    phone,
  };
  const nav = generateDNANav(navConfig);

  // Generate DNA-aware hero
  const heroConfig: DNAHeroConfig = {
    headline: content.headline,
    tagline: content.tagline,
    primaryCTA: phone ? undefined : { text: 'Get Free Quote', href: '#contact' },
    secondaryCTA: { text: 'View Services', href: '#services' },
    phone,
    trustBadges: ['Licensed & Insured', '24/7 Emergency', '100% Satisfaction'],
    palette,
    dna,
    businessName,
  };
  const hero = generateDNAHero(heroConfig);

  // Generate DNA-aware services
  const servicesConfig: DNAServicesConfig = {
    title: 'Our Plumbing Services',
    subtitle: 'Professional solutions for all your plumbing needs',
    services: content.services,
    dna,
    sectionId: 'services',
    background: 'gray',
  };
  const services = generateDNAServices(servicesConfig);

  // Build combined CSS
  const combinedCss = `
    ${dnaStylesCss}
    ${nav.css}
    ${hero.css}
    ${services.css}
    ${generateWhyUsCSS(dna)}
    ${generateServiceAreasCSS(dna)}
    ${generateReviewsCSS(dna)}
    ${generateContactCSS(dna, palette)}
    ${generateFooterCSS()}
    ${generateEmergencyBarCSS()}
    ${generatePreviewBannerCSS()}
    ${generateResponsiveCSS()}
  `;

  // Build sections HTML
  const emergencyBar = phone ? generateEmergencyBar(phone) : '';
  const whyUs = generateWhyUsSection(businessName, location, yearsInBusiness, dna);
  const areasSection = generateServiceAreasSection(displayAreas, dna);
  const reviewsSection = generateReviewsSection();
  const contactSection = generateContactSection(content, phone, email, location, dna, palette);
  const footer = generateFooterSection(businessName, licenseNumber);

  // Determine if we need padding for transparent nav
  const needsHeroPadding = dna.nav === 'N2' || dna.nav === 'N9';
  const needsTopPadding = dna.nav === 'N7'; // Floating nav

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(content.meta_description)}">
  <title>${escapeHtml(businessName)} | Emergency Plumbing Services${location ? ` in ${location}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${fontImportUrl}" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button {
      font-family: inherit;
      cursor: pointer;
    }

    ul, ol {
      list-style: none;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 36px;
      margin-bottom: 12px;
      color: var(--text);
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    ${combinedCss}
  </style>
</head>
<body${needsTopPadding ? ' style="padding-top: 80px;"' : ''}>
  ${generatePreviewBanner()}
  ${emergencyBar}
  ${nav.html}
  <main${needsHeroPadding ? ' style="position: relative;"' : ''}>
    ${hero.html}
    ${services.html}
    ${whyUs}
    ${areasSection}
    ${reviewsSection}
    ${contactSection}
  </main>
  ${footer}
</body>
</html>`;
}

// =============================================================================
// HELPER FUNCTIONS FOR STATIC SECTIONS
// =============================================================================

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

function generatePreviewBanner(): string {
  return `
    <div class="preview-banner">
      ✨ This is a preview of your new website! <a href="../index.html">View other designs →</a>
    </div>
  `;
}

function generatePreviewBannerCSS(): string {
  return `
    .preview-banner {
      background: var(--primary);
      color: var(--white);
      text-align: center;
      padding: 10px;
      font-size: 13px;
    }

    .preview-banner a {
      color: var(--white);
      font-weight: 600;
    }
  `;
}

function generateEmergencyBar(phone: string): string {
  return `
    <div class="emergency-bar">
      <div class="container emergency-content">
        <span>🚨 24/7 Emergency Service Available</span>
        <a href="tel:${phone}" class="emergency-phone">
          📞 ${phone}
        </a>
      </div>
    </div>
  `;
}

function generateEmergencyBarCSS(): string {
  return `
    .emergency-bar {
      background: var(--emergency);
      color: var(--white);
      padding: 12px 0;
    }

    .emergency-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-weight: 600;
    }

    .emergency-phone {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--emergency);
      padding: 8px 20px;
      border-radius: var(--border-radius, 6px);
      font-weight: 700;
      font-size: 18px;
    }

    .emergency-phone:hover {
      background: #fee2e2;
    }
  `;
}

function generateWhyUsSection(businessName: string, location: string, yearsInBusiness?: number, dna?: DNACode): string {
  return `
    <section id="why-us" class="why-us dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose ${escapeHtml(businessName)}</h2>
          <p>Trusted by homeowners throughout ${location || 'the area'}</p>
        </div>
        <div class="why-us-grid">
          <div class="why-card dna-card">
            <div class="why-number">${yearsInBusiness || '15'}+</div>
            <div class="why-label">Years Experience</div>
            <div class="why-desc">Serving the community with pride</div>
          </div>
          <div class="why-card dna-card">
            <div class="why-number">24/7</div>
            <div class="why-label">Emergency Service</div>
            <div class="why-desc">We're always here when you need us</div>
          </div>
          <div class="why-card dna-card">
            <div class="why-number">100%</div>
            <div class="why-label">Satisfaction</div>
            <div class="why-desc">Guaranteed quality workmanship</div>
          </div>
          <div class="why-card dna-card">
            <div class="why-number">5★</div>
            <div class="why-label">Rated Service</div>
            <div class="why-desc">Trusted by our customers</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generateWhyUsCSS(dna: DNACode): string {
  return `
    .why-us {
      padding: 80px 0;
      background: var(--background, #ffffff);
    }

    .why-us-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .why-card {
      text-align: center;
      padding: 32px 16px;
      background: var(--bg-surface, var(--gray-50, #f9fafb));
      border-radius: var(--border-radius);
    }

    .why-number {
      font-size: 48px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .why-label {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .why-desc {
      font-size: 14px;
      color: var(--muted);
    }

    @media (max-width: 900px) {
      .why-us-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .why-us-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

function generateServiceAreasSection(areas: string[], dna: DNACode): string {
  return `
    <section id="areas" class="service-areas dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>Areas We Serve</h2>
          <p>Providing quality plumbing services throughout the region</p>
        </div>
        <div class="areas-grid">
          ${areas.map(area => `<span class="area-tag">${escapeHtml(area)}</span>`).join('')}
        </div>
      </div>
    </section>
  `;
}

function generateServiceAreasCSS(dna: DNACode): string {
  return `
    .service-areas {
      padding: 80px 0;
      background: var(--primary);
      color: var(--white);
    }

    .service-areas .section-header h2,
    .service-areas .section-header p {
      color: var(--white);
    }

    .areas-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }

    .area-tag {
      background: var(--bg-surface, rgba(255,255,255,0.15));
      padding: 12px 24px;
      border-radius: var(--border-radius);
      font-weight: 500;
    }
  `;
}

function generateReviewsSection(): string {
  return `
    <section class="reviews dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>What Our Customers Say</h2>
          <p>Real reviews from satisfied customers</p>
        </div>
        <div class="reviews-grid">
          <div class="review-card dna-card">
            <div class="review-stars">★★★★★</div>
            <p class="review-text">"Fast, professional service! They fixed our emergency leak within an hour of calling. Highly recommend!"</p>
            <div class="review-author">- Local Homeowner</div>
          </div>
          <div class="review-card dna-card">
            <div class="review-stars">★★★★★</div>
            <p class="review-text">"Fair pricing and excellent work. They explained everything clearly before starting. Will definitely use again."</p>
            <div class="review-author">- Satisfied Customer</div>
          </div>
          <div class="review-card dna-card">
            <div class="review-stars">★★★★★</div>
            <p class="review-text">"The most reliable plumber we've ever used. On time, professional, and great quality work."</p>
            <div class="review-author">- Happy Homeowner</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generateReviewsCSS(dna: DNACode): string {
  return `
    .reviews {
      padding: 80px 0;
      background: var(--background, #ffffff);
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .review-card {
      background: var(--bg-surface, var(--white, #ffffff));
      border-radius: var(--border-radius);
      padding: 32px;
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
      border: var(--border-width, 0) solid var(--border-color, transparent);
    }

    .review-stars {
      color: var(--accent, #fbbf24);
      font-size: 20px;
      margin-bottom: 16px;
    }

    .review-text {
      font-size: 15px;
      color: var(--muted);
      margin-bottom: 20px;
      font-style: italic;
      line-height: 1.6;
    }

    .review-author {
      font-weight: 600;
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .reviews-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

function generateContactSection(content: PreviewContent, phone: string | undefined, email: string | undefined, location: string, dna: DNACode, palette: ColorPalette): string {
  return `
    <section id="contact" class="contact dna-animate">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Request a Free Quote</h2>
          <p>${escapeHtml(content.contact_text)}</p>
          <div class="contact-details">
            ${phone ? `
            <div class="contact-item">
              <div class="contact-item-icon">📞</div>
              <div>
                <strong>Call Us</strong><br>
                <a href="tel:${phone}">${phone}</a>
              </div>
            </div>
            ` : ''}
            ${email ? `
            <div class="contact-item">
              <div class="contact-item-icon">✉️</div>
              <div>
                <strong>Email</strong><br>
                <a href="mailto:${email}">${email}</a>
              </div>
            </div>
            ` : ''}
            ${location ? `
            <div class="contact-item">
              <div class="contact-item-icon">📍</div>
              <div>
                <strong>Service Area</strong><br>
                ${escapeHtml(location)} & Surrounding Areas
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="contact-form">
          <form action="#" method="POST">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Your Name</label>
                <input type="text" id="name" name="name" required>
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" required>
              </div>
            </div>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email">
            </div>
            <div class="form-group">
              <label for="service">Service Needed</label>
              <select id="service" name="service">
                <option value="">Select a service...</option>
                <option value="emergency">Emergency Repair</option>
                <option value="drain">Drain Cleaning</option>
                <option value="water-heater">Water Heater</option>
                <option value="leak">Leak Repair</option>
                <option value="installation">New Installation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Describe Your Issue</label>
              <textarea id="message" name="message" placeholder="Tell us about your plumbing issue..."></textarea>
            </div>
            <button type="submit" class="submit-btn dna-btn">Get Free Quote</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function generateContactCSS(dna: DNACode, palette: ColorPalette): string {
  return `
    .contact {
      padding: 80px 0;
      background: var(--background, #ffffff);
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 60px;
    }

    .contact-info h2 {
      font-size: 36px;
      margin-bottom: 20px;
    }

    .contact-info > p {
      color: var(--muted);
      margin-bottom: 32px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .contact-item-icon {
      width: 48px;
      height: 48px;
      background: ${palette.primary}15;
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: var(--bg-surface, var(--gray-50, #f9fafb));
      border-radius: var(--border-radius-lg, 16px);
      padding: 40px;
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
      border: var(--border-width, 0) solid var(--border-color, transparent);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 14px 16px;
      border: var(--border-width, 1px) solid var(--border-color, var(--gray-200, #e5e7eb));
      border-radius: var(--border-radius-sm, 6px);
      font-size: 15px;
      font-family: inherit;
      transition: border-color 0.2s;
      background: var(--bg-surface, var(--white, #ffffff));
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group textarea {
      height: 100px;
      resize: vertical;
    }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: var(--white);
      padding: 16px;
      border: none;
      border-radius: var(--border-radius);
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--secondary);
    }

    @media (max-width: 900px) {
      .contact-content {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `;
}

function generateFooterSection(businessName: string, licenseNumber?: string): string {
  return `
    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Your trusted local plumbing experts. Available 24/7 for all your plumbing needs.</p>
            ${licenseNumber ? `<div class="footer-license">License #${licenseNumber}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#why-us">Why Choose Us</a>
            <a href="#areas">Service Areas</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. Licensed & Insured.</span>
          <span>Website by <a href="#">Showcase Designs</a></span>
        </div>
      </div>
    </footer>
  `;
}

function generateFooterCSS(): string {
  return `
    footer {
      background: var(--gray-800);
      color: var(--white);
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .footer-brand h3 {
      font-size: 24px;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: var(--gray-400);
      font-size: 14px;
      max-width: 300px;
    }

    .footer-license {
      margin-top: 16px;
      font-size: 13px;
      color: var(--gray-400);
    }

    .footer-links {
      display: flex;
      gap: 40px;
    }

    .footer-links a {
      color: var(--gray-400);
      font-size: 14px;
    }

    .footer-links a:hover {
      color: var(--white);
    }

    .footer-bottom {
      padding-top: 30px;
      border-top: 1px solid var(--gray-700);
      display: flex;
      justify-content: space-between;
      color: var(--gray-400);
      font-size: 13px;
    }

    .footer-bottom a {
      color: var(--accent);
    }

    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
        gap: 32px;
      }

      .footer-bottom {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
    }
  `;
}

function generateResponsiveCSS(): string {
  return `
    @media (max-width: 1024px) {
      .section-header h2 {
        font-size: 32px;
      }
    }

    @media (max-width: 768px) {
      .section-header h2 {
        font-size: 28px;
      }

      .section-header p {
        font-size: 16px;
      }

      .container {
        padding: 0 16px;
      }
    }
  `;
}

export { PLUMBER_PALETTES };
