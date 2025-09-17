import React, { useState, useRef, useCallback, useEffect } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
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
import { useScriptGeneration } from '@/hooks/use-script-generation';
import type { BrandPersona } from '@/types';
import type { ScriptElements } from '@/lib/script-analysis';
import { DEFAULT_BRAND_VOICE_ID, DEFAULT_BRAND_VOICE_NAME, resolveDefaultBrandVoiceId } from '@/constants/brand-voices';

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

// Styled Components
const EditorContainer = styled.div<{ focusMode: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif);
  position: relative;

  ${(props: any) => props.focusMode && css`
    /* In focus mode, hide the sidebar; keep toolbar available for quick actions */
    .editor-sidebar {
      opacity: 0;
      pointer-events: none;
      transition: opacity 250ms ease;
    }

    &:hover .editor-sidebar {
      opacity: 1;
      pointer-events: auto;
    }
  `}
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${token('space.300', '0.75rem')};
  border-bottom: 1px solid var(--color-border-subtle, ${token('color.border', '#e4e6ea')});
  background: var(--card-bg, var(--color-surface, ${token('color.background.neutral', '#ffffff')}));
  z-index: 10;
  box-shadow: var(--shadow-subtle, none);
  height: 64px; /* Match sidebar header */
  
  /* Hide internal header on small screens to avoid stacking with Layout header */
  @media (max-width: 768px) {
    display: none;
  }
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
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  min-width: 0; /* Prevents grid item from overflowing */
  /* Ensure content never sits under the fixed toolbar */
  padding-bottom: var(--editor-toolbar-clearance, 56px);

  /* Grid takes care of sizing, no need for margins */
  .mobile-title { display: none; }
  @media (max-width: 768px) {
    .mobile-title { display: block; }
  }
`;


const TextEditor = styled.textarea`
  flex: 1;
  padding: ${token('space.400', '1rem')};
  font-size: var(--font-size-body, 1rem);
  line-height: var(--line-height-relaxed, 1.6);
  color: var(--color-text-primary, ${token('color.text', '#172b4d')});
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  border: none;
  resize: none;
  outline: none;
  font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif);
  transition: var(--transition-colors, all 0.25s ease);

  &::placeholder {
    color: var(--color-text-tertiary, ${token('color.text.subtlest', '#8993a4')});
  }

  &:focus {
    background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
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
  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastGeneratedBrandVoiceId, setLastGeneratedBrandVoiceId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [, forceRelativeRefresh] = useState(0);
  
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
  const handleRegenerateRef = useRef<(() => Promise<void>) | null>(null);
  const previousPersonaRef = useRef<string | null>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep editor content/title in sync with incoming props (e.g., navigation from generator)
  useEffect(() => {
    if (typeof initialContent === 'string' && initialContent !== content) {
      setContent(initialContent);
      setLastSaved(new Date());
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    }
  }, [initialContent, content]);

  useEffect(() => {
    if (typeof initialTitle === 'string') {
      const nextTitle = initialTitle.trim() ? initialTitle : 'Untitled Document';
      if (nextTitle !== title) {
        setTitle(nextTitle);
        setLastSaved(new Date());
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
          autosaveTimeoutRef.current = null;
        }
      }
    }
  }, [initialTitle, title]);

  useEffect(() => () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      forceRelativeRefresh(value => value + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
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
    lastSaved,
  };

  // Format "Saved ... ago" for header placement
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  // AI generation hook
  const { generateScript, isLoading: isGenLoading } = useScriptGeneration();

  // Handlers
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      setLastSaved(new Date());
      autosaveTimeoutRef.current = null;
    }, 1500);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
    scheduleAutosave();
  }, [onContentChange, scheduleAutosave]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    onTitleChange?.(newTitle);
    scheduleAutosave();
  }, [onTitleChange, scheduleAutosave]);

  // Handle script updates from InteractiveScript
  const handleInteractiveScriptUpdate = useCallback((updatedElements: ScriptElements) => {
    onScriptElementsChange?.(updatedElements);
    scheduleAutosave();
  }, [onScriptElementsChange, scheduleAutosave]);

  const handleScriptElementsChangeInternal = useCallback((elements: ScriptElements) => {
    onScriptElementsChange?.(elements);
    scheduleAutosave();
  }, [onScriptElementsChange, scheduleAutosave]);

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

  // Load brand voices for toolbar selector
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/brand-voices/list');
        const data = await res.json().catch(() => null);
        if (isMounted && res.ok && data?.success && Array.isArray(data.voices)) {
          const mapped: BrandPersona[] = data.voices.map((v: any) => {
            const isDefault = v.isDefault === true || v.id === DEFAULT_BRAND_VOICE_ID;
            return {
              id: v.id,
              name: isDefault ? DEFAULT_BRAND_VOICE_NAME : (v.name || v.id || ''),
              description: v.description || '',
              tone: v.tone || 'Varied',
              voice: v.voice || 'Derived from analysis',
              targetAudience: v.targetAudience || 'General',
              keywords: v.keywords || [],
              platforms: v.platforms || ['tiktok'],
              created: v.created ? new Date(v.created._seconds ? v.created._seconds * 1000 : v.created) : new Date(),
              isDefault,
            };
          });
          setPersonas(mapped);
          const resolvedDefaultId = resolveDefaultBrandVoiceId(mapped);
          const hasDefault = resolvedDefaultId ? mapped.some(p => p.id === resolvedDefaultId) : false;

          setSelectedPersonaId(prev => {
            if (prev) return prev;
            return hasDefault && resolvedDefaultId ? resolvedDefaultId : prev;
          });

          setLastGeneratedBrandVoiceId(prev => {
            if (prev !== null) return prev;
            if (hasDefault && resolvedDefaultId) {
              return resolvedDefaultId;
            }
            return '';
          });
        }
      } catch (_) {
        // silent fallback
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Decide script length for regeneration based on current word count
  const decideLength = useCallback((): "15" | "20" | "30" | "45" | "60" | "90" => {
    if (words < 80) return '15';
    if (words < 160) return '30';
    return '60';
  }, [words]);

  const deriveIdeaFromEditor = useCallback(() => {
    const baseTitle = (title && title !== 'Untitled Document') ? title : '';
    const sourceText = isScriptMode && scriptElements
      ? [scriptElements.hook, scriptElements.goldenNugget].filter(Boolean).join(' ')
      : content;
    const fallback = sourceText.trim().slice(0, 140);
    return baseTitle || fallback || 'Regenerate this short video script with the same intent';
  }, [title, isScriptMode, scriptElements, content]);

  const handleRegenerate = useCallback(async () => {
    if (!isScriptMode || !onScriptElementsChange) {
      console.log('Regenerate requested but not in script mode or no handler provided.');
      return;
    }
    try {
      setIsRegenerating(true);
      const idea = deriveIdeaFromEditor();
      const length = decideLength();
      const personaIdUsed = selectedPersonaId || resolveDefaultBrandVoiceId(personas) || '';

      const result = await generateScript(idea, length, personaIdUsed || undefined);
      if (result.success && result.script) {
        onScriptElementsChange({
          hook: result.script.hook,
          bridge: result.script.bridge,
          goldenNugget: result.script.goldenNugget,
          wta: result.script.wta,
        });
        setLastGeneratedBrandVoiceId(personaIdUsed);
      } else {
        console.error('[HemingwayEditor] Regenerate failed:', result.error);
      }
    } finally {
      setIsRegenerating(false);
    }
  }, [isScriptMode, onScriptElementsChange, deriveIdeaFromEditor, decideLength, selectedPersonaId, personas, generateScript]);

  // Keep the latest regenerate handler in a ref so persona effect doesn't retrigger when dependencies change
  useEffect(() => {
    handleRegenerateRef.current = handleRegenerate;
  }, [handleRegenerate]);

  // Trigger an automatic regenerate when the persona changes after mount
  useEffect(() => {
    if (!isScriptMode || !onScriptElementsChange) {
      previousPersonaRef.current = selectedPersonaId;
      return;
    }

    const previousPersona = previousPersonaRef.current;
    previousPersonaRef.current = selectedPersonaId;

    if (previousPersona === null) {
      // Skip first run on mount
      return;
    }

    if (previousPersona === selectedPersonaId) {
      return;
    }

    handleRegenerateRef.current?.();
  }, [selectedPersonaId, isScriptMode, onScriptElementsChange]);

  return (
    <EditorContainer focusMode={focusMode} className={className}>
      {/* Header */}
      <EditorHeader>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <EditableTitle
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            ariaLabel="Document title"
          />
        </div>
        
        <HeaderActions>
          {toolbarStats.lastSaved && (
            <span style={{
              fontSize: token('font.size.075', '12px'),
              color: token('color.text.subtlest', '#6b778c'),
              marginRight: token('space.100', '0.25rem')
            }}>
              Saved {formatLastSaved(toolbarStats.lastSaved)}
            </span>
          )}
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
          {/* Title (mobile only) */}
          <div className="mobile-title">
            <EditableTitle
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter your title here..."
              ariaLabel="Document title"
            />
          </div>
          
          {/* Content Editor - Script Mode or Text Mode */}
          {isScriptMode && scriptElements ? (
            enableAIActions ? (
              <InteractiveScript
                scriptElements={scriptElements}
                onScriptElementsChange={handleInteractiveScriptUpdate}
              />
            ) : (
              <ScriptComponentEditor
                scriptElements={scriptElements}
                onScriptElementsChange={handleScriptElementsChangeInternal}
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
        onRegenerate={handleRegenerate}
        isGenerating={isRegenerating || isGenLoading}
        brandVoices={personas}
        selectedBrandVoiceId={selectedPersonaId}
        onBrandVoiceChange={setSelectedPersonaId}
        activeBrandVoiceId={lastGeneratedBrandVoiceId ?? undefined}
        onSave={() => console.log('Save')}
        onExport={() => console.log('Export')}
        onShare={() => console.log('Share')}
        hidden={focusMode}
        className="editor-toolbar"
      />
    </EditorContainer>
  );
};
