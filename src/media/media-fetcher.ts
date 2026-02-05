import * as dotenv from 'dotenv';
import {
  ImageOrientation,
  MediaFetcherConfig,
  MediaFetchOptions,
  MediaFetchResult,
  MediaProviderPreference,
  StockImage,
  StockProvider,
} from './types';
import { logger } from '../utils/logger';

dotenv.config();

const DEFAULT_COUNT = 6;
const MAX_RESULTS_PER_PROVIDER = 30;
const DEFAULT_TIMEOUT_MS = 12000;

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  plumber: ['plumber', 'plumbing', 'pipes', 'bathroom'],
  plumbers: ['plumber', 'plumbing', 'pipes', 'bathroom'],
  electrician: ['electrician', 'electrical', 'wiring', 'panel'],
  electricians: ['electrician', 'electrical', 'wiring', 'panel'],
  hvac: ['hvac', 'air conditioning', 'heating', 'furnace'],
  roofer: ['roofing', 'roofer', 'roof repair', 'shingles'],
  roofers: ['roofing', 'roofer', 'roof repair', 'shingles'],
  contractor: ['contractor', 'construction', 'renovation', 'builder'],
  contractors: ['contractor', 'construction', 'renovation', 'builder'],
  dentist: ['dentist', 'dental', 'smile', 'clinic'],
  dentists: ['dentist', 'dental', 'smile', 'clinic'],
  doctor: ['doctor', 'medical', 'clinic', 'healthcare'],
  doctors: ['doctor', 'medical', 'clinic', 'healthcare'],
  chiropractor: ['chiropractor', 'spine', 'wellness', 'clinic'],
  therapist: ['therapist', 'counseling', 'wellness', 'office'],
  veterinarian: ['veterinarian', 'vet', 'animal clinic', 'pet care'],
  vet: ['veterinarian', 'vet', 'animal clinic', 'pet care'],
  lawyer: ['lawyer', 'attorney', 'legal', 'law office'],
  lawyers: ['lawyer', 'attorney', 'legal', 'law office'],
  accountant: ['accountant', 'tax', 'bookkeeping', 'finance'],
  accountants: ['accountant', 'tax', 'bookkeeping', 'finance'],
  'financial-advisor': ['financial advisor', 'wealth', 'investment', 'office'],
  realtor: ['realtor', 'real estate', 'homes', 'property'],
  realtors: ['realtor', 'real estate', 'homes', 'property'],
  'real-estate': ['real estate', 'homes', 'property', 'broker'],
  restaurant: ['restaurant', 'dining', 'chef', 'food'],
  restaurants: ['restaurant', 'dining', 'chef', 'food'],
  cafe: ['cafe', 'coffee shop', 'barista', 'pastry'],
  salon: ['salon', 'hair', 'beauty', 'stylist'],
  salons: ['salon', 'hair', 'beauty', 'stylist'],
  spa: ['spa', 'massage', 'wellness', 'relaxation'],
  gym: ['gym', 'fitness', 'workout', 'training'],
  fitness: ['gym', 'fitness', 'workout', 'training'],
  cleaning: ['cleaning service', 'housekeeping', 'janitorial', 'clean home'],
  landscaping: ['landscaping', 'lawn care', 'garden', 'outdoor'],
  landscaper: ['landscaping', 'lawn care', 'garden', 'outdoor'],
  photography: ['photographer', 'photo studio', 'camera', 'portrait'],
  photographer: ['photographer', 'photo studio', 'camera', 'portrait'],
  studio: ['creative studio', 'design studio', 'workspace'],
  'auto-repair': ['auto repair', 'mechanic', 'car service', 'garage'],
  mechanic: ['auto repair', 'mechanic', 'car service', 'garage'],
};

const DEFAULT_VIBE_BY_INDUSTRY: Record<string, string> = {
  plumber: 'trustworthy',
  plumbers: 'trustworthy',
  electrician: 'trustworthy',
  electricians: 'trustworthy',
  hvac: 'trustworthy',
  roofer: 'bold',
  roofers: 'bold',
  contractor: 'bold',
  contractors: 'bold',
  lawyer: 'executive',
  lawyers: 'executive',
  accountant: 'executive',
  accountants: 'executive',
  'financial-advisor': 'executive',
  realtor: 'elegant',
  realtors: 'elegant',
  'real-estate': 'elegant',
  dentist: 'friendly',
  dentists: 'friendly',
  chiropractor: 'friendly',
  doctor: 'friendly',
  doctors: 'friendly',
  veterinarian: 'friendly',
  therapist: 'elegant',
  gym: 'bold',
  fitness: 'bold',
  restaurant: 'creative',
  restaurants: 'creative',
  cafe: 'friendly',
  photography: 'creative',
  photographer: 'creative',
  studio: 'creative',
  spa: 'elegant',
  salon: 'friendly',
  salons: 'friendly',
  cleaning: 'trustworthy',
  landscaping: 'trustworthy',
  landscaper: 'trustworthy',
  'auto-repair': 'trustworthy',
  mechanic: 'trustworthy',
};

const VIBE_KEYWORDS: Record<string, string[]> = {
  executive: ['corporate', 'professional', 'modern office'],
  maverick: ['bold', 'startup', 'creative'],
  elegant: ['luxury', 'refined', 'premium'],
  bold: ['strong', 'dramatic', 'high energy'],
  friendly: ['welcoming', 'smiling', 'warm'],
  minimal: ['clean', 'minimal', 'simple'],
  creative: ['artistic', 'colorful', 'expressive'],
  trustworthy: ['reliable', 'clean', 'professional'],
};

const VIBE_ALIASES: Record<string, string> = {
  corporate: 'executive',
  professional: 'executive',
  luxury: 'elegant',
  warm: 'friendly',
  welcoming: 'friendly',
  clean: 'minimal',
  modern: 'minimal',
};

export class MediaFetchError extends Error {
  provider?: StockProvider;
  status?: number;
  url?: string;

  constructor(message: string, options?: { provider?: StockProvider; status?: number; url?: string }) {
    super(message);
    this.name = 'MediaFetchError';
    this.provider = options?.provider;
    this.status = options?.status;
    this.url = options?.url;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class MediaFetcher {
  private unsplashAccessKey?: string;
  private pexelsApiKey?: string;
  private defaultProvider: MediaProviderPreference;
  private timeoutMs: number;

  constructor(config: MediaFetcherConfig = {}) {
    this.unsplashAccessKey = config.unsplashAccessKey
      || process.env.UNSPLASH_ACCESS_KEY
      || process.env.UNSPLASH_API_KEY;
    this.pexelsApiKey = config.pexelsApiKey
      || process.env.PEXELS_API_KEY
      || process.env.PEXELS_KEY;
    this.defaultProvider = config.defaultProvider || 'auto';
    this.timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  async fetchImages(options: MediaFetchOptions): Promise<MediaFetchResult> {
    const industry = options.industry?.trim();
    if (!industry) {
      throw new MediaFetchError('Industry is required to fetch media');
    }

    const providers = this.resolveProviders(options.provider);
    const warnings: string[] = [];
    const images: StockImage[] = [];
    const count = this.normalizeCount(options.count);
    const orientation = options.orientation || 'landscape';
    const vibeId = this.resolveVibe(options.vibe, industry);
    const query = this.buildQuery(industry, vibeId, options.keywords);

    const maxPossible = MAX_RESULTS_PER_PROVIDER * providers.length;
    if (count > maxPossible) {
      warnings.push(`Requested ${count} images, but only ${maxPossible} can be fetched per request.`);
    }

    let remaining = count;

    for (let index = 0; index < providers.length; index++) {
      if (remaining <= 0) break;

      const provider = providers[index];
      const remainingProviders = providers.length - index;
      const requestCount = providers.length > 1
        ? Math.max(1, Math.ceil(remaining / remainingProviders))
        : remaining;

      try {
        const fetched = provider === 'unsplash'
          ? await this.fetchFromUnsplash(query, requestCount, orientation)
          : await this.fetchFromPexels(query, requestCount, orientation);

        images.push(...fetched);
        remaining = count - images.length;
      } catch (error: any) {
        const message = error?.message || 'Unknown media fetch error';
        warnings.push(`${provider}: ${message}`);
        logger.warn('Media fetch failed', { provider, message });
      }
    }

    const deduped = this.dedupeImages(images).slice(0, count);

    if (deduped.length === 0) {
      throw new MediaFetchError('No images returned from providers', {
        provider: providers.length === 1 ? providers[0] : undefined,
      });
    }

    const providerLabel: StockProvider | 'mixed' = providers.length > 1 ? 'mixed' : providers[0];

    return {
      query,
      provider: providerLabel,
      images: deduped,
      warnings,
    };
  }

  private resolveProviders(preference?: MediaProviderPreference): StockProvider[] {
    const choice = preference || this.defaultProvider;
    const available: StockProvider[] = [];

    if (this.unsplashAccessKey) {
      available.push('unsplash');
    }
    if (this.pexelsApiKey) {
      available.push('pexels');
    }

    if (choice === 'unsplash') {
      if (!this.unsplashAccessKey) {
        throw new MediaFetchError('Unsplash access key is not configured', { provider: 'unsplash' });
      }
      return ['unsplash'];
    }

    if (choice === 'pexels') {
      if (!this.pexelsApiKey) {
        throw new MediaFetchError('Pexels API key is not configured', { provider: 'pexels' });
      }
      return ['pexels'];
    }

    if (choice === 'mixed') {
      if (available.length === 0) {
        throw new MediaFetchError('No stock image providers are configured');
      }
      return available;
    }

    if (available.length === 0) {
      throw new MediaFetchError('No stock image providers are configured');
    }

    return [available[0]];
  }

  private normalizeCount(count?: number): number {
    if (!count || Number.isNaN(count)) {
      return DEFAULT_COUNT;
    }
    return Math.max(1, Math.floor(count));
  }

  private resolveVibe(vibe: string | undefined, industry: string): string {
    if (vibe && vibe.trim()) {
      const normalized = normalizeKey(vibe);
      if (VIBE_ALIASES[normalized]) {
        return VIBE_ALIASES[normalized];
      }
      if (VIBE_KEYWORDS[normalized]) {
        return normalized;
      }
      return vibe.trim().toLowerCase();
    }

    const normalizedIndustry = normalizeKey(industry);
    return DEFAULT_VIBE_BY_INDUSTRY[normalizedIndustry] || 'trustworthy';
  }

  private buildQuery(industry: string, vibeId: string, keywords?: string[]): string {
    const normalizedIndustry = normalizeKey(industry);
    const industryKeywords = INDUSTRY_KEYWORDS[normalizedIndustry] || [industry];
    const vibeKeywords = VIBE_KEYWORDS[vibeId] || [vibeId];

    const terms = [
      ...industryKeywords,
      ...vibeKeywords,
      ...(keywords || []),
    ]
      .map(term => term.trim())
      .filter(Boolean);

    const deduped = Array.from(new Set(terms));
    const queryTerms = deduped.slice(0, 6);

    if (queryTerms.length === 0) {
      return industry;
    }

    return queryTerms.join(' ');
  }

  private async fetchFromUnsplash(query: string, count: number, orientation: ImageOrientation): Promise<StockImage[]> {
    if (!this.unsplashAccessKey) {
      throw new MediaFetchError('Unsplash access key is not configured', { provider: 'unsplash' });
    }

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, MAX_RESULTS_PER_PROVIDER)),
      orientation: mapUnsplashOrientation(orientation),
      content_filter: 'high',
    });

    const url = `https://api.unsplash.com/search/photos?${params.toString()}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: `Client-ID ${this.unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    }, this.timeoutMs);

    if (!response.ok) {
      const body = await safeReadText(response);
      throw new MediaFetchError(`Unsplash API error: ${response.status} ${response.statusText} ${body}`.trim(), {
        provider: 'unsplash',
        status: response.status,
        url,
      });
    }

    const data = await response.json() as UnsplashSearchResponse;
    const results = data?.results || [];

    if (results.length === 0) {
      return [];
    }

    return results.flatMap(result => {
      const url = result.urls?.regular || result.urls?.full || result.urls?.raw;
      if (!url) return [];

      const image: StockImage = {
        id: result.id,
        provider: 'unsplash',
        url,
        thumbUrl: result.urls?.thumb || result.urls?.small,
        width: result.width,
        height: result.height,
        description: result.alt_description || result.description || undefined,
        photographer: result.user?.name,
        photographerUrl: result.user?.links?.html,
        sourceUrl: result.links?.html,
        downloadUrl: result.links?.download || result.links?.download_location,
      };

      return [image];
    });
  }

  private async fetchFromPexels(query: string, count: number, orientation: ImageOrientation): Promise<StockImage[]> {
    if (!this.pexelsApiKey) {
      throw new MediaFetchError('Pexels API key is not configured', { provider: 'pexels' });
    }

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, MAX_RESULTS_PER_PROVIDER)),
      orientation,
    });

    const url = `https://api.pexels.com/v1/search?${params.toString()}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: this.pexelsApiKey,
      },
    }, this.timeoutMs);

    if (!response.ok) {
      const body = await safeReadText(response);
      throw new MediaFetchError(`Pexels API error: ${response.status} ${response.statusText} ${body}`.trim(), {
        provider: 'pexels',
        status: response.status,
        url,
      });
    }

    const data = await response.json() as PexelsSearchResponse;
    const results = data?.photos || [];

    if (results.length === 0) {
      return [];
    }

    return results.flatMap(photo => {
      const url = photo.src?.large || photo.src?.original;
      if (!url) return [];

      const image: StockImage = {
        id: String(photo.id),
        provider: 'pexels',
        url,
        thumbUrl: photo.src?.medium || photo.src?.small,
        width: photo.width,
        height: photo.height,
        description: photo.alt || undefined,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        downloadUrl: photo.src?.original,
      };

      return [image];
    });
  }

  private dedupeImages(images: StockImage[]): StockImage[] {
    const seen = new Set<string>();
    return images.filter(image => {
      const key = `${image.provider}:${image.id || image.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export function createMediaFetcher(config?: MediaFetcherConfig): MediaFetcher {
  return new MediaFetcher(config);
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function mapUnsplashOrientation(orientation: ImageOrientation): string {
  if (orientation === 'square') return 'squarish';
  return orientation;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text ? `- ${text.slice(0, 200)}` : '';
  } catch {
    return '';
  }
}

interface UnsplashSearchResponse {
  results: Array<{
    id: string;
    width?: number;
    height?: number;
    alt_description?: string | null;
    description?: string | null;
    urls?: {
      raw?: string;
      full?: string;
      regular?: string;
      small?: string;
      thumb?: string;
    };
    user?: {
      name?: string;
      links?: {
        html?: string;
      };
    };
    links?: {
      html?: string;
      download?: string;
      download_location?: string;
    };
  }>;
}

interface PexelsSearchResponse {
  photos: Array<{
    id: number;
    width?: number;
    height?: number;
    url?: string;
    photographer?: string;
    photographer_url?: string;
    alt?: string;
    src?: {
      original?: string;
      large?: string;
      medium?: string;
      small?: string;
    };
  }>;
}
