/**
 * Soft Skin (D1 - Rounded Soft, D4 - Flat Minimal)
 *
 * Friendly, approachable design with generous curves and soft shadows.
 * The "friendly startup" look - inviting and modern.
 */

import { CSSVariable, CSS_VARIABLE_DEFAULTS } from './contract';

export type SkinVariables = Partial<Record<CSSVariable, string>>;

export const softSkin: SkinVariables = {
  // Very rounded corners - the signature of soft design
  '--radius': '24px',
  '--radius-sm': '16px',
  '--radius-lg': '32px',
  '--radius-pill': '9999px',

  // Soft, diffuse shadows that create depth without harsh edges
  '--shadow-card': '0 20px 40px -10px rgba(0, 0, 0, 0.1)',

  // No glass effects
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // No borders - rely on shadows for separation
  '--border-width': '0',
  '--border-color': 'transparent',

  // Comfortable spacing
  '--section-spacing': '80px',
  '--card-padding': '32px',
  '--btn-padding': '16px 32px',
  '--btn-padding-sm': '12px 24px',
  '--nav-padding': '16px 0',
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
  '--icon-size': '56px',
  '--avatar-size': '52px',

  // No transform
  '--btn-text-transform': 'none',
};

/**
 * Additional CSS overrides for soft style
 */
export function getSoftOverrides(): string {
  return `
    /* Soft Card Effect */
    .dna-card,
    .service-card,
    .testimonial-card {
      background: var(--white);
      border: none;
      box-shadow: var(--shadow-card, 0 20px 40px -10px rgba(0, 0, 0, 0.1));
    }

    .dna-card:hover,
    .service-card:hover,
    .testimonial-card:hover {
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.15);
      transform: translateY(-6px);
    }

    /* Soft Buttons */
    .btn-primary {
      box-shadow: 0 8px 20px -4px var(--primary);
    }

    .btn-primary:hover {
      box-shadow: 0 12px 28px -4px var(--primary);
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: var(--gray-100);
      color: var(--text);
      border: none;
    }

    .btn-secondary:hover {
      background: var(--gray-200);
    }

    /* Soft Icons */
    .card-icon,
    .service-icon {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      box-shadow: 0 8px 20px -4px var(--primary);
    }

    /* Soft Form Inputs */
    input,
    textarea,
    select {
      background: var(--gray-50);
      border: 2px solid transparent;
      border-radius: var(--radius-sm, 16px);
    }

    input:focus,
    textarea:focus,
    select:focus {
      background: var(--white);
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(var(--primary-rgb, 59, 130, 246), 0.1);
    }

    /* Soft Images */
    img {
      border-radius: var(--radius, 24px);
    }
  `;
}
