# Gen.C Alpha - Claude-Inspired Design System

## Design Philosophy

The Gen.C Alpha design system draws inspiration from Claude's clean, conversational interface while maintaining the robust functionality required for content creation workflows. Our approach emphasizes:

**Core Principles:**
- **Conversational Clarity**: Every interface element should feel approachable and human-centered
- **Purposeful Minimalism**: Remove visual noise while maintaining functional richness
- **Warm Professionalism**: Balance business utility with creative warmth
- **Intelligent Hierarchy**: Guide users naturally through complex workflows
- **Accessibility First**: Design for all users from the ground up

---

## Color Palette

### Primary Colors
```css
/* Claude-inspired warm neutrals */
--color-primary-50: #fef7f0;    /* Warm white for backgrounds */
--color-primary-100: #fceee1;   /* Light warm gray */
--color-primary-200: #f7dcc7;   /* Subtle warm tint */
--color-primary-300: #f0c4a0;   /* Light accent */
--color-primary-400: #e6a576;   /* Medium warm accent */
--color-primary-500: #d4814a;   /* Primary brand color */
--color-primary-600: #b86430;   /* Dark primary */
--color-primary-700: #9a4d1f;   /* Darker primary */
--color-primary-800: #7d3b14;   /* Deep primary */
--color-primary-900: #632d0c;   /* Deepest primary */

/* Neutral Grays */
--color-neutral-0: #ffffff;     /* Pure white */
--color-neutral-50: #fafbfc;    /* Off white */
--color-neutral-100: #f4f5f7;   /* Light gray background */
--color-neutral-200: #e4e6ea;   /* Subtle border */
--color-neutral-300: #c1c7d0;   /* Light text/borders */
--color-neutral-400: #97a0af;   /* Placeholder text */
--color-neutral-500: #6b778c;   /* Body text */
--color-neutral-600: #505f79;   /* Dark text */
--color-neutral-700: #42526e;   /* Headings */
--color-neutral-800: #253858;   /* Dark headings */
--color-neutral-900: #172b4d;   /* Darkest text */
```

### Semantic Colors
```css
/* Success */
--color-success-50: #e3fcef;
--color-success-100: #abf5d1;
--color-success-400: #00875a;
--color-success-500: #006644;

/* Warning */
--color-warning-50: #fffae6;
--color-warning-100: #fff0b3;
--color-warning-400: #ff8b00;
--color-warning-500: #ff7400;

/* Error */
--color-error-50: #ffebe6;
--color-error-100: #ffbdad;
--color-error-400: #de350b;
--color-error-500: #bf2600;

/* Information */
--color-info-50: #deebff;
--color-info-100: #b3d4ff;
--color-info-400: #0065ff;
--color-info-500: #0052cc;
```

### AI/Creative Accents
```css
/* Special purpose colors for AI and creative features */
--color-ai-gradient-start: #667eea;
--color-ai-gradient-end: #764ba2;
--color-creative-purple: #8b5cf6;
--color-creative-blue: #06b6d4;
--color-creative-green: #10b981;
--color-creative-pink: #f472b6;
```

---

## Typography

### Font Family
```css
/* Primary: System UI fonts for optimal performance and readability */
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace: For code, API keys, and technical content */
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
```

### Type Scale
```css
/* Headings */
--font-size-h1: 2.5rem;      /* 40px - Page titles */
--font-size-h2: 2rem;        /* 32px - Section headers */
--font-size-h3: 1.5rem;      /* 24px - Subsection headers */
--font-size-h4: 1.25rem;     /* 20px - Component headers */
--font-size-h5: 1.125rem;    /* 18px - Small headers */
--font-size-h6: 1rem;        /* 16px - Minor headers */

/* Body Text */
--font-size-body-large: 1.125rem;  /* 18px - Large body text */
--font-size-body: 1rem;            /* 16px - Standard body */
--font-size-body-small: 0.875rem;  /* 14px - Small body */
--font-size-caption: 0.75rem;      /* 12px - Captions, labels */

/* Line Heights */
--line-height-tight: 1.2;    /* Headlines */
--line-height-normal: 1.5;   /* Body text */
--line-height-relaxed: 1.6;  /* Long-form content */

/* Font Weights */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

---

## Spacing System

### Base Unit: 8px
```css
--space-1: 0.25rem;   /* 4px  - Fine adjustments */
--space-2: 0.5rem;    /* 8px  - Base unit */
--space-3: 0.75rem;   /* 12px - Small spacing */
--space-4: 1rem;      /* 16px - Standard spacing */
--space-5: 1.25rem;   /* 20px - Medium spacing */
--space-6: 1.5rem;    /* 24px - Large spacing */
--space-8: 2rem;      /* 32px - Section spacing */
--space-10: 2.5rem;   /* 40px - Large sections */
--space-12: 3rem;     /* 48px - Page sections */
--space-16: 4rem;     /* 64px - Major sections */
--space-20: 5rem;     /* 80px - Page-level spacing */
```

### Layout Spacing
```css
--layout-gutter: 1.5rem;     /* 24px - Content margins */
--layout-container-max: 1200px; /* Max content width */
--sidebar-width: 280px;       /* Standard sidebar */
--sidebar-collapsed: 64px;    /* Collapsed sidebar */
```

---

## Elevation & Shadows

### Shadow System
```css
/* Subtle shadows for Claude-like depth */
--shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-card: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-elevated: 0 10px 15px rgba(0, 0, 0, 0.08);
--shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Colored shadows for special elements */
--shadow-primary: 0 4px 6px rgba(212, 129, 74, 0.2);
--shadow-ai: 0 4px 20px rgba(102, 126, 234, 0.3);
```

### Border Radius
```css
--radius-small: 0.25rem;   /* 4px  - Small elements */
--radius-medium: 0.5rem;   /* 8px  - Cards, buttons */
--radius-large: 0.75rem;   /* 12px - Panels */
--radius-xlarge: 1rem;     /* 16px - Modals */
--radius-full: 9999px;     /* Full - Pills, avatars */
```

---

## Component Tokens

### Buttons
```css
/* Primary Button */
--button-primary-bg: var(--color-primary-500);
--button-primary-bg-hover: var(--color-primary-600);
--button-primary-text: white;
--button-primary-shadow: var(--shadow-primary);

/* Secondary Button */
--button-secondary-bg: var(--color-neutral-100);
--button-secondary-bg-hover: var(--color-neutral-200);
--button-secondary-text: var(--color-neutral-700);
--button-secondary-border: var(--color-neutral-300);

/* AI Button (Special) */
--button-ai-bg: linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end));
--button-ai-text: white;
--button-ai-shadow: var(--shadow-ai);
```

### Cards
```css
--card-bg: var(--color-neutral-0);
--card-border: var(--color-neutral-200);
--card-shadow: var(--shadow-card);
--card-radius: var(--radius-medium);
--card-padding: var(--space-6);

/* Elevated Card */
--card-elevated-shadow: var(--shadow-elevated);
--card-elevated-hover: var(--shadow-modal);
```

### Forms
```css
--input-bg: var(--color-neutral-0);
--input-border: var(--color-neutral-300);
--input-border-focus: var(--color-primary-500);
--input-text: var(--color-neutral-800);
--input-placeholder: var(--color-neutral-400);
--input-radius: var(--radius-medium);
--input-padding: var(--space-3) var(--space-4);

/* Error State */
--input-error-border: var(--color-error-400);
--input-error-bg: var(--color-error-50);
```

---

## Animation & Transitions

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration
```css
--duration-fast: 150ms;      /* Quick interactions */
--duration-normal: 250ms;    /* Standard transitions */
--duration-slow: 350ms;      /* Complex animations */
--duration-slower: 500ms;    /* Page transitions */
```

### Common Transitions
```css
--transition-all: all var(--duration-normal) var(--ease-in-out);
--transition-colors: color var(--duration-fast) var(--ease-in-out), 
                     background-color var(--duration-fast) var(--ease-in-out);
--transition-transform: transform var(--duration-normal) var(--ease-out);
```

---

## Grid System

### Breakpoints
```css
--breakpoint-sm: 640px;    /* Small tablets */
--breakpoint-md: 768px;    /* Tablets */
--breakpoint-lg: 1024px;   /* Small desktops */
--breakpoint-xl: 1280px;   /* Large desktops */
--breakpoint-2xl: 1536px;  /* Extra large screens */
```

### Grid Layout
```css
.grid-container {
  display: grid;
  gap: var(--space-6);
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 0 var(--layout-gutter);
}

.grid-2-col { grid-template-columns: repeat(2, 1fr); }
.grid-3-col { grid-template-columns: repeat(3, 1fr); }
.grid-4-col { grid-template-columns: repeat(4, 1fr); }

/* Responsive behavior */
@media (max-width: 768px) {
  .grid-2-col, .grid-3-col, .grid-4-col {
    grid-template-columns: 1fr;
  }
}
```

---

## Accessibility Guidelines

### Color Contrast
- **Text on background**: Minimum 4.5:1 ratio (WCAG AA)
- **Large text (18px+)**: Minimum 3:1 ratio
- **Interactive elements**: Minimum 4.5:1 ratio
- **Disabled states**: 3:1 ratio for recognition

### Focus States
```css
--focus-ring: 0 0 0 3px var(--color-primary-200);
--focus-ring-error: 0 0 0 3px var(--color-error-100);
--focus-ring-info: 0 0 0 3px var(--color-info-100);
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Component Patterns

### Consistent Patterns
1. **Headers**: Always include clear hierarchy with actions on the right
2. **Cards**: Consistent padding, hover states, and action placement
3. **Forms**: Proper labeling, validation states, and help text
4. **Tables**: Sortable headers, pagination, and bulk actions
5. **Modals**: Consistent positioning, backdrop, and escape patterns

### State Management
- **Loading**: Skeleton states and progress indicators
- **Empty**: Helpful empty states with clear actions
- **Error**: Clear error messages with recovery actions
- **Success**: Confirmation feedback for user actions

This design system provides the foundation for creating a cohesive, user-friendly interface that maintains Claude's approachable aesthetic while serving the complex needs of content creators.