/**
 * Roofer Template
 *
 * A professional template for roofing contractors.
 * Features emergency services, before/after, and financing options.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface RooferTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  licenseNumber?: string;
  yearsInBusiness?: number;
  serviceAreas?: string[];
  offerFinancing?: boolean;
}

export const ROOFER_PALETTES: ColorPalette[] = [
  {
    name: 'Storm Ready',
    primary: '#1e3a5f',
    secondary: '#0f2744',
    accent: '#f97316',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Earth Brown',
    primary: '#78350f',
    secondary: '#451a03',
    accent: '#fbbf24',
    background: '#fffbeb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Pro Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Green',
    primary: '#14532d',
    secondary: '#166534',
    accent: '#fbbf24',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateRooferTemplate(input: RooferTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    licenseNumber,
    yearsInBusiness,
    serviceAreas,
    offerFinancing = true,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const years = yearsInBusiness || 20;

  const styles = `
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
      --emergency: #dc2626;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
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

    /* Emergency Bar */
    .emergency-bar {
      background: var(--emergency);
      color: white;
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
      background: white;
      color: var(--emergency);
      padding: 8px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
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
      text-decoration: none;
    }

    nav { display: flex; gap: 32px; }
    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
    }
    nav a:hover { color: var(--primary); }

    .header-cta {
      background: var(--accent);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 80px 0;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
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
      flex-wrap: wrap;
    }

    .btn-accent {
      background: var(--accent);
      color: white;
      padding: 16px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }

    .trust-badges {
      display: flex;
      gap: 24px;
      margin-top: 32px;
      flex-wrap: wrap;
    }

    .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
    }

    /* Services */
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
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .service-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    .service-icon {
      font-size: 48px;
      margin-bottom: 16px;
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

    /* Why Choose */
    .why-us {
      padding: 80px 0;
      background: white;
    }

    .why-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .why-card {
      text-align: center;
      padding: 32px 16px;
    }

    .why-number {
      font-size: 48px;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .why-label {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .why-desc {
      color: var(--muted);
      font-size: 14px;
    }

    /* Financing */
    ${offerFinancing ? `
    .financing {
      padding: 60px 0;
      background: var(--accent);
      color: white;
      text-align: center;
    }

    .financing h2 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .financing p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 24px;
    }

    .financing-btn {
      display: inline-block;
      background: white;
      color: var(--accent);
      padding: 16px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
    }
    ` : ''}

    /* Areas */
    .areas {
      padding: 60px 0;
      background: var(--primary);
      color: white;
    }

    .areas-content {
      text-align: center;
    }

    .areas h2 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 24px;
    }

    .areas-grid {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .area-tag {
      background: rgba(255,255,255,0.15);
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
    }

    /* Contact */
    .contact {
      padding: 80px 0;
      background: var(--background);
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 60px;
    }

    .contact-info h2 {
      font-size: 36px;
      font-weight: 800;
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
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 20px; }
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
      border: 1px solid #e5e7eb;
      border-radius: 8px;
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
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Footer */
    footer {
      background: #1f2937;
      color: white;
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .footer-brand h3 {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
      max-width: 300px;
    }

    .footer-license {
      margin-top: 16px;
      font-size: 13px;
      color: #9ca3af;
    }

    .footer-links {
      display: flex;
      gap: 40px;
    }

    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
    }

    .footer-bottom {
      padding-top: 30px;
      border-top: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      color: #9ca3af;
      font-size: 13px;
    }

    .footer-bottom a { color: var(--accent); }

    @media (max-width: 900px) {
      nav { display: none; }
      .emergency-content { flex-direction: column; gap: 8px; }
      .hero-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image { display: none; }
      .services-grid { grid-template-columns: 1fr; }
      .why-grid { grid-template-columns: repeat(2, 1fr); }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const body = `
    ${phone ? `
    <div class="emergency-bar">
      <div class="container emergency-content">
        <span>🌧️ Storm Damage? 24/7 Emergency Roof Repair</span>
        <a href="tel:${phone}" class="emergency-phone">📞 ${phone}</a>
      </div>
    </div>
    ` : ''}

    <header>
      <div class="container header-content">
        <a href="#" class="logo">${escapeHtml(businessName)}</a>
        <nav>
          <a href="#services">Services</a>
          <a href="#why-us">Why Choose Us</a>
          <a href="#areas">Service Areas</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Free Inspection</a>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)}</h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-accent">Free Roof Inspection</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 ${phone}</a>` : ''}
          </div>
          <div class="trust-badges">
            <div class="trust-badge">✓ Licensed & Insured</div>
            <div class="trust-badge">✓ ${years}+ Years Experience</div>
            <div class="trust-badge">✓ Free Estimates</div>
          </div>
        </div>
        <div class="hero-image">🏠</div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Roofing Services</h2>
          <p>Complete roofing solutions for homes and businesses</p>
        </div>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">🏠</div>
            <h3>Roof Replacement</h3>
            <p>Complete tear-off and installation with quality materials and expert craftsmanship.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🔧</div>
            <h3>Roof Repair</h3>
            <p>Fix leaks, damaged shingles, and other issues quickly and effectively.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🌧️</div>
            <h3>Storm Damage</h3>
            <p>Emergency response for hail, wind, and storm damage repairs.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🔍</div>
            <h3>Free Inspections</h3>
            <p>Comprehensive roof assessments to identify issues before they worsen.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">💧</div>
            <h3>Gutters</h3>
            <p>Installation, repair, and cleaning of gutter systems.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🏢</div>
            <h3>Commercial Roofing</h3>
            <p>Expert solutions for flat roofs, metal roofs, and commercial properties.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="why-us" class="why-us">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose Us</h2>
          <p>Trusted roofing professionals serving ${location || 'your area'}</p>
        </div>
        <div class="why-grid">
          <div class="why-card">
            <div class="why-number">${years}+</div>
            <div class="why-label">Years Experience</div>
            <div class="why-desc">Decades of trusted service</div>
          </div>
          <div class="why-card">
            <div class="why-number">5K+</div>
            <div class="why-label">Roofs Completed</div>
            <div class="why-desc">Thousands of satisfied customers</div>
          </div>
          <div class="why-card">
            <div class="why-number">24/7</div>
            <div class="why-label">Emergency Service</div>
            <div class="why-desc">When storms strike, we're there</div>
          </div>
          <div class="why-card">
            <div class="why-number">100%</div>
            <div class="why-label">Satisfaction</div>
            <div class="why-desc">We guarantee our work</div>
          </div>
        </div>
      </div>
    </section>

    ${offerFinancing ? `
    <section class="financing">
      <div class="container">
        <h2>Financing Available</h2>
        <p>Don't let budget concerns delay your roof repair. We offer flexible financing options.</p>
        <a href="#contact" class="financing-btn">Learn About Financing</a>
      </div>
    </section>
    ` : ''}

    <section id="areas" class="areas">
      <div class="container areas-content">
        <h2>Areas We Serve</h2>
        <div class="areas-grid">
          ${(serviceAreas || [location || 'Local Area', 'Surrounding Communities']).map(area => `
            <div class="area-tag">${escapeHtml(area)}</div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Get Your Free Inspection</h2>
          <p>${escapeHtml(content.contact_text)}</p>
          <div class="contact-details">
            ${phone ? `
              <div class="contact-item">
                <div class="contact-item-icon">📞</div>
                <div>
                  <strong>Call Us 24/7</strong><br>
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
                  ${escapeHtml(location)} & Surrounding
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
                <option value="replacement">Roof Replacement</option>
                <option value="repair">Roof Repair</option>
                <option value="storm">Storm Damage</option>
                <option value="inspection">Free Inspection</option>
                <option value="gutters">Gutters</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Tell Us About Your Roof</label>
              <textarea id="message" name="message" placeholder="Describe any issues or concerns..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Schedule Free Inspection</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Professional roofing services. Licensed, insured, and ready to protect your home.</p>
            ${licenseNumber ? `<div class="footer-license">License #${escapeHtml(licenseNumber)}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#why-us">Why Us</a>
            <a href="#areas">Areas</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. Licensed & Insured.</span>
          <span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>
        </div>
      </div>
    </footer>
  `;

  return generateDocument({
    title: `${businessName} | Roofing Contractor${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.inter,
  });
}

export { ROOFER_PALETTES as palettes };
