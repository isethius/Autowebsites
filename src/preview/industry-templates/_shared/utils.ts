/**
 * Shared Utility Functions for Templates
 */

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX if 11 digits starting with 1
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Create a tel: link-safe phone string
 */
export function phoneToTel(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Get location string from city and state
 */
export function formatLocation(city?: string, state?: string): string {
  return [city, state].filter(Boolean).join(', ');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Split content into paragraphs
 */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

/**
 * Generate Google Fonts link
 */
export function googleFontsLink(fonts: string[]): string {
  const fontParams = fonts.map(f => `family=${f.replace(/\s+/g, '+')}`).join('&');
  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}

/**
 * Default Google Fonts for common font pairs
 */
export const FONT_LINKS = {
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  playfair: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@400;600&display=swap',
  montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap',
  oswald: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500&display=swap',
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;600&display=swap',
  cormorant: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Lato:wght@400;700&display=swap',
};

/**
 * Generate HTML document wrapper
 */
export interface DocumentConfig {
  title: string;
  description: string;
  styles: string;
  body: string;
  fontLink?: string;
  previewBanner?: boolean;
}

export function generateDocument(config: DocumentConfig): string {
  const { title, description, styles, body, fontLink = FONT_LINKS.inter, previewBanner = true } = config;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${fontLink}" rel="stylesheet">
  <style>
${styles}
  </style>
</head>
<body>
  ${previewBanner ? `
  <div class="preview-banner">
    ✨ This is a preview of your new website! <a href="../index.html">View other designs →</a>
  </div>
  ` : ''}
${body}
</body>
</html>`;
}
