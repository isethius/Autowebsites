/**
 * Run Model A/B Test
 *
 * CLI script for running A/B tests comparing different AI models
 * for content generation quality, cost, and speed.
 *
 * Usage:
 *   npx tsx scripts/run-model-ab-test.ts [options]
 *
 * Options:
 *   --test-id <id>     Test identifier (default: gustavo-landscape-comparison)
 *   --iterations <n>   Number of iterations per model (default: 1)
 *   --models <list>    Comma-separated list of models to test
 *   --sample-content   Include sample content in report
 */

import { ABTestRunner, generateReport, saveReport } from '../src/testing';
import { MODELS, ModelId } from '../src/ai/model-router';
import { IndustryType } from '../src/ai/industry-templates';

interface TestOptions {
  testId: string;
  iterations: number;
  models: ModelId[];
  includeSampleContent: boolean;
}

function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    testId: 'gustavo-landscape-comparison',
    iterations: 1,
    models: [
      MODELS['claude-opus'],
      MODELS['claude-sonnet'],
      MODELS['claude-haiku'],
      MODELS['gemini-flash'],
    ],
    includeSampleContent: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--test-id':
        options.testId = args[++i];
        break;
      case '--iterations':
        options.iterations = parseInt(args[++i], 10);
        break;
      case '--models':
        options.models = args[++i].split(',') as ModelId[];
        break;
      case '--sample-content':
        options.includeSampleContent = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Run Model A/B Test

Usage:
  npx tsx scripts/run-model-ab-test.ts [options]

Options:
  --test-id <id>     Test identifier (default: gustavo-landscape-comparison)
  --iterations <n>   Number of iterations per model (default: 1)
  --models <list>    Comma-separated list of model IDs
  --sample-content   Include sample content in report
  --help             Show this help message

Available Models:
${Object.entries(MODELS).map(([key, id]) => `  ${key}: ${id}`).join('\n')}

Examples:
  # Run with default settings (all models, 1 iteration)
  npx tsx scripts/run-model-ab-test.ts

  # Run with 3 iterations for more accurate results
  npx tsx scripts/run-model-ab-test.ts --iterations 3

  # Test only Claude models
  npx tsx scripts/run-model-ab-test.ts --models anthropic/claude-3-opus,anthropic/claude-3.5-sonnet,anthropic/claude-3-haiku

  # Custom test ID with sample content
  npx tsx scripts/run-model-ab-test.ts --test-id my-test --sample-content
`);
}

async function main() {
  const options = parseArgs();

  console.log('======================================');
  console.log('       Model A/B Test Runner');
  console.log('======================================');
  console.log('');
  console.log(`Test ID: ${options.testId}`);
  console.log(`Models: ${options.models.length}`);
  console.log(`Iterations: ${options.iterations}`);
  console.log('');

  // Check for OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('Error: OPENROUTER_API_KEY environment variable is required');
    console.error('Set it with: export OPENROUTER_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log('Models to test:');
  for (const model of options.models) {
    console.log(`  - ${model}`);
  }
  console.log('');

  // Create test runner
  const runner = new ABTestRunner('tmp/ab-tests');

  // Run the test
  console.log('Starting test...\n');

  const result = await runner.run({
    testId: options.testId,
    businessInput: {
      businessName: "Gustavo's Landscape",
      industry: 'landscaping' as IndustryType,
      city: 'Tucson',
      state: 'AZ',
      services: [
        'Landscape Design',
        'Lawn Maintenance',
        'Irrigation Systems',
        'Tree Trimming',
      ],
    },
    modelsToTest: options.models,
    iterations: options.iterations,
  });

  // Save results
  const testDir = await runner.saveResults(result);

  // Generate and save report
  const reportPath = saveReport(result, testDir, {
    format: 'markdown',
    includeSampleContent: options.includeSampleContent,
  });

  // Print summary
  console.log('\n======================================');
  console.log('              Results');
  console.log('======================================\n');

  console.log('Rankings by Quality:');
  for (const item of result.summary.rankingByQuality) {
    const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '  ';
    console.log(`  ${medal} ${item.rank}. ${item.model} - Score: ${item.avgQualityScore}`);
  }
  console.log('');

  console.log('Rankings by Cost:');
  for (const item of result.summary.rankingByCost) {
    const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '  ';
    console.log(`  ${medal} ${item.rank}. ${item.model} - $${item.avgCost.toFixed(6)}`);
  }
  console.log('');

  console.log('Rankings by Speed:');
  for (const item of result.summary.rankingBySpeed) {
    const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '  ';
    console.log(`  ${medal} ${item.rank}. ${item.model} - ${item.avgLatencyMs}ms`);
  }
  console.log('');

  console.log('Best Overall:');
  console.log(`  Quality: ${result.summary.bestQuality}`);
  console.log(`  Cost: ${result.summary.bestCost}`);
  console.log(`  Speed: ${result.summary.bestSpeed}`);
  console.log(`  Overall: ${result.summary.bestOverall}`);
  console.log('');

  console.log(`Test duration: ${(result.durationMs / 1000).toFixed(2)}s`);
  console.log('');

  console.log('Output files:');
  console.log(`  Results: ${testDir}/results.json`);
  console.log(`  Summary: ${testDir}/summary.json`);
  console.log(`  Report: ${reportPath}`);
  console.log('');

  console.log('To view the report:');
  console.log(`  cat ${reportPath}`);
}

main().catch((error) => {
  console.error('A/B test failed:', error);
  process.exit(1);
});
