/**
 * Parallax Effects
 *
 * requestAnimationFrame-driven parallax scrolling for layered elements.
 * Supports per-layer speed overrides and data-attribute configuration.
 */

export interface ParallaxLayerDefinition {
  /** CSS selector for this parallax layer */
  selector: string;
  /** Override scroll speed for this layer */
  speed?: number;
  /** Override base offset for this layer (in px) */
  offset?: number;
}

export interface ParallaxOptions {
  /** Base class applied to parallax layers */
  className?: string;
  /** Selector used to find parallax layers (defaults to .{className}) */
  selector?: string;
  /** Default scroll speed for layers */
  speed?: number;
  /** Minimum allowed speed (clamps data/overrides) */
  minSpeed?: number;
  /** Maximum allowed speed (clamps data/overrides) */
  maxSpeed?: number;
  /** Default offset in px */
  offset?: number;
  /** Optional explicit layer definitions */
  layers?: ParallaxLayerDefinition[];
  /** Data attribute used for per-layer speed overrides */
  dataSpeedAttribute?: string;
  /** Data attribute used for per-layer offset overrides */
  dataOffsetAttribute?: string;
  /** Respect prefers-reduced-motion */
  preferReducedMotion?: boolean;
}

export interface ParallaxScriptOptions extends ParallaxOptions {
  /** Wrap output in a <script> tag */
  includeScriptTag?: boolean;
}

export interface ParallaxLayerConfig {
  selector: string;
  speed?: number;
  offset?: number;
}

export interface ParallaxConfig {
  className: string;
  selector: string;
  speed: number;
  minSpeed: number;
  maxSpeed: number;
  offset: number;
  layers: ParallaxLayerConfig[];
  dataSpeedAttribute: string;
  dataOffsetAttribute: string;
  preferReducedMotion: boolean;
  includeScriptTag: boolean;
}

const DEFAULT_CLASSNAME = 'parallax-layer';
const DEFAULT_DATA_SPEED_ATTRIBUTE = 'data-parallax-speed';
const DEFAULT_DATA_OFFSET_ATTRIBUTE = 'data-parallax-offset';
const DEFAULT_SPEED = 0.2;
const DEFAULT_MIN_SPEED = -1.5;
const DEFAULT_MAX_SPEED = 1.5;
const DEFAULT_OFFSET = 0;

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeSpeedRange(minSpeed: number, maxSpeed: number): { min: number; max: number } {
  if (!Number.isFinite(minSpeed) || !Number.isFinite(maxSpeed)) {
    return { min: DEFAULT_MIN_SPEED, max: DEFAULT_MAX_SPEED };
  }

  return {
    min: Math.min(minSpeed, maxSpeed),
    max: Math.max(minSpeed, maxSpeed),
  };
}

function normalizeLayers(
  layers: ParallaxLayerDefinition[] | undefined,
  minSpeed: number,
  maxSpeed: number
): ParallaxLayerConfig[] {
  if (!layers || layers.length === 0) return [];

  return layers
    .filter((layer) => layer && typeof layer.selector === 'string' && layer.selector.trim().length > 0)
    .map((layer) => {
      const speed = isFiniteNumber(layer.speed) ? clampNumber(layer.speed, minSpeed, maxSpeed) : undefined;
      const offset = isFiniteNumber(layer.offset) ? layer.offset : undefined;
      return {
        selector: layer.selector,
        ...(speed !== undefined ? { speed } : {}),
        ...(offset !== undefined ? { offset } : {}),
      };
    });
}

export function resolveParallaxConfig(options: ParallaxScriptOptions = {}): ParallaxConfig {
  const className = options.className ?? DEFAULT_CLASSNAME;
  const selector = options.selector ?? `.${className}`;
  const dataSpeedAttribute = options.dataSpeedAttribute ?? DEFAULT_DATA_SPEED_ATTRIBUTE;
  const dataOffsetAttribute = options.dataOffsetAttribute ?? DEFAULT_DATA_OFFSET_ATTRIBUTE;

  const range = normalizeSpeedRange(
    isFiniteNumber(options.minSpeed) ? options.minSpeed : DEFAULT_MIN_SPEED,
    isFiniteNumber(options.maxSpeed) ? options.maxSpeed : DEFAULT_MAX_SPEED
  );

  const speed = clampNumber(
    isFiniteNumber(options.speed) ? options.speed : DEFAULT_SPEED,
    range.min,
    range.max
  );

  const offset = isFiniteNumber(options.offset) ? options.offset : DEFAULT_OFFSET;

  return {
    className,
    selector,
    speed,
    minSpeed: range.min,
    maxSpeed: range.max,
    offset,
    layers: normalizeLayers(options.layers, range.min, range.max),
    dataSpeedAttribute,
    dataOffsetAttribute,
    preferReducedMotion: options.preferReducedMotion ?? true,
    includeScriptTag: options.includeScriptTag ?? true,
  };
}

export function generateParallaxCSS(options: ParallaxOptions = {}): string {
  const config = resolveParallaxConfig(options);

  return `
    .${config.className} {
      transform: translate3d(0, 0, 0);
      will-change: transform;
      backface-visibility: hidden;
    }

    ${config.preferReducedMotion ? `
    @media (prefers-reduced-motion: reduce) {
      .${config.className} {
        transform: none !important;
        will-change: auto;
      }
    }
    ` : ''}
  `;
}

export function generateParallaxScript(options: ParallaxScriptOptions = {}): string {
  const config = resolveParallaxConfig(options);
  const script = `
  (function() {
    const config = ${JSON.stringify(config)};
    const root = document.documentElement;
    const layers = [];

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const parseNumber = (value) => {
      if (value === null || value === '') return null;
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const resolveSpeed = (element, override) => {
      if (typeof override === 'number' && Number.isFinite(override)) {
        return clamp(override, config.minSpeed, config.maxSpeed);
      }
      const attrValue = parseNumber(element.getAttribute(config.dataSpeedAttribute));
      if (attrValue !== null) {
        return clamp(attrValue, config.minSpeed, config.maxSpeed);
      }
      return clamp(config.speed, config.minSpeed, config.maxSpeed);
    };

    const resolveOffset = (element, override) => {
      if (typeof override === 'number' && Number.isFinite(override)) return override;
      const attrValue = parseNumber(element.getAttribute(config.dataOffsetAttribute));
      if (attrValue !== null) return attrValue;
      return config.offset;
    };

    const applyClassName = (element) => {
      if (config.className) {
        element.classList.add(config.className);
      }
    };

    const getBaseTransform = (element) => {
      const computed = window.getComputedStyle(element);
      return computed && computed.transform ? computed.transform : 'none';
    };

    const collectLayers = () => {
      const results = [];
      const addLayer = (element, overrides) => {
        if (!(element instanceof HTMLElement)) return;
        applyClassName(element);
        const speed = resolveSpeed(element, overrides && overrides.speed);
        const offset = resolveOffset(element, overrides && overrides.offset);
        const baseTransform = getBaseTransform(element);
        results.push({ element, speed, offset, baseTransform, last: null });
      };

      if (Array.isArray(config.layers) && config.layers.length > 0) {
        config.layers.forEach((layerDef) => {
          document.querySelectorAll(layerDef.selector).forEach((element) => {
            addLayer(element, layerDef);
          });
        });
      } else {
        document.querySelectorAll(config.selector).forEach((element) => {
          addLayer(element);
        });
      }

      return results;
    };

    const getScrollTop = () => window.pageYOffset || root.scrollTop || 0;

    let latestScroll = 0;
    let isTicking = false;

    const update = () => {
      isTicking = false;
      const scrollTop = latestScroll;
      for (let i = 0; i < layers.length; i += 1) {
        const layer = layers[i];
        const translate = Math.round((scrollTop * layer.speed + layer.offset) * 100) / 100;
        if (layer.last === translate) continue;
        layer.last = translate;
        const prefix = layer.baseTransform && layer.baseTransform !== 'none' ? layer.baseTransform + ' ' : '';
        layer.element.style.transform = prefix + 'translate3d(0, ' + translate + 'px, 0)';
      }
    };

    const requestTick = () => {
      if (!isTicking) {
        isTicking = true;
        window.requestAnimationFrame(update);
      }
    };

    const onScroll = () => {
      latestScroll = getScrollTop();
      requestTick();
    };

    const onResize = () => {
      latestScroll = getScrollTop();
      requestTick();
    };

    const init = () => {
      if (config.preferReducedMotion && window.matchMedia) {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (media.matches) return;
      }

      const collected = collectLayers();
      if (!collected.length) return;
      layers.push(...collected);

      latestScroll = getScrollTop();
      requestTick();

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
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
  DEFAULT_CLASSNAME as PARALLAX_LAYER_CLASSNAME,
  DEFAULT_DATA_SPEED_ATTRIBUTE as PARALLAX_SPEED_ATTRIBUTE,
  DEFAULT_DATA_OFFSET_ATTRIBUTE as PARALLAX_OFFSET_ATTRIBUTE,
  DEFAULT_SPEED as PARALLAX_DEFAULT_SPEED,
};
