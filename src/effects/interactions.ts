/**
 * Unified Interaction Module
 *
 * Exports all interaction effects for Awwwards-level animations.
 *
 * Architecture Principles:
 * 1. Opt-in composition - Only .fx elements get GPU compositing
 * 2. Capability gates - Hover only for hover:hover, magnetism disabled on coarse pointers
 * 3. CSS-driven state - JS toggles classes, CSS handles transitions
 * 4. Idempotent transforms - Split-text guards against re-wrap
 * 5. rAF smoothing - Magnetism uses lerp loop, not direct set
 * 6. Accessibility first - prefers-reduced-motion shows final states, not hidden
 */

// Re-export all effect modules
export {
  initMagnetic,
  generateMagneticScript,
  type MagneticOptions,
} from './magnetic';

export {
  splitText,
  initSplitText,
  generateSplitTextScript,
  type SplitTextOptions,
} from './split-text';

export {
  animateCounter,
  initCounters,
  generateCounterScript,
  type CounterOptions,
  type CounterFormat,
} from './counter';

export {
  generateUnifiedRevealScript,
  generateScrollRevealCSS,
  generateScrollRevealScript,
  type ScrollRevealOptions,
  type ScrollRevealEffect,
} from './scroll-reveal';

// Re-export hover and interaction layer CSS generators from dna-styles
// (These are in dna-styles.ts because they're part of the DNA system)

/**
 * Motion DNA to effects mapping
 *
 * M1: Subtle - fade reveals only
 * M2: Moderate - + magnetic buttons, slide reveals
 * M3: Dramatic - + split text, counters, full animation suite
 */
export const MOTION_TO_EFFECTS: Record<string, {
  reveal: 'fade' | 'up' | 'scale';
  magnetic: boolean;
  splitText: boolean;
  counters: boolean;
}> = {
  M1: { reveal: 'fade', magnetic: false, splitText: false, counters: false },
  M2: { reveal: 'up', magnetic: true, splitText: false, counters: true },
  M3: { reveal: 'up', magnetic: true, splitText: true, counters: true },
};

/**
 * Get effect configuration for a motion DNA code
 */
export function getEffectsForMotion(motion: string) {
  return MOTION_TO_EFFECTS[motion] || MOTION_TO_EFFECTS.M1;
}
