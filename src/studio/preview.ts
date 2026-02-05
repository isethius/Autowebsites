type MaybePromise<T> = T | Promise<T>;

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

export interface PreviewViewportSettings {
  width: number | string;
  height?: number | string;
  className?: string;
}

export interface UrlPreviewContent {
  type: 'url';
  url: string;
}

export interface HtmlPreviewContent {
  type: 'html';
  html: string;
  baseUrl?: string;
}

export type PreviewContent = UrlPreviewContent | HtmlPreviewContent;

export interface PreviewSource {
  get: () => MaybePromise<PreviewContent>;
  regenerate?: () => MaybePromise<PreviewContent>;
}

export interface PreviewStyleUpdate {
  variables?: Record<string, string | null>;
  css?: string;
  mode?: 'merge' | 'replace';
  appendCss?: boolean;
}

export interface LivePreviewOptions {
  iframe: HTMLIFrameElement | string;
  source?: PreviewSource;
  initialViewport?: PreviewViewport;
  viewports?: Partial<Record<PreviewViewport, Partial<PreviewViewportSettings>>>;
  autoLoad?: boolean;
  applyInlineStyles?: boolean;
  applyClassNames?: boolean;
  classPrefix?: string;
  styleTarget?: string;
  styleElementId?: string;
  variablePrefix?: string | null;
  allowMessaging?: boolean;
  messageType?: string;
  messageTargetOrigin?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface LivePreviewController {
  iframe: HTMLIFrameElement;
  getViewport: () => PreviewViewport;
  setViewport: (viewport: PreviewViewport) => void;
  refresh: () => Promise<void>;
  regenerate: () => Promise<void>;
  updateStyles: (update: PreviewStyleUpdate) => void;
  setSource: (source: PreviewSource | null, options?: { load?: boolean }) => Promise<void>;
  setUrl: (url: string, options?: { forceReload?: boolean }) => Promise<void>;
  setHtml: (html: string, options?: { baseUrl?: string; forceReload?: boolean }) => Promise<void>;
  destroy: () => void;
}

const DEFAULT_VIEWPORTS: Record<PreviewViewport, PreviewViewportSettings> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: 768, height: '100%' },
  mobile: { width: 375, height: '100%' },
};

const DEFAULT_STYLE_ELEMENT_ID = 'autowebsites-preview-style';
const DEFAULT_MESSAGE_TYPE = 'autowebsites:preview-style';

function assertBrowser(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Live preview requires a browser environment');
  }
}

function resolveIframe(target: HTMLIFrameElement | string): HTMLIFrameElement {
  if (typeof target === 'string') {
    const element = document.querySelector(target);
    if (!element) {
      throw new Error(`Preview iframe not found for selector "${target}"`);
    }
    if (!(element instanceof HTMLIFrameElement)) {
      throw new Error('Preview target is not an iframe element');
    }
    return element;
  }
  return target;
}

function resolveViewports(
  overrides?: Partial<Record<PreviewViewport, Partial<PreviewViewportSettings>>>
): Record<PreviewViewport, PreviewViewportSettings> {
  return {
    desktop: { ...DEFAULT_VIEWPORTS.desktop, ...(overrides?.desktop || {}) },
    tablet: { ...DEFAULT_VIEWPORTS.tablet, ...(overrides?.tablet || {}) },
    mobile: { ...DEFAULT_VIEWPORTS.mobile, ...(overrides?.mobile || {}) },
  };
}

function appendCacheBust(url: string, token: string): string {
  const [base, hash] = url.split('#');
  const hasParam = /([?&])__preview=/.test(base);
  const updated = hasParam
    ? base.replace(/([?&])__preview=[^&]*/, `$1__preview=${token}`)
    : `${base}${base.includes('?') ? '&' : '?'}__preview=${token}`;
  return hash ? `${updated}#${hash}` : updated;
}

function injectBaseTag(html: string, baseUrl: string): string {
  if (/<base\b/i.test(html)) {
    return html;
  }

  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch && typeof headMatch.index === 'number') {
    const insertAt = headMatch.index + headMatch[0].length;
    return `${html.slice(0, insertAt)}<base href="${baseUrl}">${html.slice(insertAt)}`;
  }

  return `<head><base href="${baseUrl}"></head>${html}`;
}

function getFrameDocument(iframe: HTMLIFrameElement): Document | null {
  try {
    return iframe.contentWindow?.document || null;
  } catch {
    return null;
  }
}

function normalizeContent(content: PreviewContent): PreviewContent {
  if (content && content.type === 'url' && typeof content.url === 'string') {
    return content;
  }
  if (content && content.type === 'html' && typeof content.html === 'string') {
    return content;
  }
  throw new Error('Preview content must include a valid url or html payload');
}

export function createLivePreview(options: LivePreviewOptions): LivePreviewController {
  assertBrowser();

  const iframe = resolveIframe(options.iframe);
  const viewports = resolveViewports(options.viewports);
  const applyInlineStyles = options.applyInlineStyles !== false;
  const applyClassNames = options.applyClassNames === true;
  const classPrefix = options.classPrefix || 'preview-viewport';
  const styleTarget = options.styleTarget || ':root';
  const styleElementId = options.styleElementId || DEFAULT_STYLE_ELEMENT_ID;
  const variablePrefix = options.variablePrefix === undefined ? '--' : options.variablePrefix;
  const allowMessaging = options.allowMessaging !== false;
  const messageType = options.messageType || DEFAULT_MESSAGE_TYPE;
  const messageTargetOrigin = options.messageTargetOrigin || '*';
  const autoLoad = options.autoLoad !== false;

  let currentViewport: PreviewViewport = options.initialViewport || 'desktop';
  let currentContent: PreviewContent | null = null;
  let source: PreviewSource | null = options.source || null;
  let viewportClasses: string[] = [];
  const styleState: { variables: Record<string, string | null>; css: string | null } = {
    variables: {},
    css: null,
  };
  const appliedVariables = new Set<string>();

  const handleLoad = () => {
    applyStyles();
    options.onLoad?.();
  };

  const handleError = () => {
    options.onError?.(new Error('Live preview failed to load'));
  };

  iframe.addEventListener('load', handleLoad);
  iframe.addEventListener('error', handleError);

  function getViewport(): PreviewViewport {
    return currentViewport;
  }

  function applyViewport(viewport: PreviewViewport): void {
    const config = viewports[viewport];
    iframe.dataset.viewport = viewport;

    if (applyInlineStyles && config) {
      iframe.style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
      if (config.height !== undefined) {
        iframe.style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
      }
      if (typeof config.width === 'number') {
        iframe.style.maxWidth = '100%';
      }
    }

    if (applyClassNames) {
      viewportClasses.forEach(className => iframe.classList.remove(className));
      const classes: string[] = [];
      if (classPrefix) {
        classes.push(`${classPrefix}-${viewport}`);
      }
      if (config?.className) {
        classes.push(config.className);
      }
      classes.forEach(className => iframe.classList.add(className));
      viewportClasses = classes;
    }
  }

  function setViewport(viewport: PreviewViewport): void {
    currentViewport = viewport;
    applyViewport(viewport);
  }

  function waitForLoad(): Promise<void> {
    return new Promise(resolve => {
      const onLoad = () => {
        iframe.removeEventListener('load', onLoad);
        resolve();
      };
      iframe.addEventListener('load', onLoad);
    });
  }

  function normalizeVariableName(name: string): string {
    const trimmed = name.trim();
    if (!variablePrefix) {
      return trimmed;
    }
    if (trimmed.startsWith('--')) {
      return trimmed;
    }
    return `${variablePrefix}${trimmed}`;
  }

  function applyStylesToDocument(doc: Document): boolean {
    let target = doc.documentElement;
    if (styleTarget !== ':root') {
      try {
        target = (doc.querySelector(styleTarget) as HTMLElement | null) || doc.documentElement;
      } catch {
        target = doc.documentElement;
      }
    }

    const nextKeys = new Set(Object.keys(styleState.variables));
    appliedVariables.forEach((key) => {
      if (!nextKeys.has(key)) {
        target.style.removeProperty(key);
      }
    });

    Object.entries(styleState.variables).forEach(([key, value]) => {
      if (value === null) {
        target.style.removeProperty(key);
      } else {
        target.style.setProperty(key, value);
      }
    });

    appliedVariables.clear();
    nextKeys.forEach((key) => appliedVariables.add(key));

    if (styleState.css !== null) {
      const head = doc.head || doc.getElementsByTagName('head')[0];
      if (!head) {
        return true;
      }
      let styleEl = doc.getElementById(styleElementId) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = styleElementId;
        head.appendChild(styleEl);
      }
      styleEl.textContent = styleState.css;
    }

    return true;
  }

  function sendStyleMessage(): void {
    if (!allowMessaging || !iframe.contentWindow) {
      return;
    }
    iframe.contentWindow.postMessage(
      { type: messageType, payload: { variables: styleState.variables, css: styleState.css } },
      messageTargetOrigin
    );
  }

  function applyStyles(): void {
    const doc = getFrameDocument(iframe);
    if (doc) {
      applyStylesToDocument(doc);
      return;
    }
    sendStyleMessage();
  }

  function updateStyles(update: PreviewStyleUpdate): void {
    const mode = update.mode || 'merge';
    if (mode === 'replace') {
      styleState.variables = {};
      styleState.css = null;
    }

    if (update.variables) {
      Object.entries(update.variables).forEach(([key, value]) => {
        const normalized = normalizeVariableName(key);
        styleState.variables[normalized] = value;
      });
    }

    if (typeof update.css === 'string') {
      if (update.appendCss && styleState.css) {
        styleState.css = `${styleState.css}\n${update.css}`.trim();
      } else {
        styleState.css = update.css;
      }
    }

    applyStyles();
  }

  async function loadContent(
    content: PreviewContent,
    options?: { forceReload?: boolean }
  ): Promise<void> {
    const normalized = normalizeContent(content);
    const loadPromise = waitForLoad();

    if (normalized.type === 'url') {
      const url = options?.forceReload ? appendCacheBust(normalized.url, Date.now().toString()) : normalized.url;
      iframe.removeAttribute('srcdoc');
      iframe.src = url;
    } else {
      iframe.removeAttribute('src');
      iframe.srcdoc = normalized.baseUrl
        ? injectBaseTag(normalized.html, normalized.baseUrl)
        : normalized.html;
    }

    await loadPromise;
  }

  async function loadFromSource(
    loader: () => MaybePromise<PreviewContent>,
    loadOptions?: { forceReload?: boolean }
  ): Promise<void> {
    const content = await loader();
    currentContent = normalizeContent(content);
    await loadContent(currentContent, loadOptions);
  }

  async function reloadIframe(forceReload?: boolean): Promise<void> {
    if (iframe.contentWindow) {
      const loadPromise = waitForLoad();
      try {
        iframe.contentWindow.location.reload();
        await loadPromise;
        return;
      } catch {
        // Fall through to src reset.
      }
    }

    if (iframe.src) {
      const loadPromise = waitForLoad();
      iframe.src = forceReload ? appendCacheBust(iframe.src, Date.now().toString()) : iframe.src;
      await loadPromise;
    }
  }

  async function refresh(): Promise<void> {
    if (currentContent) {
      await loadContent(currentContent, { forceReload: true });
      return;
    }
    await reloadIframe(true);
  }

  async function regenerate(): Promise<void> {
    if (source?.regenerate) {
      await loadFromSource(source.regenerate, { forceReload: true });
      return;
    }
    if (source?.get) {
      await loadFromSource(source.get, { forceReload: true });
      return;
    }
    await refresh();
  }

  async function setSource(nextSource: PreviewSource | null, options?: { load?: boolean }): Promise<void> {
    source = nextSource;
    if (source && options?.load !== false) {
      await loadFromSource(source.get);
    }
  }

  async function setUrl(url: string, options?: { forceReload?: boolean }): Promise<void> {
    source = null;
    currentContent = { type: 'url', url };
    await loadContent(currentContent, options);
  }

  async function setHtml(html: string, options?: { baseUrl?: string; forceReload?: boolean }): Promise<void> {
    source = null;
    currentContent = { type: 'html', html, baseUrl: options?.baseUrl };
    await loadContent(currentContent, options);
  }

  function destroy(): void {
    iframe.removeEventListener('load', handleLoad);
    iframe.removeEventListener('error', handleError);
  }

  applyViewport(currentViewport);

  if (source && autoLoad) {
    loadFromSource(source.get).catch(error => {
      options.onError?.(error instanceof Error ? error : new Error('Failed to load live preview'));
    });
  }

  return {
    iframe,
    getViewport,
    setViewport,
    refresh,
    regenerate,
    updateStyles,
    setSource,
    setUrl,
    setHtml,
    destroy,
  };
}
