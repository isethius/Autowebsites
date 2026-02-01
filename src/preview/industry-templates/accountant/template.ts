/**
 * Accountant/CPA Template
 *
 * A professional template for accounting and tax services.
 * Features services, credentials, and consultation booking.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface AccountantTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  credentials?: string[];
  specializations?: string[];
}

export const ACCOUNTANT_PALETTES: ColorPalette[] = [
  {
    name: 'Professional Navy',
    primary: '#1e3a5f',
    secondary: '#0f2744',
    accent: '#22c55e',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#fbbf24',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Classic Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#0ea5e9',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Growth Green',
    primary: '#166534',
    secondary: '#14532d',
    accent: '#fbbf24',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateAccountantTemplate(input: AccountantTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    credentials,
    specializations,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const defaultCredentials = credentials || ['CPA', 'Licensed Tax Preparer'];
  const defaultSpecializations = specializations || [
    'Tax Preparation',
    'Business Accounting',
    'Bookkeeping',
    'Payroll Services',
    'Tax Planning',
    'IRS Representation'
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
      font-family: 'Montserrat', sans-serif;
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
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }

    .logo-credentials {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
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
      background: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
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
      font-size: 44px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 20px;
    }

    .hero p {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
      font-family: 'Open Sans', sans-serif;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
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

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .hero-stat {
      background: rgba(255,255,255,0.1);
      padding: 24px;
      border-radius: 8px;
      text-align: center;
    }

    .hero-stat-number {
      font-size: 36px;
      font-weight: 700;
      color: var(--accent);
    }

    .hero-stat-label {
      font-size: 14px;
      opacity: 0.9;
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
      font-weight: 700;
      margin-bottom: 12px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
      font-family: 'Open Sans', sans-serif;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .service-card {
      background: white;
      padding: 32px;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .service-icon {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .service-card p {
      color: var(--muted);
      font-size: 15px;
      font-family: 'Open Sans', sans-serif;
    }

    /* Why Us */
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
      padding: 24px;
    }

    .why-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .why-card h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .why-card p {
      color: var(--muted);
      font-size: 14px;
      font-family: 'Open Sans', sans-serif;
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
      font-weight: 700;
      margin-bottom: 20px;
    }

    .contact-info > p {
      color: var(--muted);
      margin-bottom: 32px;
      font-family: 'Open Sans', sans-serif;
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
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: white;
      border-radius: 8px;
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
      border-radius: 6px;
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
      border-radius: 6px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Footer */
    footer {
      background: var(--secondary);
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
      font-weight: 700;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
      max-width: 300px;
      font-family: 'Open Sans', sans-serif;
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
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      color: #9ca3af;
      font-size: 13px;
    }

    .footer-bottom a { color: var(--accent); }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-stats { display: none; }
      .services-grid { grid-template-columns: 1fr; }
      .why-grid { grid-template-columns: repeat(2, 1fr); }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const serviceIcons: Record<string, string> = {
    'Tax Preparation': '📋',
    'Business Accounting': '📊',
    'Bookkeeping': '📚',
    'Payroll Services': '💵',
    'Tax Planning': '📈',
    'IRS Representation': '🏛️',
  };

  const body = `
    <header>
      <div class="container header-content">
        <div>
          <a href="#" class="logo">${escapeHtml(businessName)}</a>
          ${defaultCredentials.length > 0 ? `<div class="logo-credentials">${defaultCredentials.join(' • ')}</div>` : ''}
        </div>
        <nav>
          <a href="#services">Services</a>
          <a href="#why-us">Why Us</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Free Consultation</a>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)}</h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-accent">Schedule Consultation</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 ${phone}</a>` : ''}
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-number">20+</div>
            <div class="hero-stat-label">Years Experience</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">500+</div>
            <div class="hero-stat-label">Clients Served</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">$5M+</div>
            <div class="hero-stat-label">Tax Savings</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">99%</div>
            <div class="hero-stat-label">Client Retention</div>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive accounting and tax solutions for individuals and businesses</p>
        </div>
        <div class="services-grid">
          ${defaultSpecializations.map(spec => `
            <div class="service-card">
              <div class="service-icon">${serviceIcons[spec] || '📊'}</div>
              <h3>${escapeHtml(spec)}</h3>
              <p>Professional ${spec.toLowerCase()} services tailored to your needs.</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="why-us" class="why-us">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose Us</h2>
          <p>Trusted expertise you can count on</p>
        </div>
        <div class="why-grid">
          <div class="why-card">
            <div class="why-icon">🎓</div>
            <h3>Certified Experts</h3>
            <p>Licensed CPAs with extensive training</p>
          </div>
          <div class="why-card">
            <div class="why-icon">🤝</div>
            <h3>Personal Service</h3>
            <p>Dedicated attention to every client</p>
          </div>
          <div class="why-card">
            <div class="why-icon">💡</div>
            <h3>Proactive Advice</h3>
            <p>Strategic planning for your success</p>
          </div>
          <div class="why-card">
            <div class="why-icon">🔒</div>
            <h3>Confidential</h3>
            <p>Your financial data is secure</p>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Schedule Your Consultation</h2>
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
                  <strong>Location</strong><br>
                  ${escapeHtml(location)}
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
                ${defaultSpecializations.map(s => `<option value="${escapeHtml(s.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(s)}</option>`).join('')}
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">How Can We Help?</label>
              <textarea id="message" name="message" placeholder="Tell us about your accounting needs..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Request Consultation</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Professional accounting and tax services you can trust.</p>
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#why-us">Why Us</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. All rights reserved.</span>
          <span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>
        </div>
      </div>
    </footer>
  `;

  return generateDocument({
    title: `${businessName} | CPA & Accounting${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.montserrat,
  });
}

export { ACCOUNTANT_PALETTES as palettes };
