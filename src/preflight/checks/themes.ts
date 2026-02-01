/**
 * Themes Checks
 *
 * Verifies theme variance planning, generation, and gallery creation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Themes';

/**
 * Check variance planner
 */
async function checkVariancePlanner(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { generateUniqueVariances } = await import('../../themes/variance-planner');

    const variances = generateUniqueVariances(3);

    if (!variances || variances.length !== 3) {
      return createResult(CATEGORY, 'Variance planner', 'fail', Date.now() - start, {
        message: 'Did not generate expected number of variances',
      });
    }

    // Check variance structure
    const firstVariance = variances[0];
    if (!firstVariance.dna || !firstVariance.dna.hero || !firstVariance.dna.color) {
      return createResult(CATEGORY, 'Variance planner', 'fail', Date.now() - start, {
        message: 'Variance structure is invalid',
      });
    }

    return createResult(CATEGORY, 'Variance planner', 'pass', Date.now() - start, {
      message: `Generated ${variances.length} unique variances`,
      details: options.verbose ? {
        variances: variances.map(v => v.name),
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Variance planner', 'fail', Date.now() - start, {
      message: `Planner failed: ${error.message}`,
    });
  }
}

/**
 * Check theme generator
 */
async function checkThemeGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { generateThemes } = await import('../../themes/theme-generator');
    const { generateUniqueVariances } = await import('../../themes/variance-planner');
    const { generateManifest } = await import('../../capture/manifest-generator');

    // Create mock data
    const mockCaptureResult = {
      url: 'https://example.com',
      screenshotPath: '/tmp/test.png',
      html: '<html><head><title>Test Business</title></head><body><h1>Welcome</h1><p>Content</p></body></html>',
      links: [],
      timestamp: new Date().toISOString(),
    };

    const manifest = generateManifest(mockCaptureResult);
    const variances = generateUniqueVariances(2);

    const themes = generateThemes(manifest, variances);

    if (!themes || themes.length !== 2) {
      return createResult(CATEGORY, 'Theme generator', 'fail', Date.now() - start, {
        message: 'Did not generate expected number of themes',
      });
    }

    // Check theme structure
    const firstTheme = themes[0];
    if (!firstTheme.html || !firstTheme.css) {
      return createResult(CATEGORY, 'Theme generator', 'fail', Date.now() - start, {
        message: 'Theme structure is invalid',
      });
    }

    return createResult(CATEGORY, 'Theme generator', 'pass', Date.now() - start, {
      message: `Generated ${themes.length} themes`,
      details: options.verbose ? {
        themes: themes.map(t => t.name),
        avgHtmlSize: Math.round(themes.reduce((sum, t) => sum + t.html.length, 0) / themes.length),
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Theme generator', 'fail', Date.now() - start, {
      message: `Generator failed: ${error.message}`,
    });
  }
}

/**
 * Check gallery generator
 */
async function checkGalleryGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { generateGallery } = await import('../../themes/gallery-generator');
    const { generateThemes } = await import('../../themes/theme-generator');
    const { generateUniqueVariances } = await import('../../themes/variance-planner');
    const { generateManifest } = await import('../../capture/manifest-generator');

    // Create mock data
    const mockCaptureResult = {
      url: 'https://example.com',
      screenshotPath: '/tmp/test.png',
      html: '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>',
      links: [],
      timestamp: new Date().toISOString(),
    };

    const manifest = generateManifest(mockCaptureResult);
    const variances = generateUniqueVariances(2);
    const themes = generateThemes(manifest, variances);

    // Generate gallery in temp directory
    const tempDir = path.join('/tmp', `preflight-gallery-${Date.now()}`);

    const galleryPath = generateGallery(themes, {
      outputDir: tempDir,
      title: 'Preflight Test Gallery',
      originalUrl: 'https://example.com',
    });

    // Check if gallery was created
    if (!fs.existsSync(galleryPath)) {
      return createResult(CATEGORY, 'Gallery generator', 'fail', Date.now() - start, {
        message: 'Gallery file not created',
      });
    }

    const galleryContent = fs.readFileSync(galleryPath, 'utf-8');
    const gallerySize = galleryContent.length;

    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    return createResult(CATEGORY, 'Gallery generator', 'pass', Date.now() - start, {
      message: `Gallery created (${Math.round(gallerySize / 1024)}KB)`,
      details: options.verbose ? {
        themeCount: themes.length,
        gallerySize,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Gallery generator', 'fail', Date.now() - start, {
      message: `Gallery generation failed: ${error.message}`,
    });
  }
}

/**
 * Check all DNA variants are defined
 */
async function checkDnaVariants(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const {
      HERO_VARIANTS,
      LAYOUT_VARIANTS,
      COLOR_VARIANTS,
      NAV_VARIANTS,
      DESIGN_VARIANTS,
    } = await import('../../themes/variance-planner');

    const counts = {
      hero: Object.keys(HERO_VARIANTS).length,
      layout: Object.keys(LAYOUT_VARIANTS).length,
      color: Object.keys(COLOR_VARIANTS).length,
      nav: Object.keys(NAV_VARIANTS).length,
      design: Object.keys(DESIGN_VARIANTS).length,
    };

    // Check minimum variants
    const minimums = { hero: 10, layout: 10, color: 10, nav: 8, design: 10 };
    const missing: string[] = [];

    for (const [key, min] of Object.entries(minimums)) {
      if (counts[key as keyof typeof counts] < min) {
        missing.push(`${key} (${counts[key as keyof typeof counts]}/${min})`);
      }
    }

    if (missing.length > 0) {
      return createResult(CATEGORY, 'DNA variants', 'warn', Date.now() - start, {
        message: `Some variant categories are low: ${missing.join(', ')}`,
        details: counts,
      });
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return createResult(CATEGORY, 'DNA variants', 'pass', Date.now() - start, {
      message: `${total} total DNA variants defined`,
      details: options.verbose ? counts : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'DNA variants', 'fail', Date.now() - start, {
      message: `DNA check failed: ${error.message}`,
    });
  }
}

/**
 * Export all theme checks
 */
export const themesChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Variance planner',
    required: true,
    run: checkVariancePlanner,
  },
  {
    category: CATEGORY,
    name: 'Theme generator',
    required: true,
    run: checkThemeGenerator,
  },
  {
    category: CATEGORY,
    name: 'Gallery generator',
    required: true,
    run: checkGalleryGenerator,
  },
  {
    category: CATEGORY,
    name: 'DNA variants',
    required: true,
    run: checkDnaVariants,
  },
];
