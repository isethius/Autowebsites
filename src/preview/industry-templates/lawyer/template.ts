/**
 * Lawyer/Law Firm Template
 *
 * A professional, authoritative template for legal services.
 * Features practice areas, attorney profiles, and case results.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface LawyerTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  practiceAreas?: string[];
  attorneys?: { name: string; title: string; bio?: string }[];
  caseResults?: { type: string; result: string }[];
  barNumber?: string;
}

export const LAWYER_PALETTES: ColorPalette[] = [
  {
    name: 'Authoritative Navy',
    primary: '#1e3a5f',
    secondary: '#0f2744',
    accent: '#c9a227',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Classic Burgundy',
    primary: '#722f37',
    secondary: '#5a252c',
    accent: '#b8860b',
    background: '#fdfcfb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Slate',
    primary: '#334155',
    secondary: '#1e293b',
    accent: '#0ea5e9',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Forest Trust',
    primary: '#14532d',
    secondary: '#0f3d21',
    accent: '#86efac',
    background: '#fafdf7',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateLawyerTemplate(input: LawyerTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    address,
    practiceAreas,
    attorneys,
    caseResults,
    barNumber,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');

  const defaultPracticeAreas = practiceAreas || [
    'Personal Injury',
    'Family Law',
    'Criminal Defense',
    'Business Law',
    'Estate Planning',
    'Real Estate'
  ];

  const defaultAttorneys = attorneys || [
    { name: 'John Smith', title: 'Managing Partner', bio: 'Over 20 years of experience' },
    { name: 'Sarah Johnson', title: 'Senior Associate', bio: 'Specializing in family law' },
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
      font-family: 'Playfair Display', Georgia, serif;
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
      font-family: 'Source Sans Pro', sans-serif;
    }
    .preview-banner a { color: white; font-weight: 600; }

    /* Top Bar */
    .top-bar {
      background: var(--primary);
      color: white;
      padding: 10px 0;
      font-family: 'Source Sans Pro', sans-serif;
      font-size: 14px;
    }

    .top-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .top-bar a {
      color: white;
      text-decoration: none;
    }

    /* Header */
    header {
      background: white;
      padding: 20px 0;
      border-bottom: 3px solid var(--accent);
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
    }

    .logo-subtitle {
      font-size: 12px;
      color: var(--muted);
      font-family: 'Source Sans Pro', sans-serif;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    nav {
      display: flex;
      gap: 32px;
      font-family: 'Source Sans Pro', sans-serif;
    }
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
      padding: 14px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 100px 0;
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero h1 {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 24px;
    }

    .hero p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 32px;
      font-family: 'Source Sans Pro', sans-serif;
      line-height: 1.7;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
    }

    .btn-accent {
      background: var(--accent);
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      font-family: 'Source Sans Pro', sans-serif;
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
      font-size: 42px;
      font-weight: 700;
      color: var(--accent);
    }

    .hero-stat-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Practice Areas */
    .practice-areas {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .practice-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .practice-card {
      background: white;
      padding: 32px;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s;
    }

    .practice-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .practice-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .practice-card p {
      color: var(--muted);
      font-size: 15px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Attorneys */
    .attorneys {
      padding: 80px 0;
      background: white;
    }

    .attorney-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
    }

    .attorney-card {
      display: flex;
      gap: 24px;
      padding: 32px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .attorney-photo {
      width: 120px;
      height: 120px;
      background: var(--primary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      flex-shrink: 0;
    }

    .attorney-info h3 {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .attorney-info .title {
      color: var(--accent);
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .attorney-info p {
      color: var(--muted);
      font-size: 15px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Results */
    .results {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .results .section-header h2,
    .results .section-header p {
      color: white;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .result-card {
      background: rgba(255,255,255,0.1);
      padding: 32px;
      border-radius: 8px;
      text-align: center;
    }

    .result-amount {
      font-size: 36px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .result-type {
      font-size: 15px;
      opacity: 0.9;
      font-family: 'Source Sans Pro', sans-serif;
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
      font-family: 'Source Sans Pro', sans-serif;
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
      font-family: 'Source Sans Pro', sans-serif;
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
      background: #f8f9fa;
      border-radius: 8px;
      padding: 40px;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 20px; }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
      font-family: 'Source Sans Pro', sans-serif;
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 15px;
      font-family: 'Source Sans Pro', sans-serif;
    }
    .form-group textarea { height: 100px; resize: vertical; }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 16px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .disclaimer {
      margin-top: 16px;
      font-size: 12px;
      color: var(--muted);
      font-family: 'Source Sans Pro', sans-serif;
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
      font-family: 'Source Sans Pro', sans-serif;
    }

    .footer-disclaimer {
      margin-top: 16px;
      font-size: 12px;
      color: #9ca3af;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .footer-links {
      display: flex;
      gap: 40px;
      font-family: 'Source Sans Pro', sans-serif;
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
      font-family: 'Source Sans Pro', sans-serif;
    }

    .footer-bottom a { color: var(--accent); }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero-content,
      .contact-content,
      .attorney-grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-stats { display: none; }
      .practice-grid,
      .results-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const body = `
    <div class="top-bar">
      <div class="container top-bar-content">
        <span>Free Consultation Available</span>
        ${phone ? `<a href="tel:${phone}">📞 ${phone}</a>` : ''}
      </div>
    </div>

    <header>
      <div class="container header-content">
        <div>
          <a href="#" class="logo">${escapeHtml(businessName)}</a>
          <div class="logo-subtitle">Attorneys at Law</div>
        </div>
        <nav>
          <a href="#practice">Practice Areas</a>
          <a href="#team">Our Team</a>
          <a href="#results">Results</a>
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
            ${phone ? `<a href="tel:${phone}" class="btn-accent">📞 Call ${phone}</a>` : '<a href="#contact" class="btn-accent">Get Started</a>'}
            <a href="#practice" class="btn-outline">View Practice Areas</a>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-number">500+</div>
            <div class="hero-stat-label">Cases Won</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">25+</div>
            <div class="hero-stat-label">Years Experience</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">$50M+</div>
            <div class="hero-stat-label">Recovered</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number">98%</div>
            <div class="hero-stat-label">Success Rate</div>
          </div>
        </div>
      </div>
    </section>

    <section id="practice" class="practice-areas">
      <div class="container">
        <div class="section-header">
          <h2>Practice Areas</h2>
          <p>Experienced legal representation across a wide range of practice areas</p>
        </div>
        <div class="practice-grid">
          ${defaultPracticeAreas.map(area => `
            <div class="practice-card">
              <h3>${escapeHtml(area)}</h3>
              <p>Dedicated legal support to protect your rights and interests.</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="team" class="attorneys">
      <div class="container">
        <div class="section-header">
          <h2>Meet Our Attorneys</h2>
          <p>Experienced legal professionals dedicated to your case</p>
        </div>
        <div class="attorney-grid">
          ${defaultAttorneys.map(atty => `
            <div class="attorney-card">
              <div class="attorney-photo">👤</div>
              <div class="attorney-info">
                <h3>${escapeHtml(atty.name)}</h3>
                <div class="title">${escapeHtml(atty.title)}</div>
                ${atty.bio ? `<p>${escapeHtml(atty.bio)}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="results" class="results">
      <div class="container">
        <div class="section-header">
          <h2>Case Results</h2>
          <p>A track record of success for our clients</p>
        </div>
        <div class="results-grid">
          ${(caseResults || [
            { type: 'Personal Injury', result: '$2.5M' },
            { type: 'Medical Malpractice', result: '$1.8M' },
            { type: 'Wrongful Death', result: '$3.2M' },
          ]).map(r => `
            <div class="result-card">
              <div class="result-amount">${escapeHtml(r.result)}</div>
              <div class="result-type">${escapeHtml(r.type)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Schedule Your Free Consultation</h2>
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
                  <strong>Office Location</strong><br>
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
              <label for="case-type">Type of Case</label>
              <select id="case-type" name="case_type">
                <option value="">Select case type...</option>
                ${defaultPracticeAreas.map(area => `<option value="${escapeHtml(area.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(area)}</option>`).join('')}
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Brief Description of Your Case</label>
              <textarea id="message" name="message" placeholder="Please describe your legal matter..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Request Free Consultation</button>
            <p class="disclaimer">* No attorney-client relationship is formed by submitting this form.</p>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Dedicated legal representation serving clients throughout ${location || 'the region'}.</p>
            ${barNumber ? `<div class="footer-disclaimer">Bar #${escapeHtml(barNumber)}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#practice">Practice Areas</a>
            <a href="#team">Our Team</a>
            <a href="#results">Results</a>
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
    title: `${businessName} | Attorneys at Law${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.playfair,
  });
}

export { LAWYER_PALETTES as palettes };
