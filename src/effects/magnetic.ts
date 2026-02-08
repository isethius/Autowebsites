/**
 * Magnetic Button Effect
 *
 * rAF-smoothed magnetic pull toward cursor.
 * Disabled on coarse pointers and reduced motion.
 *
 * Usage:
 * - Add `.btn-magnetic` class to elements
 * - Call initMagnetic() or include generateMagneticScript() in page
 */

export interface MagneticOptions {
  /** Pull strength: 0.2 = subtle, 0.5 = strong (default: 0.3) */
  strength?: number;
  /** Lerp smoothing factor: 0.1 = smooth, 0.3 = snappy (default: 0.15) */
  smoothing?: number;
}

/**
 * Initialize magnetic effect on elements matching selector
 *
 * @param selector - CSS selector for magnetic elements
 * @param options - Configuration options
 */
export function initMagnetic(selector = '.btn-magnetic', options: MagneticOptions = {}): void {
  const { strength = 0.3, smoothing = 0.15 } = options;

  // Capability check - disable on reduced motion or coarse pointer (touch)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReducedMotion || isCoarsePointer) return;

  const elements = document.querySelectorAll<HTMLElement>(selector);

  elements.forEach(el => {
    let rect: DOMRect;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId: number | null = null;

    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      currentX = lerp(currentX, targetX, smoothing);
      currentY = lerp(currentY, targetY, smoothing);

      el.style.setProperty('--mx', `${currentX}px`);
      el.style.setProperty('--my', `${currentY}px`);

      // Stop animation when settled at rest position
      if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1) {
        if (targetX === 0 && targetY === 0) {
          rafId = null;
          return;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    el.addEventListener('pointerenter', () => {
      rect = el.getBoundingClientRect();
      el.classList.add('is-hovering', 'fx');
      if (!rafId) rafId = requestAnimationFrame(animate);
    });

    el.addEventListener('pointermove', (e) => {
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = (e.clientX - centerX) * strength;
      targetY = (e.clientY - centerY) * strength;
    });

    el.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      el.classList.remove('is-hovering');
    });
  });
}

/**
 * Generate inline script for magnetic effect
 *
 * @param options - Configuration options
 * @returns HTML script tag with magnetic initialization
 */
export function generateMagneticScript(options: MagneticOptions = {}): string {
  const { strength = 0.3, smoothing = 0.15 } = options;

  return `<script>
(function() {
  var strength = ${strength};
  var smoothing = ${smoothing};

  // Capability check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var elements = document.querySelectorAll('.btn-magnetic');

  elements.forEach(function(el) {
    var rect;
    var targetX = 0, targetY = 0;
    var currentX = 0, currentY = 0;
    var rafId = null;

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function animate() {
      currentX = lerp(currentX, targetX, smoothing);
      currentY = lerp(currentY, targetY, smoothing);

      el.style.setProperty('--mx', currentX + 'px');
      el.style.setProperty('--my', currentY + 'px');

      if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1) {
        if (targetX === 0 && targetY === 0) {
          rafId = null;
          return;
        }
      }
      rafId = requestAnimationFrame(animate);
    }

    el.addEventListener('pointerenter', function() {
      rect = el.getBoundingClientRect();
      el.classList.add('is-hovering', 'fx');
      if (!rafId) rafId = requestAnimationFrame(animate);
    });

    el.addEventListener('pointermove', function(e) {
      if (!rect) return;
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      targetX = (e.clientX - centerX) * strength;
      targetY = (e.clientY - centerY) * strength;
    });

    el.addEventListener('pointerleave', function() {
      targetX = 0;
      targetY = 0;
      el.classList.remove('is-hovering');
    });
  });
})();
</script>`;
}
