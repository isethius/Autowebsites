/**
 * DNA-based Theme Variance Planner
 *
 * DNA Codes:
 * H1-H12: Hero layouts (full-width, split, centered, minimal, etc.)
 * L1-L12: Layout systems (grid, masonry, cards, lists, etc.)
 * C1-C12: Color schemes (light, dark, vibrant, muted, etc.)
 * N1-N9:  Navigation styles (top bar, sidebar, hamburger, etc.)
 * D1-D12: Design elements (rounded, sharp, shadow, flat, etc.)
 */

export interface DNACode {
  hero: string;        // H1-H12
  layout: string;      // L1-L12
  color: string;       // C1-C12
  nav: string;         // N1-N9
  design: string;      // D1-D12
  typography?: string; // T1-T4
  motion?: string;     // M1-M3
  // New Awwwards-level genes
  texture?: string;    // X1-X4: grain, mesh-gradient, dots, clean
  radius?: string;     // R1-R4: sharp, smooth, playful, pill
  border?: string;     // B1-B4: none, thin, thick-brutalist, double-offset
  hover?: string;      // V1-V4: lift, glow, skew, cursor-follow
  chaos?: number;      // 0-1: controls asymmetry and randomness
}

export interface ThemeVariance {
  id: string;
  name: string;
  dna: DNACode;
  description: string;
}

// Hero layouts
export const HERO_VARIANTS: Record<string, { name: string; description: string }> = {
  H1: { name: 'Full-Width Impact', description: 'Full-screen hero with centered content' },
  H2: { name: 'Split Screen', description: 'Image on one side, text on other' },
  H3: { name: 'Minimal Header', description: 'Compact hero with subtle background' },
  H4: { name: 'Video Background', description: 'Hero with video/animated background' },
  H5: { name: 'Gradient Overlay', description: 'Image with gradient text overlay' },
  H6: { name: 'Particle Effect', description: 'Interactive particle background' },
  H7: { name: 'Carousel Hero', description: 'Sliding images with content' },
  H8: { name: 'Asymmetric Split', description: 'Uneven split with dynamic shapes' },
  H9: { name: 'Text Only', description: 'Bold typography, no images' },
  H10: { name: 'Product Showcase', description: 'Floating product image hero' },
  H11: { name: 'Illustration Style', description: 'Custom illustration background' },
  H12: { name: 'Geometric Shapes', description: 'Abstract geometric patterns' }
};

// Layout systems
export const LAYOUT_VARIANTS: Record<string, { name: string; description: string }> = {
  L1: { name: 'Classic Grid', description: '12-column responsive grid' },
  L2: { name: 'Masonry', description: 'Pinterest-style masonry layout' },
  L3: { name: 'Card Grid', description: 'Uniform card-based layout' },
  L4: { name: 'Magazine', description: 'Editorial-style mixed sizes' },
  L5: { name: 'Single Column', description: 'Clean single-column flow' },
  L6: { name: 'Sidebar Layout', description: 'Main content with sidebar' },
  L7: { name: 'Asymmetric Grid', description: 'Creative uneven grid' },
  L8: { name: 'Full-Width Sections', description: 'Stacked full-width blocks' },
  L9: { name: 'Timeline', description: 'Vertical timeline layout' },
  L10: { name: 'Bento Box', description: 'Mixed-size tile grid' },
  L11: { name: 'Professional Services', description: 'Two-column alternating service sections with icons and images' },
  L12: { name: 'Horizontal Scroll', description: 'Horizontal scrolling sections' }
};

// Color schemes
export const COLOR_VARIANTS: Record<string, { name: string; colors: { bg: string; text: string; primary: string; accent: string } }> = {
  C1: { name: 'Light Modern', colors: { bg: '#ffffff', text: '#1a1a1a', primary: '#3b82f6', accent: '#8b5cf6' } },
  C2: { name: 'Dark Mode', colors: { bg: '#0f172a', text: '#f1f5f9', primary: '#60a5fa', accent: '#a78bfa' } },
  C3: { name: 'Warm Earth', colors: { bg: '#fef7ed', text: '#451a03', primary: '#ea580c', accent: '#dc2626' } },
  C4: { name: 'Cool Ocean', colors: { bg: '#f0fdff', text: '#164e63', primary: '#0891b2', accent: '#0d9488' } },
  C5: { name: 'Forest Green', colors: { bg: '#f0fdf4', text: '#14532d', primary: '#16a34a', accent: '#65a30d' } },
  C6: { name: 'Royal Purple', colors: { bg: '#faf5ff', text: '#3b0764', primary: '#9333ea', accent: '#c026d3' } },
  C7: { name: 'Sunset Gradient', colors: { bg: '#fff7ed', text: '#7c2d12', primary: '#f97316', accent: '#ec4899' } },
  C8: { name: 'Monochrome', colors: { bg: '#fafafa', text: '#171717', primary: '#525252', accent: '#737373' } },
  C9: { name: 'Neon Cyber', colors: { bg: '#0a0a0a', text: '#fafafa', primary: '#22d3ee', accent: '#f472b6' } },
  C10: { name: 'Pastel Soft', colors: { bg: '#fefce8', text: '#422006', primary: '#fbbf24', accent: '#fb7185' } },
  C11: { name: 'Corporate Blue', colors: { bg: '#f8fafc', text: '#0f172a', primary: '#1d4ed8', accent: '#6366f1' } },
  C12: { name: 'Vintage Sepia', colors: { bg: '#faf5f0', text: '#44403c', primary: '#a16207', accent: '#b91c1c' } }
};

// Navigation styles
export const NAV_VARIANTS: Record<string, { name: string; description: string }> = {
  N1: { name: 'Fixed Top Bar', description: 'Standard sticky navigation' },
  N2: { name: 'Transparent Header', description: 'See-through nav over hero' },
  N3: { name: 'Hamburger Menu', description: 'Mobile-style menu icon' },
  N4: { name: 'Sidebar Nav', description: 'Vertical side navigation' },
  N5: { name: 'Bottom Tab Bar', description: 'Mobile app-style tabs' },
  N6: { name: 'Mega Menu', description: 'Expanded dropdown menus' },
  N7: { name: 'Floating Nav', description: 'Rounded floating bar' },
  N8: { name: 'Split Logo', description: 'Logo center, nav split' },
  N9: { name: 'Minimal Links', description: 'Sparse top-right links' }
};

// Design elements
export const DESIGN_VARIANTS: Record<string, { name: string; borderRadius: string; shadow: string; style: string }> = {
  D1: { name: 'Rounded Soft', borderRadius: '16px', shadow: '0 4px 20px rgba(0,0,0,0.1)', style: 'soft' },
  D2: { name: 'Sharp Edges', borderRadius: '0', shadow: 'none', style: 'sharp' },
  D3: { name: 'Heavy Shadow', borderRadius: '8px', shadow: '0 25px 50px rgba(0,0,0,0.25)', style: 'elevated' },
  D4: { name: 'Flat Minimal', borderRadius: '4px', shadow: 'none', style: 'flat' },
  D5: { name: 'Neumorphic', borderRadius: '20px', shadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff', style: 'neumorphic' },
  D6: { name: 'Glassmorphism', borderRadius: '16px', shadow: '0 8px 32px rgba(0,0,0,0.1)', style: 'glass' },
  D7: { name: 'Brutalist', borderRadius: '0', shadow: '8px 8px 0 #000', style: 'brutalist' },
  D8: { name: 'Pill Shapes', borderRadius: '9999px', shadow: '0 4px 12px rgba(0,0,0,0.15)', style: 'pill' },
  D9: { name: 'Outlined', borderRadius: '8px', shadow: 'none', style: 'outlined' },
  D10: { name: 'Gradient Borders', borderRadius: '12px', shadow: '0 4px 15px rgba(0,0,0,0.1)', style: 'gradient-border' },
  D11: { name: 'Layered Cards', borderRadius: '12px', shadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)', style: 'layered' },
  D12: { name: 'Retro Pixel', borderRadius: '0', shadow: '4px 4px 0 #000', style: 'retro' }
};

// Typography variants
export const TYPOGRAPHY_VARIANTS: Record<string, { name: string; headingFont: string; bodyFont: string; style: string; headingWeight: string; letterSpacing: string }> = {
  T1: { name: 'Modern Sans', headingFont: 'Inter', bodyFont: 'Inter', style: 'modern', headingWeight: '800', letterSpacing: '-0.02em' },
  T2: { name: 'Elegant Serif', headingFont: 'Playfair Display', bodyFont: 'Source Sans Pro', style: 'elegant', headingWeight: '700', letterSpacing: '0' },
  T3: { name: 'Brutalist Mono', headingFont: 'Space Mono', bodyFont: 'IBM Plex Sans', style: 'brutalist', headingWeight: '700', letterSpacing: '0.05em' },
  T4: { name: 'Playful Rounded', headingFont: 'Nunito', bodyFont: 'Nunito', style: 'playful', headingWeight: '800', letterSpacing: '0' },
};

// Motion/animation variants
export const MOTION_VARIANTS: Record<string, { name: string; entrance: string; hover: string; intensity: string; duration: string }> = {
  M1: { name: 'Subtle', entrance: 'fade', hover: 'lift', intensity: 'subtle', duration: '0.2s' },
  M2: { name: 'Dynamic', entrance: 'slide', hover: 'lift', intensity: 'moderate', duration: '0.3s' },
  M3: { name: 'Dramatic', entrance: 'scale', hover: 'glow', intensity: 'dramatic', duration: '0.4s' },
};

// =============================================================================
// AWWWARDS-LEVEL DNA TOKENS
// =============================================================================

// Texture variants - background textures for premium feel
export const TEXTURE_VARIANTS: Record<string, { name: string; type: string; intensity: number; description: string }> = {
  X1: { name: 'Film Grain', type: 'grain', intensity: 0.15, description: 'Subtle film grain overlay for organic feel' },
  X2: { name: 'Mesh Gradient', type: 'mesh-gradient', intensity: 0.8, description: 'Smooth multi-color gradient blobs' },
  X3: { name: 'Dot Pattern', type: 'dots', intensity: 0.1, description: 'Subtle halftone dot pattern' },
  X4: { name: 'Clean', type: 'clean', intensity: 0, description: 'No texture, pure solid colors' },
};

// Radius variants - border radius presets
export const RADIUS_VARIANTS: Record<string, { name: string; value: string; multiplier: number; description: string }> = {
  R1: { name: 'Sharp', value: '0px', multiplier: 0, description: 'No border radius, sharp corners' },
  R2: { name: 'Smooth', value: '8px', multiplier: 1, description: 'Standard smooth corners' },
  R3: { name: 'Playful', value: '24px', multiplier: 3, description: 'Extra rounded, friendly feel' },
  R4: { name: 'Pill', value: '9999px', multiplier: 999, description: 'Fully rounded pill shape' },
};

// Border variants - border styles for cards and elements
export const BORDER_VARIANTS: Record<string, { name: string; style: string; width: string; description: string }> = {
  B1: { name: 'None', style: 'none', width: '0', description: 'No border' },
  B2: { name: 'Subtle', style: 'solid', width: '1px', description: 'Thin subtle border' },
  B3: { name: 'Brutalist', style: 'solid', width: '3px', description: 'Thick bold border for brutalist style' },
  B4: { name: 'Double Offset', style: 'double-offset', width: '2px', description: 'Double border with offset shadow' },
};

// Hover variants - interaction styles
export const HOVER_VARIANTS: Record<string, { name: string; transform: string; effect: string; description: string }> = {
  V1: { name: 'Lift', transform: 'translateY(-4px)', effect: 'shadow', description: 'Subtle lift with shadow' },
  V2: { name: 'Glow', transform: 'translateY(-2px)', effect: 'glow', description: 'Glow effect on hover' },
  V3: { name: 'Skew', transform: 'skewY(-2deg)', effect: 'none', description: 'Playful skew transform' },
  V4: { name: 'Scale', transform: 'scale(1.02)', effect: 'none', description: 'Subtle scale up' },
};

export function generateDNACode(): DNACode {
  const heroKeys = Object.keys(HERO_VARIANTS);
  const layoutKeys = Object.keys(LAYOUT_VARIANTS);
  const colorKeys = Object.keys(COLOR_VARIANTS);
  const navKeys = Object.keys(NAV_VARIANTS);
  const designKeys = Object.keys(DESIGN_VARIANTS);
  const typographyKeys = Object.keys(TYPOGRAPHY_VARIANTS);
  const motionKeys = Object.keys(MOTION_VARIANTS);
  const textureKeys = Object.keys(TEXTURE_VARIANTS);
  const radiusKeys = Object.keys(RADIUS_VARIANTS);
  const borderKeys = Object.keys(BORDER_VARIANTS);
  const hoverKeys = Object.keys(HOVER_VARIANTS);

  return {
    hero: heroKeys[Math.floor(Math.random() * heroKeys.length)],
    layout: layoutKeys[Math.floor(Math.random() * layoutKeys.length)],
    color: colorKeys[Math.floor(Math.random() * colorKeys.length)],
    nav: navKeys[Math.floor(Math.random() * navKeys.length)],
    design: designKeys[Math.floor(Math.random() * designKeys.length)],
    typography: typographyKeys[Math.floor(Math.random() * typographyKeys.length)],
    motion: motionKeys[Math.floor(Math.random() * motionKeys.length)],
    texture: textureKeys[Math.floor(Math.random() * textureKeys.length)],
    radius: radiusKeys[Math.floor(Math.random() * radiusKeys.length)],
    border: borderKeys[Math.floor(Math.random() * borderKeys.length)],
    hover: hoverKeys[Math.floor(Math.random() * hoverKeys.length)],
    chaos: Math.random(),
  };
}

export function generateUniqueVariances(count: number = 10): ThemeVariance[] {
  const variances: ThemeVariance[] = [];
  const usedCombos = new Set<string>();

  const themeNames = [
    'Aurora', 'Nebula', 'Cascade', 'Prism', 'Horizon',
    'Zenith', 'Eclipse', 'Pulse', 'Vertex', 'Nova',
    'Ember', 'Frost', 'Mirage', 'Quantum', 'Spectrum'
  ];

  while (variances.length < count) {
    const dna = generateDNACode();
    const comboKey = `${dna.hero}-${dna.layout}-${dna.color}-${dna.nav}-${dna.design}-${dna.typography}-${dna.motion}`;

    if (!usedCombos.has(comboKey)) {
      usedCombos.add(comboKey);

      const heroInfo = HERO_VARIANTS[dna.hero];
      const layoutInfo = LAYOUT_VARIANTS[dna.layout];
      const colorInfo = COLOR_VARIANTS[dna.color];
      const navInfo = NAV_VARIANTS[dna.nav];
      const designInfo = DESIGN_VARIANTS[dna.design];
      const typographyInfo = dna.typography ? TYPOGRAPHY_VARIANTS[dna.typography] : null;
      const motionInfo = dna.motion ? MOTION_VARIANTS[dna.motion] : null;

      const typographyDesc = typographyInfo ? `, ${typographyInfo.name} typography` : '';
      const motionDesc = motionInfo ? `, ${motionInfo.name} motion` : '';

      variances.push({
        id: `theme-${variances.length + 1}`,
        name: themeNames[variances.length] || `Theme ${variances.length + 1}`,
        dna,
        description: `${heroInfo.name} hero with ${layoutInfo.name} layout, ${colorInfo.name} colors, ${navInfo.name} nav, and ${designInfo.name} design${typographyDesc}${motionDesc}`
      });
    }
  }

  return variances;
}

export function getDNADescription(dna: DNACode): string {
  const hero = HERO_VARIANTS[dna.hero]?.name || dna.hero;
  const layout = LAYOUT_VARIANTS[dna.layout]?.name || dna.layout;
  const color = COLOR_VARIANTS[dna.color]?.name || dna.color;
  const nav = NAV_VARIANTS[dna.nav]?.name || dna.nav;
  const design = DESIGN_VARIANTS[dna.design]?.name || dna.design;
  const typography = dna.typography ? (TYPOGRAPHY_VARIANTS[dna.typography]?.name || dna.typography) : 'Default';
  const motion = dna.motion ? (MOTION_VARIANTS[dna.motion]?.name || dna.motion) : 'Default';
  const texture = dna.texture ? (TEXTURE_VARIANTS[dna.texture]?.name || dna.texture) : 'Clean';
  const radius = dna.radius ? (RADIUS_VARIANTS[dna.radius]?.name || dna.radius) : 'Smooth';
  const border = dna.border ? (BORDER_VARIANTS[dna.border]?.name || dna.border) : 'None';
  const hover = dna.hover ? (HOVER_VARIANTS[dna.hover]?.name || dna.hover) : 'Lift';
  const chaos = dna.chaos !== undefined ? `Chaos: ${Math.round(dna.chaos * 100)}%` : '';

  return `${hero} | ${layout} | ${color} | ${nav} | ${design} | ${typography} | ${motion} | ${texture} | ${radius} | ${border} | ${hover}${chaos ? ` | ${chaos}` : ''}`;
}

// CLI entry point
if (require.main === module) {
  console.log('Generating 10 unique theme variances...\n');
  const variances = generateUniqueVariances(10);

  for (const v of variances) {
    console.log(`${v.id}: ${v.name}`);
    console.log(`  DNA: ${v.dna.hero}-${v.dna.layout}-${v.dna.color}-${v.dna.nav}-${v.dna.design}-${v.dna.typography || 'T1'}-${v.dna.motion || 'M1'}`);
    console.log(`  ${v.description}\n`);
  }
}
