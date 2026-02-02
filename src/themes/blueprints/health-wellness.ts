/**
 * Health & Wellness Blueprint
 *
 * For healthcare: dentist, chiropractor, vet, therapist, gym
 * Focus: Comfort, care, expertise, easy booking
 */

import { Blueprint } from './index';

export const HEALTH_WELLNESS_BLUEPRINT: Blueprint = {
  id: 'health-wellness',
  name: 'Health & Wellness',
  description: 'For healthcare providers who need to convey care, comfort, and expertise',

  industries: ['dentist', 'chiropractor', 'veterinarian', 'therapist', 'gym', 'yoga', 'spa', 'medspa'],

  sections: [
    { category: 'nav', required: true },
    { category: 'hero', required: true, config: { style: 'welcoming', showBooking: true } },
    { category: 'services', required: true, title: 'Our Services', subtitle: 'Comprehensive care for your needs' },
    { category: 'team', required: false, title: 'Meet Our Team' },
    { category: 'about', required: true, title: 'About Our Practice' },
    { category: 'features', required: false, title: 'Why Choose Us', config: { style: 'icons' } },
    { category: 'testimonials', required: true, title: 'Patient Reviews' },
    { category: 'faq', required: false, title: 'Frequently Asked Questions' },
    { category: 'contact', required: true, title: 'Book an Appointment', config: { showHours: true } },
    { category: 'footer', required: true },
  ],

  defaultDNA: {
    hero: 'H1',      // Full-width - welcoming
    layout: 'L3',    // Card grid - organized services
    nav: 'N1',       // Fixed top bar
    design: 'D1',    // Rounded soft - friendly
    typography: 'T1', // Modern sans - readable
    motion: 'M1',    // Subtle
  },

  suggestedCTAs: [
    'Book Appointment',
    'Schedule Your Visit',
    'New Patient Special',
    'Contact Us',
    'Free Consultation',
  ],

  trustSignals: [
    'Compassionate Care',
    'Modern Technology',
    'Experienced Team',
    'Insurance Accepted',
    'Flexible Hours',
    'Family Friendly',
    'Same Day Appointments',
  ],

  contentRequirements: {
    services: { min: 4, max: 10 },
    testimonials: { min: 3, max: 6 },
    team: { min: 1, max: 6 },
    faqs: { min: 4, max: 10 },
  },
};
