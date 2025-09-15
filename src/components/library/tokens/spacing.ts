/**
 * Spacing tokens extracted from the 8px-based design system
 * Includes fixed spacing, responsive spacing, and semantic spacing
 */

// Base spacing system (8px base unit)
export const space = {
  1: 'var(--space-1)',   // 4px
  2: 'var(--space-2)',   // 8px
  3: 'var(--space-3)',   // 12px
  4: 'var(--space-4)',   // 16px
  5: 'var(--space-5)',   // 20px
  6: 'var(--space-6)',   // 24px
  7: 'var(--space-7)',   // 28px
  8: 'var(--space-8)',   // 32px
  9: 'var(--space-9)',   // 36px
  10: 'var(--space-10)', // 40px
  11: 'var(--space-11)', // 44px
  12: 'var(--space-12)', // 48px
  14: 'var(--space-14)', // 56px
  16: 'var(--space-16)', // 64px
  18: 'var(--space-18)', // 72px
  20: 'var(--space-20)', // 80px
  24: 'var(--space-24)', // 96px
  28: 'var(--space-28)', // 112px
  32: 'var(--space-32)', // 128px
} as const;

// Responsive spacing - fluid scaling
export const spaceResponsive = {
  xs: 'var(--space-responsive-xs)',   // 4-8px fluid
  sm: 'var(--space-responsive-sm)',   // 8-16px fluid
  md: 'var(--space-responsive-md)',   // 16-24px fluid
  lg: 'var(--space-responsive-lg)',   // 24-40px fluid
  xl: 'var(--space-responsive-xl)',   // 32-64px fluid
  '2xl': 'var(--space-responsive-2xl)', // 40-96px fluid
} as const;

// Semantic spacing tokens for specific use cases
export const semantic = {
  // Component internal spacing
  componentPadding: 'var(--space-component-padding)', // 16px
  sectionGap: 'var(--space-section-gap)',             // 32px
  cardPadding: 'var(--space-card-padding)',           // 24px
  
  // Button spacing
  buttonPaddingX: 'var(--space-button-padding-x)',   // 16px
  buttonPaddingY: 'var(--space-button-padding-y)',   // 12px
  
  // Input spacing
  inputPadding: 'var(--space-input-padding)',         // 12px 16px
} as const;

// Layout spacing
export const layout = {
  gutter: 'var(--layout-gutter)',           // 24px
  containerMax: 'var(--layout-container-max)', // 1200px
  sidebarWidth: 'var(--sidebar-width)',     // 224px
  sidebarCollapsed: 'var(--sidebar-collapsed)', // 64px
} as const;

// Touch target spacing (WCAG compliance)
export const touchTarget = {
  min: 'var(--touch-target-min)',           // 44px
  comfortable: 'var(--touch-target-comfortable)', // 48px
  large: 'var(--touch-target-large)',       // 56px
  spacing: 'var(--touch-target-spacing)',   // 8px
} as const;

// Interactive element heights
export const interactiveHeight = {
  sm: 'var(--interactive-height-sm)',       // 44px
  md: 'var(--interactive-height-md)',       // 48px
  lg: 'var(--interactive-height-lg)',       // 56px
} as const;

// Tap spacing for different UI densities
export const tapSpacing = {
  tight: 'var(--tap-spacing-tight)',        // 8px
  comfortable: 'var(--tap-spacing-comfortable)', // 12px
  loose: 'var(--tap-spacing-loose)',        // 16px
} as const;

// Export all spacing tokens
export const spacing = {
  space,
  spaceResponsive,
  semantic,
  layout,
  touchTarget,
  interactiveHeight,
  tapSpacing,
} as const;
