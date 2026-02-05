/**
 * CSS Variable Contract
 *
 * This file defines the authoritative list of CSS variable names that ALL agents must use.
 * Do NOT invent new variable names - use ONLY variables defined here.
 *
 * CRITICAL: When using these variables in components, ALWAYS provide fallbacks:
 * - BAD:  border-radius: var(--radius);
 * - GOOD: border-radius: var(--radius, 8px);
 */

export const CSS_VARIABLES = [
  // Radius Scale
  '--radius',
  '--radius-sm',
  '--radius-lg',
  '--radius-pill',

  // Shadows & Effects
  '--shadow-card',
  '--backdrop',
  '--bg-surface',

  // Borders
  '--border-width',
  '--border-color',

  // Section Spacing
  '--section-spacing',
  '--card-padding',
  '--btn-padding',
  '--btn-padding-sm',
  '--nav-padding',
  '--footer-spacing',

  // Gap Scale
  '--gap-xs',
  '--gap-sm',
  '--gap-md',
  '--gap-lg',
  '--gap-xl',

  // Typography Scale (clamp() values live in dna-styles.ts, not components)
  '--text-h1',
  '--text-h2',
  '--text-h3',
  '--text-h4',
  '--text-body',
  '--text-lg',
  '--text-sm',

  // Sizes
  '--icon-size',
  '--avatar-size',

  // Transforms
  '--btn-text-transform',
] as const;

export type CSSVariable = typeof CSS_VARIABLES[number];

/**
 * Helper to validate variable names at runtime
 * Use this to catch typos during development
 */
export function isValidVariable(name: string): name is CSSVariable {
  return CSS_VARIABLES.includes(name as CSSVariable);
}

/**
 * Default fallback values for each CSS variable
 * Components should use these as fallbacks when consuming variables
 */
export const CSS_VARIABLE_DEFAULTS: Record<CSSVariable, string> = {
  // Radius Scale
  '--radius': '12px',
  '--radius-sm': '8px',
  '--radius-lg': '16px',
  '--radius-pill': '9999px',

  // Shadows & Effects
  '--shadow-card': '0 4px 20px rgba(0,0,0,0.08)',
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // Borders
  '--border-width': '0',
  '--border-color': 'transparent',

  // Section Spacing
  '--section-spacing': '80px',
  '--card-padding': '32px',
  '--btn-padding': '16px 32px',
  '--btn-padding-sm': '12px 24px',
  '--nav-padding': '16px 0',
  '--footer-spacing': '60px 0 30px',

  // Gap Scale
  '--gap-xs': '8px',
  '--gap-sm': '16px',
  '--gap-md': '24px',
  '--gap-lg': '40px',
  '--gap-xl': '60px',

  // Typography Scale
  '--text-h1': '48px',
  '--text-h2': '36px',
  '--text-h3': '28px',
  '--text-h4': '24px',
  '--text-body': '16px',
  '--text-lg': '20px',
  '--text-sm': '14px',

  // Sizes
  '--icon-size': '56px',
  '--avatar-size': '48px',

  // Transforms
  '--btn-text-transform': 'none',
};

/**
 * Generate a CSS variable reference with fallback
 * Use this helper to ensure all variables have fallbacks
 */
export function cssVar(variable: CSSVariable): string {
  return `var(${variable}, ${CSS_VARIABLE_DEFAULTS[variable]})`;
}

/**
 * Generate all CSS variables as :root declarations
 * This provides base values that Skins can override
 */
export function generateContractCSS(): string {
  return `:root {
  /* ========== BASE VALUES (overridden by Skins) ========== */

  /* Spacing Scale */
  --section-spacing: 80px;
  --card-padding: 32px;
  --btn-padding: 16px 32px;
  --btn-padding-sm: 12px 24px;
  --nav-padding: 16px 0;
  --footer-spacing: 60px 0 30px;

  /* Gap Scale */
  --gap-xs: 8px;
  --gap-sm: 16px;
  --gap-md: 24px;
  --gap-lg: 40px;
  --gap-xl: 60px;

  /* Typography Scale (clamp() ONLY here, not in components!) */
  --text-h1: clamp(36px, 5vw, 56px);
  --text-h2: clamp(28px, 4vw, 40px);
  --text-h3: clamp(22px, 3vw, 28px);
  --text-h4: clamp(18px, 2.5vw, 24px);
  --text-body: clamp(16px, 1.5vw, 18px);
  --text-lg: 20px;
  --text-sm: 14px;

  /* Radius Scale */
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* Sizes */
  --icon-size: 56px;
  --avatar-size: 48px;

  /* ========== SKIN-CONTROLLED (Skins override these) ========== */

  /* Shadows & Effects */
  --shadow-card: 0 4px 20px rgba(0,0,0,0.08);
  --backdrop: none;
  --bg-surface: var(--background);

  /* Borders (split into width + color for flexibility) */
  --border-width: 0;
  --border-color: transparent;

  /* Button Transforms */
  --btn-text-transform: none;
}`;
}
