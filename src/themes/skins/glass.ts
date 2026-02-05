/**
 * Glass/Neumorphic Skin (D6)
 *
 * Frosted glass effects, subtle transparency, and soft depth.
 * Evokes modern iOS/macOS aesthetic with backdrop blur.
 */

import { CSSVariable, CSS_VARIABLE_DEFAULTS } from './contract';

export type SkinVariables = Partial<Record<CSSVariable, string>>;

export const glassSkin: SkinVariables = {
  // Rounded, soft corners
  '--radius': '16px',
  '--radius-sm': '10px',
  '--radius-lg': '24px',
  '--radius-pill': '9999px',

  // Soft diffuse shadows
  '--shadow-card': '0 8px 32px rgba(0, 0, 0, 0.1)',

  // Glass effect - this is the key differentiator
  '--backdrop': 'blur(12px)',
  '--bg-surface': 'rgba(255, 255, 255, 0.25)',

  // Subtle borders for glass edges
  '--border-width': '1px',
  '--border-color': 'rgba(255, 255, 255, 0.3)',

  // Standard spacing
  '--section-spacing': '80px',
  '--card-padding': '32px',
  '--btn-padding': '14px 28px',
  '--btn-padding-sm': '10px 20px',
  '--nav-padding': '12px 0',
  '--footer-spacing': '60px 0 30px',

  // Gaps
  '--gap-xs': '8px',
  '--gap-sm': '16px',
  '--gap-md': '24px',
  '--gap-lg': '40px',
  '--gap-xl': '60px',

  // Typography
  '--text-h1': CSS_VARIABLE_DEFAULTS['--text-h1'],
  '--text-h2': CSS_VARIABLE_DEFAULTS['--text-h2'],
  '--text-h3': CSS_VARIABLE_DEFAULTS['--text-h3'],
  '--text-h4': CSS_VARIABLE_DEFAULTS['--text-h4'],
  '--text-body': CSS_VARIABLE_DEFAULTS['--text-body'],
  '--text-lg': CSS_VARIABLE_DEFAULTS['--text-lg'],
  '--text-sm': CSS_VARIABLE_DEFAULTS['--text-sm'],

  // Sizes
  '--icon-size': '52px',
  '--avatar-size': '48px',

  // No transform
  '--btn-text-transform': 'none',
};

/**
 * Additional CSS overrides for glass style
 */
export function getGlassOverrides(): string {
  return `
    /* Glass Card Effect */
    .dna-card,
    .service-card,
    .testimonial-card {
      background: var(--bg-surface, rgba(255, 255, 255, 0.25));
      backdrop-filter: var(--backdrop, blur(12px));
      -webkit-backdrop-filter: var(--backdrop, blur(12px));
      border: var(--border-width, 1px) solid var(--border-color, rgba(255, 255, 255, 0.3));
    }

    .dna-card:hover,
    .service-card:hover,
    .testimonial-card:hover {
      background: rgba(255, 255, 255, 0.35);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
    }

    /* Glass Navigation */
    nav,
    .nav,
    .dna-nav {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* Glass Buttons */
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Glass Form Inputs */
    input,
    textarea,
    select {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    input:focus,
    textarea:focus,
    select:focus {
      background: rgba(255, 255, 255, 0.8);
      border-color: var(--primary);
    }
  `;
}
