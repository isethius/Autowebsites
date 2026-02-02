/**
 * Service Business Blueprint
 *
 * For service trades: plumber, HVAC, electrician, roofer, contractor
 * Focus: Trust, emergency availability, service areas, quick contact
 */

import { Blueprint } from './index';

export const SERVICE_BUSINESS_BLUEPRINT: Blueprint = {
  id: 'service-business',
  name: 'Service Business',
  description: 'For service trades that need to convey trust, availability, and quick contact options',

  industries: ['plumber', 'electrician', 'hvac', 'roofer', 'contractor', 'handyman', 'landscaper'],

  sections: [
    { category: 'nav', required: true },
    { category: 'hero', required: true, config: { showPhone: true, showEmergency: true } },
    { category: 'services', required: true, title: 'Our Services', subtitle: 'Professional solutions for your home' },
    { category: 'stats', required: false, title: 'Why Choose Us' },
    { category: 'testimonials', required: true, title: 'What Our Customers Say' },
    { category: 'about', required: false, title: 'About Us' },
    { category: 'faq', required: false, title: 'Frequently Asked Questions' },
    { category: 'contact', required: true, title: 'Contact Us', config: { showMap: true, showPhone: true } },
    { category: 'footer', required: true },
  ],

  defaultDNA: {
    hero: 'H1',      // Full-width impact - shows phone prominently
    layout: 'L3',    // Card grid for services
    nav: 'N1',       // Fixed top bar - professional
    design: 'D1',    // Rounded soft - approachable
    typography: 'T1', // Modern sans - clear readability
    motion: 'M1',    // Subtle - professional
  },

  suggestedCTAs: [
    'Call Now',
    'Get a Free Quote',
    'Schedule Service',
    'Emergency Service',
    'Request Callback',
  ],

  trustSignals: [
    'Licensed & Insured',
    '24/7 Emergency Service',
    'Satisfaction Guaranteed',
    'X+ Years in Business',
    'Free Estimates',
    'Same-Day Service',
    'Background Checked',
  ],

  contentRequirements: {
    services: { min: 3, max: 8 },
    testimonials: { min: 2, max: 6 },
    faqs: { min: 3, max: 8 },
  },
};
