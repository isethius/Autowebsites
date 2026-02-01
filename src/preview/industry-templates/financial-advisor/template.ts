/**
 * Financial Advisor Template
 *
 * A professional template for financial advisors and wealth management.
 * Features services, credentials, and consultation booking.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface FinancialAdvisorTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  advisorName?: string;
  credentials?: string[];
  specializations?: string[];
  disclosures?: string;
}

export const FINANCIAL_ADVISOR_PALETTES: ColorPalette[] = [
  {
    name: 'Wealth Navy',
    primary: '#1e3a5f',
    secondary: '#0f2744',
    accent: '#d4af37',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Green',
    primary: '#166534',
    secondary: '#14532d',
    accent: '#fbbf24',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#22c55e',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Executive Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#d4af37',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateFinancialAdvisorTemplate(input: FinancialAdvisorTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    advisorName,
    credentials,
    specializations,
    disclosures,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const defaultCredentials = credentials || ['CFP®', 'Fiduciary'];
  const defaultSpecializations = specializations || [
    'Retirement Planning',
    'Investment Management',
    'Estate Planning',
    'Tax Strategies',
    'Insurance Planning',
    'College Savings'
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

    /* Header */
    header {
      background: white;
      padding: 24px 0;
      border-bottom: 2px solid var(--accent);
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

    .logo-tagline {
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
    nav a:hover { color: var(--accent); }

    .header-cta {
      background: var(--accent);
      color: var(--primary);
      padding: 14px 28px;
      text-decoration: none;
      font-weight: 700;
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
      grid-template-columns: 1.3fr 1fr;
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
      padding: 18px 36px;
      text-decoration: none;
      font-weight: 700;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 16px 32px;
      text-decoration: none;
      font-weight: 600;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 100px;
    }

    /* Services */
    .services {
      padding: 80px 0;
      background: white;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 40px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .service-card {
      background: var(--background);
      padding: 36px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }

    .service-card:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.1);
      border-color: var(--accent);
    }

    .service-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .service-card h3 {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .service-card p {
      color: var(--muted);
      font-size: 15px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* About */
    .about {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 60px;
      align-items: center;
    }

    .about-image {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 120px;
    }

    .about-text h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .about-credentials {
      color: var(--accent);
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 24px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .about-text p {
      opacity: 0.9;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 16px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Process */
    .process {
      padding: 80px 0;
      background: #f9fafb;
    }

    .process-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }

    .process-step {
      text-align: center;
    }

    .step-number {
      width: 60px;
      height: 60px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      margin: 0 auto 20px;
      font-family: 'Source Sans Pro', sans-serif;
    }

    .process-step h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .process-step p {
      color: var(--muted);
      font-size: 14px;
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
      background: ${palette.accent}20;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: #f9fafb;
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
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Source Sans Pro', sans-serif;
    }

    /* Disclosures */
    .disclosures {
      padding: 40px 0;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .disclosures p {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.6;
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
      .about-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image, .about-image { display: none; }
      .services-grid { grid-template-columns: 1fr; }
      .process-steps { grid-template-columns: repeat(2, 1fr); }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const serviceIcons: Record<string, string> = {
    'Retirement Planning': '🎯',
    'Investment Management': '📈',
    'Estate Planning': '🏛️',
    'Tax Strategies': '📋',
    'Insurance Planning': '🛡️',
    'College Savings': '🎓',
  };

  const body = `
    <header>
      <div class="container header-content">
        <div>
          <a href="#" class="logo">${escapeHtml(businessName)}</a>
          <div class="logo-tagline">Wealth Management</div>
        </div>
        <nav>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#process">Process</a>
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
        <div class="hero-image">📊</div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive financial planning to help you achieve your goals</p>
        </div>
        <div class="services-grid">
          ${defaultSpecializations.map(spec => `
            <div class="service-card">
              <div class="service-icon">${serviceIcons[spec] || '💼'}</div>
              <h3>${escapeHtml(spec)}</h3>
              <p>Expert guidance to optimize your ${spec.toLowerCase()} strategy.</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="about" class="about">
      <div class="container about-content">
        <div class="about-image">👤</div>
        <div class="about-text">
          <h2>${advisorName ? escapeHtml(advisorName) : 'Your Financial Partner'}</h2>
          <div class="about-credentials">${defaultCredentials.join(' • ')}</div>
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      </div>
    </section>

    <section id="process" class="process">
      <div class="container">
        <div class="section-header">
          <h2>Our Process</h2>
          <p>A clear path to financial confidence</p>
        </div>
        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <h3>Discovery</h3>
            <p>Understand your goals, values, and current situation</p>
          </div>
          <div class="process-step">
            <div class="step-number">2</div>
            <h3>Analysis</h3>
            <p>Review your finances and identify opportunities</p>
          </div>
          <div class="process-step">
            <div class="step-number">3</div>
            <h3>Strategy</h3>
            <p>Create a customized plan for your future</p>
          </div>
          <div class="process-step">
            <div class="step-number">4</div>
            <h3>Implementation</h3>
            <p>Execute and monitor your financial plan</p>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Start Your Journey</h2>
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
              <label for="interest">Primary Interest</label>
              <select id="interest" name="interest">
                <option value="">Select...</option>
                ${defaultSpecializations.map(s => `<option value="${escapeHtml(s.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(s)}</option>`).join('')}
                <option value="comprehensive">Comprehensive Planning</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Tell Us About Your Goals</label>
              <textarea id="message" name="message" placeholder="What financial goals are most important to you?"></textarea>
            </div>
            <button type="submit" class="submit-btn">Request Consultation</button>
          </form>
        </div>
      </div>
    </section>

    ${disclosures ? `
    <section class="disclosures">
      <div class="container">
        <p>${escapeHtml(disclosures)}</p>
      </div>
    </section>
    ` : ''}

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Your trusted partner for comprehensive financial planning and wealth management.</p>
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#process">Process</a>
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
    title: `${businessName} | Financial Advisor${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.playfair,
  });
}

export { FINANCIAL_ADVISOR_PALETTES as palettes };
