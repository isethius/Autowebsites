#!/usr/bin/env node
/**
 * URL Validation CLI
 *
 * Bulk validate URLs from database or CSV files using Spider.
 * Reports valid, redirect, dead, and timeout URLs.
 *
 * Usage:
 *   npx tsx src/cli/validate-urls.ts --all
 *   npx tsx src/cli/validate-urls.ts --stage=new
 *   npx tsx src/cli/validate-urls.ts --file=urls.csv
 *   npx tsx src/cli/validate-urls.ts --all --output=results.csv
 *   npx tsx src/cli/validate-urls.ts --all --update-db
 */

import * as fs from 'fs';
import { SpiderClient, ValidationResult } from '../discovery/spider-client';
import { LeadModel, Lead, PipelineStage, PIPELINE_STAGES } from '../crm/lead-model';

const HELP_TEXT = `
+==================================================================+
|                    URL VALIDATION CLI                              |
|         Validate lead URLs in bulk using Spider                    |
+==================================================================+

  USAGE:
    validate-urls [options]

  SOURCE OPTIONS (choose one):
    --all                 Validate all leads in database
    --stage=<stage>       Validate leads in specific stage
                          (new, qualified, contacted, proposal_sent,
                           negotiating, won, lost)
    --file=<path>         Validate URLs from CSV/TXT file
    --url=<url>           Validate a single URL

  OUTPUT OPTIONS:
    --output=<path>       Export results to CSV file
    --update-db           Update database with validation results
                          (marks dead URLs with 'dead_url' tag)
    --json                Output results as JSON
    --quiet               Minimal output (just summary)

  VALIDATION OPTIONS:
    --concurrency=<n>     Concurrent requests (default: 10)
    --timeout=<ms>        Request timeout in ms (default: 10000)
    --retry               Retry failed URLs once

  EXAMPLES:
    # Validate all leads
    validate-urls --all

    # Validate new leads and update database
    validate-urls --stage=new --update-db

    # Validate from CSV and export results
    validate-urls --file=urls.csv --output=results.csv

    # Quick single URL check
    validate-urls --url=https://example.com
`;

interface ValidateOptions {
  source: 'all' | 'stage' | 'file' | 'url';
  stage?: PipelineStage;
  filePath?: string;
  singleUrl?: string;
  outputPath?: string;
  updateDb: boolean;
  jsonOutput: boolean;
  quiet: boolean;
  concurrency: number;
  timeout: number;
  retry: boolean;
}

interface ValidationStats {
  total: number;
  valid: number;
  redirects: number;
  dead: number;
  timeout: number;
  errors: number;
}

interface UrlValidationRecord {
  url: string;
  leadId?: string;
  businessName?: string;
  result: ValidationResult;
  status: 'valid' | 'redirect' | 'dead' | 'timeout' | 'error';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const options = parseOptions(args);

  if (!options.quiet) {
    console.log(`
+==================================================================+
|                    URL VALIDATION                                  |
+==================================================================+
`);
  }

  try {
    const results = await validateUrls(options);
    displayResults(results, options);

    if (options.outputPath) {
      exportResults(results, options.outputPath);
    }

    if (options.updateDb && options.source !== 'file' && options.source !== 'url') {
      await updateDatabase(results);
    }

  } catch (error: any) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

function parseOptions(args: string[]): ValidateOptions {
  const options: ValidateOptions = {
    source: 'all',
    updateDb: args.includes('--update-db'),
    jsonOutput: args.includes('--json'),
    quiet: args.includes('--quiet'),
    concurrency: 10,
    timeout: 10000,
    retry: args.includes('--retry'),
  };

  for (const arg of args) {
    if (arg === '--all') {
      options.source = 'all';
    }
    if (arg.startsWith('--stage=')) {
      const stage = arg.split('=')[1] as PipelineStage;
      if (PIPELINE_STAGES.includes(stage)) {
        options.source = 'stage';
        options.stage = stage;
      } else {
        throw new Error(`Invalid stage: ${stage}. Valid: ${PIPELINE_STAGES.join(', ')}`);
      }
    }
    if (arg.startsWith('--file=')) {
      options.source = 'file';
      options.filePath = arg.split('=')[1];
    }
    if (arg.startsWith('--url=')) {
      options.source = 'url';
      options.singleUrl = arg.split('=')[1];
    }
    if (arg.startsWith('--output=')) {
      options.outputPath = arg.split('=')[1];
    }
    if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10) || 10;
    }
    if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1], 10) || 10000;
    }
  }

  return options;
}

async function validateUrls(options: ValidateOptions): Promise<UrlValidationRecord[]> {
  const spider = new SpiderClient({ timeout: options.timeout });
  const results: UrlValidationRecord[] = [];

  // Get URLs to validate
  const urlsToValidate = await getUrlsToValidate(options);

  if (urlsToValidate.length === 0) {
    console.log('No URLs to validate.');
    return [];
  }

  if (!options.quiet) {
    console.log(`  Validating ${urlsToValidate.length} URLs...`);
    console.log(`  Concurrency: ${options.concurrency}`);
    console.log(`  Timeout: ${options.timeout}ms`);
    console.log();
  }

  // Process in batches for progress reporting
  const batchSize = options.concurrency;
  const totalBatches = Math.ceil(urlsToValidate.length / batchSize);

  for (let i = 0; i < urlsToValidate.length; i += batchSize) {
    const batch = urlsToValidate.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    if (!options.quiet) {
      process.stdout.write(`\r  Processing batch ${batchNum}/${totalBatches}...`);
    }

    // Validate batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        let result = await spider.validateUrl(item.url);

        // Retry on timeout if enabled
        if (options.retry && result.error === 'Timeout') {
          result = await spider.validateUrl(item.url);
        }

        const status = getStatus(result);

        return {
          url: item.url,
          leadId: item.leadId,
          businessName: item.businessName,
          result,
          status,
        };
      })
    );

    results.push(...batchResults);
  }

  if (!options.quiet) {
    console.log('\n');
  }

  return results;
}

async function getUrlsToValidate(options: ValidateOptions): Promise<Array<{ url: string; leadId?: string; businessName?: string }>> {
  switch (options.source) {
    case 'url':
      return [{ url: options.singleUrl! }];

    case 'file':
      return getUrlsFromFile(options.filePath!);

    case 'stage':
    case 'all':
      return getUrlsFromDatabase(options);
  }
}

function getUrlsFromFile(filePath: string): Array<{ url: string }> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Check if CSV with headers
  const firstLine = lines[0]?.toLowerCase();
  const isCSV = firstLine?.includes(',');
  const hasUrlHeader = firstLine?.includes('url') || firstLine?.includes('website');

  if (isCSV && hasUrlHeader) {
    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const urlIndex = headers.findIndex(h =>
      h === 'url' || h === 'website' || h === 'website_url' || h === 'domain'
    );

    if (urlIndex === -1) {
      throw new Error('CSV must have a url, website, or website_url column');
    }

    return lines.slice(1)
      .map(line => {
        const cols = line.split(',');
        return { url: cols[urlIndex]?.trim().replace(/^["']|["']$/g, '') };
      })
      .filter(item => item.url);
  }

  // Plain text, one URL per line
  return lines.map(line => ({ url: line.trim() }));
}

async function getUrlsFromDatabase(options: ValidateOptions): Promise<Array<{ url: string; leadId: string; businessName: string }>> {
  const leadModel = new LeadModel();

  const filter: any = {};
  if (options.source === 'stage' && options.stage) {
    filter.pipeline_stage = options.stage;
  }

  const { leads } = await leadModel.list(filter, { limit: 10000 });

  return leads
    .filter(lead => lead.website_url)
    .map(lead => ({
      url: lead.website_url,
      leadId: lead.id,
      businessName: lead.business_name,
    }));
}

function getStatus(result: ValidationResult): 'valid' | 'redirect' | 'dead' | 'timeout' | 'error' {
  if (result.error === 'Timeout') {
    return 'timeout';
  }
  if (result.error) {
    return 'error';
  }
  if (result.redirectUrl) {
    return 'redirect';
  }
  if (result.valid) {
    return 'valid';
  }
  return 'dead';
}

function displayResults(results: UrlValidationRecord[], options: ValidateOptions) {
  if (options.jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Calculate stats
  const stats: ValidationStats = {
    total: results.length,
    valid: results.filter(r => r.status === 'valid').length,
    redirects: results.filter(r => r.status === 'redirect').length,
    dead: results.filter(r => r.status === 'dead').length,
    timeout: results.filter(r => r.status === 'timeout').length,
    errors: results.filter(r => r.status === 'error').length,
  };

  console.log(`  VALIDATION SUMMARY`);
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  Total URLs:    ${stats.total}`);
  console.log(`  Valid:         ${stats.valid} (${percent(stats.valid, stats.total)})`);
  console.log(`  Redirects:     ${stats.redirects} (${percent(stats.redirects, stats.total)})`);
  console.log(`  Dead:          ${stats.dead} (${percent(stats.dead, stats.total)})`);
  console.log(`  Timeout:       ${stats.timeout} (${percent(stats.timeout, stats.total)})`);
  console.log(`  Errors:        ${stats.errors} (${percent(stats.errors, stats.total)})`);

  if (!options.quiet) {
    // Show dead URLs
    const deadUrls = results.filter(r => r.status === 'dead' || r.status === 'error');
    if (deadUrls.length > 0) {
      console.log(`\n  DEAD/ERROR URLs (first 20):`);
      console.log(`  ${'─'.repeat(60)}`);
      for (const record of deadUrls.slice(0, 20)) {
        const name = record.businessName ? ` (${record.businessName})` : '';
        const error = record.result.error ? ` - ${record.result.error}` : '';
        const code = record.result.statusCode ? ` [${record.result.statusCode}]` : '';
        console.log(`  ${record.url}${name}${code}${error}`);
      }
      if (deadUrls.length > 20) {
        console.log(`  ... and ${deadUrls.length - 20} more`);
      }
    }

    // Show redirects
    const redirectUrls = results.filter(r => r.status === 'redirect');
    if (redirectUrls.length > 0) {
      console.log(`\n  REDIRECTS (first 10):`);
      console.log(`  ${'─'.repeat(60)}`);
      for (const record of redirectUrls.slice(0, 10)) {
        console.log(`  ${record.url}`);
        console.log(`    -> ${record.result.redirectUrl}`);
      }
      if (redirectUrls.length > 10) {
        console.log(`  ... and ${redirectUrls.length - 10} more`);
      }
    }
  }
}

function percent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function exportResults(results: UrlValidationRecord[], outputPath: string) {
  const headers = ['url', 'status', 'status_code', 'redirect_url', 'response_time', 'error', 'lead_id', 'business_name'];
  const rows = results.map(r => [
    r.url,
    r.status,
    r.result.statusCode || '',
    r.result.redirectUrl || '',
    r.result.responseTime || '',
    r.result.error || '',
    r.leadId || '',
    r.businessName || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
  ].join('\n');

  fs.writeFileSync(outputPath, csv);
  console.log(`\n  Results exported to: ${outputPath}`);
}

async function updateDatabase(results: UrlValidationRecord[]) {
  const deadUrls = results.filter(r =>
    (r.status === 'dead' || r.status === 'error') && r.leadId
  );

  if (deadUrls.length === 0) {
    console.log('\n  No dead URLs to update in database.');
    return;
  }

  console.log(`\n  Updating ${deadUrls.length} leads with dead URLs...`);

  const leadModel = new LeadModel();
  let updated = 0;

  for (const record of deadUrls) {
    try {
      await leadModel.addTag(record.leadId!, 'dead_url');
      await leadModel.update(record.leadId!, {
        notes: `URL validation failed: ${record.result.error || 'Dead URL'}`,
      });
      updated++;
    } catch (err: any) {
      // Continue on error
    }
  }

  console.log(`  Updated ${updated} leads with 'dead_url' tag`);
}

// Run CLI
main();
