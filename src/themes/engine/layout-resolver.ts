/**
 * Layout Resolver Engine (Grid Packer)
 *
 * Content-aware layout selection that determines the best way to display
 * items based on their count, DNA codes, and chaos level.
 *
 * This is the "Grid Packer" that intelligently lays out services, features,
 * and other list-based content.
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
 * Layout configuration output
 */
export interface LayoutConfig {
  type: 'grid' | 'flex' | 'masonry' | 'stack';
  columns: number;
  spans: GridPattern;
  gap: 'small' | 'medium' | 'large';
  className: string;
}

/**
 * Item with optional priority for featured placement
 */
export interface LayoutItem {
  priority?: number;  // Higher = more prominent placement
  featured?: boolean; // Should this item be larger?
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
 * Resolve the best layout for services/features
 *
 * @param items - Array of items to lay out (or just count)
 * @param dna - DNA code for layout hints
 * @param chaos - Override chaos level (optional)
 */
export function resolveServiceLayout<T extends LayoutItem>(
  items: T[] | number,
  dna: DNACode,
  chaos?: number
): LayoutConfig {
  const count = typeof items === 'number' ? items : items.length;
  const actualChaos = chaos ?? getChaosFromDNA(dna);
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
  };
}

/**
 * Generate CSS for a layout configuration
 * Includes mobile-first responsive styles
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

      ${config.spans.map((span, i) => `
      .${config.className} > *:nth-child(${i + 1}) {
        grid-column: span ${span};
      }
      `).join('')}
    }

    /* Large screens - might use larger gaps */
    @media (min-width: 1200px) {
      .${config.className} {
        gap: calc(${gapSizes[config.gap]} * 1.25);
      }
    }
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
