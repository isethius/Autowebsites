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
 */
export function generateFooterCSS(): string {
  return `
    footer {
      background: var(--gray-800);
      color: var(--white);
      padding: 60px 0 30px;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      flex-wrap: wrap;
      gap: 40px;
    }

    .footer-brand {
      max-width: 350px;
    }

    .footer-brand h3 {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .footer-brand p {
      color: var(--gray-400);
      font-size: 14px;
      line-height: 1.6;
    }

    .footer-license {
      margin-top: 16px;
      font-size: 13px;
      color: var(--gray-400);
    }

    .footer-links {
      display: flex;
      gap: 40px;
    }

    .footer-links a {
      color: var(--gray-400);
      font-size: 14px;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: var(--white);
    }

    .footer-contact {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-contact a {
      color: var(--gray-400);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: color 0.2s;
    }

    .footer-contact a:hover {
      color: var(--white);
    }

    .footer-social {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }

    .footer-social a {
      width: 40px;
      height: 40px;
      background: var(--gray-700);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background 0.2s;
    }

    .footer-social a:hover {
      background: var(--primary);
    }

    .footer-bottom {
      padding-top: 30px;
      border-top: 1px solid var(--gray-700);
      display: flex;
      justify-content: space-between;
      color: var(--gray-400);
      font-size: 13px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-bottom a {
      color: var(--accent);
    }

    .footer-bottom a:hover {
      color: var(--white);
    }

    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
      }

      .footer-links {
        flex-wrap: wrap;
        gap: 20px;
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
            ${location ? `<span style="color: var(--gray-400); font-size: 14px;">📍 ${escapeHtml(location)}</span>` : ''}
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
    <footer style="padding: 40px 0;">
      <div class="container" style="text-align: center;">
        <div style="margin-bottom: 20px;">
          ${phone ? `<a href="tel:${phone}" style="margin: 0 16px;">📞 ${phone}</a>` : ''}
          ${email ? `<a href="mailto:${email}" style="margin: 0 16px;">✉️ ${email}</a>` : ''}
        </div>
        <div class="footer-bottom" style="justify-content: center; border: none; padding-top: 0;">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}</span>
          ${showBranding ? `<span style="margin-left: 24px;">Website by <a href="https://showcasedesigns.com">Showcase Designs</a></span>` : ''}
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
    <footer style="background: var(--gray-800); color: var(--gray-400); padding: 24px 0; text-align: center; font-size: 13px;">
      <div class="container">
        <span>&copy; ${new Date().getFullYear()} ${escapeHtml(businessName)}. All rights reserved.</span>
        ${showBranding ? ` · <a href="https://showcasedesigns.com" style="color: var(--accent);">Website by Showcase Designs</a>` : ''}
      </div>
    </footer>
  `;
}
