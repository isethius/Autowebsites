/**
 * Layout Resolver Engine (Grid Packer)
 *
 * Content-aware layout selection that determines the best way to display
 * items based on their count, DNA codes, and chaos level.
 *
 * This is the "Grid Packer" that intelligently lays out services, features,
 * and other list-based content.
 *
 * VIBE INTEGRATION:
 * The resolver now supports vibe-based chaos levels, ensuring that layout
 * asymmetry matches the overall site aesthetic (e.g., maverick = high chaos,
 * executive = perfect grids).
 */

import { DNACode, LAYOUT_VARIANTS } from '../variance-planner';
import {
  selectPattern,
  selectPatternForGrid,
  getLayoutPattern,
  generatePatternCSS,
  type GridPattern,
  type LayoutType,
} from './harmony/grid-patterns';

/**
 * Vibe-to-Chaos mapping for layout decisions
 *
 * This ensures grids inside sections match the overall site personality:
 * - maverick: High asymmetry, broken grids
 * - executive: Perfect, aligned grids
 * - creative: Moderate asymmetry
 * - minimal: Near-perfect alignment
 */
const VIBE_CHAOS_MAP: Record<string, number> = {
  maverick: 0.8,     // High asymmetry, broken grids
  executive: 0,       // Perfect alignment
  creative: 0.6,      // Moderate asymmetry
  bold: 0.5,          // Medium chaos
  minimal: 0.1,       // Near-perfect
  friendly: 0.3,      // Slight variation
  elegant: 0.2,       // Refined, subtle
  trustworthy: 0.1,   // Stable, predictable
};

/**
 * Get the chaos level for a given vibe ID
 *
 * @param vibeId - The vibe identifier (maverick, executive, etc.)
 * @returns Chaos level 0-1 appropriate for the vibe
 */
export function getChaosForVibe(vibeId: string): number {
  return VIBE_CHAOS_MAP[vibeId] ?? 0.3;
}

/**
 * Layout configuration output
 */
export interface LayoutConfig {
  type: 'grid' | 'flex' | 'masonry' | 'stack';
  columns: number;
  spans: GridPattern;
  gap: 'small' | 'medium' | 'large';
  className: string;
  /** Whether broken grid displacement should be applied */
  enableDisplacement?: boolean;
  /** Chaos level for displacement intensity */
  chaos?: number;
}

/**
 * Displacement configuration for broken grid overlaps
 */
export interface DisplacementConfig {
  enabled: boolean;
  translateY: string;      // e.g., "-20px" to lift into previous section
  translateX: string;      // e.g., "10%" for horizontal offset
  zIndex: number;          // Layering control
  overlapPercent: number;  // 0-15% safe range for text readability
}

/**
 * Item with optional priority for featured placement
 */
export interface LayoutItem {
  priority?: number;  // Higher = more prominent placement
  featured?: boolean; // Should this item be larger?
}

/**
 * Generate displacement CSS for broken grid overlaps
 *
 * When chaos > 0.6, applies controlled overlapping transforms
 * to create Awwwards-quality visual tension.
 *
 * @param chaos - Chaos level 0-1
 * @param className - Base class name for the grid
 * @returns CSS string for displacement transforms
 */
export function generateDisplacementCSS(chaos: number, className: string): string {
  // No displacement for chaos < 0.6
  if (chaos < 0.6) {
    return '';
  }

  // Calculate displacement intensity (0 at 0.6, max at 1.0)
  const intensity = (chaos - 0.6) / 0.4; // 0-1 range within 0.6-1.0
  const maxOverlap = 15; // Max 15% overlap for readability

  // Calculate displacement values
  const overlapPercent = Math.min(maxOverlap, intensity * maxOverlap);
  const translateYOdd = Math.round(-8 - intensity * 16); // -8px to -24px
  const translateYEven = Math.round(4 + intensity * 8);   // 4px to 12px
  const translateXOdd = Math.round(intensity * 5);         // 0% to 5%
  const translateXEven = Math.round(-intensity * 3);       // 0% to -3%

  return `
    /* Broken Grid Displacement - Chaos Level: ${chaos.toFixed(2)} */
    .${className}.broken-grid > * {
      position: relative;
      transition: transform 0.3s ease-out, z-index 0s;
    }

    .${className}.broken-grid > *:nth-child(odd) {
      transform: translateY(${translateYOdd}px) translateX(${translateXOdd}%);
      z-index: 2;
    }

    .${className}.broken-grid > *:nth-child(even) {
      transform: translateY(${translateYEven}px) translateX(${translateXEven}%);
      z-index: 1;
    }

    /* Hover state lifts item above others */
    .${className}.broken-grid > *:hover {
      z-index: 10;
      transform: translateY(-2px) scale(1.02);
    }

    /* Mobile: Disable displacement for readability */
    @media (max-width: 768px) {
      .${className}.broken-grid > * {
        transform: none !important;
        z-index: auto !important;
      }
    }
  `;
}

/**
 * Map DNA layout codes to base layout types
 */
const DNA_TO_LAYOUT: Record<string, LayoutType> = {
  L1: 'equal',       // Classic Grid
  L2: 'masonry',     // Masonry
  L3: 'equal',       // Card Grid (but with cards)
  L4: 'alternating', // Magazine
  L5: 'equal',       // Single Column (1 col)
  L6: 'equal',       // Sidebar Layout
  L7: 'bento',       // Asymmetric Grid
  L8: 'equal',       // Full-Width Sections
  L9: 'equal',       // Timeline
  L10: 'bento',      // Bento Box
  L11: 'alternating', // Professional Services
  L12: 'equal',      // Horizontal Scroll
};

/**
 * Get chaos level from DNA design code
 * Brutalist, gradient borders = high chaos
 * Flat, soft = low chaos
 */
function getChaosFromDNA(dna: DNACode): number {
  const chaosMap: Record<string, number> = {
    D1: 0.1,  // Rounded Soft
    D2: 0.3,  // Sharp Edges
    D3: 0.4,  // Heavy Shadow
    D4: 0.1,  // Flat Minimal
    D5: 0.2,  // Neumorphic
    D6: 0.3,  // Glassmorphism
    D7: 0.8,  // Brutalist
    D8: 0.3,  // Pill Shapes
    D9: 0.2,  // Outlined
    D10: 0.5, // Gradient Borders
    D11: 0.2, // Layered Cards
    D12: 0.7, // Retro Pixel
  };

  return chaosMap[dna.design] || 0.3;
}

/**
 * Options for layout resolution
 */
export interface LayoutResolveOptions {
  /** Override chaos level */
  chaos?: number;
  /** Vibe ID for chaos calculation */
  vibeId?: string;
}

/**
 * Resolve the best layout for services/features
 *
 * @param items - Array of items to lay out (or just count)
 * @param dna - DNA code for layout hints
 * @param options - Layout options including chaos override and vibe
 */
export function resolveServiceLayout<T extends LayoutItem>(
  items: T[] | number,
  dna: DNACode,
  options?: number | LayoutResolveOptions
): LayoutConfig {
  const count = typeof items === 'number' ? items : items.length;

  // Handle backwards-compatible chaos parameter
  let chaos: number | undefined;
  let vibeId: string | undefined;

  if (typeof options === 'number') {
    // Old signature: resolveServiceLayout(items, dna, chaos)
    chaos = options;
  } else if (options) {
    chaos = options.chaos;
    vibeId = options.vibeId;
  }

  // Determine actual chaos: explicit chaos > vibe chaos > DNA chaos
  const actualChaos = chaos ?? (vibeId ? getChaosForVibe(vibeId) : getChaosFromDNA(dna));
  const layoutCode = dna.layout || 'L3';
  const layoutType = DNA_TO_LAYOUT[layoutCode] || 'equal';

  // Special case: L5 is single column
  if (layoutCode === 'L5') {
    return {
      type: 'stack',
      columns: 1,
      spans: Array(count).fill(1),
      gap: 'large',
      className: 'layout-single-column',
    };
  }

  // Special case: L9 is timeline (vertical)
  if (layoutCode === 'L9') {
    return {
      type: 'stack',
      columns: 1,
      spans: Array(count).fill(1),
      gap: 'medium',
      className: 'layout-timeline',
    };
  }

  // Special case: L2 is masonry
  if (layoutCode === 'L2') {
    return {
      type: 'masonry',
      columns: count <= 4 ? 2 : count <= 6 ? 3 : 4,
      spans: Array(count).fill(1),
      gap: actualChaos > 0.5 ? 'large' : 'medium',
      className: 'layout-masonry',
    };
  }

  // Get pattern based on layout type and chaos
  let pattern: GridPattern;
  if (layoutType === 'bento') {
    pattern = selectPattern(count, Math.max(0.5, actualChaos));
  } else if (layoutType === 'alternating') {
    pattern = getLayoutPattern('alternating', count);
  } else if (layoutType === 'featured' && typeof items !== 'number') {
    // Check if any items are marked as featured
    const hasFeatured = items.some(item => item.featured);
    if (hasFeatured) {
      pattern = getLayoutPattern('featured', count);
    } else {
      pattern = selectPattern(count, actualChaos);
    }
  } else {
    pattern = selectPattern(count, actualChaos);
  }

  // Determine grid columns
  const maxSpan = Math.max(...pattern);
  const columns = maxSpan;

  // Determine gap size based on chaos
  const gap = actualChaos > 0.6 ? 'large' : actualChaos > 0.3 ? 'medium' : 'small';

  return {
    type: 'grid',
    columns,
    spans: pattern,
    gap,
    className: `layout-${layoutCode.toLowerCase()}`,
    enableDisplacement: actualChaos > 0.6,
    chaos: actualChaos,
  };
}

/**
 * Generate CSS for a layout configuration
 * Includes mobile-first responsive styles and optional broken grid displacement
 */
export function generateLayoutCSS(config: LayoutConfig): string {
  const gapSizes = {
    small: '1rem',
    medium: '1.5rem',
    large: '2rem',
  };

  if (config.type === 'stack') {
    return `
      .${config.className} {
        display: flex;
        flex-direction: column;
        gap: ${gapSizes[config.gap]};
      }
    `;
  }

  if (config.type === 'masonry') {
    return `
      .${config.className} {
        column-count: ${config.columns};
        column-gap: ${gapSizes[config.gap]};
      }

      .${config.className} > * {
        break-inside: avoid;
        margin-bottom: ${gapSizes[config.gap]};
      }

      @media (max-width: 768px) {
        .${config.className} {
          column-count: 1;
        }
      }
    `;
  }

  // Generate displacement CSS if enabled
  const displacementCSS = config.enableDisplacement && config.chaos
    ? generateDisplacementCSS(config.chaos, config.className)
    : '';

  // Handle whitespace columns (span === 0)
  const spanCSS = config.spans.map((span, i) => {
    if (span === 0) {
      return `
      .${config.className} > *:nth-child(${i + 1}) {
        visibility: hidden;
        grid-column: span 1;
        pointer-events: none;
      }`;
    }
    return `
      .${config.className} > *:nth-child(${i + 1}) {
        grid-column: span ${span};
      }`;
  }).join('');

  // Grid layout
  return `
    /* Mobile First - Stack */
    .${config.className} {
      display: flex;
      flex-direction: column;
      gap: ${gapSizes[config.gap]};
    }

    /* Tablet and up - Grid */
    @media (min-width: 768px) {
      .${config.className} {
        display: grid;
        grid-template-columns: repeat(${config.columns}, 1fr);
        gap: ${gapSizes[config.gap]};
      }

      ${spanCSS}

      /* Mobile: show hidden whitespace columns */
      .${config.className} > * {
        visibility: visible !important;
      }
    }

    /* Large screens - might use larger gaps */
    @media (min-width: 1200px) {
      .${config.className} {
        gap: calc(${gapSizes[config.gap]} * 1.25);
      }
    }

    ${displacementCSS}
  `;
}

/**
 * Resolve layout for a testimonials section
 */
export function resolveTestimonialsLayout(
  count: number,
  dna: DNACode,
  chaos?: number
): LayoutConfig {
  const actualChaos = chaos ?? getChaosFromDNA(dna);

  // Testimonials typically work best with 1-3 columns
  if (count === 1) {
    return {
      type: 'stack',
      columns: 1,
      spans: [1],
      gap: 'large',
      className: 'testimonials-single',
    };
  }

  if (count === 2) {
    return {
      type: 'grid',
      columns: 2,
      spans: [1, 1],
      gap: 'medium',
      className: 'testimonials-pair',
    };
  }

  // 3+ testimonials
  const pattern = actualChaos > 0.5
    ? selectPattern(count, actualChaos)
    : Array(count).fill(1);

  return {
    type: 'grid',
    columns: Math.min(3, count),
    spans: pattern,
    gap: actualChaos > 0.5 ? 'large' : 'medium',
    className: 'testimonials-grid',
  };
}

/**
 * Resolve layout for stats/metrics section
 */
export function resolveStatsLayout(
  count: number,
  dna: DNACode
): LayoutConfig {
  // Stats usually work best equal-sized
  return {
    type: 'grid',
    columns: Math.min(4, count),
    spans: Array(count).fill(1),
    gap: 'medium',
    className: 'stats-grid',
  };
}

/**
 * Resolve layout for team members section
 */
export function resolveTeamLayout(
  count: number,
  dna: DNACode,
  chaos?: number
): LayoutConfig {
  const actualChaos = chaos ?? getChaosFromDNA(dna);

  // Small teams: show all equal
  if (count <= 4) {
    return {
      type: 'grid',
      columns: count,
      spans: Array(count).fill(1),
      gap: 'medium',
      className: 'team-grid',
    };
  }

  // Larger teams with optional featured members
  const pattern = actualChaos > 0.4
    ? [2, ...Array(count - 1).fill(1)]
    : Array(count).fill(1);

  return {
    type: 'grid',
    columns: Math.min(4, Math.max(...pattern)),
    spans: pattern,
    gap: 'medium',
    className: 'team-grid',
  };
}

/**
 * Resolve layout for gallery/portfolio section
 */
export function resolveGalleryLayout(
  count: number,
  dna: DNACode,
  chaos?: number
): LayoutConfig {
  const actualChaos = chaos ?? getChaosFromDNA(dna);
  const layoutCode = dna.layout || 'L3';

  // Masonry works great for galleries
  if (layoutCode === 'L2' || actualChaos > 0.6) {
    return {
      type: 'masonry',
      columns: count <= 4 ? 2 : count <= 9 ? 3 : 4,
      spans: Array(count).fill(1),
      gap: actualChaos > 0.5 ? 'small' : 'medium',
      className: 'gallery-masonry',
    };
  }

  // Bento style
  if (layoutCode === 'L10' || actualChaos > 0.4) {
    const pattern = selectPattern(count, actualChaos);
    return {
      type: 'grid',
      columns: Math.max(...pattern),
      spans: pattern,
      gap: 'small',
      className: 'gallery-bento',
    };
  }

  // Standard grid
  return {
    type: 'grid',
    columns: count <= 4 ? 2 : count <= 9 ? 3 : 4,
    spans: Array(count).fill(1),
    gap: 'small',
    className: 'gallery-grid',
  };
}

/**
 * Resolve layout for FAQ section
 */
export function resolveFAQLayout(
  count: number,
  dna: DNACode
): LayoutConfig {
  // FAQs almost always work best as a single column
  const layoutCode = dna.layout || 'L5';

  // Exception: L6 sidebar layout might do 2 columns
  if (layoutCode === 'L6' && count >= 6) {
    return {
      type: 'grid',
      columns: 2,
      spans: Array(count).fill(1),
      gap: 'medium',
      className: 'faq-two-column',
    };
  }

  return {
    type: 'stack',
    columns: 1,
    spans: Array(count).fill(1),
    gap: 'small',
    className: 'faq-list',
  };
}

/**
 * Resolve layout for pricing tiers
 */
export function resolvePricingLayout(
  count: number,
  dna: DNACode,
  chaos?: number
): LayoutConfig {
  const actualChaos = chaos ?? getChaosFromDNA(dna);

  // 1-3 tiers: equal columns
  if (count <= 3) {
    return {
      type: 'grid',
      columns: count,
      spans: Array(count).fill(1),
      gap: 'medium',
      className: 'pricing-grid',
    };
  }

  // 4+ tiers: might feature one
  const pattern = actualChaos > 0.4
    ? [1, 2, 1, ...Array(Math.max(0, count - 3)).fill(1)]
    : Array(count).fill(1);

  return {
    type: 'grid',
    columns: Math.min(4, Math.max(...pattern)),
    spans: pattern,
    gap: 'medium',
    className: 'pricing-grid',
  };
}
