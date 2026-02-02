/**
 * Site Builder
 *
 * The main entry point for generating websites using the generative
 * component architecture. This replaces monolithic template files with
 * a configuration-driven approach.
 *
 * Usage:
 * ```typescript
 * const html = buildWebsite({
 *   businessName: 'Quick Fix Plumbing',
 *   industry: 'plumber',
 *   services: [...],
 *   contact: { phone: '555-1234', city: 'Phoenix', state: 'AZ' },
 * });
 * ```
 */

import { DNACode } from '../variance-planner';
import { ColorPalette } from '../../overnight/types';
import { getBlueprintForIndustry, Blueprint, BlueprintSection } from '../blueprints';
import { getVibeForIndustry, generateConstrainedDNA } from './harmony/constraints';
import { generatePalette, type PaletteMood } from './harmony/color-math';
import {
  findBestVariant,
  getSectionVariants,
  type SectionConfig,
  type SectionOutput,
} from './section-registry';
import { resolveServiceLayout, generateLayoutCSS } from './layout-resolver';
import { getContentTone, generateTonePrompt } from './content-tone';
import { generateEntranceAnimationClasses } from '../../preview/industry-templates/_shared/styles/dna-styles';

/**
 * Content for building a website
 */
export interface SiteContent {
  businessName: string;
  industry: string;
  tagline?: string;
  headline?: string;
  description?: string;
  services?: Array<{
    name: string;
    description: string;
    icon?: string;
    price?: string;
  }>;
  testimonials?: Array<{
    text: string;
    author: string;
    rating?: number;
  }>;
  team?: Array<{
    name: string;
    title: string;
    bio?: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  hours?: Record<string, string>;
  trustBadges?: string[];
}

/**
 * Options for building a website
 */
export interface BuildOptions {
  /** Override DNA (otherwise auto-generated from industry vibe) */
  dna?: DNACode;
  /** Override palette (otherwise generated from primary color) */
  palette?: ColorPalette;
  /** Primary brand color (hex) for palette generation */
  primaryColor?: string;
  /** Palette mood for generation */
  paletteMood?: PaletteMood;
  /** Override chaos level */
  chaos?: number;
  /** Include inline CSS (default: true) */
  inlineStyles?: boolean;
  /** Include Google Fonts (default: true) */
  includeFonts?: boolean;
}

/**
 * Build a complete website from content and options
 *
 * @param content - The business content to render
 * @param options - Build options including DNA, palette, etc.
 * @returns Complete HTML document
 */
export function buildWebsite(content: SiteContent, options: BuildOptions = {}): string {
  // 1. Get or generate DNA
  const dna = options.dna || generateDNAForIndustry(content.industry);

  // 2. Get or generate palette
  const palette = options.palette || generatePaletteForIndustry(
    content.industry,
    options.primaryColor,
    options.paletteMood
  );

  // 3. Get industry blueprint
  const blueprint = getBlueprintForIndustry(content.industry);
  if (!blueprint) {
    console.warn(`No blueprint found for industry '${content.industry}', using service-business`);
  }

  // 4. Get chaos level
  const chaos = options.chaos ?? dna.chaos ?? 0.3;

  // 5. Build sections
  const sectionOutputs = buildSections(content, blueprint, dna, palette, chaos);

  // 6. Assemble document
  return assembleDocument({
    content,
    dna,
    palette,
    sections: sectionOutputs,
    options,
  });
}

/**
 * Generate DNA codes suitable for an industry
 */
export function generateDNAForIndustry(industry: string): DNACode {
  const vibe = getVibeForIndustry(industry);
  return generateConstrainedDNA(vibe);
}

/**
 * Generate a color palette for an industry
 */
function generatePaletteForIndustry(
  industry: string,
  primaryColor?: string,
  mood?: PaletteMood
): ColorPalette {
  // Default primary colors by industry
  const industryColors: Record<string, string> = {
    plumber: '#1e5a8a',
    electrician: '#f59e0b',
    hvac: '#0369a1',
    roofer: '#854d0e',
    contractor: '#374151',
    lawyer: '#1e3a5f',
    accountant: '#1e40af',
    'financial-advisor': '#065f46',
    realtor: '#7c3aed',
    dentist: '#0891b2',
    chiropractor: '#059669',
    veterinarian: '#7c3aed',
    therapist: '#5f7161',
    gym: '#dc2626',
    restaurant: '#c2410c',
    photographer: '#18181b',
  };

  const color = primaryColor || industryColors[industry] || '#1e5a8a';
  const paletteMood = mood || (industry === 'photographer' ? 'monochrome' : 'muted');

  const generated = generatePalette(color, paletteMood);

  return {
    name: `${industry} palette`,
    primary: generated.primary,
    secondary: generated.secondary,
    accent: generated.accent,
    background: generated.background,
    text: generated.text,
    muted: generated.muted,
  };
}

/**
 * Build all sections based on blueprint
 */
function buildSections(
  content: SiteContent,
  blueprint: Blueprint | undefined,
  dna: DNACode,
  palette: ColorPalette,
  chaos: number
): SectionOutput[] {
  const sections: SectionOutput[] = [];

  // Use blueprint sections or default set
  const sectionDefs = blueprint?.sections || getDefaultSections();

  for (const sectionDef of sectionDefs) {
    // Skip optional sections if content is missing
    if (!sectionDef.required && !hasContentForSection(content, sectionDef.category)) {
      continue;
    }

    const output = buildSection(sectionDef, content, dna, palette, chaos);
    if (output) {
      sections.push(output);
    }
  }

  return sections;
}

/**
 * Build a single section
 */
function buildSection(
  sectionDef: BlueprintSection,
  content: SiteContent,
  dna: DNACode,
  palette: ColorPalette,
  chaos: number
): SectionOutput | null {
  // Find the best variant for this section
  const variant = findBestVariant(sectionDef.category, dna, chaos);

  if (!variant) {
    // Fall back to generating placeholder
    return generatePlaceholderSection(sectionDef, content, dna, palette);
  }

  // Build section config
  const config: SectionConfig = {
    dna,
    palette,
    chaos,
    content: {
      ...sectionDef.config,
      title: sectionDef.title,
      subtitle: sectionDef.subtitle,
      businessName: content.businessName,
      ...getContentForSection(content, sectionDef.category),
    },
  };

  return variant.render(config);
}

/**
 * Check if content exists for a section type
 */
function hasContentForSection(content: SiteContent, category: string): boolean {
  switch (category) {
    case 'services':
      return !!content.services?.length;
    case 'testimonials':
      return !!content.testimonials?.length;
    case 'team':
      return !!content.team?.length;
    case 'faq':
      return !!content.faqs?.length;
    case 'stats':
      return !!content.stats?.length;
    case 'nav':
    case 'hero':
    case 'contact':
    case 'footer':
      return true; // Always have content
    default:
      return true;
  }
}

/**
 * Get content specific to a section type
 */
function getContentForSection(content: SiteContent, category: string): Record<string, unknown> {
  switch (category) {
    case 'nav':
      return {
        businessName: content.businessName,
        phone: content.contact.phone,
      };
    case 'hero':
      return {
        headline: content.headline || `${content.businessName}`,
        tagline: content.tagline || content.description,
        phone: content.contact.phone,
        trustBadges: content.trustBadges,
      };
    case 'services':
      return { services: content.services };
    case 'testimonials':
      return { testimonials: content.testimonials };
    case 'team':
      return { team: content.team };
    case 'faq':
      return { faqs: content.faqs };
    case 'stats':
      return { stats: content.stats };
    case 'contact':
      return {
        ...content.contact,
        hours: content.hours,
      };
    case 'footer':
      return {
        businessName: content.businessName,
        ...content.contact,
      };
    default:
      return {};
  }
}

/**
 * Generate a placeholder section when no variant is registered
 */
function generatePlaceholderSection(
  sectionDef: BlueprintSection,
  content: SiteContent,
  dna: DNACode,
  palette: ColorPalette
): SectionOutput {
  const title = sectionDef.title || sectionDef.category;

  return {
    html: `
      <section id="${sectionDef.category}" class="section-placeholder">
        <div class="container">
          <h2>${title}</h2>
          <p>Section: ${sectionDef.category}</p>
        </div>
      </section>
    `,
    css: `
      .section-placeholder {
        padding: 60px 0;
        background: var(--gray-50);
        text-align: center;
      }
    `,
  };
}

/**
 * Get default sections when no blueprint exists
 */
function getDefaultSections(): BlueprintSection[] {
  return [
    { category: 'nav', required: true },
    { category: 'hero', required: true },
    { category: 'services', required: false, title: 'Our Services' },
    { category: 'about', required: false, title: 'About Us' },
    { category: 'testimonials', required: false, title: 'Testimonials' },
    { category: 'contact', required: true, title: 'Contact Us' },
    { category: 'footer', required: true },
  ];
}

/**
 * Generate Lenis smooth scroll script
 * Injected for M2/M3 motion levels to provide premium scroll physics
 */
function generateLenisScript(motion: string): string {
  // Only inject for M2 (moderate) or M3 (dramatic) motion
  if (motion !== 'M2' && motion !== 'M3') {
    return '';
  }

  // M3 = luxurious feel (1.4s), M2 = smooth feel (1.0s)
  const duration = motion === 'M3' ? '1.4' : '1.0';

  return `
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
  <script>
    // Lenis Smooth Scroll - ${motion === 'M3' ? 'Luxurious' : 'Smooth'} Feel
    const lenis = new Lenis({
      duration: ${duration},
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  </script>`;
}

/**
 * Assemble the final HTML document
 */
function assembleDocument(params: {
  content: SiteContent;
  dna: DNACode;
  palette: ColorPalette;
  sections: SectionOutput[];
  options: BuildOptions;
}): string {
  const { content, dna, palette, sections, options } = params;

  // Combine all CSS
  const allCSS = sections.map(s => s.css).join('\n');

  // Combine all HTML
  const allHTML = sections.map(s => s.html).join('\n');

  // Generate base styles
  const baseStyles = generateBaseStyles(dna, palette);

  // Font imports
  const fontImport = options.includeFonts !== false
    ? getFontImport(dna.typography || 'T1')
    : '';

  // Lenis script for smooth scrolling (M2/M3 motion only)
  const lenisScript = generateLenisScript(dna.motion || 'M1');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.businessName}</title>
  <meta name="description" content="${content.description || content.tagline || ''}">
  ${fontImport ? `<link href="${fontImport}" rel="stylesheet">` : ''}
  <style>
    ${baseStyles}
    ${allCSS}
  </style>
</head>
<body>
  ${allHTML}
  ${lenisScript}
</body>
</html>`;
}

/**
 * Generate base CSS styles
 */
function generateBaseStyles(dna: DNACode, palette: ColorPalette): string {
  // Get entrance animation classes for DNA motion
  const entranceAnimations = generateEntranceAnimationClasses();

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --accent: ${palette.accent};
      --background: ${palette.background};
      --text: ${palette.text};
      --muted: ${palette.muted};
      --white: #ffffff;
      --black: #000000;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
    }

    img {
      max-width: 100%;
      height: auto;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 36px;
      margin-bottom: 12px;
    }

    .section-header p {
      color: var(--muted);
      font-size: 18px;
    }

    /* DNA Entrance Animations */
    ${entranceAnimations}

    @media (max-width: 768px) {
      .section-header h2 { font-size: 28px; }
      .section-header p { font-size: 16px; }
    }
  `;
}

/**
 * Get Google Fonts import URL
 */
function getFontImport(typography: string): string {
  const fonts: Record<string, string> = {
    T1: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    T2: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap',
    T3: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    T4: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap',
  };
  return fonts[typography] || fonts.T1;
}

/**
 * Get content tone configuration for AI content generation
 */
export function getContentToneForSite(content: SiteContent, dna: DNACode): ReturnType<typeof getContentTone> {
  const vibe = getVibeForIndustry(content.industry);
  return getContentTone(dna, vibe);
}

/**
 * Get AI prompt for generating content that matches the design
 */
export function getAIContentPrompt(content: SiteContent, dna: DNACode): string {
  const toneConfig = getContentToneForSite(content, dna);
  return generateTonePrompt(toneConfig);
}
