/**
 * Harmony Engine
 *
 * The Harmony Engine prevents ugly DNA combinations through constraint systems.
 * It solves the "Randomness vs. Quality" problem by ensuring only aesthetically
 * pleasing DNA codes can combine.
 *
 * Key components:
 * - Vibes: Curated constraint sets that define aesthetic directions
 * - Color Math: Algorithmic palette generation using color theory
 * - Grid Patterns: Layout pattern arrays for content-aware grid packing
 */

// Constraints and Vibes
export {
  type Vibe,
  VIBES,
  getVibeForIndustry,
  generateConstrainedDNA,
  generateDNAWithVibe,
  isDNAValidForVibe,
  suggestVibeCompliantDNA,
  getAllVibeIds,
  getVibesForCategory,
} from './constraints';

// Color Math
export {
  type HSL,
  type GeneratedPalette,
  type PaletteMood,
  hexToHSL,
  hslToHex,
  rotateHue,
  adjustSaturation,
  adjustLightness,
  saturate,
  desaturate,
  generateTintedGrays,
  generatePalette,
  generateDarkPalette,
  getContrastTextColor,
  hasAdequateContrast,
  ensureContrast,
  generateAnalogous,
  generateTriadic,
  generateSplitComplementary,
} from './color-math';

// Grid Patterns
export {
  type GridPattern,
  type LayoutType,
  PATTERNS,
  TWO_ROW_PATTERNS,
  selectPattern,
  getPatternColumnCount,
  selectPatternForGrid,
  getLayoutPattern,
  selectTwoRowPattern,
  generatePatternCSS,
} from './grid-patterns';
