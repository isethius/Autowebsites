/**
 * Stats Section
 *
 * Simple metric blocks for trust/impact highlights.
 */

import { StatItem } from '../types';
import { escapeHtml } from '../utils';

export interface StatsConfig {
  title?: string;
  subtitle?: string;
  stats: StatItem[];
  sectionId?: string;
  background?: 'white' | 'gray' | 'primary';
}

function getBackgroundClass(background?: StatsConfig['background']): string {
  switch (background) {
    case 'white':
      return 'stats-white';
    case 'primary':
      return 'stats-primary';
    default:
      return 'stats-gray';
  }
}

function renderHeader(title?: string, subtitle?: string): string {
  if (!title && !subtitle) return '';
  return `
    <div class="section-header">
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    </div>
  `;
}

function renderStats(stats: StatItem[], variant: 'grid' | 'cards'): string {
  const items = stats.map((stat) => {
    const description = stat.description ? `<p>${escapeHtml(stat.description)}</p>` : '';
    return `
      <div class="stat-item ${variant === 'cards' ? 'stat-card dna-card card' : ''}">
        <div class="stat-value">${escapeHtml(stat.value)}</div>
        <div class="stat-label">${escapeHtml(stat.label)}</div>
        ${description}
      </div>
    `;
  }).join('');

  return items || '<div class="stat-item">No stats provided.</div>';
}

/**
 * Generate stats CSS
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
export function generateStatsCSS(): string {
  return `
    .stats {
      padding: var(--section-spacing, 80px) 0;
      background: var(--gray-50, #f9fafb);
    }

    .stats-white {
      background: var(--white, #ffffff);
    }

    .stats-primary {
      background: var(--primary, #1e5a8a);
      color: var(--white, #ffffff);
    }

    .stats-primary .section-header h2,
    .stats-primary .section-header p,
    .stats-primary .stat-value,
    .stats-primary .stat-label,
    .stats-primary .stat-item p {
      color: var(--white, #ffffff);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(calc(var(--section-spacing, 80px) * 2), 1fr));
      gap: var(--gap-md, 24px);
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(calc(var(--section-spacing, 80px) * 2.75), 1fr));
      gap: var(--gap-sm, 20px);
    }

    .stat-item {
      text-align: center;
    }

    .stat-card {
      padding: var(--gap-md, 24px);
    }

    .stat-value {
      font-size: var(--text-h2, 32px);
      font-weight: 800;
      color: var(--primary, #1e5a8a);
      margin-bottom: var(--gap-xs, 6px);
    }

    .stat-label {
      font-size: var(--text-sm, 15px);
      font-weight: 600;
      color: var(--text, #111827);
    }

    .stat-item p {
      margin-top: var(--gap-xs, 10px);
      font-size: var(--text-sm, 13px);
      color: var(--muted, #6b7280);
    }
  `;
}

export function generateStatsGrid(config: StatsConfig): string {
  const sectionId = config.sectionId || 'stats';
  const backgroundClass = getBackgroundClass(config.background);
  return `
    <section id="${sectionId}" class="stats ${backgroundClass}">
      <div class="container">
        ${renderHeader(config.title, config.subtitle)}
        <div class="stats-grid">
          ${renderStats(config.stats, 'grid')}
        </div>
      </div>
    </section>
  `;
}

export function generateStatsCards(config: StatsConfig): string {
  const sectionId = config.sectionId || 'stats';
  const backgroundClass = getBackgroundClass(config.background);
  return `
    <section id="${sectionId}" class="stats ${backgroundClass}">
      <div class="container">
        ${renderHeader(config.title, config.subtitle)}
        <div class="stats-cards">
          ${renderStats(config.stats, 'cards')}
        </div>
      </div>
    </section>
  `;
}
