/**
 * Industry Templates Index
 *
 * Industry-specific website templates with tailored layouts,
 * content structures, and color palettes.
 *
 * Now with DNA-aware template generation for "Awwwards" quality variety.
 */

import { IndustryType } from '../../ai/industry-templates';
import { ColorPalette, IndustryTemplateConfig, PreviewContent } from '../../overnight/types';
import { DNACode, generateDNACode } from '../../themes/variance-planner';
import {
  buildWebsite as buildGenerativeWebsite,
  registerExistingSections,
  type SiteContent,
  type BuildOptions,
} from '../../themes/engine';

// Feature flag for generative architecture
export const USE_GENERATIVE_ARCHITECTURE = false;

// Auto-register existing sections with the registry
registerExistingSections();

// Import DNA-aware templates
import { generatePlumberTemplate, PlumberTemplateInput } from './plumber/template';

// Import palettes from new templates
import { RESTAURANT_PALETTES } from './restaurant/template';
import { LAWYER_PALETTES } from './lawyer/template';
import { DENTIST_PALETTES } from './dentist/template';
import { REALTOR_PALETTES } from './realtor/template';
import { CONTRACTOR_PALETTES } from './contractor/template';
import { ELECTRICIAN_PALETTES } from './electrician/template';
import { ROOFER_PALETTES } from './roofer/template';
import { CHIROPRACTOR_PALETTES } from './chiropractor/template';
import { VETERINARIAN_PALETTES } from './veterinarian/template';
import { PHOTOGRAPHER_PALETTES } from './photographer/template';
import { ACCOUNTANT_PALETTES } from './accountant/template';
import { FINANCIAL_ADVISOR_PALETTES } from './financial-advisor/template';

// Re-export all template palettes
export {
  RESTAURANT_PALETTES,
  LAWYER_PALETTES,
  DENTIST_PALETTES,
  REALTOR_PALETTES,
  CONTRACTOR_PALETTES,
  ELECTRICIAN_PALETTES,
  ROOFER_PALETTES,
  CHIROPRACTOR_PALETTES,
  VETERINARIAN_PALETTES,
  PHOTOGRAPHER_PALETTES,
  ACCOUNTANT_PALETTES,
  FINANCIAL_ADVISOR_PALETTES,
};

/**
 * Therapist/Counselor color palettes - calming, professional
 */
export const THERAPIST_PALETTES: ColorPalette[] = [
  {
    name: 'Calm Sage',
    primary: '#5f7161',
    secondary: '#4a5a4c',
    accent: '#8ba889',
    background: '#faf9f7',
    text: '#2d3436',
    muted: '#636e72',
  },
  {
    name: 'Peaceful Blue',
    primary: '#5c7c94',
    secondary: '#4a6478',
    accent: '#7da1b8',
    background: '#f8fafb',
    text: '#2d3436',
    muted: '#636e72',
  },
  {
    name: 'Warm Lavender',
    primary: '#8e7b9a',
    secondary: '#6d5f78',
    accent: '#b4a7c0',
    background: '#fbfafc',
    text: '#2d3436',
    muted: '#636e72',
  },
  {
    name: 'Earth Terracotta',
    primary: '#a68a72',
    secondary: '#8b7260',
    accent: '#c4a98a',
    background: '#faf8f6',
    text: '#2d3436',
    muted: '#636e72',
  },
];

/**
 * Plumber color palettes - trustworthy, professional
 */
export const PLUMBER_PALETTES: ColorPalette[] = [
  {
    name: 'Trust Blue',
    primary: '#1e5a8a',
    secondary: '#164768',
    accent: '#2980b9',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Reliable Navy',
    primary: '#2c3e50',
    secondary: '#1a252f',
    accent: '#3498db',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Pro Green',
    primary: '#0f766e',
    secondary: '#115e59',
    accent: '#14b8a6',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Emergency Red',
    primary: '#b91c1c',
    secondary: '#991b1b',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

/**
 * HVAC color palettes - comfort, reliability
 */
export const HVAC_PALETTES: ColorPalette[] = [
  {
    name: 'Cool Comfort',
    primary: '#0369a1',
    secondary: '#075985',
    accent: '#0ea5e9',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Warm Reliable',
    primary: '#c2410c',
    secondary: '#9a3412',
    accent: '#f97316',
    background: '#fff7ed',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Energy Efficient',
    primary: '#15803d',
    secondary: '#166534',
    accent: '#22c55e',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Professional Gray',
    primary: '#374151',
    secondary: '#1f2937',
    accent: '#6b7280',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

/**
 * Gym/Fitness color palettes - energetic, motivating
 */
export const GYM_PALETTES: ColorPalette[] = [
  {
    name: 'Power Red',
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Energy Orange',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#fb923c',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Strength Black',
    primary: '#18181b',
    secondary: '#09090b',
    accent: '#fbbf24',
    background: '#fafafa',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Fresh Teal',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#14b8a6',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

/**
 * Yoga/Wellness color palettes - peaceful, balanced
 */
export const YOGA_PALETTES: ColorPalette[] = [
  {
    name: 'Zen Purple',
    primary: '#7e22ce',
    secondary: '#6b21a8',
    accent: '#a855f7',
    background: '#faf5ff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Nature Green',
    primary: '#16a34a',
    secondary: '#15803d',
    accent: '#4ade80',
    background: '#f0fdf4',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Ocean Calm',
    primary: '#0891b2',
    secondary: '#0e7490',
    accent: '#22d3ee',
    background: '#ecfeff',
    text: '#1f2937',
    muted: '#6b7280',
  },
  {
    name: 'Sunset Peach',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#fdba74',
    background: '#fff7ed',
    text: '#1f2937',
    muted: '#6b7280',
  },
];

/**
 * Get color palettes for an industry
 */
export function getIndustryPalettes(industry: IndustryType): ColorPalette[] {
  switch (industry) {
    case 'dentists':
      return DENTIST_PALETTES;
    case 'doctors':
      return THERAPIST_PALETTES;
    case 'plumbers':
      return PLUMBER_PALETTES;
    case 'contractors':
      return CONTRACTOR_PALETTES;
    case 'auto-repair':
      return PLUMBER_PALETTES;
    case 'hvac':
      return HVAC_PALETTES;
    case 'fitness':
      return GYM_PALETTES;
    case 'salons':
      return YOGA_PALETTES;
    case 'restaurants':
      return RESTAURANT_PALETTES;
    case 'lawyers':
      return LAWYER_PALETTES;
    case 'realtors':
      return REALTOR_PALETTES;
    case 'accountants':
      return ACCOUNTANT_PALETTES;
    default:
      return PLUMBER_PALETTES;
  }
}

/**
 * Industry template configurations
 */
export const INDUSTRY_CONFIGS: Record<string, IndustryTemplateConfig> = {
  therapist: {
    industry: 'other',
    display_name: 'Therapist / Counselor',
    sections: ['hero', 'specialties', 'approach', 'about', 'sessions', 'faq', 'contact'],
    suggested_ctas: ['Schedule a Consultation', 'Book Your First Session', 'Get Started', 'Connect With Me'],
    trust_signals: ['Licensed Professional', 'Years of Experience', 'Specializations', 'Confidential'],
    color_palettes: THERAPIST_PALETTES,
  },
  plumber: {
    industry: 'plumbers',
    display_name: 'Plumbing Services',
    sections: ['hero', 'services', 'service-areas', 'emergency', 'reviews', 'about', 'contact'],
    suggested_ctas: ['Call Now', 'Get a Free Quote', 'Schedule Service', 'Emergency Service'],
    trust_signals: ['Licensed & Insured', '24/7 Emergency', 'Satisfaction Guaranteed', 'Years in Business'],
    color_palettes: PLUMBER_PALETTES,
  },
  hvac: {
    industry: 'hvac',
    display_name: 'HVAC Services',
    sections: ['hero', 'services', 'maintenance-plans', 'financing', 'certifications', 'service-areas', 'contact'],
    suggested_ctas: ['Schedule Service', 'Get a Free Estimate', 'Call for Emergency', 'Learn About Financing'],
    trust_signals: ['NATE Certified', 'EPA Certified', 'Financing Available', '24/7 Service'],
    color_palettes: HVAC_PALETTES,
  },
  gym: {
    industry: 'fitness',
    display_name: 'Fitness Center',
    sections: ['hero', 'programs', 'trainers', 'membership', 'schedule', 'facility', 'free-trial', 'contact'],
    suggested_ctas: ['Start Free Trial', 'Join Now', 'Book a Tour', 'Get Your Free Pass'],
    trust_signals: ['Certified Trainers', 'State-of-the-Art Equipment', 'Flexible Hours', 'Results Guaranteed'],
    color_palettes: GYM_PALETTES,
  },
  yoga: {
    industry: 'fitness',
    display_name: 'Yoga Studio',
    sections: ['hero', 'classes', 'schedule', 'instructors', 'pricing', 'first-class', 'about', 'contact'],
    suggested_ctas: ['Book Your First Class Free', 'View Schedule', 'Start Your Journey', 'Try a Free Class'],
    trust_signals: ['Certified Instructors', 'All Levels Welcome', 'Peaceful Environment', 'Community Focused'],
    color_palettes: YOGA_PALETTES,
  },
  // New templates
  restaurant: {
    industry: 'restaurants',
    display_name: 'Restaurant',
    sections: ['hero', 'menu', 'about', 'gallery', 'reservations', 'reviews', 'contact'],
    suggested_ctas: ['View Menu', 'Make a Reservation', 'Order Online', 'Book a Table'],
    trust_signals: ['Award Winning', 'Fresh Ingredients', 'Family Owned', 'Local Favorite'],
    color_palettes: RESTAURANT_PALETTES,
  },
  lawyer: {
    industry: 'lawyers',
    display_name: 'Law Firm',
    sections: ['hero', 'practice-areas', 'attorneys', 'case-results', 'testimonials', 'about', 'contact'],
    suggested_ctas: ['Schedule Consultation', 'Free Case Review', 'Contact Us Today', 'Get Legal Help'],
    trust_signals: ['Years of Experience', 'Successful Cases', 'Award Winning', 'Client Focused'],
    color_palettes: LAWYER_PALETTES,
  },
  dentist: {
    industry: 'dentists',
    display_name: 'Dental Practice',
    sections: ['hero', 'services', 'team', 'technology', 'insurance', 'testimonials', 'contact'],
    suggested_ctas: ['Book Appointment', 'Schedule Your Visit', 'New Patient Special', 'Contact Us'],
    trust_signals: ['Gentle Care', 'Modern Technology', 'Insurance Accepted', 'Family Friendly'],
    color_palettes: DENTIST_PALETTES,
  },
  realtor: {
    industry: 'realtors',
    display_name: 'Real Estate Agent',
    sections: ['hero', 'featured-listings', 'services', 'about', 'areas-served', 'testimonials', 'contact'],
    suggested_ctas: ['View Listings', 'Get a Home Valuation', 'Contact Me', 'Schedule a Showing'],
    trust_signals: ['Top Producer', 'Local Expert', 'Years of Experience', 'Five Star Reviews'],
    color_palettes: REALTOR_PALETTES,
  },
  contractor: {
    industry: 'contractors',
    display_name: 'General Contractor',
    sections: ['hero', 'services', 'portfolio', 'process', 'testimonials', 'about', 'contact'],
    suggested_ctas: ['Get a Free Quote', 'View Our Work', 'Start Your Project', 'Contact Us'],
    trust_signals: ['Licensed & Insured', 'Quality Craftsmanship', 'On-Time Completion', 'Warranty Included'],
    color_palettes: CONTRACTOR_PALETTES,
  },
  electrician: {
    industry: 'other',
    display_name: 'Electrical Services',
    sections: ['hero', 'services', 'safety', 'emergency', 'reviews', 'service-areas', 'contact'],
    suggested_ctas: ['Call Now', 'Get a Free Estimate', 'Emergency Service', 'Schedule Appointment'],
    trust_signals: ['Licensed & Insured', 'Safety First', '24/7 Emergency', 'Satisfaction Guaranteed'],
    color_palettes: ELECTRICIAN_PALETTES,
  },
  roofer: {
    industry: 'contractors',
    display_name: 'Roofing Services',
    sections: ['hero', 'services', 'gallery', 'financing', 'emergency', 'testimonials', 'contact'],
    suggested_ctas: ['Free Roof Inspection', 'Get a Quote', 'Storm Damage Help', 'Contact Us'],
    trust_signals: ['Licensed & Insured', 'Warranty Included', 'Storm Damage Experts', 'Financing Available'],
    color_palettes: ROOFER_PALETTES,
  },
  chiropractor: {
    industry: 'doctors',
    display_name: 'Chiropractic Care',
    sections: ['hero', 'services', 'conditions', 'about', 'new-patients', 'testimonials', 'contact'],
    suggested_ctas: ['Schedule Appointment', 'New Patient Special', 'Free Consultation', 'Contact Us'],
    trust_signals: ['Licensed Chiropractor', 'Gentle Techniques', 'Same Day Appointments', 'Insurance Accepted'],
    color_palettes: CHIROPRACTOR_PALETTES,
  },
  veterinarian: {
    industry: 'other',
    display_name: 'Veterinary Clinic',
    sections: ['hero', 'services', 'team', 'pet-care', 'emergency', 'testimonials', 'contact'],
    suggested_ctas: ['Book Appointment', 'Emergency Care', 'New Pet Visit', 'Contact Us'],
    trust_signals: ['Compassionate Care', 'Modern Facility', 'Emergency Services', 'Experienced Team'],
    color_palettes: VETERINARIAN_PALETTES,
  },
  photographer: {
    industry: 'other',
    display_name: 'Photography',
    sections: ['hero', 'portfolio', 'services', 'packages', 'about', 'testimonials', 'contact'],
    suggested_ctas: ['View Portfolio', 'Book a Session', 'Get Pricing', 'Contact Me'],
    trust_signals: ['Award Winning', 'Professional Equipment', 'Quick Turnaround', 'Satisfaction Guaranteed'],
    color_palettes: PHOTOGRAPHER_PALETTES,
  },
  accountant: {
    industry: 'accountants',
    display_name: 'Accounting Services',
    sections: ['hero', 'services', 'industries', 'about', 'process', 'testimonials', 'contact'],
    suggested_ctas: ['Schedule Consultation', 'Get a Quote', 'Tax Help', 'Contact Us'],
    trust_signals: ['CPA Certified', 'Years of Experience', 'IRS Representation', 'Personalized Service'],
    color_palettes: ACCOUNTANT_PALETTES,
  },
  'financial-advisor': {
    industry: 'other',
    display_name: 'Financial Advisor',
    sections: ['hero', 'services', 'approach', 'about', 'credentials', 'testimonials', 'contact'],
    suggested_ctas: ['Schedule Consultation', 'Free Financial Review', 'Get Started', 'Contact Us'],
    trust_signals: ['Fiduciary Standard', 'CFP Certified', 'Years of Experience', 'Comprehensive Planning'],
    color_palettes: FINANCIAL_ADVISOR_PALETTES,
  },
};

/**
 * Get template configuration for an industry
 */
export function getTemplateConfig(templateKey: string): IndustryTemplateConfig | undefined {
  return INDUSTRY_CONFIGS[templateKey];
}

/**
 * Map industry type to template key
 */
export function industryToTemplateKey(industry: IndustryType): string {
  const mapping: Partial<Record<IndustryType, string>> = {
    plumbers: 'plumber',
    hvac: 'hvac',
    fitness: 'gym',
    dentists: 'dentist',
    doctors: 'therapist',
    salons: 'yoga',
    restaurants: 'restaurant',
    lawyers: 'lawyer',
    realtors: 'realtor',
    contractors: 'contractor',
    accountants: 'accountant',
  };

  return mapping[industry] || 'plumber';
}

/**
 * Get all available template keys
 */
export function getAllTemplateKeys(): string[] {
  return Object.keys(INDUSTRY_CONFIGS);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'service' | 'professional' | 'health' | 'creative'): string[] {
  const categories: Record<string, string[]> = {
    service: ['plumber', 'hvac', 'electrician', 'roofer', 'contractor'],
    professional: ['lawyer', 'accountant', 'realtor', 'financial-advisor'],
    health: ['dentist', 'chiropractor', 'veterinarian', 'therapist', 'gym'],
    creative: ['restaurant', 'photographer'],
  };

  return categories[category] || [];
}

// =============================================================================
// DNA-AWARE TEMPLATE FACTORY
// =============================================================================

/**
 * Input for DNA-aware template generation
 */
export interface DNATemplateFactoryInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  dna?: DNACode;
  // Template-specific options
  serviceAreas?: string[];
  licenseNumber?: string;
  yearsInBusiness?: number;
}

/**
 * Output from design variation generation
 */
export interface DesignVariation {
  dna: DNACode;
  html: string;
  description: string;
}

/**
 * Generate an industry template with optional DNA codes
 *
 * @param templateKey - The template identifier (e.g., 'plumber', 'dentist')
 * @param input - Template input including content, palette, and optional DNA
 * @returns Generated HTML string
 *
 * @example
 * ```typescript
 * const html = generateIndustryTemplate('plumber', {
 *   businessName: 'Quick Fix Plumbing',
 *   content: { headline: '...', ... },
 *   palette: PLUMBER_PALETTES[0],
 *   phone: '555-1234',
 *   dna: { hero: 'H9', layout: 'L5', color: 'C1', nav: 'N7', design: 'D7', typography: 'T3', motion: 'M2' }
 * });
 * ```
 */
export function generateIndustryTemplate(templateKey: string, input: DNATemplateFactoryInput): string {
  switch (templateKey) {
    case 'plumber':
      return generatePlumberTemplate({
        businessName: input.businessName,
        content: input.content,
        palette: input.palette,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state,
        serviceAreas: input.serviceAreas,
        licenseNumber: input.licenseNumber,
        yearsInBusiness: input.yearsInBusiness,
        dna: input.dna,
      });

    // TODO: Add more DNA-aware templates as they're migrated
    // case 'dentist':
    //   return generateDentistTemplate({ ...input });
    // case 'lawyer':
    //   return generateLawyerTemplate({ ...input });

    default:
      // Fall back to plumber template for now
      console.warn(`Template '${templateKey}' not yet DNA-aware, using plumber template`);
      return generatePlumberTemplate({
        businessName: input.businessName,
        content: input.content,
        palette: input.palette,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state,
        dna: input.dna,
      });
  }
}

/**
 * Generate multiple visually distinct design variations for a template
 *
 * This is perfect for A/B testing or showing clients multiple options.
 * Each variation uses different DNA codes while keeping the same content.
 *
 * @param templateKey - The template identifier
 * @param input - Base template input (DNA will be auto-generated)
 * @param count - Number of variations to generate (default: 3)
 * @returns Array of design variations with DNA codes and HTML
 *
 * @example
 * ```typescript
 * const variations = generateDesignVariations('plumber', {
 *   businessName: 'Quick Fix Plumbing',
 *   content: { ... },
 *   palette: PLUMBER_PALETTES[0],
 * }, 3);
 *
 * // Each variation is visually distinct:
 * // - variations[0]: H1/L3/D1 (Modern Clean)
 * // - variations[1]: H9/L5/D7 (Brutalist)
 * // - variations[2]: H2/L10/D6 (Elegant Bento)
 * ```
 */
export function generateDesignVariations(
  templateKey: string,
  input: Omit<DNATemplateFactoryInput, 'dna'>,
  count: number = 3
): DesignVariation[] {
  const variations: DesignVariation[] = [];
  const usedCombos = new Set<string>();

  // Pre-defined high-impact combinations for guaranteed variety
  const curatedCombos: Partial<DNACode>[] = [
    { hero: 'H1', layout: 'L3', design: 'D1', nav: 'N1', typography: 'T1', motion: 'M1' }, // Modern Clean
    { hero: 'H9', layout: 'L5', design: 'D7', nav: 'N1', typography: 'T3', motion: 'M2' }, // Brutalist
    { hero: 'H2', layout: 'L10', design: 'D6', nav: 'N7', typography: 'T2', motion: 'M2' }, // Elegant Bento
    { hero: 'H8', layout: 'L9', design: 'D4', nav: 'N9', typography: 'T1', motion: 'M1' }, // Asymmetric Timeline
    { hero: 'H12', layout: 'L3', design: 'D8', nav: 'N2', typography: 'T4', motion: 'M3' }, // Geometric Playful
    { hero: 'H3', layout: 'L5', design: 'D11', nav: 'N1', typography: 'T2', motion: 'M1' }, // Minimal Elegant
  ];

  const styleNames = [
    'Modern Clean',
    'Bold Brutalist',
    'Elegant Bento',
    'Asymmetric Timeline',
    'Geometric Playful',
    'Minimal Elegant',
  ];

  for (let i = 0; i < count; i++) {
    let dna: DNACode;
    let description: string;

    if (i < curatedCombos.length) {
      // Use curated combinations first
      const curated = curatedCombos[i];
      dna = {
        hero: curated.hero || 'H1',
        layout: curated.layout || 'L3',
        color: 'C1', // Color comes from palette, not DNA
        nav: curated.nav || 'N1',
        design: curated.design || 'D1',
        typography: curated.typography || 'T1',
        motion: curated.motion || 'M1',
      };
      description = styleNames[i] || `Variation ${i + 1}`;
    } else {
      // Generate random DNA for additional variations
      dna = generateDNACode();
      description = `Variation ${i + 1}`;
    }

    const comboKey = `${dna.hero}-${dna.layout}-${dna.design}-${dna.nav}`;

    // Skip if we've already generated this combination
    if (usedCombos.has(comboKey)) {
      // Generate a fresh random one
      dna = generateDNACode();
    }

    usedCombos.add(comboKey);

    const html = generateIndustryTemplate(templateKey, {
      ...input,
      dna,
    });

    variations.push({
      dna,
      html,
      description,
    });
  }

  return variations;
}

/**
 * Get a default DNA code suitable for a given industry
 *
 * Different industries benefit from different default styles:
 * - Service trades: Professional, trust-focused (H1, N1, D1)
 * - Creative: Bold, visual (H2, N7, D6)
 * - Professional: Elegant, minimal (H3, N1, D4)
 * - Health: Clean, reassuring (H1, N1, D1)
 */
export function getDefaultDNAForIndustry(industry: string): DNACode {
  const defaults: Record<string, DNACode> = {
    // Service trades - professional, trust-focused
    plumber: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    hvac: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    electrician: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    roofer: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    contractor: { hero: 'H2', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M2' },

    // Professional - elegant, minimal
    lawyer: { hero: 'H3', layout: 'L5', color: 'C1', nav: 'N1', design: 'D4', typography: 'T2', motion: 'M1' },
    accountant: { hero: 'H3', layout: 'L5', color: 'C1', nav: 'N1', design: 'D4', typography: 'T1', motion: 'M1' },
    'financial-advisor': { hero: 'H3', layout: 'L5', color: 'C1', nav: 'N1', design: 'D4', typography: 'T2', motion: 'M1' },
    realtor: { hero: 'H2', layout: 'L10', color: 'C1', nav: 'N7', design: 'D6', typography: 'T2', motion: 'M2' },

    // Health - clean, reassuring
    dentist: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    chiropractor: { hero: 'H2', layout: 'L5', color: 'C1', nav: 'N1', design: 'D1', typography: 'T1', motion: 'M1' },
    veterinarian: { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1', typography: 'T4', motion: 'M1' },
    therapist: { hero: 'H3', layout: 'L5', color: 'C1', nav: 'N9', design: 'D4', typography: 'T2', motion: 'M1' },
    gym: { hero: 'H9', layout: 'L3', color: 'C1', nav: 'N1', design: 'D2', typography: 'T1', motion: 'M3' },

    // Creative - bold, visual
    restaurant: { hero: 'H2', layout: 'L10', color: 'C1', nav: 'N7', design: 'D6', typography: 'T2', motion: 'M2' },
    photographer: { hero: 'H9', layout: 'L2', color: 'C1', nav: 'N9', design: 'D4', typography: 'T3', motion: 'M2' },
  };

  return defaults[industry] || defaults.plumber;
}

// =============================================================================
// GENERATIVE ARCHITECTURE BRIDGE
// =============================================================================

/**
 * Build a website using the new generative architecture.
 * This is the bridge between the old template system and the new engine.
 *
 * When USE_GENERATIVE_ARCHITECTURE is enabled, this uses the new
 * buildWebsite() function from the engine.
 *
 * @param content - Site content including business info and services
 * @param options - Build options including DNA and palette overrides
 * @returns Complete HTML document
 */
export function buildWebsite(content: SiteContent, options: BuildOptions = {}): string {
  if (USE_GENERATIVE_ARCHITECTURE) {
    return buildGenerativeWebsite(content, options);
  }

  // Fall back to old template system
  const templateKey = industryToTemplateKey(content.industry as IndustryType);
  const previewContent: PreviewContent = {
    headline: content.headline || content.businessName,
    tagline: content.tagline || content.description || '',
    about: content.description || '',
    services: content.services?.map(s => ({
      name: s.name,
      description: s.description,
    })) || [],
    cta_text: 'Contact Us',
    contact_text: 'Get in touch today',
    meta_description: content.tagline || content.description || '',
  };

  return generateIndustryTemplate(templateKey, {
    businessName: content.businessName,
    content: previewContent,
    palette: options.palette || PLUMBER_PALETTES[0],
    phone: content.contact.phone,
    email: content.contact.email,
    city: content.contact.city,
    state: content.contact.state,
    dna: options.dna,
  });
}

// Re-export types for convenience
export type { SiteContent, BuildOptions };
