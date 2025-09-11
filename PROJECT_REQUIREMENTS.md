# Gen.C Alpha - Project Requirements for Migration

## Overview

This document outlines the comprehensive requirements for migrating the Gen.C Alpha application functionality to a new project using Atlassian design system. The analysis covers 7 core pages with their complete functionality, API integration, and architectural patterns.

## Executive Summary

The current application is a sophisticated Next.js content creation platform with:
- **7 core pages** with distinct but interconnected functionality
- **Microservices API architecture** with domain-specific endpoints
- **Advanced state management** using React Context and custom hooks
- **Mature UI patterns** ready for Atlassian design system migration
- **RBAC system** with Firebase Auth integration
- **Real-time features** and progressive enhancement

---

## Page-by-Page Requirements

### 1. Collections Page (`/collections`)

**Business Purpose:** Video content organization and collection management

#### Core Features
- **Collection Management System**
  - Create, edit, delete collections with metadata
  - Favorites system for frequently accessed collections
  - Drag & drop video organization
  - Bulk operations (move, delete, tag)

- **Video Grid Interface**
  - Responsive grid layout (2-6 columns based on screen size)
  - Platform filtering (TikTok, Instagram, YouTube)
  - Search and filter capabilities
  - Thumbnail generation and caching

- **Instagram-Style Video Modal**
  - Full-screen video playback
  - Navigation between videos in collection
  - Keyboard shortcuts (arrow keys, escape)
  - Video metadata overlay

- **Side Panel Management**
  - Collection management panel (300px width)
  - Video management panel with details
  - Resizable panel system
  - Persistent panel state

#### API Requirements
```
POST /api/collections - Create collection
GET /api/collections - List collections
PUT /api/collections/:id - Update collection
DELETE /api/collections/:id - Delete collection
POST /api/collections/:id/videos - Add video to collection
DELETE /api/collections/:id/videos/:videoId - Remove video
```

#### State Management
- `CollectionsProvider` context with collection state
- `VideoProcessingProvider` for video upload/processing status
- Local storage for UI preferences (grid size, panel state)

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/dynamic-table` for video grid
- **Modal System:** Integrate with `@atlaskit/modal-dialog`
- **Drag & Drop:** Utilize `@atlaskit/pragmatic-drag-and-drop`
- **Panel System:** Implement with `@atlaskit/drawer`

---

### 2. Brand Hub Page (`/brand-hub`)

**Business Purpose:** Creator persona management and brand voice configuration

#### Core Features
- **Creator Persona Grid**
  - Visual persona cards with avatars and metadata
  - Quick actions (edit, delete, duplicate)
  - Search and filter personas
  - Grid/list view toggle

- **Persona Creation Wizard**
  - 3-step creation flow
  - Video analysis for persona generation
  - Manual persona configuration
  - Preview and confirmation step

- **Video Analysis Integration**
  - Upload creator videos for analysis
  - AI-powered persona extraction
  - Platform-specific analysis (TikTok, YouTube, Instagram)
  - Batch processing capabilities

#### API Requirements
```
GET /api/personas - List personas
POST /api/personas - Create persona
PUT /api/personas/:id - Update persona
DELETE /api/personas/:id - Delete persona
POST /api/personas/analyze - Analyze video for persona
GET /api/personas/:id/content - Get persona-generated content
```

#### State Management
- Multi-step wizard state management
- Persona selection and editing states
- Video upload and analysis progress
- Form validation and error handling

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/avatar` for persona display
- **Wizard Flow:** Implement with `@atlaskit/modal-dialog` and step navigation
- **Form System:** Utilize `@atlaskit/form` with validation
- **Progress Tracking:** Use `@atlaskit/progress-indicator`

---

### 3. Library Page (`/library`)

**Business Purpose:** Unified content library with advanced search and organization

#### Core Features
- **Unified Data Table**
  - Advanced filtering and sorting
  - Multi-source content aggregation
  - Bulk operations and selection
  - Export capabilities

- **Content Sources Integration**
  - Chat conversations history
  - Generated scripts and hooks
  - Captured content from browser extension
  - Content ideas and notes
  - Custom uploads and imports

- **NotionPanel Content Viewer**
  - Slide-out panel (400-800px width)
  - Multi-tab content viewer
  - Rich text editing with BlockNote
  - Content preview with syntax highlighting

- **Advanced Search & Filtering**
  - Full-text search across all content
  - Filter by content type, source, platform
  - Date range filtering
  - Tag and category filtering
  - URL parameter support for deep linking

#### API Requirements
```
GET /api/library/content - Get unified content feed
POST /api/library/search - Advanced search
GET /api/library/:id - Get specific content item
PUT /api/library/:id - Update content item
DELETE /api/library/:id - Delete content item
POST /api/library/bulk-action - Bulk operations
GET /api/library/filters - Get available filters
```

#### State Management
- Unified content state management
- Advanced filter state with URL persistence
- Panel state (view/edit mode)
- Real-time content updates
- Pagination and infinite scroll

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/dynamic-table` for main data table
- **Panel System:** Implement with `@atlaskit/drawer`
- **Search:** Utilize `@atlaskit/textfield` with search styling
- **Filtering:** Use `@atlaskit/select` for filter dropdowns
- **Tabs:** Implement with `@atlaskit/tabs`

---

### 4. Write Page (`/write`)

**Business Purpose:** AI-powered script writing and content generation

#### Core Features
- **Multi-View Script Generation**
  - Input view with prompt configuration
  - Generating view with real-time progress
  - Editing view with rich text editor
  - Transcribing view for voice input

- **Daily Content Picks**
  - Curated daily content suggestions
  - Trending topic integration
  - Expandable content exploration
  - Search-based content discovery

- **Template & Generator System**
  - Pre-built content templates
  - Custom template creation
  - AI generator selection
  - Brand persona integration

- **Voice-to-Script Feature**
  - Voice recording interface
  - Real-time transcription
  - Script generation from transcription
  - Voice command processing

#### API Requirements
```
GET /api/tiktok/daily-picks - Get daily curated content
POST /api/tiktok/search-picks - Search trending content
POST /api/scripts/generate - Generate script
POST /api/scripts/transcribe - Voice transcription
GET /api/templates - List templates
POST /api/templates - Create template
```

#### State Management
- `useScriptGeneration` orchestrator hook
- Multi-step workflow state management
- Real-time generation progress
- Voice recording state
- Template and generator selection

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/editor-core` for rich text editing
- **Progress:** Utilize `@atlaskit/progress-bar` for generation progress
- **Cards:** Use `@atlaskit/card` for daily picks display
- **Voice UI:** Custom implementation with Atlassian styling
- **Stepper:** Use `@atlaskit/progress-indicator` for workflow steps

---

### 5. Settings Page (`/settings`)

**Business Purpose:** User account and application configuration management

#### Core Features
- **Tab-Based Navigation**
  - Account settings
  - Billing management
  - Notification preferences
  - API key management
  - Integration settings

- **Account Management**
  - Profile information editing
  - Password and security settings
  - Account deletion and data export
  - Privacy settings

- **Billing Integration**
  - Subscription management
  - Payment method configuration
  - Billing history
  - Usage tracking and limits

- **API Key Management**
  - Generate and revoke API keys
  - Usage monitoring
  - Rate limit configuration
  - Security audit logs

#### API Requirements
```
GET /api/users/profile - Get user profile
PUT /api/users/profile - Update profile
GET /api/billing/subscription - Get subscription info
PUT /api/billing/subscription - Update subscription
GET /api/api-keys - List API keys
POST /api/api-keys - Generate API key
DELETE /api/api-keys/:id - Revoke API key
```

#### State Management
- Tab navigation with URL persistence
- Form state management
- API key generation and management state
- Billing integration state

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/tabs` for navigation
- **Forms:** Utilize `@atlaskit/form` with field components
- **Tables:** Use `@atlaskit/dynamic-table` for API key listing
- **Billing:** Custom integration with Atlassian styling

---

### 6. Chrome Extension Page (`/chrome-extension`)

**Business Purpose:** Chrome extension distribution and setup instructions

#### Core Features
- **Extension Download**
  - Direct ZIP file download
  - Version management
  - Installation tracking

- **Setup Instructions**
  - Step-by-step developer mode setup
  - Visual installation guide
  - Troubleshooting section

- **Feature Showcase**
  - Universal content capture
  - One-click save functionality
  - Smart content organization
  - Integration demonstrations

#### API Requirements
```
GET /api/extension/latest - Get latest extension version
POST /api/extension/download - Track download
GET /api/extension/setup-guide - Get setup instructions
```

#### State Management
- Installation progress tracking
- Setup step completion state
- Feature demonstration state

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/section-message` for instructions
- **Steps:** Utilize `@atlaskit/progress-indicator` for setup steps
- **Cards:** Use `@atlaskit/card` for feature showcase
- **Downloads:** Custom download interface with Atlassian styling

---

### 7. Downloads Page (`/downloads`)

**Business Purpose:** iOS shortcuts and mobile app distribution

#### Core Features
- **iOS Shortcuts Management**
  - Save Videos shortcut download
  - Voice Notes shortcut download
  - Installation instructions
  - Setup requirements

- **API Key Integration**
  - API key requirement display
  - Setup instructions
  - Testing and validation

- **Feature Comparison**
  - Shortcut capabilities comparison
  - Use case demonstrations
  - Benefits showcase

#### API Requirements
```
GET /api/shortcuts - List available shortcuts
POST /api/shortcuts/download - Track download
GET /api/shortcuts/:id/instructions - Get setup instructions
```

#### State Management
- Installation status tracking
- Setup step completion
- API key configuration state

#### Migration Considerations
- **Atlassian Components:** Use `@atlaskit/card` for shortcut display
- **Instructions:** Utilize `@atlaskit/section-message`
- **Progress:** Use `@atlaskit/progress-indicator` for setup
- **Downloads:** Custom download interface with Atlassian styling

---

## Shared Architecture Requirements

### Authentication & Authorization
- **Firebase Auth** integration
- **RBAC system** with role-based access control
- **API key management** system
- **Session management** and security

### API Architecture
- **Microservices pattern** with domain-specific endpoints
- **Rate limiting** and monitoring
- **Error handling** and retry logic
- **Real-time updates** where needed

### State Management
- **React Context** for global state
- **Custom hooks** for API integration
- **Local storage** for UI preferences
- **URL parameter** state persistence

### UI Patterns
- **Responsive design** with mobile-first approach
- **Panel system** with slide-out drawers
- **Modal overlays** with keyboard navigation
- **Data tables** with advanced controls
- **Real-time progress** indicators

### Performance Optimization
- **Code splitting** by route
- **Image optimization** and caching
- **API response caching**
- **Progressive enhancement**

---

## Migration Strategy

### Phase 1: Foundation Setup
1. **Atlassian Design System** integration
2. **Authentication** system migration
3. **API architecture** preservation
4. **Core routing** structure

### Phase 2: Core Pages Migration
1. **Settings page** (lowest complexity)
2. **Downloads page** (static content)
3. **Chrome extension page** (static content)
4. **Collections page** (core functionality)

### Phase 3: Advanced Features
1. **Library page** (complex data management)
2. **Write page** (AI integration)
3. **Brand hub page** (persona management)

### Phase 4: Integration & Optimization
1. **Cross-page functionality** integration
2. **Performance optimization**
3. **Testing and validation**
4. **Documentation and training**

---

## Technical Specifications

### Framework Requirements
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Atlassian Design System** components
- **React 18** with concurrent features

### API Integration
- **RESTful API** endpoints preservation
- **WebSocket** for real-time features
- **File upload** handling
- **External API** integrations (TikTok, YouTube, etc.)

### Database Requirements
- **User data** persistence
- **Content metadata** storage
- **Collection relationships**
- **API usage** tracking

This comprehensive requirements document provides the foundation for successfully migrating the Gen.C Alpha application while preserving all functionality and improving the user experience with Atlassian design system components.