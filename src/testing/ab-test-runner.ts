/**
 * A/B Test Runner
 *
 * Orchestrates multi-model content generation tests.
 * Runs the same prompts against multiple models and collects metrics.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentGenerator } from '../preview/content-generator';
import { ModelId } from '../ai/model-router';
import { PreviewContent } from '../overnight/types';
import {
  ABTestConfig,
  ABTestResult,
  ABTestSummary,
  ModelRunResult,
} from './types';
import { scoreContent, createScoringConfig } from './quality-scorer';
import { logger } from '../utils/logger';

/**
 * A/B Test Runner
 */
export class ABTestRunner {
  private outputDir: string;

  constructor(outputDir: string = 'tmp/ab-tests') {
    this.outputDir = outputDir;
  }

  /**
   * Run an A/B test comparing multiple models
   */
  async run(config: ABTestConfig): Promise<ABTestResult> {
    const startTime = Date.now();
    const iterations = config.iterations ?? 1;
    const results: ModelRunResult[] = [];

    logger.info('Starting A/B test', {
      testId: config.testId,
      models: config.modelsToTest.length,
      iterations,
    });

    // Create scoring config from business input
    const scoringConfig = createScoringConfig(
      config.businessInput.industry,
      config.businessInput.city,
      config.businessInput.state
    );

    // Run each model
    for (const model of config.modelsToTest) {
      for (let iteration = 0; iteration < iterations; iteration++) {
        const runResult = await this.runModel(
          model,
          iteration,
          config,
          scoringConfig
        );
        results.push(runResult);

        logger.debug('Model run complete', {
          model,
          iteration,
          score: runResult.qualityScore,
          latencyMs: runResult.latencyMs,
        });

        // Small delay between runs to avoid rate limiting
        if (!config.parallel) {
          await this.sleep(1000);
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Calculate summary
    const summary = this.calculateSummary(results, config.modelsToTest);

    const testResult: ABTestResult = {
      testId: config.testId,
      timestamp: new Date().toISOString(),
      durationMs,
      businessInput: config.businessInput,
      results,
      summary,
    };

    logger.info('A/B test complete', {
      testId: config.testId,
      durationMs,
      bestQuality: summary.bestQuality,
      bestCost: summary.bestCost,
    });

    return testResult;
  }

  /**
   * Run a single model test
   */
  private async runModel(
    model: ModelId,
    iteration: number,
    config: ABTestConfig,
    scoringConfig: ReturnType<typeof createScoringConfig>
  ): Promise<ModelRunResult> {
    const generator = new ContentGenerator({
      backend: 'openrouter',
      modelOverride: model,
      trackModelUsage: true,
    });

    const startTime = Date.now();

    try {
      const result = await generator.generateWithTracking(config.businessInput);
      const latencyMs = Date.now() - startTime;
      const usage = generator.getUsage();

      // Score the content
      const { score, breakdown } = scoreContent(result.content, scoringConfig);

      return {
        model,
        iteration,
        content: result.content,
        usage,
        latencyMs,
        qualityScore: score,
        qualityBreakdown: breakdown,
        success: true,
      };
    } catch (error: any) {
      return {
        model,
        iteration,
        content: this.getEmptyContent(),
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0 },
        latencyMs: Date.now() - startTime,
        qualityScore: 0,
        qualityBreakdown: {
          headline: { score: 0, wordCount: 0, hasLocation: false, hasIndustryKeyword: false, isCompelling: false },
          services: { score: 0, count: 0, avgDescriptionLength: 0, hasRelevantServices: false },
          about: { score: 0, wordCount: 0, paragraphCount: 0, hasProfessionalTone: false },
          overall: 0,
        },
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate summary statistics from results
   */
  private calculateSummary(results: ModelRunResult[], models: ModelId[]): ABTestSummary {
    // Group results by model
    const byModel = new Map<ModelId, ModelRunResult[]>();
    for (const result of results) {
      const existing = byModel.get(result.model) || [];
      existing.push(result);
      byModel.set(result.model, existing);
    }

    // Calculate averages per model
    const modelStats = models.map(model => {
      const runs = byModel.get(model) || [];
      const successfulRuns = runs.filter(r => r.success);

      const avgQualityScore = successfulRuns.length > 0
        ? successfulRuns.reduce((sum, r) => sum + r.qualityScore, 0) / successfulRuns.length
        : 0;

      const avgCost = successfulRuns.length > 0
        ? successfulRuns.reduce((sum, r) => sum + r.usage.estimatedCost, 0) / successfulRuns.length
        : 0;

      const avgLatencyMs = successfulRuns.length > 0
        ? successfulRuns.reduce((sum, r) => sum + r.latencyMs, 0) / successfulRuns.length
        : 0;

      return { model, avgQualityScore, avgCost, avgLatencyMs };
    });

    // Sort and rank by quality
    const rankingByQuality = [...modelStats]
      .sort((a, b) => b.avgQualityScore - a.avgQualityScore)
      .map((stat, index) => ({
        model: stat.model,
        avgQualityScore: Math.round(stat.avgQualityScore * 100) / 100,
        rank: index + 1,
      }));

    // Sort and rank by cost (lower is better)
    const rankingByCost = [...modelStats]
      .sort((a, b) => a.avgCost - b.avgCost)
      .map((stat, index) => ({
        model: stat.model,
        avgCost: Math.round(stat.avgCost * 1000000) / 1000000,
        rank: index + 1,
      }));

    // Sort and rank by speed (lower is better)
    const rankingBySpeed = [...modelStats]
      .sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)
      .map((stat, index) => ({
        model: stat.model,
        avgLatencyMs: Math.round(stat.avgLatencyMs),
        rank: index + 1,
      }));

    // Calculate best overall (quality / cost ratio, with cost penalty)
    const bestOverallStats = modelStats
      .filter(s => s.avgCost > 0)
      .sort((a, b) => {
        const ratioA = a.avgQualityScore / (a.avgCost * 1000 + 0.001);
        const ratioB = b.avgQualityScore / (b.avgCost * 1000 + 0.001);
        return ratioB - ratioA;
      });

    return {
      rankingByQuality,
      rankingByCost,
      rankingBySpeed,
      bestOverall: bestOverallStats[0]?.model || models[0],
      bestQuality: rankingByQuality[0]?.model || models[0],
      bestCost: rankingByCost[0]?.model || models[0],
      bestSpeed: rankingBySpeed[0]?.model || models[0],
    };
  }

  /**
   * Save test results to disk
   */
  async saveResults(result: ABTestResult): Promise<string> {
    const testDir = path.join(this.outputDir, result.testId);
    fs.mkdirSync(testDir, { recursive: true });

    // Save full results as JSON
    const resultsPath = path.join(testDir, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));

    // Save summary as separate file
    const summaryPath = path.join(testDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(result.summary, null, 2));

    logger.info('Test results saved', { path: testDir });

    return testDir;
  }

  /**
   * Get empty content for failed runs
   */
  private getEmptyContent(): PreviewContent {
    return {
      headline: '',
      tagline: '',
      about: '',
      services: [],
      cta_text: '',
      contact_text: '',
      meta_description: '',
    };
  }

  /**
   * Sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
