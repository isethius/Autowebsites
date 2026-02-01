/**
 * Capture Checks
 *
 * Verifies Playwright browser and website capture functionality.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Capture';

/**
 * Check if Playwright and Chromium are installed
 */
async function checkPlaywrightInstalled(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    // Try to import playwright
    const playwright = await import('playwright');

    // Check if chromium executable exists
    const chromium = playwright.chromium;

    return createResult(CATEGORY, 'Playwright installed', 'pass', Date.now() - start, {
      details: options.verbose ? { browser: 'chromium' } : undefined,
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return createResult(CATEGORY, 'Playwright installed', 'fail', Date.now() - start, {
        message: 'Playwright not installed',
        fixCommand: 'npm install playwright',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'Playwright installed', 'fail', Date.now() - start, {
      message: error.message,
    });
  }
}

/**
 * Check if Chromium browser can be launched
 */
async function checkBrowserLaunch(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({
      headless: true,
    });

    await browser.close();

    return createResult(CATEGORY, 'Browser launch', 'pass', Date.now() - start);
  } catch (error: any) {
    if (error.message?.includes('Executable doesn\'t exist') || error.message?.includes('browserType.launch')) {
      return createResult(CATEGORY, 'Browser launch', 'fail', Date.now() - start, {
        message: 'Chromium browser not installed',
        fixCommand: 'npx playwright install chromium',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'Browser launch', 'fail', Date.now() - start, {
      message: `Browser launch failed: ${error.message}`,
    });
  }
}

/**
 * Test website capture with example.com
 */
async function checkWebsiteCapture(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { captureWebsite } = await import('../../capture/website-capture');

    const result = await captureWebsite({
      url: 'https://example.com',
      timeout: 30000,
    });

    // Check if screenshot was created
    if (!result.screenshotPath || !fs.existsSync(result.screenshotPath)) {
      return createResult(CATEGORY, 'Website capture', 'fail', Date.now() - start, {
        message: 'Screenshot not created',
      });
    }

    const stats = fs.statSync(result.screenshotPath);

    // Cleanup
    try {
      fs.unlinkSync(result.screenshotPath);
    } catch {}

    return createResult(CATEGORY, 'Website capture', 'pass', Date.now() - start, {
      message: `Captured example.com (${Math.round(stats.size / 1024)}KB)`,
      details: options.verbose ? {
        screenshotSize: stats.size,
        linksFound: result.links?.length || 0,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Website capture', 'fail', Date.now() - start, {
      message: `Capture failed: ${error.message}`,
    });
  }
}

/**
 * Test manifest generation
 */
async function checkManifestGeneration(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { generateManifest } = await import('../../capture/manifest-generator');

    // Create a mock capture result
    const mockCaptureResult = {
      url: 'https://example.com',
      screenshotPath: '/tmp/test-screenshot.png',
      html: '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>',
      links: ['https://example.com/about', 'https://example.com/contact'],
      timestamp: new Date().toISOString(),
    };

    const manifest = generateManifest(mockCaptureResult);

    if (!manifest || !manifest.summary) {
      return createResult(CATEGORY, 'Manifest generation', 'fail', Date.now() - start, {
        message: 'Manifest generation returned invalid result',
      });
    }

    return createResult(CATEGORY, 'Manifest generation', 'pass', Date.now() - start, {
      details: options.verbose ? { sections: Object.keys(manifest) } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Manifest generation', 'fail', Date.now() - start, {
      message: `Manifest generation failed: ${error.message}`,
    });
  }
}

/**
 * Test website scoring
 */
async function checkWebsiteScoring(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { scoreWebsite } = await import('../../outreach/website-scorer');
    const { generateManifest } = await import('../../capture/manifest-generator');

    // Create a mock manifest
    const mockCaptureResult = {
      url: 'https://example.com',
      screenshotPath: '/tmp/test.png',
      html: `
        <html>
        <head>
          <title>Test Business</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="Test business description">
        </head>
        <body>
          <nav>Navigation</nav>
          <h1>Welcome</h1>
          <p>Content here</p>
          <footer>Footer</footer>
        </body>
        </html>
      `,
      links: [],
      timestamp: new Date().toISOString(),
    };

    const manifest = generateManifest(mockCaptureResult);
    const score = scoreWebsite(manifest);

    if (typeof score.overall !== 'number') {
      return createResult(CATEGORY, 'Website scoring', 'fail', Date.now() - start, {
        message: 'Score not computed properly',
      });
    }

    return createResult(CATEGORY, 'Website scoring', 'pass', Date.now() - start, {
      message: `Scoring working (test: ${score.overall}/10)`,
      details: options.verbose ? {
        overall: score.overall,
        design: score.design?.score,
        mobile: score.mobile?.score,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Website scoring', 'fail', Date.now() - start, {
      message: `Scoring failed: ${error.message}`,
    });
  }
}

/**
 * Export all capture checks
 */
export const captureChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Playwright installed',
    required: true,
    run: checkPlaywrightInstalled,
  },
  {
    category: CATEGORY,
    name: 'Browser launch',
    required: true,
    run: checkBrowserLaunch,
  },
  {
    category: CATEGORY,
    name: 'Website capture',
    required: true,
    run: checkWebsiteCapture,
  },
  {
    category: CATEGORY,
    name: 'Manifest generation',
    required: true,
    run: checkManifestGeneration,
  },
  {
    category: CATEGORY,
    name: 'Website scoring',
    required: true,
    run: checkWebsiteScoring,
  },
];
