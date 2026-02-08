/**
 * Animated Counter
 *
 * Scroll-triggered number animation with formatting.
 * Respects prefers-reduced-motion.
 *
 * Usage:
 * - Add `data-counter` and `data-target="1000"` to elements
 * - Optional: `data-format="comma|compact|percent|plain"` (default: comma)
 * - Optional: `data-decimals="2"` (default: 0)
 * - Call window.__animateCounter(el) when element enters viewport
 */

export interface CounterOptions {
  /** Animation duration in ms (default: 2000) */
  duration?: number;
  /** Custom easing function (default: easeOutCubic) */
  easing?: (t: number) => number;
}

export type CounterFormat = 'comma' | 'compact' | 'percent' | 'plain';

/**
 * Number formatters for different display styles
 */
const formatters: Record<CounterFormat, (n: number, decimals: number) => string> = {
  comma: (n: number, decimals: number) => n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }),
  compact: (n: number) => Intl.NumberFormat('en', { notation: 'compact' }).format(n),
  percent: (n: number, decimals: number) => n.toFixed(decimals) + '%',
  plain: (n: number, decimals: number) => n.toFixed(decimals),
};

/**
 * Default easing function (ease-out cubic)
 */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Animate a counter element from 0 to target value
 *
 * @param element - The element to animate
 * @param options - Configuration options
 */
export function animateCounter(element: HTMLElement, options: CounterOptions = {}): void {
  // Idempotent guard
  if (element.dataset.counted) return;
  element.dataset.counted = '1';

  const target = parseFloat(element.dataset.target || element.textContent || '0');
  const format = (element.dataset.format || 'comma') as CounterFormat;
  const decimals = parseInt(element.dataset.decimals || '0', 10);
  const duration = options.duration || 2000;
  const easing = options.easing || easeOutCubic;

  // Reduced motion: set final value immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = formatters[format](target, decimals);
    return;
  }

  const start = performance.now();

  const tick = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = target * easing(progress);

    element.textContent = formatters[format](current, decimals);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Ensure final value is exact
      element.textContent = formatters[format](target, decimals);
    }
  };

  requestAnimationFrame(tick);
}

/**
 * Initialize counters on all matching elements (immediate animation)
 *
 * Note: Typically you'd trigger this via IntersectionObserver instead
 *
 * @param selector - CSS selector (default: '[data-counter]')
 */
export function initCounters(selector = '[data-counter]'): void {
  document.querySelectorAll<HTMLElement>(selector).forEach(el => animateCounter(el));
}

/**
 * Generate inline script for counter effect
 *
 * This script defines window.__animateCounter which is called by the
 * unified reveal observer when counter elements enter viewport.
 *
 * @returns HTML script tag with counter initialization
 */
export function generateCounterScript(): string {
  return `<script>
(function() {
  var formatters = {
    comma: function(n, d) {
      return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    },
    compact: function(n) {
      return Intl.NumberFormat('en', { notation: 'compact' }).format(n);
    },
    percent: function(n, d) {
      return n.toFixed(d) + '%';
    },
    plain: function(n, d) {
      return n.toFixed(d);
    }
  };

  var animate = function(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target = parseFloat(el.dataset.target || el.textContent || '0');
    var format = el.dataset.format || 'comma';
    var decimals = parseInt(el.dataset.decimals || '0', 10);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = formatters[format](target, decimals);
      return;
    }

    var duration = 2000;
    var start = performance.now();
    var ease = function(t) { return 1 - Math.pow(1 - t, 3); };

    var tick = function(now) {
      var progress = Math.min((now - start) / duration, 1);
      el.textContent = formatters[format](target * ease(progress), decimals);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatters[format](target, decimals);
      }
    };
    requestAnimationFrame(tick);
  };

  window.__animateCounter = animate;
})();
</script>`;
}
