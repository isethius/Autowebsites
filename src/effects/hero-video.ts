/**
 * Hero Video Backgrounds
 *
 * Utilities for rendering video-backed hero sections with autoplay, mute,
 * loop, and poster fallbacks. Includes mobile and reduced-motion optimizations.
 */

export type HeroVideoPreload = 'auto' | 'metadata' | 'none';

export interface HeroVideoSource {
  src: string;
  type?: string;
  media?: string;
}

export interface HeroVideoOptions {
  /** Video sources ordered by preference (e.g., webm, mp4) */
  sources?: HeroVideoSource[];
  /** Poster image shown before playback and as a fallback */
  poster?: string;
  /** Optional mobile-optimized poster image */
  posterMobile?: string;
  /** Autoplay the video (requires muted on most browsers) */
  autoplay?: boolean;
  /** Mute the video (recommended for autoplay) */
  muted?: boolean;
  /** Loop the video */
  loop?: boolean;
  /** Allow inline playback on iOS */
  playsInline?: boolean;
  /** Preload strategy for performance */
  preload?: HeroVideoPreload;
  /** Container class name */
  className?: string;
  /** Video element class name */
  videoClassName?: string;
  /** Overlay element class name */
  overlayClassName?: string;
  /** Class name to apply to hero content wrapper */
  contentClassName?: string;
  /** Overlay color for legibility */
  overlayColor?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Background color while video loads */
  fallbackColor?: string;
  /** Disable video playback on mobile breakpoints */
  disableOnMobile?: boolean;
  /** Mobile breakpoint for disabling video */
  mobileBreakpoint?: number;
  /** Respect prefers-reduced-motion by hiding video */
  preferReducedMotion?: boolean;
  /** Object fit mode for the video */
  objectFit?: 'cover' | 'contain';
  /** Object position for the video */
  objectPosition?: string;
}

export interface HeroVideoConfig extends Required<Omit<HeroVideoOptions, 'sources'>> {
  sources: HeroVideoSource[];
}

const DEFAULT_CLASSNAME = 'hero-video';
const DEFAULT_VIDEO_CLASSNAME = 'hero-video-media';
const DEFAULT_OVERLAY_CLASSNAME = 'hero-video-overlay';
const DEFAULT_CONTENT_CLASSNAME = 'hero-video-content';
const DEFAULT_MOBILE_BREAKPOINT = 900;

function clampOpacity(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeCssUrl(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toCssUrl(value?: string): string | null {
  if (!value) return null;
  return `url("${escapeCssUrl(value)}")`;
}

function buildAttributeString(attributes: Record<string, string | boolean | undefined>): string {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => {
      if (value === true) return key;
      return `${key}="${escapeAttribute(String(value))}"`;
    })
    .join(' ');
}

function buildSourceMarkup(sources: HeroVideoSource[]): string {
  if (!sources || sources.length === 0) return '';
  return sources
    .map((source) => {
      const attrs = buildAttributeString({
        src: source.src,
        type: source.type,
        media: source.media,
      });
      return `<source ${attrs} />`;
    })
    .join('\n');
}

export function resolveHeroVideoConfig(options: HeroVideoOptions = {}): HeroVideoConfig {
  const autoplay = options.autoplay ?? true;
  let muted = options.muted ?? true;

  if (autoplay && !muted) {
    muted = true;
  }

  return {
    sources: options.sources ?? [],
    poster: options.poster ?? '',
    posterMobile: options.posterMobile ?? '',
    autoplay,
    muted,
    loop: options.loop ?? true,
    playsInline: options.playsInline ?? true,
    preload: options.preload ?? 'metadata',
    className: options.className ?? DEFAULT_CLASSNAME,
    videoClassName: options.videoClassName ?? DEFAULT_VIDEO_CLASSNAME,
    overlayClassName: options.overlayClassName ?? DEFAULT_OVERLAY_CLASSNAME,
    contentClassName: options.contentClassName ?? DEFAULT_CONTENT_CLASSNAME,
    overlayColor: options.overlayColor ?? '#000000',
    overlayOpacity: clampOpacity(options.overlayOpacity ?? 0.35),
    fallbackColor: options.fallbackColor ?? '#0b0b0b',
    disableOnMobile: options.disableOnMobile ?? true,
    mobileBreakpoint: options.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT,
    preferReducedMotion: options.preferReducedMotion ?? true,
    objectFit: options.objectFit ?? 'cover',
    objectPosition: options.objectPosition ?? 'center',
  };
}

export function generateHeroVideoHTML(options: HeroVideoOptions = {}): string {
  const config = resolveHeroVideoConfig(options);
  const videoAttributes = buildAttributeString({
    class: config.videoClassName,
    autoplay: config.autoplay,
    muted: config.muted,
    loop: config.loop,
    playsinline: config.playsInline,
    'webkit-playsinline': config.playsInline,
    preload: config.preload,
    poster: config.poster || undefined,
    'aria-hidden': 'true',
    tabindex: '-1',
  });

  const sourcesMarkup = buildSourceMarkup(config.sources);
  const overlayMarkup = config.overlayOpacity > 0 ? `<div class="${config.overlayClassName}"></div>` : '';
  const videoMarkup = sourcesMarkup
    ? `<video ${videoAttributes}>
${sourcesMarkup}
    </video>`
    : '';

  return `
    <div class="${config.className}">
      ${videoMarkup}
      ${overlayMarkup}
    </div>
  `;
}

export function generateHeroVideoCSS(options: HeroVideoOptions = {}): string {
  const config = resolveHeroVideoConfig(options);
  const posterUrl = toCssUrl(config.poster);
  const posterMobileUrl = toCssUrl(config.posterMobile || config.poster);

  return `
    .${config.className} {
      position: relative;
      overflow: hidden;
      background-color: ${config.fallbackColor};
      ${posterUrl ? `background-image: ${posterUrl};` : ''}
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
      isolation: isolate;
    }

    .${config.className} .${config.videoClassName} {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: ${config.objectFit};
      object-position: ${config.objectPosition};
      z-index: 0;
      pointer-events: none;
    }

    .${config.className} .${config.overlayClassName} {
      position: absolute;
      inset: 0;
      background: ${config.overlayColor};
      opacity: ${config.overlayOpacity};
      z-index: 1;
      pointer-events: none;
    }

    .${config.className} .${config.contentClassName} {
      position: relative;
      z-index: 2;
    }

    ${config.preferReducedMotion ? `
    @media (prefers-reduced-motion: reduce) {
      .${config.className} .${config.videoClassName} {
        display: none;
      }
    }
    ` : ''}

    ${config.disableOnMobile ? `
    @media (max-width: ${config.mobileBreakpoint}px) {
      .${config.className} .${config.videoClassName} {
        display: none;
      }
      ${posterMobileUrl ? `
      .${config.className} {
        background-image: ${posterMobileUrl};
      }
      ` : ''}
    }
    ` : ''}
  `;
}

export {
  DEFAULT_CLASSNAME as HERO_VIDEO_CLASSNAME,
  DEFAULT_VIDEO_CLASSNAME as HERO_VIDEO_MEDIA_CLASSNAME,
  DEFAULT_OVERLAY_CLASSNAME as HERO_VIDEO_OVERLAY_CLASSNAME,
  DEFAULT_CONTENT_CLASSNAME as HERO_VIDEO_CONTENT_CLASSNAME,
};
