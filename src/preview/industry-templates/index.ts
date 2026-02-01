/**
 * Industry Templates Index
 *
 * Industry-specific website templates with tailored layouts,
 * content structures, and color palettes.
 */

import { IndustryType } from '../../ai/industry-templates';
import { ColorPalette, IndustryTemplateConfig } from '../../overnight/types';

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
    case 'doctors':
      return THERAPIST_PALETTES; // Use calming colors for medical
    case 'plumbers':
    case 'contractors':
    case 'auto-repair':
      return PLUMBER_PALETTES;
    case 'hvac':
      return HVAC_PALETTES;
    case 'fitness':
      return GYM_PALETTES;
    case 'salons':
      return YOGA_PALETTES; // Peaceful colors for salons too
    default:
      return PLUMBER_PALETTES; // Default to professional blue
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
    dentists: 'therapist',
    doctors: 'therapist',
    salons: 'yoga',
  };

  return mapping[industry] || 'plumber';
}
