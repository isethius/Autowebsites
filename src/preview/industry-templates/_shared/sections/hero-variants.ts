/**
 * Hero Section Variants
 *
 * Reusable hero section builders for different layouts.
 */

import { ColorPalette } from '../../../../overnight/types';
import { escapeHtml } from '../utils';

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
