#!/usr/bin/env node
/**
 * CSV Import/Export CLI for AutoWebsites Pro
 *
 * Import bulk leads from CSV files or export existing leads to CSV.
 *
 * Usage:
 *   npx tsx src/cli/import-csv.ts import <file.csv> [options]
 *   npx tsx src/cli/import-csv.ts export [options]
 *   npx tsx src/cli/import-csv.ts sample
 *
 * Examples:
 *   npx tsx src/cli/import-csv.ts import leads.csv --industry=plumbers --dry-run
 *   npx tsx src/cli/import-csv.ts import leads.csv --city=Phoenix --state=AZ
 *   npx tsx src/cli/import-csv.ts export --stage=new --industry=plumbers -o output.csv
 *   npx tsx src/cli/import-csv.ts export --city=Austin -o austin-leads.csv
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseCSV,
  generateCSV,
  autoDetectColumns,
  detectDelimiter,
  getSampleCSVFormat,
  ParsedLead,
  ParseResult,
} from '../utils/csv-parser';
import { LeadModel, CreateLeadInput, Lead, LeadFilter, PipelineStage } from '../crm/lead-model';
import { IndustryType, INDUSTRIES } from '../ai/industry-templates';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════╗
║              CSV IMPORT/EXPORT CLI                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  COMMANDS:                                                   ║
║    import <file.csv>    Import leads from CSV file           ║
║    export               Export leads to CSV file             ║
║    sample               Show sample CSV format               ║
║                                                              ║
║  IMPORT OPTIONS:                                             ║
║    --dry-run            Validate without saving              ║
║    --industry=<type>    Set default industry for all leads   ║
║    --city=<name>        Set default city for all leads       ║
║    --state=<code>       Set default state for all leads      ║
║    --skip-duplicates    Skip leads with existing URLs        ║
║    --delimiter=<char>   CSV delimiter (auto-detected)        ║
║    --no-header          CSV has no header row                ║
║    --batch=<size>       Batch size for inserts (default: 50) ║
║    --tag=<name>         Add tag to all imported leads        ║
║                                                              ║
║  EXPORT OPTIONS:                                             ║
║    -o, --output=<file>  Output file path (default: stdout)   ║
║    --stage=<stage>      Filter by pipeline stage             ║
║    --industry=<type>    Filter by industry                   ║
║    --city=<name>        Filter by city                       ║
║    --state=<code>       Filter by state                      ║
║    --has-email          Only leads with email addresses      ║
║    --limit=<n>          Maximum number of leads              ║
║                                                              ║
║  EXAMPLES:                                                   ║
║    import leads.csv --industry=plumbers --dry-run            ║
║    import az-plumbers.csv --city=Phoenix --state=AZ          ║
║    export --stage=new --industry=plumbers -o new-plumbers.csv║
║    export --city=Austin --has-email -o austin.csv            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

interface ImportOptions {
  dryRun: boolean;
  defaultIndustry?: IndustryType;
  defaultCity?: string;
  defaultState?: string;
  skipDuplicates: boolean;
  delimiter?: string;
  hasHeader: boolean;
  batchSize: number;
  tag?: string;
}

interface ExportOptions {
  outputFile?: string;
  stage?: PipelineStage;
  industry?: IndustryType;
  city?: string;
  state?: string;
  hasEmail: boolean;
  limit: number;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'import':
        await handleImport(args.slice(1));
        break;
      case 'export':
        await handleExport(args.slice(1));
        break;
      case 'sample':
        handleSample();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

async function handleImport(args: string[]) {
  const filePath = args.find(a => !a.startsWith('-'));
  if (!filePath) {
    throw new Error('Please provide a CSV file path');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Parse options
  const options = parseImportOptions(args);

  console.log(`\n📥 Importing leads from ${filePath}\n`);
  console.log(`Options:`);
  console.log(`  Dry run: ${options.dryRun}`);
  console.log(`  Skip duplicates: ${options.skipDuplicates}`);
  if (options.defaultIndustry) console.log(`  Default industry: ${options.defaultIndustry}`);
  if (options.defaultCity) console.log(`  Default city: ${options.defaultCity}`);
  if (options.defaultState) console.log(`  Default state: ${options.defaultState}`);
  if (options.tag) console.log(`  Tag: ${options.tag}`);
  console.log();

  // Parse CSV
  const result = parseCSV(filePath, {
    delimiter: options.delimiter,
    hasHeader: options.hasHeader,
    skipEmptyRows: true,
    trimValues: true,
  });

  // Show parsing summary
  console.log(`📊 Parsing Summary:`);
  console.log(`  Total rows: ${result.totalRows}`);
  console.log(`  Valid rows: ${result.validRows}`);
  console.log(`  Skipped rows: ${result.skippedRows}`);
  console.log(`  Errors: ${result.errors.length}`);

  // Show parsing errors
  if (result.errors.length > 0) {
    console.log(`\n⚠️ Parsing Errors (first 10):`);
    for (const error of result.errors.slice(0, 10)) {
      console.log(`  Row ${error.row}: ${error.message}`);
    }
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more errors`);
    }
  }

  if (result.leads.length === 0) {
    console.log(`\n❌ No valid leads to import`);
    return;
  }

  // Apply defaults
  const leadsToImport = result.leads.map(lead => ({
    ...lead,
    industry: lead.industry || options.defaultIndustry,
    city: lead.city || options.defaultCity,
    state: lead.state || options.defaultState,
  }));

  // Preview first few leads
  console.log(`\n📋 Preview (first 5 leads):`);
  for (const lead of leadsToImport.slice(0, 5)) {
    console.log(`  ${lead.business_name} | ${lead.website_url} | ${lead.email || 'no email'} | ${lead.industry || 'unknown'}`);
  }
  if (leadsToImport.length > 5) {
    console.log(`  ... and ${leadsToImport.length - 5} more leads`);
  }

  if (options.dryRun) {
    console.log(`\n✅ Dry run complete. ${leadsToImport.length} leads would be imported.`);
    console.log(`   Run without --dry-run to actually import.`);
    return;
  }

  // Import to database
  console.log(`\n💾 Importing ${leadsToImport.length} leads to database...`);

  const leadModel = new LeadModel();
  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  // Process in batches
  const batches = chunk(leadsToImport, options.batchSize);
  let batchNum = 0;

  for (const batch of batches) {
    batchNum++;
    process.stdout.write(`\r  Batch ${batchNum}/${batches.length}...`);

    for (const lead of batch) {
      try {
        // Check for duplicate
        if (options.skipDuplicates && lead.website_url) {
          const existing = await leadModel.getByUrl(lead.website_url);
          if (existing) {
            duplicates++;
            continue;
          }
        }

        // Create lead
        const input: CreateLeadInput = {
          business_name: lead.business_name,
          website_url: lead.website_url,
          email: lead.email,
          phone: lead.phone,
          contact_name: lead.contact_name,
          industry: lead.industry,
          city: lead.city,
          state: lead.state,
          address: lead.address,
          zip: lead.zip,
          tags: options.tag ? [options.tag] : undefined,
        };

        await leadModel.create(input);
        imported++;
      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          console.error(`\n  Error importing ${lead.business_name}: ${err.message}`);
        }
      }
    }
  }

  console.log(`\n\n✅ Import Complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Duplicates skipped: ${duplicates}`);
  console.log(`  Errors: ${errors}`);
}

async function handleExport(args: string[]) {
  const options = parseExportOptions(args);

  console.log(`\n📤 Exporting leads to CSV\n`);
  console.log(`Filters:`);
  if (options.stage) console.log(`  Stage: ${options.stage}`);
  if (options.industry) console.log(`  Industry: ${options.industry}`);
  if (options.city) console.log(`  City: ${options.city}`);
  if (options.state) console.log(`  State: ${options.state}`);
  if (options.hasEmail) console.log(`  Has email: yes`);
  console.log(`  Limit: ${options.limit}`);
  console.log();

  const leadModel = new LeadModel();

  // Build filter
  const filter: LeadFilter = {};
  if (options.stage) filter.pipeline_stage = options.stage;
  if (options.industry) filter.industry = options.industry;
  if (options.hasEmail) filter.has_email = true;

  // Fetch leads
  const { leads } = await leadModel.list(filter, { limit: options.limit });

  // Apply additional filters (city/state not in LeadModel filter)
  let filteredLeads = leads;
  if (options.city) {
    filteredLeads = filteredLeads.filter(l => l.city?.toLowerCase() === options.city?.toLowerCase());
  }
  if (options.state) {
    filteredLeads = filteredLeads.filter(l => l.state?.toLowerCase() === options.state?.toLowerCase());
  }

  if (filteredLeads.length === 0) {
    console.log(`❌ No leads found matching the criteria`);
    return;
  }

  // Convert to ParsedLead format
  const parsedLeads: ParsedLead[] = filteredLeads.map(lead => ({
    business_name: lead.business_name,
    website_url: lead.website_url,
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    contact_name: lead.contact_name || undefined,
    industry: lead.industry,
    city: lead.city || undefined,
    state: lead.state || undefined,
    address: lead.address || undefined,
    zip: lead.zip || undefined,
  }));

  // Generate CSV
  const csv = generateCSV(parsedLeads);

  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, csv);
    console.log(`✅ Exported ${filteredLeads.length} leads to ${options.outputFile}`);
  } else {
    console.log(`\n--- CSV OUTPUT (${filteredLeads.length} leads) ---\n`);
    console.log(csv);
    console.log(`\n--- END CSV OUTPUT ---`);
  }
}

function handleSample() {
  console.log(`\n📄 Sample CSV Format:\n`);
  console.log(getSampleCSVFormat());
  console.log(`\n📝 Supported columns (auto-detected):`);
  console.log(`  business_name, company, name`);
  console.log(`  website_url, website, url, domain`);
  console.log(`  email, email_address, contact_email`);
  console.log(`  phone, phone_number, telephone`);
  console.log(`  contact_name, contact, owner`);
  console.log(`  industry, category, type`);
  console.log(`  city, town`);
  console.log(`  state, province, region`);
  console.log(`  address, street`);
  console.log(`  zip, zipcode, postal_code`);
  console.log();
}

function parseImportOptions(args: string[]): ImportOptions {
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    skipDuplicates: args.includes('--skip-duplicates'),
    hasHeader: !args.includes('--no-header'),
    batchSize: 50,
  };

  // Parse valued options
  for (const arg of args) {
    if (arg.startsWith('--industry=')) {
      const industry = arg.split('=')[1];
      if (INDUSTRIES.includes(industry as IndustryType)) {
        options.defaultIndustry = industry as IndustryType;
      } else {
        throw new Error(`Invalid industry: ${industry}. Valid: ${INDUSTRIES.join(', ')}`);
      }
    }
    if (arg.startsWith('--city=')) {
      options.defaultCity = arg.split('=')[1];
    }
    if (arg.startsWith('--state=')) {
      options.defaultState = arg.split('=')[1];
    }
    if (arg.startsWith('--delimiter=')) {
      options.delimiter = arg.split('=')[1];
    }
    if (arg.startsWith('--batch=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10) || 50;
    }
    if (arg.startsWith('--tag=')) {
      options.tag = arg.split('=')[1];
    }
  }

  return options;
}

function parseExportOptions(args: string[]): ExportOptions {
  const options: ExportOptions = {
    hasEmail: args.includes('--has-email'),
    limit: 1000,
  };

  // Parse valued options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-o' && args[i + 1]) {
      options.outputFile = args[i + 1];
    }
    if (arg.startsWith('--output=')) {
      options.outputFile = arg.split('=')[1];
    }
    if (arg.startsWith('--stage=')) {
      options.stage = arg.split('=')[1] as PipelineStage;
    }
    if (arg.startsWith('--industry=')) {
      options.industry = arg.split('=')[1] as IndustryType;
    }
    if (arg.startsWith('--city=')) {
      options.city = arg.split('=')[1];
    }
    if (arg.startsWith('--state=')) {
      options.state = arg.split('=')[1];
    }
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10) || 1000;
    }
  }

  return options;
}

/**
 * Split array into chunks
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Run CLI
main();
