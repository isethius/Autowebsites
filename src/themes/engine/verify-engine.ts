/**
 * Verification Script for Generative Component Engine
 *
 * Run with: npx ts-node src/themes/engine/verify-engine.ts
 */

import {
  // Harmony Engine
  VIBES,
  generateConstrainedDNA,
  getVibeForIndustry,
  generatePalette,
  selectPattern,
  // Section Registry
  registerExistingSections,
  getSectionVariants,
  getRegistryStats,
  // Layout Resolver
  resolveServiceLayout,
  // Content Tone
  getContentTone,
  // Site Builder
  buildWebsite,
  generateDNAForIndustry,
} from './index';

console.log('='.repeat(60));
console.log('GENERATIVE COMPONENT ENGINE VERIFICATION');
console.log('='.repeat(60));

// Test 1: Harmony Engine - Vibe Constraints
console.log('\n--- Step 0: Harmony Engine Test ---\n');

const executiveDNA = generateConstrainedDNA(VIBES['executive']);
console.log('Executive DNA:', executiveDNA);
console.log('  Typography in [T1,T2]?', ['T1', 'T2'].includes(executiveDNA.typography || ''));
console.log('  Design in [D1,D4,D11]?', ['D1', 'D4', 'D11'].includes(executiveDNA.design));

const maverickDNA = generateConstrainedDNA(VIBES['maverick']);
console.log('\nMaverick DNA:', maverickDNA);
console.log('  Typography in [T3,T4]?', ['T3', 'T4'].includes(maverickDNA.typography || ''));
console.log('  Chaos level:', VIBES['maverick'].chaos);

// Test 2: Palette Generation
console.log('\n--- Palette Generation Test ---\n');

const mutedPalette = generatePalette('#1e5a8a', 'muted');
console.log('Muted palette from #1e5a8a:');
console.log('  Primary:', mutedPalette.primary);
console.log('  Secondary:', mutedPalette.secondary);
console.log('  Accent:', mutedPalette.accent);
console.log('  Background:', mutedPalette.background);
console.log('  Text:', mutedPalette.text);

const vibrantPalette = generatePalette('#dc2626', 'vibrant');
console.log('\nVibrant palette from #dc2626:');
console.log('  Primary:', vibrantPalette.primary);
console.log('  Secondary:', vibrantPalette.secondary);
console.log('  Accent:', vibrantPalette.accent);

// Test 3: Grid Patterns
console.log('\n--- Grid Pattern Test ---\n');

console.log('3 items, chaos 0:', selectPattern(3, 0));
console.log('3 items, chaos 0.5:', selectPattern(3, 0.5));
console.log('6 items, chaos 0:', selectPattern(6, 0));
console.log('6 items, chaos 0.7:', selectPattern(6, 0.7));

// Test 4: Section Registry
console.log('\n--- Step 1: Section Registry Test ---\n');

registerExistingSections();

console.log('Hero variants:', getSectionVariants('hero').map(v => v.id));
console.log('Service variants:', getSectionVariants('services').map(v => v.id));
console.log('Nav variants:', getSectionVariants('nav').map(v => v.id));
console.log('\nRegistry stats:', getRegistryStats());

// Test 5: Layout Resolver
console.log('\n--- Step 2: Layout Resolver Test ---\n');

const services3 = [{}, {}, {}];
const services6 = [{}, {}, {}, {}, {}, {}];

const layout3L3 = resolveServiceLayout(services3, { hero: 'H1', layout: 'L3', color: 'C1', nav: 'N1', design: 'D1' });
console.log('3 items + L3:', layout3L3);

const layout6L10 = resolveServiceLayout(services6, { hero: 'H1', layout: 'L10', color: 'C1', nav: 'N1', design: 'D7' }, 0.7);
console.log('6 items + L10 + chaos 0.7:', layout6L10);

// Test 6: Content Tone
console.log('\n--- Content Tone Test ---\n');

const brutalistDNA = { hero: 'H9', layout: 'L5', color: 'C2', nav: 'N1', design: 'D7' };
const brutalistTone = getContentTone(brutalistDNA);
console.log('Brutalist tone:', {
  headlineStyle: brutalistTone.headlineStyle,
  tone: brutalistTone.tone,
  ctaStyle: brutalistTone.ctaStyle,
  ctaExamples: brutalistTone.ctaExamples.slice(0, 2),
});

const elegantDNA = { hero: 'H3', layout: 'L5', color: 'C1', nav: 'N9', design: 'D6', typography: 'T2' };
const elegantTone = getContentTone(elegantDNA);
console.log('\nElegant tone:', {
  headlineStyle: elegantTone.headlineStyle,
  tone: elegantTone.tone,
  ctaStyle: elegantTone.ctaStyle,
  ctaExamples: elegantTone.ctaExamples.slice(0, 2),
});

// Test 7: Industry DNA Generation
console.log('\n--- Industry DNA Test ---\n');

const plumberVibe = getVibeForIndustry('plumber');
console.log('Plumber vibe:', plumberVibe.id, '-', plumberVibe.name);

const plumberDNA = generateDNAForIndustry('plumber');
console.log('Generated plumber DNA:', plumberDNA);

const photographerDNA = generateDNAForIndustry('photographer');
console.log('Generated photographer DNA:', photographerDNA);

// Test 8: Build Website (minimal test)
console.log('\n--- Step 3: buildWebsite() Test ---\n');

const testHtml = buildWebsite({
  businessName: 'Test Plumbing Co',
  industry: 'plumber',
  tagline: '24/7 Emergency Service',
  services: [
    { name: 'Emergency Repairs', description: 'Fast response when you need it most' },
    { name: 'Drain Cleaning', description: 'Clear any clog, any drain' },
    { name: 'Water Heaters', description: 'Installation and repair' },
  ],
  contact: {
    phone: '555-1234',
    city: 'Phoenix',
    state: 'AZ',
  },
});

console.log('Generated HTML length:', testHtml.length, 'characters');
console.log('Contains DOCTYPE:', testHtml.includes('<!DOCTYPE html>'));
console.log('Contains business name:', testHtml.includes('Test Plumbing Co'));
console.log('Contains phone:', testHtml.includes('555-1234'));

console.log('\n' + '='.repeat(60));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(60));
