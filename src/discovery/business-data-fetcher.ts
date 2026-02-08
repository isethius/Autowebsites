/**
 * Multi-Platform Business Data Fetcher
 *
 * Orchestrates fetching business data from multiple platforms and merges
 * the results into a unified BusinessData object.
 *
 * Supported platforms:
 * - Google Places API (primary source)
 * - Nextdoor (WebFetch scraping)
 * - Yelp (Playwright scraping)
 * - Facebook (WebFetch scraping)
 *
 * Usage:
 * ```typescript
 * const result = await fetchBusinessData({
 *   googleQuery: 'Gustavo Landscape Tucson AZ',
 *   nextdoorUrl: 'https://nextdoor.com/pages/gustavos-landscape-tucson-az/',
 * });
 *
 * if (result.success && result.data) {
 *   console.log(result.data.name, result.data.phone, result.data.logoUrl);
 * }
 * ```
 */

import {
  BusinessData,
  BusinessDataFetchOptions,
  BusinessDataFetchResult,
  PlatformBusinessData,
  MergeBusinessDataOptions,
  mergeBusinessData,
} from './business-data';
import { searchBusinesses, getPlaceDetailsWithReviews } from './google-places';
import { scrapeNextdoor } from './nextdoor-scraper';
import { scrapeFacebook } from './facebook-scraper';
import { searchYelp, YelpScraper } from './yelp-scraper';

/**
 * Fetch business data from multiple platforms and merge results
 *
 * @param options - URLs and queries for each platform
 * @returns Merged business data from all available sources
 */
export async function fetchBusinessData(
  options: BusinessDataFetchOptions
): Promise<BusinessDataFetchResult> {
  const {
    googleQuery,
    nextdoorUrl,
    yelpUrl,
    facebookUrl,
    maxReviewsPerPlatform = 5,
  } = options;

  const platformData: PlatformBusinessData[] = [];
  const errors: string[] = [];

  // Fetch from all platforms in parallel
  const promises: Promise<void>[] = [];

  // Google Places API
  if (googleQuery) {
    promises.push(
      fetchFromGoogle(googleQuery, maxReviewsPerPlatform)
        .then(data => {
          if (data) platformData.push(data);
        })
        .catch(err => {
          errors.push(`Google: ${err.message}`);
        })
    );
  }

  // Nextdoor
  if (nextdoorUrl) {
    promises.push(
      scrapeNextdoor(nextdoorUrl, maxReviewsPerPlatform)
        .then(result => {
          if (result.success && result.data) {
            platformData.push(result.data);
          } else if (result.error) {
            errors.push(`Nextdoor: ${result.error}`);
          }
        })
        .catch(err => {
          errors.push(`Nextdoor: ${err.message}`);
        })
    );
  }

  // Yelp
  if (yelpUrl) {
    promises.push(
      fetchFromYelp(yelpUrl, maxReviewsPerPlatform)
        .then(data => {
          if (data) platformData.push(data);
        })
        .catch(err => {
          errors.push(`Yelp: ${err.message}`);
        })
    );
  }

  // Facebook
  if (facebookUrl) {
    promises.push(
      scrapeFacebook(facebookUrl, maxReviewsPerPlatform)
        .then(result => {
          if (result.success && result.data) {
            platformData.push(result.data);
          } else if (result.error) {
            errors.push(`Facebook: ${result.error}`);
          }
        })
        .catch(err => {
          errors.push(`Facebook: ${err.message}`);
        })
    );
  }

  // Wait for all fetches to complete
  await Promise.all(promises);

  // Check if we got any data
  if (platformData.length === 0) {
    return {
      success: false,
      data: null,
      platformData: [],
      errors: errors.length > 0 ? errors : ['No data sources provided or all sources failed'],
    };
  }

  // Detect which platform was explicitly provided by the user
  // (prioritize user-provided URLs over auto-discovered data)
  const explicitPlatform: MergeBusinessDataOptions['prioritizePlatform'] =
    nextdoorUrl ? 'nextdoor' :
    yelpUrl ? 'yelp' :
    facebookUrl ? 'facebook' :
    undefined;

  // Merge data from all platforms (with explicit platform prioritized)
  const mergedData = mergeBusinessData(platformData, { prioritizePlatform: explicitPlatform });

  console.log(`[BusinessDataFetcher] Merged data from ${platformData.length} platforms`);
  console.log(`  - Name: ${mergedData.name}`);
  console.log(`  - Phone: ${mergedData.phone || 'N/A'}`);
  console.log(`  - Logo: ${mergedData.logoUrl ? 'Yes' : 'No'}`);
  console.log(`  - Reviews: ${mergedData.reviews.length}`);
  console.log(`  - Sources: ${mergedData.sources.join(', ')}`);

  return {
    success: true,
    data: mergedData,
    platformData,
    errors,
  };
}

/**
 * Fetch business data from Google Places API
 */
async function fetchFromGoogle(
  query: string,
  maxReviews: number
): Promise<PlatformBusinessData | null> {
  console.log(`[Google] Searching: ${query}`);

  // Search for the business
  const results = await searchBusinesses({ query, maxResults: 1 });

  if (results.length === 0) {
    console.log('[Google] No results found');
    return null;
  }

  const place = results[0];

  // Get detailed information including reviews
  let reviews: PlatformBusinessData['reviews'] = [];
  let about: string | undefined;

  try {
    const details = await getPlaceDetailsWithReviews(place.placeId, maxReviews);
    if (details) {
      reviews = details.reviews.map(r => ({
        text: r.text,
        author: r.author,
        rating: r.rating,
        date: r.date,
        source: 'google' as const,
      }));
      about = details.about;
    }
  } catch (err) {
    console.warn('[Google] Could not fetch reviews:', err);
  }

  // Parse address into components
  const addressParts = parseGoogleAddress(place.address);

  const data: PlatformBusinessData = {
    platform: 'google',
    sourceUrl: `https://maps.google.com/?cid=${place.placeId}`,
    name: place.name,
    phone: place.phone,
    website: place.website,
    address: addressParts.street,
    city: addressParts.city,
    state: addressParts.state,
    zip: addressParts.zip,
    rating: place.rating,
    reviewCount: place.totalRatings,
    reviews,
    about,
    categories: place.types,
  };

  console.log(`[Google] Found: ${data.name}, rating: ${data.rating || 'N/A'}, reviews: ${reviews.length}`);

  return data;
}

/**
 * Parse Google's formatted address into components
 */
function parseGoogleAddress(address: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  if (!address) return {};

  // Common pattern: "123 Main St, City, ST 12345, USA"
  const parts = address.split(',').map(p => p.trim());

  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];

    // State and ZIP often in same part
    const stateZipMatch = parts[2]?.match(/([A-Z]{2})\s*(\d{5})?/);
    const state = stateZipMatch?.[1];
    const zip = stateZipMatch?.[2];

    return { street, city, state, zip };
  }

  return { street: address };
}

/**
 * Fetch business data from Yelp
 * Note: This requires visiting the business page to get full details
 */
async function fetchFromYelp(
  yelpUrl: string,
  maxReviews: number
): Promise<PlatformBusinessData | null> {
  console.log(`[Yelp] Fetching: ${yelpUrl}`);

  // For a direct Yelp URL, we need to scrape the page
  // This is a simplified version - the full YelpScraper handles this

  // Extract business slug from URL for search
  const slugMatch = yelpUrl.match(/\/biz\/([^/?]+)/);
  if (!slugMatch) {
    console.log('[Yelp] Invalid URL format');
    return null;
  }

  const slug = slugMatch[1];
  const parts = slug.split('-');

  // Try to extract location (usually last 2-3 parts are city-state)
  let location = '';
  let name = '';

  if (parts.length >= 3) {
    // Assume format: business-name-city-state
    const state = parts[parts.length - 1];
    const city = parts[parts.length - 2];

    if (state.length === 2) {
      location = `${city}, ${state.toUpperCase()}`;
      name = parts.slice(0, -2).join(' ');
    } else {
      // Just use all but last as name
      name = parts.slice(0, -1).join(' ');
      location = parts[parts.length - 1];
    }
  } else {
    name = parts.join(' ');
  }

  // Capitalize name
  name = name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  try {
    // Use the YelpScraper to search and enrich
    const scraper = new YelpScraper();
    const result = await scraper.search({
      query: name,
      location: location || 'USA',
      maxResults: 1,
    });

    if (result.businesses.length === 0) {
      console.log('[Yelp] No business found');
      return null;
    }

    const biz = result.businesses[0];

    // Parse address
    const addressParts = YelpScraper.parseAddress(biz.address || '');

    const data: PlatformBusinessData = {
      platform: 'yelp',
      sourceUrl: biz.yelpUrl,
      name: biz.name,
      phone: biz.phone,
      website: biz.url || undefined,
      address: addressParts.address,
      city: biz.city || addressParts.city,
      state: biz.state || addressParts.state,
      zip: biz.zip || addressParts.zip,
      logoUrl: biz.imageUrl,
      rating: biz.rating,
      reviewCount: biz.reviewCount,
      categories: biz.categories,
      reviews: [], // Yelp reviews require additional scraping
    };

    console.log(`[Yelp] Found: ${data.name}, rating: ${data.rating || 'N/A'}`);

    return data;
  } catch (err: any) {
    console.error('[Yelp] Scraping failed:', err.message);
    return null;
  }
}

/**
 * Quick fetch for a single business - just Nextdoor (fastest, no browser needed)
 *
 * @param nextdoorUrl - Nextdoor business page URL
 * @returns Business data from Nextdoor only
 */
export async function fetchFromNextdoorOnly(
  nextdoorUrl: string
): Promise<BusinessDataFetchResult> {
  return fetchBusinessData({ nextdoorUrl });
}

/**
 * Quick fetch combining Google + Nextdoor (good balance of speed and coverage)
 *
 * @param googleQuery - Google search query
 * @param nextdoorUrl - Nextdoor business page URL
 * @returns Merged business data
 */
export async function fetchFromGoogleAndNextdoor(
  googleQuery: string,
  nextdoorUrl: string
): Promise<BusinessDataFetchResult> {
  return fetchBusinessData({ googleQuery, nextdoorUrl });
}

/**
 * Full fetch from all available platforms
 *
 * @param options - All platform URLs/queries
 * @returns Merged business data from all sources
 */
export async function fetchFromAllPlatforms(
  options: BusinessDataFetchOptions
): Promise<BusinessDataFetchResult> {
  return fetchBusinessData(options);
}

// CLI entry point for testing
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let googleQuery: string | undefined;
  let nextdoorUrl: string | undefined;
  let yelpUrl: string | undefined;
  let facebookUrl: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--google':
      case '-g':
        googleQuery = args[++i];
        break;
      case '--nextdoor':
      case '-n':
        nextdoorUrl = args[++i];
        break;
      case '--yelp':
      case '-y':
        yelpUrl = args[++i];
        break;
      case '--facebook':
      case '-f':
        facebookUrl = args[++i];
        break;
      default:
        // Default to Nextdoor if URL looks like Nextdoor
        if (arg.includes('nextdoor.com')) {
          nextdoorUrl = arg;
        } else if (arg.includes('yelp.com')) {
          yelpUrl = arg;
        } else if (arg.includes('facebook.com')) {
          facebookUrl = arg;
        } else {
          googleQuery = arg;
        }
    }
  }

  if (!googleQuery && !nextdoorUrl && !yelpUrl && !facebookUrl) {
    console.log(`
Usage: ts-node business-data-fetcher.ts [options]

Options:
  -g, --google <query>      Google search query
  -n, --nextdoor <url>      Nextdoor business page URL
  -y, --yelp <url>          Yelp business page URL
  -f, --facebook <url>      Facebook business page URL

Examples:
  ts-node business-data-fetcher.ts -n https://nextdoor.com/pages/gustavos-landscape-tucson-az/
  ts-node business-data-fetcher.ts -g "Gustavo Landscape Tucson AZ" -n https://nextdoor.com/pages/gustavos-landscape-tucson-az/
  ts-node business-data-fetcher.ts https://nextdoor.com/pages/example/
`);
    process.exit(1);
  }

  console.log('\n=== Business Data Fetcher ===\n');
  console.log('Sources:');
  if (googleQuery) console.log(`  Google: ${googleQuery}`);
  if (nextdoorUrl) console.log(`  Nextdoor: ${nextdoorUrl}`);
  if (yelpUrl) console.log(`  Yelp: ${yelpUrl}`);
  if (facebookUrl) console.log(`  Facebook: ${facebookUrl}`);
  console.log();

  fetchBusinessData({ googleQuery, nextdoorUrl, yelpUrl, facebookUrl })
    .then(result => {
      if (result.success && result.data) {
        console.log('\n=== Merged Business Data ===\n');
        console.log(`Name: ${result.data.name}`);
        console.log(`Phone: ${result.data.phone || 'N/A'}`);
        console.log(`Email: ${result.data.email || 'N/A'}`);
        console.log(`Address: ${result.data.address || 'N/A'}`);
        console.log(`City: ${result.data.city || 'N/A'}`);
        console.log(`State: ${result.data.state || 'N/A'}`);
        console.log(`ZIP: ${result.data.zip || 'N/A'}`);
        console.log(`Website: ${result.data.website || 'N/A'}`);
        console.log(`Logo URL: ${result.data.logoUrl || 'N/A'}`);
        console.log(`Rating: ${result.data.rating || 'N/A'}`);
        console.log(`Review Count: ${result.data.reviewCount || 0}`);
        console.log(`Services: ${result.data.services?.join(', ') || 'N/A'}`);
        console.log(`Categories: ${result.data.categories?.join(', ') || 'N/A'}`);
        console.log(`About: ${result.data.about?.slice(0, 100) || 'N/A'}...`);
        console.log(`Sources: ${result.data.sources.join(', ')}`);

        if (result.data.reviews.length > 0) {
          console.log('\n=== Reviews ===\n');
          for (const review of result.data.reviews.slice(0, 5)) {
            console.log(`[${review.source}] "${review.text.slice(0, 80)}..." - ${review.author} (${review.rating} stars)`);
          }
        }

        if (result.errors.length > 0) {
          console.log('\n=== Warnings ===\n');
          for (const error of result.errors) {
            console.log(`  - ${error}`);
          }
        }
      } else {
        console.log('\n=== Failed ===\n');
        console.log('Errors:');
        for (const error of result.errors) {
          console.log(`  - ${error}`);
        }
      }
    })
    .catch(err => {
      console.error('\nFatal error:', err.message);
      process.exit(1);
    });
}
