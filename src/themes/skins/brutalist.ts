/**
 * Brutalist Skin (D7)
 *
 * Raw, bold, and unapologetically direct design aesthetic.
 * Heavy borders, sharp corners, uppercase text, and hard shadows.
 */

import { CSSVariable, CSS_VARIABLE_DEFAULTS } from './contract';

export type SkinVariables = Partial<Record<CSSVariable, string>>;

export const brutalistSkin: SkinVariables = {
  // Sharp corners everywhere
  '--radius': '0px',
  '--radius-sm': '0px',
  '--radius-lg': '0px',
  '--radius-pill': '0px',

  // Hard offset shadows
  '--shadow-card': '6px 6px 0px #000',

  // No glass effects
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // Heavy borders
  '--border-width': '3px',
  '--border-color': '#000',

  // More spacing for impact
  '--section-spacing': '140px',
  '--card-padding': '40px',
  '--btn-padding': '16px 32px',
  '--btn-padding-sm': '12px 24px',
  '--nav-padding': '24px 0',
  '--footer-spacing': '100px 0 40px',

  // Gaps
  '--gap-xs': '8px',
  '--gap-sm': '16px',
  '--gap-md': '24px',
  '--gap-lg': '48px',
  '--gap-xl': '64px',

  // Typography uses default sizes but uppercase transform
  '--text-h1': CSS_VARIABLE_DEFAULTS['--text-h1'],
  '--text-h2': CSS_VARIABLE_DEFAULTS['--text-h2'],
  '--text-h3': CSS_VARIABLE_DEFAULTS['--text-h3'],
  '--text-h4': CSS_VARIABLE_DEFAULTS['--text-h4'],
  '--text-body': CSS_VARIABLE_DEFAULTS['--text-body'],
  '--text-lg': CSS_VARIABLE_DEFAULTS['--text-lg'],
  '--text-sm': CSS_VARIABLE_DEFAULTS['--text-sm'],

  // Sizes
  '--icon-size': '56px',
  '--avatar-size': '48px',

  // Uppercase transform
  '--btn-text-transform': 'uppercase',
};

/**
 * Additional CSS overrides for brutalist style
 * These go beyond variable values to include structural changes
 */
export function getBrutalistOverrides(): string {
  return `
    /* Brutalist Typography Overrides */
    h1, h2, h3, h4, h5, h6 {
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Brutalist Card Style */
    .dna-card,
    .service-card,
    .testimonial-card {
      border: var(--border-width, 3px) solid var(--border-color, #000);
      box-shadow: var(--shadow-card, 6px 6px 0px #000);
    }

    .dna-card:hover,
    .service-card:hover,
    .testimonial-card:hover {
      box-shadow: 10px 10px 0px #000;
      transform: translate(-4px, -4px);
    }

    /* Brutalist Buttons */
    .btn,
    .btn-primary,
    .btn-secondary {
      border: 2px solid currentColor;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
    }

    /* Brutalist Form Inputs */
    input,
    textarea,
    select {
      border: 2px solid var(--text);
      border-radius: 0;
    }

    input:focus,
    textarea:focus,
    select:focus {
      box-shadow: 4px 4px 0px var(--primary);
      outline: none;
    }
  `;
}
