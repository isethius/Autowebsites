/**
 * Contractor/General Contractor Template
 *
 * A professional template for construction and contracting businesses.
 * Features portfolio gallery, services, quote form, and trust signals.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface ContractorTemplateInput {
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
  projectTypes?: string[];
}

export const CONTRACTOR_PALETTES: ColorPalette[] = [
  {
    name: 'Construction Orange',
    primary: '#c2410c',
    secondary: '#9a3412',
    accent: '#fb923c',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Builder Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#60a5fa',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Professional Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Green',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#86efac',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateContractorTemplate(input: ContractorTemplateInput): string {
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
    projectTypes,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const years = yearsInBusiness || 20;

  const defaultProjectTypes = projectTypes || [
    'Home Additions',
    'Kitchen Remodeling',
    'Bathroom Renovation',
    'Deck & Patio',
    'Basement Finishing',
    'Custom Homes'
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
      font-size: 24px;
      font-weight: 800;
      color: white;
      text-decoration: none;
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

    /* Stats */
    .stats {
      padding: 60px 0;
      background: white;
      border-bottom: 1px solid #e5e7eb;
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
    }

    .stat-label {
      font-size: 16px;
      color: var(--muted);
      font-weight: 500;
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
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }

    .service-image {
      height: 180px;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }

    .service-content {
      padding: 24px;
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

    /* Portfolio */
    .portfolio {
      padding: 80px 0;
      background: white;
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .portfolio-item {
      position: relative;
      height: 280px;
      background: var(--secondary);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
    }

    .portfolio-item .overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      padding: 20px;
      color: white;
    }

    .portfolio-item h4 {
      font-size: 18px;
      font-weight: 600;
    }

    .portfolio-item p {
      font-size: 13px;
      opacity: 0.8;
    }

    /* Process */
    .process {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .process .section-header h2,
    .process .section-header p {
      color: white;
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
      background: var(--accent);
      color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      margin: 0 auto 20px;
    }

    .process-step h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .process-step p {
      font-size: 14px;
      opacity: 0.9;
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
      .hero-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image { display: none; }
      .stats-grid,
      .process-steps { grid-template-columns: repeat(2, 1fr); }
      .services-grid,
      .portfolio-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const body = `
    <header>
      <div class="container header-content">
        <a href="#" class="logo">${escapeHtml(businessName)}</a>
        <nav>
          <a href="#services">Services</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#process">Our Process</a>
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
            <a href="#contact" class="btn-accent">Get Free Estimate</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 ${phone}</a>` : ''}
          </div>
          <div class="trust-badges">
            <div class="trust-badge">✓ Licensed & Insured</div>
            <div class="trust-badge">✓ ${years}+ Years Experience</div>
            <div class="trust-badge">✓ Free Estimates</div>
          </div>
        </div>
        <div class="hero-image">🏗️</div>
      </div>
    </section>

    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div>
            <div class="stat-number">${years}+</div>
            <div class="stat-label">Years Experience</div>
          </div>
          <div>
            <div class="stat-number">500+</div>
            <div class="stat-label">Projects Completed</div>
          </div>
          <div>
            <div class="stat-number">100%</div>
            <div class="stat-label">Satisfaction Rate</div>
          </div>
          <div>
            <div class="stat-number">5★</div>
            <div class="stat-label">Customer Rating</div>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Quality construction and remodeling services for every project</p>
        </div>
        <div class="services-grid">
          ${defaultProjectTypes.slice(0, 6).map(project => `
            <div class="service-card">
              <div class="service-image">🔨</div>
              <div class="service-content">
                <h3>${escapeHtml(project)}</h3>
                <p>Professional ${project.toLowerCase()} services with quality craftsmanship and attention to detail.</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="portfolio" class="portfolio">
      <div class="container">
        <div class="section-header">
          <h2>Recent Projects</h2>
          <p>See examples of our quality workmanship</p>
        </div>
        <div class="portfolio-grid">
          <div class="portfolio-item">
            🏠
            <div class="overlay">
              <h4>Kitchen Remodel</h4>
              <p>Complete kitchen renovation</p>
            </div>
          </div>
          <div class="portfolio-item">
            🏠
            <div class="overlay">
              <h4>Home Addition</h4>
              <p>500 sq ft addition</p>
            </div>
          </div>
          <div class="portfolio-item">
            🏠
            <div class="overlay">
              <h4>Bathroom Renovation</h4>
              <p>Master bath upgrade</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="process" class="process">
      <div class="container">
        <div class="section-header">
          <h2>Our Process</h2>
          <p>Simple, transparent steps from start to finish</p>
        </div>
        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <h3>Consultation</h3>
            <p>Free on-site visit to discuss your project</p>
          </div>
          <div class="process-step">
            <div class="step-number">2</div>
            <h3>Proposal</h3>
            <p>Detailed estimate with clear pricing</p>
          </div>
          <div class="process-step">
            <div class="step-number">3</div>
            <h3>Construction</h3>
            <p>Quality work with regular updates</p>
          </div>
          <div class="process-step">
            <div class="step-number">4</div>
            <h3>Completion</h3>
            <p>Final walkthrough and satisfaction</p>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Get Your Free Estimate</h2>
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
              <label for="project-type">Project Type</label>
              <select id="project-type" name="project_type">
                <option value="">Select project type...</option>
                ${defaultProjectTypes.map(p => `<option value="${escapeHtml(p.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(p)}</option>`).join('')}
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Project Details</label>
              <textarea id="message" name="message" placeholder="Tell us about your project..."></textarea>
            </div>
            <button type="submit" class="submit-btn">Request Free Estimate</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Quality construction and remodeling services. Licensed, insured, and committed to excellence.</p>
            ${licenseNumber ? `<div class="footer-license">License #${escapeHtml(licenseNumber)}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#portfolio">Portfolio</a>
            <a href="#process">Process</a>
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
    title: `${businessName} | General Contractor${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.inter,
  });
}

export { CONTRACTOR_PALETTES as palettes };
