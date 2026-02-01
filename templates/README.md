# Website Templates

This directory contains standalone HTML templates for generating professional websites. Templates use variable placeholders that can be populated with your business information.

## Available Templates

### professional-services-template.html
A clean, modern template designed for professional service businesses (contractors, consultants, agencies, etc.). Features:
- Service-focused layout with icons and images
- Alternating two-column service blocks
- Professional header with navigation and CTA
- Hero section with background image
- Fully responsive design
- Light blue accent colors

## Usage

### Using the CLI

#### List available templates
```bash
npx tsx src/cli.ts template list
```

#### Generate a website from a template
```bash
npx tsx src/cli.ts template generate professional-services --output ./my-site
```

#### Generate with custom variables
```bash
npx tsx src/cli.ts template generate professional-services --vars variables.json --output ./my-site
```

#### View required variables for a template
```bash
npx tsx src/cli.ts template vars professional-services
```

### Using the Template Loader API

```typescript
import { loadAndPopulateTemplate } from './themes/template-loader';

const html = loadAndPopulateTemplate('professional-services', {
  BUSINESS_NAME: 'My Business',
  TAGLINE: 'Professional Services',
  // ... other variables
});

// Write to file
fs.writeFileSync('output.html', html);
```

## Variable Reference: professional-services-template

### Required Variables

#### Business Information
- `{{BUSINESS_NAME}}` - Your business name (appears in header, footer)
- `{{TAGLINE}}` - Business tagline (page title)
- `{{LOGO_URL}}` - URL/path to your logo image (optional, wrapped in conditional)
- `{{CTA_TEXT}}` - Call-to-action button text (default: "GET A FREE QUOTE")

#### Hero Section
- `{{HERO_TITLE}}` - Large title text in hero section (e.g., "SERVICES")
- `{{HERO_BACKGROUND_IMAGE}}` - URL/path to hero background image

#### Services (Repeat for each service: 1-4)
- `{{SERVICE_N_TITLE}}` - Service name (e.g., "KITCHEN", "BATHROOM")
- `{{SERVICE_N_DESCRIPTION}}` - Service description text
- `{{SERVICE_N_IMAGE}}` - URL/path to service image
- `{{SERVICE_N_ICON}}` - Icon for service (can be emoji, SVG, or HTML)

#### Contact Information
- `{{CONTACT_EMAIL}}` - Business email address
- `{{CONTACT_PHONE}}` - Business phone number
- `{{CONTACT_ADDRESS}}` - Business address

#### Footer
- `{{FOOTER_DESCRIPTION}}` - Brief business description for footer
- `{{CURRENT_YEAR}}` - Current year for copyright (typically auto-generated)

### Conditional Variables

The template supports conditional blocks using `{{#if VARIABLE}}...{{/if}}` syntax:

- `{{#if LOGO_URL}}...{{/if}}` - Only shows logo if LOGO_URL is provided

### Example Variables File (JSON)

```json
{
  "BUSINESS_NAME": "Level Up Renovation",
  "TAGLINE": "Professional Home Renovation Services",
  "LOGO_URL": "/images/logo.png",
  "CTA_TEXT": "GET A FREE QUOTE",
  "HERO_TITLE": "SERVICES",
  "HERO_BACKGROUND_IMAGE": "/images/hero-kitchen.jpg",
  "SERVICE_1_TITLE": "KITCHEN",
  "SERVICE_1_DESCRIPTION": "We provide a wide variety of services to create your dream kitchen. Offering services for complete tear-downs, redesigns, cabinetry installation, and more.",
  "SERVICE_1_IMAGE": "/images/kitchen-renovation.jpg",
  "SERVICE_1_ICON": "🔧",
  "SERVICE_2_TITLE": "BATHROOM",
  "SERVICE_2_DESCRIPTION": "Initiating a renovation or remodeling project to a home's bathroom(s) is one of the more popular and effective ways to increase property value.",
  "SERVICE_2_IMAGE": "/images/bathroom-renovation.jpg",
  "SERVICE_2_ICON": "🚿",
  "SERVICE_3_TITLE": "FLOORING",
  "SERVICE_3_DESCRIPTION": "Quality flooring is essential for any home. Trust our experts for professional installation and materials.",
  "SERVICE_3_IMAGE": "/images/flooring.jpg",
  "SERVICE_3_ICON": "🏠",
  "SERVICE_4_TITLE": "FINISHING WORK",
  "SERVICE_4_DESCRIPTION": "Our experienced foremen and project managers ensure quality and attention to detail, giving you peace of mind.",
  "SERVICE_4_IMAGE": "/images/finishing-work.jpg",
  "SERVICE_4_ICON": "✨",
  "CONTACT_EMAIL": "info@leveluprenovation.com",
  "CONTACT_PHONE": "+1 (555) 123-4567",
  "CONTACT_ADDRESS": "123 Main St, City, State 12345",
  "FOOTER_DESCRIPTION": "Professional renovation services you can trust. Quality workmanship, attention to detail, and customer satisfaction guaranteed.",
  "CURRENT_YEAR": "2026"
}
```

## Customization

### Colors
Edit the CSS variables at the top of the template:

```css
:root {
  --color-primary: #1a1a1a;        /* Main text color */
  --color-accent: #4A90E2;         /* Light blue accent */
  --color-background: #ffffff;     /* Background */
  --color-text-light: #666666;     /* Secondary text */
}
```

### Fonts
The template uses Inter font family by default. To change:

1. Update the Google Fonts link in the `<head>` section
2. Modify `--font-primary` CSS variable

### Service Icons
Icons can be:
- Emoji: `🔧`, `🚿`, `🏠`
- SVG: Inline SVG code
- Image URLs: Paths to icon images
- Font icons: If you include an icon font library

## Integration with Theme Generator

The professional services layout is also integrated into the dynamic theme generator system. When generating themes from a website capture, use layout variant `L11`:

```typescript
import { generateUniqueVariances, generateThemes } from './themes';

const variances = generateUniqueVariances(10);
// Filter or modify to use L11 layout
const professionalServicesVariances = variances.map(v => ({
  ...v,
  dna: { ...v.dna, layout: 'L11' }
}));

const themes = generateThemes(manifest, professionalServicesVariances);
```

## Responsive Design

The template is fully responsive with breakpoints:
- **Desktop**: 1200px+ (two-column service blocks)
- **Tablet**: 768px-1199px (stacked layout)
- **Mobile**: <768px (single column, adjusted spacing)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- CSS custom properties (variables) support required

## Future Enhancements

- Additional template variants
- Template builder UI
- AI-powered content generation
- Template marketplace
- Industry-specific templates

## Contributing

To add a new template:

1. Create a new HTML file in this directory
2. Use `{{VARIABLE}}` syntax for placeholders
3. Support conditional blocks with `{{#if VAR}}...{{/if}}`
4. Ensure responsive design
5. Document variables in this README
6. Test with the template loader utility

## Support

For issues or questions:
- Check the main project documentation
- Review template examples
- Use `template vars <name>` to see required variables
- Validate variables with the template loader API
