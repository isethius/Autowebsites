import { getQueue, JobQueue, Job, JobType } from './queue';
import { discoverLeads, saveDiscoveredLeads } from '../discovery/lead-finder';
import { captureWebsite } from '../capture/website-capture';
import { generateManifest, saveManifest } from '../capture/manifest-generator';
import { generateUniqueVariances } from '../themes/variance-planner';
import { generateThemes } from '../themes/theme-generator';
import { generateGallery } from '../themes/gallery-generator';
import { deployToVercel } from '../preview/deploy';
import { scoreWebsite } from '../outreach/website-scorer';
import { startCampaign, processPendingFollowUps } from '../email/drip-campaign';
import { getLeadDatabase, Lead } from '../outreach/lead-database';

export interface PipelineConfig {
  // Discovery settings
  discoveryQueries: string[];
  leadsPerQuery: number;
  scoreThreshold: number;

  // Processing settings
  autoDeploy: boolean;
  autoEmail: boolean;

  // Schedule settings (cron expressions)
  discoverySchedule?: string;  // e.g., '0 9 * * 1' (9am every Monday)
  followUpSchedule?: string;   // e.g., '0 10 * * *' (10am daily)

  // Rate limiting
  maxLeadsPerDay: number;
  maxEmailsPerDay: number;
}

const DEFAULT_CONFIG: PipelineConfig = {
  discoveryQueries: [],
  leadsPerQuery: 10,
  scoreThreshold: 6,
  autoDeploy: true,
  autoEmail: false,  // Require explicit opt-in for auto-email
  maxLeadsPerDay: 50,
  maxEmailsPerDay: 100
};

let pipelineConfig: PipelineConfig = { ...DEFAULT_CONFIG };
let cronIntervals: NodeJS.Timeout[] = [];

export function configureRunner(config: Partial<PipelineConfig>): void {
  pipelineConfig = { ...pipelineConfig, ...config };
}

export function registerHandlers(queue: JobQueue): void {
  // Discovery handler
  queue.registerHandler('discover', async (job: Job) => {
    const { query, maxResults, scoreThreshold } = job.data;

    const leads = await discoverLeads({
      query,
      maxResults: maxResults || pipelineConfig.leadsPerQuery,
      scoreThreshold: scoreThreshold || pipelineConfig.scoreThreshold
    });

    // Save good leads to database
    const savedLeads = await saveDiscoveredLeads(leads);

    // Queue next steps for each lead
    for (const lead of savedLeads) {
      if (pipelineConfig.autoDeploy) {
        queue.addJob('generate', { leadId: lead.id, url: lead.website_url }, { priority: 1 });
      }
    }

    return { leadsFound: leads.length, leadsSaved: savedLeads.length };
  });

  // Capture handler
  queue.registerHandler('capture', async (job: Job) => {
    const { url } = job.data;
    const result = await captureWebsite({ url });
    const manifest = generateManifest(result);
    const manifestPath = saveManifest(manifest);
    return { manifestPath, screenshotPath: result.screenshotPath };
  });

  // Score handler
  queue.registerHandler('score', async (job: Job) => {
    const { url, leadId } = job.data;

    const result = await captureWebsite({ url });
    const manifest = generateManifest(result);
    const score = scoreWebsite(manifest);

    if (leadId) {
      const db = getLeadDatabase();
      await db.setLeadScore(leadId, score.overall, {
        overall: score.overall,
        design: score.design.score,
        mobile: score.mobile.score,
        performance: score.performance.score,
        seo: score.seo.score
      });
    }

    return { score: score.overall };
  });

  // Generate themes handler
  queue.registerHandler('generate', async (job: Job) => {
    const { leadId, url } = job.data;

    // Capture website
    const result = await captureWebsite({ url });
    const manifest = generateManifest(result);

    // Generate themes
    const variances = generateUniqueVariances(10);
    const themes = generateThemes(manifest, variances);

    // Create gallery
    const hostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_');
    const outputDir = `tmp/autowebsites/themes/${hostname}`;
    generateGallery(themes, {
      outputDir,
      title: `Themes for ${manifest.summary.pageTitle}`,
      originalUrl: url
    });

    // Queue deployment if enabled
    if (pipelineConfig.autoDeploy) {
      queue.addJob('deploy', { leadId, outputDir }, { priority: 2 });
    }

    return { themesGenerated: themes.length, outputDir };
  });

  // Deploy handler
  queue.registerHandler('deploy', async (job: Job) => {
    const { leadId, outputDir } = job.data;

    const result = await deployToVercel({ directory: outputDir });

    if (result.success && leadId) {
      const db = getLeadDatabase();
      await db.setGalleryUrl(leadId, result.url);

      // Queue email if enabled
      if (pipelineConfig.autoEmail) {
        queue.addJob('email', { leadId, previewUrl: result.url }, { priority: 3 });
      }
    }

    return result;
  });

  // Email handler
  queue.registerHandler('email', async (job: Job) => {
    const { leadId, previewUrl } = job.data;

    const db = getLeadDatabase();
    const lead = await db.getLead(leadId);

    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const result = await startCampaign(lead, previewUrl);
    return result;
  });

  // Follow-up handler
  queue.registerHandler('followup', async (job: Job) => {
    const result = await processPendingFollowUps();
    return result;
  });
}

export async function runDiscovery(queries?: string[]): Promise<void> {
  const queue = getQueue();
  const queryList = queries || pipelineConfig.discoveryQueries;

  console.log(`\n🔍 Queuing discovery for ${queryList.length} queries...\n`);

  for (const query of queryList) {
    queue.addJob('discover', { query }, { priority: 0 });
  }
}

export async function runFullPipeline(url: string, options?: {
  deploy?: boolean;
  email?: boolean;
}): Promise<void> {
  const queue = getQueue();
  registerHandlers(queue);

  const originalAutoDeploy = pipelineConfig.autoDeploy;
  const originalAutoEmail = pipelineConfig.autoEmail;

  if (options?.deploy !== undefined) pipelineConfig.autoDeploy = options.deploy;
  if (options?.email !== undefined) pipelineConfig.autoEmail = options.email;

  // Create a mock lead for single URL processing
  const db = getLeadDatabase();
  let lead: Lead;

  try {
    const existing = await db.getLeadByUrl(url);
    if (existing) {
      lead = existing;
    } else {
      lead = await db.createLead({
        website_url: url,
        status: 'new'
      });
    }
  } catch (e) {
    // Database not configured, create a minimal lead object
    lead = {
      id: `temp-${Date.now()}`,
      website_url: url,
      status: 'new'
    };
  }

  // Queue the generation job
  queue.addJob('generate', { leadId: lead.id, url }, { priority: 1 });

  // Process all jobs
  console.log('\n🚀 Running pipeline...\n');
  const result = await queue.processAll();
  console.log(`\n✅ Pipeline complete: ${result.completed} jobs completed, ${result.failed} failed`);

  // Restore config
  pipelineConfig.autoDeploy = originalAutoDeploy;
  pipelineConfig.autoEmail = originalAutoEmail;
}

export function startScheduler(): void {
  const queue = getQueue();
  registerHandlers(queue);

  console.log('\n⏰ Starting scheduler...\n');

  // Start the queue processor
  queue.start();

  // Schedule discovery (simple interval-based, not full cron)
  if (pipelineConfig.discoverySchedule && pipelineConfig.discoveryQueries.length > 0) {
    // Run discovery every 24 hours
    const discoveryInterval = setInterval(() => {
      console.log('\n⏰ Scheduled discovery triggered');
      runDiscovery();
    }, 24 * 60 * 60 * 1000);

    cronIntervals.push(discoveryInterval);
    console.log('  📅 Discovery scheduled: daily');
  }

  // Schedule follow-up processing
  if (pipelineConfig.followUpSchedule) {
    // Process follow-ups every hour
    const followUpInterval = setInterval(() => {
      console.log('\n⏰ Scheduled follow-up processing triggered');
      queue.addJob('followup', {}, { priority: 5 });
    }, 60 * 60 * 1000);

    cronIntervals.push(followUpInterval);
    console.log('  📅 Follow-ups scheduled: hourly');
  }

  console.log('\n✅ Scheduler started. Press Ctrl+C to stop.\n');
}

export function stopScheduler(): void {
  const queue = getQueue();
  queue.stop();

  for (const interval of cronIntervals) {
    clearInterval(interval);
  }
  cronIntervals = [];

  console.log('⏹️ Scheduler stopped');
}

export function getRunnerStatus(): {
  config: PipelineConfig;
  queueStats: ReturnType<JobQueue['getStats']>;
  isRunning: boolean;
} {
  const queue = getQueue();
  return {
    config: pipelineConfig,
    queueStats: queue.getStats(),
    isRunning: cronIntervals.length > 0
  };
}

// CLI entry point
if (require.main === module) {
  const action = process.argv[2] || 'status';

  switch (action) {
    case 'start':
      // Example: npx tsx src/scheduler/pipeline-runner.ts start "plumbers in Austin TX" "electricians in Houston TX"
      const queries = process.argv.slice(3);
      if (queries.length > 0) {
        configureRunner({ discoveryQueries: queries });
      }
      startScheduler();

      // Keep process running
      process.on('SIGINT', () => {
        stopScheduler();
        process.exit(0);
      });
      break;

    case 'discover':
      const query = process.argv[3];
      if (!query) {
        console.log('Usage: npx tsx src/scheduler/pipeline-runner.ts discover "plumbers in Austin TX"');
        process.exit(1);
      }

      const queue = getQueue();
      registerHandlers(queue);
      queue.addJob('discover', { query }, { priority: 0 });
      queue.processAll().then(result => {
        console.log(`\n✅ Done: ${result.completed} completed, ${result.failed} failed`);
      });
      break;

    case 'run':
      const url = process.argv[3];
      if (!url) {
        console.log('Usage: npx tsx src/scheduler/pipeline-runner.ts run https://example.com');
        process.exit(1);
      }

      runFullPipeline(url, {
        deploy: process.argv.includes('--deploy'),
        email: process.argv.includes('--email')
      });
      break;

    case 'status':
      const status = getRunnerStatus();
      console.log('\n📊 Pipeline Runner Status:\n');
      console.log('  Queue:', status.queueStats);
      console.log('  Running:', status.isRunning);
      console.log('  Config:', JSON.stringify(status.config, null, 2));
      break;

    default:
      console.log('Usage: npx tsx src/scheduler/pipeline-runner.ts [start|discover|run|status]');
  }
}
