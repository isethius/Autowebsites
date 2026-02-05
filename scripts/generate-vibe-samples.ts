import { promises as fs } from 'fs';
import * as path from 'path';
import {
  buildWebsite,
  registerExistingSections,
  VIBES,
  generateConstrainedDNA,
  type SiteContent,
} from '../src/themes/engine';
import { getDNADescription, type DNACode } from '../src/themes/variance-planner';

type Target = {
  design?: string;
  motion?: string;
  hero?: string;
};

type SiteDefinition = {
  industry: string;
  vibe: string;
  name: string;
  tagline: string;
  target?: Target;
  heroVideoUrl?: string;
};

const SITES: SiteDefinition[] = [
  {
    industry: 'lawyer',
    vibe: 'executive',
    name: 'Sterling & Associates',
    tagline: 'Strategic counsel for complex legal matters.',
    target: { hero: 'H1' },
  },
  {
    industry: 'gym',
    vibe: 'maverick',
    name: 'Iron Pulse Training',
    tagline: 'Break limits with high-intensity coaching and recovery.',
    target: { design: 'D7', motion: 'M3' },
    heroVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    industry: 'realtor',
    vibe: 'elegant',
    name: 'Luxe Realty Group',
    tagline: 'Curated listings and white-glove service for premium buyers.',
    target: { design: 'D6', hero: 'H2' },
  },
  {
    industry: 'plumber',
    vibe: 'bold',
    name: 'Titan Plumbing Co',
    tagline: 'Emergency-ready plumbing with fast response times.',
    target: { motion: 'M2', hero: 'H1' },
  },
  {
    industry: 'dentist',
    vibe: 'friendly',
    name: 'Happy Smiles Dental',
    tagline: 'Gentle care for every smile in your family.',
    target: { design: 'D1', hero: 'H1' },
  },
  {
    industry: 'photographer',
    vibe: 'minimal',
    name: 'Frame & Light Studio',
    tagline: 'Clean, modern photography with a timeless finish.',
    target: { design: 'D2' },
  },
  {
    industry: 'restaurant',
    vibe: 'creative',
    name: 'Sunny Side Bistro',
    tagline: 'Bright flavors, fresh ingredients, and joyful dining.',
    target: { hero: 'H2' },
  },
  {
    industry: 'electrician',
    vibe: 'trustworthy',
    name: 'VoltEdge Electric',
    tagline: 'Smart, efficient electrical work for modern spaces.',
    target: { hero: 'H1' },
  },
];

const SERVICES = [
  { name: 'Primary Service', description: 'Our signature offering built for results and reliability.' },
  { name: 'Consultation', description: 'Clear guidance and planning tailored to your needs.' },
  { name: 'Ongoing Support', description: 'Proactive care, maintenance, and rapid response.' },
];

const TESTIMONIALS = [
  { text: 'Outstanding experience from start to finish.', author: 'Jordan P.', rating: 5 },
  { text: 'Professional, responsive, and easy to work with.', author: 'Casey L.', rating: 5 },
  { text: 'The quality and attention to detail were exceptional.', author: 'Riley S.', rating: 5 },
];

const CONTACT_BASE = {
  phone: '(555) 219-4021',
  email: 'hello@example.com',
  address: '123 Main Street',
  city: 'Phoenix',
  state: 'AZ',
  hours: 'Mon-Fri 8am-6pm',
};

function matchesTarget(dna: DNACode, target?: Target): boolean {
  if (!target) return true;
  if (target.design && dna.design !== target.design) return false;
  if (target.motion && dna.motion !== target.motion) return false;
  if (target.hero && dna.hero !== target.hero) return false;
  return true;
}

function pickDNA(site: SiteDefinition, attempts = 200): { dna: DNACode; tries: number; matched: boolean } {
  const vibe = VIBES[site.vibe];
  let dna: DNACode | undefined;
  let matched = false;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = generateConstrainedDNA(vibe);
    dna = candidate;
    if (matchesTarget(candidate, site.target)) {
      matched = true;
      return { dna: candidate, tries: i + 1, matched };
    }
  }

  return { dna: dna as DNACode, tries: attempts, matched };
}

async function main() {
  const outputDir = path.join('samples');
  await fs.mkdir(outputDir, { recursive: true });

  registerExistingSections();

  console.log('Generating vibe sample sites...');

  for (const site of SITES) {
    const vibe = VIBES[site.vibe];
    if (!vibe) {
      console.warn(`Unknown vibe: ${site.vibe}, skipping`);
      continue;
    }

    const { dna, tries, matched } = pickDNA(site);

    if (!matched && site.target) {
      console.warn(`Target DNA not fully matched for ${site.vibe} after ${tries} attempts.`);
    }

    const content: SiteContent = {
      businessName: site.name,
      industry: site.industry,
      headline: site.name,
      tagline: site.tagline,
      description: `${site.name} delivers expert ${site.industry} services with transparent pricing and fast response times.`,
      services: SERVICES,
      testimonials: TESTIMONIALS,
      contact: {
        ...CONTACT_BASE,
        email: `hello@${site.industry}.example.com`,
      },
      ctaText: 'Book a Consultation',
      trustBadges: ['Licensed & Insured', 'Same-Day Service', '5-Star Rated'],
      heroVideoUrl: site.heroVideoUrl,
    };

    const html = buildWebsite(content, { dna, vibe: site.vibe });
    const filename = `${site.industry}-${site.vibe}.html`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, html, 'utf8');

    console.log(`\n✓ ${filename}`);
    console.log(`  Vibe: ${vibe.name}`);
    console.log(`  DNA: ${getDNADescription(dna)}`);
    console.log(`  Genes: H=${dna.hero} L=${dna.layout} C=${dna.color} N=${dna.nav} D=${dna.design} T=${dna.typography} M=${dna.motion} R=${dna.radius} V=${dna.hover}`);
  }

  console.log(`\nSamples generated in ${outputDir}`);
}

main().catch((error) => {
  console.error('Failed to generate vibe samples:', error);
  process.exit(1);
});
