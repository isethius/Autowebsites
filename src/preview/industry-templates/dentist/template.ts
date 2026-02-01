/**
 * Dentist Template
 *
 * A clean, welcoming template for dental practices.
 * Features services, team, online booking, and patient-focused design.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface DentistTemplateInput {
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
  specialties?: string[];
  insurances?: string[];
}

export const DENTIST_PALETTES: ColorPalette[] = [
  {
    name: 'Fresh Mint',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#5eead4',
    background: '#f0fdfa',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Clean Blue',
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#7dd3fc',
    background: '#f0f9ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Calm Lavender',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#c4b5fd',
    background: '#faf5ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Gentle Coral',
    primary: '#e11d48',
    secondary: '#be123c',
    accent: '#fda4af',
    background: '#fff1f2',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateDentistTemplate(input: DentistTemplateInput): string {
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
    specialties,
    insurances,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');

  const defaultServices = content.services.length > 0 ? content.services : [
    { name: 'General Dentistry', description: 'Comprehensive exams, cleanings, and preventive care' },
    { name: 'Cosmetic Dentistry', description: 'Teeth whitening, veneers, and smile makeovers' },
    { name: 'Restorative Care', description: 'Fillings, crowns, bridges, and implants' },
    { name: 'Emergency Dental', description: 'Same-day appointments for dental emergencies' },
    { name: 'Pediatric Dentistry', description: 'Gentle care for children of all ages' },
    { name: 'Orthodontics', description: 'Invisalign and traditional braces' },
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
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .service-card {
      background: white;
      padding: 32px;
      border-radius: 16px;
      text-align: center;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
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
      margin: 0 auto 20px;
      font-size: 28px;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .service-card p {
      color: var(--muted);
      font-size: 15px;
    }

    /* Doctor */
    .doctor {
      padding: 80px 0;
      background: white;
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

    .doctor-specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }

    .specialty-tag {
      background: ${palette.primary}15;
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Insurance */
    .insurance {
      padding: 60px 0;
      background: var(--primary);
      color: white;
      text-align: center;
    }

    .insurance h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .insurance-list {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .insurance-item {
      background: rgba(255,255,255,0.15);
      padding: 12px 24px;
      border-radius: 25px;
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
      background: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: white;
      border-radius: 20px;
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
      border: 2px solid #e5e7eb;
      border-radius: 12px;
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
          <div class="logo-icon">🦷</div>
          <span class="logo-text">${escapeHtml(businessName)}</span>
        </a>
        <nav>
          <a href="#services">Services</a>
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
            <a href="#contact" class="btn-white">Book Your Visit</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 Call Us</a>` : ''}
          </div>
          <div class="trust-badges">
            <div class="trust-badge">
              <span>✓</span>
              <span>Gentle Care</span>
            </div>
            <div class="trust-badge">
              <span>✓</span>
              <span>Modern Technology</span>
            </div>
            <div class="trust-badge">
              <span>✓</span>
              <span>All Ages Welcome</span>
            </div>
          </div>
        </div>
        <div class="hero-image">🦷</div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">😊</div>
            <h3>Comfortable Care</h3>
            <p>Relaxing environment for stress-free visits</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏆</div>
            <h3>Experienced Team</h3>
            <p>Skilled professionals you can trust</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Modern Technology</h3>
            <p>Latest equipment for best results</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📅</div>
            <h3>Easy Scheduling</h3>
            <p>Convenient appointment times</p>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Dental Services</h2>
          <p>Comprehensive care for your entire family</p>
        </div>
        <div class="services-grid">
          ${defaultServices.map(service => `
            <div class="service-card">
              <div class="service-icon">🦷</div>
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="doctor" class="doctor">
      <div class="container doctor-content">
        <div class="doctor-image">👨‍⚕️</div>
        <div class="doctor-info">
          <h2>${doctorName ? `Meet ${escapeHtml(doctorName)}` : 'Meet Your Dentist'}</h2>
          ${doctorCredentials ? `<div class="doctor-credentials">${escapeHtml(doctorCredentials)}</div>` : ''}
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
          ${(specialties || ['General Dentistry', 'Cosmetic Procedures', 'Family Care']).length > 0 ? `
            <div class="doctor-specialties">
              ${(specialties || ['General Dentistry', 'Cosmetic Procedures', 'Family Care']).map(s => `
                <span class="specialty-tag">${escapeHtml(s)}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </section>

    <section class="insurance">
      <div class="container">
        <h2>Insurance We Accept</h2>
        <div class="insurance-list">
          ${(insurances || ['Delta Dental', 'Cigna', 'Aetna', 'MetLife', 'United Healthcare', 'Most PPO Plans']).map(ins => `
            <div class="insurance-item">${escapeHtml(ins)}</div>
          `).join('')}
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
            <div class="form-row">
              <div class="form-group">
                <label for="service">Service Needed</label>
                <select id="service" name="service">
                  <option value="">Select a service...</option>
                  <option value="cleaning">Cleaning & Checkup</option>
                  <option value="cosmetic">Cosmetic Dentistry</option>
                  <option value="restorative">Restorative Care</option>
                  <option value="emergency">Emergency Visit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="patient-type">Patient Type</label>
                <select id="patient-type" name="patient_type">
                  <option value="new">New Patient</option>
                  <option value="existing">Existing Patient</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="message">Additional Notes</label>
              <textarea id="message" name="message" placeholder="Any concerns or questions?"></textarea>
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
            <p>Your family's smile is our priority. Gentle, comprehensive dental care for all ages.</p>
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#doctor">Meet the Doctor</a>
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
    title: `${businessName} | Dentist${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.poppins,
  });
}

export { DENTIST_PALETTES as palettes };
