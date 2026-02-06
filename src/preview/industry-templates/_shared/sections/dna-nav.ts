/**
 * DNA-Aware Navigation Component
 *
 * Generates different navigation styles based on DNA codes (N1-N9).
 */

import { DNACode, DESIGN_VARIANTS } from '../../../../themes/variance-planner';
import { escapeHtml } from '../utils';
import { SectionOutput } from '../types';

export interface NavConfig {
  businessName: string;
  dna: DNACode;
  links?: Array<{ text: string; href: string }>;
  ctaText?: string;
  ctaHref?: string;
  phone?: string;
}

export { SectionOutput };

/**
 * Default navigation links
 */
const DEFAULT_LINKS = [
  { text: 'Services', href: '#services' },
  { text: 'About', href: '#about' },
  { text: 'Contact', href: '#contact' },
];

/**
 * Generate navigation based on DNA code
 */
export function generateDNANav(config: NavConfig): SectionOutput {
  const { dna } = config;
  const navCode = dna.nav || 'N1';

  switch (navCode) {
    case 'N1':
      return generateNavN1Fixed(config);
    case 'N2':
      return generateNavN2Transparent(config);
    case 'N4':
      return generateNavN4Sidebar(config);
    case 'N7':
      return generateNavN7Floating(config);
    case 'N9':
      return generateNavN9Minimal(config);
    default:
      return generateNavN1Fixed(config);
  }
}

/**
 * N1: Fixed Top Bar - Standard sticky navigation
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateNavN1Fixed(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref, phone } = config;

  const css = `
    .nav-n1 {
      background: var(--white, #ffffff);
      padding: var(--nav-padding, 24px 0);
      border-bottom: var(--border-width, 1px) solid var(--border-color, var(--gray-200, #e5e7eb));
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-n1-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n1-logo {
      font-size: var(--text-h4, 24px);
      font-weight: 800;
      color: var(--primary, #1e5a8a);
      text-decoration: none;
    }

    .nav-n1-links {
      display: flex;
      gap: var(--gap-lg, 32px);
    }

    .nav-n1-links a {
      color: var(--text, #111827);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--text-sm, 15px);
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n1-links a:hover {
      color: var(--primary, #1e5a8a);
    }

    /* Nav CTA uses global .btn styles */
    .nav-n1 .btn {
      text-decoration: none;
    }

    @media (max-width: 900px) {
      .nav-n1-links { display: none; }
    }
  `;

  const html = `
    <header class="nav-n1">
      <div class="container nav-n1-content">
        <a href="#" class="nav-n1-logo">${escapeHtml(businessName)}</a>
        <nav class="nav-n1-links">
          ${links.map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
        </nav>
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="btn btn-primary">${escapeHtml(ctaText)}</a>` : ''}
      </div>
    </header>
  `;

  return { html, css };
}

/**
 * N2: Transparent Header - See-through nav over hero
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateNavN2Transparent(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;

  const css = `
    .nav-n2 {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: var(--nav-padding, 24px 0);
      z-index: 100;
    }

    .nav-n2-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n2-logo {
      font-size: var(--text-h4, 24px);
      font-weight: 800;
      color: var(--white, #ffffff);
      text-decoration: none;
    }

    .nav-n2-links {
      display: flex;
      gap: var(--gap-lg, 32px);
    }

    .nav-n2-links a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--text-sm, 15px);
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n2-links a:hover {
      color: var(--white, #ffffff);
    }

    /* Nav CTA uses global .btn styles with white variant */
    .nav-n2 .btn {
      background: var(--white, #ffffff);
      color: var(--primary, #1e5a8a);
      text-decoration: none;
    }

    .nav-n2 .btn:hover {
      transform: var(--hover-transform, translateY(-2px));
      box-shadow: var(--shadow-card, 0 4px 12px rgba(0,0,0,0.15));
    }

    @media (max-width: 900px) {
      .nav-n2-links { display: none; }
    }
  `;

  const html = `
    <header class="nav-n2">
      <div class="container nav-n2-content">
        <a href="#" class="nav-n2-logo">${escapeHtml(businessName)}</a>
        <nav class="nav-n2-links">
          ${links.map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
        </nav>
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="btn btn-primary">${escapeHtml(ctaText)}</a>` : ''}
      </div>
    </header>
  `;

  return { html, css };
}

/**
 * N4: Sidebar Nav - Vertical side navigation (special layout)
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateNavN4Sidebar(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref, phone } = config;

  const css = `
    .nav-n4 {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: calc(var(--section-spacing, 80px) * 3.5);
      background: var(--white, #ffffff);
      border-right: var(--border-width, 1px) solid var(--border-color, var(--gray-200, #e5e7eb));
      padding: var(--card-padding, 40px) var(--gap-md, 30px);
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .nav-n4-logo {
      font-size: var(--text-h4, 22px);
      font-weight: 800;
      color: var(--primary, #1e5a8a);
      text-decoration: none;
      margin-bottom: var(--gap-xl, 48px);
    }

    .nav-n4-links {
      display: flex;
      flex-direction: column;
      gap: var(--gap-xs, 8px);
      flex: 1;
    }

    .nav-n4-links a {
      color: var(--text, #111827);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--text-body, 16px);
      padding: var(--gap-xs, 12px) var(--gap-sm, 16px);
      border-radius: var(--radius, 8px);
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n4-links a:hover {
      background: var(--gray-50, #f9fafb);
      color: var(--primary, #1e5a8a);
    }

    .nav-n4-footer {
      margin-top: auto;
      padding-top: var(--gap-md, 24px);
      border-top: var(--border-width, 1px) solid var(--border-color, var(--gray-200, #e5e7eb));
    }

    /* Nav CTA uses global .btn styles */
    .nav-n4-footer .btn {
      display: block;
      width: 100%;
      text-align: center;
      text-decoration: none;
    }

    .nav-n4-phone {
      display: block;
      margin-top: var(--gap-sm, 16px);
      color: var(--muted, #6b7280);
      font-size: var(--text-sm, 14px);
      text-align: center;
    }

    /* Content needs left margin when sidebar is present */
    body.has-sidebar-nav {
      margin-left: calc(var(--section-spacing, 80px) * 3.5);
    }

    @media (max-width: 1024px) {
      .nav-n4 {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      .nav-n4.open { transform: translateX(0); }
      body.has-sidebar-nav { margin-left: 0; }
    }
  `;

  const html = `
    <aside class="nav-n4">
      <a href="#" class="nav-n4-logo">${escapeHtml(businessName)}</a>
      <nav class="nav-n4-links">
        ${links.map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
      </nav>
      <div class="nav-n4-footer">
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="btn btn-primary">${escapeHtml(ctaText)}</a>` : ''}
        ${phone ? `<a href="tel:${phone}" class="nav-n4-phone">${phone}</a>` : ''}
      </div>
    </aside>
  `;

  return { html, css };
}

/**
 * N7: Floating Nav - Rounded floating bar
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateNavN7Floating(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;

  const css = `
    .nav-n7-wrapper {
      position: fixed;
      top: var(--gap-sm, 20px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      width: 100%;
      max-width: calc(var(--section-spacing, 80px) * 11.25);
      padding: 0 var(--gap-sm, 20px);
    }

    .nav-n7 {
      background: var(--bg-surface, rgba(255,255,255,0.95));
      backdrop-filter: var(--backdrop, blur(10px));
      border-radius: var(--radius-pill, 9999px);
      padding: var(--gap-xs, 12px) var(--gap-xs, 12px) var(--gap-xs, 12px) var(--gap-md, 24px);
      box-shadow: var(--shadow-card, 0 4px 24px rgba(0,0,0,0.1));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n7-logo {
      font-size: var(--text-lg, 20px);
      font-weight: 800;
      color: var(--primary, #1e5a8a);
      text-decoration: none;
    }

    .nav-n7-links {
      display: flex;
      gap: var(--gap-md, 24px);
    }

    .nav-n7-links a {
      color: var(--text, #111827);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--text-sm, 14px);
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n7-links a:hover {
      color: var(--primary, #1e5a8a);
    }

    /* Nav CTA uses global .btn with pill variant */
    .nav-n7 .btn {
      border-radius: var(--radius-pill, 9999px);
      text-decoration: none;
    }

    @media (max-width: 768px) {
      .nav-n7-links { display: none; }
      .nav-n7 { padding: var(--gap-xs, 10px) var(--gap-xs, 10px) var(--gap-xs, 10px) var(--gap-sm, 20px); }
    }
  `;

  const html = `
    <div class="nav-n7-wrapper">
      <header class="nav-n7">
        <a href="#" class="nav-n7-logo">${escapeHtml(businessName)}</a>
        <nav class="nav-n7-links">
          ${links.map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
        </nav>
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="btn btn-primary">${escapeHtml(ctaText)}</a>` : ''}
      </header>
    </div>
  `;

  return { html, css };
}

/**
 * N9: Minimal Links - Sparse top-right links
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateNavN9Minimal(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;

  const css = `
    .nav-n9 {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: var(--gap-md, 24px) 0;
      z-index: 100;
    }

    .nav-n9-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n9-logo {
      font-size: var(--text-h4, 22px);
      font-weight: 800;
      color: var(--text, #111827);
      text-decoration: none;
    }

    .nav-n9-right {
      display: flex;
      align-items: center;
      gap: var(--gap-lg, 32px);
    }

    .nav-n9-links {
      display: flex;
      gap: var(--gap-md, 24px);
    }

    .nav-n9-links a {
      color: var(--muted, #6b7280);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--text-sm, 14px);
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n9-links a:hover {
      color: var(--text, #111827);
    }

    /* Nav CTA uses global .btn with dark variant */
    .nav-n9 .btn {
      background: var(--text, #111827);
      color: var(--white, #ffffff);
      text-decoration: none;
    }

    .nav-n9 .btn:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .nav-n9-links { display: none; }
    }
  `;

  const html = `
    <header class="nav-n9">
      <div class="container nav-n9-content">
        <a href="#" class="nav-n9-logo">${escapeHtml(businessName)}</a>
        <div class="nav-n9-right">
          <nav class="nav-n9-links">
            ${links.slice(0, 3).map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
          </nav>
          ${ctaText ? `<a href="${ctaHref || '#contact'}" class="btn btn-primary">${escapeHtml(ctaText)}</a>` : ''}
        </div>
      </div>
    </header>
  `;

  return { html, css };
}
