/**
 * Professional Services Blueprint
 *
 * For professionals: lawyer, accountant, realtor, financial advisor
 * Focus: Credibility, expertise, trust, consultation booking
 */

import { Blueprint } from './index';

export const PROFESSIONAL_SERVICES_BLUEPRINT: Blueprint = {
  id: 'professional-services',
  name: 'Professional Services',
  description: 'For professionals who need to convey expertise, credibility, and trust',

  industries: ['lawyer', 'accountant', 'realtor', 'financial-advisor', 'consultant', 'insurance'],

  sections: [
    { category: 'nav', required: true },
    { category: 'hero', required: true, config: { style: 'minimal', showCredentials: true } },
    { category: 'services', required: true, title: 'Practice Areas', subtitle: 'How we can help you' },
    { category: 'about', required: true, title: 'About', subtitle: 'Experience you can trust' },
    { category: 'team', required: false, title: 'Our Team' },
    { category: 'testimonials', required: true, title: 'Client Testimonials' },
    { category: 'faq', required: false, title: 'Common Questions' },
    { category: 'cta', required: false, title: 'Ready to Get Started?' },
    { category: 'contact', required: true, title: 'Schedule a Consultation' },
    { category: 'footer', required: true },
  ],

  defaultDNA: {
    hero: 'H3',      // Minimal header - sophisticated
    layout: 'L5',    // Single column - elegant flow
    nav: 'N1',       // Fixed top bar - professional
    design: 'D4',    // Flat minimal - clean
    typography: 'T2', // Elegant serif - sophisticated
    motion: 'M1',    // Subtle - professional
  },

  suggestedCTAs: [
    'Schedule Consultation',
    'Free Case Review',
    'Contact Us Today',
    'Book an Appointment',
    'Get Started',
  ],

  trustSignals: [
    'X+ Years of Experience',
    'Award-Winning Service',
    'Client-Focused Approach',
    'Confidential Consultations',
    'Proven Track Record',
    'Industry Certified',
  ],

  contentRequirements: {
    services: { min: 3, max: 6 },
    testimonials: { min: 2, max: 4 },
    team: { min: 1, max: 4 },
    faqs: { min: 4, max: 8 },
  },
};
