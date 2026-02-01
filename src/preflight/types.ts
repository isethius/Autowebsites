/**
 * Preflight Check Types
 *
 * Defines interfaces for pre-launch verification system.
 */

export type PreflightStatus = 'pass' | 'fail' | 'skip' | 'warn';

export interface PreflightResult {
  category: string;
  name: string;
  status: PreflightStatus;
  duration: number;
  message?: string;
  details?: Record<string, any>;
  fixable?: boolean;
  fixCommand?: string;
}

export interface PreflightOptions {
  fix?: boolean;
  verbose?: boolean;
  skipOptional?: boolean;
  testEmail?: string;
}

export interface PreflightCheck {
  category: string;
  name: string;
  required: boolean;
  run: (options: PreflightOptions) => Promise<PreflightResult>;
}

export interface PreflightSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  warned: number;
  duration: number;
  success: boolean;
  nextSteps: NextStep[];
}

export interface NextStep {
  type: 'error' | 'warning';
  message: string;
  fixCommand?: string;
}

export interface CategoryResults {
  category: string;
  icon: string;
  results: PreflightResult[];
}

// Check runner context for sharing state between checks
export interface PreflightContext {
  testLeadId?: string;
  screenshotPath?: string;
  galleryDir?: string;
  cleanup: (() => Promise<void> | void)[];
}

// Helper to create a result
export function createResult(
  category: string,
  name: string,
  status: PreflightStatus,
  duration: number,
  options?: {
    message?: string;
    details?: Record<string, any>;
    fixable?: boolean;
    fixCommand?: string;
  }
): PreflightResult {
  return {
    category,
    name,
    status,
    duration,
    ...options,
  };
}

// Helper to time an async operation
export async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, duration: Date.now() - start };
}
