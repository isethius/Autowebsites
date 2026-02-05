/**
 * Texture Overlays
 *
 * CSS/SVG-based texture overlays for adding tactile depth to pages.
 * Supports grain, noise, paper, and fabric textures with vibe-aware defaults.
 */

export type TextureOverlayType = 'grain' | 'noise' | 'paper' | 'fabric';

export type TextureOverlayBlendMode = 'normal' | 'multiply' | 'overlay' | 'soft-light' | 'screen';

export interface TextureOverlayConfig {
  type: TextureOverlayType;
  name: string;
  description: string;
  defaultOpacity: number;
  backgroundSize: string;
  blendMode: TextureOverlayBlendMode;
  svg: string;
}

export interface TextureOverlayOptions {
  /** Explicit texture type override */
  texture?: TextureOverlayType;
  /** Vibe ID to pick an appropriate texture */
  vibeId?: string;
  /** Explicit opacity override (0-1) */
  opacity?: number;
  /** Optional multiplier to adjust default opacity */
  opacityScale?: number;
  /** Override blend mode if needed */
  blendMode?: TextureOverlayBlendMode;
}

export interface TextureOverlayCSSOptions extends TextureOverlayOptions {
  /** Class name applied to the element that should receive the overlay */
  className?: string;
  /** Position mode for the overlay pseudo-element */
  position?: 'fixed' | 'absolute';
  /** Z-index for the overlay */
  zIndex?: number;
  /** Pointer event handling */
  pointerEvents?: 'none' | 'auto';
}

export interface TextureOverlaySelection {
  type: TextureOverlayType;
  name: string;
  description: string;
  opacity: number;
  backgroundSize: string;
  blendMode: TextureOverlayBlendMode;
  svg: string;
  dataUri: string;
}

const TEXTURE_OVERLAY_VARIANTS: Record<TextureOverlayType, TextureOverlayConfig> = {
  grain: {
    type: 'grain',
    name: 'Film Grain',
    description: 'Subtle film grain for organic depth.',
    defaultOpacity: 0.14,
    backgroundSize: '220px 220px',
    blendMode: 'soft-light',
    svg: `
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
  <filter id='grain'>
    <feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#grain)' opacity='0.9'/>
</svg>
`.trim(),
  },
  noise: {
    type: 'noise',
    name: 'High Frequency Noise',
    description: 'Sharper noise for bold, edgy treatments.',
    defaultOpacity: 0.18,
    backgroundSize: '160px 160px',
    blendMode: 'overlay',
    svg: `
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
  <filter id='noise'>
    <feTurbulence type='turbulence' baseFrequency='0.95' numOctaves='1' seed='2'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#noise)' opacity='0.8'/>
</svg>
`.trim(),
  },
  paper: {
    type: 'paper',
    name: 'Paper Fibers',
    description: 'Soft paper texture with gentle fibers.',
    defaultOpacity: 0.08,
    backgroundSize: '260px 260px',
    blendMode: 'multiply',
    svg: `
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
  <filter id='paper'>
    <feTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='2' seed='3' result='noise'/>
    <feColorMatrix type='saturate' values='0'/>
    <feComponentTransfer>
      <feFuncA type='table' tableValues='0 0.6'/>
    </feComponentTransfer>
  </filter>
  <rect width='100%' height='100%' filter='url(#paper)' opacity='0.85'/>
</svg>
`.trim(),
  },
  fabric: {
    type: 'fabric',
    name: 'Fabric Weave',
    description: 'Woven crosshatch for tactile warmth.',
    defaultOpacity: 0.12,
    backgroundSize: '200px 200px',
    blendMode: 'soft-light',
    svg: `
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
  <pattern id='weave' width='40' height='40' patternUnits='userSpaceOnUse'>
    <path d='M0 0L40 40M-20 20L20 -20M20 60L60 20' stroke='#000' stroke-opacity='0.12' stroke-width='1'/>
    <path d='M40 0L0 40M60 20L20 -20M20 60L-20 20' stroke='#000' stroke-opacity='0.08' stroke-width='1'/>
  </pattern>
  <rect width='100%' height='100%' fill='url(#weave)'/>
</svg>
`.trim(),
  },
};

const VIBE_TEXTURE_MAP: Record<string, { type: TextureOverlayType; opacityScale: number }> = {
  executive: { type: 'paper', opacityScale: 0.7 },
  maverick: { type: 'noise', opacityScale: 1.15 },
  elegant: { type: 'paper', opacityScale: 0.75 },
  bold: { type: 'grain', opacityScale: 1.05 },
  friendly: { type: 'fabric', opacityScale: 0.85 },
  minimal: { type: 'paper', opacityScale: 0.4 },
  creative: { type: 'fabric', opacityScale: 1.05 },
  trustworthy: { type: 'paper', opacityScale: 0.6 },
};

function clampOpacity(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeSvg(svg: string): string {
  return svg.replace(/\s+/g, ' ').trim();
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(normalizeSvg(svg))
    .replace(/%0A/g, '')
    .replace(/%0D/g, '');
  return `data:image/svg+xml,${encoded}`;
}

export function getTextureOverlayConfig(type: TextureOverlayType): TextureOverlayConfig {
  return TEXTURE_OVERLAY_VARIANTS[type] || TEXTURE_OVERLAY_VARIANTS.grain;
}

export function getTextureOverlaySVG(type: TextureOverlayType): string {
  return getTextureOverlayConfig(type).svg;
}

export function getTextureOverlayDataUri(type: TextureOverlayType): string {
  return svgToDataUri(getTextureOverlaySVG(type));
}

export function resolveTextureOverlay(options: TextureOverlayOptions = {}): TextureOverlaySelection {
  const vibeSelection = options.vibeId ? VIBE_TEXTURE_MAP[options.vibeId] : undefined;
  const type = options.texture ?? vibeSelection?.type ?? 'grain';
  const config = getTextureOverlayConfig(type);

  const scale = (vibeSelection?.opacityScale ?? 1) * (options.opacityScale ?? 1);
  const opacity = clampOpacity(options.opacity ?? config.defaultOpacity * scale);
  const blendMode = options.blendMode ?? config.blendMode;

  return {
    type,
    name: config.name,
    description: config.description,
    opacity,
    backgroundSize: config.backgroundSize,
    blendMode,
    svg: config.svg,
    dataUri: svgToDataUri(config.svg),
  };
}

export function getTextureOverlayForVibe(
  vibeId: string,
  options: Omit<TextureOverlayOptions, 'vibeId'> = {}
): TextureOverlaySelection {
  return resolveTextureOverlay({ ...options, vibeId });
}

export function generateTextureOverlayCSS(options: TextureOverlayCSSOptions = {}): string {
  const {
    className = 'texture-overlay',
    position = 'fixed',
    zIndex = 9999,
    pointerEvents = 'none',
    ...overlayOptions
  } = options;

  const overlay = resolveTextureOverlay(overlayOptions);

  return `
    .${className} {
      position: relative;
    }

    .${className}::before {
      content: '';
      position: ${position};
      inset: 0;
      background-image: url("${overlay.dataUri}");
      background-repeat: repeat;
      background-size: ${overlay.backgroundSize};
      opacity: ${overlay.opacity};
      mix-blend-mode: ${overlay.blendMode};
      pointer-events: ${pointerEvents};
      z-index: ${zIndex};
    }
  `;
}

export { TEXTURE_OVERLAY_VARIANTS, VIBE_TEXTURE_MAP };
