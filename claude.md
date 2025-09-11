# Gen.C Alpha Design System Guidelines

> **IMPORTANT:** After making any significant changes, always run `git add -A && git commit -m "feat: [description]"` to commit your changes. This helps maintain project history and enables rollback if needed.

## Core Design Philosophy

You are working with a sophisticated React + TypeScript application that follows Claude-inspired design principles combined with Atlassian Design System tokens. The codebase emphasizes clean, accessible, and progressive enhancement patterns.

## Architecture Overview

**Tech Stack:**
- React 18 + TypeScript + Vite
- Emotion CSS-in-JS with design tokens
- Atlaskit components (selective integration)  
- Framer Motion for animations
- Comprehensive testing (Vitest + Testing Library)

**Key Directories:**
- `src/styles/tokens.css` - Comprehensive design token system (750+ lines)
- `src/components/ui/` - Core UI components
- `src/components/library/` - Organized component library with primitives
- `src/components/enhanced/` - Advanced component variations
- `src/components/progressive/` - Progressive enhancement patterns
- `src/pages/` - All page components

## Routing System

**Location:** `src/App.tsx` contains the main router configuration
**Navigation:** `src/components/layout/Navigation.tsx` contains the sidebar navigation

### Adding New Pages

1. **Create Page Component** in `src/pages/YourPageName.tsx`:
```tsx
import React from 'react';

export const YourPageName = () => {
  return (
    <div>
      <h1>Your Page Name</h1>
      {/* Page content */}
    </div>
  );
};
```

2. **Add Route** in `src/App.tsx`:
```tsx
import { YourPageName } from './pages/YourPageName';

// Add to the Routes section:
<Route path="/your-page" element={<YourPageName />} />
```

3. **Add Navigation Item** in `src/components/layout/Navigation.tsx`:
```tsx
// Import an appropriate Atlassian icon
import YourIcon from '@atlaskit/icon/glyph/your-icon';

// Add to navigationData array in appropriate section:
{
  section: 'Content', // or 'Brand', 'Tools'
  items: [
    // existing items...
    { 
      path: '/your-page', 
      label: 'Your Page', 
      icon: <YourIcon label="Your Page" />, 
      badge: '' // optional badge count
    },
  ]
}
```

### Existing Routes Structure:
```
/dashboard          - Main dashboard (default route)
/collections        - Collections page (badge: '12')
/library           - Library page (badge: '247') 
/videos            - Videos page
/channels          - Channels page
/write             - Write/create content page
/brand-hub         - Brand hub (badge: '5', placeholder)
/extensions        - Extensions page (placeholder)
/mobile            - Mobile shortcuts (placeholder)
/settings          - Settings page (in footer)
/enhanced          - Enhanced features demo page
```

**Navigation Sections:**
- **Content:** Dashboard, Collections, Library, Write
- **Brand:** Brand Hub
- **Tools:** Extensions, Mobile Shortcuts
- **Footer:** Settings (always visible)

## Design Token System

### Color Palette (PRESERVE EXISTING)
```css
/* Claude-inspired primary colors - DO NOT CHANGE */
--color-primary-500: #d4814a;  /* Claude orange - brand color */
--color-primary-600: #b86430;  /* Hover state */

/* Comprehensive neutral scale (0-900) */
--color-neutral-0: #ffffff;    /* Pure white */
--color-neutral-800: #172b4d;  /* Primary text */
--color-neutral-900: #091e42;  /* Darkest text */

/* Semantic colors */
--color-success-400: #00875a;  /* Success actions */
--color-warning-400: #ff8b00;  /* Warning states */
--color-error-400: #de350b;    /* Error states */
--color-info-400: #0065ff;     /* Info states */

/* AI/Creative accents */
--color-ai-gradient-start: #667eea;
--color-creative-purple: #8b5cf6;
```

### Spacing System (8px Base)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-4: 1rem;     /* 16px - base unit */
--space-8: 2rem;     /* 32px - section spacing */
```

### Typography Scale
```css
/* Responsive typography with clamp() */
--font-size-body: clamp(0.875rem, 1.5vw, 1rem);     /* 14-16px */
--font-size-h1: clamp(1.75rem, 4vw, 2.5rem);        /* 28-40px */
--font-family-primary: -apple-system, BlinkMacSystemFont, ...;
```

## Component Development Standards

### 1. Use Existing Design Tokens
```tsx
// ✅ CORRECT - Use design tokens
const buttonStyles = css`
  background: var(--button-primary-bg);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-medium);
  font-size: var(--font-size-body);
`;

// ❌ AVOID - Hard-coded values
const buttonStyles = css`
  background: #d4814a;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
`;
```

### 2. Follow Component Architecture Patterns
```tsx
// ✅ CORRECT - Follow existing patterns
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ai-powered' | 'creative';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'primary',
  size = 'medium',
  ...props 
}, ref) => {
  // Implementation using emotion css`` and design tokens
});
```

### 3. Accessibility Requirements
- **Touch Targets:** Minimum 44px (use `var(--touch-target-min)`)
- **Focus Management:** Use `var(--focus-ring)` tokens
- **ARIA Labels:** Include proper `aria-*` attributes
- **Semantic HTML:** Use appropriate HTML elements (button, nav, main, etc.)
- **Color Contrast:** All text meets WCAG AA standards (4.5:1 ratio)

### 4. Responsive Design
```css
/* ✅ Use fluid spacing and typography */
.component {
  padding: var(--space-responsive-md);  /* clamp(1rem, 3vw, 1.5rem) */
  font-size: var(--font-size-body);     /* clamp(0.875rem, 1.5vw, 1rem) */
}

/* ✅ Mobile-first breakpoints */
@media (max-width: 480px) {
  .component {
    --touch-target-min: 48px;  /* Enhanced for small screens */
  }
}
```

## Atlassian Integration Strategy

**Selective Integration Approach:**
- Keep existing custom components that work well
- Enhance with Atlassian where it adds significant value
- Use Atlassian for complex components (data tables, advanced modals)

```tsx
// ✅ Strategic Atlassian usage
import { DynamicTable } from '@atlaskit/dynamic-table';  // For complex data
import { ModalDialog } from '@atlaskit/modal-dialog';    // For advanced modals

// Keep your custom Button, Card, Input components - they're excellent
import { Button } from '../ui/Button';  // Existing component
```

## Component Library Structure

```
src/components/
├── ui/                    # Core UI components (Button, Card, Input)
├── library/               # Organized component library
│   ├── primitives/        # Basic building blocks
│   ├── patterns/          # Common UI patterns  
│   └── tokens/            # TypeScript token exports
├── enhanced/              # Advanced variations
└── progressive/           # Progressive enhancement features
```

## Development Guidelines

### 1. Token Usage Priority
1. **Use semantic tokens:** `var(--color-text-primary)` over `var(--color-neutral-800)`
2. **Use component tokens:** `var(--button-primary-bg)` over `var(--color-primary-500)`
3. **Use responsive tokens:** `var(--space-responsive-md)` for fluid spacing

### 2. Animation & Motion
```tsx
// ✅ Use existing motion patterns
import { motion } from 'framer-motion';

const buttonMotion = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 }
};
```

### 3. Testing Requirements
- Unit tests for all components (`src/__tests__/`)
- Accessibility tests using `@testing-library/jest-dom`
- Responsive behavior tests
- TypeScript type safety

### 4. Performance Considerations
- Use CSS custom properties for runtime theme switching
- Lazy load non-critical animations
- Optimize bundle size with selective Atlassian imports

## Common Patterns to Follow

### Error Handling
```tsx
// ✅ Consistent error styling
const errorStyles = css`
  color: var(--color-text-error);
  border-color: var(--color-border-error);
  background: var(--color-error-50);
`;
```

### Loading States
```tsx
// ✅ Use existing loading patterns
{isLoading && (
  <div css={loadingSpinnerStyles}>
    <div className="spinner" />
  </div>
)}
```

### Focus Management
```tsx
// ✅ Consistent focus styles
const focusStyles = css`
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;
```

## What NOT to Do

❌ **Don't modify existing color values** - The Claude-inspired palette is carefully chosen
❌ **Don't create new design tokens** without checking existing ones first  
❌ **Don't use hard-coded CSS values** - Always use tokens
❌ **Don't break existing component APIs** - Maintain backwards compatibility
❌ **Don't ignore accessibility** - All components must be keyboard/screen reader accessible
❌ **Don't add unnecessary dependencies** - Prefer existing solutions

## Quality Checklist

Before adding new components or features:

- [ ] Uses existing design tokens consistently
- [ ] Follows established component architecture patterns
- [ ] Includes proper TypeScript interfaces
- [ ] Has accessibility features (ARIA, focus management, semantic HTML)
- [ ] Responsive design with appropriate touch targets
- [ ] Unit tests with accessibility assertions
- [ ] Error handling and loading states
- [ ] Performance optimized (no unnecessary re-renders)
- [ ] Consistent with existing motion/animation patterns
- [ ] Documentation for complex components
- [ ] Routes added to App.tsx and Navigation.tsx if creating new pages
- [ ] Changes committed to git with descriptive message

This system ensures consistency, accessibility, and maintainability while preserving the excellent foundation already established.