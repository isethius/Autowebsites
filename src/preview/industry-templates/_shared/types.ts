/**
 * Shared Types for Industry Templates
 */

import { ColorPalette, PreviewContent } from '../../../overnight/types';
import { DNACode } from '../../../themes/variance-planner';

/**
 * Base template input that all industry templates share
 */
export interface BaseTemplateInput {
  businessName: string;
  content: PreviewContent;
  palette: ColorPalette;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  website?: string;
  hours?: BusinessHours;
}

/**
 * DNA-aware template input that extends base with DNA codes for layout/style variance
 */
export interface DNATemplateInput extends BaseTemplateInput {
  dna?: DNACode;  // DNA codes for layout/style variance
}

// Re-export DNACode for convenience
export type { DNACode };

/**
 * Output from DNA-aware section generators
 */
export interface SectionOutput {
  html: string;
  css: string;
}

/**
 * Business operating hours
 */
export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  note?: string;  // e.g., "24/7 Emergency Service Available"
}

/**
 * Service item for service grids
 */
export interface ServiceItem {
  name: string;
  description: string;
  icon?: string;
  price?: string;
  duration?: string;
}

/**
 * Team member/staff profile
 */
export interface TeamMember {
  name: string;
  title: string;
  bio?: string;
  image?: string;
  credentials?: string[];
}

/**
 * Testimonial/review
 */
export interface Testimonial {
  text: string;
  author: string;
  rating?: number;
  date?: string;
  location?: string;
}

/**
 * Gallery item for portfolio/photos
 */
export interface GalleryItem {
  title: string;
  description?: string;
  image?: string;
  category?: string;
}

/**
 * FAQ item
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Pricing tier/package
 */
export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
}

/**
 * Stat/metric for "Why Choose Us" sections
 */
export interface StatItem {
  value: string;
  label: string;
  description?: string;
}

/**
 * Service area location
 */
export interface ServiceArea {
  name: string;
  isPrimary?: boolean;
}

/**
 * Template section configuration
 */
export interface SectionConfig {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  visible?: boolean;
}

/**
 * Template category
 */
export type TemplateCategory = 'service' | 'professional' | 'health' | 'creative';

/**
 * Industry template configuration
 */
export interface IndustryTemplateConfig {
  id: string;
  displayName: string;
  category: TemplateCategory;
  description: string;
  sections: string[];
  suggestedCTAs: string[];
  trustSignals: string[];
  defaultPalette: ColorPalette;
  allPalettes: ColorPalette[];
}
