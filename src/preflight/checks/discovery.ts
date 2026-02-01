/**
 * Discovery Checks
 *
 * Verifies Google Places API key and functionality.
 */

import { PreflightResult, PreflightOptions, PreflightCheck, createResult } from '../types';
import { features } from '../../utils/config';

const CATEGORY = 'Discovery';

/**
 * Check Google Places API key configuration
 */
async function checkGooglePlacesConfig(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional) {
    return createResult(CATEGORY, 'Google Places config', 'skip', Date.now() - start, {
      message: 'Skipped (--skip-optional)',
    });
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;

  if (!apiKey) {
    return createResult(CATEGORY, 'Google Places config', 'warn', Date.now() - start, {
      message: 'GOOGLE_PLACES_KEY not configured',
      details: {
        hint: 'Discovery features will be disabled',
      },
    });
  }

  // Basic format check
  if (apiKey.length < 20) {
    return createResult(CATEGORY, 'Google Places config', 'warn', Date.now() - start, {
      message: 'API key format may be invalid',
    });
  }

  return createResult(CATEGORY, 'Google Places config', 'pass', Date.now() - start, {
    details: options.verbose ? { keyLength: apiKey.length } : undefined,
  });
}

/**
 * Test Google Places API with a sample search
 */
async function checkGooglePlacesApi(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  if (options.skipOptional || !features.discovery) {
    return createResult(CATEGORY, 'Google Places API', 'skip', Date.now() - start, {
      message: options.skipOptional ? 'Skipped (--skip-optional)' : 'Discovery not configured',
    });
  }

  try {
    const { searchBusinesses } = await import('../../discovery/google-places');

    // Test search with a simple query
    const results = await searchBusinesses({ query: 'coffee shop in Austin TX', maxResults: 1 });

    if (!results || results.length === 0) {
      return createResult(CATEGORY, 'Google Places API', 'warn', Date.now() - start, {
        message: 'API working but returned no results',
      });
    }

    return createResult(CATEGORY, 'Google Places API', 'pass', Date.now() - start, {
      message: `API working (found ${results.length} result)`,
      details: options.verbose ? { sampleResult: results[0]?.name } : undefined,
    });
  } catch (error: any) {
    // Check for specific error types
    if (error.message?.includes('API key')) {
      return createResult(CATEGORY, 'Google Places API', 'fail', Date.now() - start, {
        message: 'Invalid or restricted API key',
        details: { error: error.message },
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('OVER_QUERY_LIMIT')) {
      return createResult(CATEGORY, 'Google Places API', 'warn', Date.now() - start, {
        message: 'API quota exceeded',
      });
    }

    return createResult(CATEGORY, 'Google Places API', 'fail', Date.now() - start, {
      message: `API test failed: ${error.message}`,
    });
  }
}

/**
 * Check contact extractor functionality
 */
async function checkContactExtractor(options: PreflightOptions): Promise<PreflightResult> {
  const start = Date.now();

  try {
    const { extractContactInfo } = await import('../../discovery/contact-extractor');

    // Test with a known website that has contact info
    const contactInfo = await extractContactInfo('https://example.com');

    // example.com won't have real contact info, but the extractor should work
    return createResult(CATEGORY, 'Contact extractor', 'pass', Date.now() - start, {
      message: 'Extractor working',
      details: options.verbose ? { emailsFound: contactInfo.emails?.length || 0 } : undefined,
    });
  } catch (error: any) {
    return createResult(CATEGORY, 'Contact extractor', 'warn', Date.now() - start, {
      message: `Extractor test failed: ${error.message}`,
    });
  }
}

/**
 * Export all discovery checks
 */
export const discoveryChecks: PreflightCheck[] = [
  {
    category: CATEGORY,
    name: 'Google Places config',
    required: false,
    run: checkGooglePlacesConfig,
  },
  {
    category: CATEGORY,
    name: 'Google Places API',
    required: false,
    run: checkGooglePlacesApi,
  },
  {
    category: CATEGORY,
    name: 'Contact extractor',
    required: false,
    run: checkContactExtractor,
  },
];
