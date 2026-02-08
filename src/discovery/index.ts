/**
 * Discovery Module
 *
 * Tools for discovering and fetching business data from multiple platforms.
 */

// Core interfaces and utilities
export * from './business-data';

// Multi-platform fetcher
export {
  fetchBusinessData,
  fetchFromNextdoorOnly,
  fetchFromGoogleAndNextdoor,
  fetchFromAllPlatforms,
} from './business-data-fetcher';

// Platform-specific scrapers
export { scrapeNextdoor, type NextdoorScraperResult } from './nextdoor-scraper';
export { scrapeFacebook, type FacebookScraperResult } from './facebook-scraper';
export {
  YelpScraper,
  searchYelp,
  scrapeYelpToBusinessData,
  type YelpBusiness,
  type YelpSearchOptions,
  type YelpSearchResult,
  type YelpScraperResult,
} from './yelp-scraper';

// Google Places API
export {
  searchBusinesses,
  getPlaceDetailsWithReviews,
  searchBusinessWithReviews,
  type PlaceResult,
  type PlaceReview,
  type PlaceDetailsWithReviews,
  type SearchOptions,
} from './google-places';
