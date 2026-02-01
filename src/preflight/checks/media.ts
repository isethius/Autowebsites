/**
 * Media Checks
 *
 * Verifies Sharp library, theme grid, and GIF generation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';

const CATEGORY = 'Media';

/**
 * Check Sharp library is installed and working
 */
async function checkSharpLibrary(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const sharp = (await import('sharp')).default;

    // Try to create a simple test image
    const testBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    if (!testBuffer || testBuffer.length === 0) {
      return createResult(CATEGORY, 'Sharp library', 'fail', Date.now() - start, {
        message: 'Sharp failed to create test image',
      });
    }

    return createResult(CATEGORY, 'Sharp library', 'pass', Date.now() - start, {
      details: options.verbose ? { testImageSize: testBuffer.length } : undefined,
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return createResult(CATEGORY, 'Sharp library', 'fail', Date.now() - start, {
        message: 'Sharp not installed',
        fixCommand: 'npm install sharp',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'Sharp library', 'fail', Date.now() - start, {
      message: `Sharp error: ${error.message}`,
    });
  }
}

/**
 * Check Canvas library is installed
 */
async function checkCanvasLibrary(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { createCanvas } = await import('canvas');

    // Create a simple test canvas
    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);

    const buffer = canvas.toBuffer('image/png');

    if (!buffer || buffer.length === 0) {
      return createResult(CATEGORY, 'Canvas library', 'fail', Date.now() - start, {
        message: 'Canvas failed to create test image',
      });
    }

    return createResult(CATEGORY, 'Canvas library', 'pass', Date.now() - start, {
      details: options.verbose ? { testImageSize: buffer.length } : undefined,
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return createResult(CATEGORY, 'Canvas library', 'fail', Date.now() - start, {
        message: 'Canvas not installed',
        fixCommand: 'npm install canvas',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'Canvas library', 'fail', Date.now() - start, {
      message: `Canvas error: ${error.message}`,
    });
  }
}

/**
 * Check GIF encoder is installed
 */
async function checkGifEncoder(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const GIFEncoder = (await import('gifencoder')).default;

    // Create a simple test encoder
    const encoder = new GIFEncoder(100, 100);

    return createResult(CATEGORY, 'GIF encoder', 'pass', Date.now() - start);
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return createResult(CATEGORY, 'GIF encoder', 'fail', Date.now() - start, {
        message: 'GIFEncoder not installed',
        fixCommand: 'npm install gifencoder',
        fixable: true,
      });
    }

    return createResult(CATEGORY, 'GIF encoder', 'fail', Date.now() - start, {
      message: `GIF encoder error: ${error.message}`,
    });
  }
}

/**
 * Test theme grid generation
 */
async function checkThemeGridGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { ThemeGridGenerator } = await import('../../media');

    const generator = new ThemeGridGenerator();

    // We can't fully test without a gallery dir, but we can verify it initializes
    return createResult(CATEGORY, 'Theme grid generator', 'pass', Date.now() - start, {
      message: 'Generator initialized',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Theme grid generator', 'fail', Date.now() - start, {
      message: `Generator init failed: ${error.message}`,
    });
  }
}

/**
 * Test before/after generator
 */
async function checkBeforeAfterGenerator(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { BeforeAfterGenerator } = await import('../../media');

    const generator = new BeforeAfterGenerator();

    // Verify it initializes
    return createResult(CATEGORY, 'Before/After generator', 'pass', Date.now() - start, {
      message: 'Generator initialized',
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Before/After generator', 'fail', Date.now() - start, {
      message: `Generator init failed: ${error.message}`,
    });
  }
}

/**
 * Test actual GIF generation with sample images
 */
async function checkGifGeneration(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const sharp = (await import('sharp')).default;
    const { BeforeAfterGenerator } = await import('../../media');

    // Create two test images
    const tempDir = path.join('/tmp', `preflight-gif-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const beforePath = path.join(tempDir, 'before.png');
    const afterPath = path.join(tempDir, 'after.png');

    // Create "before" image (red)
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 255, g: 100, b: 100 },
      },
    })
      .png()
      .toFile(beforePath);

    // Create "after" image (green)
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 100, g: 255, b: 100 },
      },
    })
      .png()
      .toFile(afterPath);

    // Generate GIF
    const generator = new BeforeAfterGenerator();
    const result = await generator.generate({
      beforeImagePath: beforePath,
      afterImagePath: afterPath,
      outputPath: path.join(tempDir, 'output.gif'),
      width: 400,
      height: 300,
    });

    const gifExists = fs.existsSync(result.gifPath);
    const gifSize = gifExists ? fs.statSync(result.gifPath).size : 0;

    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    if (!gifExists || gifSize === 0) {
      return createResult(CATEGORY, 'GIF generation', 'fail', Date.now() - start, {
        message: 'GIF file not created or empty',
      });
    }

    return createResult(CATEGORY, 'GIF generation', 'pass', Date.now() - start, {
      message: `GIF created (${Math.round(gifSize / 1024)}KB)`,
      details: options.verbose ? {
        fileSize: gifSize,
        frameCount: result.frameCount,
        duration: result.duration,
      } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'GIF generation', 'fail', Date.now() - start, {
      message: `GIF generation failed: ${error.message}`,
    });
  }
}

/**
 * Export all media checks
 */
export const mediaChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Sharp library',
    required: true,
    run: checkSharpLibrary,
  },
  {
    category: CATEGORY,
    name: 'Canvas library',
    required: true,
    run: checkCanvasLibrary,
  },
  {
    category: CATEGORY,
    name: 'GIF encoder',
    required: true,
    run: checkGifEncoder,
  },
  {
    category: CATEGORY,
    name: 'Theme grid generator',
    required: true,
    run: checkThemeGridGenerator,
  },
  {
    category: CATEGORY,
    name: 'Before/After generator',
    required: true,
    run: checkBeforeAfterGenerator,
  },
  {
    category: CATEGORY,
    name: 'GIF generation',
    required: true,
    run: checkGifGeneration,
  },
];
