# Hemingway Editor System Requirements

## Overview
The Hemingway Editor is a comprehensive writing and analysis system that provides real-time content analysis, AI-powered assistance, and structured script management. This document outlines the complete system requirements for migrating and implementing the editor in a new application.

## System Architecture

### Core Components

#### 1. **Hemingway Editor Core** (`hemingway-editor.tsx`)
- **Main Editor Interface**: Rich text editor with analysis capabilities
- **Real-time Analysis**: Script element detection and readability scoring
- **Voice Recording**: Microphone integration with transcription
- **AI Actions**: Content transformation and optimization
- **Title Management**: Editable title with auto-save functionality

#### 2. **Hemingway Editor Wrapper** (`hemingway-editor-wrapper.tsx`)
- **Lazy Loading**: Dynamic import with error handling
- **Suspense Integration**: Loading fallbacks and error boundaries
- **Props Interface**: Standardized component interface

#### 3. **Floating Toolbar** (`floating-toolbar.tsx`)
- **Action Groups**: Organized UI for editor actions
- **Voice Controls**: Recording and voice selection
- **AI Assistance**: Contextual content transformations
- **Statistics Display**: Word count and reading time
- **Undo/Redo**: History management controls

#### 4. **Script Panel System**
- **Script Panel** (`script-panel.tsx`): Main container for script display
- **Script Panel Components** (`script-panel-components.tsx`): Tabbed views for content
- **Script Panel Context** (`script-panel-context.tsx`): State management

## Technical Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "@blocknote/core": "^0.12.0",
    "@blocknote/react": "^0.12.0", 
    "@blocknote/mantine": "^0.12.0",
    "lucide-react": "^0.263.1",
    "sonner": "^1.4.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Core Services Required

#### 1. **Enhanced Readability Service** (`lib/enhanced-readability-service.ts`)
- **Readability Analysis**: Flesch-Kincaid scoring and grade level detection
- **Suggestion Generation**: Actionable writing improvements
- **Complexity Assessment**: Sentence and paragraph analysis
- **Configuration**: Customizable analysis parameters

#### 2. **Script Analysis Service** (`lib/script-analysis.ts`)
- **Element Detection**: Automatic identification of hooks, bridges, golden nuggets, CTAs
- **Highlight Configuration**: Customizable highlighting system
- **Pattern Matching**: Regex-based content analysis
- **Analysis Results**: Structured output for UI display

#### 3. **Authentication Integration**
- **Firebase Auth**: User authentication for save/transcription features
- **Token Management**: JWT handling for API requests
- **Permission System**: User-based feature access

### API Endpoints Required

#### 1. **Transcription API** (`/api/transcribe/voice`)
- **Audio Processing**: Base64 audio to text conversion
- **Gemini Integration**: AI-powered transcription service
- **Error Handling**: Robust failure management
- **Authentication**: User token validation

#### 2. **Notes API** (`/api/notes`)
- **CRUD Operations**: Create, read, update, delete notes
- **Auto-save**: Background content persistence
- **Metadata**: Title, content, tags, timestamps
- **User Association**: Content linked to authenticated users

#### 3. **AI Action APIs**
- **Humanization API** (`/api/humanize`): Natural language improvement
- **Content Shortening** (`/api/shorten`): Length optimization
- **General AI Actions** (`/api/ai-action`): Tone changes, style modifications

### UI Components Required

#### 1. **Base UI Components**
```typescript
// Required UI components from design system
- Badge
- Button 
- Card (CardContent, CardHeader, CardTitle)
- Input
- Tabs (TabsContent, TabsList, TabsTrigger)
- Tooltip (TooltipContent, TooltipProvider, TooltipTrigger)
- DropdownMenu (multiple sub-components)
- SlideoutHeader
```

#### 2. **Utility Functions**
```typescript
// Required utility functions
- cn() // className utility for conditional styling
- useScriptCopy() // Copy functionality hook
- useScriptDownload() // Download functionality hook
```

### Context & State Management

#### 1. **Voice Context** (`contexts/voice-context.tsx`)
```typescript
interface VoiceContext {
  currentVoice: VoiceType;
  setCurrentVoice: (voice: VoiceType) => void;
  availableVoices: VoiceType[];
}
```

#### 2. **Script Panel Context** (`contexts/script-panel-context.tsx`)
```typescript
interface ScriptPanelContext {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}
```

## Data Flow Architecture

### 1. **Input Processing Flow**
```
User Input → Hemingway Editor → Real-time Analysis → UI Update
         ↓
Voice Input → Transcription API → Content Integration → Editor Update
         ↓
AI Actions → Processing API → Content Transformation → Editor Update
```

### 2. **Save/Export Flow**
```
Content → Auto-save/Manual Save → Notes API → Database Storage
       ↓
Export → File Generation → Download → User Device
```

### 3. **Analysis Flow**
```
Content Change → Readability Service → Analysis Results → Sidebar Display
              → Script Analysis → Element Detection → Highlighting Update
              → Statistics Calculation → Toolbar Update
```

## Component Integration Requirements

### 1. **Editor Integration Points**
- **Content Management**: `value` and `onChange` props for content control
- **Analysis Callbacks**: `onAnalysisChange` for real-time analysis updates
- **Block Management**: `onBlocksChange` for structured content handling
- **Title Management**: `onTitleChange` for title updates

### 2. **Panel Integration**
- **Script Data**: Structured content with components, metrics, and hooks
- **Copy Functionality**: Integrated copy-to-clipboard with status feedback
- **Download System**: File export with customizable formats

### 3. **Toolbar Integration**
- **Context Awareness**: Different action sets based on content type
- **State Synchronization**: Consistent state between editor and toolbar
- **Voice Integration**: Recording and transcription coordination

## Security Requirements

### 1. **Authentication**
- **User Verification**: All save operations require authenticated users
- **Token Validation**: API endpoints validate Firebase Auth tokens
- **Permission Checks**: Feature access based on user roles

### 2. **Data Handling**
- **Input Sanitization**: All user input sanitized before processing
- **XSS Prevention**: Content rendering with proper escaping
- **CSRF Protection**: API endpoints protected against cross-site requests

### 3. **Privacy**
- **Voice Data**: Audio data processed securely and not stored permanently
- **Content Encryption**: Sensitive content encrypted in transit and at rest
- **User Isolation**: Content access restricted to content owners

## Performance Requirements

### 1. **Real-time Analysis**
- **Debounced Processing**: Analysis updates with 300ms debounce
- **Efficient Rendering**: Optimized highlighting and UI updates
- **Memory Management**: Cleanup of analysis resources on unmount

### 2. **Lazy Loading**
- **Component Loading**: Editor core lazy-loaded to reduce initial bundle size
- **Dynamic Imports**: Service modules loaded on demand
- **Code Splitting**: Separate bundles for different editor features

### 3. **Voice Processing**
- **Streaming**: Real-time audio capture and processing
- **Compression**: Efficient audio format for API transmission
- **Error Recovery**: Graceful handling of audio processing failures

## Migration Strategy

### Phase 1: Core Dependencies
1. **Install Required Packages**: Add all NPM dependencies to target project
2. **Create Services**: Migrate readability and script analysis services
3. **Setup Authentication**: Configure Firebase Auth integration
4. **Create API Endpoints**: Implement transcription and content APIs

### Phase 2: UI Components
1. **Base Components**: Ensure all required UI components are available
2. **Context Providers**: Set up voice and script panel contexts
3. **Utility Functions**: Migrate helper functions and hooks

### Phase 3: Editor Components
1. **Floating Toolbar**: Implement with proper context integration
2. **Script Panel System**: Create panel components and state management
3. **Hemingway Editor**: Main editor component with all features

### Phase 4: Integration & Testing
1. **Component Integration**: Connect all components with proper data flow
2. **API Integration**: Connect frontend to backend services
3. **Testing**: Comprehensive testing of all features
4. **Performance Optimization**: Bundle size and runtime optimization

## Configuration Options

### 1. **Analysis Settings**
```typescript
interface ReadabilitySettings {
  enableFleschKincaid: boolean;
  enableGunningFog: boolean;
  enableAutomatedReadability: boolean;
  targetGradeLevel: number;
  maxSentenceLength: number;
}
```

### 2. **Editor Configuration**
```typescript
interface EditorConfig {
  minRows: number;
  maxRows: number;
  autoFocus: boolean;
  readOnly: boolean;
  showTitleEditor: boolean;
  context: 'ideas' | 'notes' | scripts';
}
```

### 3. **Voice Settings**
```typescript
interface VoiceConfig {
  availableVoices: VoiceType[];
  defaultVoice: VoiceType;
  audioQuality: 'low' | 'medium' | 'high';
  enableTranscription: boolean;
}
```

## File Structure for Migration

```
src/
├── components/
│   └── editor/
│       ├── hemingway-editor.tsx
│       ├── hemingway-editor-wrapper.tsx
│       ├── floating-toolbar.tsx
│       └── script-panel/
│           ├── script-panel.tsx
│           ├── script-panel-components.tsx
│           └── script-panel-context.tsx
├── lib/
│   ├── enhanced-readability-service.ts
│   └── script-analysis.ts
├── contexts/
│   └── voice-context.tsx
├── hooks/
│   ├── use-script-copy.ts
│   └── use-script-download.ts
└── types/
    └── script-panel.ts
```

## Testing Requirements

### 1. **Unit Tests**
- **Service Testing**: Readability and script analysis services
- **Component Testing**: Individual component functionality
- **Hook Testing**: Custom hook behavior and state management

### 2. **Integration Tests**
- **API Integration**: Backend service connections
- **Component Integration**: Inter-component communication
- **Authentication Flow**: User authentication and authorization

### 3. **E2E Tests**
- **User Workflows**: Complete user journeys through editor
- **Voice Features**: Recording and transcription functionality
- **Save/Export**: Content persistence and export features

## Deployment Considerations

### 1. **Environment Variables**
```bash
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
GEMINI_API_KEY=your_gemini_api_key
```

### 2. **Build Configuration**
- **Code Splitting**: Separate bundles for editor components
- **Tree Shaking**: Remove unused dependencies
- **Compression**: Gzip compression for production builds

### 3. **CDN Integration**
- **Static Assets**: Audio processing libraries served from CDN
- **Font Loading**: Optimized font loading for better performance
- **Cache Strategy**: Appropriate cache headers for static resources

This comprehensive requirements document provides everything needed to successfully migrate and implement the Hemingway Editor system in a new application, ensuring all features and dependencies are properly addressed.