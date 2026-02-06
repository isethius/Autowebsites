/**
 * Footer Section
 *
 * Reusable footer builders.
 */

import { escapeHtml } from '../utils';

export interface FooterConfig {
  businessName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  license?: string;
  socialLinks?: { platform: string; url: string }[];
  navLinks?: { label: string; href: string }[];
  showBranding?: boolean;
}

/**
 * Generate footer CSS
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
export function generateFooterCSS(): string {
  return `
    footer {
      background: var(--gray-800, #1f2937);
      color: var(--white, #ffffff);
      padding: var(--footer-spacing, 100px 0 40px);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--gap-lg, 40px);
      flex-wrap: wrap;
      gap: var(--gap-lg, 40px);
    }

    .footer-brand {
      max-width: calc(var(--section-spacing, 140px) * 4.375);
    }

    .footer-brand h3 {
      font-size: var(--text-h4, 24px);
      font-weight: 800;
      margin-bottom: var(--gap-xs, 12px);
    }

    .footer-brand p {
      color: var(--gray-400, #9ca3af);
      font-size: var(--text-sm, 14px);
      line-height: 1.6;
    }

    .footer-license {
      margin-top: var(--gap-sm, 16px);
      font-size: var(--text-sm, 13px);
      color: var(--gray-400, #9ca3af);
    }

    .footer-links {
      display: flex;
      gap: var(--gap-lg, 40px);
    }

    .footer-links a {
      color: var(--gray-400, #9ca3af);
      font-size: var(--text-sm, 14px);
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: var(--white, #ffffff);
    }

    .footer-contact {
      display: flex;
      flex-direction: column;
      gap: var(--gap-xs, 12px);
    }

    .footer-contact a {
      color: var(--gray-400, #9ca3af);
      font-size: var(--text-sm, 14px);
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 8px);
      transition: color 0.2s;
    }

    .footer-contact a:hover {
      color: var(--white, #ffffff);
    }

    .footer-location {
      color: var(--gray-400, #9ca3af);
      font-size: var(--text-sm, 14px);
    }

    .footer-social {
      display: flex;
      gap: var(--gap-sm, 16px);
      margin-top: var(--gap-sm, 20px);
    }

    .footer-social a {
      width: var(--avatar-size, 40px);
      height: var(--avatar-size, 40px);
      background: var(--gray-700, #374151);
      border-radius: var(--radius-sm, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-lg, 18px);
      transition: background 0.2s;
    }

    .footer-social a:hover {
      background: var(--primary, #1e5a8a);
    }

    .footer-bottom {
      padding-top: var(--gap-md, 30px);
      border-top: var(--border-width, 1px) solid var(--gray-700, #374151);
      display: flex;
      justify-content: space-between;
      color: var(--gray-400, #9ca3af);
      font-size: var(--text-sm, 13px);
      flex-wrap: wrap;
      gap: var(--gap-sm, 16px);
    }

    .footer-bottom a {
      color: var(--accent, #14b8a6);
    }

    .footer-bottom a:hover {
      color: var(--white, #ffffff);
    }

    .footer-minimal {
      padding: calc(var(--section-spacing, 140px) * 0.5) 0;
      text-align: center;
    }

    .footer-minimal-links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: var(--gap-sm, 16px);
      margin-bottom: calc(var(--gap-md, 24px) * 0.8333);
    }

    .footer-minimal-bottom {
      justify-content: center;
      border: none;
      padding-top: 0;
      text-align: center;
    }

    .footer-compact {
      background: var(--gray-800, #1f2937);
      color: var(--gray-400, #9ca3af);
      padding: var(--gap-md, 24px) 0;
      text-align: center;
      font-size: var(--text-sm, 13px);
    }

    .footer-compact a {
      color: var(--accent, #14b8a6);
    }

    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
      }

      .footer-links {
        flex-wrap: wrap;
        gap: var(--gap-sm, 20px);
      }

      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
}

/**
 * Get social media icon
 */
function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    facebook: '📘',
    twitter: '🐦',
    instagram: '📷',
    linkedin: '💼',
    youtube: '🎬',
    tiktok: '🎵',
    yelp: '⭐',
    google: '🔍',
  };
  return icons[platform.toLowerCase()] || '🔗';
}

/**
 * Standard footer with branding
 */
export function generateFooter(config: FooterConfig): string {
  const {
    businessName,
    tagline,
    phone,
    email,
    address,
    city,
    state,
    license,
    socialLinks,
    navLinks,
    showBranding = true
  } = config;

  const location = [city, state].filter(Boolean).join(', ');
  const defaultNavLinks = [
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];
  const displayNavLinks = navLinks?.length ? navLinks : defaultNavLinks;

  return `
    <footer>
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>${escapeHtml(businessName)}</h3>
            <p>${tagline ? escapeHtml(tagline) : `Your trusted local experts. Contact us today for professional service.`}</p>
            ${license ? `<div class="footer-license">License #${escapeHtml(license)}</div>` : ''}
            ${socialLinks?.length ? `
              <div class="footer-social">
                ${socialLinks.map(link => `
                  <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" title="${escapeHtml(link.platform)}">
                    ${getSocialIcon(link.platform)}
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="footer-links">
            ${displayNavLinks.map(link => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}
          </div>

          <div class="footer-contact">
            ${phone ? `<a href="tel:${phone}">📞 ${phone}</a>` : ''}
            ${email ? `<a href="mailto:${email}">✉️ ${email}</a>` : ''}
            ${location ? `<span class="footer-location">📍 ${escapeHtml(location)}</span>` : ''}
          </div>
        </div>

        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. All rights reserved.</span>
          ${showBranding ? `<span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>` : ''}
        </div>
      </div>
    </footer>
  `;
}

/**
 * Minimal footer
 */
export function generateMinimalFooter(config: FooterConfig): string {
  const { businessName, phone, email, showBranding = true } = config;

  return `
    <footer class="footer-minimal">
      <div class="container">
        <div class="footer-minimal-links">
          ${phone ? `<a href="tel:${phone}">📞 ${phone}</a>` : ''}
          ${email ? `<a href="mailto:${email}">✉️ ${email}</a>` : ''}
        </div>
        <div class="footer-bottom footer-minimal-bottom">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}</span>
          ${showBranding ? `<span>Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>` : ''}
        </div>
      </div>
    </footer>
  `;
}

/**
 * Compact footer for single-page sites
 */
export function generateCompactFooter(businessName: string, showBranding: boolean = true): string {
  return `
    <footer class="footer-compact">
      <div class="container">
        <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. All rights reserved.</span>
        ${showBranding ? ` · <a href="https://showcasedesigns.com">Website by Showcase Designs</a>` : ''}
      </div>
    </footer>
  `;
}
