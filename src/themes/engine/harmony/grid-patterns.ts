/**
 * Harmony Engine - Grid Patterns
 *
 * Layout pattern arrays for the Grid Packer system.
 * These define how items should span in grid layouts based on chaos level.
 *
 * Higher chaos = more asymmetric, interesting patterns
 * Lower chaos = more uniform, professional patterns
 */

/**
 * Pattern definition: array of column spans for each item
 * Example: [2, 1, 1] means first item spans 2 columns, next two span 1 each
 */
export type GridPattern = number[];

/**
 * Patterns organized by item count
 * Each count has multiple patterns ordered by chaos level (0 = most uniform)
 */
export const PATTERNS: Record<number, GridPattern[]> = {
  // 2 items
  2: [
    [1, 1],       // Equal halves (chaos: 0)
    [2, 1],       // Featured left (chaos: 0.5)
    [1, 2],       // Featured right (chaos: 0.5)
  ],

  // 3 items
  3: [
    [1, 1, 1],    // Equal thirds (chaos: 0)
    [2, 1, 1],    // Featured left (chaos: 0.3)
    [1, 2, 1],    // Featured center (chaos: 0.4)
    [1, 1, 2],    // Featured right (chaos: 0.5)
    [2, 2, 2],    // All large (chaos: 0.2) - 6 col grid
  ],

  // 4 items
  4: [
    [1, 1, 1, 1], // Equal quarters (chaos: 0)
    [2, 1, 1, 2], // Bookends (chaos: 0.2)
    [2, 2, 1, 1], // Two featured (chaos: 0.3)
    [3, 1, 1, 1], // Hero + 3 small (chaos: 0.5)
    [2, 1, 1, 2], // Alternating (chaos: 0.4)
    [1, 2, 2, 1], // Center focus (chaos: 0.4)
  ],

  // 5 items
  5: [
    [1, 1, 1, 1, 1], // Equal fifths (chaos: 0)
    [2, 1, 1, 1, 1], // One featured (chaos: 0.2)
    [2, 2, 1, 1, 1], // Two featured (chaos: 0.3)
    [2, 2, 2, 1, 1], // Three featured (chaos: 0.4)
    [3, 2, 2, 2, 1], // Bento style (chaos: 0.6)
    [3, 3, 2, 2, 2], // Asymmetric bento (chaos: 0.7)
    [4, 1, 1, 1, 1], // Hero feature (chaos: 0.8)
  ],

  // 6 items - most common for services
  6: [
    [1, 1, 1, 1, 1, 1],       // Equal sixths (chaos: 0)
    [2, 2, 2, 2, 2, 2],       // 3x2 grid (chaos: 0.1) - needs 6 col
    [2, 1, 1, 2, 1, 1],       // Alternating featured (chaos: 0.3)
    [2, 2, 1, 1, 2, 2],       // Bookend pairs (chaos: 0.4)
    [3, 3, 2, 2, 1, 1],       // Stepped (chaos: 0.7)
    [4, 2, 2, 2, 2, 2],       // Hero bento (chaos: 0.8)
    [3, 3, 3, 3, 3, 3],       // 2x3 grid (chaos: 0.1) - needs 6 col
  ],

  // 7 items
  7: [
    [1, 1, 1, 1, 1, 1, 1],    // Equal (chaos: 0)
    [2, 1, 1, 1, 1, 1, 1],    // One featured (chaos: 0.2)
    [2, 2, 2, 1, 1, 1, 1],    // Three featured (chaos: 0.4)
    [3, 3, 2, 2, 2, 2, 2],    // Bento (chaos: 0.6)
    [4, 2, 2, 2, 2, 2, 2],    // Hero + grid (chaos: 0.7)
  ],

  // 8 items
  8: [
    [1, 1, 1, 1, 1, 1, 1, 1], // Equal (chaos: 0)
    [2, 2, 2, 2, 2, 2, 2, 2], // 4x2 grid (chaos: 0.1)
    [3, 3, 2, 2, 2, 2, 2, 2], // Featured top row (chaos: 0.5)
    [4, 4, 2, 2, 2, 2, 2, 2], // Hero pair + grid (chaos: 0.6)
  ],
};

/**
 * Select the best pattern for a given item count and chaos level
 *
 * @param count - Number of items to lay out
 * @param chaos - Chaos level 0-1 (0 = uniform, 1 = asymmetric)
 * @returns Array of column spans
 */
export function selectPattern(count: number, chaos: number): GridPattern {
  // Find the closest count we have patterns for
  const availableCounts = Object.keys(PATTERNS).map(Number);
  const closestCount = availableCounts.reduce((prev, curr) =>
    Math.abs(curr - count) < Math.abs(prev - count) ? curr : prev
  );

  const patterns = PATTERNS[closestCount];
  if (!patterns || patterns.length === 0) {
    // Fallback: equal distribution
    return Array(count).fill(1);
  }

  // Select pattern based on chaos level
  const index = Math.floor(chaos * (patterns.length - 1));
  const basePattern = patterns[Math.min(index, patterns.length - 1)];

  // If the pattern length doesn't match count, adjust it
  if (basePattern.length !== count) {
    return adjustPatternLength(basePattern, count);
  }

  return basePattern;
}

/**
 * Adjust a pattern to match a different item count
 */
function adjustPatternLength(pattern: GridPattern, targetCount: number): GridPattern {
  if (pattern.length === targetCount) {
    return pattern;
  }

  if (pattern.length > targetCount) {
    // Truncate
    return pattern.slice(0, targetCount);
  }

  // Extend by repeating the pattern or using 1s
  const result = [...pattern];
  while (result.length < targetCount) {
    // Add 1s (smallest span) for additional items
    result.push(1);
  }
  return result;
}

/**
 * Calculate the total columns needed for a pattern
 */
export function getPatternColumnCount(pattern: GridPattern): number {
  return Math.max(...pattern);
}

/**
 * Get a pattern that works well for a specific grid column count
 *
 * @param itemCount - Number of items
 * @param gridColumns - Number of grid columns available
 * @param chaos - Chaos level 0-1
 */
export function selectPatternForGrid(
  itemCount: number,
  gridColumns: number,
  chaos: number
): GridPattern {
  const basePattern = selectPattern(itemCount, chaos);

  // Scale pattern spans to fit the grid
  const maxSpan = Math.max(...basePattern);
  if (maxSpan > gridColumns) {
    // Scale down all spans proportionally
    return basePattern.map(span =>
      Math.max(1, Math.round((span / maxSpan) * gridColumns))
    );
  }

  return basePattern;
}

/**
 * Layout types with specific grid configurations
 */
export type LayoutType = 'equal' | 'featured' | 'bento' | 'masonry' | 'alternating';

/**
 * Get a pre-configured pattern for a layout type
 */
export function getLayoutPattern(type: LayoutType, itemCount: number): GridPattern {
  switch (type) {
    case 'equal':
      return Array(itemCount).fill(1);

    case 'featured':
      // First item is featured (double width)
      return [2, ...Array(itemCount - 1).fill(1)];

    case 'bento':
      // Bento box style with varying sizes
      if (itemCount <= 3) return selectPattern(itemCount, 0.6);
      if (itemCount <= 5) return selectPattern(itemCount, 0.7);
      return selectPattern(itemCount, 0.8);

    case 'masonry':
      // Masonry typically uses equal widths (height varies)
      return Array(itemCount).fill(1);

    case 'alternating':
      // Alternate between 2 and 1
      return Array(itemCount).fill(0).map((_, i) => (i % 3 === 0 ? 2 : 1));

    default:
      return Array(itemCount).fill(1);
  }
}

/**
 * Row-based patterns for two-row layouts
 */
export const TWO_ROW_PATTERNS: Record<number, { row1: GridPattern; row2: GridPattern }[]> = {
  4: [
    { row1: [1, 1], row2: [1, 1] },           // 2x2
    { row1: [2, 1], row2: [1, 2] },           // Staggered
  ],
  5: [
    { row1: [1, 1, 1], row2: [1, 1] },        // 3-2
    { row1: [2, 1], row2: [1, 1, 1] },        // Featured top
  ],
  6: [
    { row1: [1, 1, 1], row2: [1, 1, 1] },     // 3x3
    { row1: [2, 1, 1], row2: [1, 1, 2] },     // Staggered
    { row1: [2, 2], row2: [1, 1, 1, 1] },     // Featured top, 4 bottom
  ],
};

/**
 * Select a two-row pattern
 */
export function selectTwoRowPattern(itemCount: number, chaos: number): { row1: GridPattern; row2: GridPattern } {
  const patterns = TWO_ROW_PATTERNS[itemCount];
  if (!patterns || patterns.length === 0) {
    // Default: split evenly
    const half = Math.ceil(itemCount / 2);
    return {
      row1: Array(half).fill(1),
      row2: Array(itemCount - half).fill(1),
    };
  }

  const index = Math.floor(chaos * (patterns.length - 1));
  return patterns[Math.min(index, patterns.length - 1)];
}

/**
 * Generate CSS grid classes for a pattern
 */
export function generatePatternCSS(pattern: GridPattern, className: string): string {
  const maxSpan = Math.max(...pattern);

  return `
    .${className} {
      display: grid;
      grid-template-columns: repeat(${maxSpan}, 1fr);
      gap: 1.5rem;
    }

    ${pattern.map((span, i) => `
    .${className} > *:nth-child(${i + 1}) {
      grid-column: span ${span};
    }
    `).join('')}

    /* Mobile: Stack everything */
    @media (max-width: 768px) {
      .${className} {
        grid-template-columns: 1fr;
      }
      .${className} > * {
        grid-column: span 1 !important;
      }
    }
  `;
}
