/**
 * Agency Skin (Gustav)
 *
 * Friendly but expensive: refined corners, high spacing,
 * and deep shadows without gimmicks.
 */

import { CSSVariable, CSS_VARIABLE_DEFAULTS } from './contract';

export type SkinVariables = Partial<Record<CSSVariable, string>>;

export const agencySkin: SkinVariables = {
  // The "Gustav" Look: Friendly but Expensive
  '--radius': '0.75rem',
  '--radius-sm': '0.5rem',
  '--radius-lg': '1.5rem',
  '--radius-pill': '625rem',

  // Deep, expensive shadows for an Awwwards-level feel
  '--shadow-card': '0 40px 120px -40px rgba(15, 23, 42, 0.5), 0 16px 40px -26px rgba(15, 23, 42, 0.25)',

  // No glass effects
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // Hairline borders to keep edges crisp
  '--border-width': '1px',
  '--border-color': 'rgba(15, 23, 42, 0.08)',

  // High spacing
  '--section-spacing': '8.75rem',
  '--card-padding': '3.5rem',
  '--btn-padding': '1.125rem 2.75rem',
  '--btn-padding-sm': '0.875rem 2rem',
  '--nav-padding': '2rem 0',
  '--footer-spacing': '8.75rem 0 3.75rem',

  // Gaps
  '--gap-xs': '0.625rem',
  '--gap-sm': '1.25rem',
  '--gap-md': '2rem',
  '--gap-lg': '3.5rem',
  '--gap-xl': '5.5rem',

  // Typography
  '--text-h1': CSS_VARIABLE_DEFAULTS['--text-h1'],
  '--text-h2': CSS_VARIABLE_DEFAULTS['--text-h2'],
  '--text-h3': CSS_VARIABLE_DEFAULTS['--text-h3'],
  '--text-h4': CSS_VARIABLE_DEFAULTS['--text-h4'],
  '--text-body': CSS_VARIABLE_DEFAULTS['--text-body'],
  '--text-lg': CSS_VARIABLE_DEFAULTS['--text-lg'],
  '--text-sm': CSS_VARIABLE_DEFAULTS['--text-sm'],

  // Sizes
  '--icon-size': '3.75rem',
  '--avatar-size': '3.5rem',

  // No transform
  '--btn-text-transform': 'none',

  // Motion
  '--hover-transform': 'translateY(-0.375rem)',
};

/**
 * Additional CSS overrides for agency style
 */
export function getAgencyOverrides(): string {
  return `
    :root {
      --hover-shadow: 0 60px 150px -60px rgba(15, 23, 42, 0.6), 0 24px 60px -40px rgba(15, 23, 42, 0.28);
    }

    .dna-card,
    .card,
    .service-card,
    .testimonial-card {
      background: var(--bg-surface, var(--white, #ffffff));
      box-shadow: var(--shadow-card);
      border: var(--border-width, 1px) solid var(--border-color, rgba(15, 23, 42, 0.08));
    }

    .dna-card:hover,
    .card:hover,
    .service-card:hover,
    .testimonial-card:hover {
      box-shadow: var(--shadow-card);
      transform: var(--hover-transform, translateY(-0.375rem));
    }

    .btn-primary:hover,
    .btn-white:hover {
      box-shadow: var(--shadow-card);
    }

    .btn-secondary {
      border-width: var(--border-width, 1px);
    }
  `;
}
