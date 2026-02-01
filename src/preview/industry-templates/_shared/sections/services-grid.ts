/**
 * Services Grid Section
 *
 * Reusable service/feature grid builders.
 */

import { ServiceItem } from '../types';
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

/**
 * Generate services grid CSS
 */
export function generateServicesCSS(): string {
  return `
    .services {
      padding: 80px 0;
      background: var(--gray-50);
    }

    .services-white {
      background: var(--white);
    }

    .services-primary {
      background: var(--primary);
      color: var(--white);
    }

    .services-primary .section-header h2,
    .services-primary .section-header p {
      color: var(--white);
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .service-card {
      background: var(--white);
      border-radius: 12px;
      padding: 32px;
      transition: all 0.2s ease;
      border: 1px solid var(--gray-200);
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    }

    .service-icon {
      width: 56px;
      height: 56px;
      background: var(--primary);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 24px;
    }

    .service-card h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--text);
    }

    .service-card p {
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
    }

    .service-card .service-price {
      margin-top: 16px;
      font-weight: 600;
      color: var(--primary);
    }

    .service-card .service-duration {
      font-size: 13px;
      color: var(--muted);
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
            <div class="service-card">
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
    <section id="${sectionId}" class="services services-white" style="padding: 60px 0;">
      <div class="container-sm">
        <h2 style="text-align: center; margin-bottom: 32px;">${escapeHtml(title)}</h2>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${services.map(service => `
            <div style="display: flex; gap: 16px; padding: 20px; background: var(--gray-50); border-radius: 8px;">
              <div style="font-size: 24px;">${service.icon || getServiceIcon(service.name)}</div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(service.name)}</h4>
                <p style="font-size: 14px; color: var(--muted);">${escapeHtml(service.description)}</p>
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
    <div style="display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; padding: 32px 20px; background: var(--gray-50);">
      ${services.slice(0, 6).map(service => `
        <div style="text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">${service.icon || getServiceIcon(service.name)}</div>
          <div style="font-size: 13px; font-weight: 500;">${escapeHtml(service.name)}</div>
        </div>
      `).join('')}
    </div>
  `;
}
