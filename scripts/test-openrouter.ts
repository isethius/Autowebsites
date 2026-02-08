#!/usr/bin/env npx tsx
/**
 * Test OpenRouter integration with Gustavo's Landscaping
 *
 * Usage: npx tsx scripts/test-openrouter.ts
 */

import 'dotenv/config';
import { getOpenRouterClient } from '../src/ai/openrouter-client';
import { selectModel, MODELS, estimateSavings, ContentTask } from '../src/ai/model-router';

const GUSTAVO_BUSINESS = {
  name: "Gustavo's Landscape",
  phone: "(520) 278-3688",
  location: "Tucson, AZ",
  industry: "Landscaping",
  services: ["Lawn Care", "Irrigation", "Desert Landscaping", "Maintenance"],
};

async function testOpenRouter() {
  console.log("🚀 Testing OpenRouter Integration\n");
  console.log("=" .repeat(60));

  // Test 1: Model Selection Logic
  console.log("\n📊 Model Selection Test\n");

  const tasks: ContentTask[] = [
    { type: 'template_creation', complexity: 'high' },
    { type: 'personalization' },
    { type: 'seo_optimization' },
    { type: 'copy_generation' },
    { type: 'simple_task' },
  ];

  for (const task of tasks) {
    const selection = selectModel(task);
    console.log(`  ${task.type} (${task.complexity || 'medium'}):`);
    console.log(`    → ${selection.model}`);
    console.log(`    → ${selection.reason}`);
    console.log(`    → $${selection.estimatedCostPer1K.toFixed(4)}/1K requests\n`);
  }

  // Cost savings estimate
  const savings = estimateSavings(tasks);
  console.log("💰 Cost Comparison (for these 5 tasks × 1000 runs):");
  console.log(`  Optimized: $${savings.optimizedCost.toFixed(2)}`);
  console.log(`  Sonnet-only: $${savings.sonnetOnlyCost.toFixed(2)}`);
  console.log(`  Savings: $${savings.savings.toFixed(2)} (${savings.savingsPercent}%)\n`);

  // Test 2: Actual API Call
  console.log("=" .repeat(60));
  console.log("\n🔌 Testing OpenRouter API Connection\n");

  try {
    const client = getOpenRouterClient();

    // Test with Haiku (fast & cheap) for personalization
    console.log("Test 1: Personalization with Claude Haiku");
    console.log("-".repeat(40));

    const personalizationResult = await client.complete(
      `Generate a short, compelling tagline (max 10 words) for this landscaping business:

Business: ${GUSTAVO_BUSINESS.name}
Location: ${GUSTAVO_BUSINESS.location}
Services: ${GUSTAVO_BUSINESS.services.join(", ")}

Return ONLY the tagline, nothing else.`,
      {
        model: MODELS['claude-haiku'],
        maxTokens: 50,
        temperature: 0.8,
      }
    );

    console.log(`  Model: ${personalizationResult.model}`);
    console.log(`  Tagline: "${personalizationResult.content.trim()}"`);
    console.log(`  Tokens: ${personalizationResult.usage.totalTokens}`);
    console.log(`  Cost: $${personalizationResult.usage.estimatedCost.toFixed(6)}\n`);

    // Test with Gemini Flash for SEO
    console.log("Test 2: SEO Meta Description with Gemini Flash");
    console.log("-".repeat(40));

    const seoResult = await client.complete(
      `Write a meta description (max 155 characters) for:

Business: ${GUSTAVO_BUSINESS.name}
Location: ${GUSTAVO_BUSINESS.location}
Phone: ${GUSTAVO_BUSINESS.phone}

Return ONLY the meta description, nothing else.`,
      {
        model: MODELS['gemini-flash'],
        maxTokens: 100,
        temperature: 0.5,
      }
    );

    console.log(`  Model: ${seoResult.model}`);
    console.log(`  Meta: "${seoResult.content.trim()}"`);
    console.log(`  Tokens: ${seoResult.usage.totalTokens}`);
    console.log(`  Cost: $${seoResult.usage.estimatedCost.toFixed(6)}\n`);

    // Test with Sonnet for copy generation
    console.log("Test 3: Hero Copy with Claude Sonnet");
    console.log("-".repeat(40));

    const copyResult = await client.complete(
      `Write a hero section headline and subheadline for:

Business: ${GUSTAVO_BUSINESS.name}
Location: ${GUSTAVO_BUSINESS.location}
Services: ${GUSTAVO_BUSINESS.services.join(", ")}

Format:
HEADLINE: [compelling headline, max 8 words]
SUBHEADLINE: [supporting text, max 20 words]`,
      {
        model: MODELS['claude-sonnet'],
        maxTokens: 150,
        temperature: 0.7,
      }
    );

    console.log(`  Model: ${copyResult.model}`);
    console.log(`  Output:\n${copyResult.content.trim().split('\n').map(l => `    ${l}`).join('\n')}`);
    console.log(`  Tokens: ${copyResult.usage.totalTokens}`);
    console.log(`  Cost: $${copyResult.usage.estimatedCost.toFixed(6)}\n`);

    // Summary
    const totalUsage = client.getTotalUsage();
    console.log("=" .repeat(60));
    console.log("\n📈 Total Usage Summary\n");
    console.log(`  Total Tokens: ${totalUsage.totalTokens}`);
    console.log(`  Total Cost: $${totalUsage.estimatedCost.toFixed(6)}`);
    console.log(`  Input Tokens: ${totalUsage.inputTokens}`);
    console.log(`  Output Tokens: ${totalUsage.outputTokens}`);

    console.log("\n✅ OpenRouter integration working correctly!\n");

  } catch (error: any) {
    console.error("❌ Error testing OpenRouter:", error.message);

    if (error.message.includes('OPENROUTER_API_KEY')) {
      console.log("\n💡 Make sure OPENROUTER_API_KEY is set in your .env file");
      console.log("   Get your key at: https://openrouter.ai/keys");
    }

    process.exit(1);
  }
}

testOpenRouter();
