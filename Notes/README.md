# Gen.C Alpha Dashboard

A modern, accessible React dashboard for AI-powered content creation, built with TypeScript and designed with Claude's conversational aesthetic.

![Gen.C Alpha Dashboard](https://img.shields.io/badge/status-development-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-4.4.5-green)

## Overview

Gen.C Alpha is a comprehensive content creation platform that empowers creators with AI-powered tools for script generation, content organization, and workflow management. The dashboard features a warm, approachable design inspired by Claude's conversational interface while maintaining the robust functionality required for professional content creation.

## Features

### 🏠 **Dashboard**
- Personalized welcome section with activity summaries
- Quick action buttons for common tasks
- Recent activity feed with visual indicators
- Responsive design for all screen sizes

### 📁 **Collections Management**
- Visual collection cards with preview thumbnails
- Drag-and-drop video organization
- Platform-specific filtering and sorting
- Bulk actions for efficient management
- Favorites system for quick access

### ✍️ **AI Script Generation**
- Trending content ideas and inspiration
- Intelligent prompt assistance
- Brand voice and persona integration
- Real-time script editing with AI insights
- Platform optimization (TikTok, Instagram, YouTube)
- Voice input support

### 📚 **Content Library**
- Unified view of all content types (videos, scripts, images, notes, ideas)
- Advanced search and filtering
- Preview panel with detailed metadata
- Bulk operations and content management
- Export and sharing capabilities

### 🎨 **Design System**
- Claude-inspired warm color palette
- Comprehensive design tokens
- Accessible color contrasts (WCAG AA compliant)
- Consistent spacing and typography
- Motion-safe animations

## Technology Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Emotion (CSS-in-JS)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Unicode emojis and custom icons
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Core UI components (Button, Card, Input, etc.)
│   ├── layout/          # Layout components (Navigation, Layout)
│   ├── collections/     # Collection-specific components
│   └── script/          # Script generation components
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Collections.tsx  # Collections management
│   ├── Write.tsx        # AI script generation
│   └── Library.tsx      # Content library
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # Global styles and design tokens
    ├── tokens.css       # Design system tokens
    └── globals.css      # Global styles and utilities
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gen-c-alpha-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Design System

### Color Palette

The design system uses a warm, Claude-inspired color palette:

- **Primary**: Warm oranges and browns (#d4814a to #632d0c)
- **Neutrals**: Soft grays (#ffffff to #172b4d)
- **Semantic**: Success, warning, error, and info colors
- **AI/Creative**: Purple and blue gradients for AI features

### Typography

- **Primary Font**: System UI fonts for optimal performance
- **Monospace**: For code and technical content
- **Scale**: Modular scale from 12px to 40px
- **Weights**: Light (300) to Bold (700)

### Spacing

- **Base Unit**: 8px
- **Scale**: 0.25rem to 5rem (4px to 80px)
- **Layout**: Max width 1200px with responsive gutters

### Accessibility Features

- **WCAG 2.1 AA Compliant**: All color contrasts meet accessibility standards
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Comprehensive ARIA labels and live regions
- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Support for high contrast mode

## Component Library

### Core Components

#### Button
- **Variants**: Primary, Secondary, AI-powered, Creative, Subtle, Warning, Danger
- **Sizes**: Small, Medium, Large
- **Features**: Loading states, icons, full width option

#### Card
- **Appearances**: Subtle, Raised, Elevated, Selected
- **Spacing**: Compact, Default, Comfortable
- **Features**: Hover states, clickable, accessibility support

#### Input & TextArea
- **Variants**: Default, Warm, Creative
- **Features**: Character counting, AI suggestions, error states
- **Accessibility**: Proper labeling and validation

### Specialized Components

#### CollectionCard
- Platform badges, preview thumbnails, favorite system
- Hover effects and interactive states
- Bulk selection support

#### VideoGrid
- Responsive grid layout
- Thumbnail overlays with play buttons
- Platform indicators and duration badges

#### ScriptGenerator
- AI model selection and configuration
- Brand voice integration
- Real-time suggestions

## Accessibility Standards

### Keyboard Navigation
- **Tab Order**: Logical and predictable
- **Focus Management**: Proper focus trapping in modals
- **Shortcuts**: Global keyboard shortcuts for common actions

### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Dynamic content announcements
- **Semantic HTML**: Proper heading structure and landmarks

### Visual Accessibility
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Indicators**: Visible focus rings with 3px outline
- **Text Scaling**: Support for browser text zoom up to 200%

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

### Mobile Features
- Collapsible navigation with overlay
- Touch-friendly 44px minimum target sizes
- Responsive grid layouts
- Optimized typography scaling

## Performance Optimizations

- **Code Splitting**: Route-based code splitting
- **Image Optimization**: Responsive images with proper loading
- **Bundle Size**: Optimized imports and tree shaking
- **Caching**: Service worker ready for PWA implementation

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### File Naming
- **Components**: PascalCase (e.g., `Button.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useResponsive.ts`)
- **Utils**: camelCase (e.g., `format.ts`)
- **Types**: camelCase interfaces (e.g., `ContentItem`)

### Git Workflow
- **Commits**: Conventional commit format
- **Branches**: Feature branches with descriptive names
- **PRs**: Comprehensive descriptions and testing notes

## Future Enhancements

### Planned Features
- [ ] Real AI integration with OpenAI/Claude APIs
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Mobile app companion
- [ ] Browser extension
- [ ] Advanced video editing tools
- [ ] Social media scheduling
- [ ] Performance analytics integration

### Technical Improvements
- [ ] PWA implementation
- [ ] Offline support
- [ ] Advanced caching strategies
- [ ] Real-time collaboration
- [ ] WebRTC video processing
- [ ] Advanced search with ElasticSearch
- [ ] Microservices architecture migration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Ensure you have the latest Node.js LTS version
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env.local` and configure variables
4. Run `npm run dev` to start the development server
5. Run `npm run type-check` to validate TypeScript
6. Run `npm run lint` to check code quality

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Claude AI** - Design inspiration and conversational UI patterns
- **Atlassian Design System** - Component architecture reference
- **React Community** - Best practices and patterns
- **Accessibility Community** - WCAG guidelines and testing methodologies

## Support

For questions, issues, or feature requests, please:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Search existing discussions
3. Create a new issue with detailed information
4. Include screenshots for visual issues
5. Provide reproduction steps for bugs

---

**Built with ❤️ by the Gen.C Alpha team**