import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import type { Script, ScriptInsight } from '../../types';

export interface ScriptEditorProps {
  script?: Script;
  onSave?: (script: Script) => void;
  onExport?: (script: Script) => void;
  onRegenerate?: () => void;
  onVoicePreview?: (script: Script) => void;
  isLoading?: boolean;
}

const editorStyles = css`
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
    
    .header-content {
      flex: 1;
      
      h1 {
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-semibold);
        color: var(--color-neutral-800);
        margin: 0 0 var(--space-1) 0;
      }
      
      .header-subtitle {
        font-size: var(--font-size-body);
        color: var(--color-neutral-600);
        margin: 0;
      }
    }
    
    .header-actions {
      display: flex;
      gap: var(--space-2);
      flex-shrink: 0;
      
      @media (max-width: 768px) {
        flex-wrap: wrap;
      }
    }
  }
  
  .editor-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
    
    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
`;

const scriptEditorStyles = css`
  .script-title {
    margin-bottom: var(--space-4);
    
    .title-input {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      border: none;
      background: transparent;
      color: var(--color-neutral-800);
      width: 100%;
      padding: var(--space-2) 0;
      
      &:focus {
        outline: none;
        border-bottom: 2px solid var(--color-primary-500);
      }
      
      &::placeholder {
        color: var(--color-neutral-400);
      }
    }
  }
  
  .script-content {
    .content-editor {
      font-family: var(--font-family-primary);
      line-height: var(--line-height-relaxed);
      min-height: 400px;
    }
  }
  
  .script-structure-guide {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: var(--color-info-50);
    border: 1px solid var(--color-info-200);
    border-radius: var(--radius-medium);
    
    .guide-title {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-semibold);
      color: var(--color-info-700);
      margin: 0 0 var(--space-2) 0;
    }
    
    .guide-sections {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      
      .guide-section {
        font-size: var(--font-size-body-small);
        color: var(--color-info-600);
        
        .section-tag {
          font-weight: var(--font-weight-semibold);
          margin-right: var(--space-2);
        }
      }
    }
  }
`;

const insightsStyles = css`
  .insights-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    
    h2 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
    
    .insights-icon {
      font-size: 18px;
    }
  }
  
  .insights-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }
  
  .insight-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    
    &.success {
      background: var(--color-success-50);
      border: 1px solid var(--color-success-200);
    }
    
    &.warning {
      background: var(--color-warning-50);
      border: 1px solid var(--color-warning-200);
    }
    
    &.suggestion {
      background: var(--color-info-50);
      border: 1px solid var(--color-info-200);
    }
    
    .insight-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .insight-message {
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-normal);
      margin: 0;
      
      &.success { color: var(--color-success-600); }
      &.warning { color: var(--color-warning-600); }
      &.suggestion { color: var(--color-info-600); }
    }
  }
  
  .script-stats {
    padding: var(--space-4);
    background: var(--color-neutral-100);
    border-radius: var(--radius-medium);
    
    .stats-title {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin: 0 0 var(--space-2) 0;
    }
    
    .stats-content {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .stats-icon {
        font-size: 14px;
      }
    }
  }
`;

const actionsStyles = css`
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: stretch;
    
    .action-button {
      flex: 1;
    }
  }
`;

// Mock insights data
const mockInsights: ScriptInsight[] = [
  {
    id: '1',
    type: 'success',
    message: 'Engaging hook within 3 seconds',
    category: 'hook'
  },
  {
    id: '2',
    type: 'success',
    message: 'Clear problem-solution structure',
    category: 'structure'
  },
  {
    id: '3',
    type: 'success',
    message: 'Strong call-to-action',
    category: 'cta'
  },
  {
    id: '4',
    type: 'warning',
    message: 'Consider adding trending hashtags',
    category: 'optimization'
  },
  {
    id: '5',
    type: 'suggestion',
    message: 'Estimated engagement: High (based on similar content)',
    category: 'engagement'
  }
];

const mockScript: Script = {
  id: '1',
  title: 'Summer Skincare Routine for Teens',
  content: `[HOOK - First 3 seconds]
"Wait, you're using WHAT on your face this summer? 😱"

[PROBLEM - Seconds 3-6]
"If you're still using heavy moisturizers in this heat, your skin is probably feeling gross and oily..."

[SOLUTION - Seconds 6-12]
"Here's my 3-step summer skincare routine that keeps my skin glowing without the grease:

1. Gentle foam cleanser (removes sweat & sunscreen)
2. Lightweight serum with hyaluronic acid  
3. SPF 30+ moisturizer (non-comedogenic!)"

[CALL TO ACTION - Seconds 12-15]
"Try this for one week and comment your before/after! Follow for more teen skincare tips 💫"`,
  platform: 'tiktok',
  length: 'short',
  style: 'engaging',
  wordCount: 87,
  estimatedDuration: 15,
  insights: mockInsights,
  created: new Date(),
  updated: new Date()
};

const InsightIcon: React.FC<{ type: ScriptInsight['type'] }> = ({ type }) => {
  const icons = {
    success: '✅',
    warning: '⚠️',
    suggestion: '💡'
  };
  
  return <span className="insight-icon">{icons[type]}</span>;
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script = mockScript,
  onSave,
  onExport,
  onRegenerate,
  onVoicePreview,
  isLoading = false
}) => {
  const [editableScript, setEditableScript] = useState<Script>(script);

  const handleTitleChange = (title: string) => {
    setEditableScript(prev => ({ ...prev, title }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const wordCount = content.trim().split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 words per minute for speaking
    
    setEditableScript(prev => ({
      ...prev,
      content,
      wordCount,
      estimatedDuration,
      updated: new Date()
    }));
  };

  const handleSave = () => {
    onSave?.(editableScript);
  };

  const handleExport = () => {
    onExport?.(editableScript);
  };

  const handleVoicePreview = () => {
    onVoicePreview?.(editableScript);
  };

  return (
    <div css={editorStyles}>
      <div className="editor-header">
        <div className="header-content">
          <h1>Your Generated Script</h1>
          <p className="header-subtitle">Ready for refinement</p>
        </div>
        <div className="header-actions">
          <Button variant="subtle" onClick={onRegenerate} isDisabled={isLoading}>
            🔄 Regenerate
          </Button>
          <Button variant="subtle" onClick={handleVoicePreview}>
            🎤 Voice Preview
          </Button>
        </div>
      </div>

      <div className="editor-layout">
        <Card appearance="elevated" spacing="comfortable" css={scriptEditorStyles}>
          <div className="script-title">
            <input
              type="text"
              className="title-input"
              value={editableScript.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter script title..."
            />
          </div>

          <div className="script-content">
            <TextArea
              value={editableScript.content}
              onChange={handleContentChange}
              placeholder="Your script content will appear here..."
              size="large"
              className="content-editor"
              autoResize
            />
          </div>

          <div className="script-structure-guide">
            <h3 className="guide-title">📝 Script Structure Guide</h3>
            <div className="guide-sections">
              <div className="guide-section">
                <span className="section-tag">[HOOK]</span>
                Grab attention in the first 3 seconds
              </div>
              <div className="guide-section">
                <span className="section-tag">[PROBLEM]</span>
                Identify the pain point or challenge
              </div>
              <div className="guide-section">
                <span className="section-tag">[SOLUTION]</span>
                Present your solution or main content
              </div>
              <div className="guide-section">
                <span className="section-tag">[CTA]</span>
                End with a clear call-to-action
              </div>
            </div>
          </div>
        </Card>

        <Card appearance="subtle" spacing="comfortable" css={insightsStyles}>
          <div className="insights-header">
            <span className="insights-icon" aria-hidden="true">🔍</span>
            <h2>Script Insights</h2>
          </div>

          <div className="insights-list">
            {editableScript.insights.map(insight => (
              <div key={insight.id} className={`insight-item ${insight.type}`}>
                <InsightIcon type={insight.type} />
                <p className={`insight-message ${insight.type}`}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>

          <div className="script-stats">
            <h3 className="stats-title">📊 Script Stats</h3>
            <p className="stats-content">
              <span className="stats-icon" aria-hidden="true">📊</span>
              {editableScript.estimatedDuration} seconds • {editableScript.wordCount} words • {editableScript.platform} optimized
            </p>
          </div>
        </Card>
      </div>

      <CardFooter css={actionsStyles}>
        <Button variant="subtle" onClick={handleExport} className="action-button">
          📤 Export
        </Button>
        <Button variant="secondary" onClick={handleSave} className="action-button">
          💾 Save to Library
        </Button>
      </CardFooter>
    </div>
  );
};