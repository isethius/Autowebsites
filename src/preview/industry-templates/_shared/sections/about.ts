/**
 * About Section
 *
 * DNA-aware about section with multiple layout variants.
 */

export interface AboutConfig {
  businessName: string;
  description?: string;
  tagline?: string;
  years?: string;
  employees?: string;
  certifications?: string[];
}

/**
 * Generate a standard about section
 */
export function generateAboutSection(config: AboutConfig): string {
  const {
    businessName,
    description = 'We are dedicated to providing exceptional service and quality results for every project.',
    tagline = 'Your trusted local experts',
    years = '10+',
    employees = 'Expert Team',
  } = config;

  return `
    <section id="about" class="about" data-reveal="up">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="about-label">About Us</span>
            <h2 class="about-title">Why Choose ${businessName}?</h2>
            <p class="about-description">${description}</p>
            <p class="about-tagline">${tagline}</p>
            <div class="about-stats">
              <div class="about-stat">
                <span class="about-stat-value" data-counter data-target="${parseInt(years) || 10}">${years}</span>
                <span class="about-stat-label">Years Experience</span>
              </div>
              <div class="about-stat">
                <span class="about-stat-value">${employees}</span>
                <span class="about-stat-label">Professional Team</span>
              </div>
            </div>
          </div>
          <div class="about-image" data-reveal="scale">
            <div class="about-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
              <span>Your Photo Here</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate CSS for about section
 */
export function generateAboutCSS(): string {
  return `
    .about {
      padding: var(--section-spacing, 100px) 0;
      background: var(--gray-50, #f9fafb);
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--gap-xl, 60px);
      align-items: center;
    }

    .about-label {
      display: inline-block;
      color: var(--primary);
      font-size: var(--text-sm, 14px);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
    }

    .about-title {
      font-size: var(--text-h2, 36px);
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--text);
    }

    .about-description {
      font-size: var(--text-lg, 18px);
      color: var(--muted);
      line-height: 1.8;
      margin-bottom: 16px;
    }

    .about-tagline {
      font-size: var(--text-body, 16px);
      color: var(--muted);
      margin-bottom: 32px;
    }

    .about-stats {
      display: flex;
      gap: var(--gap-lg, 40px);
    }

    .about-stat {
      display: flex;
      flex-direction: column;
    }

    .about-stat-value {
      font-size: var(--text-h2, 36px);
      font-weight: 700;
      color: var(--primary);
    }

    .about-stat-label {
      font-size: var(--text-sm, 14px);
      color: var(--muted);
    }

    .about-image {
      position: relative;
    }

    .about-image-placeholder {
      aspect-ratio: 4/3;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      border-radius: var(--radius-lg, 16px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      gap: 16px;
    }

    .about-image-placeholder svg {
      width: 64px;
      height: 64px;
      opacity: 0.8;
    }

    .about-image-placeholder span {
      font-size: var(--text-body, 16px);
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .about-content {
        grid-template-columns: 1fr;
        gap: var(--gap-lg, 40px);
      }

      .about-image {
        order: -1;
      }

      .about-stats {
        flex-direction: column;
        gap: var(--gap-md, 24px);
      }
    }
  `;
}
