import React, { useState, useRef, useCallback, useEffect } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
import EditIcon from '@atlaskit/icon/glyph/edit';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import EyeOffIcon from '@atlaskit/icon/glyph/cross-circle';
import ChevronRightIcon from '@atlaskit/icon/glyph/chevron-right';
import ChevronLeftIcon from '@atlaskit/icon/glyph/chevron-left';
import { Button } from './Button';
import { EditableTitle } from './EditableTitle';
import { EditorSidebar } from './EditorSidebar';
import { FloatingToolbar } from './FloatingToolbar';
import { ScriptComponentEditor } from './ScriptComponentEditor';
import { InteractiveScript } from '../writing-analysis/interactive-script';

// Re-export interfaces from child components for convenience
export type { ReadabilityMetrics, WritingStats } from './EditorSidebar';
export type { WritingStats as ToolbarStats } from './FloatingToolbar';

export interface HemingwayEditorProps {
  /** Initial content for the editor */
  initialContent?: string;
  /** Initial title for the document */
  initialTitle?: string;
  /** Whether the sidebar should be collapsed initially */
  initialSidebarCollapsed?: boolean;
  /** Whether focus mode should be enabled initially */
  initialFocusMode?: boolean;
  /** Callback when content changes */
  onContentChange?: (content: string) => void;
  /** Callback when title changes */
  onTitleChange?: (title: string) => void;
  /** Custom class name for the editor */
  className?: string;
  /** Script elements for structured script editing */
  scriptElements?: ScriptElements | null;
  /** Whether the editor is in script mode */
  isScriptMode?: boolean;
  /** Callback when script elements change */
  onScriptElementsChange?: (elements: ScriptElements) => void;
  /** Whether to enable AI-powered interactive script editing */
  enableAIActions?: boolean;
}

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

// Styled Components
const EditorContainer = styled.div<{ focusMode: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif);
  position: relative;

  ${(props: any) => props.focusMode && css`
    .editor-sidebar,
    .editor-toolbar {
      opacity: 0;
      pointer-events: none;
      transition: opacity 250ms ease;
    }

    &:hover .editor-sidebar,
    &:hover .editor-toolbar {
      opacity: 1;
      pointer-events: auto;
    }
  `}
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token('space.200', '0.5rem')} ${token('space.300', '0.75rem')};
  border-bottom: 1px solid var(--color-border, ${token('color.border', '#e4e6ea')});
  background: var(--card-bg, var(--color-surface, ${token('color.background.neutral', '#ffffff')}));
  z-index: 10;
  box-shadow: var(--shadow-subtle, none);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${token('space.100', '0.25rem')};
`;

const EditorMain = styled.div<{ sidebarCollapsed: boolean }>`
  display: grid;
  grid-template-columns: ${(props: any) => props.sidebarCollapsed ? '1fr' : '1fr 320px'};
  flex: 1;
  overflow: hidden;
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  transition: grid-template-columns 250ms ease;
  gap: 0;

  @media (max-width: 1024px) {
    grid-template-columns: ${(props: any) => props.sidebarCollapsed ? '1fr' : '1fr 280px'};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: ${(props: any) => props.sidebarCollapsed ? '1fr' : 'auto 1fr'};
  }
`;

const EditorContent = styled.div<{ sidebarCollapsed: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface-elevated, ${token('color.background.neutral', '#fafbfc')});
  min-width: 0; /* Prevents grid item from overflowing */

  /* Grid takes care of sizing, no need for margins */
`;


const TextEditor = styled.textarea`
  flex: 1;
  padding: ${token('space.400', '1rem')};
  font-size: var(--font-size-body, 1rem);
  line-height: var(--line-height-relaxed, 1.6);
  color: var(--color-text-primary, ${token('color.text', '#172b4d')});
  background: var(--color-surface-elevated, ${token('color.background.input', '#fafbfc')});
  border: none;
  resize: none;
  outline: none;
  font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif);
  transition: var(--transition-colors, all 0.25s ease);

  &::placeholder {
    color: var(--color-text-tertiary, ${token('color.text.subtlest', '#8993a4')});
  }

  &:focus {
    background: var(--color-surface-elevated, ${token('color.background.input', '#ffffff')});
    box-shadow: var(--focus-ring-shadow, ${token('elevation.shadow.raised', '0 0 0 2px var(--color-primary-200)')});
    outline: var(--focus-ring-primary, 2px solid var(--color-primary-500));
    outline-offset: -2px;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-surface-hover, ${token('color.background.neutral.subtle', '#e4e6ea')});
    border-radius: var(--radius-medium, ${token('border.radius.200', '0.5rem')});
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border, ${token('color.background.neutral.bold', '#8993a4')});
    border-radius: var(--radius-medium, ${token('border.radius.200', '0.5rem')});

    &:hover {
      background: var(--color-border-strong, ${token('color.background.brand.bold', '#0B5CFF')});
    }
  }
`;


export const HemingwayEditor: React.FC<HemingwayEditorProps> = ({
  initialContent = '',
  initialTitle = '',
  initialSidebarCollapsed = false,
  initialFocusMode = false,
  onContentChange,
  onTitleChange,
  className,
  scriptElements = null,
  isScriptMode = false,
  onScriptElementsChange,
  enableAIActions = false,
}) => {
  // State management
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle || 'Untitled Document');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [focusMode, setFocusMode] = useState(initialFocusMode);
  const [activeTab, setActiveTab] = useState<'readability' | 'writing'>('readability');
  
  // Log script mode status
  useEffect(() => {
    console.log('🎬 [HemingwayEditor] Script mode status:', {
      isScriptMode,
      hasScriptElements: !!scriptElements,
      scriptElementsKeys: scriptElements ? Object.keys(scriptElements) : []
    });
  }, [isScriptMode, scriptElements]);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Calculate writing statistics - handle both script and regular mode
  const getContentForStats = () => {
    if (isScriptMode && scriptElements) {
      // Combine all script elements for statistics
      return [
        scriptElements.hook,
        scriptElements.bridge,
        scriptElements.goldenNugget,
        scriptElements.wta
      ].filter(Boolean).join(' ');
    }
    return content;
  };

  const statsContent = getContentForStats();
  const words = statsContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characters = statsContent.length;
  const charactersNoSpaces = statsContent.replace(/\s/g, '').length;
  const sentences = statsContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = statsContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTime = Math.ceil(words / 200); // 200 wpm average
  
  // Mock readability data for demonstration
  const readabilityMetrics = {
    score: Math.max(60, Math.min(95, 90 - Math.floor(words / 50))), // Simple heuristic
    grade: words < 100 ? '6th Grade' : words < 300 ? '8th Grade' : '10th Grade',
    issues: {
      hardToRead: Math.floor(sentences * 0.1),
      veryHardToRead: Math.floor(sentences * 0.02),
      adverbs: Math.floor(words * 0.03),
      passiveVoice: Math.floor(sentences * 0.05),
      complexPhrases: Math.floor(sentences * 0.08),
    },
  };
  
  const writingStats = {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTime,
  };
  
  const toolbarStats = {
    words,
    characters,
    readingTime,
    lastSaved: new Date(Date.now() - 300000), // 5 minutes ago
  };

  // Handlers
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  }, [onContentChange]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    onTitleChange?.(newTitle);
  }, [onTitleChange]);

  // Helper function to convert script elements to formatted text for InteractiveScript
  const formatScriptElementsToText = useCallback((elements: ScriptElements): string => {
    const sections = [];

    if (elements.hook) {
      sections.push(`[HOOK - First 3 seconds]\n${elements.hook}`);
    }

    if (elements.bridge) {
      sections.push(`[BRIDGE - Transition]\n${elements.bridge}`);
    }

    if (elements.goldenNugget) {
      sections.push(`[GOLDEN NUGGET - Main Value]\n${elements.goldenNugget}`);
    }

    if (elements.wta) {
      sections.push(`[WTA - Call to Action]\n${elements.wta}`);
    }

    return sections.join('\n\n');
  }, []);

  // Helper function to parse formatted text back to script elements
  const parseTextToScriptElements = useCallback((text: string): ScriptElements => {
    const result: ScriptElements = {
      hook: '',
      bridge: '',
      goldenNugget: '',
      wta: ''
    };

    // Split by sections with square bracket headers
    const sections = text.split(/\n\s*\n/).filter(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) continue;

      const headerLine = lines[0];
      const contentLines = lines.slice(1);
      const contentText = contentLines.join('\n').trim();

      // Match square bracket headers
      const squareBracketMatch = headerLine.match(/^\[([^\]]+)\]/i);
      if (squareBracketMatch) {
        const label = squareBracketMatch[1].toLowerCase();

        if (label.startsWith('hook')) {
          result.hook = contentText;
        } else if (label.startsWith('bridge')) {
          result.bridge = contentText;
        } else if (label.startsWith('golden nugget')) {
          result.goldenNugget = contentText;
        } else if (label.startsWith('wta') || label.startsWith('call to action')) {
          result.wta = contentText;
        }
      }
    }

    return result;
  }, []);

  // Handle script updates from InteractiveScript
  const handleInteractiveScriptUpdate = useCallback((updatedScript: string) => {
    const updatedElements = parseTextToScriptElements(updatedScript);
    onScriptElementsChange?.(updatedElements);
  }, [parseTextToScriptElements, onScriptElementsChange]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            console.log('Save shortcut');
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              console.log('Undo shortcut');
            }
            break;
          case 'y':
          case 'Z':
            if (e.shiftKey) {
              e.preventDefault();
              console.log('Redo shortcut');
            }
            break;
        }
      }
      
      if (e.key === 'F11') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <EditorContainer focusMode={focusMode} className={className}>
      {/* Header */}
      <EditorHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: token('space.200', '0.5rem') }}>
          <EditIcon label="" size="medium" primaryColor={token('color.background.brand.bold', '#0B5CFF')} />
          <span style={{
            fontWeight: token('font.weight.medium', '500'),
            fontSize: '0.875rem',
            color: token('color.text', '#172b4d')
          }}>
            Hemingway Editor
          </span>
        </div>
        
        <HeaderActions>
          <Button
            variant="subtle"
            size="small"
            onClick={toggleFocusMode}
            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {focusMode ? <EyeIcon label="" size="small" /> : <EyeOffIcon label="" size="small" />}
          </Button>
          
          <Button
            variant="subtle"
            size="small"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? <ChevronLeftIcon label="" size="small" /> : <ChevronRightIcon label="" size="small" />}
          </Button>
        </HeaderActions>
      </EditorHeader>

      {/* Main Editor Area */}
      <EditorMain sidebarCollapsed={sidebarCollapsed}>
        <EditorContent sidebarCollapsed={sidebarCollapsed}>
          {/* Title */}
          <EditableTitle
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter your title here..."
            ariaLabel="Document title"
          />
          
          {/* Content Editor - Script Mode or Text Mode */}
          {isScriptMode && scriptElements ? (
            enableAIActions ? (
              <InteractiveScript
                script={formatScriptElementsToText(scriptElements)}
                onScriptUpdate={handleInteractiveScriptUpdate}
              />
            ) : (
              <ScriptComponentEditor
                scriptElements={scriptElements}
                onScriptElementsChange={onScriptElementsChange || (() => {})}
                readOnly={false}
              />
            )
          ) : (
            <TextEditor
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your story here..."
              aria-label="Document content"
            />
          )}
        </EditorContent>

        {/* Sidebar */}
        <EditorSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          readabilityMetrics={readabilityMetrics}
          writingStats={writingStats}
          className="editor-sidebar"
        />
      </EditorMain>

      {/* Floating Toolbar */}
      <FloatingToolbar
        stats={toolbarStats}
        canUndo={false} // TODO: Implement undo/redo functionality
        canRedo={false}
        onUndo={() => console.log('Undo')}
        onRedo={() => console.log('Redo')}
        onAIAction={(action) => console.log('AI Action:', action)}
        onSave={() => console.log('Save')}
        onExport={() => console.log('Export')}
        onShare={() => console.log('Share')}
        hidden={focusMode}
        className="editor-toolbar"
      />
    </EditorContainer>
  );
};