/**
 * Veterinarian Template
 *
 * A caring, professional template for veterinary practices.
 * Features services, team, emergency info, and pet-focused design.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface VeterinarianTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  emergencyPhone?: string;
  petTypes?: string[];
  hours?: {
    weekday?: string;
    weekend?: string;
    emergency?: string;
  };
}

export const VETERINARIAN_PALETTES: ColorPalette[] = [
  {
    name: 'Pet Friendly',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#fbbf24',
    background: '#f0fdfa',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Caring Blue',
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#f97316',
    background: '#f0f9ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Nature Green',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#fbbf24',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Warm Purple',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#f472b6',
    background: '#faf5ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateVeterinarianTemplate(input: VeterinarianTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    address,
    emergencyPhone,
    petTypes,
    hours,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');
  const defaultPetTypes = petTypes || ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Reptiles', 'Small Animals'];

  const defaultServices = content.services.length > 0 ? content.services : [
    { name: 'Wellness Exams', description: 'Comprehensive health checkups for your pet' },
    { name: 'Vaccinations', description: 'Core and lifestyle vaccines to keep pets healthy' },
    { name: 'Dental Care', description: 'Cleanings, extractions, and oral health' },
    { name: 'Surgery', description: 'Spay/neuter and surgical procedures' },
    { name: 'Emergency Care', description: 'Urgent medical attention when needed' },
    { name: 'Diagnostics', description: 'X-rays, bloodwork, and lab testing' },
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

    /* Emergency Bar */
    .emergency-bar {
      background: var(--emergency);
      color: white;
      padding: 10px 0;
      text-align: center;
    }

    .emergency-content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-weight: 600;
    }

    .emergency-phone {
      background: white;
      color: var(--emergency);
      padding: 6px 16px;
      border-radius: 20px;
      text-decoration: none;
      font-weight: 700;
    }

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
      font-size: 40px;
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
      font-size: 120px;
    }

    /* Pet Types */
    .pet-types {
      padding: 40px 0;
      background: white;
    }

    .pet-types-grid {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 32px;
    }

    .pet-type {
      text-align: center;
    }

    .pet-type-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .pet-type-name {
      font-weight: 500;
      font-size: 14px;
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
      border-radius: 16px;
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
      width: 64px;
      height: 64px;
      background: ${palette.primary}15;
      border-radius: 50%;
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

    /* Hours */
    .hours {
      padding: 60px 0;
      background: var(--primary);
      color: white;
    }

    .hours-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      text-align: center;
    }

    .hours-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .hours-card p {
      opacity: 0.9;
      font-size: 16px;
    }

    .hours-icon {
      font-size: 32px;
      margin-bottom: 12px;
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
      nav { display: none; }
      .emergency-content { flex-direction: column; gap: 8px; }
      .hero-content,
      .contact-content { grid-template-columns: 1fr; }
      .hero h1 { font-size: 32px; }
      .hero-image { display: none; }
      .services-grid,
      .hours-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const petIcons: Record<string, string> = {
    dogs: '🐕',
    cats: '🐈',
    birds: '🐦',
    rabbits: '🐇',
    reptiles: '🦎',
    'small animals': '🐹',
  };

  const body = `
    ${emergencyPhone || phone ? `
    <div class="emergency-bar">
      <div class="container emergency-content">
        <span>🚨 Pet Emergency?</span>
        <a href="tel:${emergencyPhone || phone}" class="emergency-phone">📞 ${emergencyPhone || phone}</a>
      </div>
    </div>
    ` : ''}

    <header>
      <div class="container header-content">
        <a href="#" class="logo">
          <span class="logo-icon">🐾</span>
          <span class="logo-text">${escapeHtml(businessName)}</span>
        </a>
        <nav>
          <a href="#services">Services</a>
          <a href="#hours">Hours</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Book Appointment</a>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <div>
          <h1>${escapeHtml(content.headline)}</h1>
          <p>${escapeHtml(content.tagline)}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-white">Schedule Visit</a>
            ${phone ? `<a href="tel:${phone}" class="btn-outline">📞 Call Us</a>` : ''}
          </div>
        </div>
        <div class="hero-image">🐾</div>
      </div>
    </section>

    <section class="pet-types">
      <div class="container">
        <div class="pet-types-grid">
          ${defaultPetTypes.map(pet => `
            <div class="pet-type">
              <div class="pet-type-icon">${petIcons[pet.toLowerCase()] || '🐾'}</div>
              <div class="pet-type-name">${escapeHtml(pet)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive veterinary care for your furry family members</p>
        </div>
        <div class="services-grid">
          ${defaultServices.map(service => `
            <div class="service-card">
              <div class="service-icon">🩺</div>
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section id="hours" class="hours">
      <div class="container">
        <div class="hours-grid">
          <div class="hours-card">
            <div class="hours-icon">🕐</div>
            <h3>Weekdays</h3>
            <p>${hours?.weekday || 'Mon-Fri: 8am - 6pm'}</p>
          </div>
          <div class="hours-card">
            <div class="hours-icon">📅</div>
            <h3>Weekends</h3>
            <p>${hours?.weekend || 'Sat: 9am - 3pm'}</p>
          </div>
          <div class="hours-card">
            <div class="hours-icon">🚨</div>
            <h3>Emergency</h3>
            <p>${hours?.emergency || '24/7 Emergency Line'}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Book an Appointment</h2>
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
                <label for="owner-name">Your Name</label>
                <input type="text" id="owner-name" name="owner_name" required>
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="pet-name">Pet's Name</label>
                <input type="text" id="pet-name" name="pet_name">
              </div>
              <div class="form-group">
                <label for="pet-type">Pet Type</label>
                <select id="pet-type" name="pet_type">
                  <option value="">Select...</option>
                  ${defaultPetTypes.map(p => `<option value="${escapeHtml(p.toLowerCase())}">${escapeHtml(p)}</option>`).join('')}
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="service">Service Needed</label>
              <select id="service" name="service">
                <option value="">Select a service...</option>
                <option value="wellness">Wellness Exam</option>
                <option value="vaccines">Vaccinations</option>
                <option value="dental">Dental Care</option>
                <option value="sick">Sick Visit</option>
                <option value="surgery">Surgery Consultation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Additional Details</label>
              <textarea id="message" name="message" placeholder="Tell us about your pet's needs..."></textarea>
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
            <p>Compassionate care for your pets. We treat them like family.</p>
          </div>
          <div class="footer-links">
            <a href="#services">Services</a>
            <a href="#hours">Hours</a>
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
    title: `${businessName} | Veterinarian${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.poppins,
  });
}

export { VETERINARIAN_PALETTES as palettes };
