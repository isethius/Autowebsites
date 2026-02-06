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
  // Core Colors
  '--primary',
  '--secondary',
  '--accent',
  '--background',
  '--text',
  '--muted',
  '--white',
  '--black',
  '--gray-50',
  '--gray-100',
  '--gray-200',
  '--gray-300',
  '--gray-400',
  '--gray-500',
  '--gray-600',
  '--gray-700',
  '--gray-800',
  '--gray-900',
  '--primary-rgb',
  '--success',
  '--warning',
  '--error',
  '--emergency',

  // Radius Scale
  '--radius',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-pill',

  // Shadows & Effects
  '--shadow-card',
  '--hover-shadow',
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

  // Typography Scale (clamp() values live in base-styles.ts, not components)
  '--text-h1',
  '--text-h2',
  '--text-h3',
  '--text-h4',
  '--text-body',
  '--text-lg',
  '--text-sm',

  // Typography Families
  '--font-heading',
  '--font-body',
  '--heading-weight',
  '--letter-spacing',

  // Sizes
  '--icon-size',
  '--avatar-size',

  // Transforms
  '--btn-text-transform',

  // Motion
  '--transition-duration',
  '--hover-transform',

  // Legacy/Compatibility Variables (do not invent new ones)
  '--border-radius',
  '--border-radius-sm',
  '--border-radius-lg',
  '--box-shadow',
  '--design-style',
  '--primary-color',
  '--accent-color',
  '--bg-color',
  '--text-color',
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
  // Core Colors
  '--primary': '#1e5a8a',
  '--secondary': '#1e40af',
  '--accent': '#14b8a6',
  '--background': '#ffffff',
  '--text': '#111827',
  '--muted': '#6b7280',
  '--white': '#ffffff',
  '--black': '#000000',
  '--gray-50': '#f9fafb',
  '--gray-100': '#f3f4f6',
  '--gray-200': '#e5e7eb',
  '--gray-300': '#d1d5db',
  '--gray-400': '#9ca3af',
  '--gray-500': '#6b7280',
  '--gray-600': '#4b5563',
  '--gray-700': '#374151',
  '--gray-800': '#1f2937',
  '--gray-900': '#111827',
  '--primary-rgb': '59, 130, 246',
  '--success': '#22c55e',
  '--warning': '#f59e0b',
  '--error': '#ef4444',
  '--emergency': '#dc2626',

  // Radius Scale
  '--radius': '12px',
  '--radius-sm': '8px',
  '--radius-md': '12px',
  '--radius-lg': '16px',
  '--radius-pill': '9999px',

  // Shadows & Effects
  '--shadow-card': '0 4px 20px rgba(0,0,0,0.08)',
  '--hover-shadow': '0 8px 30px rgba(0,0,0,0.12)',
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',

  // Borders
  '--border-width': '0',
  '--border-color': 'transparent',

  // Section Spacing
  '--section-spacing': '140px',
  '--card-padding': '40px',
  '--btn-padding': '16px 32px',
  '--btn-padding-sm': '12px 24px',
  '--nav-padding': '24px 0',
  '--footer-spacing': '100px 0 40px',

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

  // Typography Families
  '--font-heading': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  '--font-body': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  '--heading-weight': '800',
  '--letter-spacing': '-0.02em',

  // Sizes
  '--icon-size': '56px',
  '--avatar-size': '48px',

  // Transforms
  '--btn-text-transform': 'none',

  // Motion
  '--transition-duration': '0.2s',
  '--hover-transform': 'translateY(-2px)',

  // Legacy/Compatibility Variables
  '--border-radius': '12px',
  '--border-radius-sm': '8px',
  '--border-radius-lg': '16px',
  '--box-shadow': '0 4px 20px rgba(0,0,0,0.08)',
  '--design-style': 'default',
  '--primary-color': '#1e5a8a',
  '--accent-color': '#14b8a6',
  '--bg-color': '#ffffff',
  '--text-color': '#111827',
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

  /* Core Colors */
  --primary: #1e5a8a;
  --secondary: #1e40af;
  --accent: #14b8a6;
  --background: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --white: #ffffff;
  --black: #000000;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --primary-rgb: 59, 130, 246;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --emergency: #dc2626;

  /* Spacing Scale */
  --section-spacing: 140px;
  --card-padding: 40px;
  --btn-padding: 16px 32px;
  --btn-padding-sm: 12px 24px;
  --nav-padding: 24px 0;
  --footer-spacing: 100px 0 40px;

  /* Gap Scale */
  --gap-xs: 8px;
  --gap-sm: 16px;
  --gap-md: 24px;
  --gap-lg: 40px;
  --gap-xl: 60px;

  /* Typography Scale (clamp() ONLY in base-styles.ts) */
  --text-h1: 48px;
  --text-h2: 36px;
  --text-h3: 28px;
  --text-h4: 24px;
  --text-body: 16px;
  --text-lg: 20px;
  --text-sm: 14px;

  /* Radius Scale */
  --radius: 12px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;

  /* Sizes */
  --icon-size: 56px;
  --avatar-size: 48px;

  /* Typography Families */
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --heading-weight: 800;
  --letter-spacing: -0.02em;

  /* ========== SKIN-CONTROLLED (Skins override these) ========== */

  /* Shadows & Effects */
  --shadow-card: 0 4px 20px rgba(0,0,0,0.08);
  --hover-shadow: 0 8px 30px rgba(0,0,0,0.12);
  --backdrop: none;
  --bg-surface: var(--background);

  /* Borders (split into width + color for flexibility) */
  --border-width: 0;
  --border-color: transparent;

  /* Button Transforms */
  --btn-text-transform: none;

  /* Motion */
  --transition-duration: 0.2s;
  --hover-transform: translateY(-2px);

  /* Legacy/Compatibility */
  --border-radius: 12px;
  --border-radius-sm: 8px;
  --border-radius-lg: 16px;
  --box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  --design-style: default;
  --primary-color: #1e5a8a;
  --accent-color: #14b8a6;
  --bg-color: #ffffff;
  --text-color: #111827;
}`;
}
