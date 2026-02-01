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
import { sendEmail, verifyConnection } from './email/index';
import { startCampaign, processPendingFollowUps, getAllCampaignStatuses } from './email/drip-campaign';

// Scheduler modules
import { getQueue } from './scheduler/queue';
import { startScheduler, stopScheduler, configureRunner, runDiscovery, getRunnerStatus, registerHandlers } from './scheduler/pipeline-runner';

// Media modules
import { MediaGenerator, VideoGenerator, ThemeGridGenerator } from './media';

// New Pro modules
import { config, features } from './utils/config';
import { logger } from './utils/logger';
import { runHealthChecks, quickHealthCheck, getSystemInfo } from './utils/health';
import { getAutoWebsitesPro } from './index';
import { createDashboardServer } from './dashboard/server';

// Preflight module
import { runPreflight, runQuickCheck } from './preflight';

// Overnight modules
import { OvernightRunner, OvernightScheduler, loadOvernightConfig, getQuotas } from './overnight';
import type { IndustryType } from './ai/industry-templates';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════╗
║                   AUTOWEBSITES PRO CLI                       ║
╠══════════════════════════════════════════════════════════════╣
║  CAPTURE & ANALYZE:                                          ║
║    capture <url>        Screenshot + extract data            ║
║    score <url>          Score design/mobile/perf/seo         ║
║    generate <url>       Generate 10 theme variations         ║
║    template [cmd]      Generate website from template       ║
║    ai-analyze <url>     AI-powered website analysis          ║
║                                                              ║
║  DISCOVERY & OUTREACH:                                       ║
║    discover <query>     Find leads (e.g., "plumbers Austin") ║
║    send <lead-id>       Send outreach email to lead          ║
║    outreach <url>       Full outreach workflow               ║
║    media <lead-id>      Generate media assets for lead       ║
║    preview-grid <dir>   Generate theme preview grid image    ║
║                                                              ║
║  SALES PIPELINE:                                             ║
║    proposal <lead-id>   Generate PDF proposal                ║
║    contract <lead-id>   Generate contract                    ║
║    crm [action]         CRM operations (stats/timeline)      ║
║                                                              ║
║  AUTOMATION:                                                 ║
║    schedule [action]    Manage automated pipeline            ║
║    queue [action]       Manage job queue                     ║
║    overnight [action]   Overnight outreach automation        ║
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
║    preflight [options]  Pre-launch verification              ║
║    e2e-test <query>     Run full E2E test                    ║
║                                                              ║
║  Options:                                                    ║
║    --help, -h           Show this help                       ║
║    --debug              Show stack traces on errors          ║
║    --prod               Deploy to production                 ║
║    --save               Save results to database             ║
║    --email              Auto-send outreach email             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

// Global debug mode flag
let debugMode = false;

// Error handling helpers
interface ErrorSuggestion {
  pattern: RegExp;
  suggestion: string;
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
  { pattern: /ECONNREFUSED.*5432/i, suggestion: 'Database connection refused. Check if Supabase is configured correctly or allowlist your IP.' },
  { pattern: /invalid.*api.*key/i, suggestion: 'Invalid API key. Check your environment variables (ANTHROPIC_API_KEY, GOOGLE_PLACES_KEY, etc.)' },
  { pattern: /rate.*limit/i, suggestion: 'Rate limit exceeded. Wait a moment before retrying, or check your API quotas.' },
  { pattern: /SUPABASE/i, suggestion: 'Supabase connection issue. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correctly set.' },
  { pattern: /permission.*denied/i, suggestion: 'Permission denied. Check your database roles and row-level security policies.' },
  { pattern: /JWT/i, suggestion: 'JWT error. Check your JWT_SECRET configuration.' },
  { pattern: /timeout/i, suggestion: 'Request timeout. The service may be overloaded or unreachable.' },
  { pattern: /ANTHROPIC/i, suggestion: 'Anthropic API issue. Verify your ANTHROPIC_API_KEY and check the Anthropic status page.' },
  { pattern: /ENOTFOUND/i, suggestion: 'DNS resolution failed. Check your internet connection or the service URL.' },
  { pattern: /CERTIFICATE/i, suggestion: 'SSL certificate error. This may be a network issue or proxy configuration problem.' },
  { pattern: /ENOENT/i, suggestion: 'File or directory not found. Check that the path exists.' },
  { pattern: /EACCES/i, suggestion: 'Permission denied accessing file. Check file permissions.' },
];

function getSuggestion(error: Error): string | null {
  const message = error.message + (error.stack || '');
  for (const { pattern, suggestion } of ERROR_SUGGESTIONS) {
    if (pattern.test(message)) {
      return suggestion;
    }
  }
  return null;
}

function formatError(error: Error, context?: string): void {
  console.error('\n✗ Error:', error.message);
  if (context) {
    console.error('  Context:', context);
  }
  const suggestion = getSuggestion(error);
  if (suggestion) {
    console.error('\n💡 Suggestion:', suggestion);
  }
  if (debugMode && error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  } else if (!debugMode) {
    console.error('\n  Run with --debug for more details');
  }
  console.error('');
}

// Cleanup handlers
let cleanupFunctions: (() => Promise<void> | void)[] = [];

function registerCleanup(fn: () => Promise<void> | void): void {
  cleanupFunctions.push(fn);
}

async function runCleanup(): Promise<void> {
  for (const fn of cleanupFunctions) {
    try { await fn(); } catch { /* ignore */ }
  }
  cleanupFunctions = [];
}

// Graceful shutdown handlers
process.on('uncaughtException', async (error) => {
  await runCleanup();
  formatError(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  await runCleanup();
  const error = reason instanceof Error ? reason : new Error(String(reason));
  formatError(error, 'Unhandled promise rejection');
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);

  // Check for debug flag
  debugMode = args.includes('--debug');
  const filteredArgs = args.filter(a => a !== '--debug');

  // Show main help only if no command given, or if --help is the first arg
  if (filteredArgs.length === 0 || filteredArgs[0] === '--help' || filteredArgs[0] === '-h') {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const command = filteredArgs[0];

  try {
    switch (command) {
      case 'capture':
        await handleCapture(filteredArgs.slice(1));
        break;
      case 'generate':
        await handleGenerate(filteredArgs.slice(1));
        break;
      case 'deploy':
        await handleDeploy(filteredArgs.slice(1));
        break;
      case 'score':
        await handleScore(filteredArgs.slice(1));
        break;
      case 'leads':
        await handleLeads(filteredArgs.slice(1));
        break;
      case 'outreach':
        await handleOutreach(filteredArgs.slice(1));
        break;
      case 'serve':
        await handleServe(filteredArgs.slice(1));
        break;
      case 'pipeline':
        await handlePipeline(filteredArgs.slice(1));
        break;
      case 'discover':
        await handleDiscover(filteredArgs.slice(1));
        break;
      case 'send':
        await handleSend(filteredArgs.slice(1));
        break;
      case 'schedule':
        await handleSchedule(filteredArgs.slice(1));
        break;
      case 'queue':
        await handleQueue(filteredArgs.slice(1));
        break;
      case 'ai-analyze':
        await handleAIAnalyze(filteredArgs.slice(1));
        break;
      case 'proposal':
        await handleProposal(filteredArgs.slice(1));
        break;
      case 'contract':
        await handleContract(filteredArgs.slice(1));
        break;
      case 'dashboard':
        await handleDashboard(filteredArgs.slice(1));
        break;
      case 'health':
        await handleHealth(filteredArgs.slice(1));
        break;
      case 'template':
        await handleTemplate(filteredArgs.slice(1));
        break;
      case 'crm':
        await handleCRM(filteredArgs.slice(1));
        break;
      case 'e2e-test':
        await handleE2ETest(filteredArgs.slice(1));
        break;
      case 'preflight':
        await handlePreflight(filteredArgs.slice(1));
        break;
      case 'media':
        await handleMedia(filteredArgs.slice(1));
        break;
      case 'preview-grid':
        await handlePreviewGrid(filteredArgs.slice(1));
        break;
      case 'overnight':
        await handleOvernight(filteredArgs.slice(1));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  } catch (error: any) {
    formatError(error, command);
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

async function handleTemplate(args: string[]) {
  console.log('src/cli.ts: Template generation command executed');
  
  const subcommand = args[0];
  
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    console.log(`
Template Generation Commands:

  template generate <template-name> [options]
    Generate a website from a template
    
    Options:
      --output <dir>     Output directory (default: tmp/templates/<template-name>)
      --vars <file>      JSON file with template variables
      --list             List available templates
    
    Example:
      template generate professional-services --output ./my-site
      template generate professional-services --vars vars.json
    
  template list
    List all available templates
    
  template vars <template-name>
    Show required variables for a template
`);
    return;
  }
  
  if (subcommand === 'list') {
    const { getAvailableTemplates } = await import('./themes/template-loader');
    const templates = getAvailableTemplates();
    
    console.log('\n📋 Available Templates:\n');
    if (templates.length === 0) {
      console.log('  No templates found in templates/ directory\n');
    } else {
      for (const template of templates) {
        console.log(`  • ${template}`);
      }
      console.log('');
    }
    return;
  }
  
  if (subcommand === 'vars') {
    const templateName = args[1];
    if (!templateName) {
      throw new Error('Please provide a template name');
    }
    
    const { loadTemplate, getTemplateVariables } = await import('./themes/template-loader');
    const template = loadTemplate(templateName);
    const variables = getTemplateVariables(template);
    
    console.log(`\n📝 Variables for template "${templateName}":\n`);
    if (variables.length === 0) {
      console.log('  No variables found\n');
    } else {
      for (const variable of variables) {
        console.log(`  • {{${variable}}}`);
      }
      console.log('');
    }
    return;
  }
  
  if (subcommand === 'generate') {
    const templateName = args[1];
    if (!templateName) {
      throw new Error('Please provide a template name. Use "template list" to see available templates.');
    }
    
    // Parse options
    const outputIndex = args.indexOf('--output');
    const outputDir = outputIndex !== -1 && args[outputIndex + 1]
      ? args[outputIndex + 1]
      : `tmp/templates/${templateName}`;
    
    const varsIndex = args.indexOf('--vars');
    const varsFile = varsIndex !== -1 && args[varsIndex + 1]
      ? args[varsIndex + 1]
      : null;
    
    console.log(`\n🎨 Generating website from template: ${templateName}\n`);
    
    // Load template loader
    const {
      loadTemplate,
      populateTemplate,
      getTemplateVariables,
      validateTemplateVariables
    } = await import('./themes/template-loader');
    
    // Load template
    const template = loadTemplate(templateName);
    const requiredVars = getTemplateVariables(template);
    
    // Load variables
    let variables: Record<string, string | boolean | undefined> = {};
    
    if (varsFile) {
      if (!fs.existsSync(varsFile)) {
        throw new Error(`Variables file not found: ${varsFile}`);
      }
      const varsContent = fs.readFileSync(varsFile, 'utf-8');
      variables = JSON.parse(varsContent);
      console.log(`✓ Loaded variables from ${varsFile}`);
    } else {
      // Use defaults or prompt (for now, use defaults)
      console.log('⚠️  No variables file provided. Using defaults.');
      console.log('   Required variables:', requiredVars.join(', '));
      console.log('   Use --vars <file> to provide custom values\n');
      
      // Set some defaults
      variables = {
        BUSINESS_NAME: 'Your Business Name',
        TAGLINE: 'Professional Services',
        HERO_TITLE: 'SERVICES',
        CTA_TEXT: 'GET A FREE QUOTE',
        CURRENT_YEAR: new Date().getFullYear().toString(),
        LOGO_URL: '',
        CONTACT_EMAIL: 'info@example.com',
        CONTACT_PHONE: '+1 (555) 123-4567',
        CONTACT_ADDRESS: '123 Main St, City, State 12345',
        FOOTER_DESCRIPTION: 'Professional services you can trust.',
        SERVICE_1_TITLE: 'Service 1',
        SERVICE_1_DESCRIPTION: 'Description for service 1.',
        SERVICE_1_IMAGE: 'https://via.placeholder.com/800x600',
        SERVICE_1_ICON: '🔧',
        SERVICE_2_TITLE: 'Service 2',
        SERVICE_2_DESCRIPTION: 'Description for service 2.',
        SERVICE_2_IMAGE: 'https://via.placeholder.com/800x600',
        SERVICE_2_ICON: '🏗️',
        SERVICE_3_TITLE: 'Service 3',
        SERVICE_3_DESCRIPTION: 'Description for service 3.',
        SERVICE_3_IMAGE: 'https://via.placeholder.com/800x600',
        SERVICE_3_ICON: '✨',
        SERVICE_4_TITLE: 'Service 4',
        SERVICE_4_DESCRIPTION: 'Description for service 4.',
        SERVICE_4_IMAGE: 'https://via.placeholder.com/800x600',
        SERVICE_4_ICON: '🎨',
        HERO_BACKGROUND_IMAGE: 'https://via.placeholder.com/1920x1080'
      };
    }
    
    // Validate variables
    const validation = validateTemplateVariables(template, variables);
    if (validation.missing.length > 0) {
      console.log('⚠️  Missing variables:', validation.missing.join(', '));
    }
    if (validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        console.log('⚠️  ', warning);
      }
    }
    
    // Populate template
    const populated = populateTemplate(template, variables);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write output file
    const outputPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(outputPath, populated);
    
    console.log(`\n✓ Template generated successfully!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Run 'npx tsx src/cli.ts serve ${outputDir}' to preview\n`);
    return;
  }
  
  throw new Error(`Unknown template command: ${subcommand}. Use "template --help" for usage.`);
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
        from: process.env.GMAIL_FROM_EMAIL || 'test@example.com',
        subject: 'Test Email from AutoWebsites',
        text: 'This is a test email to verify your Gmail integration.',
        html: '<h1>Test Email</h1><p>Your email integration is working!</p>'
      });

      if (result.success) {
        console.log(`✅ Email sent! Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      break;
    }

    case 'verify': {
      console.log('\n🔑 Verifying Gmail connection...\n');
      const valid = await verifyConnection();
      if (valid) {
        console.log('✅ Gmail is connected');
      } else {
        console.log('❌ Gmail is not connected');
        console.log('   Run: npx tsx src/email/gmail-client.ts --auth');
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

  const { app, server } = await createDashboardServer({
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

async function handleMedia(args: string[]) {
  const action = args[0];

  if (!action) {
    console.log(`
📹 Media Generation Commands:

  media gif <lead-id> [gallery-dir]   Generate before/after GIF
  media video <lead-id> [gallery-dir] Generate gallery showcase video
  media test <before> <after>         Test GIF generation with images

Options:
  --width=800      Output width (default: 800)
  --height=600     Output height (default: 600)
  --upload         Upload to Supabase storage
`);
    return;
  }

  const { LeadModel } = await import('./crm/lead-model');

  switch (action) {
    case 'gif': {
      const leadId = args[1];
      const galleryDir = args[2];

      if (!leadId) {
        throw new Error('Please provide a lead ID');
      }

      console.log(`\n🎬 Generating before/after GIF for lead ${leadId}...\n`);

      const leadModel = new LeadModel();
      const lead = await leadModel.getById(leadId);

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      const width = parseInt(args.find(a => a.startsWith('--width='))?.split('=')[1] || '800', 10);
      const height = parseInt(args.find(a => a.startsWith('--height='))?.split('=')[1] || '600', 10);
      const upload = args.includes('--upload');

      const generator = new MediaGenerator({
        uploadToStorage: upload,
      });

      const resolvedGalleryDir = galleryDir || `tmp/autowebsites/themes`;

      if (!lead.screenshot_url) {
        throw new Error('Lead does not have a screenshot_url. Run capture first.');
      }

      const result = await generator.generateForLead({
        leadId,
        businessName: lead.business_name,
        beforeScreenshotUrl: lead.screenshot_url,
        galleryDir: resolvedGalleryDir,
        width,
        height,
      });

      console.log(`✅ Before/after GIF generated!`);
      console.log(`   Local path: ${result.beforeAfterGif?.localPath}`);
      console.log(`   Size: ${((result.beforeAfterGif?.result.fileSize || 0) / 1024).toFixed(1)}KB`);
      console.log(`   Frames: ${result.beforeAfterGif?.result.frameCount}`);

      if (result.beforeAfterGif?.url) {
        console.log(`   URL: ${result.beforeAfterGif.url}`);

        // Update lead with GIF URL
        await leadModel.update(leadId, {
          before_after_gif_url: result.beforeAfterGif.url,
        });
        console.log(`   Lead updated with GIF URL`);
      }
      break;
    }

    case 'video': {
      const leadId = args[1];
      const galleryDir = args[2];

      if (!leadId) {
        throw new Error('Please provide a lead ID');
      }

      console.log(`\n🎬 Generating gallery video for lead ${leadId}...\n`);

      const leadModel = new LeadModel();
      const lead = await leadModel.getById(leadId);

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      const width = parseInt(args.find(a => a.startsWith('--width='))?.split('=')[1] || '1920', 10);
      const height = parseInt(args.find(a => a.startsWith('--height='))?.split('=')[1] || '1080', 10);
      const upload = args.includes('--upload');

      const generator = new VideoGenerator({
        uploadToStorage: upload,
      });

      const resolvedGalleryDir = galleryDir || `tmp/autowebsites/themes`;

      const result = await generator.generateForLead(
        leadId,
        resolvedGalleryDir,
        lead.business_name,
        { width, height }
      );

      console.log(`✅ Gallery video generated!`);
      console.log(`   Video: ${result.result.videoPath}`);
      console.log(`   Thumbnail: ${result.result.thumbnailPath}`);
      console.log(`   Size: ${(result.result.fileSize / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`   Duration: ${result.result.duration}s`);

      if (result.videoUrl) {
        console.log(`   Video URL: ${result.videoUrl}`);
        console.log(`   Thumbnail URL: ${result.thumbnailUrl}`);

        // Update lead with video URLs
        await leadModel.update(leadId, {
          gallery_video_url: result.videoUrl,
          video_thumbnail_url: result.thumbnailUrl,
        });
        console.log(`   Lead updated with video URLs`);
      }
      break;
    }

    case 'test': {
      const beforePath = args[1];
      const afterPath = args[2];

      if (!beforePath || !afterPath) {
        throw new Error('Please provide before and after image paths');
      }

      console.log(`\n🧪 Testing GIF generation...\n`);

      const { BeforeAfterGenerator } = await import('./media');
      const generator = new BeforeAfterGenerator();

      const result = await generator.generate({
        beforeImagePath: beforePath,
        afterImagePath: afterPath,
      });

      console.log(`✅ Test GIF generated!`);
      console.log(`   Path: ${result.gifPath}`);
      console.log(`   Size: ${(result.fileSize / 1024).toFixed(1)}KB`);
      console.log(`   Dimensions: ${result.width}x${result.height}`);
      console.log(`   Frames: ${result.frameCount}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);
      break;
    }

    default:
      console.log(`Unknown media action: ${action}`);
      console.log('Available actions: gif, video, test');
  }
}

async function handlePreviewGrid(args: string[]) {
  const galleryDir = args[0];

  if (!galleryDir) {
    console.log(`
📸 Theme Preview Grid Generator

Usage:
  preview-grid <gallery-dir> [options]

Options:
  --business "Name"    Business name for the header
  --output <path>      Output path for the grid image
  --count <n>          Number of themes to include (default: 5)

Examples:
  preview-grid tmp/autowebsites/themes --business "Joe's Plumbing"
  preview-grid tmp/themes --business "Acme Corp" --output my-grid.png
`);
    return;
  }

  const businessIndex = args.indexOf('--business');
  const businessName = businessIndex !== -1 && args[businessIndex + 1]
    ? args[businessIndex + 1]
    : 'Your Business';

  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 && args[outputIndex + 1]
    ? args[outputIndex + 1]
    : undefined;

  const countIndex = args.indexOf('--count');
  const themeCount = countIndex !== -1 && args[countIndex + 1]
    ? parseInt(args[countIndex + 1], 10)
    : 5;

  console.log(`\n📸 Generating theme preview grid...\n`);
  console.log(`  Gallery: ${galleryDir}`);
  console.log(`  Business: ${businessName}`);
  console.log(`  Theme count: ${themeCount}`);

  const generator = new ThemeGridGenerator();

  const result = await generator.generateThemeGrid({
    galleryDir,
    businessName,
    themeCount,
    outputPath,
  });

  console.log(`\n✅ Theme grid generated!`);
  console.log(`   Path: ${result.gridPath}`);
  console.log(`   Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
  console.log(`   Dimensions: ${result.width}x${result.height}`);
  console.log(`   Themes: ${result.themeCount} (${result.themeNames.join(', ')})`);
  console.log(`\n   Open with: open ${result.gridPath}\n`);
}

async function handlePreflight(args: string[]) {
  const action = args[0];

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               PREFLIGHT CHECK OPTIONS                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Usage: npx tsx src/cli.ts preflight [options]               ║
║                                                              ║
║  Options:                                                    ║
║    --fix              Attempt auto-fixes for fixable issues  ║
║    --verbose          Show detailed output                   ║
║    --skip-optional    Skip optional service checks           ║
║    --test-email <addr> Send test email to verify Gmail       ║
║    --quick            Run only essential checks              ║
║                                                              ║
║  Examples:                                                   ║
║    npx tsx src/cli.ts preflight                              ║
║    npx tsx src/cli.ts preflight --verbose                    ║
║    npx tsx src/cli.ts preflight --test-email you@email.com   ║
║    npx tsx src/cli.ts preflight --fix                        ║
║    npx tsx src/cli.ts preflight --skip-optional              ║
║    npx tsx src/cli.ts preflight --quick                      ║
║                                                              ║
║  Categories checked:                                         ║
║    1. Environment    - .env, credentials, Node version       ║
║    2. Database       - Supabase connection, schema, CRUD     ║
║    3. Email          - Gmail OAuth, token, test send         ║
║    4. Discovery      - Google Places API                     ║
║    5. Capture        - Playwright, screenshots, scoring      ║
║    6. AI             - Anthropic API (optional)              ║
║    7. Themes         - Variance planner, generator, gallery  ║
║    8. Media          - Sharp, Canvas, GIF generation         ║
║    9. Composition    - MJML templates, email composer        ║
║   10. Pipeline       - Full dry-run integration test         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    return;
  }

  // Parse options
  const fix = args.includes('--fix');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const skipOptional = args.includes('--skip-optional');
  const quick = args.includes('--quick');

  // Find test email if provided
  const testEmailIndex = args.indexOf('--test-email');
  const testEmail = testEmailIndex !== -1 && args[testEmailIndex + 1]
    ? args[testEmailIndex + 1]
    : undefined;

  const options = {
    fix,
    verbose,
    skipOptional,
    testEmail,
  };

  // Run quick check or full preflight
  if (quick) {
    const success = await runQuickCheck(options);
    process.exit(success ? 0 : 1);
  } else {
    const { summary } = await runPreflight(options);
    process.exit(summary.success ? 0 : 1);
  }
}

async function handleOvernight(args: string[]) {
  const action = args[0];

  if (!action || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               OVERNIGHT OUTREACH SYSTEM                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Usage: npx tsx src/cli.ts overnight <action> [options]      ║
║                                                              ║
║  Actions:                                                    ║
║    start           Start scheduler (runs at configured hour) ║
║    run-once        Run single cycle immediately              ║
║    status          Show current run status and quotas        ║
║    logs            View recent run logs                      ║
║                                                              ║
║  Options for 'start':                                        ║
║    --industries <list>   Comma-separated industries          ║
║    --limit <n>           Max leads per run (default: 50)     ║
║    --hour <n>            Start hour (0-23, default: 2)       ║
║                                                              ║
║  Options for 'run-once':                                     ║
║    --industry <type>     Single industry to target           ║
║    --location <loc>      Location (e.g., "Tucson, AZ")       ║
║    --limit <n>           Max leads (default: 5)              ║
║    --dry-run             Generate previews but don't email   ║
║                                                              ║
║  Options for 'logs':                                         ║
║    --last                Show last run only                  ║
║    --limit <n>           Number of runs to show (default: 5) ║
║                                                              ║
║  Examples:                                                   ║
║    overnight start --industries therapist,plumber --limit 50 ║
║    overnight run-once --industry therapist --location "Tucson, AZ" --limit 5 ║
║    overnight run-once --dry-run --limit 2                    ║
║    overnight status                                          ║
║    overnight logs --last                                     ║
║                                                              ║
║  Supported Industries:                                       ║
║    therapist, plumber, hvac, gym, yoga                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    return;
  }

  switch (action) {
    case 'start': {
      await handleOvernightStart(args.slice(1));
      break;
    }

    case 'run-once': {
      await handleOvernightRunOnce(args.slice(1));
      break;
    }

    case 'status': {
      await handleOvernightStatus();
      break;
    }

    case 'logs': {
      await handleOvernightLogs(args.slice(1));
      break;
    }

    default:
      console.log(`Unknown overnight action: ${action}`);
      console.log('Available actions: start, run-once, status, logs');
  }
}

async function handleOvernightStart(args: string[]) {
  console.log(`\n🌙 Starting Overnight Outreach Scheduler...\n`);

  // Parse options
  const industriesIndex = args.indexOf('--industries');
  const industries = industriesIndex !== -1 && args[industriesIndex + 1]
    ? args[industriesIndex + 1].split(',').map(i => i.trim() as IndustryType)
    : undefined;

  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1], 10)
    : undefined;

  const hourIndex = args.indexOf('--hour');
  const hour = hourIndex !== -1 && args[hourIndex + 1]
    ? parseInt(args[hourIndex + 1], 10)
    : 2;

  // Load config with overrides
  const configOverrides = {
    ...(industries && { industries }),
    ...(limit && { maxLeads: limit }),
    runHours: { start: hour, end: hour + 4 },
  };

  const config = loadOvernightConfig(configOverrides);

  console.log('Configuration:');
  console.log(`  Industries: ${config.industries.join(', ')}`);
  console.log(`  Max leads per run: ${config.maxLeads}`);
  console.log(`  Max emails per run: ${config.maxEmails}`);
  console.log(`  Locations: ${config.locations.join(', ')}`);
  console.log(`  Run hours: ${config.runHours.start}:00 - ${config.runHours.end}:00`);
  console.log(`  Deploy previews: ${config.deployPreviews}`);
  console.log(`  Send emails: ${config.sendEmails}\n`);

  // Show quotas
  try {
    const quotas = await getQuotas();
    console.log('Current Quotas:');
    console.log(`  Gmail: ${quotas.gmail_remaining}/${quotas.gmail_daily_limit} remaining`);
    console.log(`  Vercel deployments today: ${quotas.vercel_deployed_today}`);
    console.log(`  Anthropic calls today: ${quotas.anthropic_calls_today}\n`);
  } catch (err) {
    console.log('(Could not fetch quotas - database may not be available)\n');
  }

  // Calculate cron expression for the specified hour
  const cronExpression = `0 ${hour} * * *`;

  // Create and start scheduler
  const scheduler = new OvernightScheduler({
    cronExpression,
    config: configOverrides,
  });
  scheduler.start();

  console.log(`⏰ Scheduler started. Will run daily at ${hour}:00 AM.`);
  console.log(`   Press Ctrl+C to stop.\n`);

  // Handle shutdown
  registerCleanup(() => {
    scheduler.stop();
  });

  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping scheduler...');
    scheduler.stop();
    await runCleanup();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

async function handleOvernightRunOnce(args: string[]) {
  console.log(`\n🚀 Running single overnight cycle...\n`);

  // Parse options
  const industryIndex = args.indexOf('--industry');
  const industry = industryIndex !== -1 && args[industryIndex + 1]
    ? args[industryIndex + 1] as IndustryType
    : undefined;

  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 && args[locationIndex + 1]
    ? args[locationIndex + 1]
    : undefined;

  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1], 10)
    : 5;

  const dryRun = args.includes('--dry-run');

  // Build config
  const baseConfig = loadOvernightConfig();
  const config = {
    ...baseConfig,
    ...(industry && { industries: [industry] }),
    ...(location && { locations: [location] }),
    maxLeads: limit,
    maxEmails: dryRun ? 0 : limit,
    sendEmails: !dryRun,
    deployPreviews: true,
  };

  console.log('Configuration:');
  console.log(`  Industries: ${config.industries.join(', ')}`);
  console.log(`  Locations: ${config.locations.join(', ')}`);
  console.log(`  Max leads: ${limit}`);
  console.log(`  Dry run: ${dryRun ? 'Yes (no emails)' : 'No'}\n`);

  // Run the overnight cycle
  const runner = new OvernightRunner(config);

  try {
    const result = await runner.execute();

    const startedAt = new Date(result.started_at);
    const completedAt = result.completed_at ? new Date(result.completed_at) : new Date();
    const durationMin = ((completedAt.getTime() - startedAt.getTime()) / 1000 / 60).toFixed(1);

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 RUN COMPLETE\n');
    console.log(`  Status: ${result.status}`);
    console.log(`  Duration: ${durationMin} minutes`);
    console.log(`\n  Statistics:`);
    console.log(`    Leads discovered: ${result.stats.leads_discovered}`);
    console.log(`    Leads qualified: ${result.stats.leads_qualified}`);
    console.log(`    Previews generated: ${result.stats.previews_generated}`);
    console.log(`    Previews deployed: ${result.stats.previews_deployed}`);
    console.log(`    Emails composed: ${result.stats.emails_composed}`);
    console.log(`    Emails sent: ${result.stats.emails_sent}`);
    console.log(`    Emails failed: ${result.stats.emails_failed}`);

    if (result.stats.by_industry && Object.keys(result.stats.by_industry).length > 0) {
      console.log(`\n  By Industry:`);
      for (const [ind, data] of Object.entries(result.stats.by_industry)) {
        const indData = data as { discovered: number; qualified: number; previews: number; emails: number };
        console.log(`    ${ind}: ${indData.discovered} discovered, ${indData.emails} emails`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`\n  Errors (${result.errors.length}):`);
      for (const err of result.errors.slice(0, 5)) {
        console.log(`    - ${err.phase}: ${err.message}`);
      }
      if (result.errors.length > 5) {
        console.log(`    ... and ${result.errors.length - 5} more`);
      }
    }

    console.log('\n' + '═'.repeat(60) + '\n');
  } catch (error: any) {
    console.error(`\n❌ Run failed: ${error.message}\n`);
    throw error;
  }
}

async function handleOvernightStatus() {
  console.log(`\n📊 Overnight Outreach Status\n`);

  // Show quotas
  try {
    const quotas = await getQuotas();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    console.log('Current Quotas:');
    console.log(`  Gmail: ${quotas.gmail_remaining}/${quotas.gmail_daily_limit} remaining (resets at midnight)`);
    console.log(`  Vercel deployments today: ${quotas.vercel_deployed_today}`);
    console.log(`  Anthropic calls today: ${quotas.anthropic_calls_today}`);
    console.log(`  Leads processed today: ${quotas.leads_processed_today}\n`);
  } catch (err) {
    console.log('(Could not fetch quotas - database may not be available)\n');
  }

  // Show config
  const config = loadOvernightConfig();
  console.log('Configuration:');
  console.log(`  Industries: ${config.industries.join(', ')}`);
  console.log(`  Locations: ${config.locations.join(', ')}`);
  console.log(`  Max leads: ${config.maxLeads}`);
  console.log(`  Max emails: ${config.maxEmails}`);
  console.log(`  Score threshold: <${config.websiteScoreThreshold}`);
  console.log(`  Run hours: ${config.runHours.start}:00 - ${config.runHours.end}:00\n`);

  // Try to get recent runs from database
  try {
    const { getSupabaseClient } = await import('./utils/supabase');
    const supabase = getSupabaseClient();

    const { data: runs, error } = await supabase
      .from('overnight_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && runs && runs.length > 0) {
      const lastRun = runs[0];
      console.log('Last Run:');
      console.log(`  Status: ${lastRun.status}`);
      console.log(`  Started: ${new Date(lastRun.started_at).toLocaleString()}`);
      if (lastRun.completed_at) {
        console.log(`  Completed: ${new Date(lastRun.completed_at).toLocaleString()}`);
      }
      console.log(`  Leads discovered: ${lastRun.stats?.leads_discovered || 0}`);
      console.log(`  Emails sent: ${lastRun.stats?.emails_sent || 0}\n`);
    }
  } catch (err) {
    console.log('(Database not available for run history)\n');
  }
}

async function handleOvernightLogs(args: string[]) {
  const showLast = args.includes('--last');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1], 10)
    : showLast ? 1 : 5;

  console.log(`\n📜 Overnight Run Logs\n`);

  try {
    const { getSupabaseClient } = await import('./utils/supabase');
    const supabase = getSupabaseClient();

    const { data: runs, error } = await supabase
      .from('overnight_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!runs || runs.length === 0) {
      console.log('No overnight runs found.\n');
      return;
    }

    for (const run of runs) {
      console.log('═'.repeat(60));
      console.log(`\nRun ID: ${run.id.slice(0, 8)}...`);
      console.log(`Status: ${run.status}`);
      console.log(`Started: ${new Date(run.started_at).toLocaleString()}`);
      if (run.completed_at) {
        const duration = (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000 / 60;
        console.log(`Completed: ${new Date(run.completed_at).toLocaleString()} (${duration.toFixed(1)} min)`);
      }

      console.log(`\nStatistics:`);
      console.log(`  Leads discovered: ${run.stats?.leads_discovered || 0}`);
      console.log(`  Leads qualified: ${run.stats?.leads_qualified || 0}`);
      console.log(`  Previews generated: ${run.stats?.previews_generated || 0}`);
      console.log(`  Previews deployed: ${run.stats?.previews_deployed || 0}`);
      console.log(`  Emails sent: ${run.stats?.emails_sent || 0}`);
      console.log(`  Emails failed: ${run.stats?.emails_failed || 0}`);

      if (run.config?.industries) {
        console.log(`\nConfiguration:`);
        console.log(`  Industries: ${run.config.industries.join(', ')}`);
        console.log(`  Locations: ${run.config.locations?.join(', ') || 'N/A'}`);
      }

      if (run.errors && run.errors.length > 0) {
        console.log(`\nErrors (${run.errors.length}):`);
        for (const err of run.errors.slice(0, 3)) {
          console.log(`  - [${err.phase}] ${err.message}`);
        }
        if (run.errors.length > 3) {
          console.log(`  ... and ${run.errors.length - 3} more`);
        }
      }

      console.log('');
    }

    console.log('═'.repeat(60) + '\n');
  } catch (err: any) {
    console.log(`Unable to fetch logs: ${err.message}`);
    console.log('Make sure the database migration has been run.\n');
  }
}

// Run CLI
main();
