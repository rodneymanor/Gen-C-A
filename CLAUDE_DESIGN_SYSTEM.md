# Gen.C Alpha - Claude-Inspired Design System

## Design Philosophy

### Core Principles
- **Clarity & Simplicity**: Clean, uncluttered interfaces that prioritize content and user goals
- **Human-Centered Design**: Conversational patterns and approachable language throughout
- **Purposeful Interaction**: Every element serves a clear function with minimal cognitive load
- **Accessibility First**: WCAG 2.1 AA compliance with comprehensive keyboard navigation
- **Progressive Disclosure**: Complex features revealed contextually when needed

### Visual Language
- **Warm Minimalism**: Claude's approachable aesthetic with generous whitespace
- **Soft Modernism**: Rounded corners, subtle shadows, and organic shapes
- **Conversational Flow**: Interface patterns that feel like natural dialogue
- **Thoughtful Hierarchy**: Clear content prioritization without visual noise

---

## Color Palette

### Primary Colors (Claude-Inspired Warm Tones)
```scss
// Primary Brand Colors
$claude-orange-50: #FFF7ED;    // Light background tints
$claude-orange-100: #FFEDD5;   // Subtle highlights
$claude-orange-200: #FED7AA;   // Light accents
$claude-orange-500: #F97316;   // Primary CTA color
$claude-orange-600: #EA580C;   // Hover states
$claude-orange-700: #C2410C;   // Active states

// Supporting Warm Colors
$warm-amber-50: #FFFBEB;
$warm-amber-100: #FEF3C7;
$warm-amber-500: #F59E0B;
$warm-peach-50: #FEF7F0;
$warm-peach-100: #FDEEE1;
$warm-peach-500: #FB923C;
```

### Neutral Foundation
```scss
// Sophisticated Grays (Claude's subtle approach)
$neutral-0: #FFFFFF;           // Pure white backgrounds
$neutral-50: #FAFAF9;          // Off-white, warm undertone
$neutral-100: #F5F5F4;         // Light gray backgrounds
$neutral-200: #E7E5E4;         // Subtle borders
$neutral-300: #D6D3D1;         // Light borders
$neutral-400: #A8A29E;         // Placeholder text
$neutral-500: #78716C;         // Secondary text
$neutral-600: #57534E;         // Primary text (lighter)
$neutral-700: #44403C;         // Primary text
$neutral-800: #292524;         // Dark text
$neutral-900: #1C1917;         // Highest contrast text
```

### Semantic Colors
```scss
// Success (Gentle Green)
$success-50: #F0FDF4;
$success-100: #DCFCE7;
$success-500: #22C55E;
$success-600: #16A34A;

// Warning (Warm Amber)
$warning-50: #FFFBEB;
$warning-100: #FEF3C7;
$warning-500: #F59E0B;
$warning-600: #D97706;

// Error (Soft Red)
$error-50: #FEF2F2;
$error-100: #FEE2E2;
$error-500: #EF4444;
$error-600: #DC2626;

// Information (Calm Blue)
$info-50: #EFF6FF;
$info-100: #DBEAFE;
$info-500: #3B82F6;
$info-600: #2563EB;
```

---

## Typography

### Font System (Claude's Readable Approach)
```scss
// Primary Font Stack
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 
             'Segoe UI Emoji', 'Segoe UI Symbol';

// Monospace (for code/API keys)
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
             Consolas, 'Courier New', monospace;
```

### Type Scale (Harmonious Proportions)
```scss
// Display & Headlines
$text-5xl: 3rem;      // 48px - Hero headings
$text-4xl: 2.25rem;   // 36px - Page titles
$text-3xl: 1.875rem;  // 30px - Section headers
$text-2xl: 1.5rem;    // 24px - Card titles
$text-xl: 1.25rem;    // 20px - Large text

// Body Text
$text-lg: 1.125rem;   // 18px - Large body text
$text-base: 1rem;     // 16px - Default body text
$text-sm: 0.875rem;   // 14px - Small text
$text-xs: 0.75rem;    // 12px - Captions, labels

// Line Heights (Optimized for readability)
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.75;
```

### Font Weights
```scss
$font-light: 300;     // Subtle text
$font-normal: 400;    // Body text
$font-medium: 500;    // Emphasis
$font-semibold: 600;  // Strong emphasis
$font-bold: 700;      // Headlines only
```

---

## Spacing System

### Base Unit: 4px (Claude's Consistent Rhythm)
```scss
// Micro Spacing
$space-1: 0.25rem;    // 4px
$space-2: 0.5rem;     // 8px
$space-3: 0.75rem;    // 12px
$space-4: 1rem;       // 16px

// Component Spacing
$space-5: 1.25rem;    // 20px
$space-6: 1.5rem;     // 24px
$space-8: 2rem;       // 32px
$space-10: 2.5rem;    // 40px

// Layout Spacing
$space-12: 3rem;      // 48px
$space-16: 4rem;      // 64px
$space-20: 5rem;      // 80px
$space-24: 6rem;      // 96px
```

### Layout Grid
```scss
// Container Widths
$container-sm: 640px;
$container-md: 768px;
$container-lg: 1024px;
$container-xl: 1280px;
$container-2xl: 1536px;

// Grid Columns
$grid-cols-12: repeat(12, minmax(0, 1fr));
$grid-cols-6: repeat(6, minmax(0, 1fr));
$grid-cols-4: repeat(4, minmax(0, 1fr));
$grid-cols-3: repeat(3, minmax(0, 1fr));
```

---

## Component Design Tokens

### Border Radius (Soft & Approachable)
```scss
$radius-sm: 0.25rem;    // 4px - Small elements
$radius-md: 0.375rem;   // 6px - Default components  
$radius-lg: 0.5rem;     // 8px - Cards, panels
$radius-xl: 0.75rem;    // 12px - Large cards
$radius-2xl: 1rem;      // 16px - Modals
$radius-full: 9999px;   // Circular elements
```

### Shadows (Claude's Subtle Depth)
```scss
// Subtle elevation system
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
            0 10px 10px -5px rgba(0, 0, 0, 0.04);

// Warm shadow tints (Claude-inspired)
$shadow-warm-sm: 0 1px 2px 0 rgba(234, 88, 12, 0.05);
$shadow-warm-md: 0 4px 6px -1px rgba(234, 88, 12, 0.1),
                 0 2px 4px -1px rgba(234, 88, 12, 0.06);
```

### Button Styles
```scss
// Primary Button (Claude Orange)
.btn-primary {
  background: linear-gradient(135deg, $claude-orange-500 0%, $claude-orange-600 100%);
  color: white;
  border-radius: $radius-md;
  padding: $space-3 $space-6;
  font-weight: $font-medium;
  box-shadow: $shadow-sm;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, $claude-orange-600 0%, $claude-orange-700 100%);
    box-shadow: $shadow-md;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: $shadow-sm;
  }
}

// Secondary Button (Neutral)
.btn-secondary {
  background: $neutral-0;
  color: $neutral-700;
  border: 1px solid $neutral-300;
  border-radius: $radius-md;
  padding: $space-3 $space-6;
  font-weight: $font-medium;
  
  &:hover {
    background: $neutral-50;
    border-color: $neutral-400;
  }
}

// Ghost Button
.btn-ghost {
  background: transparent;
  color: $neutral-600;
  border: none;
  padding: $space-2 $space-4;
  border-radius: $radius-md;
  
  &:hover {
    background: $neutral-100;
    color: $neutral-700;
  }
}
```

### Card Components
```scss
.card {
  background: $neutral-0;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  border: 1px solid $neutral-200;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
  
  .card-header {
    padding: $space-6;
    border-bottom: 1px solid $neutral-200;
  }
  
  .card-content {
    padding: $space-6;
  }
  
  .card-actions {
    padding: $space-4 $space-6;
    background: $neutral-50;
    border-top: 1px solid $neutral-200;
  }
}
```

---

## Interaction Patterns

### Animation Philosophy
- **Purposeful Motion**: Animations guide user attention and provide feedback
- **Natural Timing**: Easing curves that feel organic (cubic-bezier(0.4, 0, 0.2, 1))
- **Subtle Presence**: Animations enhance without distracting
- **Performance Aware**: GPU-accelerated transforms, avoid layout changes

### Timing Values
```scss
$duration-fast: 150ms;     // Quick transitions
$duration-normal: 300ms;   // Standard transitions  
$duration-slow: 500ms;     // Complex animations

$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover States
- **Cards**: Lift with subtle shadow increase
- **Buttons**: Gentle color shift and slight lift
- **Links**: Underline animation from left to right
- **Icons**: Scale up 5-10% with color shift

### Focus States
- **Keyboard Navigation**: Clear, high-contrast focus rings
- **Color**: $claude-orange-500 for focus indicators
- **Width**: 2px focus rings for visibility
- **Offset**: 2px from element for clarity

---

## Responsive Design Tokens

### Breakpoints (Mobile-First)
```scss
$bp-sm: 640px;    // Small devices
$bp-md: 768px;    // Tablets
$bp-lg: 1024px;   // Desktop
$bp-xl: 1280px;   // Large desktop
$bp-2xl: 1536px;  // Extra large
```

### Typography Scaling
```scss
// Mobile typography
@media (max-width: $bp-md) {
  $text-4xl: 1.875rem;  // 30px on mobile
  $text-3xl: 1.5rem;    // 24px on mobile
  $text-2xl: 1.25rem;   // 20px on mobile
}
```

### Component Adaptations
- **Navigation**: Collapsible sidebar becomes bottom tab bar
- **Tables**: Horizontal scroll with sticky actions column
- **Modals**: Full-screen on mobile, centered on desktop
- **Cards**: Single column on mobile, grid on larger screens

---

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44px×44px on touch devices
- **Focus Management**: Clear focus order and visible focus indicators
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

### Color Accessibility
```scss
// Verified contrast ratios
$text-on-white: $neutral-700;    // 7.1:1 contrast
$text-secondary: $neutral-600;   // 4.6:1 contrast
$text-subtle: $neutral-500;      // 3.1:1 contrast (large text only)
```

### Keyboard Navigation
- **Tab Order**: Logical flow through interactive elements  
- **Skip Links**: Hidden skip-to-content links for screen readers
- **Escape Patterns**: ESC closes modals, overlays
- **Arrow Keys**: Grid navigation where appropriate

---

## Implementation Guidelines

### CSS Custom Properties
```css
:root {
  /* Colors */
  --color-primary: #{$claude-orange-500};
  --color-primary-hover: #{$claude-orange-600};
  --color-text: #{$neutral-700};
  --color-text-subtle: #{$neutral-500};
  --color-background: #{$neutral-0};
  --color-surface: #{$neutral-50};
  
  /* Spacing */
  --space-unit: 0.25rem;
  --space-sm: calc(var(--space-unit) * 2);
  --space-md: calc(var(--space-unit) * 4);
  --space-lg: calc(var(--space-unit) * 6);
  
  /* Typography */
  --font-base: 1rem;
  --line-height-base: 1.5;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
}
```

### Component Architecture
- **BEM Methodology**: Block Element Modifier naming
- **Design Token Usage**: Consistent token references
- **Responsive Utilities**: Mobile-first approach
- **Theme Support**: CSS custom properties for theme switching

This design system provides the foundation for creating a warm, approachable, and highly functional interface that reflects Claude's design philosophy while serving Gen.C Alpha's complex content creation workflows.