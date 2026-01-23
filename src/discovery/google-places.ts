import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  types: string[];
  location: {
    lat: number;
    lng: number;
  };
}

export interface SearchOptions {
  query: string;
  location?: string;
  radius?: number; // meters, default 50000 (50km)
  type?: string;
  maxResults?: number;
}

const API_KEY = process.env.GOOGLE_PLACES_KEY || '';

export async function searchBusinesses(options: SearchOptions): Promise<PlaceResult[]> {
  const { query, location, radius = 50000, maxResults = 20 } = options;

  if (!API_KEY) {
    console.warn('⚠️ GOOGLE_PLACES_KEY not set. Using mock data for testing.');
    return getMockResults(query);
  }

  const results: PlaceResult[] = [];
  let nextPageToken: string | undefined;

  try {
    // First, geocode the location if provided
    let locationParam = '';
    if (location) {
      const coords = await geocodeLocation(location);
      if (coords) {
        locationParam = `&location=${coords.lat},${coords.lng}&radius=${radius}`;
      }
    }

    // Text search for businesses
    do {
      const searchUrl = nextPageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${locationParam}&key=${API_KEY}`;

      const response = await fetchJSON(searchUrl);

      if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', response.status, response.error_message);
        break;
      }

      for (const place of response.results || []) {
        if (results.length >= maxResults) break;

        // Get place details for website and phone
        const details = await getPlaceDetails(place.place_id);

        results.push({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          phone: details?.phone,
          website: details?.website,
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          types: place.types || [],
          location: {
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng
          }
        });
      }

      nextPageToken = response.next_page_token;

      // API requires a short delay before using next_page_token
      if (nextPageToken && results.length < maxResults) {
        await sleep(2000);
      }
    } while (nextPageToken && results.length < maxResults);

  } catch (err: any) {
    console.error('Error searching businesses:', err.message);
  }

  return results;
}

async function getPlaceDetails(placeId: string): Promise<{ phone?: string; website?: string } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website&key=${API_KEY}`;
    const response = await fetchJSON(url);

    if (response.status === 'OK' && response.result) {
      return {
        phone: response.result.formatted_phone_number,
        website: response.result.website
      };
    }
  } catch (err) {
    // Ignore details errors
  }
  return null;
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${API_KEY}`;
    const response = await fetchJSON(url);

    if (response.status === 'OK' && response.results?.[0]) {
      return response.results[0].geometry.location;
    }
  } catch (err) {
    // Ignore geocode errors
  }
  return null;
}

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMockResults(query: string): PlaceResult[] {
  // Return mock data for testing without API key
  const category = query.toLowerCase().split(' in ')[0] || 'business';
  const location = query.toLowerCase().split(' in ')[1] || 'local area';

  console.log(`📍 Mock search: "${category}" in "${location}"`);

  return [
    {
      placeId: 'mock-place-1',
      name: `${capitalize(category)} Pro Services`,
      address: `123 Main St, ${capitalize(location)}`,
      phone: '(512) 555-0101',
      website: 'https://example.com',
      rating: 4.2,
      totalRatings: 45,
      types: ['plumber', 'contractor'],
      location: { lat: 30.2672, lng: -97.7431 }
    },
    {
      placeId: 'mock-place-2',
      name: `Quick ${capitalize(category)}`,
      address: `456 Oak Ave, ${capitalize(location)}`,
      phone: '(512) 555-0102',
      website: 'https://example.org',
      rating: 3.8,
      totalRatings: 23,
      types: ['plumber', 'home_services'],
      location: { lat: 30.2700, lng: -97.7500 }
    },
    {
      placeId: 'mock-place-3',
      name: `${capitalize(location)} ${capitalize(category)} Co`,
      address: `789 Elm Blvd, ${capitalize(location)}`,
      phone: '(512) 555-0103',
      website: 'https://example.net',
      rating: 4.5,
      totalRatings: 89,
      types: ['plumber', 'local_business'],
      location: { lat: 30.2650, lng: -97.7400 }
    },
    {
      placeId: 'mock-place-4',
      name: `A+ ${capitalize(category)} Solutions`,
      address: `321 Pine St, ${capitalize(location)}`,
      phone: '(512) 555-0104',
      website: undefined, // No website - good lead!
      rating: 3.5,
      totalRatings: 12,
      types: ['plumber'],
      location: { lat: 30.2680, lng: -97.7450 }
    },
    {
      placeId: 'mock-place-5',
      name: `Reliable ${capitalize(category)}`,
      address: `654 Cedar Ln, ${capitalize(location)}`,
      phone: '(512) 555-0105',
      website: 'http://old-website-example.com',
      rating: 4.0,
      totalRatings: 67,
      types: ['plumber', 'contractor'],
      location: { lat: 30.2690, lng: -97.7420 }
    }
  ];
}

function capitalize(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function filterBusinessesWithWebsites(results: PlaceResult[]): Promise<PlaceResult[]> {
  // Filter to only businesses that have websites (potential leads for redesign)
  return results.filter(r => r.website);
}

export async function filterBusinessesWithoutWebsites(results: PlaceResult[]): Promise<PlaceResult[]> {
  // Filter to businesses without websites (potential leads for new website)
  return results.filter(r => !r.website);
}

// CLI entry point
if (require.main === module) {
  const query = process.argv[2] || 'plumbers in Austin TX';

  console.log(`\n🔍 Searching for: "${query}"\n`);

  searchBusinesses({ query, maxResults: 10 })
    .then(results => {
      console.log(`Found ${results.length} businesses:\n`);
      for (const r of results) {
        console.log(`  ${r.name}`);
        console.log(`    📍 ${r.address}`);
        console.log(`    📞 ${r.phone || 'N/A'}`);
        console.log(`    🌐 ${r.website || 'No website'}`);
        console.log(`    ⭐ ${r.rating || 'N/A'} (${r.totalRatings || 0} reviews)`);
        console.log('');
      }
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}
