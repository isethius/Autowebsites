/**
 * Pipeline Checks
 *
 * Full dry-run test: lead → capture → themes → email composition.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseClient } from '../../utils/supabase';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Pipeline';

/**
 * Full pipeline dry-run test
 */
async function checkFullPipeline(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();
  const cleanup: (() => Promise<void> | void)[] = [];
  let testLeadId: string | null = null;
  const tempDir = path.join('/tmp', `preflight-pipeline-${Date.now()}`);

  try {
    // Setup temp directory
    fs.mkdirSync(tempDir, { recursive: true });
    cleanup.push(() => fs.rmSync(tempDir, { recursive: true, force: true }));

    // Step 1: Create test lead in database
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch {
      return createResult(CATEGORY, 'Full pipeline', 'skip', Date.now() - start, {
        message: 'Database not configured',
      });
    }

    const testUrl = `https://preflight-test-${Date.now()}.example.com`;

    const { data: lead, error: createError } = await supabase
      .from('leads')
      .insert({
        business_name: 'Preflight Pipeline Test',
        website_url: testUrl,
        industry: 'other',
        pipeline_stage: 'new',
        country: 'US',
        priority: 'low',
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        tags: ['preflight-test'],
        custom_fields: { test: true },
        is_unsubscribed: false,
        decision_maker: false,
      })
      .select()
      .single();

    if (createError) {
      return createResult(CATEGORY, 'Full pipeline', 'fail', Date.now() - start, {
        message: `Failed to create test lead: ${createError.message}`,
      });
    }

    testLeadId = lead.id;
    cleanup.push(async () => {
      if (testLeadId) {
        await supabase.from('leads').delete().eq('id', testLeadId);
      }
    });

    // Step 2: Capture website (using example.com)
    const { captureWebsite } = await import('../../capture/website-capture');
    const { generateManifest } = await import('../../capture/manifest-generator');

    const captureResult = await captureWebsite({
      url: 'https://example.com',
      timeout: 30000,
    });

    if (captureResult.screenshotPath && fs.existsSync(captureResult.screenshotPath)) {
      cleanup.push(() => {
        try {
          if (captureResult.screenshotPath) {
            fs.unlinkSync(captureResult.screenshotPath);
          }
        } catch {}
      });
    }

    const manifest = generateManifest(captureResult);

    // Step 3: Score website
    const { scoreWebsite } = await import('../../outreach/website-scorer');
    const score = scoreWebsite(manifest);

    // Step 4: Generate themes
    const { generateUniqueVariances } = await import('../../themes/variance-planner');
    const { generateThemes } = await import('../../themes/theme-generator');
    const { generateGallery } = await import('../../themes/gallery-generator');

    const variances = generateUniqueVariances(3);
    const themes = generateThemes(manifest, variances);
    const galleryPath = generateGallery(themes, {
      outputDir: tempDir,
      title: 'Preflight Test',
      originalUrl: 'https://example.com',
    });

    // Step 5: Generate outreach email
    const { generateEmail } = await import('../../outreach/email-generator');
    const email = generateEmail({
      lead: lead as any,
      score,
      previewUrl: `file://${galleryPath}`,
    });

    // Step 6: Update lead with results
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        website_score: score.overall,
        screenshot_url: captureResult.screenshotPath,
        gallery_url: galleryPath,
      })
      .eq('id', testLeadId);

    if (updateError) {
      return createResult(CATEGORY, 'Full pipeline', 'warn', Date.now() - start, {
        message: 'Pipeline completed but failed to update lead',
        details: { error: updateError.message },
      });
    }

    // Collect metrics
    const pipelineMetrics = {
      captureTime: 'completed',
      manifestSections: Object.keys(manifest).length,
      score: score.overall,
      themesGenerated: themes.length,
      emailGenerated: !!email.subject,
      totalDuration: Date.now() - start,
    };

    return createResult(CATEGORY, 'Full pipeline', 'pass', Date.now() - start, {
      message: `Pipeline complete (score: ${score.overall}/10, ${themes.length} themes)`,
      details: options.verbose ? pipelineMetrics : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Full pipeline', 'fail', Date.now() - start, {
      message: `Pipeline failed: ${error.message}`,
    });
  } finally {
    // Run cleanup in reverse order
    for (const cleanupFn of cleanup.reverse()) {
      try {
        await cleanupFn();
      } catch {}
    }
  }
}

/**
 * Test lead database integration
 */
async function checkLeadDatabaseIntegration(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { LeadModel } = await import('../../crm/lead-model');

    const leadModel = new LeadModel();

    // Test getStats
    const stats = await leadModel.getStats();

    return createResult(CATEGORY, 'Lead model integration', 'pass', Date.now() - start, {
      message: `${stats.total} leads, avg score ${stats.avg_website_score || 'N/A'}`,
      details: options.verbose ? {
        total: stats.total,
        byStage: stats.by_stage,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Lead model integration', 'fail', Date.now() - start, {
      message: `Lead model failed: ${error.message}`,
    });
  }
}

/**
 * Test orchestrator initialization
 */
async function checkOrchestratorInit(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { getAutoWebsitesPro } = await import('../../index');

    const app = getAutoWebsitesPro();

    // Initialize without starting services
    await app.initialize({
      startDashboard: false,
      startWorker: false,
    });

    // Shutdown
    await app.shutdown();

    return createResult(CATEGORY, 'Orchestrator init', 'pass', Date.now() - start, {
      message: 'Orchestrator initialized and shutdown successfully',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Orchestrator init', 'fail', Date.now() - start, {
      message: `Orchestrator init failed: ${error.message}`,
    });
  }
}

/**
 * Test queue system
 */
async function checkQueueSystem(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { getQueue } = await import('../../scheduler/queue');

    const queue = getQueue();
    const stats = queue.getStats();

    return createResult(CATEGORY, 'Queue system', 'pass', Date.now() - start, {
      message: `Queue has ${stats.total} jobs`,
      details: options.verbose ? stats : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Queue system', 'fail', Date.now() - start, {
      message: `Queue check failed: ${error.message}`,
    });
  }
}

/**
 * Export all pipeline checks
 */
export const pipelineChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Full pipeline',
    required: true,
    run: checkFullPipeline,
  },
  {
    category: CATEGORY,
    name: 'Lead model integration',
    required: true,
    run: checkLeadDatabaseIntegration,
  },
  {
    category: CATEGORY,
    name: 'Orchestrator init',
    required: true,
    run: checkOrchestratorInit,
  },
  {
    category: CATEGORY,
    name: 'Queue system',
    required: true,
    run: checkQueueSystem,
  },
];
