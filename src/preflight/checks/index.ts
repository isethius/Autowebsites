/**
 * Preflight Checks Index
 *
 * Exports all check modules and provides a unified list of all checks.
 */

import { PreflightCheck } from '../types';
import { environmentChecks } from './environment';
import { databaseChecks } from './database';
import { emailChecks } from './email';
import { paymentsChecks } from './payments';
import { discoveryChecks } from './discovery';
import { captureChecks } from './capture';
import { aiChecks } from './ai';
import { themesChecks } from './themes';
import { mediaChecks } from './media';
import { compositionChecks } from './composition';
import { pipelineChecks } from './pipeline';

// Export individual check modules
export { environmentChecks } from './environment';
export { databaseChecks } from './database';
export { emailChecks } from './email';
export { paymentsChecks } from './payments';
export { discoveryChecks } from './discovery';
export { captureChecks } from './capture';
export { aiChecks } from './ai';
export { themesChecks } from './themes';
export { mediaChecks } from './media';
export { compositionChecks } from './composition';
export { pipelineChecks } from './pipeline';

// Category order for display
export const CATEGORY_ORDER = [
  'Environment',
  'Database',
  'Email',
  'Payments',
  'Discovery',
  'Capture',
  'AI',
  'Themes',
  'Media',
  'Composition',
  'Pipeline',
];

/**
 * Get all preflight checks in order
 */
export function getAllChecks(): PreflightCheck[] {
  return [
    ...environmentChecks,
    ...databaseChecks,
    ...emailChecks,
    ...paymentsChecks,
    ...discoveryChecks,
    ...captureChecks,
    ...aiChecks,
    ...themesChecks,
    ...mediaChecks,
    ...compositionChecks,
    ...pipelineChecks,
  ];
}

/**
 * Get checks by category
 */
export function getChecksByCategory(): Map<string, PreflightCheck[]> {
  const map = new Map<string, PreflightCheck[]>();

  for (const category of CATEGORY_ORDER) {
    map.set(category, []);
  }

  for (const check of getAllChecks()) {
    const existing = map.get(check.category) || [];
    existing.push(check);
    map.set(check.category, existing);
  }

  return map;
}

/**
 * Get required checks only
 */
export function getRequiredChecks(): PreflightCheck[] {
  return getAllChecks().filter(check => check.required);
}

/**
 * Get optional checks only
 */
export function getOptionalChecks(): PreflightCheck[] {
  return getAllChecks().filter(check => !check.required);
}

/**
 * Get check counts
 */
export function getCheckCounts(): { total: number; required: number; optional: number } {
  const all = getAllChecks();
  return {
    total: all.length,
    required: all.filter(c => c.required).length,
    optional: all.filter(c => !c.required).length,
  };
}
