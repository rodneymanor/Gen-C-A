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
}

// Styled Components
const EditorContainer = styled.div<{ focusMode: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${token('color.background.neutral')};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  position: relative;
  
  ${(props: any) => props.focusMode && css`
    .editor-sidebar,
    .editor-toolbar {
      opacity: 0;
      pointer-events: none;
      transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
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
  padding: ${token('space.200')} ${token('space.300')};
  border-bottom: 1px solid ${token('color.border')};
  background: ${token('color.background.neutral')};
  z-index: 10;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${token('space.100')};
`;

const EditorMain = styled.div<{ sidebarCollapsed: boolean }>`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const EditorContent = styled.div<{ sidebarCollapsed: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-right 250ms cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: ${(props: any) => props.sidebarCollapsed ? '0' : '320px'};
  
  @media (max-width: 1024px) {
    margin-right: 0;
  }
  
  @media (max-width: 768px) {
    margin-right: 0;
  }
  
  @media (max-width: 480px) {
    margin-right: 0;
  }
`;


const TextEditor = styled.textarea`
  flex: 1;
  padding: ${token('space.400')};
  font-size: 1rem;
  line-height: 1.6;
  color: ${token('color.text')};
  background: ${token('color.background.neutral')};
  border: none;
  resize: none;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  
  &::placeholder {
    color: ${token('color.text.subtlest')};
  }
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${token('color.background.neutral.subtle')};
    border-radius: ${token('border.radius')};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${token('color.background.neutral.bold')};
    border-radius: ${token('border.radius')};
    
    &:hover {
      background: #6b778c;
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
}) => {
  // State management
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle || 'Untitled Document');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const [focusMode, setFocusMode] = useState(initialFocusMode);
  const [activeTab, setActiveTab] = useState<'readability' | 'writing'>('readability');
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Calculate writing statistics
  const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characters = content.length;
  const charactersNoSpaces = content.replace(/\s/g, '').length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: token('space.200') }}>
          <EditIcon label="" size="medium" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
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
          
          {/* Text Editor */}
          <TextEditor
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your story here..."
            aria-label="Document content"
          />
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