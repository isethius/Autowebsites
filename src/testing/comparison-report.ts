/**
 * Comparison Report Generator
 *
 * Generates human-readable markdown reports from A/B test results.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ABTestResult, ModelRunResult, ReportOptions } from './types';
import { ModelId } from '../ai/model-router';

/**
 * Generate a comparison report from A/B test results
 */
export function generateReport(result: ABTestResult, options: ReportOptions = {}): string {
  const format = options.format ?? 'markdown';

  switch (format) {
    case 'markdown':
      return generateMarkdownReport(result, options);
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'html':
      return generateHTMLReport(result, options);
    default:
      return generateMarkdownReport(result, options);
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(result: ABTestResult, options: ReportOptions): string {
  const lines: string[] = [];

  // Header
  lines.push(`# A/B Test Report: ${result.testId}`);
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push(`**Duration:** ${(result.durationMs / 1000).toFixed(2)}s`);
  lines.push(`**Business:** ${result.businessInput.businessName}`);
  lines.push(`**Industry:** ${result.businessInput.industry}`);
  lines.push(`**Location:** ${result.businessInput.city}, ${result.businessInput.state}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Best Model |`);
  lines.push(`|----------|------------|`);
  lines.push(`| Overall | \`${result.summary.bestOverall}\` |`);
  lines.push(`| Quality | \`${result.summary.bestQuality}\` |`);
  lines.push(`| Cost | \`${result.summary.bestCost}\` |`);
  lines.push(`| Speed | \`${result.summary.bestSpeed}\` |`);
  lines.push('');

  // Rankings
  lines.push('## Rankings');
  lines.push('');

  // Quality ranking
  lines.push('### By Quality Score');
  lines.push('');
  lines.push('| Rank | Model | Avg Score |');
  lines.push('|------|-------|-----------|');
  for (const item of result.summary.rankingByQuality) {
    lines.push(`| ${item.rank} | \`${item.model}\` | ${item.avgQualityScore} |`);
  }
  lines.push('');

  // Cost ranking
  lines.push('### By Cost');
  lines.push('');
  lines.push('| Rank | Model | Avg Cost |');
  lines.push('|------|-------|----------|');
  for (const item of result.summary.rankingByCost) {
    lines.push(`| ${item.rank} | \`${item.model}\` | $${item.avgCost.toFixed(6)} |`);
  }
  lines.push('');

  // Speed ranking
  lines.push('### By Speed');
  lines.push('');
  lines.push('| Rank | Model | Avg Latency |');
  lines.push('|------|-------|-------------|');
  for (const item of result.summary.rankingBySpeed) {
    lines.push(`| ${item.rank} | \`${item.model}\` | ${item.avgLatencyMs}ms |`);
  }
  lines.push('');

  // Detailed results
  lines.push('## Detailed Results');
  lines.push('');

  // Group by model
  const byModel = groupByModel(result.results);

  for (const [model, runs] of byModel) {
    lines.push(`### ${model}`);
    lines.push('');

    for (const run of runs) {
      if (runs.length > 1) {
        lines.push(`#### Iteration ${run.iteration + 1}`);
        lines.push('');
      }

      if (!run.success) {
        lines.push(`**Error:** ${run.error}`);
        lines.push('');
        continue;
      }

      lines.push('**Metrics:**');
      lines.push(`- Quality Score: **${run.qualityScore}**/100`);
      lines.push(`- Latency: ${run.latencyMs}ms`);
      lines.push(`- Tokens: ${run.usage.totalTokens} (${run.usage.inputTokens} in, ${run.usage.outputTokens} out)`);
      lines.push(`- Cost: $${run.usage.estimatedCost.toFixed(6)}`);
      lines.push('');

      lines.push('**Quality Breakdown:**');
      lines.push(`- Headline: ${run.qualityBreakdown.headline.score}/100`);
      lines.push(`  - Words: ${run.qualityBreakdown.headline.wordCount}`);
      lines.push(`  - Has location: ${run.qualityBreakdown.headline.hasLocation ? 'Yes' : 'No'}`);
      lines.push(`  - Has industry keyword: ${run.qualityBreakdown.headline.hasIndustryKeyword ? 'Yes' : 'No'}`);
      lines.push(`- Services: ${run.qualityBreakdown.services.score}/100`);
      lines.push(`  - Count: ${run.qualityBreakdown.services.count}`);
      lines.push(`  - Avg description length: ${run.qualityBreakdown.services.avgDescriptionLength}`);
      lines.push(`- About: ${run.qualityBreakdown.about.score}/100`);
      lines.push(`  - Words: ${run.qualityBreakdown.about.wordCount}`);
      lines.push(`  - Paragraphs: ${run.qualityBreakdown.about.paragraphCount}`);
      lines.push('');

      if (options.includeSampleContent) {
        lines.push('**Sample Content:**');
        lines.push('');
        lines.push('> **Headline:** ' + run.content.headline);
        lines.push('>');
        lines.push('> **Tagline:** ' + run.content.tagline);
        lines.push('');
      }
    }
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  const bestQuality = result.summary.rankingByQuality[0];
  const bestCost = result.summary.rankingByCost[0];
  const bestSpeed = result.summary.rankingBySpeed[0];

  if (bestQuality.model === bestCost.model) {
    lines.push(`**${bestQuality.model}** provides the best balance of quality and cost.`);
  } else {
    lines.push(`For **highest quality**, use \`${bestQuality.model}\` (score: ${bestQuality.avgQualityScore}).`);
    lines.push('');
    lines.push(`For **lowest cost**, use \`${bestCost.model}\` ($${bestCost.avgCost.toFixed(6)} per generation).`);
  }
  lines.push('');
  lines.push(`For **fastest generation**, use \`${bestSpeed.model}\` (${bestSpeed.avgLatencyMs}ms).`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Report generated by AutoWebsites A/B Testing Framework*`);

  return lines.join('\n');
}

/**
 * Generate HTML report
 */
function generateHTMLReport(result: ABTestResult, options: ReportOptions): string {
  // Simple HTML wrapper around markdown
  const markdown = generateMarkdownReport(result, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A/B Test Report: ${result.testId}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
  <style>
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    <pre>${escapeHtml(markdown)}</pre>
  </article>
</body>
</html>`;
}

/**
 * Save report to disk
 */
export function saveReport(
  result: ABTestResult,
  outputDir: string,
  options: ReportOptions = {}
): string {
  const format = options.format ?? 'markdown';
  const extension = format === 'markdown' ? 'md' : format;
  const filename = `report.${extension}`;
  const filepath = path.join(outputDir, filename);

  const content = generateReport(result, options);
  fs.writeFileSync(filepath, content);

  return filepath;
}

/**
 * Group results by model
 */
function groupByModel(results: ModelRunResult[]): Map<ModelId, ModelRunResult[]> {
  const byModel = new Map<ModelId, ModelRunResult[]>();

  for (const result of results) {
    const existing = byModel.get(result.model) || [];
    existing.push(result);
    byModel.set(result.model, existing);
  }

  return byModel;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}
