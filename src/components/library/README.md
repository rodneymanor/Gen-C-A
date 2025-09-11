# Gen.C Alpha Component Library

A comprehensive component library extracted from the existing well-structured codebase, featuring Claude-inspired design tokens, mobile-first responsive design, and excellent accessibility support.

## 🎯 Key Features

- **Touch-Friendly Design**: All interactive elements meet WCAG 2.1 AA compliance with 44px+ touch targets
- **Comprehensive Design Tokens**: Extracted from existing `tokens.css` with semantic color aliases
- **Responsive Typography**: Fluid scaling using `clamp()` for optimal readability across devices
- **Dark Mode Support**: Built-in dark mode with optimized color schemes
- **Accessibility-First**: Proper focus management, screen reader support, and ARIA compliance
- **Motion & Animation**: Smooth animations with `prefers-reduced-motion` support
- **Container Queries**: Modern responsive design using container-based layouts

## 📁 Library Structure

```
src/components/library/
├── primitives/          # Basic building blocks
│   ├── Button/          # Primary, secondary, AI-powered variants
│   ├── Input/           # Form inputs with validation states
│   ├── Card/            # Content cards with hover effects
│   ├── Badge/           # Status indicators and labels
│   └── Avatar/          # User avatars with status indicators
├── patterns/            # Composite components
│   ├── Navigation/      # Responsive navigation patterns
│   └── Form/            # Form field wrappers and validation
├── tokens/              # Design system tokens
│   ├── colors.ts        # Color palette and semantic aliases
│   ├── spacing.ts       # Spacing scale and layout tokens
│   ├── typography.ts    # Font sizes, weights, and line heights
│   └── effects.ts       # Shadows, animations, and focus styles
└── utils/               # Utility functions and helpers
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { Button, Card, Input, Badge, Avatar } from '@/components/library';

// Touch-friendly button with loading state
<Button variant="primary" size="large" isLoading={isSubmitting}>
  Submit Form
</Button>

// Responsive card with hover effects
<Card appearance="elevated" isHoverable spacing="comfortable">
  <CardHeader>
    <h3>Content Title</h3>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</Card>

// Input with validation and character count
<Input
  label="Email Address"
  variant="warm"
  errorMessage={errors.email}
  showCharacterCount
  maxLength={100}
  isRequired
/>
```

### Using Design Tokens

```tsx
import { colors, spacing, typography, effects } from '@/components/library/tokens';

const customStyles = css`
  background: ${colors.primary[500]};
  padding: ${spacing.space[4]};
  font-size: ${typography.fontSize.h3};
  border-radius: ${effects.radius.medium};
  box-shadow: ${effects.shadow.elevated};
`;
```

## 🎨 Design Tokens

### Color System

The library uses a Claude-inspired color palette with comprehensive semantic aliases:

- **Primary Colors**: Warm orange/brown tones (50-900 scale)
- **Neutral Grays**: High-contrast grays for text and surfaces
- **Semantic Colors**: Success, warning, error, and info states
- **Creative Accents**: AI-powered gradient colors for special elements

### Spacing System

Based on an 8px grid system with responsive scaling:

- **Base Units**: 4px increments (space-1 through space-32)
- **Responsive Spacing**: Fluid scaling using `clamp()`
- **Touch Targets**: Minimum 44px for accessibility compliance
- **Semantic Spacing**: Component-specific spacing tokens

### Typography

Responsive typography with fluid scaling:

- **Responsive Fonts**: Using `clamp()` for optimal scaling
- **Font Weights**: Light (300) through Bold (700)
- **Line Heights**: Tight, normal, and relaxed options
- **Component Typography**: Pre-configured scales for each component

## 🔧 Component Variants

### Button Component

```tsx
// Variant options
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ai-powered">AI-Powered Feature</Button>
<Button variant="creative">Creative Tools</Button>
<Button variant="subtle">Subtle Action</Button>

// Size options (all touch-friendly)
<Button size="small">Small (32px min-height)</Button>
<Button size="medium">Medium (40px min-height)</Button>
<Button size="large">Large (48px min-height)</Button>

// With icons and loading states
<Button 
  iconBefore="🚀" 
  iconAfter="→" 
  isLoading={loading}
  fullWidth
>
  Get Started
</Button>
```

### Card Component

```tsx
// Appearance variants
<Card appearance="subtle">Subtle card</Card>
<Card appearance="raised">Standard elevation</Card>
<Card appearance="elevated">High elevation</Card>
<Card appearance="selected">Selected state</Card>

// Interactive cards
<Card isHoverable isClickable onClick={handleClick}>
  Interactive card with hover effects
</Card>

// Spacing options
<Card spacing="compact">Tight spacing</Card>
<Card spacing="default">Standard spacing</Card>
<Card spacing="comfortable">Generous spacing</Card>
```

### Input Component

```tsx
// Variant styles
<Input variant="default" placeholder="Standard input" />
<Input variant="warm" placeholder="Warm-themed input" />
<Input variant="creative" placeholder="Creative-themed input" />

// With validation and helpers
<Input
  label="Username"
  helperText="Choose a unique username"
  errorMessage={errors.username}
  isRequired
  showCharacterCount
  maxLength={50}
/>

// With icons
<Input
  iconBefore="👤"
  iconAfter="✓"
  placeholder="Search users..."
/>
```

## 🎯 Accessibility Features

### Touch Targets
All interactive elements meet WCAG 2.1 AA requirements:
- Minimum 44px touch target size
- Adequate spacing between interactive elements
- Touch-friendly hover states

### Focus Management
- Visible focus indicators using CSS `:focus-visible`
- High-contrast focus rings
- Proper tab order and keyboard navigation

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA labels and descriptions
- Role attributes for custom components
- Live regions for dynamic content

### Motion & Animation
- Respects `prefers-reduced-motion` settings
- Smooth transitions with accessible timing
- Optional animation controls

## 🌙 Dark Mode Support

The library includes comprehensive dark mode support:

```css
/* Automatic dark mode based on system preference */
@media (prefers-color-scheme: dark) {
  /* Dark theme variables applied automatically */
}
```

Dark mode features:
- Optimized color contrast ratios
- Reduced shadow intensity
- Adjusted surface colors
- Maintains brand identity

## 📱 Responsive Design

### Mobile-First Approach
- Components designed for mobile first
- Progressive enhancement for larger screens
- Touch-optimized interaction patterns

### Container Queries
Modern responsive design using container queries:

```tsx
import { containerQuery } from '@/components/library/utils';

const responsiveStyles = css`
  ${containerQuery('md', `
    grid-template-columns: repeat(2, 1fr);
  `)}
  
  ${containerQuery('lg', `
    grid-template-columns: repeat(3, 1fr);
  `)}
`;
```

## 🔄 Migration from Existing Components

The library components are designed to be drop-in replacements for existing components:

```tsx
// Before (existing component)
import { Button } from '@/components/ui/Button';

// After (library component)
import { Button } from '@/components/library';
```

All existing props and behaviors are preserved, with additional features and improved consistency.

## 🧪 Testing & Quality

### Component Testing
- Comprehensive prop validation
- Accessibility testing with screen readers
- Touch target size validation
- Responsive behavior testing

### Performance
- Optimized bundle size with tree-shaking
- Lazy loading for pattern components
- Efficient CSS-in-JS with Emotion

## 📖 Storybook Documentation

Each component includes comprehensive Storybook documentation:

- All variant combinations
- Interactive prop controls
- Accessibility testing results
- Responsive behavior demos
- Code examples and best practices

## 🚀 Future Enhancements

Planned additions to the library:

1. **Additional Primitives**
   - Select/Dropdown components
   - Checkbox and Radio components
   - Progress indicators
   - Loading spinners

2. **Advanced Patterns**
   - Data table components
   - Modal and dialog patterns
   - Notification systems
   - Complex form patterns

3. **Enhanced Features**
   - Animation presets
   - Theme customization API
   - Component composition utilities
   - Advanced accessibility features

## 📄 License

This component library is part of the Gen.C Alpha project and follows the same licensing terms.

---

**Built with ❤️ using the excellent foundation of the existing Gen.C Alpha codebase**