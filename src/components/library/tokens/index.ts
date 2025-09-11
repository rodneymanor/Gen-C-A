/**
 * Unified design token exports
 * Provides centralized access to all design system tokens
 */

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './effects';

// Re-export specific token groups for convenience
export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { effects } from './effects';

// Combined tokens export for easy destructuring
export const tokens = {
  colors: () => import('./colors').then(m => m.colors),
  spacing: () => import('./spacing').then(m => m.spacing),
  typography: () => import('./typography').then(m => m.typography),
  effects: () => import('./effects').then(m => m.effects),
} as const;