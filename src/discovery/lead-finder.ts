import { searchBusinesses, PlaceResult, filterBusinessesWithWebsites } from './google-places';
import { extractContactInfo, ContactInfo } from './contact-extractor';
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
}

export async function discoverLeads(options: DiscoveryOptions): Promise<DiscoveredLead[]> {
  const { query, maxResults = 20, scoreThreshold = 6, skipExisting = true } = options;

  console.log(`\n🔍 Discovering leads: "${query}"\n`);

  // Step 1: Find businesses
  const businesses = await searchBusinesses({ query, maxResults: maxResults * 2 });
  console.log(`  Found ${businesses.length} businesses`);

  // Step 2: Filter to those with websites
  const withWebsites = await filterBusinessesWithWebsites(businesses);
  console.log(`  ${withWebsites.length} have websites`);

  const db = getLeadDatabase();
  const leads: DiscoveredLead[] = [];

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
      // Extract contact info
      console.log(`    📧 Extracting contacts...`);
      const contactInfo = await extractContactInfo(business.website!);

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
  const query = process.argv[2] || 'plumbers in Austin TX';
  const maxResults = parseInt(process.argv[3] || '5', 10);
  const threshold = parseInt(process.argv[4] || '6', 10);

  discoverLeads({
    query,
    maxResults,
    scoreThreshold: threshold,
    skipExisting: true
  })
    .then(leads => {
      console.log(formatDiscoveryReport(leads));

      // Optionally save to database
      if (process.argv.includes('--save')) {
        return saveDiscoveredLeads(leads);
      }
    })
    .catch(err => {
      console.error('Discovery failed:', err);
      process.exit(1);
    });
}
