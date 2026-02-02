/**
 * Section Adapters
 *
 * Wraps existing section generators to register them with the section registry.
 * This bridges the gap between the old template system and the new generative
 * component architecture.
 */

import {
  registerSections,
  type SectionVariant,
  type SectionConfig,
  type SectionOutput,
} from './section-registry';

import {
  generateDNAHero,
  type DNAHeroConfig,
} from '../../preview/industry-templates/_shared/sections/hero-variants';

import {
  generateDNAServices,
  type DNAServicesConfig,
} from '../../preview/industry-templates/_shared/sections/services-grid';

import {
  generateDNANav,
  type NavConfig,
} from '../../preview/industry-templates/_shared/sections/dna-nav';

import { ColorPalette } from '../../overnight/types';

// =============================================================================
// HERO SECTION ADAPTERS
// =============================================================================

const heroVariants: SectionVariant[] = [
  {
    id: 'hero-h1-full-width',
    name: 'Full-Width Impact',
    category: 'hero',
    description: 'Full-screen hero with gradient background, perfect for service businesses',
    dnaMatch: { hero: 'H1' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        phone: config.content.phone as string,
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: config.dna,
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
  {
    id: 'hero-h2-split',
    name: 'Split Screen',
    category: 'hero',
    description: 'Two-column hero with image on one side',
    dnaMatch: { hero: 'H2' },
    chaosRange: [0.2, 0.6],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H2' },
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
  {
    id: 'hero-h3-minimal',
    name: 'Minimal Header',
    category: 'hero',
    description: 'Compact hero with subtle background, professional feel',
    dnaMatch: { hero: 'H3' },
    chaosRange: [0, 0.3],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H3' },
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
  {
    id: 'hero-h8-asymmetric',
    name: 'Asymmetric Split',
    category: 'hero',
    description: 'Dynamic asymmetric layout with clip-path background',
    dnaMatch: { hero: 'H8' },
    chaosRange: [0.4, 0.8],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H8' },
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
  {
    id: 'hero-h9-text-only',
    name: 'Text Only',
    category: 'hero',
    description: 'Bold typography-focused hero, no images',
    dnaMatch: { hero: 'H9' },
    chaosRange: [0.5, 1],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H9' },
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
  {
    id: 'hero-h12-geometric',
    name: 'Geometric Shapes',
    category: 'hero',
    description: 'Abstract geometric patterns with overlapping shapes',
    dnaMatch: { hero: 'H12' },
    chaosRange: [0.3, 0.7],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H12' },
        businessName: config.content.businessName as string,
      };
      return generateDNAHero(heroConfig);
    },
  },
];

// =============================================================================
// SERVICES SECTION ADAPTERS
// =============================================================================

interface ServiceItem {
  name: string;
  description: string;
  icon?: string;
  price?: string;
  duration?: string;
}

const servicesVariants: SectionVariant[] = [
  {
    id: 'services-l3-cards',
    name: 'Card Grid',
    category: 'services',
    description: 'Uniform card-based layout',
    dnaMatch: { layout: 'L3' },
    chaosRange: [0, 0.4],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const servicesConfig: DNAServicesConfig = {
        title: config.content.title as string || 'Our Services',
        subtitle: config.content.subtitle as string || '',
        services: (config.content.services || []) as ServiceItem[],
        dna: { ...config.dna, layout: 'L3' },
      };
      return generateDNAServices(servicesConfig);
    },
  },
  {
    id: 'services-l5-single-column',
    name: 'Single Column',
    category: 'services',
    description: 'Clean single-column flow',
    dnaMatch: { layout: 'L5' },
    chaosRange: [0, 0.3],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const servicesConfig: DNAServicesConfig = {
        title: config.content.title as string || 'Our Services',
        subtitle: config.content.subtitle as string || '',
        services: (config.content.services || []) as ServiceItem[],
        dna: { ...config.dna, layout: 'L5' },
      };
      return generateDNAServices(servicesConfig);
    },
  },
  {
    id: 'services-l9-timeline',
    name: 'Timeline',
    category: 'services',
    description: 'Vertical timeline layout',
    dnaMatch: { layout: 'L9' },
    chaosRange: [0.2, 0.6],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const servicesConfig: DNAServicesConfig = {
        title: config.content.title as string || 'Our Services',
        subtitle: config.content.subtitle as string || '',
        services: (config.content.services || []) as ServiceItem[],
        dna: { ...config.dna, layout: 'L9' },
      };
      return generateDNAServices(servicesConfig);
    },
  },
  {
    id: 'services-l10-bento',
    name: 'Bento Box',
    category: 'services',
    description: 'Mixed-size tile grid',
    dnaMatch: { layout: 'L10' },
    chaosRange: [0.5, 1],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const servicesConfig: DNAServicesConfig = {
        title: config.content.title as string || 'Our Services',
        subtitle: config.content.subtitle as string || '',
        services: (config.content.services || []) as ServiceItem[],
        dna: { ...config.dna, layout: 'L10' },
      };
      return generateDNAServices(servicesConfig);
    },
  },
];

// =============================================================================
// NAV SECTION ADAPTERS
// =============================================================================

const navVariants: SectionVariant[] = [
  {
    id: 'nav-n1-fixed',
    name: 'Fixed Top Bar',
    category: 'nav',
    description: 'Standard sticky navigation',
    dnaMatch: { nav: 'N1' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const navConfig: NavConfig = {
        businessName: config.content.businessName as string || 'Business',
        dna: { ...config.dna, nav: 'N1' },
        phone: config.content.phone as string,
        ctaText: config.content.ctaText as string,
        ctaHref: config.content.ctaHref as string,
      };
      return generateDNANav(navConfig);
    },
  },
  {
    id: 'nav-n2-transparent',
    name: 'Transparent Header',
    category: 'nav',
    description: 'See-through nav over hero',
    dnaMatch: { nav: 'N2' },
    chaosRange: [0.2, 0.7],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const navConfig: NavConfig = {
        businessName: config.content.businessName as string || 'Business',
        dna: { ...config.dna, nav: 'N2' },
        ctaText: config.content.ctaText as string,
        ctaHref: config.content.ctaHref as string,
      };
      return generateDNANav(navConfig);
    },
  },
  {
    id: 'nav-n4-sidebar',
    name: 'Sidebar Nav',
    category: 'nav',
    description: 'Vertical side navigation',
    dnaMatch: { nav: 'N4' },
    chaosRange: [0.3, 0.8],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const navConfig: NavConfig = {
        businessName: config.content.businessName as string || 'Business',
        dna: { ...config.dna, nav: 'N4' },
        phone: config.content.phone as string,
        ctaText: config.content.ctaText as string,
        ctaHref: config.content.ctaHref as string,
      };
      return generateDNANav(navConfig);
    },
  },
  {
    id: 'nav-n7-floating',
    name: 'Floating Nav',
    category: 'nav',
    description: 'Rounded floating bar',
    dnaMatch: { nav: 'N7' },
    chaosRange: [0.4, 1],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const navConfig: NavConfig = {
        businessName: config.content.businessName as string || 'Business',
        dna: { ...config.dna, nav: 'N7' },
        ctaText: config.content.ctaText as string,
        ctaHref: config.content.ctaHref as string,
      };
      return generateDNANav(navConfig);
    },
  },
  {
    id: 'nav-n9-minimal',
    name: 'Minimal Links',
    category: 'nav',
    description: 'Sparse top-right links',
    dnaMatch: { nav: 'N9' },
    chaosRange: [0, 0.4],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const navConfig: NavConfig = {
        businessName: config.content.businessName as string || 'Business',
        dna: { ...config.dna, nav: 'N9' },
        ctaText: config.content.ctaText as string,
        ctaHref: config.content.ctaHref as string,
      };
      return generateDNANav(navConfig);
    },
  },
];

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register all existing section adapters with the registry.
 * Call this once at app startup.
 */
export function registerExistingSections(): void {
  registerSections([
    ...heroVariants,
    ...servicesVariants,
    ...navVariants,
  ]);
}

/**
 * Get the count of registered adapters
 */
export function getAdapterCount(): number {
  return heroVariants.length + servicesVariants.length + navVariants.length;
}
