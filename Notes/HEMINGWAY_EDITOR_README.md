# Hemingway Editor Component

A comprehensive, Hemingway-style script editor built with React, TypeScript, and Emotion. This editor provides advanced writing analysis, AI-powered assistance, and a distraction-free writing environment.

## Features

### Core Features
- **Rich Text Editor**: Full-featured textarea with custom styling and focus management
- **Editable Title**: Click-to-edit title with validation and keyboard shortcuts
- **Collapsible Sidebar**: Analysis panel with Readability and Writing tabs
- **Floating Toolbar**: Quick access to stats, actions, and AI tools
- **Focus Mode**: Distraction-free writing with fade-out UI elements
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Writing Analysis
- **Readability Score**: Real-time grade-level assessment (6th-12th grade)
- **Writing Issues Detection**:
  - Hard to read sentences
  - Very hard to read sentences
  - Adverbs usage
  - Passive voice
  - Complex phrases
- **Statistics Tracking**:
  - Word count
  - Character count (with/without spaces)
  - Sentence count
  - Paragraph count
  - Reading time estimation

### AI Integration
- **AI Actions Dropdown** with multiple enhancement options:
  - Copy text to clipboard
  - Improve writing clarity and flow
  - Humanize content (make more conversational)
  - Shorten text for conciseness
  - Professional tone adjustment
  - Casual tone adjustment
  - Remix content with fresh perspective

### Accessibility Features
- **WCAG AA Compliant** color contrast
- **Keyboard Navigation** support
- **Screen Reader Optimized** with proper ARIA labels
- **Focus Management** with visible focus indicators
- **Alternative Text** and semantic HTML structure

## Installation

```bash
npm install @emotion/react @emotion/styled @atlaskit/tokens lucide-react
```

## Usage

### Basic Usage

```tsx
import { HemingwayEditor } from '../components/ui/HemingwayEditor';

function MyEditor() {
  return (
    <HemingwayEditor
      initialContent="Start writing here..."
      initialTitle="My Document"
      onContentChange={(content) => console.log('Content:', content)}
      onTitleChange={(title) => console.log('Title:', title)}
    />
  );
}
```

### Advanced Usage

```tsx
import { HemingwayEditor } from '../components/ui/HemingwayEditor';

function AdvancedEditor() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  return (
    <HemingwayEditor
      initialContent={content}
      initialTitle={title}
      initialSidebarCollapsed={false}
      initialFocusMode={false}
      onContentChange={setContent}
      onTitleChange={setTitle}
      className="my-editor"
    />
  );
}
```

## Component Props

### HemingwayEditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `string` | `''` | Initial text content for the editor |
| `initialTitle` | `string` | `''` | Initial title for the document |
| `initialSidebarCollapsed` | `boolean` | `false` | Whether sidebar starts collapsed |
| `initialFocusMode` | `boolean` | `false` | Whether focus mode starts enabled |
| `onContentChange` | `(content: string) => void` | `undefined` | Callback when content changes |
| `onTitleChange` | `(title: string) => void` | `undefined` | Callback when title changes |
| `className` | `string` | `undefined` | Custom CSS class name |

## Sub-Components

### EditableTitle

A click-to-edit title component with validation and hover states.

```tsx
<EditableTitle
  value={title}
  onChange={setTitle}
  placeholder="Enter title..."
  maxLength={100}
  required={true}
  ariaLabel="Document title"
/>
```

### EditorSidebar

Collapsible analysis sidebar with tabbed interface.

```tsx
<EditorSidebar
  collapsed={false}
  onToggleCollapse={() => setCollapsed(!collapsed)}
  activeTab="readability"
  onTabChange={setActiveTab}
  readabilityMetrics={metrics}
  writingStats={stats}
/>
```

### FloatingToolbar

Bottom-positioned toolbar with document actions and AI tools.

```tsx
<FloatingToolbar
  stats={writingStats}
  canUndo={true}
  canRedo={false}
  onUndo={() => undo()}
  onRedo={() => redo()}
  onAIAction={(action) => handleAI(action)}
  onSave={() => save()}
  onExport={() => export()}
  onShare={() => share()}
  hidden={focusMode}
/>
```

## Keyboard Shortcuts

- **Ctrl/Cmd + S**: Save document
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y** or **Ctrl/Cmd + Shift + Z**: Redo
- **F11**: Toggle focus mode
- **Escape**: Exit dropdowns/modals
- **Enter**: Confirm title edit
- **Escape**: Cancel title edit

## Mobile Support

The editor is fully responsive with optimized layouts for different screen sizes:

### Desktop (1024px+)
- Full sidebar visible by default
- Floating toolbar with all options
- Hover states and tooltips

### Tablet (768px - 1024px)
- Sidebar overlays content when open
- Condensed toolbar layout
- Touch-optimized buttons

### Mobile (< 768px)
- Full-screen sidebar overlay
- Simplified toolbar
- Larger touch targets
- Optimized text input

## Styling

The editor uses Atlaskit Design Tokens for consistent theming:

### Custom CSS Variables
```css
.hemingway-editor {
  --editor-background: var(--color-background-neutral);
  --editor-text: var(--color-text);
  --editor-border: var(--color-border);
  --editor-focus: var(--color-border-focused);
}
```

### Theme Support
- Light theme (default)
- Dark theme support via Atlaskit tokens
- High contrast mode compatible
- Custom brand colors

## Performance Considerations

- **Lazy Loading**: Non-critical components load on demand
- **Memoization**: Expensive calculations are memoized
- **Debounced Updates**: Text analysis updates are debounced
- **Virtual Scrolling**: Large documents use virtual scrolling
- **Bundle Splitting**: Editor code is split into chunks

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+
- **Accessibility**: NVDA, JAWS, VoiceOver support

## API Integration

### Save/Load Documents
```tsx
const handleSave = async (content: string, title: string) => {
  await api.saveDocument({
    title,
    content,
    timestamp: new Date().toISOString()
  });
};

const handleLoad = async (documentId: string) => {
  const doc = await api.getDocument(documentId);
  setTitle(doc.title);
  setContent(doc.content);
};
```

### AI Service Integration
```tsx
const handleAIAction = async (action: string, text: string) => {
  const result = await aiService.enhance({
    action,
    text,
    language: 'en',
    style: 'hemingway'
  });
  
  setContent(result.enhancedText);
};
```

## Testing

### Unit Tests
```bash
npm run test -- HemingwayEditor
```

### Integration Tests
```bash
npm run test:integration -- editor
```

### Accessibility Tests
```bash
npm run test:a11y -- HemingwayEditor
```

## Troubleshooting

### Common Issues

**Editor not responsive on mobile**
- Ensure viewport meta tag is set
- Check CSS media queries are applied
- Verify touch events are enabled

**AI actions not working**
- Check AI service configuration
- Verify API keys are set
- Test network connectivity

**Performance issues with large documents**
- Enable virtual scrolling
- Reduce analysis frequency
- Consider pagination

### Debug Mode

Enable debug logging:
```tsx
<HemingwayEditor
  {...props}
  debug={true}
/>
```

## Contributing

See the main project CONTRIBUTING.md for guidelines on:
- Code style and formatting
- Testing requirements
- Pull request process
- Issue reporting

## License

Part of the Gen.C Alpha project. See LICENSE file for details.

---

*Last updated: September 2024*
*Component version: 1.0.0*