import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser } from 'playwright';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { GalleryVideoOptions, GalleryVideoResult } from './types';
import { MediaStorage } from './storage';
import { logger } from '../utils/logger';

const DEFAULT_FPS = 30;
const DEFAULT_DURATION_PER_THEME = 3; // seconds
const DEFAULT_TRANSITION_DURATION = 0.5; // seconds

export interface VideoGeneratorConfig {
  outputDir?: string;
  uploadToStorage?: boolean;
  storageBucket?: string;
  storageFolder?: string;
}

export class VideoGenerator {
  private outputDir: string;
  private uploadToStorage: boolean;
  private storageBucket: string;
  private storageFolder: string;
  private mediaStorage?: MediaStorage;

  constructor(config: VideoGeneratorConfig = {}) {
    this.outputDir = config.outputDir || 'tmp/autowebsites/videos';
    this.uploadToStorage = config.uploadToStorage ?? true;
    this.storageBucket = config.storageBucket || 'media';
    this.storageFolder = config.storageFolder || 'videos';

    if (this.uploadToStorage) {
      try {
        this.mediaStorage = new MediaStorage();
      } catch (error) {
        logger.warn('MediaStorage not available, files will only be saved locally');
        this.uploadToStorage = false;
      }
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a gallery showcase video using Remotion
   */
  async generateGalleryVideo(options: GalleryVideoOptions): Promise<GalleryVideoResult> {
    const {
      themePaths,
      themeNames,
      width = 1920,
      height = 1080,
      fps = DEFAULT_FPS,
      durationPerTheme = DEFAULT_DURATION_PER_THEME,
      transitionDuration = DEFAULT_TRANSITION_DURATION,
      businessName = 'Your Business',
    } = options;

    if (themePaths.length === 0) {
      throw new Error('No theme paths provided');
    }

    // First, capture screenshots of all themes
    const themeScreenshots = await this.captureThemeScreenshots(
      themePaths,
      options.outputPath ? path.dirname(options.outputPath) : this.outputDir,
      width,
      height
    );

    // Calculate video duration
    const themeCount = themePaths.length;
    const totalDuration = themeCount * durationPerTheme + (themeCount - 1) * transitionDuration;
    const durationInFrames = Math.ceil(totalDuration * fps);

    // Generate output path
    const timestamp = Date.now();
    const outputPath = options.outputPath || path.join(this.outputDir, `gallery-${timestamp}.mp4`);
    const thumbnailPath = outputPath.replace('.mp4', '-thumb.png');

    logger.info('Generating gallery video with Remotion', {
      themeCount,
      duration: `${totalDuration}s`,
      resolution: `${width}x${height}`,
    });

    try {
      // Bundle the Remotion project
      const bundleLocation = await bundle({
        entryPoint: path.join(__dirname, '../remotion/index.ts'),
        // Enable React Refresh for development
        webpackOverride: (config) => config,
      });

      // Select the composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'GalleryShowcase',
        inputProps: {
          themeScreenshots,
          themeNames,
          businessName,
          durationPerTheme,
          transitionDuration,
        },
      });

      // Override duration
      const adjustedComposition = {
        ...composition,
        durationInFrames,
        width,
        height,
        fps,
      };

      // Render the video
      await renderMedia({
        composition: adjustedComposition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: {
          themeScreenshots,
          themeNames,
          businessName,
          durationPerTheme,
          transitionDuration,
        },
      });

      // Generate thumbnail from first frame
      await this.generateThumbnail(outputPath, thumbnailPath);

      const stats = fs.statSync(outputPath);

      const result: GalleryVideoResult = {
        videoPath: outputPath,
        thumbnailPath,
        width,
        height,
        duration: totalDuration,
        fileSize: stats.size,
        fps,
      };

      logger.info('Gallery video generated successfully', {
        path: outputPath,
        size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to generate gallery video with Remotion', { error: error.message });

      // Fallback to simple slideshow method
      return this.generateSimpleSlideshow(themeScreenshots, themeNames, {
        outputPath,
        thumbnailPath,
        width,
        height,
        fps,
        durationPerTheme,
        businessName,
      });
    }
  }

  /**
   * Capture screenshots of theme HTML files
   */
  private async captureThemeScreenshots(
    themePaths: string[],
    outputDir: string,
    width: number,
    height: number
  ): Promise<string[]> {
    const screenshots: string[] = [];
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width, height },
      });

      for (let i = 0; i < themePaths.length; i++) {
        const themePath = themePaths[i];

        if (!fs.existsSync(themePath)) {
          logger.warn(`Theme file not found: ${themePath}`);
          continue;
        }

        const page = await context.newPage();
        await page.goto(`file://${path.resolve(themePath)}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for fonts/images to load
        await page.waitForTimeout(500);

        const screenshotPath = path.join(outputDir, `theme-${i}-screenshot.png`);
        await page.screenshot({
          path: screenshotPath,
          clip: { x: 0, y: 0, width, height },
        });

        screenshots.push(screenshotPath);
        await page.close();
      }

      return screenshots;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate a thumbnail from the first frame of a video
   */
  private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
    // Using ffmpeg to extract first frame
    const { execSync } = require('child_process');

    try {
      execSync(
        `ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`,
        { stdio: 'pipe' }
      );
    } catch (error) {
      logger.warn('Failed to generate thumbnail with ffmpeg, using first screenshot');
      // Fallback: copy first frame from screenshots if available
    }
  }

  /**
   * Simple slideshow fallback when Remotion is not available
   */
  private async generateSimpleSlideshow(
    themeScreenshots: string[],
    themeNames: string[],
    options: {
      outputPath: string;
      thumbnailPath: string;
      width: number;
      height: number;
      fps: number;
      durationPerTheme: number;
      businessName: string;
    }
  ): Promise<GalleryVideoResult> {
    const { execSync } = require('child_process');
    const { outputPath, thumbnailPath, width, height, fps, durationPerTheme } = options;

    logger.info('Using simple slideshow fallback (ffmpeg)');

    // Create a concat file for ffmpeg
    const concatFilePath = path.join(this.outputDir, 'concat.txt');
    const concatContent = themeScreenshots
      .map(screenshot => {
        const duration = durationPerTheme;
        return `file '${screenshot}'\nduration ${duration}`;
      })
      .join('\n');

    // Add last image again (ffmpeg quirk)
    const lastImage = themeScreenshots[themeScreenshots.length - 1];
    const finalContent = `${concatContent}\nfile '${lastImage}'`;

    fs.writeFileSync(concatFilePath, finalContent);

    try {
      // Generate video using ffmpeg
      execSync(
        `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" ` +
        `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}" ` +
        `-c:v libx264 -pix_fmt yuv420p -crf 23 "${outputPath}"`,
        { stdio: 'pipe' }
      );

      // Generate thumbnail
      if (themeScreenshots.length > 0) {
        fs.copyFileSync(themeScreenshots[0], thumbnailPath);
      }

      const stats = fs.statSync(outputPath);
      const totalDuration = themeScreenshots.length * durationPerTheme;

      return {
        videoPath: outputPath,
        thumbnailPath,
        width,
        height,
        duration: totalDuration,
        fileSize: stats.size,
        fps,
      };
    } finally {
      // Cleanup concat file
      if (fs.existsSync(concatFilePath)) {
        fs.unlinkSync(concatFilePath);
      }
    }
  }

  /**
   * Upload video and thumbnail to storage
   */
  async uploadVideo(result: GalleryVideoResult): Promise<{
    videoUrl: string;
    thumbnailUrl: string;
  }> {
    if (!this.mediaStorage) {
      throw new Error('Media storage not configured');
    }

    const videoStored = await this.mediaStorage.uploadFile(result.videoPath, {
      bucket: this.storageBucket,
      folder: this.storageFolder,
    });

    const thumbnailStored = await this.mediaStorage.uploadFile(result.thumbnailPath, {
      bucket: this.storageBucket,
      folder: `${this.storageFolder}/thumbnails`,
    });

    return {
      videoUrl: videoStored.url,
      thumbnailUrl: thumbnailStored.url,
    };
  }

  /**
   * Generate and optionally upload a gallery video for a lead
   */
  async generateForLead(
    leadId: string,
    galleryDir: string,
    businessName: string,
    options: Partial<GalleryVideoOptions> = {}
  ): Promise<{
    result: GalleryVideoResult;
    videoUrl?: string;
    thumbnailUrl?: string;
  }> {
    // Find theme files
    const themeFiles = fs.readdirSync(galleryDir)
      .filter(f => f.startsWith('theme-') && f.endsWith('.html'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/theme-(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/theme-(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    if (themeFiles.length === 0) {
      throw new Error(`No theme files found in: ${galleryDir}`);
    }

    const themePaths = themeFiles.map(f => path.join(galleryDir, f));
    const themeNames = themeFiles.map((f, i) => {
      // Try to extract theme name from file or use generic name
      return `Design ${i + 1}`;
    });

    const outputPath = path.join(this.outputDir, `${leadId}-gallery.mp4`);

    const result = await this.generateGalleryVideo({
      themePaths,
      themeNames,
      businessName,
      outputPath,
      ...options,
    });

    let videoUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (this.uploadToStorage && this.mediaStorage) {
      try {
        const uploaded = await this.uploadVideo(result);
        videoUrl = uploaded.videoUrl;
        thumbnailUrl = uploaded.thumbnailUrl;

        logger.info('Video uploaded to storage', {
          videoUrl,
          thumbnailUrl,
        });
      } catch (error: any) {
        logger.error('Failed to upload video', { error: error.message });
      }
    }

    return {
      result,
      videoUrl,
      thumbnailUrl,
    };
  }
}

export function createVideoGenerator(config?: VideoGeneratorConfig): VideoGenerator {
  return new VideoGenerator(config);
}
