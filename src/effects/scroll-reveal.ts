/**
 * Scroll Reveal
 *
 * IntersectionObserver-based scroll animations for fade, slide, and scale effects.
 * Provides CSS and script helpers with configurable thresholds and durations.
 */

export type ScrollRevealEffect = 'fade' | 'slide' | 'scale';

export interface ScrollRevealOptions {
  /** Base class applied to all reveal elements */
  className?: string;
  /** Class added when an element is revealed */
  visibleClassName?: string;
  /** Default effect to apply when no per-element override exists */
  effect?: ScrollRevealEffect;
  /** DOM selector used to find elements to observe */
  selector?: string;
  /** IntersectionObserver threshold(s) */
  threshold?: number | number[];
  /** IntersectionObserver root margin */
  rootMargin?: string;
  /** Animation duration in milliseconds */
  duration?: number;
  /** CSS easing function */
  easing?: string;
  /** Translate distance for slide effect */
  distance?: string;
  /** Initial scale for scale effect */
  scale?: number;
  /** Only reveal once (unobserve after first intersection) */
  once?: boolean;
  /** Data attribute used for per-element effect overrides */
  dataAttribute?: string;
  /** Respect prefers-reduced-motion */
  preferReducedMotion?: boolean;
}

export interface ScrollRevealScriptOptions extends ScrollRevealOptions {
  /** Wrap output in a <script> tag */
  includeScriptTag?: boolean;
}

export interface ScrollRevealConfig {
  className: string;
  visibleClassName: string;
  effect: ScrollRevealEffect;
  selector: string;
  threshold: number | number[];
  rootMargin: string;
  duration: number;
  easing: string;
  distance: string;
  scale: number;
  once: boolean;
  dataAttribute: string;
  preferReducedMotion: boolean;
  includeScriptTag: boolean;
}

const DEFAULT_CLASSNAME = 'scroll-reveal';
const DEFAULT_VISIBLE_CLASSNAME = 'scroll-reveal--visible';
const DEFAULT_DATA_ATTRIBUTE = 'data-scroll-reveal';
const DEFAULT_THRESHOLD = 0.15;
const DEFAULT_DURATION = 600;
const DEFAULT_EASING = 'cubic-bezier(0.2, 0.6, 0.2, 1)';
const DEFAULT_DISTANCE = '24px';
const DEFAULT_SCALE = 0.96;

const VALID_EFFECTS: ScrollRevealEffect[] = ['fade', 'slide', 'scale'];

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeThreshold(input: number | number[] | undefined): number | number[] {
  if (Array.isArray(input)) {
    const normalized = input
      .map((value) => clampNumber(value, 0, 1))
      .filter((value) => Number.isFinite(value));
    return normalized.length > 0 ? normalized : DEFAULT_THRESHOLD;
  }

  if (typeof input === 'number') {
    return clampNumber(input, 0, 1);
  }

  return DEFAULT_THRESHOLD;
}

function normalizeDuration(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_DURATION;
  return Math.max(0, value as number);
}

function normalizeScale(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_SCALE;
  return clampNumber(value as number, 0.5, 1);
}

export function resolveScrollRevealConfig(options: ScrollRevealScriptOptions = {}): ScrollRevealConfig {
  const className = options.className ?? DEFAULT_CLASSNAME;
  const visibleClassName = options.visibleClassName ?? `${className}--visible`;
  const effect = options.effect ?? 'fade';

  return {
    className,
    visibleClassName,
    effect: VALID_EFFECTS.includes(effect) ? effect : 'fade',
    selector: options.selector ?? `.${className}`,
    threshold: normalizeThreshold(options.threshold),
    rootMargin: options.rootMargin ?? '0px',
    duration: normalizeDuration(options.duration),
    easing: options.easing ?? DEFAULT_EASING,
    distance: options.distance ?? DEFAULT_DISTANCE,
    scale: normalizeScale(options.scale),
    once: options.once ?? true,
    dataAttribute: options.dataAttribute ?? DEFAULT_DATA_ATTRIBUTE,
    preferReducedMotion: options.preferReducedMotion ?? true,
    includeScriptTag: options.includeScriptTag ?? true,
  };
}

export function generateScrollRevealCSS(options: ScrollRevealOptions = {}): string {
  const config = resolveScrollRevealConfig(options);

  return `
    .${config.className} {
      opacity: 0;
      transform: none;
      transition-property: opacity, transform;
      transition-duration: ${config.duration}ms;
      transition-timing-function: ${config.easing};
      will-change: opacity, transform;
    }

    .${config.className}--fade {
      transform: none;
    }

    .${config.className}--slide {
      transform: translateY(${config.distance});
    }

    .${config.className}--scale {
      transform: scale(${config.scale});
    }

    .${config.visibleClassName} {
      opacity: 1;
      transform: none;
    }

    ${config.preferReducedMotion ? `
    @media (prefers-reduced-motion: reduce) {
      .${config.className},
      .${config.visibleClassName} {
        opacity: 1;
        transform: none;
        transition: none;
      }
    }
    ` : ''}
  `;
}

export function generateScrollRevealScript(options: ScrollRevealScriptOptions = {}): string {
  const config = resolveScrollRevealConfig(options);
  const script = `
  (function() {
    const selector = ${JSON.stringify(config.selector)};
    const baseClass = ${JSON.stringify(config.className)};
    const visibleClass = ${JSON.stringify(config.visibleClassName)};
    const dataAttr = ${JSON.stringify(config.dataAttribute)};
    const defaultEffect = ${JSON.stringify(config.effect)};
    const effectPrefix = ${JSON.stringify(`${config.className}--`)};
    const once = ${config.once};
    const threshold = ${JSON.stringify(config.threshold)};
    const rootMargin = ${JSON.stringify(config.rootMargin)};
    const preferReducedMotion = ${config.preferReducedMotion};
    const effects = ['fade', 'slide', 'scale'];

    const init = () => {
      const elements = Array.from(document.querySelectorAll(selector));
      if (!elements.length) return;

      const applyEffectClass = (element) => {
        element.classList.add(baseClass);
        const attr = (element.getAttribute(dataAttr) || '').toLowerCase();
        const effect = effects.includes(attr) ? attr : defaultEffect;
        element.classList.add(effectPrefix + effect);
      };

      const reveal = (element) => {
        element.classList.add(visibleClass);
      };

      elements.forEach(applyEffectClass);

      if (preferReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elements.forEach(reveal);
        return;
      }

      if (!('IntersectionObserver' in window)) {
        elements.forEach(reveal);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            reveal(entry.target);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove(visibleClass);
          }
        });
      }, { threshold, rootMargin });

      elements.forEach((element) => observer.observe(element));
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  `.trim();

  return config.includeScriptTag ? `<script>${script}</script>` : script;
}

export {
  DEFAULT_CLASSNAME as SCROLL_REVEAL_CLASSNAME,
  DEFAULT_VISIBLE_CLASSNAME as SCROLL_REVEAL_VISIBLE_CLASSNAME,
  DEFAULT_DATA_ATTRIBUTE as SCROLL_REVEAL_DATA_ATTRIBUTE,
};

// =============================================================================
// UNIFIED REVEAL OBSERVER
// =============================================================================

/**
 * Generate the unified reveal script
 *
 * This single observer handles:
 * 1. data-reveal elements (up, scale, fade, split)
 * 2. data-counter elements (triggers window.__animateCounter)
 * 3. Split text initialization
 *
 * Uses CSS-driven state - just adds .is-visible class and lets CSS handle animation.
 *
 * @returns HTML script tag with unified reveal initialization
 */
export function generateUnifiedRevealScript(): string {
  return `<script>
(function() {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var handleElement = function(el) {
    // Add .fx if data-reveal
    if (el.dataset.reveal) el.classList.add('fx');

    // Split text
    if (el.dataset.reveal === 'split' && !el.dataset.split) {
      el.dataset.split = '1';
      var text = el.textContent || '';
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\\s+/).map(function(w, i) {
        return '<span class="word" style="--i:' + i + '" aria-hidden="true">' + w + '</span>';
      }).join(' ');
      el.classList.add('reveal-text');
    }
  };

  var reveal = function(el) {
    el.classList.add('is-visible');

    // Trigger counter if applicable
    if (el.dataset.counter !== undefined && window.__animateCounter) {
      window.__animateCounter(el);
    }
  };

  var elements = document.querySelectorAll('[data-reveal], [data-counter]');
  elements.forEach(handleElement);

  if (prefersReducedMotion) {
    elements.forEach(reveal);
    return;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(function(el) { observer.observe(el); });
})();
</script>`;
}
