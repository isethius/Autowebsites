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

import {
  generateTestimonialsGrid,
  generateFeaturedTestimonial,
  generateTestimonialSlider,
  generateTestimonialsCSS,
  type TestimonialsConfig,
} from '../../preview/industry-templates/_shared/sections/testimonials';

import {
  generateContactSection,
  generateContactCTA,
  generateContactFooter,
  generateContactCSS,
  type ContactConfig,
} from '../../preview/industry-templates/_shared/sections/contact-form';

import {
  generateFooter,
  generateMinimalFooter,
  generateCompactFooter,
  generateFooterCSS,
  type FooterConfig,
} from '../../preview/industry-templates/_shared/sections/footer';

import {
  generateStatsGrid,
  generateStatsCards,
  generateStatsCSS,
  type StatsConfig,
} from '../../preview/industry-templates/_shared/sections/stats';

import { ColorPalette } from '../../overnight/types';
import { Testimonial } from '../../preview/industry-templates/_shared/types';
import { getAnimationClass } from '../../preview/industry-templates/_shared/styles/dna-styles';

// =============================================================================
// ANIMATION HELPER
// =============================================================================

/**
 * Wrap section output with DNA-based entrance animation class
 *
 * @param output - The section output to wrap
 * @param dna - DNA code containing motion setting
 * @returns Section output with animation class applied
 */
function withAnimation(output: SectionOutput, motion: string): SectionOutput {
  const animationClass = getAnimationClass(motion);
  const html = output.html;

  // Find the first element tag and add the animation class
  // This regex matches the first HTML tag and adds the class to it
  const wrappedHtml = html.replace(
    /^(\s*<\w+)(\s|>)/,
    `$1 class="${animationClass}"$2`
  ).replace(
    // Handle case where class already exists
    /class="([^"]+)"\s+class="/,
    'class="$1 '
  );

  return {
    html: wrappedHtml,
    css: output.css,
  };
}

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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
    },
  },
  {
    id: 'hero-h4-video',
    name: 'Video Background',
    category: 'hero',
    description: 'Hero with video/animated background overlay',
    dnaMatch: { hero: 'H4' },
    chaosRange: [0.4, 0.9],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H4' },
        businessName: config.content.businessName as string,
      };
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
    },
  },
  {
    id: 'hero-h5-gradient-overlay',
    name: 'Gradient Overlay',
    category: 'hero',
    description: 'Image with gradient mask overlay',
    dnaMatch: { hero: 'H5' },
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
        dna: { ...config.dna, hero: 'H5' },
        businessName: config.content.businessName as string,
      };
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
    },
  },
  {
    id: 'hero-h6-animated',
    name: 'Animated Background',
    category: 'hero',
    description: 'CSS animation background with particles effect',
    dnaMatch: { hero: 'H6' },
    chaosRange: [0.5, 1.0],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H6' },
        businessName: config.content.businessName as string,
      };
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
    },
  },
  {
    id: 'hero-h7-carousel',
    name: 'Carousel Slider',
    category: 'hero',
    description: 'Multiple slides with navigation',
    dnaMatch: { hero: 'H7' },
    chaosRange: [0.3, 0.8],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const heroConfig: DNAHeroConfig = {
        headline: config.content.headline as string || 'Welcome',
        tagline: config.content.tagline as string || '',
        trustBadges: config.content.trustBadges as string[],
        primaryCTA: config.content.primaryCTA as { text: string; href: string },
        secondaryCTA: config.content.secondaryCTA as { text: string; href: string },
        palette: config.palette as ColorPalette,
        dna: { ...config.dna, hero: 'H7' },
        businessName: config.content.businessName as string,
      };
      return withAnimation(generateDNAHero(heroConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAServices(servicesConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAServices(servicesConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAServices(servicesConfig), config.dna.motion || 'M1');
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
      return withAnimation(generateDNAServices(servicesConfig), config.dna.motion || 'M1');
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
// TESTIMONIALS SECTION ADAPTERS
// =============================================================================

const testimonialsVariants: SectionVariant[] = [
  {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    category: 'testimonials',
    description: 'Standard 3-column grid of testimonial cards',
    dnaMatch: { layout: 'L3' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const testimonials = (config.content.testimonials || []) as Testimonial[];
      const output = {
        html: generateTestimonialsGrid({
          title: config.content.title as string || 'What Our Customers Say',
          subtitle: config.content.subtitle as string,
          testimonials,
        }),
        css: generateTestimonialsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
    },
  },
  {
    id: 'testimonials-featured',
    name: 'Featured Testimonial',
    category: 'testimonials',
    description: 'Single large testimonial with emphasis',
    dnaMatch: { layout: 'L5' },
    chaosRange: [0, 0.3],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const testimonials = (config.content.testimonials || []) as Testimonial[];
      const first = testimonials[0] || { text: 'Great service!', author: 'Customer', rating: 5 };
      const output = {
        html: generateFeaturedTestimonial(first),
        css: generateTestimonialsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
    },
  },
  {
    id: 'testimonials-slider',
    name: 'Testimonial Slider',
    category: 'testimonials',
    description: 'Horizontal slider with navigation dots',
    dnaMatch: { layout: 'L12' },
    chaosRange: [0.3, 0.7],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const testimonials = (config.content.testimonials || []) as Testimonial[];
      const output = {
        html: generateTestimonialSlider(testimonials),
        css: generateTestimonialsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
    },
  },
];

// =============================================================================
// CONTACT SECTION ADAPTERS
// =============================================================================

const contactVariants: SectionVariant[] = [
  {
    id: 'contact-split',
    name: 'Split Contact',
    category: 'contact',
    description: 'Two-column layout with info and form',
    dnaMatch: { layout: 'L3' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateContactSection({
          title: config.content.title as string,
          subtitle: config.content.subtitle as string,
          phone: config.content.phone as string,
          email: config.content.email as string,
          city: config.content.city as string,
          state: config.content.state as string,
          address: config.content.address as string,
          hours: config.content.hours as string,
        }),
        css: generateContactCSS(),
      };
    },
  },
  {
    id: 'contact-cta',
    name: 'Contact CTA',
    category: 'contact',
    description: 'Bold call-to-action contact section',
    dnaMatch: { hero: 'H9' },
    chaosRange: [0.4, 0.8],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateContactCTA({
          phone: config.content.phone as string,
          title: config.content.title as string,
        }),
        css: generateContactCSS(),
      };
    },
  },
  {
    id: 'contact-minimal',
    name: 'Minimal Contact',
    category: 'contact',
    description: 'Simple inline contact info',
    dnaMatch: { design: 'D4' },
    chaosRange: [0, 0.3],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateContactFooter({
          phone: config.content.phone as string,
          email: config.content.email as string,
          city: config.content.city as string,
          state: config.content.state as string,
        }),
        css: '',
      };
    },
  },
];

// =============================================================================
// FOOTER SECTION ADAPTERS
// =============================================================================

const footerVariants: SectionVariant[] = [
  {
    id: 'footer-full',
    name: 'Full Footer',
    category: 'footer',
    description: 'Complete footer with branding, links, and contact',
    dnaMatch: { layout: 'L3' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateFooter({
          businessName: config.content.businessName as string || 'Business',
          tagline: config.content.tagline as string,
          phone: config.content.phone as string,
          email: config.content.email as string,
          city: config.content.city as string,
          state: config.content.state as string,
          license: config.content.license as string,
        }),
        css: generateFooterCSS(),
      };
    },
  },
  {
    id: 'footer-minimal',
    name: 'Minimal Footer',
    category: 'footer',
    description: 'Simple centered footer',
    dnaMatch: { design: 'D4' },
    chaosRange: [0, 0.3],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateMinimalFooter({
          businessName: config.content.businessName as string || 'Business',
          phone: config.content.phone as string,
          email: config.content.email as string,
        }),
        css: generateFooterCSS(),
      };
    },
  },
  {
    id: 'footer-compact',
    name: 'Compact Footer',
    category: 'footer',
    description: 'Single-line compact footer',
    dnaMatch: { layout: 'L5' },
    chaosRange: [0, 0.4],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      return {
        html: generateCompactFooter(config.content.businessName as string || 'Business'),
        css: '',
      };
    },
  },
];

// =============================================================================
// STATS SECTION ADAPTERS
// =============================================================================

interface StatItem {
  value: string;
  label: string;
  description?: string;
}

const statsVariants: SectionVariant[] = [
  {
    id: 'stats-grid',
    name: 'Stats Grid',
    category: 'stats',
    description: 'Standard 4-column stats grid',
    dnaMatch: { layout: 'L3' },
    chaosRange: [0, 0.5],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const stats = (config.content.stats || []) as StatItem[];
      const output = {
        html: generateStatsGrid({
          title: config.content.title as string,
          subtitle: config.content.subtitle as string,
          stats,
        }),
        css: generateStatsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
    },
  },
  {
    id: 'stats-cards',
    name: 'Stats Cards',
    category: 'stats',
    description: 'Card-based stats layout',
    dnaMatch: { layout: 'L10' },
    chaosRange: [0.3, 0.7],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const stats = (config.content.stats || []) as StatItem[];
      const output = {
        html: generateStatsCards({
          title: config.content.title as string,
          subtitle: config.content.subtitle as string,
          stats,
        }),
        css: generateStatsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
    },
  },
  {
    id: 'stats-primary',
    name: 'Stats Primary',
    category: 'stats',
    description: 'Stats with primary background color',
    dnaMatch: { design: 'D2' },
    chaosRange: [0.2, 0.6],
    priority: 1,
    render: (config: SectionConfig): SectionOutput => {
      const stats = (config.content.stats || []) as StatItem[];
      const output = {
        html: generateStatsGrid({
          title: config.content.title as string,
          subtitle: config.content.subtitle as string,
          stats,
          background: 'primary',
        }),
        css: generateStatsCSS(),
      };
      return withAnimation(output, config.dna.motion || 'M1');
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
    ...testimonialsVariants,
    ...contactVariants,
    ...footerVariants,
    ...statsVariants,
  ]);
}

/**
 * Get the count of registered adapters
 */
export function getAdapterCount(): number {
  return (
    heroVariants.length +
    servicesVariants.length +
    navVariants.length +
    testimonialsVariants.length +
    contactVariants.length +
    footerVariants.length +
    statsVariants.length
  );
}
