// Media generation module for AutoWebsites
// Phase 1: Before/After GIF generation
// Phase 2: Gallery showcase videos with Remotion
// Phase 3: Theme preview grids for email engagement

export * from './types';
export * from './storage';
export * from './before-after-generator';
export * from './media-generator';
export * from './video-generator';
export * from './theme-grid';

// Re-export main classes for convenience
export { MediaStorage, createMediaStorage } from './storage';
export { BeforeAfterGenerator, createBeforeAfterGenerator } from './before-after-generator';
export { MediaGenerator, createMediaGenerator } from './media-generator';
export { VideoGenerator, createVideoGenerator } from './video-generator';
export { ThemeGridGenerator, createThemeGridGenerator, generateThemeGrid } from './theme-grid';
