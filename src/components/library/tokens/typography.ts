/**
 * Typography tokens extracted from the responsive design system
 * Includes font families, sizes, weights, and line heights
 */

// Font families
export const fontFamily = {
  primary: 'var(--font-family-primary)',
  mono: 'var(--font-family-mono)',
} as const;

// Responsive font sizes using clamp for fluid scaling
export const fontSize = {
  // Headings
  h1: 'var(--font-size-h1)',     // clamp(1.75rem, 4vw, 2.5rem) - 28-40px
  h2: 'var(--font-size-h2)',     // clamp(1.5rem, 3.5vw, 2rem) - 24-32px
  h3: 'var(--font-size-h3)',     // clamp(1.25rem, 3vw, 1.5rem) - 20-24px
  h4: 'var(--font-size-h4)',     // clamp(1.125rem, 2.5vw, 1.25rem) - 18-20px
  h5: 'var(--font-size-h5)',     // clamp(1rem, 2vw, 1.125rem) - 16-18px
  h6: 'var(--font-size-h6)',     // clamp(0.875rem, 1.5vw, 1rem) - 14-16px
  
  // Body text
  bodyLarge: 'var(--font-size-body-large)', // clamp(1rem, 2vw, 1.125rem) - 16-18px
  body: 'var(--font-size-body)',            // clamp(0.875rem, 1.5vw, 1rem) - 14-16px
  bodySmall: 'var(--font-size-body-small)', // clamp(0.75rem, 1.25vw, 0.875rem) - 12-14px
  caption: 'var(--font-size-caption)',      // clamp(0.625rem, 1vw, 0.75rem) - 10-12px
  
  // Display typography for hero sections
  display1: 'var(--font-size-display-1)',   // clamp(2.5rem, 6vw, 4rem) - 40-64px
  display2: 'var(--font-size-display-2)',   // clamp(2rem, 5vw, 3rem) - 32-48px
  display3: 'var(--font-size-display-3)',   // clamp(1.75rem, 4vw, 2.5rem) - 28-40px
} as const;

// Line heights
export const lineHeight = {
  tight: 'var(--line-height-tight)',     // 1.2
  normal: 'var(--line-height-normal)',   // 1.5
  relaxed: 'var(--line-height-relaxed)', // 1.6
} as const;

// Font weights
export const fontWeight = {
  light: 'var(--font-weight-light)',       // 300
  normal: 'var(--font-weight-normal)',     // 400
  medium: 'var(--font-weight-medium)',     // 500
  semibold: 'var(--font-weight-semibold)', // 600
  bold: 'var(--font-weight-bold)',         // 700
} as const;

// Component-specific typography scales
export const componentTypography = {
  button: {
    small: {
      fontSize: fontSize.bodySmall,
      fontWeight: fontWeight.medium,
    },
    medium: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
    },
    large: {
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.medium,
    },
  },
  
  input: {
    small: {
      fontSize: fontSize.bodySmall,
    },
    medium: {
      fontSize: fontSize.body,
    },
    large: {
      fontSize: fontSize.bodyLarge,
    },
  },
  
  badge: {
    small: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
    },
    medium: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
    },
    large: {
      fontSize: fontSize.bodySmall,
      fontWeight: fontWeight.medium,
    },
  },
  
  avatar: {
    small: fontSize.caption,
    medium: fontSize.bodySmall,
    large: fontSize.body,
    xlarge: fontSize.h5,
  },
  
  label: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  
  helperText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.normal,
  },
  
  errorText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.normal,
  },
} as const;

// Container-based typography for responsive components
export const containerTypography = {
  xs: fontSize.bodySmall,
  sm: fontSize.body,
  md: fontSize.bodyLarge,
  lg: fontSize.h6,
  xl: fontSize.h5,
} as const;

// Export all typography tokens
export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  componentTypography,
  containerTypography,
} as const;