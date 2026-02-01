/**
 * Electrician Template
 *
 * A professional, safety-focused template for electrical services.
 * Features emergency availability, services, and trust signals.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface ElectricianTemplateInput {
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
}

export const ELECTRICIAN_PALETTES: ColorPalette[] = [
  {
    name: 'Electric Yellow',
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Safety Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#f59e0b',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Pro Red',
    primary: '#b91c1c',
    secondary: '#991b1b',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateElectricianTemplate(input: ElectricianTemplateInput): string {
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
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const years = yearsInBusiness || 15;

  const defaultServices = content.services.length > 0 ? content.services : [
    { name: 'Panel Upgrades', description: 'Modern electrical panel installation and upgrades' },
    { name: 'Wiring & Rewiring', description: 'Complete home wiring services' },
    { name: 'Outlet & Switch', description: 'Installation and repair of outlets and switches' },
    { name: 'Lighting Installation', description: 'Indoor and outdoor lighting solutions' },
    { name: 'Emergency Service', description: '24/7 emergency electrical repairs' },
    { name: 'Safety Inspections', description: 'Complete electrical safety assessments' },
  ];

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
      background: var(--accent);
      color: var(--primary);
      padding: 12px 0;
      text-align: center;
    }

    .emergency-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-weight: 700;
    }

    .emergency-phone {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--primary);
      color: white;
      padding: 8px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
    }

    /* Header */
    header {
      background: var(--primary);
      color: white;
      padding: 16px 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 800;
      color: white;
      text-decoration: none;
    }

    .logo-icon {
      font-size: 32px;
    }

    nav { display: flex; gap: 32px; }
    nav a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
    }
    nav a:hover { color: white; }

    .header-cta {
      background: var(--accent);
      color: var(--primary);
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
    }

    .btn-accent {
      background: var(--accent);
      color: var(--primary);
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
      border-left: 4px solid var(--accent);
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    .service-icon {
      font-size: 40px;
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
      text-align: center;
    }

    .why-card {
      padding: 32px 16px;
    }

    .why-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .why-card h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .why-card p {
      color: var(--muted);
      font-size: 14px;
    }

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
      background: ${palette.accent}20;
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
        <span>⚡ 24/7 Emergency Electrical Service Available</span>
        <a href="tel:${phone}" class="emergency-phone">📞 ${phone}</a>
      </div>
    </div>
    ` : ''}

    <header>
      <div class="container header-content">
        <a href="#" class="logo">
          <span class="logo-icon">⚡</span>
          ${escapeHtml(businessName)}
        </a>
        <nav>
          <a href="#services">Services</a>
          <a href="#why-us">Why Choose Us</a>
          <a href="#areas">Service Areas</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Get Free Quote</a>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)}</h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            ${phone ? `<a href="tel:${phone}" class="btn-accent">📞 Call Now: ${phone}</a>` : '<a href="#contact" class="btn-accent">Get Free Quote</a>'}
            <a href="#services" class="btn-outline">View Services</a>
          </div>
          <div class="trust-badges">
            <div class="trust-badge">✓ Licensed & Insured</div>
            <div class="trust-badge">✓ 24/7 Emergency</div>
            <div class="trust-badge">✓ ${years}+ Years Experience</div>
          </div>
        </div>
        <div class="hero-image">⚡</div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Electrical Services</h2>
          <p>Professional electrical solutions for homes and businesses</p>
        </div>
        <div class="services-grid">
          ${defaultServices.map(service => `
            <div class="service-card">
              <div class="service-icon">⚡</div>
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="why-us" class="why-us">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose ${escapeHtml(businessName)}</h2>
          <p>Trusted by homeowners and businesses across ${location || 'the area'}</p>
        </div>
        <div class="why-grid">
          <div class="why-card">
            <div class="why-icon">🛡️</div>
            <h3>Licensed & Insured</h3>
            <p>Fully licensed master electricians</p>
          </div>
          <div class="why-card">
            <div class="why-icon">⏰</div>
            <h3>24/7 Emergency</h3>
            <p>Available when you need us most</p>
          </div>
          <div class="why-card">
            <div class="why-icon">💰</div>
            <h3>Upfront Pricing</h3>
            <p>No surprises, no hidden fees</p>
          </div>
          <div class="why-card">
            <div class="why-icon">✅</div>
            <h3>Guaranteed Work</h3>
            <p>100% satisfaction guarantee</p>
          </div>
        </div>
      </div>
    </section>

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
          <h2>Request a Free Quote</h2>
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
                <option value="panel">Panel Upgrade</option>
                <option value="wiring">Wiring/Rewiring</option>
                <option value="outlets">Outlets & Switches</option>
                <option value="lighting">Lighting</option>
                <option value="emergency">Emergency Repair</option>
                <option value="inspection">Safety Inspection</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Describe Your Issue</label>
              <textarea id="message" name="message" placeholder="Tell us about your electrical needs..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Get Free Quote</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Professional electrical services. Licensed, insured, and available 24/7 for emergencies.</p>
            ${licenseNumber ? `<div class="footer-license">License #${escapeHtml(licenseNumber)}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#why-us">Why Choose Us</a>
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
    title: `${businessName} | Electrician${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.inter,
  });
}

export { ELECTRICIAN_PALETTES as palettes };
