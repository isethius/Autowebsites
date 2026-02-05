/**
 * Testimonials Section
 *
 * Reusable testimonial/review section builders.
 */

import { Testimonial } from '../types';
import { escapeHtml } from '../utils';

export interface TestimonialsConfig {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  columns?: 2 | 3;
  showRating?: boolean;
  sectionId?: string;
  background?: 'white' | 'gray';
}

/**
 * Generate testimonials CSS
 * PHYSICS REFACTOR: Uses CSS variables with fallbacks
 */
export function generateTestimonialsCSS(): string {
  return `
    .testimonials {
      padding: var(--section-spacing, 80px) 0;
      background: var(--gray-50);
    }

    .testimonials-white {
      background: var(--white);
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--gap-md, 24px);
    }

    .testimonial-card {
      background: var(--bg-surface, var(--white));
      border-radius: var(--radius, 12px);
      padding: var(--card-padding, 32px);
      border: var(--border-width, 1px) solid var(--border-color, var(--gray-200));
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.08));
    }

    .testimonial-stars {
      color: #fbbf24;
      font-size: var(--text-lg, 20px);
      margin-bottom: var(--gap-sm, 16px);
      letter-spacing: 2px;
    }

    .testimonial-text {
      font-size: var(--text-sm, 15px);
      color: var(--muted);
      margin-bottom: var(--gap-sm, 20px);
      font-style: italic;
      line-height: 1.7;
    }

    .testimonial-text::before {
      content: '"';
      font-size: var(--text-h3, 24px);
      color: var(--primary);
      opacity: 0.3;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      gap: var(--gap-xs, 12px);
    }

    .testimonial-avatar {
      width: var(--avatar-size, 48px);
      height: var(--avatar-size, 48px);
      background: var(--primary);
      border-radius: var(--radius-pill, 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 600;
      font-size: var(--text-body, 18px);
    }

    .testimonial-author-info {
      flex: 1;
    }

    .testimonial-author-name {
      font-weight: 600;
      font-size: var(--text-sm, 15px);
      color: var(--text);
    }

    .testimonial-author-location {
      font-size: var(--text-sm, 13px);
      color: var(--muted);
    }

    @media (max-width: 900px) {
      .testimonials-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Generate star rating HTML
 */
function generateStars(rating: number = 5): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalf) stars += '½';
  stars += '☆'.repeat(5 - Math.ceil(rating));
  return stars;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Standard testimonials grid
 */
export function generateTestimonialsGrid(config: TestimonialsConfig): string {
  const {
    title = 'What Our Customers Say',
    subtitle = 'Real reviews from satisfied customers',
    testimonials,
    showRating = true,
    sectionId = 'testimonials',
    background = 'gray'
  } = config;

  const bgClass = background === 'white' ? 'testimonials-white' : '';

  // Use provided testimonials or defaults
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    { text: 'Excellent service! Professional and reliable.', author: 'Local Customer', rating: 5 },
    { text: 'Highly recommend. Great work and fair pricing.', author: 'Happy Client', rating: 5 },
    { text: 'The best in the business. Will use again!', author: 'Satisfied Customer', rating: 5 },
  ];

  return `
    <section id="${sectionId}" class="testimonials ${bgClass}">
      <div class="container">
        <div class="section-header">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="testimonials-grid">
          ${displayTestimonials.slice(0, 3).map(testimonial => `
            <div class="testimonial-card">
              ${showRating ? `<div class="testimonial-stars">${generateStars(testimonial.rating || 5)}</div>` : ''}
              <p class="testimonial-text">${escapeHtml(testimonial.text)}</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar">${getInitials(testimonial.author)}</div>
                <div class="testimonial-author-info">
                  <div class="testimonial-author-name">${escapeHtml(testimonial.author)}</div>
                  ${testimonial.location ? `<div class="testimonial-author-location">${escapeHtml(testimonial.location)}</div>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

/**
 * Single featured testimonial
 */
export function generateFeaturedTestimonial(testimonial: Testimonial): string {
  return `
    <section class="testimonials testimonials-white" style="padding: 60px 0;">
      <div class="container-sm" style="text-align: center;">
        <div class="testimonial-stars" style="font-size: 28px; margin-bottom: 24px;">
          ${generateStars(testimonial.rating || 5)}
        </div>
        <blockquote style="font-size: 24px; font-style: italic; color: var(--text); margin-bottom: 24px; line-height: 1.6;">
          "${escapeHtml(testimonial.text)}"
        </blockquote>
        <div style="font-weight: 600; color: var(--primary);">— ${escapeHtml(testimonial.author)}</div>
        ${testimonial.location ? `<div style="font-size: 14px; color: var(--muted); margin-top: 4px;">${escapeHtml(testimonial.location)}</div>` : ''}
      </div>
    </section>
  `;
}

/**
 * Compact testimonial slider placeholder
 */
export function generateTestimonialSlider(testimonials: Testimonial[]): string {
  // For simplicity, show first testimonial with navigation dots
  const first = testimonials[0] || { text: 'Great service!', author: 'Customer', rating: 5 };

  return `
    <section class="testimonials" style="padding: 60px 0;">
      <div class="container-sm" style="text-align: center;">
        <div class="testimonial-stars" style="font-size: 24px; margin-bottom: 20px;">
          ${generateStars(first.rating || 5)}
        </div>
        <p style="font-size: 18px; font-style: italic; color: var(--muted); margin-bottom: 20px;">
          "${escapeHtml(first.text)}"
        </p>
        <div style="font-weight: 600;">— ${escapeHtml(first.author)}</div>
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 24px;">
          ${testimonials.slice(0, 5).map((_, i) => `
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? 'var(--primary)' : 'var(--gray-300)'};"></div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
