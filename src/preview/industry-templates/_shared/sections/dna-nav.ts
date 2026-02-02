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
 */
function generateNavN1Fixed(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref, phone } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .nav-n1 {
      background: var(--white);
      padding: 16px 0;
      border-bottom: 1px solid var(--gray-200);
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
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
    }

    .nav-n1-links {
      display: flex;
      gap: 32px;
    }

    .nav-n1-links a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n1-links a:hover {
      color: var(--primary);
    }

    .nav-n1-cta {
      background: var(--primary);
      color: var(--white);
      padding: 12px 24px;
      border-radius: ${design.borderRadius};
      text-decoration: none;
      font-weight: 600;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n1-cta:hover {
      background: var(--secondary);
      transform: translateY(-1px);
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
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="nav-n1-cta">${escapeHtml(ctaText)}</a>` : ''}
      </div>
    </header>
  `;

  return { html, css };
}

/**
 * N2: Transparent Header - See-through nav over hero
 */
function generateNavN2Transparent(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .nav-n2 {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px 0;
      z-index: 100;
    }

    .nav-n2-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n2-logo {
      font-size: 24px;
      font-weight: 800;
      color: var(--white);
      text-decoration: none;
    }

    .nav-n2-links {
      display: flex;
      gap: 32px;
    }

    .nav-n2-links a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n2-links a:hover {
      color: var(--white);
    }

    .nav-n2-cta {
      background: var(--white);
      color: var(--primary);
      padding: 12px 24px;
      border-radius: ${design.borderRadius};
      text-decoration: none;
      font-weight: 600;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n2-cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="nav-n2-cta">${escapeHtml(ctaText)}</a>` : ''}
      </div>
    </header>
  `;

  return { html, css };
}

/**
 * N4: Sidebar Nav - Vertical side navigation (special layout)
 */
function generateNavN4Sidebar(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref, phone } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .nav-n4 {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 280px;
      background: var(--white);
      border-right: 1px solid var(--gray-200);
      padding: 40px 30px;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .nav-n4-logo {
      font-size: 22px;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
      margin-bottom: 48px;
    }

    .nav-n4-links {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .nav-n4-links a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 16px;
      padding: 12px 16px;
      border-radius: ${design.borderRadius};
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n4-links a:hover {
      background: var(--gray-50);
      color: var(--primary);
    }

    .nav-n4-footer {
      margin-top: auto;
      padding-top: 24px;
      border-top: 1px solid var(--gray-200);
    }

    .nav-n4-cta {
      display: block;
      background: var(--primary);
      color: var(--white);
      padding: 14px 20px;
      border-radius: ${design.borderRadius};
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n4-cta:hover {
      background: var(--secondary);
    }

    .nav-n4-phone {
      display: block;
      margin-top: 16px;
      color: var(--muted);
      font-size: 14px;
      text-align: center;
    }

    /* Content needs left margin when sidebar is present */
    body.has-sidebar-nav {
      margin-left: 280px;
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
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="nav-n4-cta">${escapeHtml(ctaText)}</a>` : ''}
        ${phone ? `<a href="tel:${phone}" class="nav-n4-phone">${phone}</a>` : ''}
      </div>
    </aside>
  `;

  return { html, css };
}

/**
 * N7: Floating Nav - Rounded floating bar
 */
function generateNavN7Floating(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;

  const css = `
    .nav-n7-wrapper {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      width: 100%;
      max-width: 900px;
      padding: 0 20px;
    }

    .nav-n7 {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 9999px;
      padding: 12px 12px 12px 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n7-logo {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
    }

    .nav-n7-links {
      display: flex;
      gap: 24px;
    }

    .nav-n7-links a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n7-links a:hover {
      color: var(--primary);
    }

    .nav-n7-cta {
      background: var(--primary);
      color: var(--white);
      padding: 10px 20px;
      border-radius: 9999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n7-cta:hover {
      background: var(--secondary);
      transform: scale(1.02);
    }

    @media (max-width: 768px) {
      .nav-n7-links { display: none; }
      .nav-n7 { padding: 10px 10px 10px 20px; }
    }
  `;

  const html = `
    <div class="nav-n7-wrapper">
      <header class="nav-n7">
        <a href="#" class="nav-n7-logo">${escapeHtml(businessName)}</a>
        <nav class="nav-n7-links">
          ${links.map(link => `<a href="${link.href}">${escapeHtml(link.text)}</a>`).join('')}
        </nav>
        ${ctaText ? `<a href="${ctaHref || '#contact'}" class="nav-n7-cta">${escapeHtml(ctaText)}</a>` : ''}
      </header>
    </div>
  `;

  return { html, css };
}

/**
 * N9: Minimal Links - Sparse top-right links
 */
function generateNavN9Minimal(config: NavConfig): SectionOutput {
  const { businessName, dna, links = DEFAULT_LINKS, ctaText, ctaHref } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .nav-n9 {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 24px 0;
      z-index: 100;
    }

    .nav-n9-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-n9-logo {
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      text-decoration: none;
    }

    .nav-n9-right {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .nav-n9-links {
      display: flex;
      gap: 24px;
    }

    .nav-n9-links a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: color var(--transition-duration, 0.2s) ease;
    }

    .nav-n9-links a:hover {
      color: var(--text);
    }

    .nav-n9-cta {
      background: var(--text);
      color: var(--white);
      padding: 10px 20px;
      border-radius: ${design.borderRadius};
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .nav-n9-cta:hover {
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
          ${ctaText ? `<a href="${ctaHref || '#contact'}" class="nav-n9-cta">${escapeHtml(ctaText)}</a>` : ''}
        </div>
      </div>
    </header>
  `;

  return { html, css };
}
