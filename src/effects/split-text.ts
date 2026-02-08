/**
 * Split Text
 *
 * Wraps words/characters for stagger animations.
 * Idempotent, accessible, CSS-driven.
 *
 * Usage:
 * - Add `data-reveal="split"` to elements
 * - Call initSplitText() or include generateSplitTextScript() in page
 * - CSS handles animation via .reveal-text and .word classes
 */

export interface SplitTextOptions {
  /** Split by 'words' or 'chars' (default: 'words') */
  type?: 'words' | 'chars';
  /** Class added to the container (default: 'reveal-text') */
  className?: string;
}

/**
 * Split a single element's text content into animated spans
 *
 * Features:
 * - Idempotent: Will not re-split already processed elements
 * - Accessible: Preserves original text in aria-label
 * - CSS-driven: JS only sets up DOM, CSS handles animation
 *
 * @param element - The element to split
 * @param options - Configuration options
 */
export function splitText(element: HTMLElement, options: SplitTextOptions = {}): void {
  const { type = 'words', className = 'reveal-text' } = options;

  // Idempotent guard - don't re-split
  if (element.dataset.split) return;
  element.dataset.split = '1';

  const text = element.textContent || '';

  // Store original text for accessibility
  element.setAttribute('aria-label', text);

  // Split and wrap
  const items = type === 'words' ? text.split(/\s+/) : text.split('');
  const separator = type === 'words' ? ' ' : '';

  element.innerHTML = items
    .map((item, i) => `<span class="word" style="--i:${i}" aria-hidden="true">${item}</span>`)
    .join(separator);

  element.classList.add(className, 'fx');
}

/**
 * Initialize split text on all matching elements
 *
 * @param selector - CSS selector (default: '[data-reveal="split"]')
 * @param options - Configuration options
 */
export function initSplitText(selector = '[data-reveal="split"]', options: SplitTextOptions = {}): void {
  document.querySelectorAll<HTMLElement>(selector).forEach(el => splitText(el, options));
}

/**
 * Generate inline script for split text effect
 *
 * @returns HTML script tag with split text initialization
 */
export function generateSplitTextScript(): string {
  return `<script>
(function() {
  var split = function(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    var text = el.textContent || '';
    el.setAttribute('aria-label', text);
    var words = text.split(/\\s+/);
    el.innerHTML = words.map(function(w, i) {
      return '<span class="word" style="--i:' + i + '" aria-hidden="true">' + w + '</span>';
    }).join(' ');
    el.classList.add('reveal-text', 'fx');
  };
  document.querySelectorAll('[data-reveal="split"]').forEach(split);
})();
</script>`;
}
