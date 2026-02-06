/**
 * DNA-Based Style Generator
 *
 * Generates CSS variables and styles from DNA codes.
 * This connects the DNA system to actual visual output.
 *
 * KEY INTEGRATION POINTS:
 * - Skins: Design-code (D1-D12) based CSS variable overrides
 * - Contract: Standardized CSS variable names (prevents typos)
 * - Font Loader: Dynamic Google Fonts based on typography (T1-T4)
 */

import { ColorPalette } from '../../../../overnight/types';
import {
  DNACode,
  DESIGN_VARIANTS,
  TYPOGRAPHY_VARIANTS,
  MOTION_VARIANTS,
  TEXTURE_VARIANTS,
  RADIUS_VARIANTS,
  BORDER_VARIANTS,
  HOVER_VARIANTS,
} from '../../../../themes/variance-planner';
import { hexToHSL } from '../../../../themes/engine/harmony/color-math';
import { getSkin, getSkinOverrides, generateSkinCSS } from '../../../../themes/skins';
import { generateContractCSS, CSS_VARIABLE_DEFAULTS } from '../../../../themes/skins/contract';

export interface DNAStyleOutput {
  css: string;
  fontImports: string;
  /** Google Fonts URL for dynamic loading */
  fontsUrl: string;
  /** Preconnect links for Google Fonts (should be in <head>) */
  fontPreconnect: string;
}

/**
 * Get default DNA code if none provided
 */
export function getDefaultDNA(): DNACode {
  return {
    hero: 'H1',
    layout: 'L1',
    color: 'C1',
    nav: 'N1',
    design: 'D1',
    typography: 'T1',
    motion: 'M1',
  };
}

/**
 * Typography configuration for each T code
 */
const TYPOGRAPHY_CONFIG: Record<string, {
  url: string;
  headingFont: string;
  bodyFont: string;
}> = {
  T1: {
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    headingFont: 'Inter',
    bodyFont: 'Inter',
  },
  T2: {
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap',
    headingFont: 'Playfair Display',
    bodyFont: 'Source Sans Pro',
  },
  T3: {
    url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    headingFont: 'Space Mono',
    bodyFont: 'IBM Plex Sans',
  },
  T4: {
    url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap',
    headingFont: 'Nunito',
    bodyFont: 'Nunito',
  },
};

/**
 * Generate Google Fonts URL for typography variant
 */
export function getGoogleFontsUrl(typography: string): string {
  return TYPOGRAPHY_CONFIG[typography]?.url || TYPOGRAPHY_CONFIG.T1.url;
}

/**
 * Generate Google Fonts preconnect links (improves loading performance)
 */
export function getGoogleFontsPreconnect(): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
}

/**
 * Generate Google Fonts import for typography variant
 * @deprecated Use getGoogleFontsUrl() instead
 */
export function generateFontImports(typography: string): string {
  return getGoogleFontsUrl(typography);
}

/**
 * Generate CSS variables from DNA and palette
 *
 * This function integrates:
 * 1. Color palette variables
 * 2. Skin-based design overrides (D1-D12)
 * 3. Contract-defined CSS variables with clamp() typography
 * 4. Global button styles (.btn, .btn-primary, .btn-secondary)
 * 5. Motion/animation styles
 */
export function generateDNAStyles(dna: DNACode, palette: ColorPalette): DNAStyleOutput {
  const design = DESIGN_VARIANTS[dna.design] || DESIGN_VARIANTS.D1;
  const typographyCode = dna.typography || 'T1';
  const typography = TYPOGRAPHY_VARIANTS[typographyCode] || TYPOGRAPHY_VARIANTS.T1;
  const motion = MOTION_VARIANTS[dna.motion || 'M1'] || MOTION_VARIANTS.M1;

  // Get Google Fonts URL and preconnect
  const fontsUrl = getGoogleFontsUrl(typographyCode);
  const fontPreconnect = getGoogleFontsPreconnect();
  const fontImports = fontsUrl; // For backwards compatibility

  // Get typography config for font names
  const typoConfig = TYPOGRAPHY_CONFIG[typographyCode] || TYPOGRAPHY_CONFIG.T1;

  // Build font family strings
  const headingFontStack = `'${typoConfig.headingFont}', -apple-system, BlinkMacSystemFont, sans-serif`;
  const bodyFontStack = `'${typoConfig.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`;

  // Build motion CSS
  const transitionDuration = motion.duration;
  const hoverTransform = getHoverTransform(motion.hover);
  const hoverBoxShadow = getHoverBoxShadow(motion.hover, design.style);
  const entranceAnimation = getEntranceAnimation(motion.entrance, motion.intensity);

  // Get skin variables and overrides for this design code
  const skin = getSkin(dna.design);
  const skinOverrides = getSkinOverrides(dna.design);

  const css = `
    :root {
      /* ========== COLOR PALETTE ========== */
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};

      /* Standard Colors */
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

      /* Status Colors */
      --success: #22c55e;
      --warning: #f59e0b;
      --error: #ef4444;
      --emergency: #dc2626;

      /* ========== TYPOGRAPHY (clamp() ONLY here, not in components!) ========== */
      --text-h1: clamp(36px, 5vw, 56px);
      --text-h2: clamp(28px, 4vw, 40px);
      --text-h3: clamp(22px, 3vw, 28px);
      --text-h4: clamp(18px, 2.5vw, 24px);
      --text-body: clamp(16px, 1.5vw, 18px);
      --text-lg: 20px;
      --text-sm: 14px;

      /* Font Families */
      --font-heading: ${headingFontStack};
      --font-body: ${bodyFontStack};
      --heading-weight: ${typography.headingWeight};
      --letter-spacing: ${typography.letterSpacing};

      /* ========== SPACING SCALE ========== */
      --section-spacing: ${skin['--section-spacing'] || '140px'};
      --card-padding: ${skin['--card-padding'] || '40px'};
      --btn-padding: ${skin['--btn-padding'] || '16px 32px'};
      --btn-padding-sm: ${skin['--btn-padding-sm'] || '12px 24px'};
      --nav-padding: ${skin['--nav-padding'] || '24px 0'};
      --footer-spacing: ${skin['--footer-spacing'] || '100px 0 40px'};

      /* Gap Scale */
      --gap-xs: ${skin['--gap-xs'] || '8px'};
      --gap-sm: ${skin['--gap-sm'] || '16px'};
      --gap-md: ${skin['--gap-md'] || '24px'};
      --gap-lg: ${skin['--gap-lg'] || '40px'};
      --gap-xl: ${skin['--gap-xl'] || '60px'};

      /* ========== RADIUS SCALE (from Skin) ========== */
      --radius: ${skin['--radius'] || '12px'};
      --radius-sm: ${skin['--radius-sm'] || '8px'};
      --radius-md: ${skin['--radius'] || '12px'};
      --radius-lg: ${skin['--radius-lg'] || '16px'};
      --radius-pill: ${skin['--radius-pill'] || '9999px'};

      /* Legacy support */
      --border-radius: var(--radius, 12px);
      --border-radius-sm: var(--radius-sm, 8px);
      --border-radius-lg: var(--radius-lg, 16px);

      /* ========== SHADOWS & EFFECTS (from Skin) ========== */
      --shadow-card: ${skin['--shadow-card'] || '0 4px 20px rgba(0,0,0,0.08)'};
      --backdrop: ${skin['--backdrop'] || 'none'};
      --bg-surface: ${skin['--bg-surface'] || 'var(--background, #ffffff)'};

      /* Legacy support */
      --box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));

      /* ========== BORDERS (from Skin) ========== */
      --border-width: ${skin['--border-width'] || '0'};
      --border-color: ${skin['--border-color'] || 'transparent'};

      /* ========== SIZES ========== */
      --icon-size: ${skin['--icon-size'] || '56px'};
      --avatar-size: ${skin['--avatar-size'] || '48px'};

      /* ========== TRANSFORMS (from Skin) ========== */
      --btn-text-transform: ${skin['--btn-text-transform'] || 'none'};

      /* ========== MOTION DNA (M1-M3) ========== */
      --transition-duration: ${transitionDuration};
      --hover-transform: ${hoverTransform};
      --hover-shadow: ${hoverBoxShadow};

      /* Design Style Tag (for debugging) */
      --design-style: '${design.style}';
    }

    /* ========== BASE TYPOGRAPHY ========== */
    body {
      font-family: var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
      font-size: var(--text-body, 16px);
      line-height: 1.6;
      color: var(--text, #111827);
      background: var(--background, #ffffff);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
      font-weight: var(--heading-weight, 800);
      letter-spacing: var(--letter-spacing, -0.02em);
      line-height: 1.2;
    }

    h1 { font-size: var(--text-h1, 48px); }
    h2 { font-size: var(--text-h2, 36px); }
    h3 { font-size: var(--text-h3, 28px); }
    h4 { font-size: var(--text-h4, 24px); }

    /* ========== GLOBAL BUTTON STYLES ========== */
    /* Components should use .btn .btn-primary instead of custom button classes */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--gap-xs, 8px);
      padding: var(--btn-padding, 16px 32px);
      font-family: var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
      font-size: var(--text-body, 16px);
      font-weight: 600;
      text-transform: var(--btn-text-transform, none);
      text-decoration: none;
      border: var(--border-width, 0) solid var(--border-color, transparent);
      border-radius: var(--radius, 12px);
      cursor: pointer;
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .btn-sm {
      padding: var(--btn-padding-sm, 12px 24px);
      font-size: var(--text-sm, 14px);
    }

    .btn-primary {
      background: var(--primary, #1e5a8a);
      color: var(--white, #ffffff);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
    }

    .btn-primary:hover {
      transform: var(--hover-transform, translateY(-2px));
      box-shadow: var(--hover-shadow, 0 8px 30px rgba(0,0,0,0.12));
      opacity: 0.95;
    }

    .btn-secondary {
      background: transparent;
      color: var(--primary, #1e5a8a);
      border: 2px solid var(--primary, #1e5a8a);
    }

    .btn-secondary:hover {
      background: var(--primary, #1e5a8a);
      color: var(--white, #ffffff);
      transform: var(--hover-transform, translateY(-2px));
    }

    .btn-ghost {
      background: transparent;
      color: var(--text, #111827);
      border: none;
    }

    .btn-ghost:hover {
      background: var(--gray-100, #f3f4f6);
    }

    /* ========== DNA-AWARE CARD STYLES ========== */
    .dna-card,
    .card {
      background: var(--bg-surface, var(--white, #ffffff));
      border-radius: var(--radius, 12px);
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
      border: var(--border-width, 0) solid var(--border-color, transparent);
      transition: transform var(--transition-duration, 0.2s) ease, box-shadow var(--transition-duration, 0.2s) ease;
    }

    .dna-card:hover,
    .card:hover {
      transform: var(--hover-transform, translateY(-2px));
      box-shadow: var(--hover-shadow, 0 8px 30px rgba(0,0,0,0.12));
    }

    /* ========== DNA-AWARE BUTTON STYLES (legacy) ========== */
    .dna-btn {
      border-radius: var(--radius-sm, 8px);
      transition: all var(--transition-duration, 0.2s) ease;
    }

    .dna-btn:hover {
      transform: var(--hover-transform, translateY(-2px));
    }

    /* ========== ENTRANCE ANIMATIONS ========== */
    ${entranceAnimation}

    /* ========== SKIN OVERRIDES ========== */
    ${skinOverrides}

    /* ========== DESIGN-SPECIFIC OVERRIDES ========== */
    ${getDesignOverrides(design.style)}
  `;

  return { css, fontImports, fontsUrl, fontPreconnect };
}

/**
 * Get smaller border radius for buttons/inputs
 */
function getSmallRadius(mainRadius: string): string {
  const map: Record<string, string> = {
    '0': '0',
    '4px': '2px',
    '8px': '4px',
    '12px': '6px',
    '16px': '8px',
    '20px': '10px',
    '9999px': '9999px', // Pill stays pill
  };
  return map[mainRadius] || '6px';
}

/**
 * Get larger border radius for hero/sections
 */
function getLargeRadius(mainRadius: string): string {
  const map: Record<string, string> = {
    '0': '0',
    '4px': '8px',
    '8px': '16px',
    '12px': '24px',
    '16px': '32px',
    '20px': '40px',
    '9999px': '9999px',
  };
  return map[mainRadius] || '16px';
}

/**
 * Get hover transform based on motion type
 */
function getHoverTransform(hover: string): string {
  switch (hover) {
    case 'lift':
      return 'translateY(-4px)';
    case 'scale':
      return 'scale(1.02)';
    case 'glow':
      return 'translateY(-2px)';
    default:
      return 'translateY(-2px)';
  }
}

/**
 * Get hover box shadow based on motion and design
 */
function getHoverBoxShadow(hover: string, designStyle: string): string {
  if (hover === 'glow') {
    return '0 0 30px rgba(var(--primary-rgb, 59, 130, 246), 0.4)';
  }

  switch (designStyle) {
    case 'brutalist':
      return '12px 12px 0 #000';
    case 'neumorphic':
      return '12px 12px 24px #d1d1d1, -12px -12px 24px #ffffff';
    case 'flat':
    case 'sharp':
      return 'none';
    case 'elevated':
      return '0 30px 60px rgba(0,0,0,0.3)';
    default:
      return '0 16px 48px rgba(0,0,0,0.15)';
  }
}

/**
 * Get entrance animation CSS
 */
function getEntranceAnimation(entrance: string, intensity: string): string {
  const distance = intensity === 'dramatic' ? '40px' : intensity === 'moderate' ? '20px' : '10px';
  const scale = intensity === 'dramatic' ? '0.9' : intensity === 'moderate' ? '0.95' : '0.98';
  const duration = intensity === 'dramatic' ? '0.6s' : intensity === 'moderate' ? '0.4s' : '0.3s';

  switch (entrance) {
    case 'fade':
      return `
        @keyframes dna-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dna-animate { animation: dna-fade-in ${duration} ease-out forwards; }
      `;
    case 'slide':
      return `
        @keyframes dna-slide-in {
          from { opacity: 0; transform: translateY(${distance}); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dna-animate { animation: dna-slide-in ${duration} ease-out forwards; }
      `;
    case 'scale':
      return `
        @keyframes dna-scale-in {
          from { opacity: 0; transform: scale(${scale}); }
          to { opacity: 1; transform: scale(1); }
        }
        .dna-animate { animation: dna-scale-in ${duration} ease-out forwards; }
      `;
    default:
      return `
        @keyframes dna-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dna-animate { animation: dna-fade-in ${duration} ease-out forwards; }
      `;
  }
}

/**
 * Generate entrance animation classes based on motion DNA
 *
 * These classes can be applied directly to section elements to trigger
 * the appropriate animation based on the motion setting.
 *
 * M1 (subtle) = fade
 * M2 (moderate) = slide
 * M3 (dramatic) = scale
 *
 * @returns CSS string with all animation keyframes and class selectors
 */
export function generateEntranceAnimationClasses(): string {
  return `
    /* DNA Entrance Animation Keyframes */
    @keyframes dna-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dna-slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes dna-scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Animation Class Selectors */
    .dna-fade-in {
      animation: dna-fade-in 0.6s ease-out forwards;
    }

    .dna-slide-in {
      animation: dna-slide-in 0.6s ease-out forwards;
    }

    .dna-scale-in {
      animation: dna-scale-in 0.6s ease-out forwards;
    }

    /* Staggered animation delays for child elements */
    .dna-stagger > *:nth-child(1) { animation-delay: 0s; }
    .dna-stagger > *:nth-child(2) { animation-delay: 0.1s; }
    .dna-stagger > *:nth-child(3) { animation-delay: 0.2s; }
    .dna-stagger > *:nth-child(4) { animation-delay: 0.3s; }
    .dna-stagger > *:nth-child(5) { animation-delay: 0.4s; }
    .dna-stagger > *:nth-child(6) { animation-delay: 0.5s; }
    .dna-stagger > *:nth-child(n+7) { animation-delay: 0.6s; }

    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .dna-fade-in,
      .dna-slide-in,
      .dna-scale-in {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }
  `;
}

/**
 * Get the animation class name based on motion DNA code
 *
 * @param motion - Motion DNA code (M1, M2, or M3)
 * @returns Animation class name to apply to elements
 */
export function getAnimationClass(motion: string): string {
  switch (motion) {
    case 'M3':
      return 'dna-scale-in';
    case 'M2':
      return 'dna-slide-in';
    case 'M1':
    default:
      return 'dna-fade-in';
  }
}

/**
 * Get design-specific CSS overrides
 */
function getDesignOverrides(style: string): string {
  switch (style) {
    case 'brutalist':
      return `
        .dna-card { border: 3px solid var(--text, #111827); }
        .dna-btn { border: 2px solid currentColor; text-transform: uppercase; }
        h1, h2, h3 { text-transform: uppercase; }
      `;
    case 'glass':
      return `
        .dna-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `;
    case 'neumorphic':
      return `
        .dna-card {
          background: var(--gray-50, #f9fafb);
          border: none;
        }
        .dna-btn {
          background: var(--gray-50, #f9fafb);
          box-shadow: 4px 4px 8px #d1d1d1, -4px -4px 8px #ffffff;
        }
      `;
    case 'outlined':
      return `
        .dna-card {
          background: transparent;
          border: 2px solid var(--gray-200, #e5e7eb);
          box-shadow: none;
        }
        .dna-card:hover {
          border-color: var(--primary, #1e5a8a);
        }
      `;
    case 'gradient-border':
      return `
        .dna-card {
          position: relative;
          background: var(--white, #ffffff);
        }
        .dna-card::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          border-radius: inherit;
          background: linear-gradient(135deg, var(--primary, #1e5a8a), var(--accent, #14b8a6));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `;
    case 'retro':
      return `
        .dna-card { border: 2px solid var(--text, #111827); }
        .dna-btn { border: 2px solid currentColor; }
        body { image-rendering: pixelated; }
      `;
    default:
      return '';
  }
}

// =============================================================================
// AWWWARDS-LEVEL STYLE GENERATORS
// =============================================================================

/**
 * Generate texture overlay CSS
 * Creates grain, mesh-gradient, dots, or clean backgrounds
 */
export function generateTextureCSS(texture: string): string {
  const textureData = TEXTURE_VARIANTS[texture] || TEXTURE_VARIANTS.X4;

  switch (textureData.type) {
    case 'grain':
      return `
        .dna-texture::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          opacity: ${textureData.intensity};
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `;

    case 'mesh-gradient':
      return `
        .dna-texture {
          background-image:
            radial-gradient(at 40% 20%, var(--primary, #1e5a8a) 0px, transparent 50%),
            radial-gradient(at 80% 0%, var(--secondary, #1e40af) 0px, transparent 50%),
            radial-gradient(at 0% 50%, var(--accent, #14b8a6) 0px, transparent 50%),
            radial-gradient(at 80% 50%, var(--primary, #1e5a8a) 0px, transparent 50%),
            radial-gradient(at 0% 100%, var(--secondary, #1e40af) 0px, transparent 50%),
            radial-gradient(at 80% 100%, var(--accent, #14b8a6) 0px, transparent 50%);
          background-size: 100% 100%;
        }
      `;

    case 'dots':
      return `
        .dna-texture {
          background-image: radial-gradient(var(--gray-300, #d1d5db) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `;

    case 'clean':
    default:
      return '';
  }
}

/**
 * Generate border style CSS based on DNA
 */
export function generateBorderCSS(border: string): string {
  const borderData = BORDER_VARIANTS[border] || BORDER_VARIANTS.B1;

  switch (borderData.style) {
    case 'solid':
      return `
        .dna-bordered {
          border: ${borderData.width} solid var(--gray-200, #e5e7eb);
        }
        .dna-bordered:hover {
          border-color: var(--primary, #1e5a8a);
        }
      `;

    case 'double-offset':
      return `
        .dna-bordered {
          border: ${borderData.width} solid var(--text, #111827);
          position: relative;
        }
        .dna-bordered::after {
          content: '';
          position: absolute;
          inset: -6px;
          border: ${borderData.width} solid var(--primary, #1e5a8a);
          pointer-events: none;
        }
      `;

    case 'none':
    default:
      return '';
  }
}

/**
 * Generate hover effect CSS based on DNA
 */
export function generateHoverCSS(hover: string, primaryColor: string): string {
  const hoverData = HOVER_VARIANTS[hover] || HOVER_VARIANTS.V1;

  let effectCSS = '';
  if (hoverData.effect === 'shadow') {
    effectCSS = 'box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);';
  } else if (hoverData.effect === 'glow') {
    effectCSS = `box-shadow: 0 0 30px ${primaryColor}40;`;
  }

  return `
    .dna-hoverable {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .dna-hoverable:hover {
      transform: ${hoverData.transform};
      ${effectCSS}
    }
  `;
}

/**
 * Generate image grading CSS to match the palette
 * Creates Instagram-filter-like effects to harmonize user photos with the theme
 */
export function generateImageGrading(palette: ColorPalette, design: string): string {
  const hsl = hexToHSL(palette.primary);
  const hue = hsl.h;

  // Brutalist themes use high contrast + blend modes
  if (design === 'D7' || design === 'D12') {
    return `
      img.theme-graded {
        filter: grayscale(100%) contrast(120%);
        mix-blend-mode: multiply;
      }
      img.theme-graded-subtle {
        filter: grayscale(30%) contrast(110%);
      }
    `;
  }

  // Elegant/soft themes use subtle sepia + hue shift
  if (['D1', 'D5', 'D6'].includes(design)) {
    return `
      img.theme-graded {
        filter: sepia(15%) contrast(105%) hue-rotate(${hue}deg) saturate(90%);
      }
      img.theme-graded-subtle {
        filter: sepia(8%) contrast(102%) hue-rotate(${Math.round(hue / 2)}deg);
      }
    `;
  }

  // Bold themes use saturation boost
  if (['D2', 'D3', 'D10'].includes(design)) {
    return `
      img.theme-graded {
        filter: saturate(120%) contrast(110%);
      }
      img.theme-graded-subtle {
        filter: saturate(108%) contrast(105%);
      }
    `;
  }

  // Default: subtle color harmony
  return `
    img.theme-graded {
      filter: saturate(105%) contrast(105%) hue-rotate(${Math.round(hue / 4)}deg);
    }
    img.theme-graded-subtle {
      filter: saturate(102%) contrast(102%);
    }
  `;
}

/**
 * Generate radius CSS overrides based on DNA
 */
export function generateRadiusCSS(radius: string): string {
  const radiusData = RADIUS_VARIANTS[radius] || RADIUS_VARIANTS.R2;

  const baseRadius = radiusData.value;
  const smallRadius = radiusData.multiplier === 0 ? '0' :
    radiusData.multiplier === 999 ? '9999px' :
    `${Math.round(parseInt(baseRadius) * 0.5)}px`;
  const largeRadius = radiusData.multiplier === 0 ? '0' :
    radiusData.multiplier === 999 ? '9999px' :
    `${Math.round(parseInt(baseRadius) * 2)}px`;

  return `
    :root {
      --radius-sm: ${smallRadius};
      --radius-md: ${baseRadius};
      --radius-lg: ${largeRadius};
    }

    .dna-card {
      border-radius: var(--radius-md, var(--radius, 12px));
    }

    .dna-btn {
      border-radius: var(--radius-sm, 8px);
    }

    .dna-section {
      border-radius: var(--radius-lg, 16px);
    }
  `;
}

/**
 * Generate complete Awwwards-level DNA styles
 * Combines all new DNA tokens into cohesive CSS
 */
export function generateAwwwardsDNAStyles(dna: DNACode, palette: ColorPalette): string {
  const texture = dna.texture || 'X4';
  const radius = dna.radius || 'R2';
  const border = dna.border || 'B1';
  const hover = dna.hover || 'V1';
  const design = dna.design || 'D1';

  return `
    /* Texture Layer */
    ${generateTextureCSS(texture)}

    /* Radius Overrides */
    ${generateRadiusCSS(radius)}

    /* Border Styles */
    ${generateBorderCSS(border)}

    /* Hover Effects */
    ${generateHoverCSS(hover, palette.primary)}

    /* Image Grading */
    ${generateImageGrading(palette, design)}
  `;
}

/**
 * Generate complete base styles with DNA integration
 */
export function generateCompleteDNAStyles(dna: DNACode, palette: ColorPalette): string {
  const { css } = generateDNAStyles(dna, palette);
  const entranceAnimations = generateEntranceAnimationClasses();

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    ${css}

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button {
      font-family: inherit;
      cursor: pointer;
    }

    ul, ol {
      list-style: none;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .container-sm {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .container-lg {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 36px;
      margin-bottom: 12px;
      color: var(--text, #111827);
    }

    .section-header p {
      color: var(--muted, #6b7280);
      font-size: 18px;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Entrance Animations */
    ${entranceAnimations}

    /* Responsive */
    @media (max-width: 1024px) {
      .section-header h2 { font-size: 32px; }
    }

    @media (max-width: 768px) {
      .section-header h2 { font-size: 28px; }
      .section-header p { font-size: 16px; }
      .container { padding: 0 16px; }
    }
  `;
}
