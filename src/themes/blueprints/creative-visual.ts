/**
 * Creative & Visual Blueprint
 *
 * For creatives: photographer, restaurant, studio
 * Focus: Visual impact, portfolio, atmosphere, booking/reservations
 */

import { Blueprint } from './index';

export const CREATIVE_VISUAL_BLUEPRINT: Blueprint = {
  id: 'creative-visual',
  name: 'Creative & Visual',
  description: 'For visual businesses that need to showcase work and create atmosphere',

  industries: ['photographer', 'restaurant', 'cafe', 'bakery', 'bar', 'studio', 'artist', 'designer'],

  sections: [
    { category: 'nav', required: true, config: { style: 'minimal' } },
    { category: 'hero', required: true, config: { style: 'visual', fullHeight: true } },
    { category: 'gallery', required: true, title: 'Our Work', config: { style: 'masonry' } },
    { category: 'services', required: false, title: 'Services', subtitle: 'What we offer' },
    { category: 'about', required: true, title: 'About' },
    { category: 'testimonials', required: false, title: 'Reviews' },
    { category: 'pricing', required: false, title: 'Packages' },
    { category: 'contact', required: true, title: 'Get in Touch', config: { style: 'minimal' } },
    { category: 'footer', required: true },
  ],

  defaultDNA: {
    hero: 'H2',      // Split screen - visual focus
    layout: 'L10',   // Bento box - interesting grid
    nav: 'N7',       // Floating nav - modern
    design: 'D6',    // Glassmorphism - contemporary
    typography: 'T2', // Elegant serif - artistic
    motion: 'M2',    // Dynamic - engaging
  },

  suggestedCTAs: [
    'View Portfolio',
    'Book a Session',
    'Make a Reservation',
    'Contact Me',
    'Get Pricing',
  ],

  trustSignals: [
    'Award Winning',
    'Featured In',
    'Years of Experience',
    'Rave Reviews',
    'Unique Style',
    'Quick Turnaround',
  ],

  contentRequirements: {
    services: { min: 2, max: 6 },
    testimonials: { min: 2, max: 4 },
  },
};
