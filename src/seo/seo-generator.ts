import {
  INDUSTRIES,
  IndustryType,
  detectIndustryFromKeywords,
  getIndustryTemplate,
} from '../ai/industry-templates';

export type SeoIndustryInput = IndustryType | string;

export interface SeoAddress {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface SeoGeo {
  latitude: number;
  longitude: number;
}

export interface SeoBusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  note?: string;
}

export type SeoDayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface SeoOpeningHoursSpecification {
  dayOfWeek: SeoDayOfWeek | SeoDayOfWeek[];
  opens: string;
  closes: string;
  validFrom?: string;
  validThrough?: string;
}

export interface SeoBusinessInfo {
  name: string;
  legalName?: string;
  description?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  url?: string;
  website?: string;
  logo?: string;
  image?: string;
  images?: string[];
  address?: SeoAddress;
  location?: string;
  geo?: SeoGeo;
  socialProfiles?: string[];
  sameAs?: string[];
  priceRange?: string;
  openingHours?: string[];
  openingHoursSpecification?: SeoOpeningHoursSpecification[];
  hours?: SeoBusinessHours;
  areaServed?: string | string[];
  serviceArea?: string | string[];
  paymentAccepted?: string | string[];
  languages?: string | string[];
  brand?: string;
}

export interface SeoRobots {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  nocache?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

export type SeoRobotsConfig = SeoRobots | string;

export interface SeoPageContent {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  path?: string;
  canonicalUrl?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile' | string;
  locale?: string;
  section?: string;
  tags?: string[];
  keywords?: string[] | string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  robots?: SeoRobotsConfig;
}

export interface SeoOptions {
  titleSeparator?: string;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  includeBusinessNameInTitle?: boolean;
  includeIndustryInTitle?: boolean;
  includeLocationInTitle?: boolean;
  defaultLocale?: string;
  defaultImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  canonicalBaseUrl?: string;
  schemaType?: string;
  includeJsonLd?: boolean;
  includeOpenGraph?: boolean;
  includeTwitter?: boolean;
  includeCanonical?: boolean;
  includeRobots?: boolean;
  robots?: SeoRobotsConfig;
  nonce?: string;
}

export interface SeoConfig {
  business: SeoBusinessInfo;
  industry?: SeoIndustryInput;
  page?: SeoPageContent;
  options?: SeoOptions;
}

export interface SeoSnippets {
  title: string;
  meta: string;
  openGraph: string;
  twitter: string;
  jsonLd: string;
  head: string;
}

interface ResolvedIndustry {
  type: IndustryType;
  label: string;
}

interface ResolvedSeoData {
  industry: ResolvedIndustry;
  title: string;
  description: string;
  canonicalUrl?: string;
  pageUrl?: string;
  image?: string;
  imageAlt?: string;
  locale: string;
  siteName: string;
  ogType: string;
  keywords?: string;
  robots?: string;
  twitterCard: string;
  twitterSite?: string;
  twitterCreator?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  baseUrl?: string;
  location?: string;
}

const DEFAULT_TITLE_SEPARATOR = ' | ';
const DEFAULT_MAX_TITLE = 60;
const DEFAULT_MAX_DESCRIPTION = 160;
const DEFAULT_LOCALE = 'en_US';

const SCHEMA_TYPE_BY_INDUSTRY: Record<IndustryType, string> = {
  plumbers: 'Plumber',
  lawyers: 'LegalService',
  restaurants: 'Restaurant',
  dentists: 'Dentist',
  contractors: 'GeneralContractor',
  hvac: 'HVACBusiness',
  salons: 'HairSalon',
  doctors: 'MedicalClinic',
  accountants: 'AccountingService',
  realtors: 'RealEstateAgent',
  'auto-repair': 'AutoRepair',
  fitness: 'HealthClub',
  cleaning: 'CleaningService',
  landscaping: 'LandscapingBusiness',
  photography: 'ProfessionalService',
  other: 'LocalBusiness',
};

export function generateSeoTags(config: SeoConfig): SeoSnippets {
  const resolved = resolveSeoData(config);
  const options = config.options || {};

  const titleTag = resolved.title ? `<title>${escapeHtml(resolved.title)}</title>` : '';
  const metaTags = buildMetaTags(resolved, config);
  const openGraphTags = options.includeOpenGraph === false ? '' : buildOpenGraphTags(resolved);
  const twitterTags = options.includeTwitter === false ? '' : buildTwitterTags(resolved);
  const jsonLd = options.includeJsonLd === false ? '' : buildJsonLd(resolved, config);

  const head = [
    titleTag,
    metaTags,
    openGraphTags,
    twitterTags,
    jsonLd,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: titleTag,
    meta: metaTags,
    openGraph: openGraphTags,
    twitter: twitterTags,
    jsonLd,
    head,
  };
}

function resolveSeoData(config: SeoConfig): ResolvedSeoData {
  const business = config.business;
  const page = config.page || {};
  const options = config.options || {};
  const industry = resolveIndustry(config.industry);
  const siteName = (business.name || '').trim() || 'Business';

  const location = resolveLocation(business);
  const baseUrl = normalizeUrl(options.canonicalBaseUrl || business.url || business.website);
  const canonicalUrl = resolveCanonicalUrl(page, baseUrl);
  const pageUrl = page.url || canonicalUrl || baseUrl;
  const image = resolveUrl(baseUrl, page.image || business.image || business.logo || options.defaultImage);
  const imageAlt = (page.imageAlt || business.name || '').trim() || undefined;

  const title = buildTitle({
    pageTitle: page.title,
    businessName: siteName,
    industryLabel: industry.label,
    location,
    options,
  });

  const description = buildDescription({
    pageDescription: page.description,
    pageContent: page.content,
    business,
    industryLabel: industry.label,
    location,
    maxLength: options.maxDescriptionLength || DEFAULT_MAX_DESCRIPTION,
  });

  const locale = (page.locale || options.defaultLocale || DEFAULT_LOCALE).trim() || DEFAULT_LOCALE;
  const ogType = page.type || 'website';
  const keywords = normalizeKeywords(page.keywords);

  const robots = resolveRobots(page, options);
  const twitterCard = options.twitterCard || (image ? 'summary_large_image' : 'summary');
  const twitterSite = normalizeTwitterHandle(options.twitterSite);
  const twitterCreator = normalizeTwitterHandle(options.twitterCreator);

  return {
    industry,
    title,
    description,
    canonicalUrl,
    pageUrl,
    image,
    imageAlt,
    locale,
    siteName,
    ogType,
    keywords,
    robots,
    twitterCard,
    twitterSite,
    twitterCreator,
    publishedTime: page.publishedTime,
    modifiedTime: page.modifiedTime,
    section: page.section,
    tags: page.tags,
    baseUrl,
    location,
  };
}

function resolveIndustry(industry?: SeoIndustryInput): ResolvedIndustry {
  if (!industry) {
    return { type: 'other', label: 'Business' };
  }

  const raw = String(industry).trim();
  const normalized = raw.toLowerCase();

  if (INDUSTRIES.includes(normalized as IndustryType)) {
    const type = normalized as IndustryType;
    return { type, label: getIndustryTemplate(type).displayName };
  }

  const detected = detectIndustryFromKeywords(normalized);
  if (detected !== 'other') {
    return { type: detected, label: getIndustryTemplate(detected).displayName };
  }

  return { type: 'other', label: raw || 'Business' };
}

function resolveLocation(business: SeoBusinessInfo): string | undefined {
  if (business.location) return business.location.trim() || undefined;

  const city = business.address?.city?.trim();
  const state = business.address?.state?.trim();
  const country = business.address?.country?.trim();

  const parts = [city, state].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }

  return country || undefined;
}

function buildTitle(params: {
  pageTitle?: string;
  businessName: string;
  industryLabel: string;
  location?: string;
  options: SeoOptions;
}): string {
  const separator = params.options.titleSeparator ?? DEFAULT_TITLE_SEPARATOR;
  const includeBusiness = params.options.includeBusinessNameInTitle !== false;
  const includeIndustry = params.options.includeIndustryInTitle !== false;
  const includeLocation = params.options.includeLocationInTitle !== false;
  const maxLength = params.options.maxTitleLength || DEFAULT_MAX_TITLE;

  if (params.pageTitle) {
    const base = params.pageTitle.trim();
    if (!base) {
      return truncate(params.businessName, maxLength);
    }
    const title = includeBusiness ? `${base}${separator}${params.businessName}` : base;
    return truncate(title, maxLength);
  }

  const detailParts: string[] = [];
  if (includeIndustry && params.industryLabel) {
    detailParts.push(params.industryLabel);
  }
  if (includeLocation && params.location) {
    detailParts.push(params.location);
  }

  if (!includeBusiness && detailParts.length > 0) {
    return truncate(detailParts.join(' - '), maxLength);
  }

  if (detailParts.length === 0) {
    return truncate(params.businessName, maxLength);
  }

  return truncate(`${params.businessName}${separator}${detailParts.join(' - ')}`, maxLength);
}

function buildDescription(params: {
  pageDescription?: string;
  pageContent?: string;
  business: SeoBusinessInfo;
  industryLabel: string;
  location?: string;
  maxLength: number;
}): string {
  const base =
    params.pageDescription ||
    params.business.description ||
    params.business.tagline ||
    extractDescriptionFromContent(params.pageContent) ||
    buildFallbackDescription(params.business.name, params.industryLabel, params.location);

  return truncate(normalizeWhitespace(base), params.maxLength);
}

function buildFallbackDescription(businessName: string, industryLabel: string, location?: string): string {
  const industryText = industryLabel && industryLabel !== 'Business'
    ? `${industryLabel} services`
    : 'professional services';
  const locationText = location ? ` in ${location}` : '';
  return `${businessName} provides ${industryText}${locationText}. Contact us to learn more.`;
}

function buildMetaTags(resolved: ResolvedSeoData, config: SeoConfig): string {
  const tags: string[] = [];
  const options = config.options || {};

  tags.push(metaTag('description', resolved.description));

  if (resolved.keywords) {
    tags.push(metaTag('keywords', resolved.keywords));
  }

  if (resolved.robots && options.includeRobots !== false) {
    tags.push(metaTag('robots', resolved.robots));
  }

  if (resolved.canonicalUrl && options.includeCanonical !== false) {
    tags.push(`<link rel="canonical" href="${escapeAttribute(resolved.canonicalUrl)}">`);
  }

  return tags.filter(Boolean).join('\n');
}

function buildOpenGraphTags(resolved: ResolvedSeoData): string {
  const tags: string[] = [];
  tags.push(propertyTag('og:title', resolved.title));
  tags.push(propertyTag('og:description', resolved.description));
  tags.push(propertyTag('og:type', resolved.ogType));

  if (resolved.pageUrl) {
    tags.push(propertyTag('og:url', resolved.pageUrl));
  }

  if (resolved.siteName) {
    tags.push(propertyTag('og:site_name', resolved.siteName));
  }

  if (resolved.locale) {
    tags.push(propertyTag('og:locale', resolved.locale));
  }

  if (resolved.image) {
    tags.push(propertyTag('og:image', resolved.image));
  }

  if (resolved.imageAlt) {
    tags.push(propertyTag('og:image:alt', resolved.imageAlt));
  }

  if (resolved.ogType === 'article') {
    if (resolved.publishedTime) {
      tags.push(propertyTag('article:published_time', resolved.publishedTime));
    }
    if (resolved.modifiedTime) {
      tags.push(propertyTag('article:modified_time', resolved.modifiedTime));
    }
    if (resolved.section) {
      tags.push(propertyTag('article:section', resolved.section));
    }
    if (resolved.tags && resolved.tags.length > 0) {
      resolved.tags.forEach(tag => tags.push(propertyTag('article:tag', tag)));
    }
  }

  return tags.filter(Boolean).join('\n');
}

function buildTwitterTags(resolved: ResolvedSeoData): string {
  const tags: string[] = [];
  tags.push(metaTag('twitter:card', resolved.twitterCard));
  tags.push(metaTag('twitter:title', resolved.title));
  tags.push(metaTag('twitter:description', resolved.description));

  if (resolved.image) {
    tags.push(metaTag('twitter:image', resolved.image));
  }

  if (resolved.imageAlt) {
    tags.push(metaTag('twitter:image:alt', resolved.imageAlt));
  }

  if (resolved.twitterSite) {
    tags.push(metaTag('twitter:site', resolved.twitterSite));
  }

  if (resolved.twitterCreator) {
    tags.push(metaTag('twitter:creator', resolved.twitterCreator));
  }

  return tags.filter(Boolean).join('\n');
}

function buildJsonLd(resolved: ResolvedSeoData, config: SeoConfig): string {
  const options = config.options || {};
  const business = config.business;

  const schemaType = options.schemaType || SCHEMA_TYPE_BY_INDUSTRY[resolved.industry.type] || 'LocalBusiness';
  const baseUrl = resolved.baseUrl || resolved.pageUrl;
  const baseId = baseUrl ? `${trimTrailingSlash(baseUrl)}#business` : undefined;
  const websiteId = baseUrl ? `${trimTrailingSlash(baseUrl)}#website` : undefined;
  const pageId = resolved.pageUrl ? `${trimTrailingSlash(resolved.pageUrl)}#webpage` : undefined;

  const openingHours = resolveOpeningHours(business);
  const sameAs = uniqueStrings([...(business.sameAs || []), ...(business.socialProfiles || [])]);

  const address = buildAddress(business.address);
  const geo = buildGeo(business.geo);
  const contactPoint = buildContactPoint(business);

  const businessNode = cleanObject({
    '@type': schemaType,
    '@id': baseId,
    name: business.name,
    legalName: business.legalName,
    url: baseUrl,
    description: business.description || resolved.description,
    image: resolveImageList(business, resolved.image, resolved.baseUrl),
    logo: business.logo,
    telephone: business.phone,
    email: business.email,
    address,
    geo,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    priceRange: business.priceRange,
    openingHours: openingHours.openingHours,
    openingHoursSpecification: openingHours.openingHoursSpecification,
    areaServed: business.areaServed || business.serviceArea,
    paymentAccepted: business.paymentAccepted,
    knowsLanguage: business.languages,
    contactPoint,
    brand: business.brand,
  });

  const graph: Record<string, unknown>[] = [];
  if (Object.keys(businessNode).length > 0) {
    graph.push(businessNode);
  }

  const webSiteNode = cleanObject({
    '@type': 'WebSite',
    '@id': websiteId,
    url: baseUrl,
    name: business.name,
    publisher: baseId ? { '@id': baseId } : undefined,
    inLanguage: resolved.locale,
  });

  if (Object.keys(webSiteNode).length > 0 && baseUrl) {
    graph.push(webSiteNode);
  }

  const isArticle = resolved.ogType === 'article';
  const webPageNode = cleanObject({
    '@type': isArticle ? 'Article' : 'WebPage',
    '@id': pageId,
    url: resolved.pageUrl,
    name: resolved.title,
    headline: isArticle ? resolved.title : undefined,
    description: resolved.description,
    inLanguage: resolved.locale,
    isPartOf: websiteId ? { '@id': websiteId } : undefined,
    about: baseId ? { '@id': baseId } : undefined,
    datePublished: resolved.publishedTime,
    dateModified: resolved.modifiedTime,
    author: isArticle && config.page?.author
      ? { '@type': 'Person', name: config.page.author }
      : undefined,
    publisher: isArticle && baseId ? { '@id': baseId } : undefined,
    image: isArticle ? resolved.image : undefined,
  });

  if (Object.keys(webPageNode).length > 0 && resolved.pageUrl) {
    graph.push(webPageNode);
  }

  if (graph.length === 0) {
    return '';
  }

  const root = graph.length === 1
    ? { '@context': 'https://schema.org', ...graph[0] }
    : { '@context': 'https://schema.org', '@graph': graph };

  const nonceAttr = options.nonce ? ` nonce="${escapeAttribute(options.nonce)}"` : '';
  return `<script type="application/ld+json"${nonceAttr}>${safeJson(root, 2)}</script>`;
}

function resolveOpeningHours(business: SeoBusinessInfo): {
  openingHours?: string[];
  openingHoursSpecification?: SeoOpeningHoursSpecification[];
} {
  if (business.openingHoursSpecification && business.openingHoursSpecification.length > 0) {
    return { openingHoursSpecification: business.openingHoursSpecification };
  }

  if (business.openingHours && business.openingHours.length > 0) {
    return { openingHours: business.openingHours };
  }

  if (!business.hours) {
    return {};
  }

  const dayMap: Record<keyof SeoBusinessHours, string> = {
    monday: 'Mo',
    tuesday: 'Tu',
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    sunday: 'Su',
    note: '',
  };

  const orderedDays: Array<keyof SeoBusinessHours> = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const openingHours: string[] = [];

  for (const day of orderedDays) {
    const value = business.hours[day];
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || /closed/i.test(trimmed)) continue;
    const prefix = dayMap[day];
    if (prefix && !/^([A-Z][a-z])\b/.test(trimmed)) {
      openingHours.push(`${prefix} ${trimmed}`);
    } else {
      openingHours.push(trimmed);
    }
  }

  return openingHours.length > 0 ? { openingHours } : {};
}

function resolveImageList(
  business: SeoBusinessInfo,
  fallback?: string,
  baseUrl?: string,
): string | string[] | undefined {
  if (business.images && business.images.length > 0) {
    const resolved = business.images
      .map(image => resolveUrl(baseUrl, image))
      .filter(Boolean) as string[];
    return resolved.length > 0 ? resolved : undefined;
  }
  if (business.image) {
    return resolveUrl(baseUrl, business.image);
  }
  return fallback;
}

function buildAddress(address?: SeoAddress): Record<string, string> | undefined {
  if (!address) return undefined;
  const street = [address.street, address.street2].filter(Boolean).join(' ').trim();

  const data: Record<string, string> = {};
  if (street) data.streetAddress = street;
  if (address.city) data.addressLocality = address.city;
  if (address.state) data.addressRegion = address.state;
  if (address.postalCode) data.postalCode = address.postalCode;
  if (address.country) data.addressCountry = address.country;

  return Object.keys(data).length > 0 ? { '@type': 'PostalAddress', ...data } : undefined;
}

function buildGeo(geo?: SeoGeo): Record<string, number | string> | undefined {
  if (!geo) return undefined;
  if (typeof geo.latitude !== 'number' || typeof geo.longitude !== 'number') return undefined;
  return {
    '@type': 'GeoCoordinates',
    latitude: geo.latitude,
    longitude: geo.longitude,
  };
}

function buildContactPoint(business: SeoBusinessInfo): Record<string, string> | undefined {
  const telephone = business.phone;
  const email = business.email;
  if (!telephone && !email) return undefined;
  return cleanObject({
    '@type': 'ContactPoint',
    telephone,
    email,
    contactType: 'customer service',
  });
}

function resolveCanonicalUrl(page: SeoPageContent, baseUrl?: string): string | undefined {
  const direct = page.canonicalUrl || page.url;
  if (direct) return direct;
  if (page.path && baseUrl) {
    return joinUrl(baseUrl, page.path);
  }
  return baseUrl;
}

function resolveUrl(baseUrl: string | undefined, value?: string): string | undefined {
  if (!value) return undefined;
  if (isAbsoluteUrl(value)) return value;
  if (!baseUrl) return value;
  return joinUrl(baseUrl, value);
}

function normalizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim() || undefined;
}

function joinUrl(base: string, path: string): string {
  if (isAbsoluteUrl(path)) return path;
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('//');
}

function normalizeKeywords(keywords?: string[] | string): string | undefined {
  if (!keywords) return undefined;
  if (Array.isArray(keywords)) {
    const list = keywords.map(item => item.trim()).filter(Boolean);
    return list.length > 0 ? list.join(', ') : undefined;
  }
  const value = keywords.trim();
  return value || undefined;
}

function resolveRobots(page: SeoPageContent, options: SeoOptions): string | undefined {
  const pageRobots = page.robots;
  if (typeof pageRobots === 'string') {
    return pageRobots.trim() || undefined;
  }

  const pageRobotsObject = pageRobots && typeof pageRobots === 'object' ? pageRobots : undefined;

  if (!pageRobotsObject && typeof options.robots === 'string') {
    return options.robots.trim() || undefined;
  }

  const robotsConfig = pageRobotsObject
    || (options.robots && typeof options.robots === 'object' ? options.robots : undefined);

  const hasDirectives = !!robotsConfig || page.noIndex || page.noFollow || options.includeRobots;
  if (!hasDirectives) return undefined;

  const directives: string[] = [];
  const index = page.noIndex ? false : robotsConfig?.index ?? true;
  const follow = page.noFollow ? false : robotsConfig?.follow ?? true;
  directives.push(index ? 'index' : 'noindex');
  directives.push(follow ? 'follow' : 'nofollow');

  if (robotsConfig?.noarchive) directives.push('noarchive');
  if (robotsConfig?.nosnippet) directives.push('nosnippet');
  if (robotsConfig?.noimageindex) directives.push('noimageindex');
  if (robotsConfig?.nocache) directives.push('nocache');
  if (robotsConfig?.maxSnippet !== undefined) directives.push(`max-snippet:${robotsConfig.maxSnippet}`);
  if (robotsConfig?.maxImagePreview) directives.push(`max-image-preview:${robotsConfig.maxImagePreview}`);
  if (robotsConfig?.maxVideoPreview !== undefined) directives.push(`max-video-preview:${robotsConfig.maxVideoPreview}`);

  return directives.join(', ');
}

function normalizeTwitterHandle(handle?: string): string | undefined {
  if (!handle) return undefined;
  const trimmed = handle.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function extractDescriptionFromContent(content?: string): string | undefined {
  if (!content) return undefined;
  const stripped = content.replace(/<[^>]*>/g, ' ');
  const normalized = normalizeWhitespace(stripped);
  return normalized || undefined;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return `${sliced.slice(0, lastSpace).trim()}...`;
  }
  return `${sliced.trim()}...`;
}

function metaTag(name: string, content?: string): string {
  if (!content) return '';
  return `<meta name="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`;
}

function propertyTag(property: string, content?: string): string {
  if (!content) return '';
  return `<meta property="${escapeAttribute(property)}" content="${escapeAttribute(content)}">`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeJson(value: unknown, indent: number = 0): string {
  return JSON.stringify(value, null, indent).replace(/</g, '\\u003c');
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;

    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => item !== undefined && item !== null && item !== '');
      if (cleaned.length === 0) continue;
      output[key] = cleaned;
      continue;
    }

    if (typeof value === 'object') {
      const cleaned = cleanObject(value);
      if (Object.keys(cleaned).length === 0) continue;
      output[key] = cleaned;
      continue;
    }

    output[key] = value;
  }

  return output as T;
}
