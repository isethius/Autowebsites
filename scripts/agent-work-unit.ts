import { promises as fs } from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  buildWebsite,
  generateConstrainedDNA,
  getVibeForIndustry,
  registerExistingSections,
  VIBES,
  type SiteContent,
} from '../src/themes/engine';
import { generateVibeCopy } from '../src/copy/vibe-copy-engine';
import type { DNACode } from '../src/themes/variance-planner';

type ServiceInput = string | { name?: string; description?: string; icon?: string; price?: string };

interface JobInput {
  industry?: string;
  vibes?: string[] | string;
  vibeIds?: string[] | string;
  variants?: string[] | string;
  outputDir?: string;
  output?: { dir?: string; path?: string };
  businessName?: string;
  companyName?: string;
  name?: string;
  headline?: string;
  tagline?: string;
  description?: string;
  services?: ServiceInput[];
  testimonials?: SiteContent['testimonials'];
  team?: SiteContent['team'];
  faqs?: SiteContent['faqs'];
  stats?: SiteContent['stats'];
  contact?: SiteContent['contact'];
  hours?: SiteContent['hours'];
  trustBadges?: SiteContent['trustBadges'];
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  content?: Partial<SiteContent> & {
    services?: ServiceInput[];
  };
  sampleContent?: Partial<SiteContent> & {
    services?: ServiceInput[];
  };
  context?: Record<string, unknown>;
}

interface ManifestEntry {
  industry: string;
  vibe: string;
  html: string;
  desktop: string | null;
  mobile: string | null;
  generatedAt: string;
}

const DEFAULT_OUTPUT_DIR = path.join('dist', 'portfolio', 'service');
const DEFAULT_MANIFEST_PATH = path.join('dist', 'portfolio', 'manifest.json');

/**
 * DNA Variety Tracker
 * Ensures unique DNA combinations per industry to maximize visual diversity
 */
class DNAVarietyTracker {
  private usedCombos: Map<string, Set<string>> = new Map();

  private dnaToKey(dna: DNACode): string {
    return `${dna.hero}-${dna.layout}-${dna.color}-${dna.nav}-${dna.design}-${dna.typography}-${dna.motion}`;
  }

  isUsed(industry: string, dna: DNACode): boolean {
    const industrySet = this.usedCombos.get(industry);
    if (!industrySet) return false;
    return industrySet.has(this.dnaToKey(dna));
  }

  markUsed(industry: string, dna: DNACode): void {
    let industrySet = this.usedCombos.get(industry);
    if (!industrySet) {
      industrySet = new Set();
      this.usedCombos.set(industry, industrySet);
    }
    industrySet.add(this.dnaToKey(dna));
  }

  generateUniqueDNA(industry: string, vibeId: string, maxAttempts = 10): DNACode {
    const vibe = VIBES[vibeId] || getVibeForIndustry(industry);
    for (let i = 0; i < maxAttempts; i++) {
      const dna = generateConstrainedDNA(vibe);
      if (!this.isUsed(industry, dna)) {
        this.markUsed(industry, dna);
        return dna;
      }
    }
    // If all attempts fail, return the last generated DNA anyway
    const dna = generateConstrainedDNA(vibe);
    this.markUsed(industry, dna);
    return dna;
  }
}

/**
 * Business Name Generator
 * Creates unique, varied business names per industry-vibe combo
 */
const BUSINESS_NAME_TEMPLATES: Record<string, string[]> = {
  executive: ['{Industry} Professionals', '{City} {Industry} Group', 'Premier {Industry}', '{Industry} Partners'],
  maverick: ['Bold {Industry}', 'Next Level {Industry}', '{Industry} Disruptors', 'Edge {Industry}'],
  artisan: ['{Industry} Craft', 'Artisan {Industry}', 'Handcrafted {Industry}', 'Boutique {Industry}'],
  minimalist: ['{Industry}.', 'Pure {Industry}', 'Simple {Industry}', 'Clean {Industry}'],
  bold: ['Power {Industry}', 'Strong {Industry}', '{Industry} Force', 'Elite {Industry}'],
  classic: ['Heritage {Industry}', 'Traditional {Industry}', 'Timeless {Industry}', '{Industry} & Co'],
  modern: ['Modern {Industry}', 'Contemporary {Industry}', 'Fresh {Industry}', '{Industry} Now'],
  playful: ['Happy {Industry}', 'Fun {Industry}', '{Industry} Joy', 'Bright {Industry}'],
  elegant: ['Refined {Industry}', 'Luxe {Industry}', 'Grace {Industry}', 'Premium {Industry}'],
  friendly: ['Friendly {Industry}', 'Neighborly {Industry}', '{Industry} Friends', 'Your {Industry}'],
  creative: ['Creative {Industry}', '{Industry} Studio', 'Inspired {Industry}', 'Vision {Industry}'],
  trustworthy: ['Trusted {Industry}', 'Reliable {Industry}', 'Dependable {Industry}', 'Sure {Industry}'],
};

function generateBusinessName(industry: string, vibeId: string, city?: string): string {
  const templates = BUSINESS_NAME_TEMPLATES[vibeId] || BUSINESS_NAME_TEMPLATES.trustworthy;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const industryLabel = formatIndustryName(industry);
  return template
    .replace('{Industry}', industryLabel)
    .replace('{City}', city || 'Metro');
}

const dnaTracker = new DNAVarietyTracker();

const DEFAULT_SERVICES: Record<string, string[]> = {
  plumber: ['Emergency Repairs', 'Drain Cleaning', 'Water Heater Service', 'Pipe Replacement'],
  electrician: ['Panel Upgrades', 'Lighting Installation', 'Wiring Repairs', 'Safety Inspections'],
  hvac: ['AC Repair', 'Heating Service', 'System Installation', 'Maintenance Plans'],
  roofer: ['Roof Repair', 'New Roof Installation', 'Storm Damage', 'Gutter Service'],
  contractor: ['Remodeling', 'Additions', 'Repairs', 'Project Management'],
  landscaper: ['Lawn Care', 'Garden Design', 'Irrigation', 'Seasonal Cleanup'],
  lawyer: ['Consultations', 'Case Evaluation', 'Representation', 'Document Review'],
  accountant: ['Tax Preparation', 'Bookkeeping', 'Payroll', 'Financial Reporting'],
  'financial-advisor': ['Retirement Planning', 'Investment Strategy', 'Wealth Management', 'Risk Review'],
  realtor: ['Buyer Representation', 'Listing Services', 'Market Analysis', 'Negotiation'],
  consultant: ['Strategy Sessions', 'Business Analysis', 'Process Optimization', 'Growth Planning'],
  dentist: ['Cleanings', 'Cosmetic Dentistry', 'Implants', 'Emergency Care'],
  chiropractor: ['Spinal Adjustment', 'Pain Relief', 'Posture Care', 'Wellness Plans'],
  veterinarian: ['Wellness Exams', 'Vaccinations', 'Surgery', 'Dental Care'],
  therapist: ['Individual Therapy', 'Couples Counseling', 'Stress Management', 'Treatment Plans'],
  gym: ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Membership Plans'],
  spa: ['Massage Therapy', 'Facials', 'Body Treatments', 'Wellness Packages'],
  restaurant: ['Dine-In', 'Takeout', 'Catering', 'Private Events'],
  cafe: ['Fresh Coffee', 'Pastries', 'Light Bites', 'Catering'],
  photographer: ['Portraits', 'Events', 'Branding', 'Editing'],
  studio: ['Recording Sessions', 'Mixing & Mastering', 'Voice Overs', 'Sound Design'],
};

function parseArgs(args: string[]): { job?: string; screenshots: boolean } {
  const jobIndex = args.indexOf('--job');
  const job = jobIndex >= 0 ? args[jobIndex + 1] : undefined;

  const screenshotsIndex = args.indexOf('--screenshots');
  let screenshots = true;
  if (screenshotsIndex >= 0) {
    const value = args[screenshotsIndex + 1];
    if (!value || value.startsWith('--')) {
      screenshots = true;
    } else {
      screenshots = value.toLowerCase() !== 'false';
    }
  }

  return { job, screenshots };
}

function toTitleCase(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatIndustryName(industry: string): string {
  const overrides: Record<string, string> = {
    hvac: 'HVAC',
    'financial-advisor': 'Financial Advisor',
  };
  return overrides[industry] || toTitleCase(industry);
}

function normalizeVibes(input: JobInput['vibes'] | JobInput['vibeIds'] | JobInput['variants']): string[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.map(item => String(item));
  }
  return [String(input)];
}

function normalizeServices(input: ServiceInput[] | undefined, industry: string): SiteContent['services'] {
  if (Array.isArray(input) && input.length > 0) {
    return input.map((service, index) => {
      if (typeof service === 'string') {
        return {
          name: service,
          description: `Professional ${service.toLowerCase()} delivered by trusted local experts.`,
        };
      }
      const name = service.name || `Service ${index + 1}`;
      return {
        name,
        description: service.description || `Expert ${name.toLowerCase()} tailored to your needs.`,
        icon: service.icon,
        price: service.price,
      };
    });
  }

  const fallback = DEFAULT_SERVICES[industry] || ['Consultations', 'Installations', 'Maintenance'];
  return fallback.map(name => ({
    name,
    description: `Reliable ${name.toLowerCase()} from experienced specialists.`,
  }));
}

function generateDefaultTestimonials(industry: string): SiteContent['testimonials'] {
  const industryLabel = formatIndustryName(industry);
  return [
    { text: `Outstanding ${industryLabel.toLowerCase()} service! Professional, on-time, and fairly priced.`, author: 'Sarah M.', rating: 5 },
    { text: `Best experience I've had with a ${industryLabel.toLowerCase()} company. Highly recommend!`, author: 'John D.', rating: 5 },
    { text: `They went above and beyond. Will definitely use them again.`, author: 'Lisa K.', rating: 5 },
  ];
}

function generateDefaultStats(): SiteContent['stats'] {
  return [
    { value: '500+', label: 'Happy Customers' },
    { value: '10+', label: 'Years Experience' },
    { value: '24/7', label: 'Emergency Service' },
    { value: '100%', label: 'Satisfaction Guaranteed' },
  ];
}

function buildSiteContent(job: JobInput, industry: string, vibeId?: string): SiteContent {
  const merged = { ...job, ...(job.context || {}), ...(job.content || {}), ...(job.sampleContent || {}) } as JobInput;
  const industryLabel = formatIndustryName(industry);

  // Generate vibe-appropriate copy
  const vibeCopy = vibeId ? generateVibeCopy({
    industry,
    vibe: vibeId,
    context: {
      businessName: merged.businessName || merged.companyName || merged.name,
      location: [merged.city, merged.state].filter(Boolean).join(', ') || undefined,
      services: (merged.services || []).map((s: ServiceInput) => typeof s === 'string' ? s : (s as any).name || '').filter(Boolean),
    }
  }) : null;

  const businessName =
    merged.businessName ||
    merged.companyName ||
    merged.name ||
    `${industryLabel} Co`;

  const contactInput = merged.contact || {};
  const contact: SiteContent['contact'] = {
    phone: contactInput.phone || merged.phone || '555-1234',
    email: contactInput.email || merged.email,
    address: contactInput.address || merged.address,
    city: contactInput.city || merged.city,
    state: contactInput.state || merged.state,
  };

  const location = [contact.city, contact.state].filter(Boolean).join(', ');

  // Use generated copy or fall back to defaults
  const tagline = merged.tagline || vibeCopy?.tagline ||
    (location
      ? `Trusted ${industryLabel} services in ${location}`
      : `Trusted ${industryLabel} services you can count on`);

  const headline = merged.headline || vibeCopy?.headline || businessName;
  const description = merged.description || vibeCopy?.body ||
    `Reliable ${industryLabel} solutions for homes and businesses${location ? ` across ${location}` : ''}.`;

  return {
    businessName,
    industry,
    headline,
    tagline,
    description,
    services: normalizeServices(merged.services, industry),
    testimonials: merged.testimonials || generateDefaultTestimonials(industry),
    team: merged.team,
    faqs: merged.faqs,
    stats: merged.stats || generateDefaultStats(),
    contact,
    hours: merged.hours,
    trustBadges: merged.trustBadges || ['Licensed & Insured', 'Local Experts', '5-Star Rated'],
  };
}

function toManifestPath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function readManifest(manifestPath: string): Promise<ManifestEntry[]> {
  try {
    const data = await readJsonFile<ManifestEntry[]>(manifestPath);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    console.warn(`Warning: Failed to read manifest, starting fresh. (${error.message})`);
    return [];
  }
}

async function writeManifestAtomic(manifestPath: string, entries: ManifestEntry[]): Promise<void> {
  const manifestDir = path.dirname(manifestPath);
  await fs.mkdir(manifestDir, { recursive: true });
  const tempPath = `${manifestPath}.tmp-${Date.now()}`;
  await fs.writeFile(tempPath, JSON.stringify(entries, null, 2));
  await fs.rename(tempPath, manifestPath);
}

async function updateManifest(manifestPath: string, newEntries: ManifestEntry[]): Promise<void> {
  const existing = await readManifest(manifestPath);
  const filtered = existing.filter(entry =>
    !newEntries.some(newEntry =>
      newEntry.industry === entry.industry && newEntry.vibe === entry.vibe
    )
  );
  const merged = [...filtered, ...newEntries];
  await writeManifestAtomic(manifestPath, merged);
}

async function createScreenshotter(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  let puppeteerModule: any;
  try {
    puppeteerModule = await import('puppeteer');
  } catch (error: any) {
    console.warn(`Warning: Puppeteer not available, skipping screenshots. (${error.message})`);
    return null;
  }

  const puppeteer = puppeteerModule.default || puppeteerModule;

  try {
    const browser = await puppeteer.launch({ headless: 'new' });

    return {
      async capture(htmlPath: string, outputDir: string, baseName: string) {
        const fileUrl = pathToFileURL(htmlPath).href;
        const page = await browser.newPage();

        let desktop: string | null = null;
        let mobile: string | null = null;

        try {
          await page.setViewport({ width: 1440, height: 900 });
          await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
          desktop = path.join(outputDir, `${baseName}-desktop.jpg`);
          await page.screenshot({ path: desktop, fullPage: true, type: 'jpeg', quality: 82 });
        } catch (error: any) {
          console.warn(`Warning: Desktop screenshot failed for ${baseName}. (${error.message})`);
          desktop = null;
        }

        try {
          await page.setViewport({ width: 390, height: 844 });
          await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
          mobile = path.join(outputDir, `${baseName}-mobile.jpg`);
          await page.screenshot({ path: mobile, fullPage: true, type: 'jpeg', quality: 82 });
        } catch (error: any) {
          console.warn(`Warning: Mobile screenshot failed for ${baseName}. (${error.message})`);
          mobile = null;
        }

        await page.close();

        return { desktop, mobile };
      },
      async close() {
        await browser.close();
      },
    };
  } catch (error: any) {
    console.warn(`Warning: Puppeteer launch failed, skipping screenshots. (${error.message})`);
    return null;
  }
}

async function main() {
  const { job: jobArg, screenshots } = parseArgs(process.argv.slice(2));

  if (!jobArg) {
    console.log('Usage: pnpm exec tsx scripts/agent-work-unit.ts --job jobs/job-{industry}.json [--screenshots true|false]');
    process.exit(1);
  }

  const jobPath = path.resolve(jobArg);
  const rawJob = await readJsonFile<JobInput | { job?: JobInput; payload?: JobInput; data?: JobInput }>(jobPath);
  const job = (rawJob as any).job || (rawJob as any).payload || (rawJob as any).data || rawJob;

  const industry = job.industry;
  const vibes = normalizeVibes(job.vibes || job.vibeIds || job.variants);

  if (!industry) {
    throw new Error('Job is missing required field: industry');
  }
  if (vibes.length === 0) {
    throw new Error('Job is missing required field: vibes');
  }

  const outputDir = path.resolve(job.outputDir || job.output?.dir || job.output?.path || DEFAULT_OUTPUT_DIR);
  await fs.mkdir(outputDir, { recursive: true });

  registerExistingSections();
  const timestamp = new Date().toISOString();

  const screenshotter = await createScreenshotter(screenshots);
  const manifestEntries: ManifestEntry[] = [];

  for (const vibeId of vibes) {
    const vibe = VIBES[vibeId] || getVibeForIndustry(industry);
    if (!VIBES[vibeId]) {
      console.warn(`Warning: Unknown vibe "${vibeId}", falling back to ${vibe.id}.`);
    }

    // Generate unique DNA for this industry-vibe combo
    const dna = dnaTracker.generateUniqueDNA(industry, vibeId);

    // Build content with vibe-specific copy
    const content = buildSiteContent(job, industry, vibeId);

    // Generate unique business name for this combo if not provided
    const vibeContent: SiteContent = {
      ...content,
      businessName: content.businessName === `${formatIndustryName(industry)} Co`
        ? generateBusinessName(industry, vibeId, content.contact.city)
        : content.businessName,
    };

    const html = buildWebsite(vibeContent, { dna, vibe: vibeId });

    const baseName = `${industry}-${vibeId}`;
    const htmlPath = path.join(outputDir, `${baseName}.html`);
    await fs.writeFile(htmlPath, html, 'utf-8');

    let desktopPath: string | null = null;
    let mobilePath: string | null = null;

    if (screenshotter) {
      const captureResult = await screenshotter.capture(htmlPath, outputDir, baseName);
      desktopPath = captureResult.desktop;
      mobilePath = captureResult.mobile;
    }

    manifestEntries.push({
      industry,
      vibe: vibeId,
      html: toManifestPath(htmlPath),
      desktop: desktopPath ? toManifestPath(desktopPath) : null,
      mobile: mobilePath ? toManifestPath(mobilePath) : null,
      generatedAt: timestamp,
    });
  }

  if (screenshotter) {
    await screenshotter.close();
  }

  // Write to per-industry manifest to avoid race conditions with concurrent workers
  const industryManifestPath = path.join('dist', 'portfolio', `manifest-${industry}.json`);
  await updateManifest(industryManifestPath, manifestEntries);

  console.log(`Generated ${manifestEntries.length} website(s) for ${industry}.`);
  console.log(`Manifest written to: ${industryManifestPath}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
