/**
 * Harmony Engine - Constraints System
 *
 * Prevents ugly DNA combinations with "Vibes" - curated constraint sets
 * that ensure aesthetically pleasing combinations.
 *
 * The key insight: Random DNA combinations create ugly sites 90% of the time.
 * Vibes solve this by limiting which codes can combine.
 */

import { DNACode } from '../../variance-planner';

/**
 * A Vibe is a curated aesthetic direction with constrained DNA options.
 * Each vibe limits which DNA codes can combine to ensure visual harmony.
 */
export interface Vibe {
  id: string;
  name: string;
  description: string;
  typography: string[];  // Allowed T codes
  colors: string[];      // Allowed C codes
  layout: string[];      // Allowed L codes
  design: string[];      // Allowed D codes
  hero: string[];        // Allowed H codes
  nav: string[];         // Allowed N codes
  motion: string[];      // Allowed M codes
  chaos: number;         // 0-1, controls overlap/asymmetry tolerance
}

/**
 * Pre-defined vibes that produce consistently good-looking sites.
 * These are the "safe" combinations that work well together.
 */
export const VIBES: Record<string, Vibe> = {
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Professional, trustworthy, corporate. Perfect for B2B, finance, law.',
    typography: ['T2'],              // Serif only
    colors: ['C1', 'C8', 'C11'],     // Light, Monochrome, Corporate Blue
    layout: ['L1', 'L3', 'L5'],      // Classic grid, Cards, Single column
    design: ['D1', 'D4', 'D11'],     // Rounded soft, Flat minimal, Layered
    hero: ['H1', 'H3', 'H8'],        // Full-width, Minimal, Asymmetric
    nav: ['N1', 'N2', 'N9'],         // Fixed, Transparent, Minimal
    motion: ['M1'],                   // Subtle only
    chaos: 0,
  },

  maverick: {
    id: 'maverick',
    name: 'Maverick',
    description: 'Bold, disruptive, attention-grabbing. Perfect for startups, creatives.',
    typography: ['T3'],              // Mono only
    colors: ['C7', 'C9'],            // Gradient, Neon
    layout: ['L7', 'L10'],           // Asymmetric, Bento
    design: ['D7', 'D10', 'D12'],    // Brutalist, Gradient borders, Retro
    hero: ['H4', 'H6', 'H9', 'H12'], // Video, Animated, Text only, Geometric
    nav: ['N3', 'N7'],               // Hamburger, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic
    chaos: 0.8,
  },

  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'Premium, Awwwards-level, high-impact. Perfect for agencies, studios, high-end services.',
    typography: ['T1', 'T2'],        // Sans or Serif
    colors: ['C1', 'C2', 'C8'],      // Light, Dark, Monochrome
    layout: ['L7', 'L10'],           // Asymmetric, Bento
    design: ['D5', 'D6', 'D11'],     // Neumorphic, Glass, Layered
    hero: ['H2', 'H8', 'H12'],       // Split, Asymmetric, Geometric
    nav: ['N2', 'N7'],               // Transparent, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic - enables scroll reveals and Lenis
    chaos: 0.6,                      // High enough to enable parallax (> 0.5)
  },

  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated, refined, luxurious. Perfect for high-end services.',
    typography: ['T2'],              // Serif only
    colors: ['C1', 'C3', 'C8'],      // Light, Warm, Monochrome
    layout: ['L1', 'L5'],            // Classic, Single column
    design: ['D1', 'D5', 'D6'],      // Soft, Neumorphic, Glass
    hero: ['H2', 'H3', 'H9'],        // Split, Minimal, Text only
    nav: ['N1', 'N2', 'N9'],         // Fixed, Transparent, Minimal
    motion: ['M1', 'M2'],            // Subtle, Dynamic
    chaos: 0.2,
  },

  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'Strong, confident, impactful. Perfect for fitness, trades, emergency services.',
    typography: ['T1'],              // Sans only
    colors: ['C2', 'C6', 'C9'],      // Dark, Purple, Neon
    layout: ['L3', 'L10'],           // Cards, Bento
    design: ['D2', 'D3', 'D7'],      // Sharp, Heavy shadow, Brutalist
    hero: ['H1', 'H4', 'H6', 'H9', 'H12'], // Full-width, Video, Animated, Text only, Geometric
    nav: ['N1', 'N7'],               // Fixed, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic
    chaos: 0.5,
  },

  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable, inviting. Perfect for local businesses, family services.',
    typography: ['T4'],              // Playful only
    colors: ['C1', 'C3', 'C5', 'C10'], // Light, Warm, Forest, Pastel
    layout: ['L3', 'L5'],            // Cards, Single column
    design: ['D1', 'D8'],            // Rounded, Pill shapes
    hero: ['H1', 'H2', 'H3'],        // Full-width, Split, Minimal
    nav: ['N1', 'N7'],               // Fixed, Floating
    motion: ['M1', 'M2'],            // Subtle, Dynamic
    chaos: 0.3,
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, focused, uncluttered. Perfect for portfolios, tech, design.',
    typography: ['T1'],              // Sans only
    colors: ['C1', 'C2', 'C8'],      // Light, Dark, Monochrome
    layout: ['L1', 'L5'],            // Classic, Single column
    design: ['D2', 'D4'],            // Sharp, Flat
    hero: ['H3', 'H9'],              // Minimal, Text only
    nav: ['N9'],                     // Minimal links only
    motion: ['M1'],                   // Subtle only
    chaos: 0.1,
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic, expressive, unique. Perfect for photographers, restaurants, studios.',
    typography: ['T2', 'T3'],        // Serif or Mono
    colors: ['C3', 'C6', 'C7', 'C12'], // Warm, Purple, Sunset, Vintage
    layout: ['L2', 'L7', 'L10'],     // Masonry, Asymmetric, Bento
    design: ['D6', 'D10', 'D11'],    // Glass, Gradient borders, Layered
    hero: ['H2', 'H5', 'H7', 'H8', 'H12'], // Split, Gradient Overlay, Carousel, Asymmetric, Geometric
    nav: ['N2', 'N7'],               // Transparent, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic
    chaos: 0.65,                     // Boosted to ensure parallax effects
  },

  trustworthy: {
    id: 'trustworthy',
    name: 'Trustworthy',
    description: 'Reliable, established, dependable. Perfect for healthcare, insurance, trades.',
    typography: ['T1'],              // Sans only
    colors: ['C1', 'C4', 'C5', 'C11'], // Light, Ocean, Forest, Corporate
    layout: ['L1', 'L3'],            // Classic, Cards
    design: ['D1', 'D4', 'D11'],     // Soft, Flat, Layered
    hero: ['H1', 'H2', 'H3'],        // Full-width, Split, Minimal
    nav: ['N1', 'N2'],               // Fixed, Transparent
    motion: ['M1'],                   // Subtle only
    chaos: 0.1,
  },

  // Extended vibes from Phase5

  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless, traditional, dependable. Perfect for established firms.',
    typography: ['T2'],              // Serif only
    colors: ['C1', 'C3', 'C8'],      // Light, Warm, Monochrome
    layout: ['L1', 'L3'],            // Classic grid, Cards
    design: ['D1', 'D4', 'D11'],     // Rounded soft, Flat minimal, Layered
    hero: ['H1', 'H3'],              // Full-width, Minimal
    nav: ['N1', 'N2'],               // Fixed, Transparent
    motion: ['M1'],                  // Subtle only
    chaos: 0.1,
  },

  artisan: {
    id: 'artisan',
    name: 'Artisan',
    description: 'Handcrafted, warm, boutique. Perfect for bespoke services.',
    typography: ['T2'],              // Serif only
    colors: ['C3', 'C5', 'C12'],     // Warm, Forest, Vintage
    layout: ['L2', 'L5', 'L7'],      // Masonry, Single column, Asymmetric
    design: ['D1', 'D6', 'D11'],     // Soft, Glass, Layered
    hero: ['H2', 'H8', 'H12'],       // Split, Asymmetric, Geometric
    nav: ['N2', 'N7'],               // Transparent, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic - enables scroll reveals and parallax
    chaos: 0.55,                     // High enough to enable parallax (> 0.5)
  },

  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary, confident. Perfect for real estate and tech.',
    typography: ['T1', 'T2'],        // Sans or Serif
    colors: ['C1', 'C8', 'C11'],     // Light, Monochrome, Corporate Blue
    layout: ['L3', 'L10'],           // Cards, Bento
    design: ['D4', 'D5', 'D6'],      // Flat, Neumorphic, Glass
    hero: ['H3', 'H8', 'H12'],       // Minimal, Asymmetric, Geometric
    nav: ['N2', 'N7'],               // Transparent, Floating
    motion: ['M2'],                  // Dynamic
    chaos: 0.3,
  },

  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Lighthearted, energetic, cheerful. Perfect for lifestyle brands.',
    typography: ['T4'],              // Playful only
    colors: ['C3', 'C7', 'C10'],     // Warm, Gradient, Pastel
    layout: ['L3', 'L7'],            // Cards, Asymmetric
    design: ['D1', 'D8', 'D10'],     // Rounded, Pill shapes, Gradient borders
    hero: ['H1', 'H2', 'H5', 'H7', 'H12'], // Full-width, Split, Gradient Overlay, Carousel, Geometric
    nav: ['N3', 'N7'],               // Hamburger, Floating
    motion: ['M2', 'M3'],            // Dynamic, Dramatic
    chaos: 0.6,
  },

  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Ultra-clean, restrained, and focused. Perfect for modern brands.',
    typography: ['T1'],              // Sans only
    colors: ['C1', 'C2', 'C8'],      // Light, Dark, Monochrome
    layout: ['L1', 'L5'],            // Classic, Single column
    design: ['D2', 'D4'],            // Sharp, Flat
    hero: ['H3', 'H9'],              // Minimal, Text only
    nav: ['N9'],                     // Minimal links only
    motion: ['M1'],                  // Subtle only
    chaos: 0.1,
  },
};

/**
 * Get a vibe suitable for a given industry
 */
export function getVibeForIndustry(industry: string): Vibe {
  const industryVibes: Record<string, string> = {
    // Service trades
    plumber: 'trustworthy',
    electrician: 'trustworthy',
    hvac: 'trustworthy',
    roofer: 'bold',
    contractor: 'bold',
    landscaper: 'friendly',

    // Professional services
    lawyer: 'executive',
    accountant: 'executive',
    'financial-advisor': 'executive',
    realtor: 'modern',
    consultant: 'executive',

    // Healthcare
    dentist: 'friendly',
    chiropractor: 'friendly',
    veterinarian: 'friendly',
    therapist: 'elegant',
    gym: 'bold',
    spa: 'elegant',

    // Creative
    restaurant: 'creative',
    photographer: 'creative',
    cafe: 'artisan',
    studio: 'creative',
  };

  const vibeId = industryVibes[industry] || 'trustworthy';
  return VIBES[vibeId];
}

/**
 * Pick a random item from an array
 */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Map premium vibes to their ideal texture codes for Awwwards-level effects
 * X1 = Noise grain, X2 = Paper texture, X3 = Halftone dots, X4 = Clean
 */
export const VIBE_TO_TEXTURE: Record<string, string> = {
  agency: 'X2',     // Paper texture - premium, tactile feel
  artisan: 'X1',    // Noise grain - handcrafted, organic
  creative: 'X1',   // Noise grain - artistic, unique
  maverick: 'X3',   // Halftone dots - bold, edgy
  executive: 'X4',  // Clean - professional, polished
  elegant: 'X4',    // Clean - refined, sophisticated
};

/**
 * Map design variants to appropriate radius values
 * This ensures visual consistency (e.g., brutalist = sharp, pill = rounded)
 */
const DESIGN_TO_RADIUS: Record<string, string> = {
  D1: 'R3',  // Rounded Soft → Playful (24px)
  D2: 'R1',  // Sharp Edges → Sharp (0px)
  D3: 'R2',  // Heavy Shadow → Smooth (8px)
  D4: 'R1',  // Flat Minimal → Sharp (0px)
  D5: 'R3',  // Neumorphic → Playful (24px)
  D6: 'R3',  // Glassmorphism → Playful (24px)
  D7: 'R1',  // Brutalist → Sharp (0px)
  D8: 'R4',  // Pill Shapes → Pill (9999px)
  D9: 'R2',  // Outlined → Smooth (8px)
  D10: 'R2', // Gradient Borders → Smooth (8px)
  D11: 'R2', // Layered Cards → Smooth (8px)
  D12: 'R1', // Retro Pixel → Sharp (0px)
};

/**
 * Map design variants to appropriate hover effects
 */
const DESIGN_TO_HOVER: Record<string, string> = {
  D1: 'V1',  // Rounded Soft → Lift
  D2: 'V4',  // Sharp Edges → Scale
  D3: 'V1',  // Heavy Shadow → Lift (emphasize shadow)
  D4: 'V4',  // Flat Minimal → Scale (subtle)
  D5: 'V2',  // Neumorphic → Glow
  D6: 'V2',  // Glassmorphism → Glow
  D7: 'V3',  // Brutalist → Skew (playful)
  D8: 'V4',  // Pill Shapes → Scale
  D9: 'V1',  // Outlined → Lift
  D10: 'V2', // Gradient Borders → Glow
  D11: 'V1', // Layered Cards → Lift
  D12: 'V3', // Retro Pixel → Skew
};

/**
 * Generate DNA constrained by a vibe's rules
 * This ensures the combination will look good together
 */
export function generateConstrainedDNA(vibe: Vibe): DNACode {
  const design = pickRandom(vibe.design);

  return {
    hero: pickRandom(vibe.hero),
    layout: pickRandom(vibe.layout),
    color: pickRandom(vibe.colors),
    nav: pickRandom(vibe.nav),
    design,
    typography: pickRandom(vibe.typography),
    motion: pickRandom(vibe.motion),
    // Derive radius and hover from design for visual consistency
    radius: DESIGN_TO_RADIUS[design] || 'R2',
    hover: DESIGN_TO_HOVER[design] || 'V1',
    // Use vibe-specific texture for premium feel, or clean by default
    texture: VIBE_TO_TEXTURE[vibe.id] || 'X4',
    chaos: vibe.chaos,
  };
}

/**
 * Generate DNA with a specific vibe by ID
 */
export function generateDNAWithVibe(vibeId: string): DNACode {
  const vibe = VIBES[vibeId] || VIBES.trustworthy;
  return generateConstrainedDNA(vibe);
}

/**
 * Check if a DNA combination is valid for a given vibe
 */
export function isDNAValidForVibe(dna: DNACode, vibe: Vibe): boolean {
  return (
    vibe.hero.includes(dna.hero) &&
    vibe.layout.includes(dna.layout) &&
    vibe.colors.includes(dna.color) &&
    vibe.nav.includes(dna.nav) &&
    vibe.design.includes(dna.design) &&
    (!dna.typography || vibe.typography.includes(dna.typography)) &&
    (!dna.motion || vibe.motion.includes(dna.motion))
  );
}

/**
 * Suggest fixes for DNA that doesn't match a vibe
 * Returns the closest valid DNA for the vibe
 */
export function suggestVibeCompliantDNA(dna: DNACode, vibe: Vibe): DNACode {
  return {
    hero: vibe.hero.includes(dna.hero) ? dna.hero : pickRandom(vibe.hero),
    layout: vibe.layout.includes(dna.layout) ? dna.layout : pickRandom(vibe.layout),
    color: vibe.colors.includes(dna.color) ? dna.color : pickRandom(vibe.colors),
    nav: vibe.nav.includes(dna.nav) ? dna.nav : pickRandom(vibe.nav),
    design: vibe.design.includes(dna.design) ? dna.design : pickRandom(vibe.design),
    typography: dna.typography && vibe.typography.includes(dna.typography)
      ? dna.typography
      : pickRandom(vibe.typography),
    motion: dna.motion && vibe.motion.includes(dna.motion)
      ? dna.motion
      : pickRandom(vibe.motion),
  };
}

/**
 * Get all available vibe IDs
 */
export function getAllVibeIds(): string[] {
  return Object.keys(VIBES);
}

/**
 * Get vibes suitable for a category
 */
export function getVibesForCategory(category: 'service' | 'professional' | 'health' | 'creative'): Vibe[] {
  const categoryVibes: Record<string, string[]> = {
    service: ['trustworthy', 'bold', 'friendly'],
    professional: ['executive', 'elegant', 'minimal'],
    health: ['friendly', 'trustworthy', 'elegant'],
    creative: ['creative', 'maverick', 'bold'],
  };

  return (categoryVibes[category] || ['trustworthy']).map(id => VIBES[id]);
}
