/**
 * Gym / Fitness Center Template
 *
 * An energetic, motivating template for gyms and fitness centers.
 * Emphasizes transformation, community, and free trial offers.
 */

import { PreviewContent, ColorPalette } from '../../../overnight/types';
import { GYM_PALETTES } from '../index';

export interface GymTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  programs?: string[];
  amenities?: string[];
}

/**
 * Generate gym template HTML
 */
export function generateGymTemplate(input: GymTemplateInput): string {
  const { businessName, content, palette, phone, email, city, state, programs, amenities } = input;
  const location = [city, state].filter(Boolean).join(', ');

  const displayPrograms = programs?.length ? programs : [
    'Strength Training',
    'Cardio & HIIT',
    'Group Fitness Classes',
    'Personal Training',
  ];

  const displayAmenities = amenities?.length ? amenities : [
    'State-of-the-Art Equipment',
    'Clean Locker Rooms',
    'Free Parking',
    'Extended Hours',
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(content.meta_description)}">
  <title>${escapeHtml(businessName)} | Fitness Center${location ? ` in ${location}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
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
      font-family: 'Open Sans', sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
    }

    h1, h2, h3, h4 {
      font-family: 'Oswald', sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
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

    /* Promo Bar */
    .promo-bar {
      background: var(--accent);
      color: white;
      text-align: center;
      padding: 12px;
      font-weight: 600;
    }

    /* Header */
    header {
      background: #18181b;
      color: white;
      padding: 16px 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-family: 'Oswald', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: white;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    nav {
      display: flex;
      gap: 32px;
    }

    nav a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--accent);
    }

    .header-cta {
      background: var(--primary);
      color: white;
      padding: 12px 28px;
      border-radius: 4px;
      text-decoration: none;
      font-family: 'Oswald', sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: background 0.2s;
    }

    .header-cta:hover {
      background: var(--secondary);
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
      color: white;
      padding: 100px 0;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 50%;
      background: linear-gradient(135deg, var(--primary)40 0%, var(--accent)20 100%);
      clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 600px;
    }

    .hero h1 {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: 24px;
    }

    .hero p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-cta-primary {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 18px 40px;
      border-radius: 4px;
      text-decoration: none;
      font-family: 'Oswald', sans-serif;
      font-size: 18px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s;
    }

    .hero-cta-primary:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .hero-cta-secondary {
      display: inline-block;
      border: 2px solid white;
      color: white;
      padding: 16px 36px;
      border-radius: 4px;
      text-decoration: none;
      font-family: 'Oswald', sans-serif;
      font-size: 18px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s;
    }

    .hero-cta-secondary:hover {
      background: white;
      color: #18181b;
    }

    /* Programs */
    .programs {
      padding: 100px 0;
      background: white;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-size: 42px;
      margin-bottom: 16px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    .programs-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .program-card {
      background: #fafafa;
      border-radius: 8px;
      padding: 32px 24px;
      text-align: center;
      transition: all 0.3s;
      border: 2px solid transparent;
    }

    .program-card:hover {
      border-color: var(--primary);
      transform: translateY(-8px);
    }

    .program-icon {
      width: 72px;
      height: 72px;
      background: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
    }

    .program-card h3 {
      font-size: 20px;
      margin-bottom: 12px;
    }

    .program-card p {
      color: var(--muted);
      font-size: 14px;
    }

    /* Stats */
    .stats {
      padding: 60px 0;
      background: var(--primary);
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      text-align: center;
    }

    .stat-number {
      font-family: 'Oswald', sans-serif;
      font-size: 56px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
    }

    /* About */
    .about {
      padding: 100px 0;
      background: #f9fafb;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .about-image {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
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

    .amenities-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 32px;
    }

    .amenity-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
    }

    .amenity-check {
      color: var(--primary);
      font-weight: bold;
    }

    /* Free Trial */
    .free-trial {
      padding: 100px 0;
      background: #18181b;
      color: white;
      text-align: center;
    }

    .free-trial h2 {
      font-size: 48px;
      margin-bottom: 24px;
    }

    .free-trial p {
      font-size: 20px;
      opacity: 0.8;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .trial-form {
      max-width: 500px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }

    .trial-form input {
      padding: 16px 20px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-family: inherit;
    }

    .trial-form button {
      background: var(--primary);
      color: white;
      padding: 18px 32px;
      border: none;
      border-radius: 4px;
      font-family: 'Oswald', sans-serif;
      font-size: 18px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .trial-form button:hover {
      background: var(--secondary);
    }

    /* Contact */
    .contact {
      padding: 80px 0;
      background: white;
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
    }

    .contact-info h2 {
      font-size: 36px;
      margin-bottom: 24px;
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
      background: var(--primary);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .contact-form {
      background: #f9fafb;
      border-radius: 8px;
      padding: 40px;
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
      border-radius: 4px;
      font-size: 15px;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .submit-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      padding: 16px;
      border: none;
      border-radius: 4px;
      font-family: 'Oswald', sans-serif;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .submit-btn:hover {
      background: var(--secondary);
    }

    /* Footer */
    footer {
      background: #18181b;
      color: white;
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .footer-brand h3 {
      font-family: 'Oswald', sans-serif;
      font-size: 28px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .footer-brand p {
      color: #9ca3af;
      font-size: 14px;
      max-width: 300px;
    }

    .footer-links {
      display: flex;
      gap: 32px;
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

      .hero h1 { font-size: 36px; }
      .hero::before { display: none; }

      .programs-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .about-content,
      .contact-content {
        grid-template-columns: 1fr;
      }

      .about-image {
        height: 280px;
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

  <div class="promo-bar">
    🔥 START YOUR FREE 7-DAY TRIAL TODAY - No Commitment Required!
  </div>

  <header>
    <div class="container header-content">
      <a href="#" class="logo">${escapeHtml(businessName)}</a>
      <nav>
        <a href="#programs">Programs</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <a href="#trial" class="header-cta">Start Free Trial</a>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1>${escapeHtml(content.headline)}</h1>
        <p>${escapeHtml(content.tagline)}</p>
        <div class="hero-buttons">
          <a href="#trial" class="hero-cta-primary">Start Free Trial</a>
          <a href="#contact" class="hero-cta-secondary">Book a Tour</a>
        </div>
      </div>
    </div>
  </section>

  <section id="programs" class="programs">
    <div class="container">
      <div class="section-header">
        <h2>Our Programs</h2>
        <p>Everything you need to reach your fitness goals</p>
      </div>
      <div class="programs-grid">
        ${displayPrograms.map((program, i) => `
        <div class="program-card">
          <div class="program-icon">${['💪', '🏃', '🔥', '🎯'][i] || '⭐'}</div>
          <h3>${escapeHtml(program)}</h3>
          <p>Expert-led training designed to help you achieve real results</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="stats">
    <div class="container">
      <div class="stats-grid">
        <div>
          <div class="stat-number">500+</div>
          <div class="stat-label">Active Members</div>
        </div>
        <div>
          <div class="stat-number">50+</div>
          <div class="stat-label">Weekly Classes</div>
        </div>
        <div>
          <div class="stat-number">10+</div>
          <div class="stat-label">Expert Trainers</div>
        </div>
        <div>
          <div class="stat-number">5★</div>
          <div class="stat-label">Rated Gym</div>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="about">
    <div class="container about-content">
      <div class="about-image">
        📸 Facility Photo
      </div>
      <div class="about-text">
        <h2>About ${escapeHtml(businessName)}</h2>
        ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        <div class="amenities-list">
          ${displayAmenities.map(amenity => `
          <div class="amenity-item">
            <span class="amenity-check">✓</span>
            <span>${escapeHtml(amenity)}</span>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>

  <section id="trial" class="free-trial">
    <div class="container">
      <h2>Ready to Transform?</h2>
      <p>Start your 7-day free trial today. No credit card required. No commitment.</p>
      <div class="trial-form">
        <input type="text" placeholder="Your Name" required>
        <input type="email" placeholder="Email Address" required>
        <input type="tel" placeholder="Phone Number">
        <button type="submit">Claim Your Free Trial</button>
      </div>
    </div>
  </section>

  <section id="contact" class="contact">
    <div class="container contact-content">
      <div class="contact-info">
        <h2>Visit Us</h2>
        <p>${escapeHtml(content.contact_text)}</p>
        <div class="contact-details">
          ${phone ? `
          <div class="contact-item">
            <div class="contact-item-icon">📞</div>
            <div>
              <strong>Phone</strong><br>
              <a href="tel:${phone}" style="color: inherit; text-decoration: none;">${phone}</a>
            </div>
          </div>
          ` : ''}
          ${email ? `
          <div class="contact-item">
            <div class="contact-item-icon">✉️</div>
            <div>
              <strong>Email</strong><br>
              <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${email}</a>
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
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="interest">I'm Interested In</label>
            <select id="interest" name="interest">
              <option value="">Select one...</option>
              <option value="membership">Gym Membership</option>
              <option value="training">Personal Training</option>
              <option value="classes">Group Classes</option>
              <option value="tour">Facility Tour</option>
            </select>
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
          <h3>${escapeHtml(businessName)}</h3>
          <p>Your transformation starts here. Join our fitness community today.</p>
        </div>
        <div class="footer-links">
          <a href="#programs">Programs</a>
          <a href="#about">About</a>
          <a href="#trial">Free Trial</a>
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

export { GYM_PALETTES };
