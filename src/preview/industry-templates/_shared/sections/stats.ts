/**
 * Stats Section
 *
 * Lightweight stats/metrics section builders.
 */

import { StatItem, SectionOutput } from '../types';
import { escapeHtml } from '../utils';

export interface StatsConfig {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
  sectionId?: string;
  background?: 'white' | 'gray' | 'primary';
}

export { SectionOutput };

const DEFAULT_STATS: StatItem[] = [
  { value: '500+', label: 'Projects Completed' },
  { value: '24/7', label: 'Customer Support' },
  { value: '4.9', label: 'Average Rating' },
  { value: '15+', label: 'Years Experience' },
];

/**
 * Generate stats CSS
 */
export function generateStatsCSS(): string {
  return `
    .stats {
      padding: 80px 0;
      background: var(--gray-50);
    }

    .stats-white {
      background: var(--white);
    }

    .stats-primary {
      background: var(--primary);
      color: var(--white);
    }

    .stats-primary .section-header h2,
    .stats-primary .section-header p {
      color: var(--white);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 24px;
    }

    .stats-card {
      background: var(--white);
      border-radius: 14px;
      border: 1px solid var(--gray-200);
      padding: 28px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
    }

    .stats-card h3 {
      font-size: 34px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .stats-card p {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      margin: 0;
    }

    .stats-card span {
      display: block;
      margin-top: 10px;
      font-size: 14px;
      color: var(--muted);
    }

    .stats-primary .stats-card {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }

    .stats-primary .stats-card h3,
    .stats-primary .stats-card p,
    .stats-primary .stats-card span {
      color: var(--white);
    }
  `;
}

function resolveStats(stats: StatItem[]): StatItem[] {
  if (Array.isArray(stats) && stats.length > 0) {
    return stats;
  }
  return DEFAULT_STATS;
}

function renderStatCards(stats: StatItem[]): string {
  return stats
    .map(stat => `
        <div class="stats-card">
          <h3>${escapeHtml(stat.value)}</h3>
          <p>${escapeHtml(stat.label)}</p>
          ${stat.description ? `<span>${escapeHtml(stat.description)}</span>` : ''}
        </div>
      `)
    .join('');
}

function renderSectionHeader(title?: string, subtitle?: string): string {
  if (!title && !subtitle) {
    return '';
  }

  return `
      <div class="section-header">
        ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      </div>
  `;
}

function buildStatsSection(config: StatsConfig, variant: 'grid' | 'cards'): string {
  const stats = resolveStats(config.stats || []);
  const backgroundClass = config.background ? `stats-${config.background}` : '';
  const sectionId = config.sectionId ? ` id="${escapeHtml(config.sectionId)}"` : '';
  const gridClass = variant === 'cards' ? 'stats-grid stats-grid-cards' : 'stats-grid';

  return `
    <section class="stats ${backgroundClass}"${sectionId}>
      <div class="container">
        ${renderSectionHeader(config.title, config.subtitle)}
        <div class="${gridClass}">
          ${renderStatCards(stats)}
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate stats grid HTML
 */
export function generateStatsGrid(config: StatsConfig): string {
  return buildStatsSection(config, 'grid');
}

/**
 * Generate stats cards HTML
 */
export function generateStatsCards(config: StatsConfig): string {
  return buildStatsSection(config, 'cards');
}
