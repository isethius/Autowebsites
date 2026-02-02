/**
 * Generative Component Engine
 *
 * The engine provides a configuration-driven approach to generating
 * unique, Awwwards-quality websites. It replaces monolithic template
 * files with a composable system of:
 *
 * - Vibes: Constraint sets that ensure aesthetic harmony
 * - Section Registry: Atomic components that register capabilities
 * - Layout Resolver: Content-aware grid packing
 * - Site Builder: Single entry point for generation
 *
 * @example
 * ```typescript
 * import { buildWebsite } from './themes/engine';
 *
 * const html = buildWebsite({
 *   businessName: 'Quick Fix Plumbing',
 *   industry: 'plumber',
 *   services: [...],
 *   contact: { phone: '555-1234' },
 * });
 * ```
 */

// Harmony Engine (Constraint System)
export * from './harmony';

// Section Registry
export {
  type SectionCategory,
  type SectionOutput,
  type SectionConfig,
  type SectionVariant,
  registerSection,
  registerSections,
  getSectionVariants,
  getVariantById,
  findBestVariant,
  findMatchingVariants,
  getRegisteredCategories,
  getTotalVariantCount,
  clearRegistry,
  getRegistryStats,
  createVariant,
} from './section-registry';

// Layout Resolver (Grid Packer)
export {
  type LayoutConfig,
  type LayoutItem,
  resolveServiceLayout,
  resolveTestimonialsLayout,
  resolveStatsLayout,
  resolveTeamLayout,
  resolveGalleryLayout,
  resolveFAQLayout,
  resolvePricingLayout,
  generateLayoutCSS,
} from './layout-resolver';

// Content Tone (AI Integration)
export {
  type ContentToneConfig,
  getContentTone,
  generateTonePrompt,
  validateContentTone,
  getToneForIndustry,
} from './content-tone';

// Site Builder (Main Entry Point)
export {
  type SiteContent,
  type BuildOptions,
  buildWebsite,
  generateDNAForIndustry,
  getContentToneForSite,
  getAIContentPrompt,
} from './site-builder';

// Section Adapters (Existing Sections)
export {
  registerExistingSections,
  getAdapterCount,
} from './section-adapters';
