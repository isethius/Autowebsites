/**
 * Industry Templates Index
 *
 * Industry-specific website templates with tailored layouts,
 * content structures, and color palettes.
 */

import { IndustryType } from '../../ai/industry-templates';
import { ColorPalette, IndustryTemplateConfig } from '../../overnight/types';

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
