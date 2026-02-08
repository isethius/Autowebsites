/**
 * Contact Form Section
 *
 * Reusable contact form builders.
 */

import { escapeHtml } from '../utils';
import { icons } from '../icons';

export interface ContactConfig {
  title?: string;
  subtitle?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  hours?: string;
  showMap?: boolean;
  formFields?: 'basic' | 'detailed' | 'quote';
  serviceOptions?: string[];
  sectionId?: string;
}

/**
 * Generate contact section CSS
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
export function generateContactCSS(): string {
  return `
    .contact {
      padding: var(--section-spacing, 80px) 0;
      background: var(--background, #ffffff);
    }

    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: var(--gap-xl, 60px);
    }

    .contact-info h2 {
      font-size: var(--text-h2, 36px);
      font-weight: 800;
      margin-bottom: var(--gap-sm, 20px);
    }

    .contact-info > p {
      color: var(--muted);
      margin-bottom: var(--gap-md, 32px);
      font-size: var(--text-body, 16px);
      line-height: 1.6;
    }

    .contact-details {
      display: flex;
      flex-direction: column;
      gap: var(--gap-sm, 20px);
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: var(--gap-sm, 16px);
    }

    .contact-item-icon {
      width: var(--avatar-size, 48px);
      height: var(--avatar-size, 48px);
      background: var(--bg-surface, var(--gray-100, #f3f4f6));
      border-radius: var(--radius-sm, 10px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary, #1e5a8a);
    }

    .contact-item-icon svg {
      width: 20px;
      height: 20px;
    }

    .contact-item-content {
      flex: 1;
    }

    .contact-item-content strong {
      display: block;
      margin-bottom: var(--gap-xs, 4px);
      font-size: var(--text-sm, 14px);
    }

    .contact-item-content a,
    .contact-item-content span {
      color: var(--muted);
      font-size: var(--text-sm, 15px);
    }

    .contact-item-content a:hover {
      color: var(--primary);
    }

    .contact-form-wrapper {
      background: var(--bg-surface, var(--gray-50, #f9fafb));
      border-radius: var(--radius, 12px);
      padding: var(--card-padding, 40px);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
      border: var(--border-width, 0) solid var(--border-color, transparent);
    }

    .contact-form-wrapper h3 {
      font-size: var(--text-lg, 20px);
      font-weight: 700;
      margin-bottom: var(--gap-md, 24px);
    }

    /* Form inputs */
    .contact-form-wrapper input,
    .contact-form-wrapper textarea,
    .contact-form-wrapper select {
      width: 100%;
      padding: var(--btn-padding-sm, 12px 16px);
      border: var(--border-width, 1px) solid var(--border-color, var(--gray-300));
      border-radius: var(--radius-sm, 8px);
      font-size: var(--text-body, 16px);
      margin-bottom: var(--gap-sm, 16px);
      transition: border-color 0.2s ease;
    }

    .contact-form-wrapper input:focus,
    .contact-form-wrapper textarea:focus,
    .contact-form-wrapper select:focus {
      outline: none;
      border-color: var(--primary);
    }

    /* Use global .btn instead of custom .submit-btn */
    .contact-form-wrapper .btn {
      width: 100%;
    }

    @media (max-width: 900px) {
      .contact-content {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Generate form fields based on type
 */
function generateFormFields(type: 'basic' | 'detailed' | 'quote', serviceOptions?: string[]): string {
  const namePhoneRow = `
    <div class="form-row">
      <div class="form-group">
        <label for="name">Your Name</label>
        <input type="text" id="name" name="name" required placeholder="John Smith">
      </div>
      <div class="form-group">
        <label for="phone">Phone Number</label>
        <input type="tel" id="phone" name="phone" required placeholder="(555) 123-4567">
      </div>
    </div>
  `;

  const emailField = `
    <div class="form-group">
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" placeholder="john@example.com">
    </div>
  `;

  const messageField = `
    <div class="form-group">
      <label for="message">Message</label>
      <textarea id="message" name="message" placeholder="How can we help you?"></textarea>
    </div>
  `;

  if (type === 'basic') {
    return namePhoneRow + emailField + messageField;
  }

  if (type === 'quote') {
    const serviceSelect = serviceOptions?.length ? `
      <div class="form-group">
        <label for="service">Service Needed</label>
        <select id="service" name="service">
          <option value="">Select a service...</option>
          ${serviceOptions.map(opt => `<option value="${escapeHtml(opt.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(opt)}</option>`).join('')}
          <option value="other">Other</option>
        </select>
      </div>
    ` : '';

    return namePhoneRow + emailField + serviceSelect + `
      <div class="form-group">
        <label for="message">Describe Your Needs</label>
        <textarea id="message" name="message" placeholder="Please describe what you need help with..."></textarea>
      </div>
    `;
  }

  // Detailed form
  return namePhoneRow + `
    <div class="form-row">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" placeholder="john@example.com">
      </div>
      <div class="form-group">
        <label for="preferred-time">Preferred Contact Time</label>
        <select id="preferred-time" name="preferred_time">
          <option value="">Select a time...</option>
          <option value="morning">Morning (9am - 12pm)</option>
          <option value="afternoon">Afternoon (12pm - 5pm)</option>
          <option value="evening">Evening (5pm - 8pm)</option>
        </select>
      </div>
    </div>
  ` + messageField;
}

/**
 * Standard contact section with info and form
 */
export function generateContactSection(config: ContactConfig): string {
  const {
    title = 'Get In Touch',
    subtitle = "We'd love to hear from you. Reach out today!",
    phone,
    email,
    address,
    city,
    state,
    hours,
    formFields = 'basic',
    serviceOptions,
    sectionId = 'contact'
  } = config;

  const location = [city, state].filter(Boolean).join(', ');
  const fullAddress = address ? `${address}${location ? `, ${location}` : ''}` : location;

  return `
    <section id="${sectionId}" class="contact">
      <div class="container contact-content">
        <div class="contact-info">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
          <div class="contact-details">
            ${phone ? `
              <div class="contact-item">
                <div class="contact-item-icon">${icons.phone({ size: 20 })}</div>
                <div class="contact-item-content">
                  <strong>Call Us</strong>
                  <a href="tel:${phone}">${phone}</a>
                </div>
              </div>
            ` : ''}
            ${email ? `
              <div class="contact-item">
                <div class="contact-item-icon">${icons.email({ size: 20 })}</div>
                <div class="contact-item-content">
                  <strong>Email Us</strong>
                  <a href="mailto:${email}">${email}</a>
                </div>
              </div>
            ` : ''}
            ${fullAddress ? `
              <div class="contact-item">
                <div class="contact-item-icon">${icons.location({ size: 20 })}</div>
                <div class="contact-item-content">
                  <strong>Location</strong>
                  <span>${escapeHtml(fullAddress)}</span>
                </div>
              </div>
            ` : ''}
            ${hours ? `
              <div class="contact-item">
                <div class="contact-item-icon">${icons.clock({ size: 20 })}</div>
                <div class="contact-item-content">
                  <strong>Hours</strong>
                  <span>${escapeHtml(hours)}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="contact-form-wrapper">
          <h3>Send Us a Message</h3>
          <form action="#" method="POST">
            ${generateFormFields(formFields, serviceOptions)}
            <button type="submit" class="submit-btn">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

/**
 * Simple CTA-focused contact section
 */
export function generateContactCTA(config: ContactConfig): string {
  const { phone, title = 'Ready to Get Started?' } = config;

  return `
    <section class="contact" style="background: var(--primary); color: var(--white); padding: 60px 0; text-align: center;">
      <div class="container">
        <h2 style="color: var(--white); margin-bottom: 16px;">${escapeHtml(title)}</h2>
        <p style="opacity: 0.9; margin-bottom: 32px; font-size: 18px;">Contact us today for a free consultation</p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          ${phone ? `<a href="tel:${phone}" class="btn btn-white btn-lg">${icons.phone({ size: 18 })} Call ${phone}</a>` : ''}
          <a href="#contact" class="btn btn-secondary btn-lg" style="color: var(--white); border-color: var(--white);">Send Message</a>
        </div>
      </div>
    </section>
  `;
}

/**
 * Minimal contact footer
 */
export function generateContactFooter(config: ContactConfig): string {
  const { phone, email, city, state } = config;
  const location = [city, state].filter(Boolean).join(', ');

  return `
    <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; padding: 20px; background: var(--gray-100); font-size: 14px;">
      ${phone ? `<a href="tel:${phone}" style="display: flex; align-items: center; gap: 8px;">${icons.phone({ size: 16 })} ${phone}</a>` : ''}
      ${email ? `<a href="mailto:${email}" style="display: flex; align-items: center; gap: 8px;">${icons.email({ size: 16 })} ${email}</a>` : ''}
      ${location ? `<span style="display: flex; align-items: center; gap: 8px;">${icons.location({ size: 16 })} ${escapeHtml(location)}</span>` : ''}
    </div>
  `;
}
