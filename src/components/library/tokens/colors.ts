/**
 * Color tokens extracted from the design system
 * Based on Claude-inspired palette with comprehensive semantic aliases
 */

// Primary Colors (Claude-inspired)
export const primary = {
  50: 'var(--color-primary-50)',
  100: 'var(--color-primary-100)',
  200: 'var(--color-primary-200)',
  300: 'var(--color-primary-300)',
  400: 'var(--color-primary-400)',
  500: 'var(--color-primary-500)',
  600: 'var(--color-primary-600)',
  700: 'var(--color-primary-700)',
  800: 'var(--color-primary-800)',
  900: 'var(--color-primary-900)',
} as const;

// Neutral Grays
export const neutral = {
  0: 'var(--color-neutral-0)',
  50: 'var(--color-neutral-50)',
  100: 'var(--color-neutral-100)',
  200: 'var(--color-neutral-200)',
  300: 'var(--color-neutral-300)',
  400: 'var(--color-neutral-400)',
  500: 'var(--color-neutral-500)',
  600: 'var(--color-neutral-600)',
  700: 'var(--color-neutral-700)',
  800: 'var(--color-neutral-800)',
  900: 'var(--color-neutral-900)',
} as const;

// Semantic Colors
export const semantic = {
  success: {
    50: 'var(--color-success-50)',
    100: 'var(--color-success-100)',
    400: 'var(--color-success-400)',
    500: 'var(--color-success-500)',
  },
  warning: {
    50: 'var(--color-warning-50)',
    100: 'var(--color-warning-100)',
    400: 'var(--color-warning-400)',
    500: 'var(--color-warning-500)',
  },
  error: {
    50: 'var(--color-error-50)',
    100: 'var(--color-error-100)',
    400: 'var(--color-error-400)',
    500: 'var(--color-error-500)',
  },
  info: {
    50: 'var(--color-info-50)',
    100: 'var(--color-info-100)',
    400: 'var(--color-info-400)',
    500: 'var(--color-info-500)',
  },
} as const;

// AI/Creative Accents
export const creative = {
  aiGradientStart: 'var(--color-ai-gradient-start)',
  aiGradientEnd: 'var(--color-ai-gradient-end)',
  purple: 'var(--color-creative-purple)',
  blue: 'var(--color-creative-blue)',
  green: 'var(--color-creative-green)',
  pink: 'var(--color-creative-pink)',
} as const;

// Surface & Background Tokens
export const surface = {
  default: 'var(--color-surface)',
  elevated: 'var(--color-surface-elevated)',
  hover: 'var(--color-surface-hover)',
  active: 'var(--color-surface-active)',
  disabled: 'var(--color-surface-disabled)',
} as const;

// Text Color Tokens
export const text = {
  primary: 'var(--color-text-primary)',
  secondary: 'var(--color-text-secondary)',
  tertiary: 'var(--color-text-tertiary)',
  quaternary: 'var(--color-text-quaternary)',
  disabled: 'var(--color-text-disabled)',
  inverse: 'var(--color-text-inverse)',
  brand: 'var(--color-text-brand)',
  onPrimary: 'var(--color-text-on-primary)',
  onDark: 'var(--color-text-on-dark)',
} as const;

// Border Tokens
export const border = {
  default: 'var(--color-border)',
  subtle: 'var(--color-border-subtle)',
  strong: 'var(--color-border-strong)',
  interactive: 'var(--color-border-interactive)',
  focus: 'var(--color-border-focus)',
  error: 'var(--color-border-error)',
  warning: 'var(--color-border-warning)',
  success: 'var(--color-border-success)',
} as const;

// Action/Interactive Tokens
export const action = {
  primary: 'var(--color-action-primary)',
  primaryHover: 'var(--color-action-primary-hover)',
  primaryActive: 'var(--color-action-primary-active)',
  secondary: 'var(--color-action-secondary)',
  secondaryHover: 'var(--color-action-secondary-hover)',
  tertiary: 'var(--color-action-tertiary)',
  tertiaryHover: 'var(--color-action-tertiary-hover)',
} as const;

// Component-specific color tokens
export const button = {
  primary: {
    background: 'var(--button-primary-bg)',
    backgroundHover: 'var(--button-primary-bg-hover)',
    text: 'var(--button-primary-text)',
    shadow: 'var(--button-primary-shadow)',
  },
  secondary: {
    background: 'var(--button-secondary-bg)',
    backgroundHover: 'var(--button-secondary-bg-hover)',
    text: 'var(--button-secondary-text)',
    border: 'var(--button-secondary-border)',
  },
} as const;

export const card = {
  background: 'var(--card-bg)',
  border: 'var(--card-border)',
  shadow: 'var(--card-shadow)',
} as const;

export const input = {
  background: 'var(--input-bg)',
  border: 'var(--input-border)',
  borderFocus: 'var(--input-border-focus)',
  text: 'var(--input-text)',
  placeholder: 'var(--input-placeholder)',
} as const;

// Export all colors
export const colors = {
  primary,
  neutral,
  semantic,
  creative,
  surface,
  text,
  border,
  action,
  button,
  card,
  input,
} as const;