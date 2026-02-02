/**
 * Section Registry
 *
 * Central registry for all section variants. Sections register themselves
 * with metadata about which DNA codes they support, allowing the layout
 * resolver to pick the best variant for a given DNA combination.
 *
 * This is the foundation of the generative component architecture.
 */

import { DNACode } from '../variance-planner';
import { ColorPalette } from '../../overnight/types';

/**
 * Section categories that group related variants
 */
export type SectionCategory =
  | 'nav'
  | 'hero'
  | 'services'
  | 'testimonials'
  | 'stats'
  | 'about'
  | 'team'
  | 'faq'
  | 'contact'
  | 'gallery'
  | 'pricing'
  | 'features'
  | 'cta'
  | 'footer';

/**
 * Output from a section renderer
 */
export interface SectionOutput {
  html: string;
  css: string;
}

/**
 * Configuration passed to section renderers
 */
export interface SectionConfig {
  dna: DNACode;
  palette: ColorPalette;
  content: Record<string, unknown>;
  chaos?: number;
}

/**
 * A section variant is a specific implementation of a section category
 * that renders differently based on DNA codes.
 */
export interface SectionVariant {
  /** Unique identifier, e.g., "hero-split-dramatic" */
  id: string;

  /** Human-readable name */
  name: string;

  /** Which section category this belongs to */
  category: SectionCategory;

  /** Description of when to use this variant */
  description: string;

  /** DNA codes this variant is optimized for (partial match) */
  dnaMatch: Partial<DNACode>;

  /** Chaos level this variant works well with (0-1) */
  chaosRange?: [number, number];

  /** The render function that generates HTML and CSS */
  render: (config: SectionConfig) => SectionOutput;

  /** Priority when multiple variants match (higher = preferred) */
  priority?: number;
}

/**
 * The central registry mapping categories to their variants
 */
const SECTION_REGISTRY: Map<SectionCategory, SectionVariant[]> = new Map();

/**
 * Register a section variant with the registry
 *
 * @param variant - The variant to register
 *
 * @example
 * ```typescript
 * registerSection({
 *   id: 'hero-full-width',
 *   name: 'Full Width Hero',
 *   category: 'hero',
 *   description: 'Full-width hero with gradient background',
 *   dnaMatch: { hero: 'H1' },
 *   render: (config) => ({ html: '...', css: '...' }),
 * });
 * ```
 */
export function registerSection(variant: SectionVariant): void {
  const existing = SECTION_REGISTRY.get(variant.category) || [];

  // Check for duplicate ID
  const duplicate = existing.find(v => v.id === variant.id);
  if (duplicate) {
    console.warn(`Section variant '${variant.id}' already registered, replacing...`);
    const index = existing.indexOf(duplicate);
    existing[index] = variant;
  } else {
    existing.push(variant);
  }

  SECTION_REGISTRY.set(variant.category, existing);
}

/**
 * Register multiple section variants at once
 */
export function registerSections(variants: SectionVariant[]): void {
  for (const variant of variants) {
    registerSection(variant);
  }
}

/**
 * Get all variants for a category
 */
export function getSectionVariants(category: SectionCategory): SectionVariant[] {
  return SECTION_REGISTRY.get(category) || [];
}

/**
 * Get a specific variant by ID
 */
export function getVariantById(id: string): SectionVariant | undefined {
  for (const variants of SECTION_REGISTRY.values()) {
    const found = variants.find(v => v.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Calculate how well a variant matches given DNA
 * Returns a score 0-1 (higher = better match)
 */
function calculateMatchScore(variant: SectionVariant, dna: DNACode, chaos: number = 0): number {
  let score = 0;
  let maxScore = 0;

  // Check each DNA property in the variant's dnaMatch
  for (const [key, value] of Object.entries(variant.dnaMatch)) {
    if (value) {
      maxScore += 1;
      if (dna[key as keyof DNACode] === value) {
        score += 1;
      }
    }
  }

  // Check chaos range
  if (variant.chaosRange) {
    const [min, max] = variant.chaosRange;
    if (chaos >= min && chaos <= max) {
      score += 0.5;
      maxScore += 0.5;
    } else if (chaos < min) {
      // Slightly out of range
      score += 0.25 * (1 - (min - chaos));
      maxScore += 0.5;
    } else {
      score += 0.25 * (1 - (chaos - max));
      maxScore += 0.5;
    }
  }

  // Add priority bonus
  if (variant.priority) {
    score += variant.priority * 0.1;
    maxScore += 0.5;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Find the best matching variant for given DNA and category
 *
 * @param category - The section category to search
 * @param dna - The DNA code to match against
 * @param chaos - Optional chaos level (0-1)
 * @returns The best matching variant, or undefined if none found
 */
export function findBestVariant(
  category: SectionCategory,
  dna: DNACode,
  chaos: number = 0
): SectionVariant | undefined {
  const variants = getSectionVariants(category);
  if (variants.length === 0) return undefined;

  let bestVariant: SectionVariant | undefined;
  let bestScore = -1;

  for (const variant of variants) {
    const score = calculateMatchScore(variant, dna, chaos);
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  }

  return bestVariant;
}

/**
 * Find all variants that match DNA above a threshold
 */
export function findMatchingVariants(
  category: SectionCategory,
  dna: DNACode,
  chaos: number = 0,
  threshold: number = 0.3
): SectionVariant[] {
  const variants = getSectionVariants(category);

  return variants
    .map(variant => ({
      variant,
      score: calculateMatchScore(variant, dna, chaos),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ variant }) => variant);
}

/**
 * Get all registered categories
 */
export function getRegisteredCategories(): SectionCategory[] {
  return Array.from(SECTION_REGISTRY.keys());
}

/**
 * Get total number of registered variants
 */
export function getTotalVariantCount(): number {
  let count = 0;
  for (const variants of SECTION_REGISTRY.values()) {
    count += variants.length;
  }
  return count;
}

/**
 * Clear the registry (useful for testing)
 */
export function clearRegistry(): void {
  SECTION_REGISTRY.clear();
}

/**
 * Get registry stats for debugging
 */
export function getRegistryStats(): Record<SectionCategory, number> {
  const stats: Partial<Record<SectionCategory, number>> = {};
  for (const [category, variants] of SECTION_REGISTRY.entries()) {
    stats[category] = variants.length;
  }
  return stats as Record<SectionCategory, number>;
}

/**
 * Helper to create a section variant with defaults
 */
export function createVariant(
  partial: Omit<SectionVariant, 'priority'> & { priority?: number }
): SectionVariant {
  return {
    priority: 0,
    ...partial,
  };
}
