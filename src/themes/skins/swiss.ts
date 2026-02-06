/**
 * Swiss Skin (D10 - Swiss Grid)
 *
 * Clean, rational, typographic design inspired by Swiss/International Style.
 * Strict grid, minimal decoration, maximum clarity.
 */

import { CSSVariable, CSS_VARIABLE_DEFAULTS } from './contract';

export type SkinVariables = Partial<Record<CSSVariable, string>>;

export const swissSkin: SkinVariables = {
  // Sharp corners - no rounded corners in Swiss design
  '--radius': '0px',
  '--radius-sm': '0px',
  '--radius-lg': '0px',
  '--radius-pill': '0px',

  // No shadows - Swiss is flat
  '--shadow-card': 'none',

  // No glass effects
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // Thin precise borders
  '--border-width': '1px',
  '--border-color': '#000',

  // Generous vertical rhythm
  '--section-spacing': '140px',
  '--card-padding': '40px',
  '--btn-padding': '16px 40px',
  '--btn-padding-sm': '12px 28px',
  '--nav-padding': '24px 0',
  '--footer-spacing': '100px 0 40px',

  // Precise gaps based on grid
  '--gap-xs': '8px',
  '--gap-sm': '16px',
  '--gap-md': '32px',
  '--gap-lg': '48px',
  '--gap-xl': '80px',

  // Typography
  '--text-h1': CSS_VARIABLE_DEFAULTS['--text-h1'],
  '--text-h2': CSS_VARIABLE_DEFAULTS['--text-h2'],
  '--text-h3': CSS_VARIABLE_DEFAULTS['--text-h3'],
  '--text-h4': CSS_VARIABLE_DEFAULTS['--text-h4'],
  '--text-body': CSS_VARIABLE_DEFAULTS['--text-body'],
  '--text-lg': CSS_VARIABLE_DEFAULTS['--text-lg'],
  '--text-sm': CSS_VARIABLE_DEFAULTS['--text-sm'],

  // Sizes
  '--icon-size': '48px',
  '--avatar-size': '48px',

  // Uppercase for headings and buttons
  '--btn-text-transform': 'uppercase',
};

/**
 * Additional CSS overrides for Swiss style
 */
export function getSwissOverrides(): string {
  return `
    /* Swiss Typography - Clean and Rational */
    h1, h2, h3, h4, h5, h6 {
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-weight: 700;
    }

    /* Swiss Cards - Border only, no shadow */
    .dna-card,
    .service-card,
    .testimonial-card {
      background: var(--white);
      border: var(--border-width, 1px) solid var(--border-color, #000);
      box-shadow: none;
    }

    .dna-card:hover,
    .service-card:hover,
    .testimonial-card:hover {
      background: var(--gray-50);
      transform: none;
    }

    /* Swiss Buttons - Outlined, precise */
    .btn,
    .btn-primary,
    .btn-secondary {
      border: 1px solid currentColor;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 600;
    }

    .btn-primary {
      background: var(--text);
      color: var(--background);
      border-color: var(--text);
    }

    .btn-primary:hover {
      background: transparent;
      color: var(--text);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text);
      border-color: var(--text);
    }

    .btn-secondary:hover {
      background: var(--text);
      color: var(--background);
    }

    /* Swiss Grid Lines */
    section {
      border-bottom: 1px solid var(--gray-200);
    }

    section:last-of-type {
      border-bottom: none;
    }

    /* Swiss Form Inputs */
    input,
    textarea,
    select {
      border: 1px solid var(--text);
      border-radius: 0;
      background: transparent;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-width: 2px;
      outline: none;
    }

    /* Swiss Images - No curves */
    img {
      border-radius: 0;
    }
  `;
}
