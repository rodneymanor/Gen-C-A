# Gen.C Alpha Development & Modification Guide

## Table of Contents
1. [Quick Start Guide](#quick-start-guide)
2. [Adding New Features](#adding-new-features)
3. [Modifying Existing Features](#modifying-existing-features)
4. [API Integration Guide](#api-integration-guide)
5. [Component Development Patterns](#component-development-patterns)
6. [Common Development Tasks](#common-development-tasks)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Quick Start Guide

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account (for auth)
- Gemini API key (for AI features)

### Setup Steps
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Configure environment variables
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_GEMINI_API_KEY=your_gemini_api_key

# 4. Start development server
npm run dev

# 5. Run tests
npm test

# 6. Build for production
npm run build
```

### Project Commands Reference
```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview build

# Code Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript check
npm test               # Run tests
npm run test:coverage  # Coverage report

# Testing (Granular)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:services      # Service layer tests
```

---

## Adding New Features

### 1. Adding a New Page/Route

#### Step 1: Create the Page Component
```typescript
// src/pages/NewFeaturePage.tsx
import React from 'react';
import { css } from '@emotion/react';

const pageStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
`;

export const NewFeaturePage: React.FC = () => {
  return (
    <div css={pageStyles}>
      <h1>New Feature</h1>
      {/* Your feature content */}
    </div>
  );
};
```

#### Step 2: Add Route to App.tsx
```typescript
// src/App.tsx
import { NewFeaturePage } from './pages/NewFeaturePage';

// Add to Routes section
<Route path="/new-feature" element={
  <ProtectedRoute>
    <Layout>
      <NewFeaturePage />
    </Layout>
  </ProtectedRoute>
} />
```

#### Step 3: Add Navigation Link
```typescript
// src/components/layout/Navigation.tsx
// Add to navigation items array
{
  path: '/new-feature',
  label: 'New Feature',
  icon: <YourIcon label="" />
}
```

### 2. Creating a New Component Library Item

#### Step 1: Create Component File
```typescript
// src/components/ui/NewComponent.tsx
import React from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';

interface NewComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onAction?: () => void;
  children?: React.ReactNode;
}

const componentStyles = css`
  padding: ${token('space.200', '0.5rem')};
  border: 1px solid ${token('color.border', '#ddd')};
  border-radius: ${token('border.radius.200', '0.5rem')};
`;

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  variant = 'primary',
  onAction,
  children
}) => {
  return (
    <div css={componentStyles}>
      <h3>{title}</h3>
      {children}
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </div>
  );
};
```

#### Step 2: Export from Index
```typescript
// src/components/ui/index.ts
export { NewComponent } from './NewComponent';
```

#### Step 3: Add TypeScript Types
```typescript
// src/types/index.ts
export interface NewComponentData {
  id: string;
  title: string;
  // Add other properties
}
```

### 3. Adding API Integration

#### Step 1: Create API Route
```typescript
// src/api/new-feature/route.ts
import { NextRequest } from "next/server";

interface NewFeatureRequest {
  data: string;
}

interface NewFeatureResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NewFeatureRequest = await request.json();

    // Process request
    const result = await processNewFeature(body.data);

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

#### Step 2: Create Service Hook
```typescript
// src/hooks/use-new-feature.ts
import { useState, useCallback } from 'react';

interface UseNewFeatureReturn {
  data: any | null;
  isLoading: boolean;
  error: string | null;
  execute: (input: string) => Promise<void>;
}

export function useNewFeature(): UseNewFeatureReturn {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/new-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: input })
      });

      const result = await response.json();

      if (result.success) {
        setData(result.result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
}
```

---

## Modifying Existing Features

### 1. Enhancing Script Generation

#### Adding New AI Model Options
```typescript
// src/components/script/ScriptGenerator.tsx
const aiModelOptions = [
  { value: 'creative', label: 'Creative (Recommended)' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'precise', label: 'Precise' },
  // Add new model
  { value: 'experimental', label: 'Experimental' },
];
```

#### Adding New Platform Support
```typescript
// src/types/index.ts
export type Platform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'snapchat'  // New platform
  | 'other';

// src/components/script/ScriptGenerator.tsx
const platformOptions = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'snapchat', label: 'Snapchat' }, // New platform
];
```

### 2. Extending Content Library

#### Adding New Content Types
```typescript
// src/types/index.ts
export type ContentType =
  | 'video'
  | 'script'
  | 'image'
  | 'note'
  | 'idea'
  | 'audio'
  | 'template'; // New type

// src/pages/Library.tsx
const filters = [
  { key: 'all', label: 'All', icon: <DocumentIcon label="" /> },
  { key: 'scripts', label: 'Scripts', icon: <EditIcon label="" /> },
  { key: 'notes', label: 'Notes', icon: <DocumentIcon label="" /> },
  { key: 'ideas', label: 'Ideas', icon: <LightbulbIcon label="" /> },
  { key: 'templates', label: 'Templates', icon: <TemplateIcon label="" /> } // New filter
];
```

#### Adding Bulk Actions
```typescript
// src/pages/Library.tsx
const handleBulkAction = (action: string, selectedIds: string[]) => {
  switch (action) {
    case 'delete':
      // Implement bulk delete
      break;
    case 'export':
      // Implement bulk export
      break;
    case 'addToCollection':
      // Implement bulk add to collection
      break;
    // Add more actions as needed
  }
};
```

### 3. Enhancing Collections

#### Adding Collection Templates
```typescript
// src/components/collections/CollectionTemplates.tsx
interface CollectionTemplate {
  id: string;
  name: string;
  description: string;
  defaultTags: string[];
  suggestedPlatforms: Platform[];
}

const collectionTemplates: CollectionTemplate[] = [
  {
    id: 'seasonal-summer',
    name: 'Summer Content',
    description: 'Bright, energetic summer-themed content',
    defaultTags: ['summer', 'lifestyle', 'bright'],
    suggestedPlatforms: ['tiktok', 'instagram']
  },
  // Add more templates
];
```

---

## API Integration Guide

### 1. Backend API Integration Pattern

#### Service Layer Architecture
```typescript
// src/services/BaseService.ts
export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

// src/services/ContentService.ts
export class ContentService extends BaseService {
  constructor() {
    super('/api');
  }

  async getContent(filters?: SearchFilters): Promise<ContentItem[]> {
    return this.request<ContentItem[]>('/content', {
      method: 'GET',
      // Add query params for filters
    });
  }

  async createContent(content: Partial<ContentItem>): Promise<ContentItem> {
    return this.request<ContentItem>('/content', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
    return this.request<ContentItem>(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteContent(id: string): Promise<void> {
    return this.request<void>(`/content/${id}`, {
      method: 'DELETE',
    });
  }
}
```

### 2. Real-time Data Integration

#### WebSocket Integration Pattern
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';

export function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, [url]);

  return { data, isConnected };
}
```

### 3. External Service Integration

#### Adding New AI Provider
```typescript
// src/services/ai-analysis-service.ts

// Add to existing AIProvider implementations
class NewAIProvider implements AIProvider {
  async analyzeScript(transcript: string): Promise<ScriptComponents | null> {
    try {
      // Implement API call to new provider
      const response = await fetch('https://api.newprovider.com/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEW_AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcript,
          analysis_type: 'script_components'
        })
      });

      const result = await response.json();

      return {
        hook: result.hook,
        bridge: result.bridge,
        nugget: result.main_content,
        wta: result.call_to_action
      };
    } catch (error) {
      console.error('NewAI Provider error:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!process.env.NEW_AI_API_KEY;
  }

  getName(): string {
    return 'NewAI';
  }

  getModel(): string {
    return 'newai-model-v1';
  }
}

// Add to AIAnalysisService constructor
constructor() {
  this.providers = [
    new GeminiAIProvider(),
    new OpenAIProvider(),
    new ClaudeProvider(),
    new NewAIProvider(), // Add new provider
  ];
}
```

---

## Component Development Patterns

### 1. Atlaskit Integration Pattern
```typescript
import React from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import { Card } from '@atlaskit/card';
import { Button } from '@atlaskit/button';

// Use Atlaskit tokens for consistency
const customStyles = css`
  padding: ${token('space.300', '0.75rem')};
  margin-bottom: ${token('space.200', '0.5rem')};
  background: ${token('color.background.neutral', '#f4f5f7')};
  border: 1px solid ${token('color.border', '#ddd')};
  border-radius: ${token('border.radius.200', '0.5rem')};
`;

// Combine Atlaskit components with custom styling
export const CustomFeature: React.FC = () => {
  return (
    <Card appearance="raised">
      <div css={customStyles}>
        <Button appearance="primary">
          Atlaskit Button
        </Button>
      </div>
    </Card>
  );
};
```

### 2. Responsive Design Pattern
```typescript
import { useResponsive } from '../hooks/useResponsive';

const responsiveStyles = css`
  display: grid;
  gap: ${token('space.300', '0.75rem')};

  /* Mobile first approach */
  grid-template-columns: 1fr;

  /* Tablet */
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  /* Desktop */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const ResponsiveComponent: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div css={responsiveStyles}>
      {isMobile && <MobileView />}
      {isTablet && <TabletEnhancements />}
      {isDesktop && <DesktopFeatures />}
    </div>
  );
};
```

### 3. Error Handling Pattern
```typescript
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Component with error handling
export const FeatureWithErrorHandling: React.FC = () => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <RiskyComponent />
    </ErrorBoundary>
  );
};

// Hook with error handling
export function useFeatureWithError() {
  const [error, setError] = useState<string | null>(null);

  const riskyAction = async () => {
    try {
      setError(null);
      await riskyOperation();
    } catch (err) {
      setError(err.message);
      console.error('Feature error:', err);
    }
  };

  return { error, riskyAction };
}
```

---

## Common Development Tasks

### 1. Adding Environment Variables
```bash
# .env.local
VITE_NEW_FEATURE_API_KEY=your_api_key
VITE_NEW_FEATURE_URL=https://api.example.com
```

```typescript
// src/config/environment.ts
export const config = {
  newFeature: {
    apiKey: import.meta.env.VITE_NEW_FEATURE_API_KEY,
    url: import.meta.env.VITE_NEW_FEATURE_URL,
  }
};
```

### 2. Adding New Icon Support
```typescript
// Using Atlaskit icons (preferred)
import NewIcon from '@atlaskit/icon/glyph/new-icon';

// Or using Lucide React
import { NewIcon } from 'lucide-react';

// Creating custom icon component
export const CustomIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {/* SVG path */}
  </svg>
);
```

### 3. Database Migration Pattern
```typescript
// src/utils/migrations.ts
interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Add new content type field',
    up: async () => {
      // Migration logic for adding field
    },
    down: async () => {
      // Rollback logic
    }
  }
];

export async function runMigrations() {
  // Migration execution logic
}
```

### 4. Testing New Components
```typescript
// src/components/ui/__tests__/NewComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders with title', () => {
    render(<NewComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<NewComponent title="Test" onAction={mockAction} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    render(
      <NewComponent title="Test">
        <span>Child content</span>
      </NewComponent>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting Guide

### 1. Common Build Issues

#### TypeScript Errors
```bash
# Check TypeScript errors
npm run type-check

# Common fixes:
# 1. Missing type definitions
npm install @types/package-name

# 2. Import path issues - use absolute imports
import { Component } from '@/components/Component';
```

#### ESLint Issues
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Disable rule for specific line
// eslint-disable-next-line @typescript-eslint/no-unused-vars

# Disable rule for file
/* eslint-disable @typescript-eslint/no-unused-vars */
```

### 2. Firebase Configuration Issues
```typescript
// Check Firebase config
// src/config/firebase.ts
const firebaseConfig = {
  // Verify all required fields are present
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};

// Debug Firebase connection
console.log('Firebase config:', firebaseConfig);
```

### 3. AI Service Issues
```typescript
// Debug AI service
// src/services/ai-analysis-service.ts

// Check provider availability
const providerStatus = aiService.getProviderStatus();
console.log('Provider status:', providerStatus);

// Test individual providers
const geminiProvider = new GeminiAIProvider();
console.log('Gemini available:', geminiProvider.isAvailable());
```

### 4. Route Issues
```typescript
// Debug routing
// src/App.tsx

// Check route configuration
console.log('Current pathname:', window.location.pathname);

// Verify protected route logic
// src/components/auth/ProtectedRoute.tsx
console.log('Current user:', currentUser);
console.log('Is authenticated:', !!currentUser);
```

### 5. API Integration Issues
```bash
# Check API endpoints
curl -X POST http://localhost:5173/api/script/generate \
  -H "Content-Type: application/json" \
  -d '{"idea":"test script","length":"60"}'

# Debug network requests in browser dev tools
# Check Console for error messages
# Check Network tab for failed requests
```

### 6. Performance Issues
```typescript
// Add performance monitoring
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Use React DevTools Profiler
// Wrap components to identify render issues
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Render performance:', { id, phase, actualDuration });
};

<Profiler id="ComponentName" onRender={onRenderCallback}>
  <SlowComponent />
</Profiler>
```

---

## Admin: Brand Voice Defaults and Sharing

This project supports marking a brand voice as globally shared and default across user accounts, without renaming the underlying creator document.

- Admin UI control: src/components/layout/Navigation.tsx
  - Menu item "Admin: Make Default & Share…" (visible for admin/bypass) prompts for creatorId and INTERNAL_API_SECRET.
  - Calls the API to set displayName: "Default", isShared: true, and isDefault: true for the selected brand voice.

- API endpoints and behavior
  - POST /api/brand-voices/update-meta
    - Secured via x-internal-secret header (INTERNAL_API_SECRET).
    - Body: { creatorId, displayName?: string, isShared?: boolean, isDefault?: boolean }.
    - Firestore: stores overrides in brandVoiceMeta/{creatorId}; if isDefault: true, unsets previous defaults.
    - Offline: persists to data/brand-voice-meta.json and ensures only one default.
  - GET /api/brand-voices/list
    - Applies overrides, returns isShared and isDefault; sorts default first.

Notes
- Overrides only change the presented name and flags; the underlying creator doc (id/handle) stays intact.

## TikTok Analysis: Batching, Concurrency, and De-duplication

- Client (file: src/pages/TikTokAnalysisTest.tsx)
  - Step 1: fetch up to 20 videos, then filter out previously analyzed ones via GET /api/creator/analyzed-video-ids?handle=...
  - Step 2: transcribe with concurrency 3.
  - Step 3: analyze in batches (size 10) with strict JSON prompting and resilient parsing; merges templates and per-transcript results; maintains sourceIndex mapping.

- Server
  - New endpoint: GET /api/creator/analyzed-video-ids (src/api-routes/creator-lookup.js) to return already analyzed videoIds for a creator.
  - Upserts to avoid duplicates when saving analysis (src/api-routes/creator-analysis.js):
    - scriptStructures upserted by (creatorId, videoId).
    - Templates upserted by (pattern, creatorId).

- UI extras
  - Step 1 shows a "Latest videos" list with thumbnail (cover), title (music.title), caption, and meta.

## Development Best Practices

### 1. Code Organization
- Keep components small and focused (< 200 lines)
- Use custom hooks for complex logic
- Separate concerns (UI, business logic, data fetching)
- Use TypeScript interfaces for all data structures

### 2. Performance Optimization
- Use React.memo() for expensive components
- Implement proper loading states
- Optimize bundle size with code splitting
- Use proper dependency arrays in hooks

### 3. Accessibility
- Use semantic HTML elements
- Include ARIA labels for interactive elements
- Test with keyboard navigation
- Ensure color contrast meets WCAG standards

### 4. Testing Strategy
- Unit tests for utility functions
- Component tests for UI behavior
- Integration tests for user flows
- E2E tests for critical paths

---

*This guide provides practical patterns for extending and modifying Gen.C Alpha. Reference the main documentation for architectural details and current feature status.*

---

## Roadmap & Contribution

- In-app roadmap: navigate to `/roadmap`
- Document: `docs/ROADMAP.md`

### Proposing additions
1. Add an item under the appropriate timeframe in `docs/ROADMAP.md`
2. If significant, create a ticket/issue with scope and acceptance criteria
3. Keep changes focused; update related docs after merging
### Hemingway Editor Sidebar Styling

- Source of truth: Prefer styling the editor sidebar in `src/components/ui/EditorSidebar.tsx`.
- Avoid adding inline styles in `src/components/editor/hemingway-editor.tsx` for sidebar visuals (backgrounds, borders, tabs). Some legacy inline styles exist and should be migrated into `EditorSidebar` over time.
- Design rules to follow:
  - Sidebar background: pure white `#ffffff` (no gray fallbacks).
  - Card-like elements in the sidebar: 12px radius (`var(--radius-large)`), flat borders.
  - Tabs: no focus ring; only the underline indicates the active tab.
  - Issue items and writing stat items: use a light transparent blue background (`rgba(11, 92, 255, 0.08)`) with darker blue text (`var(--color-primary-700)`).
  - Header heights: target 68px for both the Hemingway editor header and the sidebar header (tracked in the roadmap).

### Hemingway Editor Hover States

- Source of truth: Centralize hover visuals inside the editor components, not the page.
- Update locations:
  - `src/components/writing-analysis/interactive-script.tsx:SectionContainer`
  - `src/components/ui/ScriptComponentEditor.tsx:ComponentCard`
- Behavior:
  - Default/OK: Hover container is blue (background + border) with 12px corner radius.
  - Escalations: Use yellow (warning), orange (high), red (critical) only when text complexity is high. Do not use green for “good”.
- Implementation notes:
  - Complexity is a lightweight heuristic (avg words per sentence and total words); tune thresholds in the components if needed.
  - Do not modify `src/pages/HemingwayEditorPage.tsx` for hover visuals to avoid duplication.
