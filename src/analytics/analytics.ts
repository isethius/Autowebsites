export type AnalyticsProvider = 'ga4' | 'plausible';

export type AnalyticsParamValue = string | number | boolean;

export type ConsentState = 'granted' | 'denied';

export interface ConsentModeDefaults {
  ad_storage?: ConsentState;
  analytics_storage?: ConsentState;
  ad_user_data?: ConsentState;
  ad_personalization?: ConsentState;
  region?: string[];
  wait_for_update?: number;
}

export interface GdprOptions {
  enabled?: boolean;
  defaultConsent?: ConsentModeDefaults;
  exposeUpdateFunction?: boolean;
  updateFunctionName?: string;
  blockTrackingUntilConsent?: boolean;
}

export interface PrivacyOptions {
  respectDnt?: boolean;
  allowGoogleSignals?: boolean;
  allowAdPersonalizationSignals?: boolean;
}

export interface GA4Config {
  measurementId: string;
  config?: Record<string, AnalyticsParamValue>;
  debug?: boolean;
}

export interface PlausibleInitOptions {
  endpoint?: string;
  hashBasedRouting?: boolean;
  fileDownloads?: boolean;
  outboundLinks?: boolean;
  formSubmissions?: boolean;
  captureOnLocalhost?: boolean;
  autoCapturePageviews?: boolean;
  logging?: boolean;
}

export interface PlausibleConfig {
  domain: string;
  scriptUrl?: string;
  init?: PlausibleInitOptions;
  scriptAttributes?: Record<string, string | boolean>;
}

export type AnalyticsEventTrigger = 'pageview' | 'click' | 'submit' | 'load';

export interface PlausibleRevenue {
  currency: string;
  amount: number;
}

export interface AnalyticsEventConfig {
  name: string;
  trigger?: AnalyticsEventTrigger;
  selector?: string;
  params?: Record<string, AnalyticsParamValue>;
  props?: Record<string, AnalyticsParamValue>;
  revenue?: PlausibleRevenue;
  interactive?: boolean;
  providers?: AnalyticsProvider[];
  once?: boolean;
  goal?: boolean;
}

export interface AnalyticsConfig {
  ga4?: GA4Config;
  plausible?: PlausibleConfig;
  events?: AnalyticsEventConfig[];
  goals?: AnalyticsEventConfig[];
  privacy?: PrivacyOptions;
  gdpr?: GdprOptions;
  nonce?: string;
  enabled?: boolean;
}

export interface AnalyticsSnippets {
  head: string;
  body: string;
}

const DEFAULT_PLAUSIBLE_SCRIPT = 'https://plausible.io/js/script.js';

const DEFAULT_PRIVACY: Required<PrivacyOptions> = {
  respectDnt: true,
  allowGoogleSignals: false,
  allowAdPersonalizationSignals: false,
};

export function generateAnalyticsSnippets(config: AnalyticsConfig): AnalyticsSnippets {
  if (!config || config.enabled === false) {
    return { head: '', body: '' };
  }

  const head: string[] = [];
  const body: string[] = [];

  if (config.ga4) {
    const ga4Snippet = generateGa4Snippet(config.ga4, config);
    if (ga4Snippet) head.push(ga4Snippet);
  }

  if (config.plausible) {
    const plausibleSnippet = generatePlausibleSnippet(config.plausible);
    if (plausibleSnippet) head.push(plausibleSnippet);
  }

  const runtime = generateAnalyticsRuntime(config);
  if (runtime) body.push(runtime);

  const bindings = generateAnalyticsEventBindings(mergeEvents(config), config.nonce);
  if (bindings) body.push(bindings);

  return {
    head: head.filter(Boolean).join('\n'),
    body: body.filter(Boolean).join('\n'),
  };
}

export function generateGa4Snippet(ga4: GA4Config, config: AnalyticsConfig = {}): string {
  const measurementId = (ga4.measurementId || '').trim();
  if (!measurementId) return '';

  const privacy = resolvePrivacy(config.privacy);
  const consentDefaults = resolveConsentDefaults(config.gdpr);

  const configParams: Record<string, AnalyticsParamValue> = { ...ga4.config };

  if (configParams.allow_google_signals === undefined) {
    configParams.allow_google_signals = privacy.allowGoogleSignals;
  }

  if (configParams.allow_ad_personalization_signals === undefined) {
    configParams.allow_ad_personalization_signals = privacy.allowAdPersonalizationSignals;
  }

  if (ga4.debug) {
    configParams.debug_mode = true;
  }

  const nonceAttr = config.nonce ? ` nonce="${escapeAttribute(config.nonce)}"` : '';
  const configArgs = Object.keys(configParams).length > 0 ? `, ${safeJson(configParams)}` : '';

  const inlineConsent = consentDefaults
    ? `<script${nonceAttr}>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', ${safeJson(consentDefaults)});
</script>`
    : '';

  const inlineConfig = `<script${nonceAttr}>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${escapeJsString(measurementId)}'${configArgs});
</script>`;

  const tagScript = `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttribute(measurementId)}"></script>`;

  if (inlineConsent) {
    return [
      '<!-- Google tag (gtag.js) -->',
      inlineConsent,
      tagScript,
      inlineConfig,
    ].join('\n');
  }

  return [
    '<!-- Google tag (gtag.js) -->',
    tagScript,
    inlineConfig,
  ].join('\n');
}

export function generatePlausibleSnippet(plausible: PlausibleConfig): string {
  const domain = (plausible.domain || '').trim();
  if (!domain) return '';

  const attrs: Record<string, string | boolean> = {
    defer: true,
    'data-domain': domain,
    src: plausible.scriptUrl || DEFAULT_PLAUSIBLE_SCRIPT,
  };

  if (plausible.scriptAttributes) {
    for (const [key, value] of Object.entries(plausible.scriptAttributes)) {
      attrs[key] = value;
    }
  }

  return `<script${serializeAttributes(attrs)}></script>`;
}

export function generateAnalyticsRuntime(config: AnalyticsConfig): string {
  const providers = {
    ga4: !!config.ga4,
    plausible: !!config.plausible,
  };

  if (!providers.ga4 && !providers.plausible) {
    return '';
  }

  const privacy = resolvePrivacy(config.privacy);
  const gdpr = resolveGdpr(config.gdpr);
  const nonceAttr = config.nonce ? ` nonce="${escapeAttribute(config.nonce)}"` : '';

  const consentDefaults = resolveConsentDefaults(config.gdpr);
  const consentGranted = consentDefaults
    ? consentDefaults.analytics_storage === 'granted'
    : !gdpr.enabled;

  const updateFunctionName = (gdpr.updateFunctionName || 'awAnalyticsConsentUpdate').trim() || 'awAnalyticsConsentUpdate';
  const exposeUpdateFunction = gdpr.enabled || gdpr.exposeUpdateFunction;

  const initOptions = buildPlausibleInitOptions(config);
  const hasInitOptions = initOptions && Object.keys(initOptions).length > 0;

  const lines: string[] = [];

  lines.push('(function(){');
  lines.push(`  var providers = ${safeJson(providers)};`);
  lines.push(`  var respectDnt = ${privacy.respectDnt ? 'true' : 'false'};`);
  lines.push(`  var consentRequired = ${gdpr.blockTrackingUntilConsent ? 'true' : 'false'};`);
  lines.push(`  var consentGranted = ${consentGranted ? 'true' : 'false'};`);
  lines.push('  var queuedEvents = [];');

  lines.push('  function hasDoNotTrack(){');
  lines.push('    if (!respectDnt) return false;');
  lines.push('    var nav = typeof navigator !== "undefined" ? navigator : undefined;');
  lines.push('    var dnt = (nav && (nav.doNotTrack || nav.msDoNotTrack)) || (typeof window !== "undefined" ? window.doNotTrack : undefined);');
  lines.push('    var gpc = nav && "globalPrivacyControl" in nav ? nav.globalPrivacyControl : false;');
  lines.push('    return dnt === "1" || dnt === "yes" || gpc === true;');
  lines.push('  }');

  lines.push('  function isAllowed(){');
  lines.push('    if (hasDoNotTrack()) return false;');
  lines.push('    if (consentRequired && !consentGranted) return false;');
  lines.push('    return true;');
  lines.push('  }');

  lines.push('  function sendEvent(name, payload, providersOverride){');
  lines.push('    var allowedProviders = providersOverride && providersOverride.length ? providersOverride : null;');
  lines.push('    var params = payload && payload.params ? payload.params : undefined;');
  lines.push('    var props = payload && payload.props ? payload.props : undefined;');
  lines.push('    var revenue = payload && payload.revenue ? payload.revenue : undefined;');
  lines.push('    var interactive = payload && typeof payload.interactive === "boolean" ? payload.interactive : undefined;');

  lines.push('    if (providers.ga4 && (!allowedProviders || allowedProviders.indexOf("ga4") !== -1)) {');
  lines.push('      if (typeof window.gtag === "function") {');
  lines.push('        window.gtag("event", name, params || {});');
  lines.push('      }');
  lines.push('    }');

  lines.push('    if (providers.plausible && (!allowedProviders || allowedProviders.indexOf("plausible") !== -1)) {');
  lines.push('      if (typeof window.plausible === "function") {');
  lines.push('        var options = {};');
  lines.push('        if (props) options.props = props;');
  lines.push('        if (revenue) options.revenue = revenue;');
  lines.push('        if (typeof interactive === "boolean") options.interactive = interactive;');
  lines.push('        window.plausible(name, options);');
  lines.push('      }');
  lines.push('    }');
  lines.push('  }');

  lines.push('  function track(name, payload, providersOverride){');
  lines.push('    if (isAllowed()) {');
  lines.push('      sendEvent(name, payload, providersOverride);');
  lines.push('      return;');
  lines.push('    }');
  lines.push('    if (!consentRequired || hasDoNotTrack()) return;');
  lines.push('    queuedEvents.push([name, payload, providersOverride]);');
  lines.push('  }');

  lines.push('  function flushQueue(){');
  lines.push('    if (!isAllowed()) return;');
  lines.push('    var queue = queuedEvents.slice();');
  lines.push('    queuedEvents.length = 0;');
  lines.push('    queue.forEach(function(item){');
  lines.push('      sendEvent(item[0], item[1], item[2]);');
  lines.push('    });');
  lines.push('  }');

  lines.push('  window.awAnalytics = window.awAnalytics || {};');
  lines.push('  window.awAnalytics.providers = providers;');
  lines.push('  window.awAnalytics.isAllowed = isAllowed;');
  lines.push('  window.awAnalytics.track = window.awAnalytics.track || track;');

  if (exposeUpdateFunction) {
    lines.push(`  window.${escapeJsIdentifier(updateFunctionName)} = function(consent){`);
    lines.push('    var next = consent;');
    lines.push('    if (consent === true || consent === "granted") {');
    lines.push('      next = {');
    lines.push('        ad_storage: "granted",');
    lines.push('        analytics_storage: "granted",');
    lines.push('        ad_user_data: "granted",');
    lines.push('        ad_personalization: "granted"');
    lines.push('      };');
    lines.push('    } else if (consent === false || consent === "denied") {');
    lines.push('      next = {');
    lines.push('        ad_storage: "denied",');
    lines.push('        analytics_storage: "denied",');
    lines.push('        ad_user_data: "denied",');
    lines.push('        ad_personalization: "denied"');
    lines.push('      };');
    lines.push('    }');
    lines.push('    if (next && typeof next === "object") {');
    lines.push('      consentGranted = next.analytics_storage === "granted";');
    lines.push('      if (providers.ga4 && typeof window.gtag === "function") {');
    lines.push('        window.gtag("consent", "update", next);');
    lines.push('      }');
    lines.push('      flushQueue();');
    lines.push('    }');
    lines.push('  };');
    lines.push(`  window.awAnalytics.setConsent = window.${escapeJsIdentifier(updateFunctionName)};`);
  }

  if (hasInitOptions) {
    lines.push('  function initPlausible(){');
    lines.push('    if (!providers.plausible) return;');
    lines.push('    if (window.plausible && typeof window.plausible.init === "function") {');
    lines.push(`      window.plausible.init(${safeJson(initOptions)});`);
    lines.push('      return true;');
    lines.push('    }');
    lines.push('    return false;');
    lines.push('  }');
    lines.push('  if (!initPlausible()) {');
    lines.push('    document.addEventListener("DOMContentLoaded", initPlausible, { once: true });');
    lines.push('  }');
  }

  lines.push('})();');

  return `<script${nonceAttr}>\n${lines.join('\n')}\n</script>`;
}

export function generateAnalyticsEventBindings(events: AnalyticsEventConfig[], nonce?: string): string {
  const normalized = normalizeEvents(events);
  if (normalized.length === 0) return '';

  const nonceAttr = nonce ? ` nonce="${escapeAttribute(nonce)}"` : '';
  const lines: string[] = [];
  lines.push('(function(){');
  lines.push(`  var events = ${safeJson(normalized)};`);
  lines.push('  if (!window.awAnalytics || typeof window.awAnalytics.track !== "function") return;');
  lines.push('  function onReady(fn){');
  lines.push('    if (document.readyState === "loading") {');
  lines.push('      document.addEventListener("DOMContentLoaded", fn, { once: true });');
  lines.push('    } else {');
  lines.push('      fn();');
  lines.push('    }');
  lines.push('  }');

  lines.push('  events.forEach(function(evt){');
  lines.push('    var trigger = evt.trigger || (evt.selector ? "click" : "pageview");');
  lines.push('    var payload = { params: evt.params, props: evt.props, revenue: evt.revenue, interactive: evt.interactive };');
  lines.push('    var fire = function(){ window.awAnalytics.track(evt.name, payload, evt.providers); };');

  lines.push('    if (trigger === "pageview") {');
  lines.push('      onReady(fire);');
  lines.push('      return;');
  lines.push('    }');

  lines.push('    if (trigger === "load") {');
  lines.push('      window.addEventListener("load", fire, { once: true });');
  lines.push('      return;');
  lines.push('    }');

  lines.push('    if (!evt.selector) return;');
  lines.push('    onReady(function(){');
  lines.push('      var elements = document.querySelectorAll(evt.selector);');
  lines.push('      if (!elements.length) return;');
  lines.push('      elements.forEach(function(el){');
  lines.push('        var handler = function(){');
  lines.push('          fire();');
  lines.push('          if (evt.once) el.removeEventListener(trigger, handler);');
  lines.push('        };');
  lines.push('        el.addEventListener(trigger, handler);');
  lines.push('      });');
  lines.push('    });');
  lines.push('  });');
  lines.push('})();');

  return `<script${nonceAttr}>\n${lines.join('\n')}\n</script>`;
}

export function buildPlausibleGoalClasses(name: string, props?: Record<string, AnalyticsParamValue>): string {
  const classes = [`plausible-event-name=${encodePlausibleValue(name)}`];
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      const cleanedKey = key.trim().replace(/\s+/g, '-');
      classes.push(`plausible-event-${cleanedKey}=${encodePlausibleValue(String(value))}`);
    }
  }
  return classes.join(' ');
}

function mergeEvents(config: AnalyticsConfig): AnalyticsEventConfig[] {
  const events = [...(config.events || [])];
  if (config.goals && config.goals.length > 0) {
    for (const goal of config.goals) {
      events.push({ ...goal, goal: true });
    }
  }
  return events;
}

function resolvePrivacy(privacy?: PrivacyOptions): Required<PrivacyOptions> {
  return {
    respectDnt: privacy?.respectDnt !== false,
    allowGoogleSignals: privacy?.allowGoogleSignals ?? DEFAULT_PRIVACY.allowGoogleSignals,
    allowAdPersonalizationSignals: privacy?.allowAdPersonalizationSignals ?? DEFAULT_PRIVACY.allowAdPersonalizationSignals,
  };
}

function resolveGdpr(gdpr?: GdprOptions): Required<GdprOptions> {
  return {
    enabled: gdpr?.enabled ?? false,
    defaultConsent: gdpr?.defaultConsent,
    exposeUpdateFunction: gdpr?.exposeUpdateFunction ?? false,
    updateFunctionName: gdpr?.updateFunctionName || 'awAnalyticsConsentUpdate',
    blockTrackingUntilConsent: gdpr?.blockTrackingUntilConsent ?? (gdpr?.enabled ?? false),
  };
}

function resolveConsentDefaults(gdpr?: GdprOptions): ConsentModeDefaults | undefined {
  if (!gdpr) return undefined;

  const defaults: ConsentModeDefaults = { ...gdpr.defaultConsent };

  if (gdpr.enabled) {
    if (!defaults.ad_storage) defaults.ad_storage = 'denied';
    if (!defaults.analytics_storage) defaults.analytics_storage = 'denied';
    if (!defaults.ad_user_data) defaults.ad_user_data = 'denied';
    if (!defaults.ad_personalization) defaults.ad_personalization = 'denied';
  }

  if (Object.keys(defaults).length === 0) {
    return undefined;
  }

  return defaults;
}

function buildPlausibleInitOptions(config: AnalyticsConfig): PlausibleInitOptions | undefined {
  const plausible = config.plausible;
  if (!plausible) return undefined;

  const options: PlausibleInitOptions = { ...plausible.init };

  if (config.gdpr?.enabled && config.gdpr.blockTrackingUntilConsent !== false) {
    if (options.autoCapturePageviews === undefined) {
      options.autoCapturePageviews = false;
    }
  }

  return options;
}

function normalizeEvents(events: AnalyticsEventConfig[]): AnalyticsEventConfig[] {
  return events
    .filter(event => !!event && !!event.name)
    .map(event => {
      const trigger = event.trigger || (event.selector ? 'click' : 'pageview');
      return {
        name: event.name,
        trigger,
        selector: event.selector,
        params: event.params,
        props: event.props,
        revenue: event.revenue,
        interactive: event.interactive,
        providers: event.providers,
        once: event.once,
        goal: event.goal,
      };
    });
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeJsIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_$]/g, '_');
}

function serializeAttributes(attrs: Record<string, string | boolean>): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) return ` ${key}`;
      if (value === false || value === undefined || value === null) return '';
      return ` ${key}="${escapeAttribute(String(value))}"`;
    })
    .join('');
}

function encodePlausibleValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}
