#!/usr/bin/env node
import * as path from 'path';
import * as fs from 'fs';

// Capture modules
import { captureWebsite, CaptureResult } from './capture/website-capture';
import { generateManifest, saveManifest, loadManifest, WebsiteManifest } from './capture/manifest-generator';

// Theme modules
import { generateUniqueVariances, ThemeVariance } from './themes/variance-planner';
import { generateThemes, GeneratedTheme } from './themes/theme-generator';
import { generateGallery } from './themes/gallery-generator';

// Preview modules
import { startServer } from './preview/server';
import { deployToVercel } from './preview/deploy';

// Outreach modules
import { scoreWebsite, formatScoreReport } from './outreach/website-scorer';
import { getLeadDatabase, Lead, LeadStatus } from './outreach/lead-database';
import { generateEmail } from './outreach/email-generator';

// Discovery modules
import { searchBusinesses } from './discovery/google-places';
import { extractContactInfo } from './discovery/contact-extractor';
import { discoverLeads, saveDiscoveredLeads, formatDiscoveryReport } from './discovery/lead-finder';

// Email modules
import { sendEmail, verifyApiKey } from './email/sendgrid-client';
import { startCampaign, processPendingFollowUps, getAllCampaignStatuses } from './email/drip-campaign';

// Scheduler modules
import { getQueue } from './scheduler/queue';
import { startScheduler, stopScheduler, configureRunner, runDiscovery, getRunnerStatus, registerHandlers } from './scheduler/pipeline-runner';

// New Pro modules
import { config, features } from './utils/config';
import { logger } from './utils/logger';
import { runHealthChecks, quickHealthCheck, getSystemInfo } from './utils/health';
import { getAutoWebsitesPro } from './index';
import { createDashboardServer } from './dashboard/server';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════╗
║                   AUTOWEBSITES PRO CLI                       ║
╠══════════════════════════════════════════════════════════════╣
║  CAPTURE & ANALYZE:                                          ║
║    capture <url>        Screenshot + extract data            ║
║    score <url>          Score design/mobile/perf/seo         ║
║    generate <url>       Generate 10 theme variations         ║
║    ai-analyze <url>     AI-powered website analysis          ║
║                                                              ║
║  DISCOVERY & OUTREACH:                                       ║
║    discover <query>     Find leads (e.g., "plumbers Austin") ║
║    send <lead-id>       Send outreach email to lead          ║
║    outreach <url>       Full outreach workflow               ║
║                                                              ║
║  SALES PIPELINE:                                             ║
║    proposal <lead-id>   Generate PDF proposal                ║
║    contract <lead-id>   Generate contract                    ║
║    crm [action]         CRM operations (stats/timeline)      ║
║                                                              ║
║  AUTOMATION:                                                 ║
║    schedule [action]    Manage automated pipeline            ║
║    queue [action]       Manage job queue                     ║
║                                                              ║
║  PREVIEW & DEPLOY:                                           ║
║    serve [dir] [port]   Start local preview server           ║
║    deploy [dir]         Deploy to Vercel                     ║
║    dashboard [port]     Start web dashboard                  ║
║                                                              ║
║  DATABASE & SYSTEM:                                          ║
║    leads [action]       Manage leads (list/add/stats/delete) ║
║    pipeline <url>       Run full pipeline                    ║
║    health               System health check                  ║
║    e2e-test <query>     Run full E2E test                    ║
║                                                              ║
║  Options:                                                    ║
║    --help, -h           Show this help                       ║
║    --prod               Deploy to production                 ║
║    --save               Save results to database             ║
║    --email              Auto-send outreach email             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'capture':
        await handleCapture(args.slice(1));
        break;
      case 'generate':
        await handleGenerate(args.slice(1));
        break;
      case 'deploy':
        await handleDeploy(args.slice(1));
        break;
      case 'score':
        await handleScore(args.slice(1));
        break;
      case 'leads':
        await handleLeads(args.slice(1));
        break;
      case 'outreach':
        await handleOutreach(args.slice(1));
        break;
      case 'serve':
        await handleServe(args.slice(1));
        break;
      case 'pipeline':
        await handlePipeline(args.slice(1));
        break;
      case 'discover':
        await handleDiscover(args.slice(1));
        break;
      case 'send':
        await handleSend(args.slice(1));
        break;
      case 'schedule':
        await handleSchedule(args.slice(1));
        break;
      case 'queue':
        await handleQueue(args.slice(1));
        break;
      case 'ai-analyze':
        await handleAIAnalyze(args.slice(1));
        break;
      case 'proposal':
        await handleProposal(args.slice(1));
        break;
      case 'contract':
        await handleContract(args.slice(1));
        break;
      case 'dashboard':
        await handleDashboard(args.slice(1));
        break;
      case 'health':
        await handleHealth(args.slice(1));
        break;
      case 'crm':
        await handleCRM(args.slice(1));
        break;
      case 'e2e-test':
        await handleE2ETest(args.slice(1));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

async function handleCapture(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL to capture');
  }

  console.log(`\n📸 Capturing ${url}...\n`);

  const captureResult = await captureWebsite({ url });
  const manifest = generateManifest(captureResult);
  const manifestPath = saveManifest(manifest);

  console.log(`\n✓ Capture complete!`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`  Screenshot: ${captureResult.screenshotPath}`);
  console.log(`  Links found: ${captureResult.links.length}`);
}

async function handleGenerate(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL to generate themes for');
  }

  console.log(`\n🎨 Generating themes for ${url}...\n`);

  const captureResult = await captureWebsite({ url });
  const manifest = generateManifest(captureResult);
  saveManifest(manifest);

  console.log('Generating 10 unique theme variances...');
  const variances = generateUniqueVariances(10);

  console.log('Building theme HTML/CSS...');
  const themes = generateThemes(manifest, variances);

  const outputDir = getOutputDir(args) || 'tmp/autowebsites/themes';
  const galleryPath = generateGallery(themes, {
    outputDir,
    title: `Themes for ${manifest.summary.pageTitle}`,
    originalUrl: url
  });

  console.log(`\n✓ Generated ${themes.length} themes!`);
  console.log(`  Gallery: ${galleryPath}`);
  console.log(`  Run 'npx tsx src/cli.ts serve ${outputDir}' to preview`);
}

async function handleDeploy(args: string[]) {
  const directory = args[0] || 'tmp/autowebsites/themes';
  const prod = args.includes('--prod');

  console.log(`\n🚀 Deploying ${directory} to Vercel...\n`);

  const result = await deployToVercel({ directory, prod });

  if (result.success) {
    console.log(`\n✓ Deployed successfully!`);
    console.log(`  URL: ${result.url}`);
  } else {
    throw new Error(result.error || 'Deployment failed');
  }
}

async function handleScore(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL to score');
  }

  console.log(`\n📊 Scoring ${url}...\n`);

  const captureResult = await captureWebsite({ url });
  const manifest = generateManifest(captureResult);
  const score = scoreWebsite(manifest);

  console.log(formatScoreReport(score, url));
}

async function handleLeads(args: string[]) {
  const action = args[0] || 'list';
  const db = getLeadDatabase();

  switch (action) {
    case 'list': {
      const status = args[1] as LeadStatus | undefined;
      const leads = await db.listLeads({ status, limit: 20 });
      console.log(`\n📋 Leads (${leads.length}):\n`);
      for (const lead of leads) {
        console.log(`  ${lead.id?.slice(0, 8)}  ${lead.status.padEnd(15)}  ${lead.score || '-'}/10  ${lead.website_url}`);
      }
      break;
    }
    case 'add': {
      const url = args[1];
      if (!url) throw new Error('Please provide a URL');
      const lead = await db.createLead({
        website_url: url,
        status: 'new'
      });
      console.log(`\n✓ Lead created: ${lead.id}`);
      break;
    }
    case 'stats': {
      const stats = await db.getLeadStats();
      console.log(`\n📈 Lead Statistics:\n`);
      console.log(`  Total: ${stats.total}`);
      console.log(`  Average Score: ${stats.avgScore}/10`);
      console.log(`\n  By Status:`);
      for (const [status, count] of Object.entries(stats.byStatus)) {
        if (count > 0) {
          console.log(`    ${status}: ${count}`);
        }
      }
      break;
    }
    case 'update': {
      const id = args[1];
      const status = args[2] as LeadStatus;
      if (!id || !status) throw new Error('Please provide lead ID and new status');
      await db.updateLeadStatus(id, status);
      console.log(`\n✓ Lead ${id} updated to ${status}`);
      break;
    }
    case 'delete': {
      const id = args[1];
      if (!id) throw new Error('Please provide lead ID');
      await db.deleteLead(id);
      console.log(`\n✓ Lead ${id} deleted`);
      break;
    }
    default:
      console.log('Lead actions: list [status], add <url>, stats, update <id> <status>, delete <id>');
  }
}

async function handleOutreach(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL for outreach');
  }

  const shouldEmail = args.includes('--email');
  const shouldDeploy = args.includes('--deploy') || args.includes('--prod');

  console.log(`\n✉️ Running outreach workflow for ${url}...\n`);

  // Get or create lead
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
    lead = { id: `temp-${Date.now()}`, website_url: url, status: 'new' };
  }

  // Capture and score
  console.log('📸 Capturing website...');
  const captureResult = await captureWebsite({ url });
  const manifest = generateManifest(captureResult);
  const score = scoreWebsite(manifest);
  console.log(`  Score: ${score.overall}/10`);

  // Extract contact info
  console.log('📧 Extracting contact info...');
  const contactInfo = await extractContactInfo(url);
  if (contactInfo.emails.length > 0) {
    lead.email = contactInfo.emails[0];
    console.log(`  Found email: ${lead.email}`);
  } else {
    console.log('  ⚠️ No email found');
  }

  // Generate themes
  console.log('🎨 Generating themes...');
  const variances = generateUniqueVariances(10);
  const themes = generateThemes(manifest, variances);
  const hostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_');
  const outputDir = `tmp/autowebsites/themes/${hostname}`;
  generateGallery(themes, {
    outputDir,
    title: `Themes for ${manifest.summary.pageTitle}`,
    originalUrl: url
  });
  console.log(`  Generated ${themes.length} themes`);

  // Deploy if requested
  let previewUrl = `file://${path.resolve(outputDir)}/index.html`;
  if (shouldDeploy) {
    console.log('🚀 Deploying to Vercel...');
    const deployResult = await deployToVercel({ directory: outputDir });
    if (deployResult.success) {
      previewUrl = deployResult.url;
      console.log(`  Deployed: ${previewUrl}`);
    }
  }

  // Generate email
  const email = generateEmail({
    lead,
    score,
    previewUrl
  });

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`\n📧 OUTREACH EMAIL:\n`);
  console.log(`To: ${lead.email || '[No email found]'}`);
  console.log(`Subject: ${email.subject}\n`);
  console.log(email.body);
  console.log(`\n${'═'.repeat(50)}`);

  // Send email if requested and email exists
  if (shouldEmail && lead.email) {
    console.log('\n📤 Sending email...');
    const result = await startCampaign(lead, previewUrl, score);
    if (result.success) {
      console.log('  ✓ Email sent!');
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
    }
  } else if (shouldEmail && !lead.email) {
    console.log('\n⚠️ Cannot send email - no email address found');
  }

  console.log(`\n📂 Gallery: ${outputDir}/index.html`);
  console.log(`🌐 Preview: ${previewUrl}\n`);
}

async function handleServe(args: string[]) {
  const directory = args[0] || 'tmp/autowebsites/themes';
  const port = parseInt(args[1] || '3000', 10);

  await startServer({ directory, port });
}

async function handlePipeline(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL for the pipeline');
  }

  const prod = args.includes('--prod');
  const shouldDeploy = args.includes('--deploy') || prod;

  console.log(`\n🚀 Running full pipeline for ${url}...\n`);
  console.log('═'.repeat(50));

  // Step 1: Capture
  console.log('\n📸 Step 1: Capturing website...');
  const captureResult = await captureWebsite({ url });
  const manifest = generateManifest(captureResult);
  const manifestPath = saveManifest(manifest);
  console.log(`  ✓ Screenshot: ${captureResult.screenshotPath}`);
  console.log(`  ✓ Manifest: ${manifestPath}`);

  // Step 2: Score
  console.log('\n📊 Step 2: Scoring website...');
  const score = scoreWebsite(manifest);
  console.log(`  ✓ Overall Score: ${score.overall}/10`);
  console.log(`    Design: ${score.design.score}/10, Mobile: ${score.mobile.score}/10`);
  console.log(`    Performance: ${score.performance.score}/10, SEO: ${score.seo.score}/10`);

  // Step 3: Generate themes
  console.log('\n🎨 Step 3: Generating themes...');
  const variances = generateUniqueVariances(10);
  const themes = generateThemes(manifest, variances);
  const hostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, '_');
  const outputDir = `tmp/autowebsites/themes/${hostname}`;
  const galleryPath = generateGallery(themes, {
    outputDir,
    title: `Themes for ${manifest.summary.pageTitle}`,
    originalUrl: url
  });
  console.log(`  ✓ Generated ${themes.length} themes`);
  console.log(`  ✓ Gallery: ${galleryPath}`);

  // Step 4: Deploy
  let deployUrl = '';
  if (shouldDeploy) {
    console.log('\n🚀 Step 4: Deploying to Vercel...');
    const deployResult = await deployToVercel({ directory: outputDir, prod });
    if (deployResult.success) {
      deployUrl = deployResult.url;
      console.log(`  ✓ Deployed: ${deployUrl}`);
    } else {
      console.log(`  ✗ Deploy failed: ${deployResult.error}`);
    }
  } else {
    console.log('\n⏭️ Step 4: Skipping deploy (use --deploy or --prod)');
  }

  // Step 5: Save to database
  console.log('\n💾 Step 5: Saving to database...');
  try {
    const db = getLeadDatabase();
    let lead = await db.getLeadByUrl(url);
    if (!lead) {
      lead = await db.createLead({
        website_url: url,
        business_name: manifest.summary.pageTitle,
        status: 'new'
      });
    }
    await db.setLeadScore(lead.id!, score.overall, {
      overall: score.overall,
      design: score.design.score,
      mobile: score.mobile.score,
      performance: score.performance.score,
      seo: score.seo.score
    });
    if (deployUrl) {
      await db.setGalleryUrl(lead.id!, deployUrl);
    }
    console.log(`  ✓ Lead saved: ${lead.id}`);
  } catch (err: any) {
    console.log(`  ⚠️ Database save failed: ${err.message}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n✅ PIPELINE COMPLETE!\n');
  console.log(`  Website: ${url}`);
  console.log(`  Score: ${score.overall}/10`);
  console.log(`  Themes: ${themes.length} generated`);
  console.log(`  Gallery: ${path.resolve(galleryPath)}`);
  if (deployUrl) {
    console.log(`  Live URL: ${deployUrl}`);
  }
  console.log(`\n  Run 'npx tsx src/cli.ts serve ${outputDir}' to preview locally\n`);
}

async function handleDiscover(args: string[]) {
  const query = args[0];
  if (!query) {
    throw new Error('Please provide a search query (e.g., "plumbers in Austin TX")');
  }

  const maxResults = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '10', 10);
  const threshold = parseInt(args.find(a => a.startsWith('--threshold='))?.split('=')[1] || '6', 10);
  const shouldSave = args.includes('--save');

  console.log(`\n🔍 Discovering leads: "${query}"\n`);
  console.log(`  Max results: ${maxResults}`);
  console.log(`  Score threshold: <${threshold}`);
  console.log(`  Save to database: ${shouldSave ? 'Yes' : 'No'}\n`);

  const leads = await discoverLeads({
    query,
    maxResults,
    scoreThreshold: threshold,
    skipExisting: true
  });

  console.log(formatDiscoveryReport(leads));

  if (shouldSave) {
    await saveDiscoveredLeads(leads);
  }

  const goodLeads = leads.filter(l => l.isGoodLead);
  console.log(`\n✅ Found ${goodLeads.length} good leads out of ${leads.length} processed`);

  if (goodLeads.length > 0 && !shouldSave) {
    console.log(`\n💡 Run with --save to add these leads to the database`);
  }
}

async function handleSend(args: string[]) {
  const action = args[0] || 'status';

  switch (action) {
    case 'status': {
      const statuses = getAllCampaignStatuses();
      console.log(`\n📬 Email Campaign Status (${statuses.length} active):\n`);
      if (statuses.length === 0) {
        console.log('  No active campaigns');
      } else {
        for (const s of statuses) {
          console.log(`  ${s.leadId.slice(0, 8)}: ${s.status} (${s.emailsSent} sent)`);
          if (s.nextScheduledAt) {
            console.log(`    Next follow-up: ${new Date(s.nextScheduledAt).toLocaleDateString()}`);
          }
        }
      }
      break;
    }

    case 'test': {
      const email = args[1];
      if (!email) throw new Error('Please provide a test email address');

      console.log(`\n📧 Sending test email to ${email}...\n`);

      const result = await sendEmail({
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'test@example.com',
        subject: 'Test Email from AutoWebsites',
        text: 'This is a test email to verify your SendGrid integration.',
        html: '<h1>Test Email</h1><p>Your email integration is working! ✅</p>'
      });

      if (result.success) {
        console.log(`✅ Email sent! Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      break;
    }

    case 'verify': {
      console.log('\n🔑 Verifying SendGrid API key...\n');
      const valid = await verifyApiKey();
      if (valid) {
        console.log('✅ API key is valid');
      } else {
        console.log('❌ API key is invalid or not configured');
        console.log('   Set SENDGRID_API_KEY in your .env file');
      }
      break;
    }

    case 'followups': {
      console.log('\n📬 Processing pending follow-ups...\n');
      const result = await processPendingFollowUps();
      console.log(`\n✅ Processed: ${result.processed}, Sent: ${result.sent}, Errors: ${result.errors}`);
      break;
    }

    case 'lead': {
      const leadId = args[1];
      if (!leadId) throw new Error('Please provide a lead ID');

      const db = getLeadDatabase();
      const lead = await db.getLead(leadId);
      if (!lead) throw new Error(`Lead not found: ${leadId}`);
      if (!lead.email) throw new Error('Lead has no email address');

      const previewUrl = lead.gallery_url || 'https://example.com/preview';
      console.log(`\n📧 Starting campaign for ${lead.business_name || lead.website_url}...\n`);

      const result = await startCampaign(lead, previewUrl);
      if (result.success) {
        console.log(`✅ Campaign started! Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      break;
    }

    default:
      console.log('Send actions: status, test <email>, verify, followups, lead <id>');
  }
}

async function handleSchedule(args: string[]) {
  const action = args[0] || 'status';

  switch (action) {
    case 'start': {
      const queries = args.slice(1).filter(a => !a.startsWith('--'));
      if (queries.length > 0) {
        configureRunner({ discoveryQueries: queries });
      }
      startScheduler();
      console.log('\n⏰ Scheduler started. Press Ctrl+C to stop.\n');

      // Keep process running
      process.on('SIGINT', () => {
        stopScheduler();
        process.exit(0);
      });

      // Keep alive
      await new Promise(() => {});
      break;
    }

    case 'stop': {
      stopScheduler();
      console.log('⏹️ Scheduler stopped');
      break;
    }

    case 'status': {
      const status = getRunnerStatus();
      console.log('\n📊 Scheduler Status:\n');
      console.log(`  Running: ${status.isRunning ? 'Yes' : 'No'}`);
      console.log(`  Queue: ${status.queueStats.total} total jobs`);
      console.log(`    Pending: ${status.queueStats.byStatus.pending}`);
      console.log(`    Running: ${status.queueStats.byStatus.running}`);
      console.log(`    Completed: ${status.queueStats.byStatus.completed}`);
      console.log(`    Failed: ${status.queueStats.byStatus.failed}`);
      break;
    }

    case 'run': {
      const query = args[1];
      if (!query) throw new Error('Please provide a discovery query');

      const queue = getQueue();
      registerHandlers(queue);

      console.log(`\n🚀 Running discovery: "${query}"\n`);
      queue.addJob('discover', { query }, { priority: 0 });

      const result = await queue.processAll();
      console.log(`\n✅ Done: ${result.completed} completed, ${result.failed} failed`);
      break;
    }

    default:
      console.log('Schedule actions: start [queries...], stop, status, run <query>');
  }
}

async function handleQueue(args: string[]) {
  const action = args[0] || 'stats';
  const queue = getQueue();

  switch (action) {
    case 'stats': {
      const stats = queue.getStats();
      console.log('\n📊 Queue Statistics:\n');
      console.log(`  Total: ${stats.total}`);
      console.log('\n  By Status:');
      for (const [status, count] of Object.entries(stats.byStatus)) {
        if (count > 0) console.log(`    ${status}: ${count}`);
      }
      console.log('\n  By Type:');
      for (const [type, count] of Object.entries(stats.byType)) {
        console.log(`    ${type}: ${count}`);
      }
      break;
    }

    case 'pending': {
      const pending = queue.getPendingJobs();
      console.log(`\n📋 Pending Jobs (${pending.length}):\n`);
      for (const job of pending.slice(0, 20)) {
        console.log(`  ${job.id.slice(0, 8)} | ${job.type.padEnd(10)} | priority: ${job.priority}`);
      }
      break;
    }

    case 'clear': {
      const status = args[1] as any;
      const cleared = queue.clear(status);
      console.log(`\n🗑️ Cleared ${cleared} jobs`);
      break;
    }

    case 'process': {
      registerHandlers(queue);
      console.log('\n⚙️ Processing queue...\n');
      const result = await queue.processAll();
      console.log(`\n✅ Done: ${result.completed} completed, ${result.failed} failed`);
      break;
    }

    default:
      console.log('Queue actions: stats, pending, clear [status], process');
  }
}

function getOutputDir(args: string[]): string | undefined {
  const outputIndex = args.findIndex(a => a === '--output' || a === '-o');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    return args[outputIndex + 1];
  }
  return undefined;
}

// ===== NEW PRO COMMANDS =====

async function handleAIAnalyze(args: string[]) {
  const url = args[0];
  if (!url) {
    throw new Error('Please provide a URL to analyze');
  }

  if (!features.ai) {
    throw new Error('AI features not configured. Set ANTHROPIC_API_KEY in .env');
  }

  console.log(`\n🤖 AI-Analyzing ${url}...\n`);

  const { WebsiteAnalyzer } = await import('./ai/website-analyzer');
  const analyzer = new WebsiteAnalyzer();

  const analysis = await analyzer.analyze({ url });

  console.log('═'.repeat(60));
  console.log(`\n📊 AI ANALYSIS RESULTS\n`);
  console.log(`  Business: ${analysis.businessName}`);
  console.log(`  Industry: ${analysis.industry}`);
  console.log(`  Overall Score: ${analysis.overallScore}/10\n`);

  console.log('\n⚠️ Issues Found:');
  for (const issue of analysis.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.title}`);
    console.log(`    ${issue.description}`);
  }

  console.log('\n💡 Recommendations:');
  for (const rec of analysis.recommendations) {
    console.log(`  [Priority ${rec.priority}] ${rec.title}`);
    console.log(`    Expected: ${rec.expectedOutcome}`);
  }

  console.log('\n🎯 Talking Points:');
  for (const point of analysis.talkingPoints) {
    console.log(`  • ${point}`);
  }

  console.log('\n💪 Strengths:');
  for (const strength of analysis.strengths) {
    console.log(`  • ${strength}`);
  }

  console.log('\n' + '═'.repeat(60));
}

async function handleProposal(args: string[]) {
  const leadId = args[0];
  if (!leadId) {
    throw new Error('Please provide a lead ID');
  }

  const discount = parseInt(args.find(a => a.startsWith('--discount='))?.split('=')[1] || '0', 10);

  console.log(`\n📄 Generating proposal for lead ${leadId}...\n`);

  const { LeadModel } = await import('./crm/lead-model');
  const { ProposalGenerator } = await import('./crm/proposal-generator');

  const leadModel = new LeadModel();
  const lead = await leadModel.getById(leadId);

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const generator = new ProposalGenerator({
    companyName: config.COMPANY_NAME,
    companyEmail: config.COMPANY_EMAIL || 'hello@example.com',
    companyPhone: config.COMPANY_PHONE || '',
    companyAddress: config.COMPANY_ADDRESS || '',
  });

  // For proposal, we need AI analysis. Use stored or generate mock.
  const analysis = lead.ai_analysis || {
    businessName: lead.business_name,
    industry: lead.industry || 'other',
    industryConfidence: 80,
    businessType: 'local' as const,
    targetAudience: 'Local customers',
    overallScore: lead.website_score || 5,
    issues: [],
    strengths: [],
    recommendations: [],
    estimatedImpact: {
      currentMonthlyVisitors: 'Unknown',
      potentialIncrease: '50-100%',
      estimatedRevenueLoss: '$1,000-5,000/month',
    },
    talkingPoints: [],
    analyzedAt: new Date().toISOString(),
    analysisVersion: '1.0',
  };

  const result = await generator.generate(lead, analysis as any, {
    discountPercent: discount,
    validDays: 14,
  });

  console.log(`✅ Proposal generated!`);
  console.log(`   Lead: ${lead.business_name}`);
  console.log(`   Proposal ID: ${result.proposal.id}`);
  console.log(`   PDF: ${result.pdfPath}`);
  console.log(`   Valid until: ${result.proposal.valid_until}`);
  if (discount > 0) {
    console.log(`   Discount: ${discount}%`);
  }
}

async function handleContract(args: string[]) {
  const leadId = args[0];
  if (!leadId) {
    throw new Error('Please provide a lead ID');
  }

  console.log(`\n📝 Generating contract for lead ${leadId}...\n`);

  const { LeadModel } = await import('./crm/lead-model');
  const { ContractGenerator } = await import('./crm/contract-generator');

  const leadModel = new LeadModel();
  const lead = await leadModel.getById(leadId);

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const generator = new ContractGenerator({
    companyName: config.COMPANY_NAME,
    companyLegalName: config.COMPANY_NAME + ' LLC',
    companyEmail: config.COMPANY_EMAIL || 'hello@example.com',
    companyPhone: config.COMPANY_PHONE || '',
    companyAddress: config.COMPANY_ADDRESS || '',
  });

  // Create a mock proposal for the contract
  const mockProposal = {
    id: `proposal_${Date.now()}`,
    lead_id: leadId,
    created_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'sent' as const,
    pricing_tiers: [
      {
        name: 'Professional',
        price: 3500,
        description: 'Complete website redesign',
        features: ['Modern design', 'Mobile responsive', 'SEO optimized'],
        recommended: true,
      },
    ],
    selected_tier: 'Professional',
    discount_percent: 0,
    total_amount: 3500,
  };

  const result = await generator.generate(lead, mockProposal as any, 'Professional', {});

  console.log(`✅ Contract generated!`);
  console.log(`   Lead: ${lead.business_name}`);
  console.log(`   Contract ID: ${result.contract.id}`);
  console.log(`   PDF: ${result.pdfPath}`);
  console.log(`   Total: $${result.contract.total_amount.toLocaleString()}`);
}

async function handleDashboard(args: string[]) {
  const port = parseInt(args[0] || config.DASHBOARD_PORT.toString(), 10);

  console.log(`\n🖥️ Starting dashboard on port ${port}...\n`);

  // Run health check first
  const health = await quickHealthCheck();
  if (!health) {
    console.log('⚠️ Warning: Some services may be unavailable\n');
  }

  const { app, server } = createDashboardServer({
    port,
    jwtSecret: config.JWT_SECRET,
  });

  console.log(`✅ Dashboard running at http://localhost:${port}`);
  console.log(`\n   Routes:`);
  console.log(`   - GET  /           Dashboard home`);
  console.log(`   - GET  /leads      Lead management`);
  console.log(`   - GET  /campaigns  Email campaigns`);
  console.log(`   - GET  /api/health Health check`);
  console.log(`\n   Press Ctrl+C to stop\n`);

  // Keep running
  process.on('SIGINT', () => {
    console.log('\n\nShutting down dashboard...');
    server.close(() => {
      console.log('Dashboard stopped');
      process.exit(0);
    });
  });

  await new Promise(() => {});
}

async function handleHealth(args: string[]) {
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log(`\n🏥 Running health checks...\n`);

  const result = await runHealthChecks();

  console.log(`Status: ${result.status.toUpperCase()}`);
  console.log(`Uptime: ${result.uptime} seconds`);
  console.log(`Timestamp: ${result.timestamp}\n`);

  console.log('Checks:');
  for (const check of result.checks) {
    const icon = check.status === 'pass' ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}: ${check.status} (${check.duration}ms)`);
    if (check.message && (verbose || check.status === 'fail')) {
      console.log(`     ${check.message}`);
    }
  }

  if (verbose) {
    console.log('\nSystem Info:');
    const info = getSystemInfo();
    console.log(`  Node: ${info.node_version}`);
    console.log(`  Platform: ${info.platform} (${info.arch})`);
    console.log(`  Memory: ${info.memory.heap_used_mb}MB / ${info.memory.heap_total_mb}MB heap`);
    console.log(`  Environment: ${info.environment}`);
  }

  console.log();
}

async function handleCRM(args: string[]) {
  const action = args[0] || 'stats';

  const { LeadModel } = await import('./crm/lead-model');
  const { PipelineManager } = await import('./crm/pipeline-manager');
  const { ActivityLogger } = await import('./crm/activity-logger');

  const leadModel = new LeadModel();
  const activityLogger = new ActivityLogger();
  const pipelineManager = new PipelineManager(leadModel, activityLogger);

  switch (action) {
    case 'stats': {
      console.log('\n📊 CRM Statistics\n');

      const stats = await leadModel.getStats();
      console.log(`Total Leads: ${stats.total}`);
      console.log(`Average Score: ${stats.avg_website_score || 'N/A'}/10\n`);

      console.log('By Stage:');
      for (const [stage, count] of Object.entries(stats.by_stage)) {
        if ((count as number) > 0) console.log(`  ${stage}: ${count}`);
      }

      console.log('\nBy Priority:');
      for (const [priority, count] of Object.entries(stats.by_priority)) {
        if ((count as number) > 0) console.log(`  ${priority}: ${count}`);
      }

      const pipeline = await pipelineManager.getPipelineSummary();
      console.log('\nPipeline:');
      for (const stage of pipeline.stages) {
        console.log(`  ${stage.stage}: ${stage.count} leads ($${stage.value.toLocaleString()})`);
      }
      break;
    }

    case 'timeline': {
      const leadId = args[1];
      if (!leadId) throw new Error('Please provide a lead ID');

      const timeline = await activityLogger.getTimeline(leadId, { limit: 20 });
      console.log(`\n📜 Activity Timeline for ${leadId.slice(0, 8)}...\n`);

      for (const activity of timeline) {
        const date = new Date(activity.created_at).toLocaleDateString();
        console.log(`  ${date} | ${activity.type.padEnd(15)} | ${activity.description || ''}`);
      }
      break;
    }

    case 'stale': {
      const staleLeads = await pipelineManager.getStaleLeads();
      console.log(`\n⚠️ Stale Leads (${staleLeads.length})\n`);

      for (const stale of staleLeads.slice(0, 20)) {
        console.log(`  ${stale.lead.id?.slice(0, 8)} | ${stale.lead.pipeline_stage.padEnd(12)} | ${stale.daysInStage} days in stage`);
      }
      break;
    }

    default:
      console.log('CRM actions: stats, timeline <lead-id>, stale');
  }
}

async function handleE2ETest(args: string[]) {
  const query = args[0] || 'plumbers in Austin TX';

  console.log(`\n🧪 Running E2E Test: "${query}"\n`);
  console.log('═'.repeat(60));

  const steps: { name: string; status: 'pass' | 'fail' | 'skip'; details?: string }[] = [];

  try {
    // Step 1: Health Check
    console.log('\n1️⃣ Health Check...');
    const health = await runHealthChecks();
    if (health.status === 'unhealthy') {
      steps.push({ name: 'Health Check', status: 'fail', details: 'Critical services down' });
      throw new Error('Health check failed');
    }
    steps.push({ name: 'Health Check', status: 'pass', details: health.status });
    console.log(`   ✅ ${health.status}`);

    // Step 2: Initialize Pro
    console.log('\n2️⃣ Initialize AutoWebsites Pro...');
    const app = getAutoWebsitesPro();
    await app.initialize({ startDashboard: false, startWorker: false });
    steps.push({ name: 'Initialize', status: 'pass' });
    console.log('   ✅ Initialized');

    // Step 3: Run Orchestrator E2E
    console.log('\n3️⃣ Running Orchestrator E2E Test...');
    const orchestrator = app.getOrchestrator();
    const e2eResult = await orchestrator.runE2ETest(query);

    for (const step of e2eResult.steps) {
      steps.push({ name: step.name, status: step.status as any, details: JSON.stringify(step.details) });
      const icon = step.status === 'pass' ? '✅' : '❌';
      console.log(`   ${icon} ${step.name}`);
    }

    // Step 4: Check AI (if configured)
    if (features.ai) {
      console.log('\n4️⃣ Testing AI Analysis...');
      try {
        const { WebsiteAnalyzer } = await import('./ai/website-analyzer');
        const analyzer = new WebsiteAnalyzer();
        const testAnalysis = await analyzer.analyze({ url: 'https://example.com' });
        steps.push({ name: 'AI Analysis', status: 'pass', details: `Score: ${testAnalysis.overallScore}` });
        console.log(`   ✅ AI working (score: ${testAnalysis.overallScore}/10)`);
      } catch (err: any) {
        steps.push({ name: 'AI Analysis', status: 'fail', details: err.message });
        console.log(`   ❌ ${err.message}`);
      }
    } else {
      steps.push({ name: 'AI Analysis', status: 'skip', details: 'Not configured' });
      console.log('\n4️⃣ AI Analysis: ⏭️ Skipped (ANTHROPIC_API_KEY not set)');
    }

    // Step 5: Cleanup
    console.log('\n5️⃣ Cleanup...');
    await app.shutdown();
    steps.push({ name: 'Cleanup', status: 'pass' });
    console.log('   ✅ Shutdown complete');

  } catch (error: any) {
    steps.push({ name: 'E2E Test', status: 'fail', details: error.message });
    console.log(`\n❌ Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 E2E TEST SUMMARY\n');

  const passed = steps.filter(s => s.status === 'pass').length;
  const failed = steps.filter(s => s.status === 'fail').length;
  const skipped = steps.filter(s => s.status === 'skip').length;

  for (const step of steps) {
    const icon = step.status === 'pass' ? '✅' : step.status === 'fail' ? '❌' : '⏭️';
    console.log(`  ${icon} ${step.name}`);
  }

  console.log(`\n  Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);

  if (failed === 0) {
    console.log('\n🎉 E2E TEST PASSED!\n');
  } else {
    console.log('\n💥 E2E TEST FAILED\n');
    process.exit(1);
  }
}

// Run CLI
main();
