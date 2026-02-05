import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import JSZip from 'jszip';
import sharp from 'sharp';
import { logger } from '../utils/logger';

export type AssetType = 'html' | 'css' | 'js' | 'image' | 'font' | 'other';

export interface ExportAssetInput {
  path?: string;
  source: string | Buffer;
  type?: AssetType;
  sourceType?: 'url' | 'file' | 'content';
  mediaType?: string;
}

export interface ExportPage {
  path: string;
  html: string;
  assets?: ExportAssetInput[];
}

export interface MinifyOptions {
  html?: boolean;
  css?: boolean;
  js?: boolean;
}

export interface OptimizeOptions {
  images?: boolean;
  imageQuality?: number;
  webpQuality?: number;
  avifQuality?: number;
  pngCompressionLevel?: number;
}

export interface ExportOptions {
  minify?: boolean | MinifyOptions;
  optimize?: boolean | OptimizeOptions;
  resolveExternalAssets?: boolean;
  externalAssetTimeoutMs?: number;
  assetsDir?: string;
  rootDir?: string;
  log?: boolean;
}

export interface WebsiteExportInput {
  outputPath: string;
  pages: ExportPage[];
  assets?: ExportAssetInput[];
  options?: ExportOptions;
}

export interface WebsiteExportResult {
  outputPath: string;
  bytesWritten: number;
  pageCount: number;
  assetCount: number;
  warnings: string[];
}

interface ResolvedAsset {
  outputPath: string;
  content: Buffer;
  type: AssetType;
  sourceKey?: string;
  mediaType?: string;
}

interface NormalizedOptions {
  minify: Required<MinifyOptions>;
  optimize: Required<OptimizeOptions>;
  resolveExternalAssets: boolean;
  externalAssetTimeoutMs: number;
  assetsDir: string;
  rootDir?: string;
  log: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function exportSinglePageZip(
  html: string,
  outputPath: string,
  options: ExportOptions = {}
): Promise<WebsiteExportResult> {
  return exportWebsiteZip({
    outputPath,
    pages: [{ path: 'index.html', html }],
    options,
  });
}

export async function exportWebsiteZip(input: WebsiteExportInput): Promise<WebsiteExportResult> {
  if (!input.pages || input.pages.length === 0) {
    throw new Error('At least one page is required for export');
  }

  const options = normalizeOptions(input.options);
  const warnings: string[] = [];

  if (options.log) {
    logger.info('Exporting website to ZIP', {
      pages: input.pages.length,
      outputPath: input.outputPath,
      resolveExternalAssets: options.resolveExternalAssets,
      minify: options.minify,
      optimize: options.optimize,
    });
  }

  const assetRegistry = new AssetRegistry(options, warnings);
  const zip = new JSZip();
  const pagePaths = new Set<string>();

  // Register shared assets first so they are available for rewrites.
  if (input.assets?.length) {
    for (const asset of input.assets) {
      await assetRegistry.registerAssetInput(asset, pagePaths);
    }
  }

  for (const page of input.pages) {
    const normalizedPagePath = normalizeZipPath(page.path);
    pagePaths.add(normalizedPagePath);

    // Register page-specific assets.
    if (page.assets?.length) {
      for (const asset of page.assets) {
        await assetRegistry.registerAssetInput(asset, pagePaths);
      }
    }

    let html = page.html;

    if (options.resolveExternalAssets) {
      html = await assetRegistry.rewriteHtml(html, normalizedPagePath);
    }

    if (options.minify.html) {
      html = minifyHtml(html, options.minify);
    }

    const zipPath = withRootDir(options.rootDir, normalizedPagePath);
    zip.file(zipPath, html);
  }

  for (const asset of assetRegistry.getAssets()) {
    if (pagePaths.has(asset.outputPath)) {
      warnings.push(`Asset path collides with page path: ${asset.outputPath}`);
      continue;
    }

    const zipPath = withRootDir(options.rootDir, asset.outputPath);
    zip.file(zipPath, asset.content);
  }

  const outputDir = path.dirname(input.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(input.outputPath, zipBuffer);

  if (options.log) {
    logger.info('ZIP export complete', {
      outputPath: input.outputPath,
      bytesWritten: zipBuffer.length,
      pages: input.pages.length,
      assets: assetRegistry.getAssets().length,
      warnings: warnings.length,
    });
  }

  return {
    outputPath: input.outputPath,
    bytesWritten: zipBuffer.length,
    pageCount: input.pages.length,
    assetCount: assetRegistry.getAssets().length,
    warnings,
  };
}

function normalizeOptions(options: ExportOptions | undefined): NormalizedOptions {
  const minify = resolveMinifyOptions(options?.minify);
  const optimize = resolveOptimizeOptions(options?.optimize);

  return {
    minify,
    optimize,
    resolveExternalAssets: options?.resolveExternalAssets ?? true,
    externalAssetTimeoutMs: options?.externalAssetTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    assetsDir: normalizeZipPath(options?.assetsDir || 'assets'),
    rootDir: options?.rootDir ? normalizeZipPath(options.rootDir) : undefined,
    log: options?.log ?? true,
  };
}

function resolveMinifyOptions(input?: boolean | MinifyOptions): Required<MinifyOptions> {
  if (typeof input === 'boolean') {
    return { html: input, css: input, js: input };
  }
  return {
    html: input?.html ?? false,
    css: input?.css ?? false,
    js: input?.js ?? false,
  };
}

function resolveOptimizeOptions(input?: boolean | OptimizeOptions): Required<OptimizeOptions> {
  if (typeof input === 'boolean') {
    return {
      images: input,
      imageQuality: 82,
      webpQuality: 80,
      avifQuality: 45,
      pngCompressionLevel: 9,
    };
  }
  return {
    images: input?.images ?? false,
    imageQuality: input?.imageQuality ?? 82,
    webpQuality: input?.webpQuality ?? 80,
    avifQuality: input?.avifQuality ?? 45,
    pngCompressionLevel: input?.pngCompressionLevel ?? 9,
  };
}

class AssetRegistry {
  private assetsByPath = new Map<string, ResolvedAsset>();
  private sourceToPath = new Map<string, string>();
  private inFlightSources = new Set<string>();

  constructor(
    private options: NormalizedOptions,
    private warnings: string[]
  ) {}

  getAssets(): ResolvedAsset[] {
    return Array.from(this.assetsByPath.values());
  }

  async registerAssetInput(asset: ExportAssetInput, pagePaths: Set<string>): Promise<ResolvedAsset | null> {
    const sourceType = resolveSourceType(asset.source, asset.sourceType);

    if (sourceType === 'content') {
      if (!asset.path) {
        const fallbackPath = deriveContentPath(asset.type, this.options.assetsDir);
        asset = { ...asset, path: fallbackPath };
      }

      const outputPath = normalizeZipPath(asset.path!);
      if (pagePaths.has(outputPath)) {
        this.warnings.push(`Asset path collides with page path: ${outputPath}`);
        return null;
      }

      let content: Buffer = Buffer.isBuffer(asset.source)
        ? asset.source
        : Buffer.from(String(asset.source));

      const type = asset.type || guessAssetTypeFromPath(outputPath) || 'other';
      if (type === 'css' && this.options.minify.css) {
        content = Buffer.from(minifyCss(content.toString('utf-8')));
      } else if (type === 'js' && this.options.minify.js) {
        content = Buffer.from(minifyJs(content.toString('utf-8')));
      } else if (type === 'image' && this.options.optimize.images) {
        content = await optimizeImage(content, outputPath, this.options.optimize);
      }

      const resolved: ResolvedAsset = {
        outputPath,
        content,
        type,
        mediaType: asset.mediaType,
      };

      this.assetsByPath.set(outputPath, resolved);
      return resolved;
    }

    if (sourceType === 'file') {
      const filePath = String(asset.source);
      const outputPath = normalizeZipPath(asset.path || derivePathFromFile(filePath, this.options.assetsDir));

      if (pagePaths.has(outputPath)) {
        this.warnings.push(`Asset path collides with page path: ${outputPath}`);
        return null;
      }

      if (this.assetsByPath.has(outputPath)) {
        return this.assetsByPath.get(outputPath)!;
      }

      if (!fs.existsSync(filePath)) {
        this.warnings.push(`Asset file not found: ${filePath}`);
        return null;
      }

      let content: Buffer = fs.readFileSync(filePath);
      const type = asset.type || guessAssetTypeFromPath(outputPath) || 'other';

      if (type === 'css' && this.options.minify.css) {
        content = Buffer.from(minifyCss(content.toString('utf-8')));
      } else if (type === 'js' && this.options.minify.js) {
        content = Buffer.from(minifyJs(content.toString('utf-8')));
      } else if (type === 'image' && this.options.optimize.images) {
        content = await optimizeImage(content, outputPath, this.options.optimize);
      }

      const resolved: ResolvedAsset = {
        outputPath,
        content,
        type,
        mediaType: asset.mediaType,
        sourceKey: filePath,
      };

      this.assetsByPath.set(outputPath, resolved);
      return resolved;
    }

    // URL source
    const rawUrl = normalizeRemoteUrl(String(asset.source));
    const { base: urlBase } = splitUrlFragment(rawUrl);
    if (!isRemoteUrl(urlBase)) {
      this.warnings.push(`Asset URL is not remote: ${rawUrl}`);
      return null;
    }
    const outputPath = normalizeZipPath(
      asset.path || derivePathFromUrl(urlBase, this.options.assetsDir, asset.type)
    );

    if (pagePaths.has(outputPath)) {
      this.warnings.push(`Asset path collides with page path: ${outputPath}`);
      return null;
    }

    return this.ensureExternalAsset(urlBase, outputPath, asset.type);
  }

  async rewriteHtml(html: string, pagePath: string): Promise<string> {
    let result = html;

    result = await replaceAsync(result, /<style\b[^>]*>([\s\S]*?)<\/style>/gi, async (match, css) => {
      const rewritten = await this.rewriteCss(css, {
        ownerPath: pagePath,
      });
      return match.replace(css, rewritten);
    });

    result = await replaceAsync(result, /<link\b[^>]*>/gi, async (match) => {
      const href = getAttribute(match, 'href');
      if (!href || shouldIgnoreUrl(href)) {
        return match;
      }
      const { base: hrefBase, fragment } = splitUrlFragment(href);
      const normalizedHref = normalizeRemoteUrl(hrefBase);
      if (!isRemoteUrl(normalizedHref)) {
        return match;
      }

      const rel = (getAttribute(match, 'rel') || '').toLowerCase();
      if (rel.includes('preconnect') || rel.includes('dns-prefetch')) {
        return this.options.resolveExternalAssets ? '' : match;
      }

      if (rel.includes('stylesheet') || rel.includes('icon') || rel.includes('manifest') || rel.includes('preload') || rel.includes('apple-touch-icon')) {
        const asValue = (getAttribute(match, 'as') || '').toLowerCase();
        let typeHint: AssetType | undefined;
        if (rel.includes('stylesheet')) {
          typeHint = 'css';
        } else if (rel.includes('preload')) {
          if (asValue.includes('style')) typeHint = 'css';
          else if (asValue.includes('script')) typeHint = 'js';
          else if (asValue.includes('font')) typeHint = 'font';
          else if (asValue.includes('image')) typeHint = 'image';
        } else if (rel.includes('icon') || rel.includes('apple-touch-icon')) {
          typeHint = 'image';
        } else if (rel.includes('manifest')) {
          typeHint = 'other';
        }
        const outputPath = await this.ensureExternalAsset(
          normalizedHref,
          derivePathFromUrl(normalizedHref, this.options.assetsDir, typeHint || guessAssetTypeFromUrl(normalizedHref)),
          typeHint || guessAssetTypeFromUrl(normalizedHref)
        ).then(asset => asset?.outputPath);

        if (!outputPath) return match;
        const relative = relativeAssetPath(pagePath, outputPath) + fragment;
        let updated = setAttribute(match, 'href', relative);
        updated = removeAttribute(updated, 'integrity');
        updated = removeAttribute(updated, 'crossorigin');
        return updated;
      }

      return match;
    });

    result = await replaceAsync(result, /<script\b[^>]*>/gi, async (match) => {
      const src = getAttribute(match, 'src');
      if (!src || shouldIgnoreUrl(src)) {
        return match;
      }
      const { base: srcBase, fragment } = splitUrlFragment(src);
      const normalizedSrc = normalizeRemoteUrl(srcBase);
      if (!isRemoteUrl(normalizedSrc)) {
        return match;
      }

      const outputPath = await this.ensureExternalAsset(
        normalizedSrc,
        derivePathFromUrl(normalizedSrc, this.options.assetsDir, 'js'),
        'js'
      ).then(asset => asset?.outputPath);

      if (!outputPath) return match;
      const relative = relativeAssetPath(pagePath, outputPath) + fragment;
      let updated = setAttribute(match, 'src', relative);
      updated = removeAttribute(updated, 'integrity');
      updated = removeAttribute(updated, 'crossorigin');
      return updated;
    });

    result = await replaceAsync(result, /<(img|source|video|audio)\b[^>]*>/gi, async (match) => {
      let updated = match;

      const src = getAttribute(match, 'src');
      if (src && !shouldIgnoreUrl(src)) {
        const { base: srcBase, fragment } = splitUrlFragment(src);
        const normalizedSrc = normalizeRemoteUrl(srcBase);
        if (!isRemoteUrl(normalizedSrc)) {
          return updated;
        }
        const outputPath = await this.ensureExternalAsset(
          normalizedSrc,
          derivePathFromUrl(normalizedSrc, this.options.assetsDir, guessAssetTypeFromUrl(normalizedSrc)),
          guessAssetTypeFromUrl(normalizedSrc)
        ).then(asset => asset?.outputPath);

        if (outputPath) {
          const relative = relativeAssetPath(pagePath, outputPath) + fragment;
          updated = setAttribute(updated, 'src', relative);
          updated = removeAttribute(updated, 'integrity');
          updated = removeAttribute(updated, 'crossorigin');
        }
      }

      const poster = getAttribute(match, 'poster');
      if (poster && !shouldIgnoreUrl(poster)) {
        const { base: posterBase, fragment } = splitUrlFragment(poster);
        const normalizedPoster = normalizeRemoteUrl(posterBase);
        if (!isRemoteUrl(normalizedPoster)) {
          return updated;
        }
        const outputPath = await this.ensureExternalAsset(
          normalizedPoster,
          derivePathFromUrl(normalizedPoster, this.options.assetsDir, 'image'),
          'image'
        ).then(asset => asset?.outputPath);

        if (outputPath) {
          const relative = relativeAssetPath(pagePath, outputPath) + fragment;
          updated = setAttribute(updated, 'poster', relative);
          updated = removeAttribute(updated, 'integrity');
          updated = removeAttribute(updated, 'crossorigin');
        }
      }

      const srcset = getAttribute(match, 'srcset');
      if (srcset) {
        const rewritten = await this.rewriteSrcset(srcset, pagePath);
        updated = setAttribute(updated, 'srcset', rewritten);
      }

      return updated;
    });

    return result;
  }

  private async rewriteSrcset(srcset: string, pagePath: string): Promise<string> {
    const entries = srcset.split(',').map(part => part.trim()).filter(Boolean);
    const rewrittenParts: string[] = [];

    for (const entry of entries) {
      const segments = entry.split(/\s+/);
      const url = segments[0];
      const descriptor = segments.slice(1).join(' ');

      if (shouldIgnoreUrl(url)) {
        rewrittenParts.push(entry);
        continue;
      }
      const { base: urlBase, fragment } = splitUrlFragment(url);
      const normalizedUrl = normalizeRemoteUrl(urlBase);
      if (!isRemoteUrl(normalizedUrl)) {
        rewrittenParts.push(entry);
        continue;
      }

      const outputPath = await this.ensureExternalAsset(
        normalizedUrl,
        derivePathFromUrl(normalizedUrl, this.options.assetsDir, guessAssetTypeFromUrl(normalizedUrl)),
        guessAssetTypeFromUrl(normalizedUrl)
      ).then(asset => asset?.outputPath);

      if (!outputPath) {
        rewrittenParts.push(entry);
        continue;
      }

      const relative = relativeAssetPath(pagePath, outputPath) + fragment;
      rewrittenParts.push(descriptor ? `${relative} ${descriptor}` : relative);
    }

    return rewrittenParts.join(', ');
  }

  private async ensureExternalAsset(
    url: string,
    outputPath: string,
    typeHint?: AssetType
  ): Promise<ResolvedAsset | null> {
    if (!this.options.resolveExternalAssets) {
      return null;
    }

    const normalizedUrl = normalizeRemoteUrl(url);
    const baseUrl = stripUrlFragment(normalizedUrl);
    if (!isRemoteUrl(baseUrl)) {
      return null;
    }

    const cachedPath = this.sourceToPath.get(baseUrl);
    if (cachedPath && this.assetsByPath.has(cachedPath)) {
      return this.assetsByPath.get(cachedPath)!;
    }

    if (this.inFlightSources.has(baseUrl)) {
      if (cachedPath) {
        return this.assetsByPath.get(cachedPath) || null;
      }
      return null;
    }

    this.inFlightSources.add(baseUrl);

    try {
      const response = await fetchWithTimeout(baseUrl, this.options.externalAssetTimeoutMs);
      if (!response.ok) {
        this.warnings.push(`Failed to fetch asset (${response.status}): ${baseUrl}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || undefined;
      let buffer: Buffer = Buffer.from(await response.arrayBuffer());
      const type = typeHint || guessAssetTypeFromUrl(baseUrl) || guessAssetTypeFromContentType(contentType) || 'other';

      let finalOutputPath = normalizeZipPath(outputPath || derivePathFromUrl(baseUrl, this.options.assetsDir, type));

      if (type === 'css') {
        const cssText = buffer.toString('utf-8');
        const rewrittenCss = await this.rewriteCss(cssText, {
          baseUrl: baseUrl,
          ownerPath: finalOutputPath,
        });
        const finalCss = this.options.minify.css ? minifyCss(rewrittenCss) : rewrittenCss;
        buffer = Buffer.from(finalCss, 'utf-8');
      } else if (type === 'js') {
        if (this.options.minify.js) {
          buffer = Buffer.from(minifyJs(buffer.toString('utf-8')));
        }
      } else if (type === 'image' && this.options.optimize.images) {
        buffer = await optimizeImage(buffer, finalOutputPath, this.options.optimize);
      }

      const resolved: ResolvedAsset = {
        outputPath: finalOutputPath,
        content: buffer,
        type,
        sourceKey: baseUrl,
        mediaType: contentType,
      };

      this.sourceToPath.set(baseUrl, finalOutputPath);
      this.assetsByPath.set(finalOutputPath, resolved);

      return resolved;
    } catch (error: any) {
      const message = error?.message || 'Unknown fetch error';
      this.warnings.push(`Failed to fetch asset: ${baseUrl} (${message})`);
      return null;
    } finally {
      this.inFlightSources.delete(baseUrl);
    }
  }

  private async rewriteCss(
    css: string,
    context: { baseUrl?: string; ownerPath: string }
  ): Promise<string> {
    let result = css;

    result = await replaceAsync(result, /@import\s+(?:url\()?['"]?([^'"\)]+)['"]?\)?\s*;?/gi, async (match, url) => {
      if (shouldIgnoreUrl(url)) {
        return match;
      }

      const resolvedUrl = resolveCssUrl(url, context.baseUrl);
      if (!resolvedUrl) {
        return match;
      }
      const { base: resolvedBase, fragment } = splitUrlFragment(resolvedUrl);

      const outputPath = await this.ensureExternalAsset(
        resolvedBase,
        derivePathFromUrl(resolvedBase, this.options.assetsDir, 'css'),
        'css'
      ).then(asset => asset?.outputPath);

      if (!outputPath) {
        return match;
      }

      const relative = relativeAssetPath(context.ownerPath, outputPath) + fragment;
      return `@import url("${relative}");`;
    });

    result = await replaceAsync(result, /url\(([^)]+)\)/gi, async (match, rawUrl) => {
      const cleaned = rawUrl.trim().replace(/^['"]|['"]$/g, '');
      if (!cleaned || shouldIgnoreUrl(cleaned)) {
        return match;
      }

      const resolvedUrl = resolveCssUrl(cleaned, context.baseUrl);
      if (!resolvedUrl) {
        return match;
      }
      const { base: resolvedBase, fragment } = splitUrlFragment(resolvedUrl);

      const outputPath = await this.ensureExternalAsset(
        resolvedBase,
        derivePathFromUrl(resolvedBase, this.options.assetsDir, guessAssetTypeFromUrl(resolvedBase)),
        guessAssetTypeFromUrl(resolvedBase)
      ).then(asset => asset?.outputPath);

      if (!outputPath) {
        return match;
      }

      const relative = relativeAssetPath(context.ownerPath, outputPath) + fragment;
      return `url("${relative}")`;
    });

    return result;
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveSourceType(source: string | Buffer, explicit?: ExportAssetInput['sourceType']): 'url' | 'file' | 'content' {
  if (explicit) return explicit;
  if (Buffer.isBuffer(source)) return 'content';

  const value = String(source);
  if (isRemoteUrl(value)) return 'url';
  if (fs.existsSync(value)) return 'file';
  return 'content';
}

function normalizeZipPath(value: string): string {
  const posixValue = value.split(path.sep).join('/');
  let normalized = path.posix.normalize(posixValue);
  normalized = normalized.replace(/^(\.\.\/)+/, '');
  normalized = normalized.replace(/^\.\//, '');
  normalized = normalized.replace(/^\//, '');
  return normalized;
}

function withRootDir(rootDir: string | undefined, filePath: string): string {
  if (!rootDir) return filePath;
  return path.posix.join(normalizeZipPath(rootDir), filePath);
}

function relativeAssetPath(fromPath: string, toPath: string): string {
  const fromDir = path.posix.dirname(fromPath);
  const relative = path.posix.relative(fromDir, toPath);
  return relative || path.posix.basename(toPath);
}

function normalizeRemoteUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

function isRemoteUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed);
}

function shouldIgnoreUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed.startsWith('data:')
    || trimmed.startsWith('mailto:')
    || trimmed.startsWith('tel:')
    || trimmed.startsWith('javascript:')
    || trimmed.startsWith('#')
  );
}

function splitUrlFragment(url: string): { base: string; fragment: string } {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    return { base: url, fragment: '' };
  }
  return { base: url.slice(0, hashIndex), fragment: url.slice(hashIndex) };
}

function stripUrlFragment(url: string): string {
  return splitUrlFragment(url).base;
}

function resolveCssUrl(url: string, baseUrl?: string): string | null {
  if (isRemoteUrl(url)) {
    return normalizeRemoteUrl(url);
  }

  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function deriveContentPath(type: AssetType | undefined, assetsDir: string): string {
  const ext = defaultExtForType(type);
  const hash = createHash('sha1').update(`${Date.now()}-${Math.random()}`).digest('hex').slice(0, 8);
  return path.posix.join(assetsDir, `asset-${hash}${ext}`);
}

function derivePathFromFile(filePath: string, assetsDir: string): string {
  const base = path.basename(filePath);
  return path.posix.join(assetsDir, sanitizeName(base));
}

function derivePathFromUrl(url: string, assetsDir: string, typeHint?: AssetType): string {
  const parsed = new URL(normalizeRemoteUrl(url));
  const base = path.posix.basename(parsed.pathname) || 'asset';
  const ext = path.posix.extname(base) || defaultExtForType(typeHint);
  const name = sanitizeName(base.replace(ext, '')) || 'asset';
  const host = sanitizeName(parsed.hostname);
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 8);
  return path.posix.join(assetsDir, host, `${name}-${hash}${ext}`);
}

function sanitizeName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function defaultExtForType(type?: AssetType): string {
  switch (type) {
    case 'css':
      return '.css';
    case 'js':
      return '.js';
    case 'image':
      return '.png';
    case 'font':
      return '.woff2';
    case 'html':
      return '.html';
    default:
      return '.bin';
  }
}

function guessAssetTypeFromUrl(url: string): AssetType | undefined {
  try {
    const parsed = new URL(normalizeRemoteUrl(url));
    return guessAssetTypeFromPath(parsed.pathname);
  } catch {
    return guessAssetTypeFromPath(url);
  }
}

function guessAssetTypeFromPath(filePath: string): AssetType | undefined {
  const ext = path.posix.extname(filePath).toLowerCase();
  if (!ext) return undefined;
  if (['.css'].includes(ext)) return 'css';
  if (['.js', '.mjs'].includes(ext)) return 'js';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg'].includes(ext)) return 'image';
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'font';
  if (['.html', '.htm'].includes(ext)) return 'html';
  return 'other';
}

function guessAssetTypeFromContentType(contentType?: string): AssetType | undefined {
  if (!contentType) return undefined;
  const normalized = contentType.toLowerCase();
  if (normalized.includes('text/css')) return 'css';
  if (normalized.includes('javascript')) return 'js';
  if (normalized.includes('image/')) return 'image';
  if (normalized.includes('font/')) return 'font';
  if (normalized.includes('text/html')) return 'html';
  return undefined;
}

function minifyHtml(html: string, options: Required<MinifyOptions>): string {
  let result = html;

  if (options.css) {
    result = result.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
      return match.replace(css, minifyCss(css));
    });
  }

  if (options.js) {
    result = result.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (match, js) => {
      const openingTag = match.split('>')[0] + '>';
      const type = (getAttribute(openingTag, 'type') || '').toLowerCase();
      if (type && !(type.includes('javascript') || type.includes('ecmascript') || type.includes('module'))) {
        return match;
      }
      return match.replace(js, minifyJs(js));
    });
  }

  result = result.replace(/<!--[\s\S]*?-->/g, '');
  return result.trim();
}

function stripCssComments(css: string): string {
  let output = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    const next = css[i + 1];

    if (!inSingleQuote && !inDoubleQuote && char === '/' && next === '*') {
      i += 1;
      while (i < css.length) {
        if (css[i] === '*' && css[i + 1] === '/') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === "'" && !inDoubleQuote && !isEscaped(css, i)) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !isEscaped(css, i)) {
      inDoubleQuote = !inDoubleQuote;
    }

    output += char;
  }

  return output;
}

function minifyCss(css: string): string {
  return stripCssComments(css)
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function minifyJs(js: string): string {
  return js
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function isEscaped(value: string, index: number): boolean {
  let backslashCount = 0;
  for (let i = index - 1; i >= 0 && value[i] === '\\\\'; i -= 1) {
    backslashCount += 1;
  }
  return backslashCount % 2 === 1;
}

async function optimizeImage(
  buffer: Buffer,
  outputPath: string,
  options: Required<OptimizeOptions>
): Promise<Buffer> {
  const ext = path.posix.extname(outputPath).toLowerCase();

  try {
    if (ext === '.jpg' || ext === '.jpeg') {
      return await sharp(buffer).jpeg({ quality: options.imageQuality, mozjpeg: true }).toBuffer();
    }
    if (ext === '.png') {
      return await sharp(buffer).png({ compressionLevel: options.pngCompressionLevel }).toBuffer();
    }
    if (ext === '.webp') {
      return await sharp(buffer).webp({ quality: options.webpQuality }).toBuffer();
    }
    if (ext === '.avif') {
      return await sharp(buffer).avif({ quality: options.avifQuality }).toBuffer();
    }
  } catch {
    return buffer;
  }

  return buffer;
}

function getAttribute(tag: string, name: string): string | null {
  const regex = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(regex);
  return match ? (match[2] || match[3] || match[4] || null) : null;
}

function setAttribute(tag: string, name: string, value: string): string {
  const regex = new RegExp(`(\\s${name}\\s*=\\s*)("[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  if (regex.test(tag)) {
    return tag.replace(regex, `$1"${value}"`);
  }
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

function removeAttribute(tag: string, name: string): string {
  const regex = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  return tag.replace(regex, '');
}

async function replaceAsync(
  input: string,
  regex: RegExp,
  replacer: (...args: any[]) => Promise<string>
): Promise<string> {
  const matches: Array<{ start: number; end: number; replacement: string }> = [];
  let match: RegExpExecArray | null;

  const copy = new RegExp(regex.source, regex.flags);
  while ((match = copy.exec(input)) !== null) {
    const replacement = await replacer(...match);
    matches.push({ start: match.index, end: match.index + match[0].length, replacement });
  }

  if (matches.length === 0) return input;

  let result = '';
  let lastIndex = 0;
  for (const entry of matches) {
    result += input.slice(lastIndex, entry.start) + entry.replacement;
    lastIndex = entry.end;
  }
  result += input.slice(lastIndex);
  return result;
}
