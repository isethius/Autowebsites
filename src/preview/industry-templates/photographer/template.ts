/**
 * Photographer Template
 *
 * A visual, portfolio-focused template for photographers.
 * Features gallery, packages, and booking.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface PhotographerTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  specialties?: string[];
  packages?: { name: string; price: string; includes: string[] }[];
}

export const PHOTOGRAPHER_PALETTES: ColorPalette[] = [
  {
    name: 'Classic Black',
    primary: '#18181b',
    secondary: '#09090b',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Warm Moody',
    primary: '#44403c',
    secondary: '#292524',
    accent: '#f97316',
    background: '#fafaf9',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Soft Blush',
    primary: '#be185d',
    secondary: '#9d174d',
    accent: '#fda4af',
    background: '#fff1f2',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#60a5fa',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generatePhotographerTemplate(input: PhotographerTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    specialties,
    packages,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const defaultSpecialties = specialties || ['Portraits', 'Weddings', 'Events', 'Commercial', 'Family', 'Headshots'];
  const defaultPackages = packages || [
    { name: 'Portrait Session', price: 'Starting at $299', includes: ['1-hour session', '20 edited photos', 'Online gallery'] },
    { name: 'Wedding Package', price: 'Starting at $2,500', includes: ['Full day coverage', '300+ photos', 'Engagement session', 'Premium album'] },
    { name: 'Commercial', price: 'Custom Quote', includes: ['Product photography', 'Brand content', 'Usage rights included'] },
  ];

  const styles = `
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

    .preview-banner {
      background: var(--primary);
      color: white;
      text-align: center;
      padding: 10px;
      font-size: 13px;
    }
    .preview-banner a { color: white; font-weight: 600; }

    /* Header */
    header {
      background: white;
      padding: 24px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      font-family: 'DM Serif Display', serif;
    }

    nav { display: flex; gap: 40px; }
    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    nav a:hover { color: var(--accent); }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 28px;
      text-decoration: none;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 13px;
    }

    /* Hero */
    .hero {
      background: var(--primary);
      color: white;
      padding: 120px 0;
      text-align: center;
    }

    .hero h1 {
      font-size: 56px;
      font-weight: 400;
      font-family: 'DM Serif Display', serif;
      margin-bottom: 24px;
      line-height: 1.2;
    }

    .hero p {
      font-size: 20px;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .hero-cta {
      display: inline-block;
      background: var(--accent);
      color: var(--primary);
      padding: 16px 40px;
      text-decoration: none;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Specialties */
    .specialties {
      padding: 60px 0;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .specialties-grid {
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
    }

    .specialty {
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
    }

    /* Portfolio */
    .portfolio {
      padding: 80px 0;
      background: var(--background);
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 40px;
      font-weight: 400;
      font-family: 'DM Serif Display', serif;
      margin-bottom: 12px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .portfolio-item {
      aspect-ratio: 1;
      background: var(--secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      transition: all 0.3s;
      cursor: pointer;
    }

    .portfolio-item:hover {
      transform: scale(1.02);
    }

    .portfolio-item.tall {
      grid-row: span 2;
      aspect-ratio: auto;
    }

    /* About */
    .about {
      padding: 80px 0;
      background: white;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 60px;
      align-items: center;
    }

    .about-image {
      aspect-ratio: 4/5;
      background: var(--secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 100px;
    }

    .about-text h2 {
      font-size: 40px;
      font-weight: 400;
      font-family: 'DM Serif Display', serif;
      margin-bottom: 24px;
    }

    .about-text p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 16px;
    }

    /* Packages */
    .packages {
      padding: 80px 0;
      background: var(--background);
    }

    .packages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .package-card {
      background: white;
      padding: 40px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }

    .package-card:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    }

    .package-name {
      font-size: 24px;
      font-weight: 400;
      font-family: 'DM Serif Display', serif;
      margin-bottom: 8px;
    }

    .package-price {
      font-size: 18px;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 24px;
    }

    .package-includes {
      text-align: left;
      margin-bottom: 24px;
    }

    .package-includes li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: var(--muted);
    }

    .package-includes li:last-child {
      border-bottom: none;
    }

    .package-cta {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 12px 28px;
      text-decoration: none;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 12px;
    }

    /* Contact */
    .contact {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .contact .section-header h2,
    .contact .section-header p {
      color: white;
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      max-width: 900px;
      margin: 0 auto;
    }

    .contact-info h3 {
      font-size: 24px;
      font-family: 'DM Serif Display', serif;
      margin-bottom: 24px;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0.9;
    }

    .contact-form {
      background: white;
      color: var(--text);
      padding: 40px;
    }

    .form-group { margin-bottom: 20px; }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
      font-size: 15px;
      font-family: inherit;
    }
    .form-group textarea { height: 100px; resize: vertical; }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 16px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
    }

    /* Footer */
    footer {
      background: #0a0a0a;
      color: white;
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }

    .footer-brand {
      font-size: 24px;
      font-family: 'DM Serif Display', serif;
    }

    .footer-links {
      display: flex;
      gap: 32px;
    }

    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #374151;
      color: #6b7280;
      font-size: 13px;
    }

    .footer-bottom a { color: var(--accent); }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero h1 { font-size: 36px; }
      .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
      .portfolio-item.tall { grid-row: span 1; }
      .about-content,
      .contact-content { grid-template-columns: 1fr; }
      .about-image { display: none; }
      .packages-grid { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 24px; text-align: center; }
    }
  `;

  const body = `
    <header>
      <div class="container header-content">
        <a href="#" class="logo">${escapeHtml(businessName)}</a>
        <nav>
          <a href="#portfolio">Portfolio</a>
          <a href="#about">About</a>
          <a href="#packages">Packages</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Book Now</a>
      </div>
    </header>

    <section class="hero">
      <div class="container">
        <h1>${escapeHtml(content.headline)}</h1>
        <p>${escapeHtml(content.tagline)}</p>
        <a href="#portfolio" class="hero-cta">View My Work</a>
      </div>
    </section>

    <section class="specialties">
      <div class="container">
        <div class="specialties-grid">
          ${defaultSpecialties.map(s => `<span class="specialty">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
    </section>

    <section id="portfolio" class="portfolio">
      <div class="container">
        <div class="section-header">
          <h2>Selected Work</h2>
          <p>A collection of my favorite moments</p>
        </div>
        <div class="portfolio-grid">
          <div class="portfolio-item tall">📷</div>
          <div class="portfolio-item">📷</div>
          <div class="portfolio-item">📷</div>
          <div class="portfolio-item">📷</div>
          <div class="portfolio-item">📷</div>
        </div>
      </div>
    </section>

    <section id="about" class="about">
      <div class="container about-content">
        <div class="about-image">📷</div>
        <div class="about-text">
          <h2>About Me</h2>
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      </div>
    </section>

    <section id="packages" class="packages">
      <div class="container">
        <div class="section-header">
          <h2>Investment</h2>
          <p>Packages tailored to your needs</p>
        </div>
        <div class="packages-grid">
          ${defaultPackages.map(pkg => `
            <div class="package-card">
              <h3 class="package-name">${escapeHtml(pkg.name)}</h3>
              <div class="package-price">${escapeHtml(pkg.price)}</div>
              <ul class="package-includes">
                ${pkg.includes.map(item => `<li>✓ ${escapeHtml(item)}</li>`).join('')}
              </ul>
              <a href="#contact" class="package-cta">Inquire</a>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container">
        <div class="section-header">
          <h2>Let's Work Together</h2>
          <p>I'd love to hear about your project</p>
        </div>
        <div class="contact-content">
          <div class="contact-info">
            <h3>Get In Touch</h3>
            <div class="contact-details">
              ${email ? `<div class="contact-item">✉️ ${email}</div>` : ''}
              ${phone ? `<div class="contact-item">📞 ${phone}</div>` : ''}
              ${location ? `<div class="contact-item">📍 ${escapeHtml(location)}</div>` : ''}
            </div>
          </div>
          <div class="contact-form">
            <form action="#" method="POST">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-group">
                <label for="type">Session Type</label>
                <select id="type" name="type">
                  <option value="">Select...</option>
                  ${defaultSpecialties.map(s => `<option value="${escapeHtml(s.toLowerCase())}">${escapeHtml(s)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" placeholder="Tell me about your vision..."></textarea>
              </div>
              <button type="submit" class="submit-btn">Send Inquiry</button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">${escapeHtml(businessName)}</div>
          <div class="footer-links">
            <a href="#portfolio">Portfolio</a>
            <a href="#about">About</a>
            <a href="#packages">Packages</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)} · </span>
          <a href="https://showcasedesigns.com">Website by Showcase Designs</a>
        </div>
      </div>
    </footer>
  `;

  return generateDocument({
    title: `${businessName} | Photography${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap',
  });
}

export { PHOTOGRAPHER_PALETTES as palettes };
