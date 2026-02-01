import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage, Image, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import { BeforeAfterOptions, BeforeAfterResult } from './types';

// Use the node-canvas types
type CanvasContext = NodeCanvasRenderingContext2D;

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const DEFAULT_FRAME_DELAY = 100; // 100ms per frame
const DEFAULT_TRANSITION_FRAMES = 10;
const DEFAULT_HOLD_FRAMES = 20; // Hold for 2 seconds at 100ms per frame

export class BeforeAfterGenerator {
  /**
   * Generate an animated GIF showing before/after comparison
   * Creates a smooth crossfade transition between the two images
   */
  async generate(options: BeforeAfterOptions): Promise<BeforeAfterResult> {
    const {
      beforeImagePath,
      afterImagePath,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      frameDelay = DEFAULT_FRAME_DELAY,
      transitionFrames = DEFAULT_TRANSITION_FRAMES,
      holdFrames = DEFAULT_HOLD_FRAMES,
      loop = true,
    } = options;

    // Validate input files exist
    if (!fs.existsSync(beforeImagePath)) {
      throw new Error(`Before image not found: ${beforeImagePath}`);
    }
    if (!fs.existsSync(afterImagePath)) {
      throw new Error(`After image not found: ${afterImagePath}`);
    }

    // Generate output path if not provided
    const outputPath = options.outputPath || this.generateOutputPath(beforeImagePath);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Resize and load images
    const beforeBuffer = await this.resizeImage(beforeImagePath, width, height);
    const afterBuffer = await this.resizeImage(afterImagePath, width, height);

    const beforeImage = await loadImage(beforeBuffer);
    const afterImage = await loadImage(afterBuffer);

    // Create GIF encoder
    const encoder = new GIFEncoder(width, height);
    const outputStream = fs.createWriteStream(outputPath);

    encoder.createReadStream().pipe(outputStream);

    encoder.start();
    encoder.setRepeat(loop ? 0 : -1); // 0 = loop, -1 = no loop
    encoder.setDelay(frameDelay);
    encoder.setQuality(10); // Best quality

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let frameCount = 0;

    // Add "BEFORE" label frames - hold on before image
    for (let i = 0; i < holdFrames; i++) {
      this.drawFrame(ctx, beforeImage, null, 0, width, height, 'BEFORE');
      encoder.addFrame(ctx as any);
      frameCount++;
    }

    // Transition from before to after
    for (let i = 0; i <= transitionFrames; i++) {
      const alpha = i / transitionFrames;
      this.drawFrame(ctx, beforeImage, afterImage, alpha, width, height);
      encoder.addFrame(ctx as any);
      frameCount++;
    }

    // Add "AFTER" label frames - hold on after image
    for (let i = 0; i < holdFrames; i++) {
      this.drawFrame(ctx, null, afterImage, 1, width, height, 'AFTER');
      encoder.addFrame(ctx as any);
      frameCount++;
    }

    // Transition from after back to before (for smooth loop)
    for (let i = 0; i <= transitionFrames; i++) {
      const alpha = 1 - (i / transitionFrames);
      this.drawFrame(ctx, beforeImage, afterImage, alpha, width, height);
      encoder.addFrame(ctx as any);
      frameCount++;
    }

    encoder.finish();

    // Wait for file to be written
    await new Promise<void>((resolve, reject) => {
      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
    });

    // Get file size
    const stats = fs.statSync(outputPath);
    const totalDuration = frameCount * frameDelay;

    return {
      gifPath: outputPath,
      width,
      height,
      fileSize: stats.size,
      frameCount,
      duration: totalDuration,
    };
  }

  /**
   * Generate a simple before/after comparison without crossfade
   * Just alternates between the two images with labels
   */
  async generateSimple(options: BeforeAfterOptions): Promise<BeforeAfterResult> {
    const {
      beforeImagePath,
      afterImagePath,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      frameDelay = 1500, // 1.5 seconds per frame for simple version
      loop = true,
    } = options;

    if (!fs.existsSync(beforeImagePath)) {
      throw new Error(`Before image not found: ${beforeImagePath}`);
    }
    if (!fs.existsSync(afterImagePath)) {
      throw new Error(`After image not found: ${afterImagePath}`);
    }

    const outputPath = options.outputPath || this.generateOutputPath(beforeImagePath, '-simple');

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const beforeBuffer = await this.resizeImage(beforeImagePath, width, height);
    const afterBuffer = await this.resizeImage(afterImagePath, width, height);

    const beforeImage = await loadImage(beforeBuffer);
    const afterImage = await loadImage(afterBuffer);

    const encoder = new GIFEncoder(width, height);
    const outputStream = fs.createWriteStream(outputPath);

    encoder.createReadStream().pipe(outputStream);

    encoder.start();
    encoder.setRepeat(loop ? 0 : -1);
    encoder.setDelay(frameDelay);
    encoder.setQuality(10);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Frame 1: Before with label
    this.drawFrame(ctx, beforeImage, null, 0, width, height, 'BEFORE');
    encoder.addFrame(ctx as any);

    // Frame 2: After with label
    this.drawFrame(ctx, null, afterImage, 1, width, height, 'AFTER');
    encoder.addFrame(ctx as any);

    encoder.finish();

    await new Promise<void>((resolve, reject) => {
      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
    });

    const stats = fs.statSync(outputPath);

    return {
      gifPath: outputPath,
      width,
      height,
      fileSize: stats.size,
      frameCount: 2,
      duration: frameDelay * 2,
    };
  }

  /**
   * Generate from a gallery - takes first theme as "after" and uses before screenshot
   */
  async generateFromGallery(
    beforeScreenshotPath: string,
    galleryDir: string,
    options: Partial<BeforeAfterOptions> = {}
  ): Promise<BeforeAfterResult> {
    // Find the first theme screenshot in the gallery
    // We need to capture a screenshot of the theme HTML
    const themeFiles = fs.readdirSync(galleryDir)
      .filter(f => f.startsWith('theme-') && f.endsWith('.html'))
      .sort();

    if (themeFiles.length === 0) {
      throw new Error(`No theme files found in gallery: ${galleryDir}`);
    }

    // For now, we'll need to capture the theme - this will be done by the caller
    // or we need a screenshot of the "after" state
    throw new Error('generateFromGallery requires pre-captured theme screenshots. Use generate() with explicit before/after paths.');
  }

  private async resizeImage(imagePath: string, width: number, height: number): Promise<Buffer> {
    return sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'top',
      })
      .png()
      .toBuffer();
  }

  private drawFrame(
    ctx: CanvasContext,
    beforeImage: Image | null,
    afterImage: Image | null,
    alpha: number,
    width: number,
    height: number,
    label?: string
  ): void {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw before image
    if (beforeImage && alpha < 1) {
      ctx.globalAlpha = 1 - alpha;
      (ctx as any).drawImage(beforeImage, 0, 0, width, height);
    }

    // Draw after image with blend
    if (afterImage && alpha > 0) {
      ctx.globalAlpha = alpha;
      (ctx as any).drawImage(afterImage, 0, 0, width, height);
    }

    // Reset alpha
    ctx.globalAlpha = 1;

    // Draw label if provided
    if (label) {
      this.drawLabel(ctx, label, width, height);
    }
  }

  private drawLabel(
    ctx: CanvasContext,
    label: string,
    width: number,
    height: number
  ): void {
    const isAfter = label === 'AFTER';
    const bgColor = isAfter ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'; // green/red
    const padding = 12;
    const fontSize = 18;
    const borderRadius = 6;

    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 1.5;
    const x = width - boxWidth - 16;
    const y = 16;

    // Draw rounded rectangle background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, borderRadius);
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + boxWidth / 2, y + boxHeight / 2);
  }

  private generateOutputPath(inputPath: string, suffix: string = ''): string {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const timestamp = Date.now();

    return path.join(dir, `${base}-before-after${suffix}-${timestamp}.gif`);
  }
}

export function createBeforeAfterGenerator(): BeforeAfterGenerator {
  return new BeforeAfterGenerator();
}

// CLI entry point for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx src/media/before-after-generator.ts <before-image> <after-image> [output-path]');
    process.exit(1);
  }

  const [beforePath, afterPath, outputPath] = args;

  const generator = new BeforeAfterGenerator();

  generator
    .generate({
      beforeImagePath: beforePath,
      afterImagePath: afterPath,
      outputPath,
    })
    .then(result => {
      console.log('\nBefore/After GIF generated:');
      console.log(`  Path: ${result.gifPath}`);
      console.log(`  Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
      console.log(`  Dimensions: ${result.width}x${result.height}`);
      console.log(`  Frames: ${result.frameCount}`);
      console.log(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    })
    .catch(err => {
      console.error('Failed to generate GIF:', err);
      process.exit(1);
    });
}
