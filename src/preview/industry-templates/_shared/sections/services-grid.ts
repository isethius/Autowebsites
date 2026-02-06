/**
 * Services Grid Section
 *
 * DNA-aware service/feature grid builders with multiple layout options.
 */

import { ServiceItem, SectionOutput } from '../types';
import { DNACode, DESIGN_VARIANTS } from '../../../../themes/variance-planner';
import { escapeHtml } from '../utils';

export interface ServicesConfig {
  title?: string;
  subtitle?: string;
  services: ServiceItem[];
  columns?: 2 | 3 | 4;
  showIcons?: boolean;
  sectionId?: string;
  background?: 'white' | 'gray' | 'primary';
}

export interface DNAServicesConfig extends ServicesConfig {
  dna: DNACode;
}

export { SectionOutput };

/**
 * Generate services grid CSS
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
export function generateServicesCSS(): string {
  return `
    .services {
      padding: var(--section-spacing, 80px) 0;
      background: var(--gray-50, #f9fafb);
    }

    .services-white {
      background: var(--white, #ffffff);
    }

    .services-primary {
      background: var(--primary, #1e5a8a);
      color: var(--white, #ffffff);
    }

    .services-primary .section-header h2,
    .services-primary .section-header p {
      color: var(--white, #ffffff);
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(calc(var(--section-spacing, 80px) * 3.5), 1fr));
      gap: var(--gap-md, 24px);
    }

    .service-card {
      padding: var(--card-padding, 32px);
    }

    .service-icon {
      width: var(--icon-size, 56px);
      height: var(--icon-size, 56px);
      background: var(--primary, #1e5a8a);
      border-radius: var(--radius, 12px);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--gap-sm, 20px);
      font-size: var(--text-h4, 24px);
    }

    .service-card h3 {
      font-size: var(--text-lg, 20px);
      font-weight: 700;
      margin-bottom: var(--gap-xs, 12px);
      color: var(--text, #111827);
    }

    .service-card p {
      color: var(--muted, #6b7280);
      font-size: var(--text-sm, 15px);
      line-height: 1.6;
    }

    .service-card .service-price {
      margin-top: var(--gap-sm, 16px);
      font-weight: 600;
      color: var(--primary, #1e5a8a);
    }

    .service-card .service-duration {
      font-size: var(--text-sm, 13px);
      color: var(--muted, #6b7280);
    }

    .services-list {
      padding: calc(var(--section-spacing, 80px) * 0.75) 0;
    }

    .services-list-title {
      text-align: center;
      margin-bottom: calc(var(--gap-md, 24px) * 1.3333);
    }

    .services-list-items {
      display: flex;
      flex-direction: column;
      gap: var(--gap-sm, 16px);
    }

    .services-list-item {
      display: flex;
      gap: var(--gap-sm, 16px);
      padding: calc(var(--gap-md, 24px) * 0.8333);
      background: var(--gray-50, #f9fafb);
      border-radius: var(--radius-sm, 8px);
    }

    .services-list-icon {
      font-size: var(--text-h4, 24px);
    }

    .services-list-item h4 {
      font-weight: 600;
      margin-bottom: calc(var(--gap-xs, 8px) * 0.5);
    }

    .services-list-item p {
      font-size: var(--text-sm, 14px);
      color: var(--muted, #6b7280);
    }

    .services-bar {
      display: flex;
      justify-content: center;
      gap: calc(var(--gap-lg, 40px) * 1.2);
      flex-wrap: wrap;
      padding: calc(var(--gap-md, 24px) * 1.3333) calc(var(--gap-sm, 16px) * 1.25);
      background: var(--gray-50, #f9fafb);
    }

    .services-bar-item {
      text-align: center;
    }

    .services-bar-icon {
      font-size: var(--text-h2, 32px);
      margin-bottom: var(--gap-xs, 8px);
    }

    .services-bar-label {
      font-size: var(--text-sm, 13px);
      font-weight: 500;
    }
  `;
}

/**
 * Service icon mapping by keyword
 */
const SERVICE_ICONS: Record<string, string> = {
  // Plumbing
  drain: '🚿',
  pipe: '🔧',
  leak: '💧',
  water: '💧',
  heater: '🔥',
  emergency: '🚨',

  // HVAC
  heating: '🔥',
  cooling: '❄️',
  air: '💨',
  maintenance: '🔧',
  install: '⚙️',

  // Electrical
  electrical: '⚡',
  wiring: '🔌',
  panel: '📋',
  lighting: '💡',
  outlet: '🔌',

  // Dental
  teeth: '🦷',
  cleaning: '✨',
  whitening: '✨',
  implant: '🦷',
  orthodontics: '😁',

  // Medical
  exam: '🩺',
  treatment: '💊',
  therapy: '🧘',
  wellness: '❤️',

  // Legal
  consultation: '📋',
  litigation: '⚖️',
  contract: '📝',
  estate: '🏠',

  // Restaurant
  menu: '🍽️',
  catering: '🎉',
  delivery: '🚗',
  reservation: '📅',

  // Fitness
  training: '💪',
  class: '🧘',
  cardio: '🏃',
  strength: '🏋️',

  // Default
  default: '⭐',
};

/**
 * Get icon for a service based on its name
 */
function getServiceIcon(serviceName: string): string {
  const nameLower = serviceName.toLowerCase();
  for (const [keyword, icon] of Object.entries(SERVICE_ICONS)) {
    if (nameLower.includes(keyword)) {
      return icon;
    }
  }
  return SERVICE_ICONS.default;
}

/**
 * Standard services grid
 */
export function generateServicesGrid(config: ServicesConfig): string {
  const {
    title = 'Our Services',
    subtitle = 'Professional solutions for all your needs',
    services,
    showIcons = true,
    sectionId = 'services',
    background = 'gray'
  } = config;

  const bgClass = background === 'white' ? 'services-white' :
                  background === 'primary' ? 'services-primary' : '';

  return `
    <section id="${sectionId}" class="services ${bgClass}">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="services-grid">
          ${services.map(service => `
            <div class="service-card card">
              ${showIcons ? `
                <div class="service-icon">
                  ${service.icon || getServiceIcon(service.name)}
                </div>
              ` : ''}
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
              ${service.price ? `<div class="service-price">${escapeHtml(service.price)}</div>` : ''}
              ${service.duration ? `<div class="service-duration">${escapeHtml(service.duration)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/**
 * Compact services list (for sidebars or smaller sections)
 */
export function generateServicesList(config: ServicesConfig): string {
  const { title = 'Our Services', services, sectionId = 'services' } = config;

  return `
    <section id="${sectionId}" class="services services-white services-list">
      <div class="container-sm">
        <h2 class="services-list-title">${escapeHtml(title)}</h2>
        <div class="services-list-items">
          ${services.map(service => `
            <div class="services-list-item">
              <div class="services-list-icon">${service.icon || getServiceIcon(service.name)}</div>
              <div class="services-list-content">
                <h4>${escapeHtml(service.name)}</h4>
                <p>${escapeHtml(service.description)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/**
 * Icon-only services bar (for quick overview)
 */
export function generateServicesBar(services: ServiceItem[]): string {
  return `
    <div class="services-bar">
      ${services.slice(0, 6).map(service => `
        <div class="services-bar-item">
          <div class="services-bar-icon">${service.icon || getServiceIcon(service.name)}</div>
          <div class="services-bar-label">${escapeHtml(service.name)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// =============================================================================
// DNA-AWARE SERVICES GENERATOR
// =============================================================================

/**
 * Generate services section based on DNA layout code
 * L3 = Card Grid, L5 = Single Column, L9 = Timeline, L10 = Bento Box
 */
export function generateDNAServices(config: DNAServicesConfig): SectionOutput {
  const { dna } = config;
  const layoutCode = dna.layout || 'L3';

  switch (layoutCode) {
    case 'L3':
      return generateServicesL3Cards(config);
    case 'L5':
      return generateServicesL5SingleColumn(config);
    case 'L9':
      return generateServicesL9Timeline(config);
    case 'L10':
      return generateServicesL10Bento(config);
    default:
      return generateServicesL3Cards(config);
  }
}

/**
 * L3: Card Grid - Uniform card-based layout
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
function generateServicesL3Cards(config: DNAServicesConfig): SectionOutput {
  const {
    title = 'Our Services',
    subtitle = 'Professional solutions for all your needs',
    services,
    dna,
    sectionId = 'services',
    background = 'gray',
  } = config;

  const bgClass = background === 'white' ? 'services-bg-white' :
                  background === 'primary' ? 'services-bg-primary' : 'services-bg-gray';

  const css = `
    .services-l3 {
      padding: var(--section-spacing, 80px) 0;
    }

    .services-bg-gray { background: var(--gray-50, #f9fafb); }
    .services-bg-white { background: var(--white, #ffffff); }
    .services-bg-primary { background: var(--primary, #1e5a8a); color: var(--white, #ffffff); }

    .services-l3-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(calc(var(--section-spacing, 80px) * 3.5), 1fr));
      gap: var(--gap-md, 24px);
    }

    .services-l3-card {
      padding: var(--card-padding, 32px);
    }

    .services-l3-icon {
      width: var(--icon-size, 56px);
      height: var(--icon-size, 56px);
      background: var(--primary, #1e5a8a);
      border-radius: var(--radius, 12px);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--gap-sm, 20px);
      font-size: var(--text-h4, 24px);
    }

    .services-l3-card h3 {
      font-size: var(--text-lg, 20px);
      margin-bottom: var(--gap-xs, 12px);
      color: var(--text, #111827);
    }

    .services-l3-card p {
      color: var(--muted, #6b7280);
      font-size: var(--text-sm, 15px);
      line-height: 1.6;
    }
  `;

  const html = `
    <section id="${sectionId}" class="services-l3 ${bgClass} dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="services-l3-grid">
          ${services.map(service => `
            <div class="services-l3-card dna-card card">
              <div class="services-l3-icon">
                ${service.icon || getServiceIcon(service.name)}
              </div>
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * L5: Single Column - Clean single-column flow
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
function generateServicesL5SingleColumn(config: DNAServicesConfig): SectionOutput {
  const {
    title = 'Our Services',
    subtitle = 'Professional solutions for all your needs',
    services,
    dna,
    sectionId = 'services',
  } = config;

  const css = `
    .services-l5 {
      padding: var(--section-spacing, 80px) 0;
      background: var(--white, #ffffff);
    }

    .services-l5-list {
      max-width: calc(var(--section-spacing, 80px) * 10);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--gap-md, 24px);
    }

    .services-l5-item {
      display: flex;
      gap: var(--gap-md, 24px);
      padding: var(--card-padding, 32px);
    }

    .services-l5-icon {
      width: calc(var(--icon-size, 56px) + var(--gap-xs, 8px));
      height: calc(var(--icon-size, 56px) + var(--gap-xs, 8px));
      background: var(--primary, #1e5a8a);
      border-radius: var(--radius, 12px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-h3, 28px);
      flex-shrink: 0;
    }

    .services-l5-content {
      flex: 1;
    }

    .services-l5-item h3 {
      font-size: var(--text-h3, 22px);
      margin-bottom: var(--gap-xs, 8px);
      color: var(--text, #111827);
    }

    .services-l5-item p {
      color: var(--muted, #6b7280);
      font-size: var(--text-body, 16px);
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .services-l5-item {
        flex-direction: column;
        text-align: center;
        align-items: center;
      }
    }
  `;

  const html = `
    <section id="${sectionId}" class="services-l5 dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="services-l5-list">
          ${services.map(service => `
            <div class="services-l5-item dna-card card">
              <div class="services-l5-icon">
                ${service.icon || getServiceIcon(service.name)}
              </div>
              <div class="services-l5-content">
                <h3>${escapeHtml(service.name)}</h3>
                <p>${escapeHtml(service.description)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * L9: Timeline - Vertical timeline layout
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
function generateServicesL9Timeline(config: DNAServicesConfig): SectionOutput {
  const {
    title = 'Our Services',
    subtitle = 'Professional solutions for all your needs',
    services,
    dna,
    sectionId = 'services',
  } = config;

  const css = `
    .services-l9 {
      padding: var(--section-spacing, 80px) 0;
      background: var(--gray-50, #f9fafb);
    }

    .services-l9-timeline {
      max-width: calc(var(--section-spacing, 80px) * 10);
      margin: 0 auto;
      position: relative;
    }

    .services-l9-timeline::before {
      content: '';
      position: absolute;
      left: calc(var(--gap-sm, 16px) * 2);
      top: 0;
      bottom: 0;
      width: calc(var(--gap-xs, 8px) / 4);
      background: var(--primary, #1e5a8a);
      opacity: 0.3;
    }

    .services-l9-item {
      display: flex;
      gap: var(--gap-md, 32px);
      padding: var(--gap-md, 24px) 0;
      position: relative;
    }

    .services-l9-marker {
      width: calc(var(--icon-size, 56px) + var(--gap-xs, 8px));
      height: calc(var(--icon-size, 56px) + var(--gap-xs, 8px));
      background: var(--primary, #1e5a8a);
      border-radius: var(--radius-pill, 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-h4, 24px);
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    .services-l9-content {
      flex: 1;
      padding: var(--gap-md, 24px);
    }

    .services-l9-item h3 {
      font-size: var(--text-lg, 20px);
      margin-bottom: var(--gap-xs, 8px);
      color: var(--text, #111827);
    }

    .services-l9-item p {
      color: var(--muted, #6b7280);
      font-size: var(--text-sm, 15px);
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .services-l9-timeline::before { left: calc(var(--gap-sm, 16px) * 1.25); }
      .services-l9-marker {
        width: calc(var(--icon-size, 56px) - var(--gap-sm, 16px));
        height: calc(var(--icon-size, 56px) - var(--gap-sm, 16px));
        font-size: var(--text-body, 16px);
      }
      .services-l9-item { gap: var(--gap-sm, 16px); }
    }
  `;

  const html = `
    <section id="${sectionId}" class="services-l9 dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="services-l9-timeline">
          ${services.map(service => `
            <div class="services-l9-item">
              <div class="services-l9-marker">
                ${service.icon || getServiceIcon(service.name)}
              </div>
              <div class="services-l9-content dna-card card">
                <h3>${escapeHtml(service.name)}</h3>
                <p>${escapeHtml(service.description)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}

/**
 * L10: Bento Box - Mixed-size tile grid
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
function generateServicesL10Bento(config: DNAServicesConfig): SectionOutput {
  const {
    title = 'Our Services',
    subtitle = 'Professional solutions for all your needs',
    services,
    dna,
    sectionId = 'services',
  } = config;

  const css = `
    .services-l10 {
      padding: var(--section-spacing, 80px) 0;
      background: var(--white, #ffffff);
    }

    .services-l10-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: calc(var(--section-spacing, 80px) * 2.5);
      gap: var(--gap-sm, 16px);
    }

    .services-l10-card {
      padding: var(--gap-md, 28px);
      display: flex;
      flex-direction: column;
    }

    /* First card is large */
    .services-l10-card:nth-child(1) {
      grid-column: span 2;
      grid-row: span 2;
    }

    /* Third card spans 2 columns */
    .services-l10-card:nth-child(3) {
      grid-column: span 2;
    }

    .services-l10-icon {
      font-size: var(--text-h2, 32px);
      margin-bottom: auto;
    }

    .services-l10-card h3 {
      font-size: var(--text-body, 18px);
      margin-bottom: var(--gap-xs, 8px);
      color: var(--text, #111827);
      margin-top: var(--gap-sm, 16px);
    }

    .services-l10-card p {
      color: var(--muted, #6b7280);
      font-size: var(--text-sm, 14px);
      line-height: 1.5;
    }

    /* Large card gets bigger typography */
    .services-l10-card:nth-child(1) h3 {
      font-size: var(--text-h3, 24px);
    }

    .services-l10-card:nth-child(1) p {
      font-size: var(--text-body, 16px);
    }

    @media (max-width: 900px) {
      .services-l10-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: calc(var(--section-spacing, 80px) * 2.25);
      }
      .services-l10-card:nth-child(1) {
        grid-column: span 2;
        grid-row: span 1;
      }
      .services-l10-card:nth-child(3) {
        grid-column: span 1;
      }
    }

    @media (max-width: 640px) {
      .services-l10-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }
      .services-l10-card:nth-child(1),
      .services-l10-card:nth-child(3) {
        grid-column: span 1;
      }
    }
  `;

  const html = `
    <section id="${sectionId}" class="services-l10 dna-animate">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="services-l10-grid">
          ${services.map(service => `
            <div class="services-l10-card dna-card card">
              <div class="services-l10-icon">
                ${service.icon || getServiceIcon(service.name)}
              </div>
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return { html, css };
}
