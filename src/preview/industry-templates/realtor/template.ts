/**
 * Realtor/Real Estate Template
 *
 * A professional template for real estate agents and brokerages.
 * Features listings, areas served, testimonials, and agent profile.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface RealtorTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  agentName?: string;
  agentTitle?: string;
  licenseNumber?: string;
  areasServed?: string[];
  specialties?: string[];
  testimonials?: { text: string; author: string; location?: string }[];
}

export const REALTOR_PALETTES: ColorPalette[] = [
  {
    name: 'Luxury Gold',
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#d4af37',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Trust Blue',
    primary: '#1e40af',
    secondary: '#1e3a8a',
    accent: '#60a5fa',
    background: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Slate',
    primary: '#334155',
    secondary: '#1e293b',
    accent: '#f97316',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Elegant Forest',
    primary: '#14532d',
    secondary: '#166534',
    accent: '#fbbf24',
    background: '#fefdfb',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateRealtorTemplate(input: RealtorTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    agentName,
    agentTitle,
    licenseNumber,
    areasServed,
    specialties,
    testimonials,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const displayName = agentName || businessName;

  const defaultAreas = areasServed || [location || 'Local Area', 'Downtown', 'Suburbs', 'Surrounding Communities'];
  const defaultSpecialties = specialties || ['Residential Sales', 'First-Time Buyers', 'Luxury Homes', 'Investment Properties'];
  const defaultTestimonials = testimonials || [
    { text: 'Made the home buying process smooth and stress-free!', author: 'The Johnsons', location: 'First-time buyers' },
    { text: 'Sold our home above asking price in just 2 weeks.', author: 'Michael T.', location: 'Home seller' },
    { text: 'Incredibly knowledgeable about the local market.', author: 'Sarah M.', location: 'Luxury home buyer' },
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
      font-size: 26px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }

    .logo span {
      color: var(--accent);
    }

    nav { display: flex; gap: 32px; }
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
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 100px 0;
      position: relative;
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
      margin-bottom: 20px;
    }

    .hero h1 span {
      color: var(--accent);
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
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
    }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
    }

    .hero-stat {
      text-align: center;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }

    .hero-stat-number {
      font-size: 36px;
      font-weight: 700;
      color: var(--accent);
    }

    .hero-stat-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }

    .hero-image {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 100px;
    }

    /* About Agent */
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
      background: var(--accent);
      border-radius: 12px;
      height: 500px;
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

    .about-text .title {
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 24px;
    }

    .about-text p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 16px;
      font-family: 'Open Sans', sans-serif;
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .specialty-tag {
      background: ${palette.primary}10;
      color: var(--primary);
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Areas */
    .areas {
      padding: 80px 0;
      background: var(--primary);
      color: white;
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
      font-size: 18px;
      opacity: 0.9;
      font-family: 'Open Sans', sans-serif;
    }

    .areas-grid {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .area-card {
      background: rgba(255,255,255,0.1);
      padding: 20px 32px;
      border-radius: 8px;
      font-weight: 600;
    }

    /* Services */
    .services {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .service-card {
      background: white;
      padding: 32px;
      border-radius: 12px;
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
      margin-bottom: 20px;
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

    /* Testimonials */
    .testimonials {
      padding: 80px 0;
      background: white;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .testimonial-card {
      background: #f8f9fa;
      padding: 32px;
      border-radius: 12px;
      border-left: 4px solid var(--accent);
    }

    .testimonial-stars {
      color: var(--accent);
      font-size: 20px;
      margin-bottom: 16px;
    }

    .testimonial-text {
      font-size: 16px;
      font-style: italic;
      margin-bottom: 20px;
      line-height: 1.7;
      font-family: 'Open Sans', sans-serif;
    }

    .testimonial-author {
      font-weight: 600;
    }

    .testimonial-location {
      font-size: 13px;
      color: var(--muted);
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
      background: ${palette.accent}20;
      border-radius: 8px;
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
      background: var(--accent);
      color: var(--primary);
      padding: 16px;
      border: none;
      border-radius: 8px;
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

    .footer-license {
      margin-top: 12px;
      font-size: 12px;
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
      .about-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image, .about-image { display: none; }
      .services-grid,
      .testimonials-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const body = `
    <header>
      <div class="container header-content">
        <a href="#" class="logo">${escapeHtml(displayName)}<span>.</span></a>
        <nav>
          <a href="#about">About</a>
          <a href="#areas">Areas</a>
          <a href="#services">Services</a>
          <a href="#testimonials">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Let's Connect</a>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)} <span>in ${location || 'Your Area'}</span></h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-accent">Start Your Search</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 ${phone}</a>` : ''}
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-number">150+</div>
              <div class="hero-stat-label">Homes Sold</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-number">$50M+</div>
              <div class="hero-stat-label">Total Sales</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-number">15+</div>
              <div class="hero-stat-label">Years Experience</div>
            </div>
          </div>
        </div>
        <div class="hero-image">🏠</div>
      </div>
    </section>

    <section id="about" class="about">
      <div class="container about-content">
        <div class="about-image">👤</div>
        <div class="about-text">
          <h2>${agentName ? escapeHtml(agentName) : 'Your Trusted Agent'}</h2>
          ${agentTitle ? `<div class="title">${escapeHtml(agentTitle)}</div>` : '<div class="title">Real Estate Professional</div>'}
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
          <div class="specialties-list">
            ${defaultSpecialties.map(s => `<span class="specialty-tag">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section id="areas" class="areas">
      <div class="container">
        <div class="section-header">
          <h2>Areas I Serve</h2>
          <p>Expert knowledge of the local real estate market</p>
        </div>
        <div class="areas-grid">
          ${defaultAreas.map(area => `<div class="area-card">${escapeHtml(area)}</div>`).join('')}
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>How I Can Help</h2>
          <p>Full-service real estate support from start to finish</p>
        </div>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">🏡</div>
            <h3>Buying a Home</h3>
            <p>Find your perfect home with personalized search and expert guidance through every step.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">💰</div>
            <h3>Selling Your Home</h3>
            <p>Get top dollar with strategic pricing, professional marketing, and skilled negotiation.</p>
          </div>
          <div class="service-card">
            <div class="service-icon">📊</div>
            <h3>Market Analysis</h3>
            <p>Understand your home's true value with comprehensive comparative market analysis.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="testimonials" class="testimonials">
      <div class="container">
        <div class="section-header">
          <h2>Client Success Stories</h2>
          <p>What my clients say about working together</p>
        </div>
        <div class="testimonials-grid">
          ${defaultTestimonials.map(t => `
            <div class="testimonial-card">
              <div class="testimonial-stars">★★★★★</div>
              <p class="testimonial-text">"${escapeHtml(t.text)}"</p>
              <div class="testimonial-author">${escapeHtml(t.author)}</div>
              ${t.location ? `<div class="testimonial-location">${escapeHtml(t.location)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Let's Find Your Dream Home</h2>
          <p>${escapeHtml(content.contact_text)}</p>
          <div class="contact-details">
            ${phone ? `
              <div class="contact-item">
                <div class="contact-item-icon">📞</div>
                <div>
                  <strong>Call or Text</strong><br>
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
                  <strong>Serving</strong><br>
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
              <label for="interest">I'm Interested In</label>
              <select id="interest" name="interest">
                <option value="">Select one...</option>
                <option value="buying">Buying a Home</option>
                <option value="selling">Selling My Home</option>
                <option value="both">Buying & Selling</option>
                <option value="valuation">Home Valuation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Tell Me More</label>
              <textarea id="message" name="message" placeholder="What are you looking for?"></textarea>
            </div>
            <button type="submit" class="submit-btn">Send Message</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(displayName)}</h3>
            <p>Your trusted real estate partner in ${location || 'the area'}. Let's find your perfect home together.</p>
            ${licenseNumber ? `<div class="footer-license">License #${escapeHtml(licenseNumber)}</div>` : ''}
          </div>
          <div class="footer-links">
            <a href="#about">About</a>
            <a href="#areas">Areas</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(displayName)}. All rights reserved.</span>
          <span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>
        </div>
      </div>
    </footer>
  `;

  return generateDocument({
    title: `${displayName} | Real Estate${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.montserrat,
  });
}

export { REALTOR_PALETTES as palettes };
