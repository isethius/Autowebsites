import * as fs from 'fs';
import * as path from 'path';
import { IndustryType, INDUSTRIES } from '../ai/industry-templates';

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  columnMapping?: Partial<ColumnMapping>;
  skipEmptyRows?: boolean;
  trimValues?: boolean;
}

export interface ColumnMapping {
  business_name: string | number;
  website_url: string | number;
  email: string | number;
  phone: string | number;
  contact_name: string | number;
  industry: string | number;
  city: string | number;
  state: string | number;
  address: string | number;
  zip: string | number;
}

export interface ParsedLead {
  business_name: string;
  website_url: string;
  email?: string;
  phone?: string;
  contact_name?: string;
  industry?: IndustryType;
  city?: string;
  state?: string;
  address?: string;
  zip?: string;
  raw?: Record<string, string>;
}

export interface ParseResult {
  leads: ParsedLead[];
  errors: { row: number; message: string }[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
}

// Common column name variations for auto-detection
const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  business_name: ['business_name', 'business', 'company', 'company_name', 'name', 'businessname', 'companyname', 'organization', 'org'],
  website_url: ['website_url', 'website', 'url', 'site', 'web', 'homepage', 'domain', 'site_url', 'web_url'],
  email: ['email', 'email_address', 'e-mail', 'emailaddress', 'contact_email', 'mail'],
  phone: ['phone', 'phone_number', 'telephone', 'tel', 'phonenumber', 'contact_phone', 'mobile', 'cell'],
  contact_name: ['contact_name', 'contact', 'owner', 'owner_name', 'first_name', 'full_name', 'contactname'],
  industry: ['industry', 'category', 'type', 'business_type', 'vertical', 'sector', 'niche'],
  city: ['city', 'town', 'locality'],
  state: ['state', 'province', 'region', 'st'],
  address: ['address', 'street', 'street_address', 'location', 'addr'],
  zip: ['zip', 'zipcode', 'zip_code', 'postal', 'postal_code', 'postalcode'],
};

/**
 * Parse a CSV file and extract lead data
 */
export function parseCSV(filePath: string, options: CSVParseOptions = {}): ParseResult {
  const {
    delimiter = ',',
    hasHeader = true,
    columnMapping,
    skipEmptyRows = true,
    trimValues = true,
  } = options;

  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCSVContent(content, { delimiter, hasHeader, columnMapping, skipEmptyRows, trimValues });
}

/**
 * Parse CSV content string
 */
export function parseCSVContent(content: string, options: CSVParseOptions = {}): ParseResult {
  const {
    delimiter = ',',
    hasHeader = true,
    columnMapping,
    skipEmptyRows = true,
    trimValues = true,
  } = options;

  const lines = parseCSVLines(content, delimiter);
  const errors: { row: number; message: string }[] = [];
  const leads: ParsedLead[] = [];
  let totalRows = 0;
  let skippedRows = 0;

  if (lines.length === 0) {
    return { leads: [], errors: [{ row: 0, message: 'Empty CSV file' }], totalRows: 0, validRows: 0, skippedRows: 0 };
  }

  // Determine column mapping
  let mapping: Partial<ColumnMapping>;
  let startRow = 0;

  if (hasHeader) {
    const headers = lines[0].map(h => trimValues ? h.trim().toLowerCase() : h.toLowerCase());
    mapping = columnMapping || autoDetectColumns(headers);
    startRow = 1;
  } else if (columnMapping) {
    mapping = columnMapping;
  } else {
    return {
      leads: [],
      errors: [{ row: 0, message: 'Column mapping required when CSV has no header' }],
      totalRows: 0,
      validRows: 0,
      skippedRows: 0
    };
  }

  // Validate required columns
  if (!mapping.business_name && !mapping.website_url) {
    errors.push({ row: 0, message: 'CSV must have at least business_name or website_url column' });
  }

  // Parse data rows
  for (let i = startRow; i < lines.length; i++) {
    totalRows++;
    const row = lines[i];

    // Skip empty rows
    if (skipEmptyRows && row.every(cell => !cell.trim())) {
      skippedRows++;
      continue;
    }

    try {
      const lead = parseRow(row, mapping, trimValues, hasHeader ? lines[0] : undefined);

      // Validate lead has required data
      if (!lead.business_name && !lead.website_url) {
        errors.push({ row: i + 1, message: 'Row missing both business_name and website_url' });
        skippedRows++;
        continue;
      }

      // Auto-generate business name from URL if missing
      if (!lead.business_name && lead.website_url) {
        lead.business_name = extractBusinessNameFromUrl(lead.website_url);
      }

      // Validate and normalize URL
      if (lead.website_url) {
        lead.website_url = normalizeUrl(lead.website_url);
        if (!isValidUrl(lead.website_url)) {
          errors.push({ row: i + 1, message: `Invalid URL: ${lead.website_url}` });
          skippedRows++;
          continue;
        }
      }

      // Validate email format
      if (lead.email && !isValidEmail(lead.email)) {
        errors.push({ row: i + 1, message: `Invalid email: ${lead.email}` });
        lead.email = undefined;
      }

      // Normalize industry
      if (lead.industry) {
        lead.industry = normalizeIndustry(lead.industry);
      }

      leads.push(lead);
    } catch (err: any) {
      errors.push({ row: i + 1, message: err.message });
      skippedRows++;
    }
  }

  return {
    leads,
    errors,
    totalRows,
    validRows: leads.length,
    skippedRows,
  };
}

/**
 * Parse CSV lines handling quoted fields
 */
function parseCSVLines(content: string, delimiter: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
        i++;
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        // Field separator
        currentLine.push(currentField);
        currentField = '';
        i++;
      } else if (char === '\r' && nextChar === '\n') {
        // Windows line ending
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
        i += 2;
      } else if (char === '\n' || char === '\r') {
        // Unix/Mac line ending
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Handle last field and line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Auto-detect column mapping from headers
 */
export function autoDetectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < headers.length; i++) {
      const header = normalizedHeaders[i];
      if (aliases.some(alias => alias.replace(/[^a-z0-9]/g, '') === header || header.includes(alias.replace(/[^a-z0-9]/g, '')))) {
        (mapping as any)[field] = i;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parse a single row into a lead object
 */
function parseRow(row: string[], mapping: Partial<ColumnMapping>, trim: boolean, headers?: string[]): ParsedLead {
  const getValue = (key: string | number | undefined): string | undefined => {
    if (key === undefined) return undefined;
    const index = typeof key === 'number' ? key : parseInt(key, 10);
    if (isNaN(index) || index < 0 || index >= row.length) return undefined;
    const value = row[index];
    return trim ? value?.trim() : value;
  };

  const lead: ParsedLead = {
    business_name: getValue(mapping.business_name) || '',
    website_url: getValue(mapping.website_url) || '',
    email: getValue(mapping.email),
    phone: getValue(mapping.phone),
    contact_name: getValue(mapping.contact_name),
    industry: getValue(mapping.industry) as IndustryType | undefined,
    city: getValue(mapping.city),
    state: getValue(mapping.state),
    address: getValue(mapping.address),
    zip: getValue(mapping.zip),
  };

  // Store raw data for reference
  if (headers) {
    lead.raw = {};
    for (let i = 0; i < headers.length && i < row.length; i++) {
      lead.raw[headers[i]] = row[i];
    }
  }

  return lead;
}

/**
 * Extract business name from URL
 */
function extractBusinessNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
      .replace(/^www\./, '')
      .replace(/\.(com|net|org|io|co|biz|info|us|ca|uk).*$/, '');
    // Convert to title case
    return hostname
      .split(/[-_.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return url;
  }
}

/**
 * Normalize and validate URL
 */
export function normalizeUrl(url: string): string {
  url = url.trim();
  if (!url) return '';

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize industry value to match IndustryType
 */
export function normalizeIndustry(industry: string): IndustryType {
  const normalized = industry.toLowerCase().trim();

  // Direct match
  if (INDUSTRIES.includes(normalized as IndustryType)) {
    return normalized as IndustryType;
  }

  // Common aliases
  const aliases: Record<string, IndustryType> = {
    'plumber': 'plumbers',
    'plumbing': 'plumbers',
    'lawyer': 'lawyers',
    'attorney': 'lawyers',
    'legal': 'lawyers',
    'restaurant': 'restaurants',
    'food': 'restaurants',
    'dining': 'restaurants',
    'dentist': 'dentists',
    'dental': 'dentists',
    'contractor': 'contractors',
    'construction': 'contractors',
    'remodel': 'contractors',
    'heating': 'hvac',
    'cooling': 'hvac',
    'ac': 'hvac',
    'air conditioning': 'hvac',
    'salon': 'salons',
    'beauty': 'salons',
    'spa': 'salons',
    'hair': 'salons',
    'doctor': 'doctors',
    'medical': 'doctors',
    'physician': 'doctors',
    'clinic': 'doctors',
    'accountant': 'accountants',
    'accounting': 'accountants',
    'cpa': 'accountants',
    'tax': 'accountants',
    'realtor': 'realtors',
    'real estate': 'realtors',
    'realestate': 'realtors',
    'auto': 'auto-repair',
    'mechanic': 'auto-repair',
    'automotive': 'auto-repair',
    'car repair': 'auto-repair',
    'gym': 'fitness',
    'fitness': 'fitness',
    'workout': 'fitness',
    'training': 'fitness',
    'cleaning': 'cleaning',
    'maid': 'cleaning',
    'janitorial': 'cleaning',
    'landscape': 'landscaping',
    'landscaping': 'landscaping',
    'lawn': 'landscaping',
    'yard': 'landscaping',
    'photo': 'photography',
    'photography': 'photography',
    'photographer': 'photography',
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  // Partial match
  for (const [alias, type] of Object.entries(aliases)) {
    if (normalized.includes(alias)) {
      return type;
    }
  }

  return 'other';
}

/**
 * Export leads to CSV format
 */
export function generateCSV(leads: ParsedLead[], columns?: (keyof ParsedLead)[]): string {
  const defaultColumns: (keyof ParsedLead)[] = [
    'business_name', 'website_url', 'email', 'phone', 'contact_name',
    'industry', 'city', 'state', 'address', 'zip'
  ];
  const cols = columns || defaultColumns;

  // Header row
  const headerRow = cols.join(',');

  // Data rows
  const dataRows = leads.map(lead => {
    return cols.map(col => {
      const value = lead[col] || '';
      // Escape and quote if needed
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Get sample CSV format for reference
 */
export function getSampleCSVFormat(): string {
  return `business_name,website_url,email,phone,contact_name,industry,city,state,address,zip
"Joe's Plumbing","https://joesplumbing.com","joe@joesplumbing.com","555-123-4567","Joe Smith","plumbers","Austin","TX","123 Main St","78701"
"ABC HVAC","https://abchvac.com","contact@abchvac.com","555-987-6543","","hvac","Phoenix","AZ","456 Oak Ave","85001"`;
}

/**
 * Detect delimiter from CSV content
 */
export function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0];
  const delimiters = [',', '\t', ';', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[|]/g, '\\$&'), 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = d;
    }
  }

  return detected;
}
