/**
 * Harmony Engine - Color Math
 *
 * Algorithmic color palette generation using HSL color space.
 * Generates harmonious palettes from a seed color based on color theory.
 */

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  l: number; // Lightness: 0-100
}

/**
 * Generated color palette with all required colors
 */
export interface GeneratedPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  // Extended gray scale with primary tint
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Rotate hue by degrees
 */
export function rotateHue(hsl: HSL, degrees: number): HSL {
  return {
    h: (hsl.h + degrees + 360) % 360,
    s: hsl.s,
    l: hsl.l,
  };
}

/**
 * Adjust saturation (positive or negative)
 */
export function adjustSaturation(hsl: HSL, amount: number): HSL {
  return {
    h: hsl.h,
    s: Math.max(0, Math.min(100, hsl.s + amount)),
    l: hsl.l,
  };
}

/**
 * Adjust lightness (positive or negative)
 */
export function adjustLightness(hsl: HSL, amount: number): HSL {
  return {
    h: hsl.h,
    s: hsl.s,
    l: Math.max(0, Math.min(100, hsl.l + amount)),
  };
}

/**
 * Saturate a color
 */
export function saturate(hsl: HSL, amount: number): HSL {
  return adjustSaturation(hsl, amount);
}

/**
 * Desaturate a color
 */
export function desaturate(hsl: HSL, amount: number): HSL {
  return adjustSaturation(hsl, -amount);
}

/**
 * Generate tinted grays - grays with a hint of the primary color
 * This is crucial for a premium, cohesive feel
 */
export function generateTintedGrays(hue: number, tintStrength: number = 0.03): string[] {
  const grays: string[] = [];

  // 10 gray levels from light to dark
  const lightnesses = [98, 96, 91, 83, 64, 45, 33, 23, 15, 9];
  const saturations = [5, 5, 6, 6, 8, 10, 12, 14, 14, 14].map(s => s * tintStrength * 10);

  for (let i = 0; i < lightnesses.length; i++) {
    grays.push(hslToHex({
      h: hue,
      s: saturations[i],
      l: lightnesses[i],
    }));
  }

  return grays;
}

/**
 * Palette generation mood types
 */
export type PaletteMood = 'vibrant' | 'muted' | 'monochrome';

/**
 * Generate a complete color palette from a seed color
 *
 * @param seedColor - The primary brand color in hex format
 * @param mood - The overall feel of the palette
 * @returns A complete color palette with all required colors
 */
export function generatePalette(seedColor: string, mood: PaletteMood): GeneratedPalette {
  const hsl = hexToHSL(seedColor);

  let secondary: HSL;
  let accent: HSL;

  switch (mood) {
    case 'monochrome':
      // Same hue, different lightness/saturation
      secondary = adjustLightness(desaturate(hsl, 10), -15);
      accent = adjustLightness(saturate(hsl, 10), 10);
      break;

    case 'muted':
      // Complementary with reduced saturation
      secondary = desaturate(rotateHue(hsl, 30), 15);
      accent = desaturate(rotateHue(hsl, -30), 10);
      break;

    case 'vibrant':
    default:
      // Full complementary/split-complementary
      secondary = saturate(rotateHue(hsl, 180), 10);
      accent = saturate(rotateHue(hsl, 60), 15);
      break;
  }

  // Generate tinted grays based on primary hue
  const tintStrength = mood === 'vibrant' ? 0.05 : mood === 'muted' ? 0.03 : 0.02;
  const grays = generateTintedGrays(hsl.h, tintStrength);

  // Determine if we need a light or dark theme based on primary color
  const isLightPrimary = hsl.l > 50;

  // Background: very light tinted gray or pure white for most cases
  const background = mood === 'monochrome' && !isLightPrimary
    ? grays[1] // Slightly tinted
    : grays[0]; // Almost white

  // Text: dark tinted gray
  const text = grays[8];

  // Muted: medium gray for secondary text
  const muted = grays[5];

  return {
    primary: hslToHex(hsl),
    secondary: hslToHex(secondary),
    accent: hslToHex(accent),
    background,
    text,
    muted,
    gray50: grays[0],
    gray100: grays[1],
    gray200: grays[2],
    gray300: grays[3],
    gray400: grays[4],
    gray500: grays[5],
    gray600: grays[6],
    gray700: grays[7],
    gray800: grays[8],
    gray900: grays[9],
  };
}

/**
 * Generate a dark mode version of a palette
 */
export function generateDarkPalette(seedColor: string, mood: PaletteMood): GeneratedPalette {
  const lightPalette = generatePalette(seedColor, mood);
  const hsl = hexToHSL(seedColor);

  // Invert the gray scale
  const grays = generateTintedGrays(hsl.h, 0.03);
  const darkGrays = grays.reverse();

  return {
    ...lightPalette,
    background: darkGrays[0], // Dark background
    text: darkGrays[8],       // Light text
    muted: darkGrays[5],      // Medium gray for muted
    gray50: darkGrays[0],
    gray100: darkGrays[1],
    gray200: darkGrays[2],
    gray300: darkGrays[3],
    gray400: darkGrays[4],
    gray500: darkGrays[5],
    gray600: darkGrays[6],
    gray700: darkGrays[7],
    gray800: darkGrays[8],
    gray900: darkGrays[9],
  };
}

/**
 * Get accessible text color (black or white) for a background
 */
export function getContrastTextColor(backgroundColor: string): string {
  const hsl = hexToHSL(backgroundColor);
  return hsl.l > 55 ? '#000000' : '#ffffff';
}

/**
 * Check if two colors have sufficient contrast (WCAG AA)
 */
export function hasAdequateContrast(color1: string, color2: string): boolean {
  const getLuminance = (hex: string): number => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return ratio >= 4.5;
}

/**
 * Adjust a color to meet contrast requirements against a background
 */
export function ensureContrast(foreground: string, background: string): string {
  if (hasAdequateContrast(foreground, background)) {
    return foreground;
  }

  const fgHsl = hexToHSL(foreground);
  const bgHsl = hexToHSL(background);

  // Determine if we need to go lighter or darker
  const shouldDarken = bgHsl.l > 50;

  // Iteratively adjust until we have contrast
  let adjusted = { ...fgHsl };
  for (let i = 0; i < 20; i++) {
    adjusted = adjustLightness(adjusted, shouldDarken ? -5 : 5);
    if (hasAdequateContrast(hslToHex(adjusted), background)) {
      return hslToHex(adjusted);
    }
  }

  // Fallback to black or white
  return shouldDarken ? '#000000' : '#ffffff';
}

/**
 * Generate an analogous color scheme (colors next to each other on the wheel)
 */
export function generateAnalogous(seedColor: string): string[] {
  const hsl = hexToHSL(seedColor);
  return [
    hslToHex(rotateHue(hsl, -30)),
    seedColor,
    hslToHex(rotateHue(hsl, 30)),
  ];
}

/**
 * Generate a triadic color scheme (three evenly spaced colors)
 */
export function generateTriadic(seedColor: string): string[] {
  const hsl = hexToHSL(seedColor);
  return [
    seedColor,
    hslToHex(rotateHue(hsl, 120)),
    hslToHex(rotateHue(hsl, 240)),
  ];
}

/**
 * Generate a split-complementary color scheme
 */
export function generateSplitComplementary(seedColor: string): string[] {
  const hsl = hexToHSL(seedColor);
  return [
    seedColor,
    hslToHex(rotateHue(hsl, 150)),
    hslToHex(rotateHue(hsl, 210)),
  ];
}
