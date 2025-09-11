/**
 * Gen.C Alpha Component Library
 * 
 * A comprehensive component library extracted from the existing well-structured codebase.
 * Features Claude-inspired design tokens, mobile-first responsive design, and excellent
 * accessibility support.
 * 
 * Key Features:
 * - Touch-friendly components (44px+ touch targets)
 * - Comprehensive design token system
 * - Responsive typography with fluid scaling
 * - Dark mode support
 * - Accessibility-first design
 * - Motion and animation support
 */

// Primitive Components - Basic building blocks
export * from './primitives';

// Pattern Components - Composite components and complex patterns
export * from './patterns';

// Design Tokens - Colors, spacing, typography, effects
export * from './tokens';

// Utility functions and helpers
export * from './utils';

// Re-export specific categories for convenience
import * as Primitives from './primitives';
import * as Patterns from './patterns';
import * as Tokens from './tokens';

export { Primitives, Patterns, Tokens };

// Version information
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'Gen.C Alpha Component Library';