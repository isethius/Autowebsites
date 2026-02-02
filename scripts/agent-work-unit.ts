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

const DEFAULT_SERVICES: Record<string, string[]> = {
  plumber: ['Emergency Repairs', 'Drain Cleaning', 'Water Heater Service', 'Pipe Replacement'],
  electrician: ['Panel Upgrades', 'Lighting Installation', 'Wiring Repairs', 'Safety Inspections'],
  hvac: ['AC Repair', 'Heating Service', 'System Installation', 'Maintenance Plans'],
  roofer: ['Roof Repair', 'New Roof Installation', 'Storm Damage', 'Gutter Service'],
  contractor: ['Remodeling', 'Additions', 'Repairs', 'Project Management'],
  lawyer: ['Consultations', 'Case Evaluation', 'Representation', 'Document Review'],
  accountant: ['Tax Preparation', 'Bookkeeping', 'Payroll', 'Financial Reporting'],
  'financial-advisor': ['Retirement Planning', 'Investment Strategy', 'Wealth Management', 'Risk Review'],
  realtor: ['Buyer Representation', 'Listing Services', 'Market Analysis', 'Negotiation'],
  dentist: ['Cleanings', 'Cosmetic Dentistry', 'Implants', 'Emergency Care'],
  chiropractor: ['Spinal Adjustment', 'Pain Relief', 'Posture Care', 'Wellness Plans'],
  veterinarian: ['Wellness Exams', 'Vaccinations', 'Surgery', 'Dental Care'],
  therapist: ['Individual Therapy', 'Couples Counseling', 'Stress Management', 'Treatment Plans'],
  gym: ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Membership Plans'],
  restaurant: ['Dine-In', 'Takeout', 'Catering', 'Private Events'],
  photographer: ['Portraits', 'Events', 'Branding', 'Editing'],
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

function buildSiteContent(job: JobInput, industry: string): SiteContent {
  const merged = { ...job, ...(job.context || {}), ...(job.content || {}), ...(job.sampleContent || {}) } as JobInput;
  const industryLabel = formatIndustryName(industry);

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
  const tagline =
    merged.tagline ||
    (location
      ? `Trusted ${industryLabel} services in ${location}`
      : `Trusted ${industryLabel} services you can count on`);

  const headline = merged.headline || businessName;
  const description =
    merged.description ||
    `Reliable ${industryLabel} solutions for homes and businesses${location ? ` across ${location}` : ''}.`;

  return {
    businessName,
    industry,
    headline,
    tagline,
    description,
    services: normalizeServices(merged.services, industry),
    testimonials: merged.testimonials,
    team: merged.team,
    faqs: merged.faqs,
    stats: merged.stats,
    contact,
    hours: merged.hours,
    trustBadges: merged.trustBadges,
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
  const content = buildSiteContent(job, industry);
  const timestamp = new Date().toISOString();

  const screenshotter = await createScreenshotter(screenshots);
  const manifestEntries: ManifestEntry[] = [];

  for (const vibeId of vibes) {
    const vibe = VIBES[vibeId] || getVibeForIndustry(industry);
    if (!VIBES[vibeId]) {
      console.warn(`Warning: Unknown vibe "${vibeId}", falling back to ${vibe.id}.`);
    }

    const dna = generateConstrainedDNA(vibe);
    const html = buildWebsite(content, { dna });

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
