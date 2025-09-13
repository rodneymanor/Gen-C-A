# Gen C Alpha - File Structure Memory Bank

*Last Updated: 2025-09-12*
*Maintained by: Claude Code Assistant*

## Current File Structure Diagram

```
Gen C Alpha - React TypeScript Application
├── Configuration & Build
│   ├── package.json              # Dependencies & scripts
│   ├── package-lock.json         # Lock file
│   ├── tsconfig.json            # TypeScript config
│   ├── vite.config.ts           # Vite bundler config
│   ├── vitest.config.ts         # Test configuration
│   ├── .eslintrc.cjs           # ESLint rules
│   └── index.html              # HTML entry point
│
├── Documentation & Specs
│   ├── README.md                           # Project overview
│   ├── CLAUDE.md                          # Development guidelines
│   ├── PROJECT_REQUIREMENTS.md            # Core requirements
│   ├── PRD_STRUCTURED_ANALYSIS.md         # Product analysis
│   ├── GENC_CLAUDE_DESIGN_SYSTEM.md      # Design tokens
│   ├── GENC_COMPONENT_LIBRARY.md         # Component docs
│   ├── HEMINGWAY_EDITOR_REQUIREMENTS.md  # Editor specs
│   ├── auth-integration-guide.md          # Auth implementation
│   ├── TEST_DOCUMENTATION.md              # Testing guide
│   └── Various UI Mockup files           # Design mockups
│
├── Source Code (src/)
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   │
│   ├── api/                     # API route handlers
│   │   ├── auth/
│   │   │   ├── profile/route.ts
│   │   │   └── rbac/           # Role-based access control
│   │   ├── collections/route.ts
│   │   └── videos/             # Video management APIs
│   │
│   ├── components/              # UI Components
│   │   ├── auth/               # Authentication components
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── collections/        # Collection management UI
│   │   │   ├── CollectionCard.tsx
│   │   │   ├── VideoGrid.tsx
│   │   │   └── VideoModal.tsx
│   │   │
│   │   ├── editor/             # Hemingway editor components
│   │   │   ├── hemingway-editor.tsx
│   │   │   ├── hemingway-editor-wrapper.tsx
│   │   │   └── floating-toolbar.tsx
│   │   │
│   │   ├── enhanced/           # Enhanced feature components
│   │   │   ├── EnhancedLibrary.tsx
│   │   │   ├── EnhancedScriptGenerator.tsx
│   │   │   └── EnhancedVideoGrid.tsx
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Layout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Grid.tsx
│   │   │
│   │   ├── library/            # Design system components
│   │   │   ├── primitives/     # Basic UI elements
│   │   │   │   ├── Avatar/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   └── Input/
│   │   │   ├── patterns/       # Composite patterns
│   │   │   │   └── Form/
│   │   │   ├── tokens/         # Design tokens
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   └── typography.ts
│   │   │   └── utils/
│   │   │
│   │   ├── progressive/        # Progressive enhancement
│   │   │   ├── ProgressiveEnhancement.tsx
│   │   │   ├── DesktopOnlyFeatures.tsx
│   │   │   └── TabletEnhancements.tsx
│   │   │
│   │   ├── script/             # Script generation UI
│   │   │   ├── ScriptEditor.tsx
│   │   │   ├── ScriptGenerator.tsx
│   │   │   └── TrendingIdeas.tsx
│   │   │
│   │   ├── script-panel/       # Script panel components
│   │   │   ├── script-panel.tsx
│   │   │   └── script-panel-components.tsx
│   │   │
│   │   ├── settings/           # Settings page components
│   │   │   ├── AccountSettings.tsx
│   │   │   ├── ApiKeySettings.tsx
│   │   │   ├── BillingSettings.tsx
│   │   │   ├── NotificationSettings.tsx
│   │   │   └── AdvancedSettings.tsx
│   │   │
│   │   └── ui/                 # Reusable UI components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── CreatorCard.tsx
│   │       ├── HemingwayEditor.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── Various other UI components
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── script-panel-context.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useResponsive.ts
│   │   ├── useAdvancedResponsive.ts
│   │   ├── useFocusManagement.ts
│   │   ├── use-script-analytics.ts
│   │   ├── use-script-copy.ts
│   │   ├── use-script-download.ts
│   │   ├── use-script-generation.ts
│   │   └── use-scripts-api.ts
│   │
│   ├── lib/                    # Core business logic
│   │   ├── ai-service-clients.ts
│   │   ├── bunny-stream.ts
│   │   ├── collections-service.ts
│   │   ├── content-analysis-service.ts
│   │   ├── enhanced-readability-service.ts
│   │   ├── firebase.ts
│   │   ├── platform-auth-manager.ts
│   │   ├── platform-data-transformer.ts
│   │   ├── script-analysis.ts
│   │   ├── services-interface.ts
│   │   ├── social-platform-services.ts
│   │   ├── unified-video-scraper.ts
│   │   └── user-management.ts
│   │
│   ├── pages/                  # Route components
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Collections.tsx     # Collections management
│   │   ├── Videos.tsx          # Video library
│   │   ├── ChannelsPage.tsx    # Channel management
│   │   ├── Write.tsx           # Writing interface
│   │   ├── HemingwayEditorPage.tsx # Editor page
│   │   ├── Library.tsx         # Content library
│   │   ├── Enhanced.tsx        # Enhanced features
│   │   ├── SettingsPage.tsx    # User settings
│   │   ├── Login.tsx           # Authentication
│   │   └── Register.tsx        # User registration
│   │
│   ├── services/               # Service layer
│   │   ├── auth/               # Authentication services
│   │   │   ├── AuthService.ts
│   │   │   ├── RBACService.ts
│   │   │   ├── auth-service.ts
│   │   │   ├── rbac-service.ts
│   │   │   ├── middleware.ts
│   │   │   └── types.ts
│   │   ├── ai-analysis-service.ts
│   │   ├── api-middleware.ts
│   │   ├── background-job-service.ts
│   │   ├── cdn-service.ts
│   │   ├── pipeline-orchestrator.ts
│   │   ├── service-container.ts
│   │   ├── service-interfaces.ts
│   │   ├── transcription-service.ts
│   │   ├── video-download-service.ts
│   │   └── video-processing-service.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── script.ts
│   │   ├── script-panel.ts
│   │   └── transcription.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── format.tsx
│   │   └── responsiveTestUtils.ts
│   │
│   ├── test/                   # Test utilities
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   │
│   ├── examples/               # Example implementations
│   │   └── ProgressiveEnhancementExample.tsx
│   │
│   ├── docs/                   # Internal documentation
│   │   └── atlaskit-theme.md
│   │
│   └── config/                 # Configuration files
│       └── firebase.ts
│
├── __tests__/                  # Test files
│   ├── accessibility.test.tsx
│   ├── App.test.tsx
│   ├── components/ui/          # Component tests
│   ├── hooks/                  # Hook tests
│   ├── pages/                  # Page tests
│   ├── types.test.ts
│   └── utils/                  # Utility tests
│
├── .claude/                    # Claude AI agent configurations
│   ├── agents/                 # Specialized agent configs
│   ├── memory-bank/           # Persistent memory storage
│   └── settings.local.json
│
└── Scripts & Tools
    ├── restart-dev.sh          # Development server restart
    ├── debug-app.js           # Debug utilities  
    └── test-app.js            # Test utilities
```

## Architecture Summary

**Key Architecture Highlights:**
- **Framework**: React 18 + TypeScript + Vite
- **Design System**: Atlaskit tokens + Custom Claude-inspired components  
- **State Management**: React Context + Local State
- **Authentication**: Firebase Auth with RBAC
- **Testing**: Vitest + React Testing Library
- **Styling**: Emotion CSS-in-JS + Design Tokens

**Core Features:**
- Content creation & editing (Hemingway Editor)
- Video/content management & collections
- AI-powered script generation
- Multi-platform social media integration
- Progressive responsive enhancement
- Comprehensive design system

## Change Log

### 2025-09-12 - Initial Memory Bank Creation
- Created comprehensive file structure diagram
- Documented current architecture state
- Established memory bank for future tracking

## Update Instructions

When making changes to the file structure:

1. Update this diagram to reflect new files/directories
2. Add entry to Change Log with date and description
3. Update Architecture Summary if major changes occur
4. Maintain accurate file counts and organization

## Quick Reference Commands

```bash
# Generate current file structure
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -E "^\./(src|__tests__|\.)" | sort

# Count files by type
find src/ -name "*.tsx" | wc -l  # React components
find src/ -name "*.ts" | wc -l   # TypeScript files
find __tests__/ -name "*.test.*" | wc -l  # Test files
```