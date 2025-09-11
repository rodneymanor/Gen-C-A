/**
 * Utility functions for the component library
 * Common helpers and utility functions used across components
 */

// Utility type for extracting component variants
export type VariantProps<T> = T extends { variant?: infer V } ? V : never;

// Utility type for extracting component sizes
export type SizeProps<T> = T extends { size?: infer S } ? S : never;

// CSS class name utilities (re-export clsx if needed)
export { default as clsx } from 'clsx';

// Common prop patterns
export interface BaseComponentProps {
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  isDisabled?: boolean;
  onClick?: () => void;
}

export interface FormComponentProps extends BaseComponentProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

// Touch target size validation
export const TOUCH_TARGET_MIN_SIZE = 44; // px

export const isTouchTargetCompliant = (size: number): boolean => {
  return size >= TOUCH_TARGET_MIN_SIZE;
};

// Responsive breakpoint utilities
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Generate responsive CSS for container queries
export const containerQuery = (breakpoint: Breakpoint, styles: string) => `
  @container (min-width: ${breakpoints[breakpoint]}) {
    ${styles}
  }
`;

// Media query utilities
export const mediaQuery = (breakpoint: Breakpoint, styles: string) => `
  @media (min-width: ${breakpoints[breakpoint]}) {
    ${styles}
  }
`;

// Focus management utilities
export const focusVisibleStyles = `
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

export const accessibleHiddenStyles = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// Animation utilities
export const reduceMotion = (styles: string) => `
  @media (prefers-reduced-motion: reduce) {
    ${styles}
  }
`;

// Generate initials from a name (utility used by Avatar)
export const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Color contrast utilities
export const getContrastColor = (backgroundColor: string): 'light' | 'dark' => {
  // Simple heuristic - in a real implementation you'd calculate luminance
  // This is a placeholder for the concept
  return backgroundColor.includes('dark') || backgroundColor.includes('900') ? 'light' : 'dark';
};

// Component size mapping utilities
export const sizeMap = {
  small: {
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-body-small)',
    minHeight: '32px',
  },
  medium: {
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--font-size-body)',
    minHeight: '40px',
  },
  large: {
    padding: 'var(--space-4) var(--space-6)',
    fontSize: 'var(--font-size-body-large)',
    minHeight: '48px',
  },
} as const;

export type ComponentSize = keyof typeof sizeMap;