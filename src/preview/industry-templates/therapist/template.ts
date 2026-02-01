/**
 * Therapist / Counselor Template
 *
 * A calming, professional template designed for therapists, counselors,
 * and mental health professionals. Inspired by successful therapy practice websites.
 */

import { PreviewContent, ColorPalette } from '../../../overnight/types';
import { THERAPIST_PALETTES } from '../index';

export interface TherapistTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  specialties?: string[];
  credentials?: string;
}

/**
 * Generate therapist template HTML
 */
export function generateTherapistTemplate(input: TherapistTemplateInput): string {
  const { businessName, content, palette, phone, email, city, state, specialties } = input;
  const location = [city, state].filter(Boolean).join(', ');

  // Default specialties if not provided
  const displaySpecialties = specialties?.length ? specialties : [
    'Anxiety & Depression',
    'Relationship Issues',
    'Life Transitions',
    'Trauma & PTSD',
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(content.meta_description)}">
  <title>${escapeHtml(businessName)} | Therapy & Counseling${location ? ` in ${location}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Lato', sans-serif;
      line-height: 1.7;
      color: var(--text);
      background: var(--background);
    }

    h1, h2, h3, h4 {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 600;
      line-height: 1.3;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
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

    /* Header */
    header {
      background: var(--background);
      padding: 20px 0;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      color: var(--primary);
      text-decoration: none;
    }

    nav {
      display: flex;
      gap: 36px;
    }

    nav a {
      color: var(--text);
      text-decoration: none;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.3px;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--primary);
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: background 0.2s;
    }

    .header-cta:hover {
      background: var(--secondary);
    }

    /* Hero */
    .hero {
      padding: 100px 0;
      background: linear-gradient(180deg, var(--background) 0%, white 100%);
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 52px;
      color: var(--text);
      margin-bottom: 24px;
    }

    .hero-text p {
      font-size: 19px;
      color: var(--muted);
      margin-bottom: 32px;
      line-height: 1.8;
    }

    .hero-cta {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 16px 36px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }

    .hero-cta:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .hero-image {
      background: linear-gradient(135deg, var(--primary)30 0%, var(--accent)20 100%);
      border-radius: 8px;
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-size: 16px;
    }

    /* Specialties */
    .specialties {
      padding: 100px 0;
      background: white;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-size: 42px;
      color: var(--text);
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 17px;
      max-width: 600px;
      margin: 0 auto;
    }

    .specialties-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .specialty-card {
      background: var(--background);
      border-radius: 8px;
      padding: 36px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .specialty-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    }

    .specialty-card h3 {
      font-size: 24px;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .specialty-card p {
      color: var(--muted);
      font-size: 15px;
    }

    /* Approach */
    .approach {
      padding: 100px 0;
      background: var(--background);
    }

    .approach-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }

    .approach-image {
      background: var(--primary);
      border-radius: 8px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .approach-text h2 {
      font-size: 42px;
      margin-bottom: 24px;
    }

    .approach-text p {
      color: var(--muted);
      margin-bottom: 16px;
      font-size: 16px;
    }

    /* Sessions */
    .sessions {
      padding: 100px 0;
      background: white;
    }

    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .session-card {
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 8px;
      padding: 36px;
      text-align: center;
      transition: all 0.2s;
    }

    .session-card:hover {
      border-color: var(--primary);
    }

    .session-type {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .session-card h3 {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .session-card .description {
      color: var(--muted);
      font-size: 15px;
      margin-bottom: 24px;
    }

    .session-cta {
      display: inline-block;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 12px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .session-cta:hover {
      background: var(--primary);
      color: white;
    }

    /* About */
    .about {
      padding: 100px 0;
      background: var(--background);
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 80px;
      align-items: start;
    }

    .about-image {
      background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
      border-radius: 8px;
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .about-text h2 {
      font-size: 42px;
      margin-bottom: 24px;
    }

    .about-text p {
      color: var(--muted);
      margin-bottom: 20px;
      font-size: 16px;
    }

    .credentials {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(0,0,0,0.08);
    }

    .credentials h4 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .credentials p {
      font-size: 15px;
      color: var(--muted);
    }

    /* Contact */
    .contact {
      padding: 100px 0;
      background: white;
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 80px;
    }

    .contact-info h2 {
      font-size: 42px;
      margin-bottom: 24px;
    }

    .contact-info > p {
      color: var(--muted);
      margin-bottom: 36px;
      font-size: 16px;
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

    .contact-icon {
      width: 44px;
      height: 44px;
      background: var(--background);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .contact-item-text {
      font-size: 15px;
    }

    .contact-item-text strong {
      display: block;
      margin-bottom: 2px;
    }

    .contact-item-text a {
      color: var(--primary);
      text-decoration: none;
    }

    .contact-form {
      background: var(--background);
      border-radius: 8px;
      padding: 40px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 4px;
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
      height: 120px;
      resize: vertical;
    }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 16px;
      border: none;
      border-radius: 4px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--secondary);
    }

    /* Footer */
    footer {
      background: var(--text);
      color: white;
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
    }

    .footer-brand h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      max-width: 280px;
    }

    .footer-links {
      display: flex;
      gap: 40px;
    }

    .footer-links a {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: white;
    }

    .footer-bottom {
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
      color: rgba(255,255,255,0.5);
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
      .approach-content,
      .about-content,
      .contact-content {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .hero-text h1 { font-size: 38px; }
      .section-header h2 { font-size: 32px; }

      .specialties-grid {
        grid-template-columns: 1fr;
      }

      .sessions-grid {
        grid-template-columns: 1fr;
      }

      .hero-image,
      .approach-image,
      .about-image {
        height: 280px;
        order: -1;
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

  <header>
    <div class="container header-content">
      <a href="#" class="logo">${escapeHtml(businessName)}</a>
      <nav>
        <a href="#specialties">Specialties</a>
        <a href="#approach">My Approach</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#contact" class="header-cta">Schedule Consultation</a>
    </div>
  </header>

  <section class="hero">
    <div class="container hero-content">
      <div class="hero-text">
        <h1>${escapeHtml(content.headline)}</h1>
        <p>${escapeHtml(content.tagline)}</p>
        <a href="#contact" class="hero-cta">${escapeHtml(content.cta_text)}</a>
      </div>
      <div class="hero-image">
        📸 Professional Photo Here
      </div>
    </div>
  </section>

  <section id="specialties" class="specialties">
    <div class="container">
      <div class="section-header">
        <h2>Areas of Focus</h2>
        <p>I provide compassionate, evidence-based therapy for a range of challenges</p>
      </div>
      <div class="specialties-grid">
        ${displaySpecialties.map(specialty => `
        <div class="specialty-card">
          <h3>${escapeHtml(specialty)}</h3>
          <p>Providing supportive, personalized care to help you navigate ${specialty.toLowerCase()} with compassion and understanding.</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section id="approach" class="approach">
    <div class="container approach-content">
      <div class="approach-image">
        📸 Session Photo
      </div>
      <div class="approach-text">
        <h2>My Therapeutic Approach</h2>
        ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>
    </div>
  </section>

  <section class="sessions">
    <div class="container">
      <div class="section-header">
        <h2>Session Options</h2>
        <p>Flexible options to fit your needs and schedule</p>
      </div>
      <div class="sessions-grid">
        <div class="session-card">
          <div class="session-type">Individual</div>
          <h3>One-on-One Sessions</h3>
          <p class="description">Personalized therapy focused on your unique needs and goals</p>
          <a href="#contact" class="session-cta">Learn More</a>
        </div>
        <div class="session-card">
          <div class="session-type">Couples</div>
          <h3>Relationship Therapy</h3>
          <p class="description">Strengthen communication and connection with your partner</p>
          <a href="#contact" class="session-cta">Learn More</a>
        </div>
        <div class="session-card">
          <div class="session-type">Virtual</div>
          <h3>Telehealth Sessions</h3>
          <p class="description">Convenient online therapy from the comfort of your home</p>
          <a href="#contact" class="session-cta">Learn More</a>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="about">
    <div class="container about-content">
      <div class="about-image">
        📸 About Photo
      </div>
      <div class="about-text">
        <h2>About ${escapeHtml(businessName)}</h2>
        ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        <div class="credentials">
          <h4>Credentials & Training</h4>
          <p>${input.credentials || 'Licensed Professional Counselor • Certified in Evidence-Based Therapies • Specialized Training in Trauma-Informed Care'}</p>
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="contact">
    <div class="container contact-content">
      <div class="contact-info">
        <h2>Let's Connect</h2>
        <p>${escapeHtml(content.contact_text)}</p>
        <div class="contact-details">
          ${phone ? `
          <div class="contact-item">
            <div class="contact-icon">📞</div>
            <div class="contact-item-text">
              <strong>Phone</strong>
              <a href="tel:${phone}">${phone}</a>
            </div>
          </div>
          ` : ''}
          ${email ? `
          <div class="contact-item">
            <div class="contact-icon">✉️</div>
            <div class="contact-item-text">
              <strong>Email</strong>
              <a href="mailto:${email}">${email}</a>
            </div>
          </div>
          ` : ''}
          ${location ? `
          <div class="contact-item">
            <div class="contact-icon">📍</div>
            <div class="contact-item-text">
              <strong>Location</strong>
              ${escapeHtml(location)}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      <div class="contact-form">
        <form action="#" method="POST">
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone">
          </div>
          <div class="form-group">
            <label for="concern">Primary Concern</label>
            <select id="concern" name="concern">
              <option value="">Select one...</option>
              <option value="anxiety">Anxiety</option>
              <option value="depression">Depression</option>
              <option value="relationships">Relationship Issues</option>
              <option value="trauma">Trauma</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="message">Tell Me About Yourself</label>
            <textarea id="message" name="message" placeholder="Share a bit about what brings you here..."></textarea>
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
          <p>${escapeHtml(content.tagline)}</p>
        </div>
        <div class="footer-links">
          <a href="#specialties">Specialties</a>
          <a href="#approach">My Approach</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. All rights reserved.</span>
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

export { THERAPIST_PALETTES };
