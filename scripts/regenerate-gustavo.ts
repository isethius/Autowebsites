/**
 * Regenerate Gustavo's Landscape Preview
 *
 * This script regenerates the preview for Gustavo's Landscape with:
 * - Multi-model AI support (Opus for templates, Haiku for personalization)
 * - Real business data from Nextdoor (logo, phone, reviews)
 * - 6 variations: 3 premium (Artisan, Agency, Creative) + 3 basic (Friendly, Modern, Bold)
 */

import { LeadWebsiteGenerator } from '../src/preview/lead-website-generator';
import { getOpenRouterClient } from '../src/ai/openrouter-client';
import { MODELS, selectModel } from '../src/ai/model-router';

interface GenerationMetrics {
  templateModel?: string;
  personalizationModel?: string;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
}

async function main() {
  console.log('Regenerating Gustavo\'s Landscape preview with multi-model AI...\n');

  const startTime = Date.now();
  const metrics: GenerationMetrics = {
    totalTokens: 0,
    estimatedCost: 0,
    latencyMs: 0,
  };

  // Check which backend to use
  const useOpenRouter = process.env.OPENROUTER_API_KEY !== undefined;
  const backend = useOpenRouter ? 'openrouter' : 'anthropic';

  console.log(`Backend: ${backend}`);
  if (useOpenRouter) {
    // Show model selection for content template task
    const templateSelection = selectModel({ type: 'content_template' });
    const personalizationSelection = selectModel({ type: 'content_personalization' });
    console.log(`Template model: ${templateSelection.model} (${templateSelection.reason})`);
    console.log(`Personalization model: ${personalizationSelection.model} (${personalizationSelection.reason})`);
    metrics.templateModel = templateSelection.model;
    metrics.personalizationModel = personalizationSelection.model;
  }
  console.log('');

  const generator = new LeadWebsiteGenerator({
    outputDir: 'tmp/autowebsites/previews',
    generateVariations: 6, // 3 premium + 3 basic
    tier: 'both',
    contentGeneratorConfig: {
      backend,
      // Use template creation task type for high-quality content
      taskType: 'content_template',
      trackModelUsage: true,
    },
  });

  const result = await generator.generate({
    leadId: 'gustavolandscaping',
    businessName: "Gustavo's Landscape",
    industry: 'landscaping',
    city: 'Tucson',
    state: 'AZ',
    // Real business data from Nextdoor
    nextdoorUrl: 'https://nextdoor.com/pages/gustavos-landscape-tucson-az/',
    fetchRealData: true,
    // Fallback contact info if scraping fails
    phone: '+1 (520) 278-3688',
  });

  metrics.latencyMs = Date.now() - startTime;

  // Get content generation result for model tracking
  const contentResult = generator.getLastContentResult();
  if (contentResult) {
    console.log('\nContent Generation Details:');
    console.log(`  Model used: ${contentResult.modelUsed || 'default'}`);
    console.log(`  Task type: ${contentResult.taskType || 'not specified'}`);
  }

  if (result.success) {
    console.log('\nPreview generated successfully!');
    console.log(`Location: ${result.local_path}`);
    console.log(`Variations: ${result.design_variations}`);
    console.log(`Files created: ${result.files_created.length}`);
    console.log(`Total time: ${(metrics.latencyMs / 1000).toFixed(2)}s`);

    // Save metrics to a JSON file for tracking
    const metricsPath = `${result.local_path}/generation-metrics.json`;
    const fs = await import('fs');
    fs.writeFileSync(metricsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backend,
      contentModel: contentResult?.modelUsed,
      taskType: contentResult?.taskType,
      latencyMs: metrics.latencyMs,
      variations: result.design_variations,
      filesCreated: result.files_created.length,
    }, null, 2));
    console.log(`Metrics saved: ${metricsPath}`);

    console.log('\nOpen in browser:');
    console.log(`  open ${result.local_path}/index.html`);
  } else {
    console.error('\nPreview generation failed:', result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Failed to regenerate preview:', error);
  process.exit(1);
});
