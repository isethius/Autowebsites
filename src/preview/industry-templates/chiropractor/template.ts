/**
 * Chiropractor Template
 *
 * A calming, professional template for chiropractic practices.
 * Features services, conditions treated, and scheduling.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface ChiropractorTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  doctorName?: string;
  doctorCredentials?: string;
  conditions?: string[];
  techniques?: string[];
}

export const CHIROPRACTOR_PALETTES: ColorPalette[] = [
  {
    name: 'Healing Teal',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#5eead4',
    background: '#f0fdfa',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Calm Blue',
    primary: '#0369a1',
    secondary: '#075985',
    accent: '#7dd3fc',
    background: '#f0f9ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Wellness Green',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#86efac',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Gentle Purple',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#c4b5fd',
    background: '#faf5ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateChiropractorTemplate(input: ChiropractorTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    address,
    doctorName,
    doctorCredentials,
    conditions,
    techniques,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');

  const defaultConditions = conditions || [
    'Back Pain',
    'Neck Pain',
    'Headaches & Migraines',
    'Sciatica',
    'Sports Injuries',
    'Posture Issues',
    'Joint Pain',
    'Herniated Discs'
  ];

  const defaultTechniques = techniques || [
    'Spinal Adjustments',
    'Massage Therapy',
    'Physical Rehabilitation',
    'Corrective Exercises'
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
      font-family: 'Poppins', sans-serif;
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
      padding: 16px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: var(--primary);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary);
    }

    nav { display: flex; gap: 32px; }
    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
    }
    nav a:hover { color: var(--primary); }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .header-phone {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
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
      line-height: 1.7;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
    }

    .btn-white {
      background: white;
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 700;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
    }

    /* Features */
    .features {
      padding: 60px 0;
      background: white;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .feature-card {
      text-align: center;
      padding: 24px;
    }

    .feature-icon {
      font-size: 40px;
      margin-bottom: 16px;
    }

    .feature-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .feature-card p {
      font-size: 14px;
      color: var(--muted);
    }

    /* Services */
    .services {
      padding: 80px 0;
      background: var(--background);
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
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .service-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      display: flex;
      gap: 24px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    .service-icon {
      width: 64px;
      height: 64px;
      background: ${palette.primary}15;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .service-card p {
      color: var(--muted);
      font-size: 15px;
    }

    /* Conditions */
    .conditions {
      padding: 80px 0;
      background: white;
    }

    .conditions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .condition-tag {
      background: ${palette.primary}10;
      color: var(--primary);
      padding: 16px 24px;
      border-radius: 12px;
      text-align: center;
      font-weight: 500;
    }

    /* Doctor */
    .doctor {
      padding: 80px 0;
      background: var(--background);
    }

    .doctor-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 60px;
      align-items: center;
    }

    .doctor-image {
      background: var(--accent);
      border-radius: 20px;
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 100px;
    }

    .doctor-info h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .doctor-credentials {
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 20px;
    }

    .doctor-info p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 16px;
    }

    .techniques-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .technique-tag {
      background: white;
      color: var(--primary);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid var(--primary);
    }

    /* Contact */
    .contact {
      padding: 80px 0;
      background: white;
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
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: var(--background);
      border-radius: 20px;
      padding: 40px;
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
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
    }
    .form-group textarea { height: 100px; resize: vertical; }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 16px;
      border: none;
      border-radius: 25px;
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
      font-weight: 700;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
      max-width: 300px;
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
      nav, .header-phone { display: none; }
      .hero-content,
      .doctor-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image, .doctor-image { display: none; }
      .features-grid,
      .conditions-grid { grid-template-columns: repeat(2, 1fr); }
      .services-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const body = `
    <header>
      <div class="container header-content">
        <a href="#" class="logo">
          <div class="logo-icon">🦴</div>
          <span class="logo-text">${escapeHtml(businessName)}</span>
        </a>
        <nav>
          <a href="#services">Services</a>
          <a href="#conditions">Conditions</a>
          <a href="#doctor">Meet the Doctor</a>
          <a href="#contact">Contact</a>
        </nav>
        <div class="header-right">
          ${phone ? `<a href="tel:${phone}" class="header-phone">📞 ${phone}</a>` : ''}
          <a href="#contact" class="header-cta">Book Appointment</a>
        </div>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)}</h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-white">Schedule Your Visit</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 Call Us</a>` : ''}
          </div>
        </div>
        <div class="hero-image">🦴</div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">❤️</div>
            <h3>Gentle Care</h3>
            <p>Patient-focused approach to healing</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Personalized Plans</h3>
            <p>Treatment tailored to your needs</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Pain Relief</h3>
            <p>Effective solutions for chronic pain</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌟</div>
            <h3>Proven Results</h3>
            <p>Helping patients feel their best</p>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive chiropractic care to restore your health</p>
        </div>
        <div class="services-grid">
          ${defaultTechniques.map(tech => `
            <div class="service-card">
              <div class="service-icon">✨</div>
              <div>
                <h3>${escapeHtml(tech)}</h3>
                <p>Professional ${tech.toLowerCase()} for pain relief and improved mobility.</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="conditions" class="conditions">
      <div class="container">
        <div class="section-header">
          <h2>Conditions We Treat</h2>
          <p>Expert care for a wide range of conditions</p>
        </div>
        <div class="conditions-grid">
          ${defaultConditions.map(cond => `
            <div class="condition-tag">${escapeHtml(cond)}</div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="doctor" class="doctor">
      <div class="container doctor-content">
        <div class="doctor-image">👨‍⚕️</div>
        <div class="doctor-info">
          <h2>${doctorName ? `Meet ${escapeHtml(doctorName)}` : 'Meet Your Chiropractor'}</h2>
          ${doctorCredentials ? `<div class="doctor-credentials">${escapeHtml(doctorCredentials)}</div>` : ''}
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
          <div class="techniques-list">
            ${defaultTechniques.map(t => `<span class="technique-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Schedule Your Visit</h2>
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
              <label for="concern">Primary Concern</label>
              <select id="concern" name="concern">
                <option value="">Select your concern...</option>
                ${defaultConditions.slice(0, 6).map(c => `<option value="${escapeHtml(c.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(c)}</option>`).join('')}
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Additional Details</label>
              <textarea id="message" name="message" placeholder="Tell us more about your condition..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Request Appointment</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Gentle, effective chiropractic care for the whole family.</p>
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#conditions">Conditions</a>
            <a href="#doctor">Doctor</a>
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
    title: `${businessName} | Chiropractor${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.poppins,
  });
}

export { CHIROPRACTOR_PALETTES as palettes };
