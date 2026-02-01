/**
 * Restaurant Template
 *
 * A warm, inviting template for restaurants and food service businesses.
 * Features menu display, hours, reservations, and gallery.
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { escapeHtml, generateDocument, FONT_LINKS } from '../_shared';

export interface RestaurantTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  cuisineType?: string;
  hours?: {
    weekday?: string;
    weekend?: string;
    note?: string;
  };
  features?: string[];
  menuCategories?: { name: string; items: { name: string; description: string; price?: string }[] }[];
}

export const RESTAURANT_PALETTES: ColorPalette[] = [
  {
    name: 'Warm Bistro',
    primary: '#b45309',
    secondary: '#92400e',
    accent: '#f59e0b',
    background: '#fffbeb',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Modern Kitchen',
    primary: '#18181b',
    secondary: '#27272a',
    accent: '#f97316',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Garden Fresh',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#86efac',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Classic Italian',
    primary: '#991b1b',
    secondary: '#7f1d1d',
    accent: '#fca5a5',
    background: '#fef2f2',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

export function generateRestaurantTemplate(input: RestaurantTemplateInput): string {
  const {
    businessName,
    content,
    palette,
    phone,
    email,
    city,
    state,
    address,
    cuisineType,
    hours,
    features,
    menuCategories,
  } = input;

  const location = [city, state].filter(Boolean).join(', ');

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
      font-size: 28px;
      font-weight: 700;
      color: var(--primary);
    }

    .logo-tagline {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
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
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 100px 0;
      text-align: center;
    }

    .hero h1 {
      font-size: 52px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .hero p {
      font-size: 22px;
      opacity: 0.9;
      margin-bottom: 32px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    .btn-white {
      background: white;
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    /* Features Bar */
    .features-bar {
      background: white;
      padding: 40px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .features-grid {
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .feature-icon {
      font-size: 24px;
    }

    /* About Section */
    .about {
      padding: 80px 0;
      background: white;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .about-text h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .about-text p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 16px;
    }

    .about-image {
      background: var(--accent);
      border-radius: 12px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
    }

    /* Menu Section */
    .menu {
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

    .menu-category {
      margin-bottom: 48px;
    }

    .menu-category h3 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--primary);
      display: inline-block;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }

    .menu-item-info h4 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .menu-item-info p {
      color: var(--muted);
      font-size: 14px;
    }

    .menu-item-price {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }

    /* Hours & Location */
    .hours-location {
      padding: 80px 0;
      background: var(--primary);
      color: white;
    }

    .hl-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 48px;
      text-align: center;
    }

    .hl-card h3 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .hl-card p {
      opacity: 0.9;
      font-size: 16px;
      line-height: 1.8;
    }

    .hl-icon {
      font-size: 32px;
      margin-bottom: 16px;
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
      .about-content,
      .contact-content,
      .hl-grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 36px; }
      .menu-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .about-image { display: none; }
      .footer-content { flex-direction: column; gap: 32px; }
      .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
    }
  `;

  const defaultFeatures = features || ['Dine-In', 'Takeout', 'Reservations', 'Catering'];
  const defaultMenu = menuCategories || [
    {
      name: 'Appetizers',
      items: [
        { name: 'House Salad', description: 'Fresh mixed greens with house dressing', price: '$8' },
        { name: 'Soup of the Day', description: 'Ask your server for today\'s selection', price: '$6' },
      ]
    },
    {
      name: 'Main Courses',
      items: [
        { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with seasonal vegetables', price: '$24' },
        { name: 'Ribeye Steak', description: '12oz prime ribeye with garlic butter', price: '$32' },
      ]
    }
  ];

  const body = `
    <header>
      <div class="container header-content">
        <div>
          <a href="#" class="logo">${escapeHtml(businessName)}</a>
          ${cuisineType ? `<div class="logo-tagline">${escapeHtml(cuisineType)}</div>` : ''}
        </div>
        <nav>
          <a href="#about">About</a>
          <a href="#menu">Menu</a>
          <a href="#hours">Hours</a>
          <a href="#contact">Contact</a>
        </nav>
        <a href="#contact" class="header-cta">Reserve a Table</a>
      </div>
    </header>

    <section class="hero">
      <div class="container">
        <h1>${escapeHtml(content.headline)}</h1>
        <p>${escapeHtml(content.tagline)}</p>
        <div class="hero-buttons">
          <a href="#menu" class="btn-white">View Our Menu</a>
          <a href="#contact" class="btn-outline">Make Reservation</a>
        </div>
      </div>
    </section>

    <div class="features-bar">
      <div class="container">
        <div class="features-grid">
          ${defaultFeatures.map(f => `
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>${escapeHtml(f)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <section id="about" class="about">
      <div class="container about-content">
        <div class="about-text">
          <h2>Our Story</h2>
          ${content.about.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
        <div class="about-image">🍽️</div>
      </div>
    </section>

    <section id="menu" class="menu">
      <div class="container">
        <div class="section-header">
          <h2>Our Menu</h2>
          <p>Crafted with passion, served with love</p>
        </div>
        ${defaultMenu.map(cat => `
          <div class="menu-category">
            <h3>${escapeHtml(cat.name)}</h3>
            <div class="menu-grid">
              ${cat.items.map(item => `
                <div class="menu-item">
                  <div class="menu-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${escapeHtml(item.description)}</p>
                  </div>
                  ${item.price ? `<div class="menu-item-price">${escapeHtml(item.price)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section id="hours" class="hours-location">
      <div class="container">
        <div class="hl-grid">
          <div class="hl-card">
            <div class="hl-icon">🕐</div>
            <h3>Hours</h3>
            <p>
              ${hours?.weekday ? `Mon-Fri: ${escapeHtml(hours.weekday)}<br>` : 'Mon-Fri: 11am - 10pm<br>'}
              ${hours?.weekend ? `Sat-Sun: ${escapeHtml(hours.weekend)}` : 'Sat-Sun: 10am - 11pm'}
              ${hours?.note ? `<br><em>${escapeHtml(hours.note)}</em>` : ''}
            </p>
          </div>
          <div class="hl-card">
            <div class="hl-icon">📍</div>
            <h3>Location</h3>
            <p>
              ${address ? `${escapeHtml(address)}<br>` : ''}
              ${location || 'Your City, State'}
            </p>
          </div>
          <div class="hl-card">
            <div class="hl-icon">📞</div>
            <h3>Reservations</h3>
            <p>
              ${phone ? `Call us at<br><strong>${phone}</strong>` : 'Call for reservations'}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>Make a Reservation</h2>
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
                  <strong>Visit Us</strong><br>
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
            <div class="form-row">
              <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date" name="date" required>
              </div>
              <div class="form-group">
                <label for="time">Time</label>
                <input type="time" id="time" name="time" required>
              </div>
            </div>
            <div class="form-group">
              <label for="guests">Number of Guests</label>
              <select id="guests" name="guests">
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
                <option value="5">5 guests</option>
                <option value="6">6+ guests (call us)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">Special Requests</label>
              <textarea id="message" name="message" placeholder="Any dietary restrictions or special occasions?"></textarea>
            </div>
            <button type="submit" class="submit-btn">Reserve Table</button>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>Experience exceptional dining in a warm, welcoming atmosphere.</p>
          </div>
          <div class="footer-links">
            <a href="#about">About</a>
            <a href="#menu">Menu</a>
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
    title: `${businessName} | ${cuisineType || 'Restaurant'}${location ? ` in ${location}` : ''}`,
    description: content.meta_description,
    styles,
    body,
    fontLink: FONT_LINKS.poppins,
  });
}

export { RESTAURANT_PALETTES as palettes };
