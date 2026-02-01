/**
 * Preflight Check Orchestrator
 *
 * Main entry point for running pre-launch verification.
 */

import { execSync } from 'child_process';
import {
  PreflightResult,
  PreflightOptions,
  PreflightSummary,
  PreflightCheck,
} from './types';
import {
  getAllChecks,
  getChecksByCategory,
  getRequiredChecks,
  CATEGORY_ORDER,
} from './checks';
import {
  printHeader,
  printCategoryResults,
  printSummary,
  printProgress,
  clearProgress,
  printWarning,
  printSuccess,
  printError,
  calculateSummary,
} from './reporter';

export { PreflightResult, PreflightOptions, PreflightSummary } from './types';

/**
 * Run all preflight checks
 */
export async function runPreflight(options: PreflightOptions = {}): Promise<{
  results: PreflightResult[];
  summary: PreflightSummary;
}> {
  const startTime = Date.now();
  const results: PreflightResult[] = [];

  // Print header
  printHeader();

  // Get all checks organized by category
  const checksByCategory = getChecksByCategory();
  const allChecks = getAllChecks();
  let currentIndex = 0;

  // Run checks category by category
  for (const category of CATEGORY_ORDER) {
    const categoryChecks = checksByCategory.get(category) || [];

    if (categoryChecks.length === 0) continue;

    // Run each check in the category
    for (const check of categoryChecks) {
      currentIndex++;

      // Show progress
      if (!options.verbose) {
        printProgress(currentIndex, allChecks.length, check.name);
      }

      try {
        const result = await check.run(options);
        results.push(result);

        // If fix flag is set and check failed with a fix command
        if (options.fix && result.status === 'fail' && result.fixable && result.fixCommand) {
          clearProgress();
          console.log(`  🔧 Attempting fix: ${result.fixCommand}`);

          try {
            execSync(result.fixCommand, { stdio: 'inherit' });
            printSuccess(`Fix applied. Re-running check...`);

            // Re-run the check
            const rerunResult = await check.run(options);
            results[results.length - 1] = rerunResult;

            if (rerunResult.status === 'pass') {
              printSuccess(`${check.name} now passing`);
            }
          } catch (fixError: any) {
            printError(`Fix failed: ${fixError.message}`);
          }
        }
      } catch (error: any) {
        results.push({
          category: check.category,
          name: check.name,
          status: 'fail',
          duration: 0,
          message: `Check threw error: ${error.message}`,
        });
      }
    }
  }

  // Clear progress line
  clearProgress();

  // Print results by category
  printCategoryResults(results, options.verbose);

  // Calculate and print summary
  const summary = calculateSummary(results, startTime);
  printSummary(summary);

  return { results, summary };
}

/**
 * Run only required checks
 */
export async function runRequiredChecks(options: PreflightOptions = {}): Promise<{
  results: PreflightResult[];
  summary: PreflightSummary;
}> {
  const startTime = Date.now();
  const results: PreflightResult[] = [];
  const requiredChecks = getRequiredChecks();

  printHeader();

  let currentIndex = 0;

  for (const check of requiredChecks) {
    currentIndex++;

    if (!options.verbose) {
      printProgress(currentIndex, requiredChecks.length, check.name);
    }

    try {
      const result = await check.run(options);
      results.push(result);
    } catch (error: any) {
      results.push({
        category: check.category,
        name: check.name,
        status: 'fail',
        duration: 0,
        message: `Check threw error: ${error.message}`,
      });
    }
  }

  clearProgress();
  printCategoryResults(results, options.verbose);

  const summary = calculateSummary(results, startTime);
  printSummary(summary);

  return { results, summary };
}

/**
 * Run checks for a specific category
 */
export async function runCategoryChecks(
  category: string,
  options: PreflightOptions = {}
): Promise<{
  results: PreflightResult[];
  summary: PreflightSummary;
}> {
  const startTime = Date.now();
  const results: PreflightResult[] = [];
  const checksByCategory = getChecksByCategory();
  const categoryChecks = checksByCategory.get(category) || [];

  if (categoryChecks.length === 0) {
    console.log(`No checks found for category: ${category}`);
    return {
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        warned: 0,
        duration: 0,
        success: true,
        nextSteps: [],
      },
    };
  }

  printHeader();

  for (const check of categoryChecks) {
    try {
      const result = await check.run(options);
      results.push(result);
    } catch (error: any) {
      results.push({
        category: check.category,
        name: check.name,
        status: 'fail',
        duration: 0,
        message: `Check threw error: ${error.message}`,
      });
    }
  }

  printCategoryResults(results, options.verbose);

  const summary = calculateSummary(results, startTime);
  printSummary(summary);

  return { results, summary };
}

/**
 * Quick check - only essential checks for fast validation
 */
export async function runQuickCheck(options: PreflightOptions = {}): Promise<boolean> {
  console.log('\n🔍 Running quick preflight check...\n');

  const essentialChecks = [
    'Environment',
    'Database',
    'Capture',
  ];

  const checksByCategory = getChecksByCategory();
  let allPassed = true;

  for (const category of essentialChecks) {
    const categoryChecks = checksByCategory.get(category) || [];
    const requiredInCategory = categoryChecks.filter(c => c.required);

    for (const check of requiredInCategory) {
      try {
        const result = await check.run(options);

        const icon = result.status === 'pass' ? '✅' :
                     result.status === 'fail' ? '❌' :
                     result.status === 'warn' ? '⚠️ ' : '⏭️ ';

        console.log(`  ${icon} ${check.name}`);

        if (result.status === 'fail') {
          allPassed = false;
          if (result.message) {
            console.log(`     ${result.message}`);
          }
        }
      } catch (error: any) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
        allPassed = false;
      }
    }
  }

  console.log();

  if (allPassed) {
    console.log('✅ Quick check passed - essential systems operational\n');
  } else {
    console.log('❌ Quick check failed - resolve issues before proceeding\n');
  }

  return allPassed;
}

/**
 * Export check utilities
 */
export {
  getAllChecks,
  getChecksByCategory,
  getRequiredChecks,
  CATEGORY_ORDER,
} from './checks';
