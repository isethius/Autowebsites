/**
 * Industry Blueprints
 *
 * Blueprints replace monolithic industry templates with configuration-driven
 * section compositions. Each blueprint defines:
 * - Which sections to include
 * - Default DNA codes for the industry
 * - Suggested CTAs and trust signals
 * - Content requirements
 */

import { DNACode } from '../variance-planner';
import { SectionCategory } from '../engine/section-registry';

export { SERVICE_BUSINESS_BLUEPRINT } from './service-business';
export { PROFESSIONAL_SERVICES_BLUEPRINT } from './professional-services';
export { HEALTH_WELLNESS_BLUEPRINT } from './health-wellness';
export { CREATIVE_VISUAL_BLUEPRINT } from './creative-visual';

/**
 * Section definition within a blueprint
 */
export interface BlueprintSection {
  category: SectionCategory;
  required: boolean;
  title?: string;
  subtitle?: string;
  config?: Record<string, unknown>;
}

/**
 * Complete industry blueprint
 */
export interface Blueprint {
  id: string;
  name: string;
  description: string;
  industries: string[];
  sections: BlueprintSection[];
  defaultDNA: Partial<DNACode>;
  suggestedCTAs: string[];
  trustSignals: string[];
  contentRequirements: {
    services?: { min: number; max: number };
    testimonials?: { min: number; max: number };
    team?: { min: number; max: number };
    faqs?: { min: number; max: number };
  };
}

/**
 * All registered blueprints
 */
const BLUEPRINTS: Map<string, Blueprint> = new Map();

/**
 * Register a blueprint
 */
export function registerBlueprint(blueprint: Blueprint): void {
  BLUEPRINTS.set(blueprint.id, blueprint);
}

/**
 * Get a blueprint by ID
 */
export function getBlueprint(id: string): Blueprint | undefined {
  return BLUEPRINTS.get(id);
}

/**
 * Find the best blueprint for an industry
 */
export function getBlueprintForIndustry(industry: string): Blueprint | undefined {
  for (const blueprint of BLUEPRINTS.values()) {
    if (blueprint.industries.includes(industry)) {
      return blueprint;
    }
  }
  return undefined;
}

/**
 * Get all registered blueprints
 */
export function getAllBlueprints(): Blueprint[] {
  return Array.from(BLUEPRINTS.values());
}

/**
 * Get blueprints by category
 */
export function getBlueprintsByCategory(category: 'service' | 'professional' | 'health' | 'creative'): Blueprint[] {
  const categoryMap: Record<string, string[]> = {
    service: ['service-business'],
    professional: ['professional-services'],
    health: ['health-wellness'],
    creative: ['creative-visual'],
  };

  const blueprintIds = categoryMap[category] || [];
  return blueprintIds.map(id => BLUEPRINTS.get(id)).filter(Boolean) as Blueprint[];
}

// Auto-register blueprints on import
import { SERVICE_BUSINESS_BLUEPRINT as sbb } from './service-business';
import { PROFESSIONAL_SERVICES_BLUEPRINT as psb } from './professional-services';
import { HEALTH_WELLNESS_BLUEPRINT as hwb } from './health-wellness';
import { CREATIVE_VISUAL_BLUEPRINT as cvb } from './creative-visual';

registerBlueprint(sbb);
registerBlueprint(psb);
registerBlueprint(hwb);
registerBlueprint(cvb);
