import { searchBusinesses, PlaceResult, filterBusinessesWithWebsites } from './google-places';
import { extractContactInfo, ContactInfo } from './contact-extractor';
import { ContactExtractorV2, createContactExtractorV2 } from './contact-extractor-v2';
import { SpiderClient, getSpiderClient } from './spider-client';
import { captureWebsite } from '../capture/website-capture';
import { generateManifest, saveManifest } from '../capture/manifest-generator';
import { scoreWebsite, WebsiteScore } from '../outreach/website-scorer';
import { getLeadDatabase, Lead } from '../outreach/lead-database';

export interface DiscoveredLead {
  business: PlaceResult;
  contactInfo: ContactInfo;
  websiteScore?: WebsiteScore;
  isGoodLead: boolean;
  reason: string;
}

export interface DiscoveryOptions {
  query: string;
  maxResults?: number;
  scoreThreshold?: number;  // Only include sites scoring below this
  skipExisting?: boolean;   // Skip businesses already in database
  validateUrls?: boolean;   // Validate URLs before processing (Spider-powered)
  deepExtract?: boolean;    // Use multi-page crawl for contact extraction
}

export async function discoverLeads(options: DiscoveryOptions): Promise<DiscoveredLead[]> {
  const {
    query,
    maxResults = 20,
    scoreThreshold = 6,
    skipExisting = true,
    validateUrls = false,
    deepExtract = false
  } = options;

  console.log(`\n🔍 Discovering leads: "${query}"\n`);
  if (validateUrls) console.log(`  URL validation: enabled`);
  if (deepExtract) console.log(`  Deep extraction: enabled`);

  // Step 1: Find businesses
  const businesses = await searchBusinesses({ query, maxResults: maxResults * 2 });
  console.log(`  Found ${businesses.length} businesses`);

  // Step 2: Filter to those with websites
  let withWebsites = await filterBusinessesWithWebsites(businesses);
  console.log(`  ${withWebsites.length} have websites`);

  // Step 2.5: Validate URLs in bulk (optional, Spider-powered)
  if (validateUrls && withWebsites.length > 0) {
    console.log(`\n  🕷️ Validating URLs with Spider...`);
    const spider = getSpiderClient();
    const urls = withWebsites.map(b => b.website!);
    const validationResults = await spider.validateBulk(urls, 10);

    const validCount = Array.from(validationResults.values()).filter(r => r.valid).length;
    const deadCount = withWebsites.length - validCount;

    withWebsites = withWebsites.filter(b => {
      const result = validationResults.get(b.website!);
      return result?.valid;
    });

    console.log(`  ✓ ${validCount} valid, ${deadCount} dead/unreachable URLs filtered out`);
  }

  const db = getLeadDatabase();
  const leads: DiscoveredLead[] = [];

  // Initialize deep extractor if needed
  const deepExtractor = deepExtract ? createContactExtractorV2({ maxPages: 10, maxDepth: 2 }) : null;

  // Step 3: Process each business
  for (const business of withWebsites) {
    if (leads.length >= maxResults) break;

    console.log(`\n  Processing: ${business.name}`);

    // Skip if already in database
    if (skipExisting) {
      try {
        const existing = await db.getLeadByUrl(business.website!);
        if (existing) {
          console.log(`    ⏭️ Already in database, skipping`);
          continue;
        }
      } catch (e) {
        // Database might not be set up, continue anyway
      }
    }

    try {
      // Extract contact info (use deep extractor or standard)
      console.log(`    📧 Extracting contacts${deepExtract ? ' (deep crawl)' : ''}...`);

      let contactInfo: ContactInfo;
      if (deepExtractor) {
        const result = await deepExtractor.extractContacts(business.website!);
        contactInfo = {
          emails: result.emails,
          phones: result.phones,
          socialLinks: result.socialLinks,
          contactPageUrl: result.contactPageUrl,
        };
        if (result.pagesCrawled > 1) {
          console.log(`    📄 Crawled ${result.pagesCrawled} pages`);
        }
      } else {
        contactInfo = await extractContactInfo(business.website!);
      }

      // Skip if no email found
      if (contactInfo.emails.length === 0) {
        console.log(`    ❌ No email found, skipping`);
        leads.push({
          business,
          contactInfo,
          isGoodLead: false,
          reason: 'No email found'
        });
        continue;
      }

      // Capture and score the website
      console.log(`    📊 Scoring website...`);
      const captureResult = await captureWebsite({ url: business.website! });
      const manifest = generateManifest(captureResult);
      const score = scoreWebsite(manifest);

      console.log(`    Score: ${score.overall}/10 (threshold: <${scoreThreshold})`);

      // Determine if it's a good lead
      const isGoodLead = score.overall < scoreThreshold;
      const reason = isGoodLead
        ? `Score ${score.overall}/10 below threshold ${scoreThreshold}`
        : `Score ${score.overall}/10 above threshold ${scoreThreshold}`;

      if (isGoodLead) {
        console.log(`    ✅ Good lead!`);
      } else {
        console.log(`    ⏭️ Score too high, not a good lead`);
      }

      leads.push({
        business,
        contactInfo,
        websiteScore: score,
        isGoodLead,
        reason
      });

    } catch (err: any) {
      console.log(`    ❌ Error: ${err.message}`);
      leads.push({
        business,
        contactInfo: { emails: [], phones: [], socialLinks: {} },
        isGoodLead: false,
        reason: `Error: ${err.message}`
      });
    }
  }

  // Summary
  const goodLeads = leads.filter(l => l.isGoodLead);
  console.log(`\n📋 Discovery Summary:`);
  console.log(`  Total processed: ${leads.length}`);
  console.log(`  Good leads: ${goodLeads.length}`);
  console.log(`  Filtered out: ${leads.length - goodLeads.length}`);

  return leads;
}

export async function saveDiscoveredLeads(leads: DiscoveredLead[]): Promise<Lead[]> {
  const db = getLeadDatabase();
  const savedLeads: Lead[] = [];

  console.log(`\n💾 Saving ${leads.filter(l => l.isGoodLead).length} leads to database...`);

  for (const discovered of leads.filter(l => l.isGoodLead)) {
    try {
      const lead = await db.createLead({
        website_url: discovered.business.website!,
        business_name: discovered.business.name,
        email: discovered.contactInfo.emails[0],
        phone: discovered.business.phone || discovered.contactInfo.phones[0],
        score: discovered.websiteScore?.overall,
        score_breakdown: discovered.websiteScore ? {
          overall: discovered.websiteScore.overall,
          design: discovered.websiteScore.design.score,
          mobile: discovered.websiteScore.mobile.score,
          performance: discovered.websiteScore.performance.score,
          seo: discovered.websiteScore.seo.score
        } : undefined,
        status: 'scored',
        notes: `Discovered via: ${discovered.business.address}. Rating: ${discovered.business.rating}/5 (${discovered.business.totalRatings} reviews)`
      });

      savedLeads.push(lead);
      console.log(`  ✓ Saved: ${lead.business_name}`);
    } catch (err: any) {
      console.error(`  ✗ Failed to save ${discovered.business.name}: ${err.message}`);
    }
  }

  return savedLeads;
}

export function formatDiscoveryReport(leads: DiscoveredLead[]): string {
  const goodLeads = leads.filter(l => l.isGoodLead);

  let report = `
╔══════════════════════════════════════════════════════════════╗
║                    LEAD DISCOVERY REPORT                      ║
╠══════════════════════════════════════════════════════════════╣
║  Total Processed: ${leads.length.toString().padEnd(42)}║
║  Good Leads: ${goodLeads.length.toString().padEnd(47)}║
║  Conversion Rate: ${((goodLeads.length / leads.length) * 100).toFixed(1)}%${' '.repeat(39)}║
╠══════════════════════════════════════════════════════════════╣
`;

  if (goodLeads.length > 0) {
    report += `║  GOOD LEADS:                                                 ║\n`;
    for (const lead of goodLeads.slice(0, 10)) {
      const name = lead.business.name.slice(0, 30).padEnd(30);
      const score = `${lead.websiteScore?.overall || '?'}/10`;
      const email = (lead.contactInfo.emails[0] || 'No email').slice(0, 20);
      report += `║  • ${name} ${score.padEnd(5)} ${email.padEnd(20)}║\n`;
    }
  }

  report += `╚══════════════════════════════════════════════════════════════╝`;

  return report;
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args.find(a => !a.startsWith('--')) || 'plumbers in Austin TX';
  const maxResults = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '5', 10);
  const threshold = parseInt(args.find(a => a.startsWith('--threshold='))?.split('=')[1] || '6', 10);
  const validateUrls = args.includes('--validate');
  const deepExtract = args.includes('--deep-extract');

  discoverLeads({
    query,
    maxResults,
    scoreThreshold: threshold,
    skipExisting: true,
    validateUrls,
    deepExtract
  })
    .then(leads => {
      console.log(formatDiscoveryReport(leads));

      // Optionally save to database
      if (args.includes('--save')) {
        return saveDiscoveredLeads(leads);
      }
    })
    .catch(err => {
      console.error('Discovery failed:', err);
      process.exit(1);
    });
}
