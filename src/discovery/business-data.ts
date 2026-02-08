/**
 * Unified Business Data Interface
 *
 * Provides a consistent data structure for business information
 * collected from multiple platforms (Google, Nextdoor, Yelp, Facebook).
 *
 * This interface is used throughout the preview generation system to
 * ensure real business data is used instead of placeholder content.
 */

/**
 * A single review from any platform
 */
export interface BusinessReview {
  /** Review text */
  text: string;
  /** Reviewer name */
  author: string;
  /** Rating (1-5 stars) */
  rating: number;
  /** Optional review date */
  date?: string;
  /** Which platform this review came from */
  source: 'google' | 'nextdoor' | 'yelp' | 'facebook';
}

/**
 * Unified business data from all platforms
 */
export interface BusinessData {
  /** Business name */
  name: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Street address */
  address?: string;
  /** City */
  city?: string;
  /** State */
  state?: string;
  /** ZIP code */
  zip?: string;
  /** List of services offered */
  services?: string[];
  /** Logo image URL */
  logoUrl?: string;
  /** Overall rating (1-5) */
  rating?: number;
  /** Total number of reviews across all platforms */
  reviewCount?: number;
  /** Customer reviews */
  reviews: BusinessReview[];
  /** Business hours */
  hours?: Record<string, string>;
  /** Business website URL */
  website?: string;
  /** About/description text */
  about?: string;
  /** Business categories/types */
  categories?: string[];
  /** URLs where data was scraped from */
  sources: string[];
}

/**
 * Platform-specific data that can be merged
 */
export interface PlatformBusinessData extends Partial<BusinessData> {
  /** Which platform this data came from */
  platform: 'google' | 'nextdoor' | 'yelp' | 'facebook';
  /** The source URL */
  sourceUrl: string;
}

/**
 * Options for fetching business data
 */
export interface BusinessDataFetchOptions {
  /** Google Places search query (e.g., "business name city state") */
  googleQuery?: string;
  /** Nextdoor business page URL */
  nextdoorUrl?: string;
  /** Yelp business page URL */
  yelpUrl?: string;
  /** Facebook business page URL */
  facebookUrl?: string;
  /** Maximum reviews to fetch per platform */
  maxReviewsPerPlatform?: number;
}

/**
 * Result of a business data fetch operation
 */
export interface BusinessDataFetchResult {
  /** Whether fetch was successful */
  success: boolean;
  /** Merged business data */
  data: BusinessData | null;
  /** Platform-specific data before merging */
  platformData: PlatformBusinessData[];
  /** Any errors that occurred */
  errors: string[];
}

/**
 * Create an empty BusinessData object
 */
export function createEmptyBusinessData(): BusinessData {
  return {
    name: '',
    reviews: [],
    sources: [],
  };
}

/**
 * Options for merging business data
 */
export interface MergeBusinessDataOptions {
  /** If user explicitly provided a platform URL, boost it to top priority */
  prioritizePlatform?: 'nextdoor' | 'yelp' | 'facebook';
}

/**
 * Merge platform data into a unified BusinessData object
 * Priority: Google > Nextdoor > Yelp > Facebook (unless overridden)
 *
 * @param platformData - Array of platform-specific data
 * @param options - Optional merge configuration
 * @returns Merged BusinessData
 */
export function mergeBusinessData(
  platformData: PlatformBusinessData[],
  options?: MergeBusinessDataOptions
): BusinessData {
  // Default priority order: google first, then nextdoor, yelp, facebook
  let priorityOrder: Array<PlatformBusinessData['platform']> = ['google', 'nextdoor', 'yelp', 'facebook'];

  // If user explicitly provided a platform URL, boost it to top priority
  if (options?.prioritizePlatform) {
    priorityOrder = [
      options.prioritizePlatform,
      ...priorityOrder.filter(p => p !== options.prioritizePlatform)
    ];
  }

  const sorted = [...platformData].sort((a, b) => {
    return priorityOrder.indexOf(a.platform) - priorityOrder.indexOf(b.platform);
  });

  const merged = createEmptyBusinessData();
  const allReviews: BusinessReview[] = [];
  const allSources: string[] = [];

  for (const data of sorted) {
    // Merge scalar fields (first non-empty value wins due to priority sorting)
    if (data.name && !merged.name) merged.name = data.name;
    if (data.phone && !merged.phone) merged.phone = data.phone;
    if (data.email && !merged.email) merged.email = data.email;
    if (data.address && !merged.address) merged.address = data.address;
    if (data.city && !merged.city) merged.city = data.city;
    if (data.state && !merged.state) merged.state = data.state;
    if (data.zip && !merged.zip) merged.zip = data.zip;
    if (data.logoUrl && !merged.logoUrl) merged.logoUrl = data.logoUrl;
    if (data.rating && !merged.rating) merged.rating = data.rating;
    if (data.website && !merged.website) merged.website = data.website;
    if (data.about && !merged.about) merged.about = data.about;

    // Merge services (combine unique values)
    if (data.services?.length) {
      const existing = new Set(merged.services || []);
      for (const service of data.services) {
        if (!existing.has(service)) {
          merged.services = merged.services || [];
          merged.services.push(service);
          existing.add(service);
        }
      }
    }

    // Merge categories (combine unique values)
    if (data.categories?.length) {
      const existing = new Set(merged.categories || []);
      for (const category of data.categories) {
        if (!existing.has(category)) {
          merged.categories = merged.categories || [];
          merged.categories.push(category);
          existing.add(category);
        }
      }
    }

    // Merge hours (first non-empty wins)
    if (data.hours && !merged.hours) {
      merged.hours = data.hours;
    }

    // Collect reviews from all platforms
    if (data.reviews?.length) {
      allReviews.push(...data.reviews);
    }

    // Track source URL
    if (data.sourceUrl) {
      allSources.push(data.sourceUrl);
    }
  }

  // Deduplicate reviews by text similarity
  merged.reviews = deduplicateReviews(allReviews);
  merged.reviewCount = merged.reviews.length;
  merged.sources = allSources;

  return merged;
}

/**
 * Deduplicate reviews by checking for similar text
 * Reviews from different platforms with very similar text are considered duplicates
 */
function deduplicateReviews(reviews: BusinessReview[]): BusinessReview[] {
  const unique: BusinessReview[] = [];
  const seenTexts = new Set<string>();

  for (const review of reviews) {
    // Normalize text for comparison
    const normalized = review.text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 100); // Compare first 100 chars

    if (!seenTexts.has(normalized)) {
      seenTexts.add(normalized);
      unique.push(review);
    }
  }

  return unique;
}

/**
 * Check if business data has enough content to be useful
 */
export function hasMinimumBusinessData(data: BusinessData): boolean {
  // Must have a name
  if (!data.name) return false;

  // Must have at least phone, email, or address
  const hasContact = Boolean(data.phone || data.email || data.address);

  return hasContact;
}

/**
 * Format phone number consistently
 */
export function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Handle US numbers with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if unrecognized format
  return phone;
}
