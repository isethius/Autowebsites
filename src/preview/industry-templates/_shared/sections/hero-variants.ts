/**
 * Hero Section Variants
 *
 * DNA-aware hero section builders that render differently based on DNA codes.
 * Hero codes (H1-H12) determine the layout and visual style.
 */

import { ColorPalette } from '../../../../overnight/types';
import { DNACode, DESIGN_VARIANTS } from '../../../../themes/variance-planner';
import { escapeHtml } from '../utils';
import { SectionOutput } from '../types';

export interface HeroConfig {
  headline: string;
  tagline: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  phone?: string;
  trustBadges?: string[];
  backgroundStyle?: 'gradient' | 'solid' | 'image';
  palette: ColorPalette;
}

export interface DNAHeroConfig extends HeroConfig {
  dna: DNACode;
  businessName?: string;
}

export { SectionOutput };

/**
 * Generate hero CSS
 *
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks.
 * Button classes (.hero-cta-primary/secondary) removed - use global .btn classes instead.
 */
export function generateHeroCSS(): string {
  return `
    .hero {
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
      color: var(--white, #ffffff);
      padding: var(--section-spacing, 80px) 0;
      position: relative;
      overflow: hidden;
    }

    .hero-solid {
      background: var(--primary, #1e5a8a);
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: var(--gap-xl, 60px);
      align-items: center;
    }

    .hero-split .hero-content {
      grid-template-columns: 1fr 1.2fr;
    }

    .hero-text h1 {
      font-size: var(--text-h1, 48px);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: var(--gap-sm, 20px);
    }

    .hero-text p {
      font-size: var(--text-lg, 20px);
      opacity: 0.9;
      margin-bottom: var(--gap-md, 32px);
      line-height: 1.6;
    }

    .hero-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      flex-wrap: wrap;
    }

    /* Hero-specific button overrides for white-on-gradient look */
    .hero .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--primary, #1e5a8a);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
    }

    .hero .btn-primary:hover {
      transform: var(--hover-transform, translateY(-2px));
      box-shadow: var(--hover-shadow, 0 8px 20px rgba(0, 0, 0, 0.2));
    }

    .hero .btn-secondary {
      background: transparent;
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }

    .hero .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .trust-badges {
      display: flex;
      gap: var(--gap-md, 32px);
      margin-top: var(--gap-lg, 40px);
      flex-wrap: wrap;
    }

    .trust-badge {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 8px);
      font-size: var(--text-sm, 14px);
      font-weight: 500;
    }

    .trust-icon {
      width: calc(var(--icon-size, 56px) * 0.5714);
      height: calc(var(--icon-size, 56px) * 0.5714);
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-pill, 50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image {
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--radius, 12px);
      height: calc(var(--section-spacing, 80px) * 5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-h1, 48px);
    }

    .hero-centered .container {
      text-align: center;
      max-width: calc(var(--section-spacing, 80px) * 10);
    }

    .hero-centered .hero-text {
      max-width: 100%;
    }

    .hero-centered .hero-text p {
      max-width: calc(var(--section-spacing, 80px) * 7.5);
      margin: 0 auto var(--gap-md, 32px);
    }

    .hero-centered .hero-buttons {
      justify-content: center;
    }

    .hero-centered .trust-badges {
      justify-content: center;
    }

    .hero-minimal {
      padding: calc(var(--section-spacing, 80px) * 0.75) 0;
      background: var(--gray-50, #f9fafb);
      text-align: center;
    }

    .hero-minimal h1 {
      color: var(--text, #111827);
      font-size: var(--text-h1, 44px);
      margin-bottom: var(--gap-sm, 16px);
    }

    .hero-minimal p {
      color: var(--muted, #6b7280);
      font-size: var(--text-lg, 20px);
      max-width: calc(var(--section-spacing, 80px) * 7.5);
      margin: 0 auto calc(var(--gap-md, 24px) * 1.1667);
    }

    .hero-minimal .hero-buttons {
      justify-content: center;
    }

    @media (max-width: 900px) {
      .hero-content {
        grid-template-columns: 1fr;
      }

      .hero-text h1 {
        font-size: var(--text-h2, 32px);
      }

      .hero-text p {
        font-size: var(--text-body, 18px);
      }

      .hero-image {
        display: none;
      }

      .trust-badges {
        justify-content: center;
      }
    }
  `;
}

/**
 * Standard gradient hero
 * Uses global .btn classes for styling consistency
 */
export function generateHeroGradient(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA, phone, trustBadges } = config;

  return `
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-text">
          <h1>${escapeHtml(headline)}</h1>
          <p>${escapeHtml(tagline)}</p>
          <div class="hero-buttons">
            ${phone ? `<a href="tel:${phone}" class="btn btn-primary">📞 Call Now: ${phone}</a>` : ''}
            ${primaryCTA && !phone ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `
              <div class="trust-badge">
                <div class="trust-icon">✓</div>
                <span>${escapeHtml(badge)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        <div class="hero-image">
          📸
        </div>
      </div>
    </section>
  `;
}

/**
 * Split-screen hero (image left, text right)
 * Uses global .btn classes for styling consistency
 */
export function generateHeroSplit(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges } = config;

  return `
    <section class="hero hero-split">
      <div class="container hero-content">
        <div class="hero-image">
          📸
        </div>
        <div class="hero-text">
          <h1>${escapeHtml(headline)}</h1>
          <p>${escapeHtml(tagline)}</p>
          <div class="hero-buttons">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `
              <div class="trust-badge">
                <div class="trust-icon">✓</div>
                <span>${escapeHtml(badge)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

/**
 * Centered text hero (no image)
 * Uses global .btn classes for styling consistency
 */
export function generateHeroCentered(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges } = config;

  return `
    <section class="hero hero-centered">
      <div class="container">
        <div class="hero-text">
          <h1>${escapeHtml(headline)}</h1>
          <p>${escapeHtml(tagline)}</p>
          <div class="hero-buttons">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `
              <div class="trust-badge">
                <div class="trust-icon">✓</div>
                <span>${escapeHtml(badge)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}

/**
 * Minimal hero for professional services
 */
export function generateHeroMinimal(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA } = config;

  return `
    <section class="hero hero-minimal">
      <div class="container">
        <h1>${escapeHtml(headline)}</h1>
        <p>${escapeHtml(tagline)}</p>
        <div class="hero-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;
}

// =============================================================================
// DNA-AWARE HERO GENERATOR
// =============================================================================

/**
 * Generate hero section based on DNA code
 * Routes to different implementations based on H1-H12
 */
export function generateDNAHero(config: DNAHeroConfig): SectionOutput {
  const { dna } = config;
  const heroCode = dna.hero || 'H1';

  switch (heroCode) {
    case 'H1':
      return generateHeroH1FullWidth(config);
    case 'H2':
      return generateHeroH2Split(config);
    case 'H3':
      return generateHeroH3Minimal(config);
    case 'H4':
      return generateHeroH4Video(config);
    case 'H5':
      return generateHeroH5GradientOverlay(config);
    case 'H6':
      return generateHeroH6Animated(config);
    case 'H7':
      return generateHeroH7Carousel(config);
    case 'H8':
      return generateHeroH8Asymmetric(config);
    case 'H9':
      return generateHeroH9TextOnly(config);
    case 'H12':
      return generateHeroH12Geometric(config);
    default:
      return generateHeroH1FullWidth(config);
  }
}

/**
 * H1: Full-Width Impact - Full-screen centered, gradient overlay
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH1FullWidth(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, phone, trustBadges, dna } = config;

  const css = `
    .hero-h1 {
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
      color: var(--white, #ffffff);
      padding: var(--section-spacing, 100px) 0;
      min-height: 70vh;
      display: flex;
      align-items: center;
    }

    .hero-h1-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: var(--gap-xl, 60px);
      align-items: center;
    }

    .hero-h1 h1 {
      font-size: var(--text-h1, 56px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
    }

    .hero-h1 .tagline {
      font-size: var(--text-lg, 22px);
      opacity: 0.9;
      margin-bottom: var(--gap-lg, 36px);
      line-height: 1.6;
    }

    .hero-h1-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      flex-wrap: wrap;
    }

    /* Hero-specific button overrides for white-on-gradient look */
    .hero-h1 .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--primary, #1e5a8a);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
    }

    .hero-h1 .btn-primary:hover {
      transform: var(--hover-transform, translateY(-3px));
      box-shadow: var(--hover-shadow, 0 12px 30px rgba(0,0,0,0.2));
    }

    .hero-h1 .btn-secondary {
      background: transparent;
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }

    .hero-h1 .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    .hero-h1 .trust-badges {
      display: flex;
      gap: var(--gap-md, 32px);
      margin-top: var(--gap-lg, 48px);
      flex-wrap: wrap;
    }

    .hero-h1 .trust-badge {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 10px);
      font-size: var(--text-sm, 15px);
      font-weight: 500;
    }

    .hero-h1 .trust-icon {
      width: calc(var(--icon-size, 56px) * 0.6429);
      height: calc(var(--icon-size, 56px) * 0.6429);
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-pill, 50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-h1-image {
      background: rgba(255,255,255,0.1);
      border-radius: var(--radius, 12px);
      height: calc(var(--section-spacing, 80px) * 5.625);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: calc(var(--text-h1, 48px) * 1.3333);
    }

    @media (max-width: 900px) {
      .hero-h1-content { grid-template-columns: 1fr; }
      .hero-h1 h1 { font-size: var(--text-h2, 40px); }
      .hero-h1-image { display: none; }
      .hero-h1 .trust-badges { justify-content: center; }
    }
  `;

  const html = `
    <section class="hero-h1 dna-animate">
      <div class="container hero-h1-content">
        <div class="hero-text">
          <h1>${escapeHtml(headline)}</h1>
          <p class="tagline">${escapeHtml(tagline)}</p>
          <div class="hero-h1-buttons">
            ${phone ? `<a href="tel:${phone}" class="btn btn-primary">Call Now: ${phone}</a>` : ''}
            ${primaryCTA && !phone ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `
              <div class="trust-badge">
                <div class="trust-icon">✓</div>
                <span>${escapeHtml(badge)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        <div class="hero-h1-image">
          📸
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H2: Split Screen - Two-column with image on one side
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH2Split(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;

  const css = `
    .hero-h2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 80vh;
    }

    .hero-h2-image {
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: calc(var(--text-h1, 48px) * 1.6667);
      color: var(--white, #ffffff);
    }

    .hero-h2-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: var(--gap-xl, 60px) var(--section-spacing, 80px);
      background: var(--background, #ffffff);
    }

    .hero-h2 h1 {
      font-size: var(--text-h1, 48px);
      line-height: 1.15;
      margin-bottom: var(--gap-md, 24px);
      color: var(--text, #111827);
    }

    .hero-h2 .tagline {
      font-size: var(--text-lg, 20px);
      color: var(--muted, #6b7280);
      margin-bottom: var(--gap-lg, 36px);
      line-height: 1.6;
    }

    .hero-h2-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      flex-wrap: wrap;
    }

    .hero-h2 .trust-badges {
      display: flex;
      gap: var(--gap-md, 24px);
      margin-top: var(--gap-lg, 40px);
      flex-wrap: wrap;
    }

    .hero-h2 .trust-badge {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--muted, #6b7280);
    }

    @media (max-width: 900px) {
      .hero-h2 { grid-template-columns: 1fr; }
      .hero-h2-image { min-height: calc(var(--section-spacing, 80px) * 3.75); order: -1; }
      .hero-h2-content { padding: var(--gap-lg, 40px) var(--gap-sm, 20px); }
      .hero-h2 h1 { font-size: var(--text-h2, 36px); }
    }
  `;

  const html = `
    <section class="hero-h2 dna-animate">
      <div class="hero-h2-image">
        📸
      </div>
      <div class="hero-h2-content">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h2-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
        ${trustBadges?.length ? `
        <div class="trust-badges">
          ${trustBadges.map(badge => `
            <div class="trust-badge">
              <span>✓</span>
              <span>${escapeHtml(badge)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H3: Minimal Header - Compact hero with subtle background
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH3Minimal(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, dna } = config;

  const css = `
    .hero-h3 {
      background: var(--gray-50, #f9fafb);
      padding: var(--section-spacing, 80px) 0;
      text-align: center;
    }

    .hero-h3 h1 {
      font-size: var(--text-h1, 44px);
      line-height: 1.2;
      margin-bottom: var(--gap-sm, 20px);
      color: var(--text, #111827);
      max-width: calc(var(--section-spacing, 80px) * 10);
      margin-left: auto;
      margin-right: auto;
    }

    .hero-h3 .tagline {
      font-size: var(--text-lg, 20px);
      color: var(--muted, #6b7280);
      margin-bottom: var(--gap-md, 32px);
      max-width: calc(var(--section-spacing, 80px) * 7.5);
      margin-left: auto;
      margin-right: auto;
    }

    .hero-h3-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      justify-content: center;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .hero-h3 h1 { font-size: var(--text-h2, 32px); }
      .hero-h3 .tagline { font-size: var(--text-body, 18px); }
    }
  `;

  const html = `
    <section class="hero-h3 dna-animate">
      <div class="container">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h3-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H8: Asymmetric Split - Uneven split with overlapping elements
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH8Asymmetric(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;

  const css = `
    .hero-h8 {
      position: relative;
      min-height: 85vh;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    .hero-h8-bg {
      position: absolute;
      right: 0;
      top: 0;
      width: 55%;
      height: 100%;
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
      clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
    }

    .hero-h8-content {
      position: relative;
      z-index: 2;
      width: 100%;
      display: grid;
      grid-template-columns: 55% 45%;
      align-items: center;
    }

    .hero-h8-text {
      padding-right: var(--gap-xl, 60px);
    }

    .hero-h8 h1 {
      font-size: var(--text-h1, 52px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
      color: var(--text, #111827);
    }

    .hero-h8 .tagline {
      font-size: var(--text-lg, 20px);
      color: var(--muted, #6b7280);
      margin-bottom: var(--gap-lg, 36px);
      line-height: 1.6;
    }

    .hero-h8-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      flex-wrap: wrap;
    }

    .hero-h8 .trust-badges {
      display: flex;
      gap: var(--gap-md, 24px);
      margin-top: var(--gap-lg, 40px);
      flex-wrap: wrap;
    }

    .hero-h8 .trust-badge {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--muted, #6b7280);
    }

    .hero-h8-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white, #ffffff);
      font-size: calc(var(--text-h1, 48px) * 1.6667);
    }

    @media (max-width: 900px) {
      .hero-h8-bg { width: 100%; clip-path: none; opacity: 0.1; }
      .hero-h8-content { grid-template-columns: 1fr; }
      .hero-h8-text { padding: 0; text-align: center; }
      .hero-h8-visual { display: none; }
      .hero-h8 h1 { font-size: var(--text-h2, 36px); }
      .hero-h8-buttons { justify-content: center; }
      .hero-h8 .trust-badges { justify-content: center; }
    }
  `;

  const html = `
    <section class="hero-h8 dna-animate">
      <div class="hero-h8-bg"></div>
      <div class="container hero-h8-content">
        <div class="hero-h8-text">
          <h1>${escapeHtml(headline)}</h1>
          <p class="tagline">${escapeHtml(tagline)}</p>
          <div class="hero-h8-buttons">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `
              <div class="trust-badge">
                <span>✓</span>
                <span>${escapeHtml(badge)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        <div class="hero-h8-visual">
          📸
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H9: Text Only - Bold typography, no images
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH9TextOnly(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, dna } = config;

  const css = `
    .hero-h9 {
      background: var(--text, #111827);
      color: var(--white, #ffffff);
      padding: calc(var(--section-spacing, 80px) * 1.5) 0;
      text-align: center;
    }

    .hero-h9 h1 {
      font-size: var(--text-h1, 72px);
      line-height: 1.05;
      margin-bottom: var(--gap-md, 32px);
      max-width: calc(var(--section-spacing, 80px) * 11.25);
      margin-left: auto;
      margin-right: auto;
      letter-spacing: -0.03em;
    }

    .hero-h9 .tagline {
      font-size: var(--text-lg, 24px);
      opacity: 0.8;
      margin-bottom: var(--gap-lg, 48px);
      max-width: calc(var(--section-spacing, 80px) * 7.5);
      margin-left: auto;
      margin-right: auto;
      line-height: 1.5;
    }

    .hero-h9-buttons {
      display: flex;
      gap: var(--gap-sm, 20px);
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Hero-specific button overrides for white-on-dark look */
    .hero-h9 .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--text, #111827);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
    }

    .hero-h9 .btn-primary:hover {
      transform: var(--hover-transform, translateY(-3px));
      box-shadow: var(--hover-shadow, 0 10px 30px rgba(0,0,0,0.3));
    }

    .hero-h9 .btn-secondary {
      background: transparent;
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }

    .hero-h9 .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    @media (max-width: 900px) {
      .hero-h9 { padding: var(--section-spacing, 80px) 0; }
      .hero-h9 h1 { font-size: var(--text-h2, 44px); }
      .hero-h9 .tagline { font-size: var(--text-lg, 20px); }
    }

    @media (max-width: 480px) {
      .hero-h9 h1 { font-size: var(--text-h2, 36px); }
    }
  `;

  const html = `
    <section class="hero-h9 dna-animate">
      <div class="container">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h9-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H12: Geometric Shapes - Abstract geometric patterns with clip-paths
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks, global .btn classes
 */
function generateHeroH12Geometric(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;

  const css = `
    .hero-h12 {
      position: relative;
      min-height: 80vh;
      display: flex;
      align-items: center;
      background: var(--background, #ffffff);
      overflow: hidden;
    }

    .hero-h12-shapes {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .hero-h12-shape {
      position: absolute;
      background: var(--primary, #1e5a8a);
      opacity: 0.1;
    }

    .hero-h12-shape-1 {
      width: calc(var(--section-spacing, 80px) * 5);
      height: calc(var(--section-spacing, 80px) * 5);
      top: calc(var(--section-spacing, 80px) * -1.25);
      right: calc(var(--section-spacing, 80px) * -1.25);
      border-radius: var(--radius-pill, 50%);
    }

    .hero-h12-shape-2 {
      width: calc(var(--section-spacing, 80px) * 3.75);
      height: calc(var(--section-spacing, 80px) * 3.75);
      bottom: calc(var(--section-spacing, 80px) * -0.625);
      left: 10%;
      clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
      background: var(--secondary, #1e40af);
    }

    .hero-h12-shape-3 {
      width: calc(var(--section-spacing, 80px) * 2.5);
      height: calc(var(--section-spacing, 80px) * 2.5);
      top: 30%;
      right: 20%;
      clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
      background: var(--accent, #14b8a6);
    }

    .hero-h12-content {
      position: relative;
      z-index: 2;
      max-width: calc(var(--section-spacing, 80px) * 8.75);
    }

    .hero-h12 h1 {
      font-size: var(--text-h1, 56px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
      color: var(--text, #111827);
    }

    .hero-h12 .tagline {
      font-size: var(--text-lg, 20px);
      color: var(--muted, #6b7280);
      margin-bottom: var(--gap-lg, 40px);
      line-height: 1.6;
    }

    .hero-h12-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      flex-wrap: wrap;
    }

    .hero-h12 .trust-badges {
      display: flex;
      gap: var(--gap-md, 24px);
      margin-top: var(--gap-lg, 48px);
      flex-wrap: wrap;
    }

    .hero-h12 .trust-badge {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--muted, #6b7280);
    }

    @media (max-width: 900px) {
      .hero-h12 h1 { font-size: var(--text-h2, 40px); }
      .hero-h12-shape-1 { width: calc(var(--section-spacing, 80px) * 3.125); height: calc(var(--section-spacing, 80px) * 3.125); }
      .hero-h12-shape-2 { width: calc(var(--section-spacing, 80px) * 2.5); height: calc(var(--section-spacing, 80px) * 2.5); }
      .hero-h12-shape-3 { display: none; }
    }
  `;

  const html = `
    <section class="hero-h12 dna-animate">
      <div class="hero-h12-shapes">
        <div class="hero-h12-shape hero-h12-shape-1"></div>
        <div class="hero-h12-shape hero-h12-shape-2"></div>
        <div class="hero-h12-shape hero-h12-shape-3"></div>
      </div>
      <div class="container hero-h12-content">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h12-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
        ${trustBadges?.length ? `
        <div class="trust-badges">
          ${trustBadges.map(badge => `
            <div class="trust-badge">
              <span>✓</span>
              <span>${escapeHtml(badge)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H4: Video Background Hero
 * Simulated video background with animated gradient shimmer
 */
function generateHeroH4Video(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA } = config;

  const css = `
    .hero-h4 {
      position: relative;
      min-height: 85vh;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    .hero-h4-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
    }
    .hero-h4-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
    }
    .hero-h4-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      animation: hero-h4-shimmer 3s ease-in-out infinite;
    }
    @keyframes hero-h4-shimmer {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }
    .hero-h4-content {
      position: relative;
      z-index: 2;
      color: var(--white, #ffffff);
      text-align: center;
      max-width: calc(var(--section-spacing, 80px) * 11.25);
      margin: 0 auto;
    }
    .hero-h4 h1 {
      font-size: var(--text-h1, 60px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
      text-shadow: 0 calc(var(--gap-xs, 8px) / 4) calc(var(--gap-lg, 40px) / 2) rgba(0,0,0,0.3);
    }
    .hero-h4 .tagline {
      font-size: var(--text-lg, 22px);
      opacity: 0.9;
      margin-bottom: var(--gap-lg, 40px);
    }
    .hero-h4-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      justify-content: center;
    }
    .hero-h4 .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--primary, #1e5a8a);
    }
    .hero-h4 .btn-secondary {
      background: transparent;
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }
    @media (max-width: 768px) {
      .hero-h4 h1 { font-size: var(--text-h2, 40px); }
    }
  `;

  const html = `
    <section class="hero-h4 dna-animate">
      <div class="hero-h4-bg"></div>
      <div class="container hero-h4-content">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h4-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H5: Gradient Overlay Hero
 * Two-column with gradient mask overlay and frosted visual panel
 */
function generateHeroH5GradientOverlay(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges } = config;

  const css = `
    .hero-h5 {
      position: relative;
      min-height: 80vh;
      display: flex;
      align-items: center;
    }
    .hero-h5-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        var(--primary, #1e5a8a) 0%,
        transparent 50%,
        var(--secondary, #1e40af) 100%
      );
    }
    .hero-h5-content {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--gap-xl, 60px);
      align-items: center;
    }
    .hero-h5-text {
      color: var(--white, #ffffff);
    }
    .hero-h5 h1 {
      font-size: var(--text-h1, 52px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
    }
    .hero-h5 .tagline {
      font-size: var(--text-lg, 20px);
      opacity: 0.9;
      margin-bottom: var(--gap-lg, 36px);
    }
    .hero-h5-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
    }
    .hero-h5 .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--primary, #1e5a8a);
    }
    .hero-h5 .btn-secondary {
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }
    .hero-h5-visual {
      aspect-ratio: 4/3;
      background: rgba(255,255,255,0.1);
      border-radius: var(--radius, 16px);
      backdrop-filter: blur(calc(var(--gap-xs, 8px) * 1.25));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: calc(var(--text-h1, 48px) * 1.3333);
    }
    .hero-h5 .trust-badges {
      display: flex;
      gap: var(--gap-md, 24px);
      margin-top: var(--gap-lg, 40px);
      color: var(--white, #ffffff);
    }
    @media (max-width: 900px) {
      .hero-h5-content { grid-template-columns: 1fr; }
      .hero-h5-visual { display: none; }
      .hero-h5 h1 { font-size: var(--text-h2, 40px); }
    }
  `;

  const html = `
    <section class="hero-h5 dna-animate">
      <div class="hero-h5-bg"></div>
      <div class="container hero-h5-content">
        <div class="hero-h5-text">
          <h1>${escapeHtml(headline)}</h1>
          <p class="tagline">${escapeHtml(tagline)}</p>
          <div class="hero-h5-buttons">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges">
            ${trustBadges.map(badge => `<span>✓ ${escapeHtml(badge)}</span>`).join('')}
          </div>
          ` : ''}
        </div>
        <div class="hero-h5-visual">📸</div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H6: Animated/Particles Background Hero
 * Dark background with floating particle circles
 */
function generateHeroH6Animated(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA } = config;

  const css = `
    .hero-h6 {
      position: relative;
      min-height: 85vh;
      display: flex;
      align-items: center;
      background: var(--text, #111827);
      overflow: hidden;
    }
    .hero-h6-particles {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .hero-h6-particle {
      position: absolute;
      background: var(--primary, #1e5a8a);
      border-radius: 50%;
      opacity: 0.3;
      animation: hero-h6-float 8s ease-in-out infinite;
    }
    .hero-h6-particle:nth-child(1) { width: calc(var(--icon-size, 56px) * 1.4286); height: calc(var(--icon-size, 56px) * 1.4286); top: 20%; left: 10%; animation-delay: 0s; }
    .hero-h6-particle:nth-child(2) { width: calc(var(--icon-size, 56px) * 2.1429); height: calc(var(--icon-size, 56px) * 2.1429); top: 60%; right: 15%; animation-delay: 2s; }
    .hero-h6-particle:nth-child(3) { width: calc(var(--icon-size, 56px) * 1.0714); height: calc(var(--icon-size, 56px) * 1.0714); bottom: 20%; left: 30%; animation-delay: 4s; }
    .hero-h6-particle:nth-child(4) { width: calc(var(--icon-size, 56px) * 1.7857); height: calc(var(--icon-size, 56px) * 1.7857); top: 10%; right: 30%; animation-delay: 1s; background: var(--secondary, #1e40af); }
    .hero-h6-particle:nth-child(5) { width: calc(var(--icon-size, 56px) * 0.7143); height: calc(var(--icon-size, 56px) * 0.7143); bottom: 30%; right: 40%; animation-delay: 3s; background: var(--accent, #14b8a6); }
    @keyframes hero-h6-float {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
      50% { transform: translateY(calc(var(--gap-lg, 40px) * -0.75)) scale(1.1); opacity: 0.5; }
    }
    .hero-h6-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: calc(var(--section-spacing, 80px) * 10);
      margin: 0 auto;
      color: var(--white, #ffffff);
    }
    .hero-h6 h1 {
      font-size: var(--text-h1, 64px);
      line-height: 1.05;
      margin-bottom: var(--gap-md, 28px);
    }
    .hero-h6 .tagline {
      font-size: var(--text-lg, 22px);
      opacity: 0.8;
      margin-bottom: var(--gap-lg, 44px);
    }
    .hero-h6-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      justify-content: center;
    }
    .hero-h6 .btn-primary {
      background: var(--primary, #1e5a8a);
      color: var(--white, #ffffff);
    }
    .hero-h6 .btn-secondary {
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }
    @media (max-width: 768px) {
      .hero-h6 h1 { font-size: var(--text-h2, 40px); }
    }
  `;

  const html = `
    <section class="hero-h6 dna-animate">
      <div class="hero-h6-particles">
        <div class="hero-h6-particle"></div>
        <div class="hero-h6-particle"></div>
        <div class="hero-h6-particle"></div>
        <div class="hero-h6-particle"></div>
        <div class="hero-h6-particle"></div>
      </div>
      <div class="container hero-h6-content">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h6-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H7: Carousel/Slider Hero
 * Centered content with decorative navigation dots
 */
function generateHeroH7Carousel(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA } = config;

  const css = `
    .hero-h7 {
      position: relative;
      min-height: 80vh;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, var(--primary, #1e5a8a) 0%, var(--secondary, #1e40af) 100%);
      overflow: hidden;
    }
    .hero-h7-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: calc(var(--section-spacing, 80px) * 11.25);
      margin: 0 auto;
      color: var(--white, #ffffff);
    }
    .hero-h7 h1 {
      font-size: var(--text-h1, 56px);
      line-height: 1.1;
      margin-bottom: var(--gap-md, 24px);
    }
    .hero-h7 .tagline {
      font-size: var(--text-lg, 20px);
      opacity: 0.9;
      margin-bottom: var(--gap-lg, 40px);
    }
    .hero-h7-buttons {
      display: flex;
      gap: var(--gap-sm, 16px);
      justify-content: center;
    }
    .hero-h7-dots {
      position: absolute;
      bottom: var(--gap-lg, 40px);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: calc(var(--gap-xs, 8px) * 1.5);
      z-index: 3;
    }
    .hero-h7-dot {
      width: calc(var(--gap-xs, 8px) * 1.5);
      height: calc(var(--gap-xs, 8px) * 1.5);
      border-radius: var(--radius-pill, 9999px);
      background: rgba(255,255,255,0.4);
    }
    .hero-h7-dot.active {
      background: var(--bg-surface, var(--white, #ffffff));
    }
    .hero-h7 .btn-primary {
      background: var(--bg-surface, var(--white, #ffffff));
      color: var(--primary, #1e5a8a);
    }
    .hero-h7 .btn-secondary {
      color: var(--white, #ffffff);
      border: var(--border-width, 2px) solid var(--white, #ffffff);
    }
    @media (max-width: 768px) {
      .hero-h7 h1 { font-size: var(--text-h2, 40px); }
    }
  `;

  const html = `
    <section class="hero-h7 dna-animate">
      <div class="container hero-h7-content">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h7-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
      <div class="hero-h7-dots">
        <div class="hero-h7-dot active"></div>
        <div class="hero-h7-dot"></div>
        <div class="hero-h7-dot"></div>
      </div>
    </section>
  `;

  return { html, css };
}
