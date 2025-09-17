# Hemingway Editor Migration Script

## Migration Status: COMPLETE ✅

The Hemingway Editor system has been successfully migrated to your new application. Below is the complete migration strategy and implementation guide.

## Files Successfully Copied

### Core Editor Components
- ✅ `src/components/editor/hemingway-editor.tsx` - Main editor with analysis and AI features
- ✅ `src/components/editor/hemingway-editor-wrapper.tsx` - Lazy loading wrapper
- ✅ `src/components/editor/floating-toolbar.tsx` - Floating action toolbar

### Script Panel System
- ✅ `src/features/write/components/script-panel/script-panel.tsx` - Main panel container
- ✅ `src/features/write/components/script-panel/script-panel-components.tsx` - Tab views and components
- ✅ `src/contexts/script-panel-context.tsx` - State management context

### Core Services
- ✅ `src/lib/enhanced-readability-service.ts` - Readability analysis engine
- ✅ `src/lib/script-analysis.ts` - Script element detection service

### Hooks & Types
- ✅ All script-related hooks copied to `src/hooks/`
- ✅ All script-related types copied to `src/types/`

## Next Steps for Integration

### 1. Install Required Dependencies
```bash
npm install @blocknote/core@^0.12.0 @blocknote/react@^0.12.0 @blocknote/mantine@^0.12.0 lucide-react@^0.263.1 sonner@^1.4.0
```

### 2. Create Missing Dependencies

#### A. Voice Context (Required)
Create `src/contexts/voice-context.tsx`:
```typescript
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceContextType {
  currentVoice: VoiceType;
  setCurrentVoice: (voice: VoiceType) => void;
  availableVoices: VoiceType[];
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentVoice, setCurrentVoice] = useState<VoiceType>('alloy');
  const availableVoices: VoiceType[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  return (
    <VoiceContext.Provider value={{ currentVoice, setCurrentVoice, availableVoices }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
```

#### B. Required UI Components
Ensure these components exist in your design system:
- `Badge`, `Button`, `Card`, `Input`, `Tabs`, `Tooltip`, `DropdownMenu`
- `SlideoutHeader` (or create a simple header component)
- `ClarityLoader` (or use a simple loading spinner)

#### C. Utility Functions
Create `src/lib/utils.ts` if not exists:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### D. Firebase Configuration
Ensure Firebase is configured with Auth enabled for save/transcription features.

### 3. Create API Endpoints

#### A. Transcription Endpoint
Create `src/api/transcribe/voice/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
// Add your Gemini/OpenAI transcription logic here
```

#### B. Notes API
Create `src/api/notes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
// Add your notes CRUD logic here
```

#### C. AI Action APIs
- `src/api/humanize/route.ts`
- `src/api/shorten/route.ts`
- `src/api/ai-action/route.ts`

### 4. Integration Example

#### Basic Implementation
```typescript
"use client";

import { useState } from 'react';
import { HemingwayEditor } from '@/components/editor/hemingway-editor';
import { ScriptPanel } from '@/components/script-panel/script-panel';
import { VoiceProvider } from '@/contexts/voice-context';
import { ScriptPanelProvider } from '@/contexts/script-panel-context';

export default function WritingPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  return (
    <VoiceProvider>
      <ScriptPanelProvider>
        <div className="flex h-screen">
          <div className="flex-1">
            <HemingwayEditor
              value={content}
              onChange={setContent}
              title={title}
              onTitleChange={setTitle}
              showTitleEditor={true}
              context="scripts"
            />
          </div>
          {/* Script panel can be shown conditionally */}
        </div>
      </ScriptPanelProvider>
    </VoiceProvider>
  );
}
```

### 5. CSS Styling
Add these CSS classes to your global styles for proper functionality:
```css
.app-shell {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.right-sidebar {
  width: 320px;
  padding: 1rem;
}

.sidebar-collapsed .right-sidebar {
  display: none;
}

.floating-toolbar-responsive {
  /* Responsive toolbar styles */
}

.hemingway-sidebar-header {
  /* Sidebar header styles */
}

.hemingway-card {
  /* Card styles for panels */
}

.readability-suggestion {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 0.875rem;
}
```

## Troubleshooting

### Common Issues

1. **Missing Dependencies**: Install all required npm packages
2. **Import Errors**: Ensure all utility functions and UI components exist
3. **Context Errors**: Wrap components with required providers
4. **API Errors**: Implement backend endpoints for save/transcription
5. **Styling Issues**: Add required CSS classes for proper layout

### Testing the Migration

1. **Basic Editor**: Test text input and editing functionality
2. **Real-time Analysis**: Verify readability scoring updates
3. **Voice Recording**: Test microphone integration (requires API)
4. **AI Actions**: Test content transformations (requires APIs)
5. **Save/Export**: Test content persistence (requires API)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│            User Interface               │
├─────────────────────────────────────────┤
│  HemingwayEditor + FloatingToolbar     │
│  ScriptPanel + ScriptPanelComponents   │
├─────────────────────────────────────────┤
│           Services Layer                │
│  EnhancedReadabilityService            │
│  ScriptAnalysisService                 │
├─────────────────────────────────────────┤
│             API Layer                   │
│  /api/transcribe/voice                 │
│  /api/notes                            │
│  /api/ai-action                        │
├─────────────────────────────────────────┤
│           External Services             │
│  Firebase Auth                         │
│  Gemini API (transcription)            │
│  OpenAI API (AI actions)               │
└─────────────────────────────────────────┘
```

## Migration Complete! 🎉

Your Hemingway Editor system is now ready for integration. Follow the steps above to complete the setup and begin using the advanced writing and analysis features in your new application.

For questions or issues, refer to the comprehensive requirements document: `HEMINGWAY_EDITOR_REQUIREMENTS.md`