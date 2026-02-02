import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

type Vibe =
  | 'executive'
  | 'maverick'
  | 'artisan'
  | 'minimalist'
  | 'bold'
  | 'classic'
  | 'modern'
  | 'playful';

type SampleContent = Record<string, unknown>;
type SampleContentGetter = (industry: string) => SampleContent | Promise<SampleContent>;

type SquadConfig = {
  label: string;
  blueprint: string;
  industries: string[];
  outputDir: string;
};

type JobDefinition = {
  industry: string;
  blueprint: string;
  vibes: Vibe[];
  outputDir: string;
  sampleContent: SampleContent;
};

const VIBES: Vibe[] = [
  'executive',
  'maverick',
  'artisan',
  'minimalist',
  'bold',
  'classic',
  'modern',
  'playful',
];

const SQUAD_CONFIG: Record<string, SquadConfig> = {
  A: {
    label: 'Blue Collar',
    blueprint: 'service-business',
    industries: ['plumber', 'hvac', 'electrician', 'roofer', 'landscaper'],
    outputDir: 'dist/portfolio/service/',
  },
  B: {
    label: 'White Collar',
    blueprint: 'professional-services',
    industries: ['lawyer', 'accountant', 'realtor', 'consultant'],
    outputDir: 'dist/portfolio/pro/',
  },
  C: {
    label: 'Health',
    blueprint: 'health-wellness',
    industries: ['dentist', 'chiropractor', 'therapist', 'gym', 'spa'],
    outputDir: 'dist/portfolio/health/',
  },
  D: {
    label: 'Creative',
    blueprint: 'creative-visual',
    industries: ['photographer', 'restaurant', 'cafe', 'studio'],
    outputDir: 'dist/portfolio/creative/',
  },
};

async function resolveSampleContentGetter(): Promise<SampleContentGetter | null> {
  const candidates = [
    '../src/ai/sample-content',
    '../src/ai/sampleContent',
    '../src/sample-content',
    '../src/sampleContent',
  ];

  for (const modulePath of candidates) {
    try {
      const mod = await import(modulePath);
      if (typeof mod.getSampleContent === 'function') {
        return mod.getSampleContent as SampleContentGetter;
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') {
        continue;
      }
      // Ignore other errors and fall back to an empty object.
      return null;
    }
  }

  return null;
}

async function resolveSampleContent(
  industry: string,
  getter: SampleContentGetter | null,
): Promise<SampleContent> {
  if (!getter) {
    return {};
  }

  try {
    const result = await getter(industry);
    if (result && typeof result === 'object') {
      return result;
    }
  } catch {
    // Fall back to empty sample content when the getter fails.
  }

  return {};
}

async function main(): Promise<void> {
  const jobsDir = path.resolve(process.cwd(), 'jobs');
  await mkdir(jobsDir, { recursive: true });

  const sampleContentGetter = await resolveSampleContentGetter();

  const jobs: JobDefinition[] = [];

  for (const squad of Object.values(SQUAD_CONFIG)) {
    for (const industry of squad.industries) {
      const sampleContent = await resolveSampleContent(industry, sampleContentGetter);
      jobs.push({
        industry,
        blueprint: squad.blueprint,
        vibes: VIBES,
        outputDir: squad.outputDir,
        sampleContent,
      });
    }
  }

  await Promise.all(
    jobs.map(async job => {
      const filePath = path.join(jobsDir, `job-${job.industry}.json`);
      const payload = JSON.stringify(job, null, 2);
      await writeFile(filePath, payload);
    }),
  );

  console.log(`Generated ${jobs.length} swarm job files in ${jobsDir}`);
}

main().catch(error => {
  console.error('Failed to dispatch swarm jobs:', error);
  process.exitCode = 1;
});
