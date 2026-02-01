/**
 * Plumber Template
 *
 * A professional, trust-focused template designed for plumbing services.
 * Emphasizes emergency availability, trust signals, and clear service areas.
 */

import { PreviewContent, ColorPalette } from '../../../overnight/types';
import { PLUMBER_PALETTES } from '../index';

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
}

/**
 * Generate plumber template HTML
 */
export function generatePlumberTemplate(input: PlumberTemplateInput): string {
  const { businessName, content, palette, phone, email, city, state, serviceAreas, licenseNumber, yearsInBusiness } = input;
  const location = [city, state].filter(Boolean).join(', ');

  // Default service areas if not provided
  const displayAreas = serviceAreas?.length ? serviceAreas : [
    city || 'Local Area',
    'Surrounding Communities',
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(content.meta_description)}">
  <title>${escapeHtml(businessName)} | Emergency Plumbing Services${location ? ` in ${location}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
      --emergency: #dc2626;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Preview Banner */
    .preview-banner {
      background: var(--primary);
      color: white;
      text-align: center;
      padding: 10px;
      font-size: 13px;
    }

    .preview-banner a {
      color: white;
      font-weight: 600;
    }

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
      font-size: 18px;
    }

    .emergency-phone:hover {
      background: #fee2e2;
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

    nav {
      display: flex;
      gap: 32px;
    }

    nav a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      transition: color 0.2s;
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

    .hero-text h1 {
      font-size: 48px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .hero-text p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: white;
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      transition: all 0.2s;
    }

    .hero-cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }

    .hero-cta-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }

    .hero-cta-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    .trust-badges {
      display: flex;
      gap: 32px;
      margin-top: 40px;
      flex-wrap: wrap;
    }

    .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .trust-icon {
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
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
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .service-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      transition: all 0.2s;
      border: 1px solid #e5e7eb;
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

    /* Why Choose Us */
    .why-us {
      padding: 80px 0;
      background: white;
    }

    .why-us-grid {
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

    /* Service Areas */
    .service-areas {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .service-areas .section-header h2,
    .service-areas .section-header p {
      color: white;
    }

    .areas-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }

    .area-tag {
      background: rgba(255,255,255,0.15);
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
    }

    /* Reviews */
    .reviews {
      padding: 80px 0;
      background: #f9fafb;
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #e5e7eb;
    }

    .review-stars {
      color: #fbbf24;
      font-size: 20px;
      margin-bottom: 16px;
    }

    .review-text {
      font-size: 15px;
      color: var(--muted);
      margin-bottom: 20px;
      font-style: italic;
    }

    .review-author {
      font-weight: 600;
      font-size: 14px;
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
      background: #f9fafb;
      border-radius: 12px;
      padding: 40px;
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
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 15px;
      font-family: inherit;
      transition: border-color 0.2s;
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
      color: white;
      padding: 16px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--secondary);
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

    ${licenseNumber ? `
    .footer-license {
      margin-top: 16px;
      font-size: 13px;
      color: #9ca3af;
    }
    ` : ''}

    .footer-links {
      display: flex;
      gap: 40px;
    }

    .footer-links a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
    }

    .footer-links a:hover {
      color: white;
    }

    .footer-bottom {
      padding-top: 30px;
      border-top: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      color: #9ca3af;
      font-size: 13px;
    }

    .footer-bottom a {
      color: var(--accent);
      text-decoration: none;
    }

    /* Responsive */
    @media (max-width: 900px) {
      nav { display: none; }

      .hero-content,
      .contact-content {
        grid-template-columns: 1fr;
      }

      .hero-text h1 { font-size: 32px; }

      .why-us-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .reviews-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .hero-image {
        display: none;
      }

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
  </style>
</head>
<body>
  <div class="preview-banner">
    ✨ This is a preview of your new website! <a href="../index.html">View other designs →</a>
  </div>

  ${phone ? `
  <div class="emergency-bar">
    <div class="container emergency-content">
      <span>🚨 24/7 Emergency Service Available</span>
      <a href="tel:${phone}" class="emergency-phone">
        📞 ${phone}
      </a>
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
      <a href="#contact" class="header-cta">Get Free Quote</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-content">
      <div class="hero-text">
        <h1>${escapeHtml(content.headline)}</h1>
        <p>${escapeHtml(content.tagline)}</p>
        <div class="hero-buttons">
          ${phone ? `<a href="tel:${phone}" class="hero-cta-primary">📞 Call Now: ${phone}</a>` : ''}
          <a href="#contact" class="hero-cta-secondary">Request Free Quote</a>
        </div>
        <div class="trust-badges">
          <div class="trust-badge">
            <div class="trust-icon">✓</div>
            <span>Licensed & Insured</span>
          </div>
          <div class="trust-badge">
            <div class="trust-icon">⏰</div>
            <span>24/7 Emergency</span>
          </div>
          <div class="trust-badge">
            <div class="trust-icon">💯</div>
            <span>100% Satisfaction</span>
          </div>
        </div>
      </div>
      <div class="hero-image">
        📸 Professional Photo
      </div>
    </div>
  </section>

  <section id="services" class="services">
    <div class="container">
      <div class="section-header">
        <h2>Our Plumbing Services</h2>
        <p>Professional solutions for all your plumbing needs</p>
      </div>
      <div class="services-grid">
        ${content.services.map(service => `
        <div class="service-card">
          <div class="service-icon">🔧</div>
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
        <p>Trusted by homeowners throughout ${location || 'the area'}</p>
      </div>
      <div class="why-us-grid">
        <div class="why-card">
          <div class="why-number">${yearsInBusiness || '15'}+</div>
          <div class="why-label">Years Experience</div>
          <div class="why-desc">Serving the community with pride</div>
        </div>
        <div class="why-card">
          <div class="why-number">24/7</div>
          <div class="why-label">Emergency Service</div>
          <div class="why-desc">We're always here when you need us</div>
        </div>
        <div class="why-card">
          <div class="why-number">100%</div>
          <div class="why-label">Satisfaction</div>
          <div class="why-desc">Guaranteed quality workmanship</div>
        </div>
        <div class="why-card">
          <div class="why-number">5★</div>
          <div class="why-label">Rated Service</div>
          <div class="why-desc">Trusted by our customers</div>
        </div>
      </div>
    </div>
  </section>

  <section id="areas" class="service-areas">
    <div class="container">
      <div class="section-header">
        <h2>Areas We Serve</h2>
        <p>Providing quality plumbing services throughout the region</p>
      </div>
      <div class="areas-grid">
        ${displayAreas.map(area => `<span class="area-tag">${escapeHtml(area)}</span>`).join('')}
      </div>
    </div>
  </section>

  <section class="reviews">
    <div class="container">
      <div class="section-header">
        <h2>What Our Customers Say</h2>
        <p>Real reviews from satisfied customers</p>
      </div>
      <div class="reviews-grid">
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"Fast, professional service! They fixed our emergency leak within an hour of calling. Highly recommend!"</p>
          <div class="review-author">- Local Homeowner</div>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"Fair pricing and excellent work. They explained everything clearly before starting. Will definitely use again."</p>
          <div class="review-author">- Satisfied Customer</div>
        </div>
        <div class="review-card">
          <div class="review-stars">★★★★★</div>
          <p class="review-text">"The most reliable plumber we've ever used. On time, professional, and great quality work."</p>
          <div class="review-author">- Happy Homeowner</div>
        </div>
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
        <span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

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

export { PLUMBER_PALETTES };
