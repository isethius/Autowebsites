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
 */
export function generateHeroCSS(): string {
  return `
    .hero {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: var(--white);
      padding: 80px 0;
      position: relative;
      overflow: hidden;
    }

    .hero-solid {
      background: var(--primary);
    }

    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 48px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
    }

    .hero-text p {
      font-size: 20px;
      opacity: 0.9;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .hero-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--white);
      color: var(--primary);
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      transition: all 0.2s ease;
    }

    .hero-cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .hero-cta-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      color: var(--white);
      border: 2px solid var(--white);
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .hero-cta-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .trust-badges {
      display: flex;
      gap: 32px;
      margin-top: 40px;
      flex-wrap: wrap;
    }

    .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .trust-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }

    @media (max-width: 900px) {
      .hero-content {
        grid-template-columns: 1fr;
      }

      .hero-text h1 {
        font-size: 32px;
      }

      .hero-text p {
        font-size: 18px;
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
            ${phone ? `<a href="tel:${phone}" class="hero-cta-primary">📞 Call Now: ${phone}</a>` : ''}
            ${primaryCTA && !phone ? `<a href="${primaryCTA.href}" class="hero-cta-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="hero-cta-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
export function generateHeroSplit(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges } = config;

  return `
    <section class="hero hero-split">
      <div class="container hero-content" style="grid-template-columns: 1fr 1.2fr;">
        <div class="hero-image">
          📸
        </div>
        <div class="hero-text">
          <h1>${escapeHtml(headline)}</h1>
          <p>${escapeHtml(tagline)}</p>
          <div class="hero-buttons">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="hero-cta-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="hero-cta-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
export function generateHeroCentered(config: HeroConfig): string {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges } = config;

  return `
    <section class="hero">
      <div class="container" style="text-align: center; max-width: 800px;">
        <div class="hero-text" style="max-width: 100%;">
          <h1 style="font-size: 52px;">${escapeHtml(headline)}</h1>
          <p style="font-size: 22px; max-width: 600px; margin: 0 auto 32px;">${escapeHtml(tagline)}</p>
          <div class="hero-buttons" style="justify-content: center;">
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="hero-cta-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="hero-cta-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
          </div>
          ${trustBadges?.length ? `
          <div class="trust-badges" style="justify-content: center;">
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
    <section class="hero" style="padding: 60px 0; background: var(--gray-50);">
      <div class="container" style="text-align: center;">
        <h1 style="color: var(--text); font-size: 44px; margin-bottom: 16px;">${escapeHtml(headline)}</h1>
        <p style="color: var(--muted); font-size: 20px; max-width: 600px; margin: 0 auto 28px;">${escapeHtml(tagline)}</p>
        <div class="hero-buttons" style="justify-content: center;">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn btn-primary btn-lg">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn btn-secondary btn-lg">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
function generateHeroH1FullWidth(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, phone, trustBadges, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .hero-h1 {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: var(--white);
      padding: 100px 0;
      min-height: 70vh;
      display: flex;
      align-items: center;
    }

    .hero-h1-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 60px;
      align-items: center;
    }

    .hero-h1 h1 {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: 24px;
    }

    .hero-h1 .tagline {
      font-size: 22px;
      opacity: 0.9;
      margin-bottom: 36px;
      line-height: 1.6;
    }

    .hero-h1-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-h1 .hero-cta-primary {
      background: var(--white);
      color: var(--primary);
      padding: 18px 36px;
      border-radius: ${design.borderRadius};
      font-weight: 700;
      font-size: 18px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h1 .hero-cta-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.2);
    }

    .hero-h1 .hero-cta-secondary {
      background: transparent;
      color: var(--white);
      border: 2px solid var(--white);
      padding: 16px 32px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h1 .hero-cta-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    .hero-h1 .trust-badges {
      display: flex;
      gap: 32px;
      margin-top: 48px;
      flex-wrap: wrap;
    }

    .hero-h1 .trust-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 500;
    }

    .hero-h1 .trust-icon {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-h1-image {
      background: rgba(255,255,255,0.1);
      border-radius: ${design.borderRadius};
      height: 450px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64px;
    }

    @media (max-width: 900px) {
      .hero-h1-content { grid-template-columns: 1fr; }
      .hero-h1 h1 { font-size: 40px; }
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
            ${phone ? `<a href="tel:${phone}" class="hero-cta-primary">Call Now: ${phone}</a>` : ''}
            ${primaryCTA && !phone ? `<a href="${primaryCTA.href}" class="hero-cta-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="hero-cta-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
function generateHeroH2Split(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .hero-h2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 80vh;
    }

    .hero-h2-image {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
      color: var(--white);
    }

    .hero-h2-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px 80px;
      background: var(--background);
    }

    .hero-h2 h1 {
      font-size: 48px;
      line-height: 1.15;
      margin-bottom: 24px;
      color: var(--text);
    }

    .hero-h2 .tagline {
      font-size: 20px;
      color: var(--muted);
      margin-bottom: 36px;
      line-height: 1.6;
    }

    .hero-h2-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-h2 .btn-primary {
      background: var(--primary);
      color: var(--white);
      padding: 16px 32px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h2 .btn-primary:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .hero-h2 .btn-secondary {
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);
      padding: 14px 28px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h2 .btn-secondary:hover {
      background: var(--primary);
      color: var(--white);
    }

    .hero-h2 .trust-badges {
      display: flex;
      gap: 24px;
      margin-top: 40px;
      flex-wrap: wrap;
    }

    .hero-h2 .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--muted);
    }

    @media (max-width: 900px) {
      .hero-h2 { grid-template-columns: 1fr; }
      .hero-h2-image { min-height: 300px; order: -1; }
      .hero-h2-content { padding: 40px 20px; }
      .hero-h2 h1 { font-size: 36px; }
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
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
function generateHeroH3Minimal(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .hero-h3 {
      background: var(--gray-50);
      padding: 80px 0;
      text-align: center;
    }

    .hero-h3 h1 {
      font-size: 44px;
      line-height: 1.2;
      margin-bottom: 20px;
      color: var(--text);
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-h3 .tagline {
      font-size: 20px;
      color: var(--muted);
      margin-bottom: 32px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-h3-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .hero-h3 .btn-primary {
      background: var(--primary);
      color: var(--white);
      padding: 14px 28px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h3 .btn-secondary {
      background: var(--white);
      color: var(--text);
      padding: 14px 28px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--gray-200);
      transition: all var(--transition-duration, 0.2s) ease;
    }

    @media (max-width: 768px) {
      .hero-h3 h1 { font-size: 32px; }
      .hero-h3 .tagline { font-size: 18px; }
    }
  `;

  const html = `
    <section class="hero-h3 dna-animate">
      <div class="container">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h3-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H8: Asymmetric Split - Uneven split with overlapping elements
 */
function generateHeroH8Asymmetric(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

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
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
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
      padding-right: 60px;
    }

    .hero-h8 h1 {
      font-size: 52px;
      line-height: 1.1;
      margin-bottom: 24px;
      color: var(--text);
    }

    .hero-h8 .tagline {
      font-size: 20px;
      color: var(--muted);
      margin-bottom: 36px;
      line-height: 1.6;
    }

    .hero-h8-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-h8 .btn-primary {
      background: var(--primary);
      color: var(--white);
      padding: 16px 32px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h8 .btn-secondary {
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);
      padding: 14px 28px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h8 .trust-badges {
      display: flex;
      gap: 24px;
      margin-top: 40px;
      flex-wrap: wrap;
    }

    .hero-h8 .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--muted);
    }

    .hero-h8-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-size: 80px;
    }

    @media (max-width: 900px) {
      .hero-h8-bg { width: 100%; clip-path: none; opacity: 0.1; }
      .hero-h8-content { grid-template-columns: 1fr; }
      .hero-h8-text { padding: 0; text-align: center; }
      .hero-h8-visual { display: none; }
      .hero-h8 h1 { font-size: 36px; }
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
            ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
            ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
 */
function generateHeroH9TextOnly(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .hero-h9 {
      background: var(--text);
      color: var(--white);
      padding: 120px 0;
      text-align: center;
    }

    .hero-h9 h1 {
      font-size: 72px;
      line-height: 1.05;
      margin-bottom: 32px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      letter-spacing: -0.03em;
    }

    .hero-h9 .tagline {
      font-size: 24px;
      opacity: 0.8;
      margin-bottom: 48px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.5;
    }

    .hero-h9-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .hero-h9 .btn-primary {
      background: var(--white);
      color: var(--text);
      padding: 18px 40px;
      border-radius: ${design.borderRadius};
      font-weight: 700;
      font-size: 18px;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h9 .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .hero-h9 .btn-secondary {
      background: transparent;
      color: var(--white);
      border: 2px solid var(--white);
      padding: 16px 36px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      font-size: 18px;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h9 .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    @media (max-width: 900px) {
      .hero-h9 { padding: 80px 0; }
      .hero-h9 h1 { font-size: 44px; }
      .hero-h9 .tagline { font-size: 20px; }
    }

    @media (max-width: 480px) {
      .hero-h9 h1 { font-size: 36px; }
    }
  `;

  const html = `
    <section class="hero-h9 dna-animate">
      <div class="container">
        <h1>${escapeHtml(headline)}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <div class="hero-h9-buttons">
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * H12: Geometric Shapes - Abstract geometric patterns with clip-paths
 */
function generateHeroH12Geometric(config: DNAHeroConfig): SectionOutput {
  const { headline, tagline, primaryCTA, secondaryCTA, trustBadges, dna } = config;
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;

  const css = `
    .hero-h12 {
      position: relative;
      min-height: 80vh;
      display: flex;
      align-items: center;
      background: var(--background);
      overflow: hidden;
    }

    .hero-h12-shapes {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .hero-h12-shape {
      position: absolute;
      background: var(--primary);
      opacity: 0.1;
    }

    .hero-h12-shape-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      right: -100px;
      border-radius: 50%;
    }

    .hero-h12-shape-2 {
      width: 300px;
      height: 300px;
      bottom: -50px;
      left: 10%;
      clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
      background: var(--secondary);
    }

    .hero-h12-shape-3 {
      width: 200px;
      height: 200px;
      top: 30%;
      right: 20%;
      clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
      background: var(--accent);
    }

    .hero-h12-content {
      position: relative;
      z-index: 2;
      max-width: 700px;
    }

    .hero-h12 h1 {
      font-size: 56px;
      line-height: 1.1;
      margin-bottom: 24px;
      color: var(--text);
    }

    .hero-h12 .tagline {
      font-size: 20px;
      color: var(--muted);
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .hero-h12-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-h12 .btn-primary {
      background: var(--primary);
      color: var(--white);
      padding: 16px 32px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h12 .btn-primary:hover {
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .hero-h12 .btn-secondary {
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);
      padding: 14px 28px;
      border-radius: ${design.borderRadius};
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .hero-h12 .trust-badges {
      display: flex;
      gap: 24px;
      margin-top: 48px;
      flex-wrap: wrap;
    }

    .hero-h12 .trust-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--muted);
    }

    @media (max-width: 900px) {
      .hero-h12 h1 { font-size: 40px; }
      .hero-h12-shape-1 { width: 250px; height: 250px; }
      .hero-h12-shape-2 { width: 200px; height: 200px; }
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
          ${primaryCTA ? `<a href="${primaryCTA.href}" class="btn-primary">${escapeHtml(primaryCTA.text)}</a>` : ''}
          ${secondaryCTA ? `<a href="${secondaryCTA.href}" class="btn-secondary">${escapeHtml(secondaryCTA.text)}</a>` : ''}
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
