/**
 * Preflight Reporter
 *
 * Formats and displays preflight check results in a nice console format.
 */

import { PreflightResult, PreflightSummary, CategoryResults, NextStep } from './types';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Status icons and colors
const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  pass: { icon: '✅', color: colors.green },
  fail: { icon: '❌', color: colors.red },
  skip: { icon: '⏭️ ', color: colors.dim },
  warn: { icon: '⚠️ ', color: colors.yellow },
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  environment: '🔧',
  database: '💾',
  email: '📧',
  discovery: '🔍',
  capture: '📸',
  ai: '🤖',
  themes: '🎨',
  media: '🎬',
  composition: '📝',
  pipeline: '🚀',
};

const BOX_WIDTH = 62;

/**
 * Print the header box
 */
export function printHeader(): void {
  console.log();
  console.log('╔' + '═'.repeat(BOX_WIDTH) + '╗');
  console.log('║' + centerText('AUTOWEBSITES PRO PREFLIGHT CHECK', BOX_WIDTH) + '║');
  console.log('╠' + '═'.repeat(BOX_WIDTH) + '╣');
  console.log();
}

/**
 * Print category header
 */
export function printCategory(category: string): void {
  const icon = CATEGORY_ICONS[category.toLowerCase()] || '📋';
  const title = category.toUpperCase();
  console.log(`${icon} ${colors.bold}${title}${colors.reset}`);
}

/**
 * Print a single check result
 */
export function printResult(result: PreflightResult, verbose: boolean = false): void {
  const { icon, color } = STATUS_ICONS[result.status] || STATUS_ICONS.pass;
  const duration = formatDuration(result.duration);

  // Main line
  const name = result.name.padEnd(30);
  console.log(`  ${icon} ${name}${colors.dim}[${duration}]${colors.reset}`);

  // Message (if any and verbose or non-pass)
  if (result.message && (verbose || result.status !== 'pass')) {
    console.log(`     ${colors.dim}${result.message}${colors.reset}`);
  }

  // Fix command hint
  if (result.fixCommand && result.status === 'fail') {
    console.log(`     ${colors.cyan}Fix: ${result.fixCommand}${colors.reset}`);
  }

  // Details (verbose only)
  if (verbose && result.details) {
    for (const [key, value] of Object.entries(result.details)) {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      console.log(`     ${colors.dim}${key}: ${displayValue}${colors.reset}`);
    }
  }
}

/**
 * Print results grouped by category
 */
export function printCategoryResults(results: PreflightResult[], verbose: boolean = false): void {
  // Group by category
  const grouped = new Map<string, PreflightResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.category) || [];
    existing.push(result);
    grouped.set(result.category, existing);
  }

  // Print each category
  for (const [category, categoryResults] of grouped) {
    printCategory(category);
    for (const result of categoryResults) {
      printResult(result, verbose);
    }
    console.log();
  }
}

/**
 * Print the summary footer
 */
export function printSummary(summary: PreflightSummary): void {
  console.log('╠' + '═'.repeat(BOX_WIDTH) + '╣');

  // Stats line
  const statsLine = `  Total: ${summary.total}   ` +
    `${colors.green}Passed: ${summary.passed}${colors.reset}   ` +
    `${colors.red}Failed: ${summary.failed}${colors.reset}   ` +
    `${colors.dim}Skipped: ${summary.skipped}${colors.reset}   ` +
    `${colors.yellow}Warn: ${summary.warned}${colors.reset}`;
  console.log('║' + padRight(statsLine, BOX_WIDTH + 40) + '║'); // Extra for color codes

  // Duration
  const durationLine = `  Duration: ${formatDuration(summary.duration)}`;
  console.log('║' + padRight(durationLine, BOX_WIDTH) + '║');

  // Next steps
  if (summary.nextSteps.length > 0) {
    console.log('╠' + '═'.repeat(BOX_WIDTH) + '╣');
    console.log('║' + padRight('  NEXT STEPS:', BOX_WIDTH) + '║');

    for (let i = 0; i < summary.nextSteps.length && i < 10; i++) {
      const step = summary.nextSteps[i];
      const icon = step.type === 'error' ? '❌' : '⚠️ ';
      const line = `  ${i + 1}. ${icon} ${step.message}`;

      // Truncate if too long
      const truncated = line.length > BOX_WIDTH - 2 ? line.slice(0, BOX_WIDTH - 5) + '...' : line;
      console.log('║' + padRight(truncated, BOX_WIDTH) + '║');

      if (step.fixCommand) {
        const fixLine = `     Run: ${step.fixCommand}`;
        const truncatedFix = fixLine.length > BOX_WIDTH - 2 ? fixLine.slice(0, BOX_WIDTH - 5) + '...' : fixLine;
        console.log('║' + padRight(truncatedFix, BOX_WIDTH) + '║');
      }
    }

    if (summary.nextSteps.length > 10) {
      console.log('║' + padRight(`  ... and ${summary.nextSteps.length - 10} more`, BOX_WIDTH) + '║');
    }
  }

  console.log('╚' + '═'.repeat(BOX_WIDTH) + '╝');

  // Final status message
  console.log();
  if (summary.success) {
    console.log(`${colors.green}${colors.bold}✅ All required checks passed!${colors.reset}`);
    console.log(`${colors.dim}Your system is ready for launch.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Some required checks failed.${colors.reset}`);
    console.log(`${colors.dim}Please resolve the issues above before going live.${colors.reset}`);
  }
  console.log();
}

/**
 * Print progress indicator
 */
export function printProgress(current: number, total: number, name: string): void {
  const percent = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  process.stdout.write(`\r  [${bar}] ${percent}% - ${name.padEnd(30)}`);
}

/**
 * Clear progress line
 */
export function clearProgress(): void {
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
}

/**
 * Print verbose details for a check
 */
export function printVerbose(message: string): void {
  console.log(`  ${colors.dim}${message}${colors.reset}`);
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
  console.log(`  ${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.log(`  ${colors.red}❌ ${message}${colors.reset}`);
}

/**
 * Print a success message
 */
export function printSuccess(message: string): void {
  console.log(`  ${colors.green}✅ ${message}${colors.reset}`);
}

/**
 * Calculate summary from results
 */
export function calculateSummary(results: PreflightResult[], startTime: number): PreflightSummary {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const warned = results.filter(r => r.status === 'warn').length;

  // Collect next steps from failed and warned results
  const nextSteps: NextStep[] = [];

  for (const result of results) {
    if (result.status === 'fail') {
      nextSteps.push({
        type: 'error',
        message: result.message || `Fix ${result.name}`,
        fixCommand: result.fixCommand,
      });
    } else if (result.status === 'warn') {
      nextSteps.push({
        type: 'warning',
        message: result.message || `Address ${result.name}`,
        fixCommand: result.fixCommand,
      });
    }
  }

  return {
    total: results.length,
    passed,
    failed,
    skipped,
    warned,
    duration: Date.now() - startTime,
    success: failed === 0,
    nextSteps,
  };
}

// Helper functions
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
}

function padRight(text: string, width: number): string {
  // Strip ANSI codes for length calculation
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  const extraChars = text.length - stripped.length;
  return text + ' '.repeat(Math.max(0, width - stripped.length));
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
