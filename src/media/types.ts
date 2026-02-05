export interface BeforeAfterOptions {
  beforeImagePath: string;
  afterImagePath: string;
  outputPath?: string;
  width?: number;
  height?: number;
  frameDelay?: number; // ms between frames
  transitionFrames?: number; // number of frames for crossfade
  holdFrames?: number; // frames to hold on each image
  loop?: boolean;
}

export interface BeforeAfterResult {
  gifPath: string;
  width: number;
  height: number;
  fileSize: number;
  frameCount: number;
  duration: number; // total duration in ms
}

export interface MediaStorageOptions {
  bucket: string;
  folder?: string;
}

export interface StoredMedia {
  url: string;
  path: string;
  bucket: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export interface GalleryVideoOptions {
  themePaths: string[]; // paths to theme HTML files
  themeNames: string[];
  outputPath?: string;
  width?: number;
  height?: number;
  fps?: number;
  durationPerTheme?: number; // seconds per theme
  transitionDuration?: number; // seconds for transition
  includeTitle?: boolean;
  businessName?: string;
}

export interface GalleryVideoResult {
  videoPath: string;
  thumbnailPath: string;
  width: number;
  height: number;
  duration: number;
  fileSize: number;
  fps: number;
}

export interface MediaAsset {
  id: string;
  leadId: string;
  type: 'before_after_gif' | 'gallery_video' | 'thumbnail' | 'screenshot' | 'theme_grid';
  url: string;
  localPath?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ThemeGridOptions {
  galleryDir: string;
  businessName: string;
  themeCount?: number;
  outputPath?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

export interface ThemeGridResult {
  gridPath: string;
  width: number;
  height: number;
  fileSize: number;
  themeCount: number;
  themeNames: string[];
}

export type StockProvider = 'unsplash' | 'pexels';

export type MediaProviderPreference = StockProvider | 'auto' | 'mixed';

export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface StockImage {
  id: string;
  provider: StockProvider;
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  description?: string;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  downloadUrl?: string;
}

export interface MediaFetchOptions {
  industry: string;
  vibe?: string;
  count?: number;
  orientation?: ImageOrientation;
  provider?: MediaProviderPreference;
  keywords?: string[];
}

export interface MediaFetchResult {
  query: string;
  provider: StockProvider | 'mixed';
  images: StockImage[];
  warnings: string[];
}

export interface MediaFetcherConfig {
  unsplashAccessKey?: string;
  pexelsApiKey?: string;
  defaultProvider?: MediaProviderPreference;
  timeoutMs?: number;
}
