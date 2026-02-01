#!/usr/bin/env node
/**
 * Lead Discovery CLI
 *
 * Unified CLI for discovering leads from multiple sources (Yelp, Yellow Pages, Google Places).
 * Supports filtering for businesses without websites - the ideal leads!
 *
 * Usage:
 *   npx tsx src/cli/discover-leads.ts <query> <location> [options]
 *
 * Examples:
 *   npx tsx src/cli/discover-leads.ts plumbers "Phoenix, AZ" --no-website
 *   npx tsx src/cli/discover-leads.ts "cleaning services" "Austin, TX" --no-website --source=yelp
 *   npx tsx src/cli/discover-leads.ts contractors "Denver, CO" --export=leads.csv
 */

import * as fs from 'fs';
import { searchYelp, YelpBusiness, YelpScraper } from '../discovery/yelp-scraper';
import { searchYellowPages, YellowPagesBusiness, YellowPagesScraper } from '../discovery/yellowpages-scraper';
import { generateCSV, ParsedLead } from '../utils/csv-parser';
import { getSpiderClient } from '../discovery/spider-client';
import { createContactExtractorV2 } from '../discovery/contact-extractor-v2';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════════╗
║                    LEAD DISCOVERY CLI                             ║
║         Find businesses that need websites!                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  USAGE:                                                          ║
║    discover-leads <query> <location> [options]                   ║
║                                                                  ║
║  ARGUMENTS:                                                      ║
║    query         Business type to search for                     ║
║    location      City and state (e.g., "Phoenix, AZ")            ║
║                                                                  ║
║  OPTIONS:                                                        ║
║    --no-website      Only show businesses WITHOUT websites       ║
║                      (These are your ideal leads!)               ║
║    --has-website     Only show businesses WITH websites          ║
║                      (Potential redesign clients)                ║
║    --source=<src>    Source to search (yelp, yellowpages, all)   ║
║    --max=<n>         Maximum results per source (default: 50)    ║
║    --export=<file>   Export results to CSV file                  ║
║    --industry=<type> Set industry type for exports               ║
║    --validate        Validate URLs before processing (Spider)    ║
║    --deep-extract    Deep crawl sites for contact extraction     ║
║                                                                  ║
║  EXAMPLES:                                                       ║
║    # Find plumbers in Phoenix without websites                   ║
║    discover-leads plumbers "Phoenix, AZ" --no-website            ║
║                                                                  ║
║    # Find cleaning services in Austin, export to CSV             ║
║    discover-leads "cleaning" "Austin, TX" --no-website \\        ║
║      --export=austin-cleaning.csv --industry=cleaning            ║
║                                                                  ║
║    # Search only Yelp for contractors                            ║
║    discover-leads contractors "Denver, CO" --source=yelp         ║
║                                                                  ║
║    # Find businesses that need a redesign (have outdated sites)  ║
║    discover-leads hvac "Las Vegas, NV" --has-website             ║
║                                                                  ║
║    # Discover with URL validation (skip dead sites)              ║
║    discover-leads plumbers "Phoenix, AZ" --validate --max=10     ║
║                                                                  ║
║    # Deep extract contacts from multiple pages                   ║
║    discover-leads dentists "Austin, TX" --deep-extract           ║
║                                                                  ║
║  LEAD PRIORITY:                                                  ║
║    1. NO WEBSITE = Easiest to close (use --no-website)           ║
║    2. HAS WEBSITE = Redesign opportunity (use --has-website)     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

interface DiscoveredLead {
  name: string;
  url: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  rating?: number;
  reviewCount?: number;
  source: 'yelp' | 'yellowpages' | 'google';
  hasNoWebsite: boolean;
  sourceUrl: string;
}

interface DiscoverOptions {
  query: string;
  location: string;
  noWebsiteOnly: boolean;
  hasWebsiteOnly: boolean;
  source: 'yelp' | 'yellowpages' | 'all';
  maxResults: number;
  exportFile?: string;
  industry?: string;
  validate: boolean;
  deepExtract: boolean;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Parse arguments
  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const query = positionalArgs[0];
  const location = positionalArgs[1];

  if (!query || !location) {
    console.error('Error: Both query and location are required.');
    console.log('Usage: discover-leads <query> <location> [options]');
    process.exit(1);
  }

  const options: DiscoverOptions = {
    query,
    location,
    noWebsiteOnly: args.includes('--no-website'),
    hasWebsiteOnly: args.includes('--has-website'),
    source: 'all',
    maxResults: 50,
    validate: args.includes('--validate'),
    deepExtract: args.includes('--deep-extract'),
  };

  // Parse valued options
  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      const source = arg.split('=')[1];
      if (['yelp', 'yellowpages', 'all'].includes(source)) {
        options.source = source as 'yelp' | 'yellowpages' | 'all';
      }
    }
    if (arg.startsWith('--max=')) {
      options.maxResults = parseInt(arg.split('=')[1], 10) || 50;
    }
    if (arg.startsWith('--export=')) {
      options.exportFile = arg.split('=')[1];
    }
    if (arg.startsWith('--industry=')) {
      options.industry = arg.split('=')[1];
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🔍 LEAD DISCOVERY                              ║
╚══════════════════════════════════════════════════════════════════╝
`);
  console.log(`  Query: ${options.query}`);
  console.log(`  Location: ${options.location}`);
  console.log(`  Source: ${options.source}`);
  console.log(`  Max per source: ${options.maxResults}`);
  if (options.noWebsiteOnly) {
    console.log(`  Filter: 🎯 NO WEBSITE ONLY (ideal leads!)`);
  } else if (options.hasWebsiteOnly) {
    console.log(`  Filter: HAS WEBSITE (redesign opportunities)`);
  }
  if (options.validate) {
    console.log(`  🕷️ URL validation: ENABLED (Spider)`);
  }
  if (options.deepExtract) {
    console.log(`  📄 Deep extraction: ENABLED (multi-page crawl)`);
  }
  console.log();

  try {
    const leads = await discoverLeads(options);
    displayResults(leads, options);

    if (options.exportFile) {
      exportToCSV(leads, options);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function discoverLeads(options: DiscoverOptions): Promise<DiscoveredLead[]> {
  const allLeads: DiscoveredLead[] = [];

  // Search Yelp
  if (options.source === 'yelp' || options.source === 'all') {
    console.log(`\n📍 Searching Yelp...`);
    try {
      const yelpResults = await searchYelp({
        query: options.query,
        location: options.location,
        maxResults: options.maxResults,
        noWebsiteOnly: options.noWebsiteOnly,
        hasWebsiteOnly: options.hasWebsiteOnly,
      });

      const yelpLeads = yelpResults.businesses.map(b => convertYelpBusiness(b));
      allLeads.push(...yelpLeads);
      console.log(`  ✓ Found ${yelpLeads.length} leads from Yelp`);
    } catch (err: any) {
      console.error(`  ⚠️ Yelp search failed: ${err.message}`);
    }
  }

  // Search Yellow Pages
  if (options.source === 'yellowpages' || options.source === 'all') {
    console.log(`\n📍 Searching Yellow Pages...`);
    try {
      const ypResults = await searchYellowPages({
        query: options.query,
        location: options.location,
        maxResults: options.maxResults,
        noWebsiteOnly: options.noWebsiteOnly,
        hasWebsiteOnly: options.hasWebsiteOnly,
      });

      const ypLeads = ypResults.businesses.map(b => convertYellowPagesBusiness(b));
      allLeads.push(...ypLeads);
      console.log(`  ✓ Found ${ypLeads.length} leads from Yellow Pages`);
    } catch (err: any) {
      console.error(`  ⚠️ Yellow Pages search failed: ${err.message}`);
    }
  }

  // Deduplicate by name (rough match)
  let dedupedLeads = deduplicateLeads(allLeads);

  // Validate URLs if requested (Spider-powered)
  if (options.validate && dedupedLeads.length > 0) {
    const leadsWithUrls = dedupedLeads.filter(l => l.url && !l.hasNoWebsite);
    if (leadsWithUrls.length > 0) {
      console.log(`\n🕷️ Validating ${leadsWithUrls.length} URLs with Spider...`);
      const spider = getSpiderClient();
      const urls = leadsWithUrls.map(l => l.url);
      const results = await spider.validateBulk(urls, 10);

      const validUrls = new Set<string>();
      let deadCount = 0;

      results.forEach((result, url) => {
        if (result.valid) {
          validUrls.add(url);
        } else {
          deadCount++;
        }
      });

      // Filter out leads with dead URLs
      dedupedLeads = dedupedLeads.filter(l => {
        if (!l.url || l.hasNoWebsite) return true; // Keep leads without URLs
        return validUrls.has(l.url);
      });

      console.log(`  ✓ ${validUrls.size} valid, ${deadCount} dead URLs filtered out`);
    }
  }

  // Deep extract contacts if requested
  if (options.deepExtract && dedupedLeads.length > 0) {
    const leadsWithUrls = dedupedLeads.filter(l => l.url && !l.hasNoWebsite);
    if (leadsWithUrls.length > 0) {
      console.log(`\n📄 Deep extracting contacts from ${leadsWithUrls.length} sites...`);
      const extractor = createContactExtractorV2({ maxPages: 5, maxDepth: 2 });

      for (const lead of leadsWithUrls.slice(0, 10)) { // Limit to first 10 for performance
        try {
          process.stdout.write(`  Crawling ${lead.name}...`);
          const contacts = await extractor.extractContacts(lead.url);
          if (contacts.emails.length > 0) {
            console.log(` found ${contacts.emails.length} email(s)`);
            // Store extracted contacts in custom field for export
            (lead as any).extractedEmails = contacts.emails;
            (lead as any).extractedPhones = contacts.phones;
          } else {
            console.log(' no contacts found');
          }
        } catch (err: any) {
          console.log(` error: ${err.message}`);
        }
      }
    }
  }

  return dedupedLeads;
}

function convertYelpBusiness(b: YelpBusiness): DiscoveredLead {
  const parsed = YelpScraper.parseAddress(b.address || '');
  return {
    name: b.name,
    url: b.url,
    phone: b.phone,
    address: b.address,
    city: parsed.city || b.city,
    state: parsed.state || b.state,
    zip: parsed.zip || b.zip,
    rating: b.rating,
    reviewCount: b.reviewCount,
    source: 'yelp',
    hasNoWebsite: YelpScraper.hasNoRealWebsite(b),
    sourceUrl: b.yelpUrl,
  };
}

function convertYellowPagesBusiness(b: YellowPagesBusiness): DiscoveredLead {
  return {
    name: b.name,
    url: b.url,
    phone: b.phone,
    address: b.address,
    city: b.city,
    state: b.state,
    zip: b.zip,
    rating: b.rating,
    reviewCount: b.reviewCount,
    source: 'yellowpages',
    hasNoWebsite: YellowPagesScraper.hasNoRealWebsite(b),
    sourceUrl: b.yellowPagesUrl,
  };
}

function deduplicateLeads(leads: DiscoveredLead[]): DiscoveredLead[] {
  const seen = new Map<string, DiscoveredLead>();

  for (const lead of leads) {
    // Normalize name for matching
    const normalizedName = lead.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // If we haven't seen this business, or the new one has more data
    const existing = seen.get(normalizedName);
    if (!existing) {
      seen.set(normalizedName, lead);
    } else {
      // Prefer the one with more data
      const existingScore = scoreLeadData(existing);
      const newScore = scoreLeadData(lead);
      if (newScore > existingScore) {
        seen.set(normalizedName, lead);
      }
    }
  }

  return Array.from(seen.values());
}

function scoreLeadData(lead: DiscoveredLead): number {
  let score = 0;
  if (lead.phone) score += 2;
  if (lead.url) score += 1;
  if (lead.city) score += 1;
  if (lead.state) score += 1;
  if (lead.rating) score += 1;
  return score;
}

function displayResults(leads: DiscoveredLead[], options: DiscoverOptions) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    📊 RESULTS                                     ║
╚══════════════════════════════════════════════════════════════════╝
`);

  const noWebsiteLeads = leads.filter(l => l.hasNoWebsite);
  const hasWebsiteLeads = leads.filter(l => !l.hasNoWebsite);

  console.log(`  Total leads found: ${leads.length}`);
  console.log(`  🎯 WITHOUT website: ${noWebsiteLeads.length} (easiest to close!)`);
  console.log(`  📄 WITH website: ${hasWebsiteLeads.length} (redesign opportunities)`);
  console.log();

  // Show sample leads
  const displayLeads = options.noWebsiteOnly ? noWebsiteLeads : options.hasWebsiteOnly ? hasWebsiteLeads : leads;

  console.log(`  📋 Sample leads (first 15):`);
  console.log(`  ${'─'.repeat(60)}`);

  for (const lead of displayLeads.slice(0, 15)) {
    const websiteStatus = lead.hasNoWebsite ? '🎯 NO SITE' : '📄 Has site';
    console.log(`  ${lead.name}`);
    console.log(`     ${websiteStatus} | ${lead.phone || 'no phone'} | ${lead.city || ''}, ${lead.state || ''}`);
    if (lead.rating) console.log(`     ⭐ ${lead.rating} (${lead.reviewCount || 0} reviews) | via ${lead.source}`);
    console.log();
  }

  if (displayLeads.length > 15) {
    console.log(`  ... and ${displayLeads.length - 15} more leads`);
  }

  // Summary stats by source
  console.log(`\n  📈 By Source:`);
  const bySource = new Map<string, number>();
  for (const lead of leads) {
    bySource.set(lead.source, (bySource.get(lead.source) || 0) + 1);
  }
  for (const [source, count] of bySource) {
    console.log(`     ${source}: ${count} leads`);
  }
}

function exportToCSV(leads: DiscoveredLead[], options: DiscoverOptions) {
  console.log(`\n💾 Exporting to ${options.exportFile}...`);

  // Convert to ParsedLead format
  const parsedLeads: ParsedLead[] = leads.map(lead => ({
    business_name: lead.name,
    website_url: lead.url,
    email: undefined, // We don't have email from scrapers
    phone: lead.phone,
    contact_name: undefined,
    industry: options.industry as any,
    city: lead.city,
    state: lead.state,
    address: lead.address,
    zip: lead.zip,
  }));

  const csv = generateCSV(parsedLeads);
  fs.writeFileSync(options.exportFile!, csv);

  console.log(`  ✅ Exported ${leads.length} leads to ${options.exportFile}`);
  console.log(`\n  To import: npx tsx src/cli/import-csv.ts import ${options.exportFile} --skip-duplicates`);
}

// Run CLI
main();
