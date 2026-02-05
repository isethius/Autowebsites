/**
 * Skin Registry
 *
 * Central export point for all skins. Maps DNA design codes (D1-D12)
 * to appropriate skin modules.
 *
 * Usage:
 * ```typescript
 * import { getSkin, getSkinOverrides } from './skins';
 *
 * const skin = getSkin('D7'); // Returns brutalist skin variables
 * const overrides = getSkinOverrides('D7'); // Returns brutalist CSS overrides
 * ```
 */

import { CSS_VARIABLE_DEFAULTS, CSSVariable, CSS_VARIABLES, generateContractCSS } from './contract';
import { brutalistSkin, getBrutalistOverrides, type SkinVariables } from './brutalist';
import { glassSkin, getGlassOverrides } from './glass';
import { softSkin, getSoftOverrides } from './soft';
import { swissSkin, getSwissOverrides } from './swiss';

// Re-export types
export type { SkinVariables } from './brutalist';
export { CSS_VARIABLES, CSS_VARIABLE_DEFAULTS, generateContractCSS } from './contract';

/**
 * Default skin - used when no specific skin matches
 */
const defaultSkin: SkinVariables = {
  '--radius': '12px',
  '--radius-sm': '8px',
  '--radius-lg': '16px',
  '--radius-pill': '9999px',
  '--shadow-card': '0 4px 20px rgba(0,0,0,0.08)',
  '--backdrop': 'none',
  '--bg-surface': 'var(--background)',
  '--border-width': '1px',
  '--border-color': 'var(--gray-200)',
  '--section-spacing': '80px',
  '--card-padding': '32px',
  '--btn-padding': '16px 32px',
  '--btn-padding-sm': '12px 24px',
  '--nav-padding': '16px 0',
  '--footer-spacing': '60px 0 30px',
  '--gap-xs': '8px',
  '--gap-sm': '16px',
  '--gap-md': '24px',
  '--gap-lg': '40px',
  '--gap-xl': '60px',
  '--text-h1': CSS_VARIABLE_DEFAULTS['--text-h1'],
  '--text-h2': CSS_VARIABLE_DEFAULTS['--text-h2'],
  '--text-h3': CSS_VARIABLE_DEFAULTS['--text-h3'],
  '--text-h4': CSS_VARIABLE_DEFAULTS['--text-h4'],
  '--text-body': CSS_VARIABLE_DEFAULTS['--text-body'],
  '--text-lg': CSS_VARIABLE_DEFAULTS['--text-lg'],
  '--text-sm': CSS_VARIABLE_DEFAULTS['--text-sm'],
  '--icon-size': '56px',
  '--avatar-size': '48px',
  '--btn-text-transform': 'none',
};

/**
 * Maps DNA design codes to skin modules
 *
 * D1: Rounded Soft → soft
 * D2: Sharp Edges → default
 * D3: Elevated Cards → default (with shadow)
 * D4: Flat Minimal → soft
 * D5: Gradient Overlays → default
 * D6: Glass/Neumorphic → glass
 * D7: Brutalist → brutalist
 * D8: Outlined → default (with borders)
 * D9: Gradient Borders → default
 * D10: Swiss Grid → swiss
 * D11: Dark Mode → default
 * D12: Retro Pixel → brutalist
 */
const skinMap: Record<string, SkinVariables> = {
  D1: softSkin,
  D2: defaultSkin,
  D3: {
    ...defaultSkin,
    '--shadow-card': '0 16px 48px rgba(0,0,0,0.15)',
  },
  D4: softSkin,
  D5: defaultSkin,
  D6: glassSkin,
  D7: brutalistSkin,
  D8: {
    ...defaultSkin,
    '--border-width': '2px',
    '--border-color': 'var(--gray-300)',
    '--shadow-card': 'none',
  },
  D9: defaultSkin,
  D10: swissSkin,
  D11: defaultSkin,
  D12: brutalistSkin,
};

/**
 * Maps design codes to CSS override functions
 */
const overrideMap: Record<string, () => string> = {
  D1: getSoftOverrides,
  D4: getSoftOverrides,
  D6: getGlassOverrides,
  D7: getBrutalistOverrides,
  D10: getSwissOverrides,
  D12: getBrutalistOverrides,
};

/**
 * Get the skin variables for a DNA design code
 *
 * @param designCode - DNA design code (D1-D12)
 * @returns Skin variables object with CSS variable overrides
 */
export function getSkin(designCode: string): SkinVariables {
  return skinMap[designCode] || defaultSkin;
}

/**
 * Get CSS overrides for a DNA design code
 * These are structural CSS rules beyond variable values
 *
 * @param designCode - DNA design code (D1-D12)
 * @returns CSS string with additional rules
 */
export function getSkinOverrides(designCode: string): string {
  const getOverrides = overrideMap[designCode];
  return getOverrides ? getOverrides() : '';
}

/**
 * Generate CSS variables from a skin
 *
 * @param skin - Skin variables object
 * @returns CSS string for :root
 */
export function generateSkinCSS(skin: SkinVariables): string {
  const lines = Object.entries(skin)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${lines}\n}`;
}

/**
 * Get complete skin CSS including variables and overrides
 *
 * @param designCode - DNA design code (D1-D12)
 * @returns Complete CSS string
 */
export function getCompleteSkinCSS(designCode: string): string {
  const skin = getSkin(designCode);
  const overrides = getSkinOverrides(designCode);

  return `
    /* Skin Variables for ${designCode} */
    ${generateSkinCSS(skin)}

    /* Skin Overrides */
    ${overrides}
  `;
}

/**
 * Validate that a skin doesn't introduce invalid variable names
 * Useful for development/testing
 */
export function validateSkin(skin: SkinVariables): { valid: boolean; invalidVars: string[] } {
  const invalidVars: string[] = [];

  for (const key of Object.keys(skin)) {
    if (!CSS_VARIABLES.includes(key as CSSVariable)) {
      invalidVars.push(key);
    }
  }

  return {
    valid: invalidVars.length === 0,
    invalidVars,
  };
}

/**
 * Get all available skin names
 */
export function getAvailableSkins(): string[] {
  return Object.keys(skinMap);
}
