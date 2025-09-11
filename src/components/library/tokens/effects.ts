/**
 * Visual effects tokens - shadows, animations, transitions, and focus management
 * Based on the comprehensive animation and transition system
 */

// Shadow tokens
export const shadow = {
  subtle: 'var(--shadow-subtle)',     // Light card shadows
  card: 'var(--shadow-card)',         // Standard card elevation
  elevated: 'var(--shadow-elevated)', // Elevated elements
  modal: 'var(--shadow-modal)',       // Modal/overlay shadows
  primary: 'var(--shadow-primary)',   // Primary action shadows
  ai: 'var(--shadow-ai)',            // AI/creative element shadows
} as const;

// Border radius tokens
export const radius = {
  small: 'var(--radius-small)',   // 4px
  medium: 'var(--radius-medium)', // 8px
  large: 'var(--radius-large)',   // 12px
  xlarge: 'var(--radius-xlarge)', // 16px
  full: 'var(--radius-full)',     // 9999px (circular)
} as const;

// Animation timing functions
export const ease = {
  in: 'var(--ease-in)',           // cubic-bezier(0.4, 0, 1, 1)
  out: 'var(--ease-out)',         // cubic-bezier(0, 0, 0.2, 1)
  inOut: 'var(--ease-in-out)',    // cubic-bezier(0.4, 0, 0.2, 1)
  bounce: 'var(--ease-bounce)',   // cubic-bezier(0.68, -0.55, 0.265, 1.55)
  spring: 'var(--ease-spring)',   // cubic-bezier(0.175, 0.885, 0.32, 1.275)
  elastic: 'var(--ease-elastic)', // cubic-bezier(0.68, -0.6, 0.32, 1.6)
  back: 'var(--ease-back)',       // cubic-bezier(0.34, 1.56, 0.64, 1)
} as const;

// Animation durations
export const duration = {
  instant: 'var(--duration-instant)', // 0ms
  fast: 'var(--duration-fast)',       // 150ms
  normal: 'var(--duration-normal)',   // 250ms
  slow: 'var(--duration-slow)',       // 350ms
  slower: 'var(--duration-slower)',   // 500ms
  glacial: 'var(--duration-glacial)', // 1000ms
} as const;

// Animation timeline tokens
export const animationDuration = {
  enter: 'var(--animation-enter-duration)',   // 250ms
  exit: 'var(--animation-exit-duration)',     // 150ms
  bounce: 'var(--animation-bounce-duration)', // 350ms
  spring: 'var(--animation-spring-duration)', // 500ms
} as const;

// Common transition compositions
export const transition = {
  all: 'var(--transition-all)',           // All properties with normal timing
  colors: 'var(--transition-colors)',     // Color and background-color
  transform: 'var(--transition-transform)', // Transform with ease-out
  opacity: 'var(--transition-opacity)',   // Opacity transitions
  shadow: 'var(--transition-shadow)',     // Box-shadow transitions
  border: 'var(--transition-border)',     // Border-color transitions
  
  // Component-specific transitions
  button: 'var(--transition-button)',     // Button state changes
  card: 'var(--transition-card)',         // Card hover effects
  modal: 'var(--transition-modal)',       // Modal enter/exit
} as const;

// Focus management system
export const focus = {
  // Focus ring colors
  color: 'var(--focus-ring-color)',           // Primary focus color
  colorError: 'var(--focus-ring-color-error)', // Error state focus
  colorWarning: 'var(--focus-ring-color-warning)', // Warning state focus
  colorSuccess: 'var(--focus-ring-color-success)', // Success state focus
  colorInfo: 'var(--focus-ring-color-info)',   // Info state focus
  
  // Focus ring dimensions
  width: 'var(--focus-ring-width)',           // 2px
  widthThick: 'var(--focus-ring-width-thick)', // 3px
  offset: 'var(--focus-ring-offset)',         // 2px
  offsetTight: 'var(--focus-ring-offset-tight)', // 1px
  style: 'var(--focus-ring-style)',           // solid
  
  // Focus ring compositions
  ring: 'var(--focus-ring)',                  // Legacy focus ring
  ringError: 'var(--focus-ring-error)',       // Legacy error focus ring
  ringInfo: 'var(--focus-ring-info)',         // Legacy info focus ring
  
  // Enhanced focus rings
  ringPrimary: 'var(--focus-ring-primary)',           // Primary focus ring
  ringPrimaryThick: 'var(--focus-ring-primary-thick)', // Thick primary focus ring
  ringErrorEnhanced: 'var(--focus-ring-error-enhanced)', // Enhanced error focus ring
  ringWarningEnhanced: 'var(--focus-ring-warning-enhanced)', // Enhanced warning focus ring
  ringSuccessEnhanced: 'var(--focus-ring-success-enhanced)', // Enhanced success focus ring
  
  // Focus-visible support
  visible: 'var(--focus-visible-ring)',       // Focus-visible ring
  visibleOffset: 'var(--focus-visible-offset)', // Focus-visible offset
} as const;

// Container query breakpoints for modern responsive design
export const containerQuery = {
  xs: 'var(--container-xs)',   // 240px
  sm: 'var(--container-sm)',   // 384px
  md: 'var(--container-md)',   // 512px
  lg: 'var(--container-lg)',   // 768px
  xl: 'var(--container-xl)',   // 1024px
  '2xl': 'var(--container-2xl)', // 1280px
} as const;

// Viewport breakpoints
export const breakpoint = {
  sm: 'var(--breakpoint-sm)',   // 640px
  md: 'var(--breakpoint-md)',   // 768px
  lg: 'var(--breakpoint-lg)',   // 1024px
  xl: 'var(--breakpoint-xl)',   // 1280px
  '2xl': 'var(--breakpoint-2xl)', // 1536px
} as const;

// Export all effect tokens
export const effects = {
  shadow,
  radius,
  ease,
  duration,
  animationDuration,
  transition,
  focus,
  containerQuery,
  breakpoint,
} as const;