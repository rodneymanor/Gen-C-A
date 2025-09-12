import React, { useState, useRef, useEffect } from 'react';
import { styled, css } from '@emotion/react';
import { token } from '@atlaskit/tokens';
import { 
  Clock,
  RotateCcw,
  RotateCw,
  Sparkles,
  ChevronDown,
  Copy,
  Wand2,
  UserCheck,
  Scissors,
  Volume2,
  Shuffle,
  FileText,
  Hash,
  Timer,
  Save,
  Download,
  Share2,
  Settings
} from 'lucide-react';
import { Button } from './Button';

export interface WritingStats {
  words: number;
  characters: number;
  readingTime: number;
  lastSaved?: Date;
}

export interface FloatingToolbarProps {
  /** Writing statistics to display */
  stats: WritingStats;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
  /** Callback for undo action */
  onUndo?: () => void;
  /** Callback for redo action */
  onRedo?: () => void;
  /** Callback for AI actions */
  onAIAction?: (action: string) => void;
  /** Callback for save action */
  onSave?: () => void;
  /** Callback for export action */
  onExport?: () => void;
  /** Callback for share action */
  onShare?: () => void;
  /** Whether the toolbar should be hidden */
  hidden?: boolean;
  /** Custom class name */
  className?: string;
}

const ToolbarContainer = styled.div<{ hidden: boolean }>`
  position: fixed;
  bottom: ${props => props.hidden ? '-100px' : token('space.300')};
  left: 50%;
  transform: translateX(-50%);
  background: ${token('color.background.neutral')};
  border: 1px solid ${token('color.border')};
  border-radius: ${token('border.radius.300')};
  box-shadow: ${token('elevation.shadow.raised')};
  display: flex;
  align-items: center;
  gap: ${token('space.100')};
  padding: ${token('space.100')} ${token('space.200')};
  z-index: 30;
  transition: all ${token('motion.duration.medium')} ${token('motion.easing.standard')};
  max-width: 90vw;
  overflow-x: auto;
  
  /* Custom scrollbar for overflow */
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${token('color.background.neutral.subtle')};
    border-radius: ${token('border.radius')};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${token('color.background.neutral.bold')};
    border-radius: ${token('border.radius')};
  }
  
  @media (max-width: 768px) {
    bottom: ${props => props.hidden ? '-100px' : token('space.200')};
    padding: ${token('space.100')};
    gap: ${token('space.075')};
  }
`;

const StatsDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${token('space.200')};
  padding: 0 ${token('space.200')};
  font-size: ${token('font.size.075')};
  color: ${token('color.text.subtle')};
  white-space: nowrap;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: ${token('space.075')};
    
    .stat-icon {
      color: ${token('color.icon.subtle')};
    }
    
    .stat-value {
      font-weight: ${token('font.weight.medium')};
      color: ${token('color.text')};
    }
  }
  
  @media (max-width: 768px) {
    gap: ${token('space.150')};
    padding: 0 ${token('space.100')};
    
    .stat-item {
      font-size: ${token('font.size.050')};
      gap: ${token('space.050')};
    }
  }
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background: ${token('color.border')};
  margin: 0 ${token('space.100')};
  
  @media (max-width: 768px) {
    height: 20px;
    margin: 0 ${token('space.075')};
  }
`;

const AIActionsDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownContent = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: ${token('space.100')};
  background: ${token('color.background.neutral')};
  border: 1px solid ${token('color.border')};
  border-radius: ${token('border.radius.200')};
  box-shadow: ${token('elevation.shadow.overlay')};
  padding: ${token('space.100')};
  min-width: 200px;
  z-index: 40;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '8px'});
  transition: all ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  
  @media (max-width: 768px) {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    right: auto;
    transform: ${props => props.isOpen ? 'translate(-50%, -50%)' : 'translate(-50%, -40%)'};
    margin: 0;
    min-width: 280px;
    max-width: 90vw;
  }
`;

const DropdownHeader = styled.div`
  padding: ${token('space.150')} ${token('space.200')};
  border-bottom: 1px solid ${token('color.border')};
  margin-bottom: ${token('space.100')};
  
  h4 {
    margin: 0;
    font-size: ${token('font.size.100')};
    font-weight: ${token('font.weight.semibold')};
    color: ${token('color.text')};
    display: flex;
    align-items: center;
    gap: ${token('space.100')};
  }
  
  p {
    margin: ${token('space.050')} 0 0 0;
    font-size: ${token('font.size.075')};
    color: ${token('color.text.subtle')};
  }
`;

const DropdownSection = styled.div`
  margin-bottom: ${token('space.200')};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .section-label {
    font-size: ${token('font.size.050')};
    font-weight: ${token('font.weight.semibold')};
    color: ${token('color.text.subtle')};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: ${token('space.100')};
    padding: 0 ${token('space.100')};
  }
`;

const DropdownButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${token('space.150')};
  padding: ${token('space.150')} ${token('space.200')};
  background: none;
  border: none;
  border-radius: ${token('border.radius')};
  color: ${token('color.text')};
  font-size: ${token('font.size.075')};
  cursor: pointer;
  transition: all ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  text-align: left;
  
  &:hover {
    background: ${token('color.background.neutral.subtle.hovered')};
  }
  
  &:focus {
    outline: 2px solid ${token('color.border.focused')};
    outline-offset: -2px;
  }
  
  .button-icon {
    color: ${token('color.icon.subtle')};
    flex-shrink: 0;
  }
  
  .button-content {
    flex: 1;
  }
  
  .button-title {
    font-weight: ${token('font.weight.medium')};
    margin-bottom: ${token('space.025')};
  }
  
  .button-description {
    font-size: ${token('font.size.050')};
    color: ${token('color.text.subtlest')};
  }
`;

const LastSavedIndicator = styled.div`
  font-size: ${token('font.size.050')};
  color: ${token('color.text.subtlest')};
  display: flex;
  align-items: center;
  gap: ${token('space.050')};
  padding: 0 ${token('space.100')};
`;

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  stats,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onAIAction,
  onSave,
  onExport,
  onShare,
  hidden = false,
  className,
}) => {
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsAIDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAIDropdownOpen(false);
      }
    };

    if (isAIDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAIDropdownOpen]);

  const handleAIButtonClick = () => {
    setIsAIDropdownOpen(!isAIDropdownOpen);
  };

  const handleAIActionClick = (action: string) => {
    onAIAction?.(action);
    setIsAIDropdownOpen(false);
  };

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

  return (
    <ToolbarContainer hidden={hidden} className={className}>
      {/* Statistics Display */}
      <StatsDisplay>
        <div className="stat-item">
          <FileText className="stat-icon" size={14} />
          <span className="stat-value">{stats.words.toLocaleString()}</span>
          <span>words</span>
        </div>
        <div className="stat-item">
          <Hash className="stat-icon" size={14} />
          <span className="stat-value">{stats.characters.toLocaleString()}</span>
          <span>chars</span>
        </div>
        <div className="stat-item">
          <Clock className="stat-icon" size={14} />
          <span className="stat-value">{stats.readingTime}</span>
          <span>min read</span>
        </div>
      </StatsDisplay>
      
      <ToolbarDivider />
      
      {/* Last Saved Indicator */}
      {stats.lastSaved && (
        <>
          <LastSavedIndicator>
            <Save size={12} />
            <span>Saved {formatLastSaved(stats.lastSaved)}</span>
          </LastSavedIndicator>
          <ToolbarDivider />
        </>
      )}
      
      {/* Undo/Redo Actions */}
      <Button
        variant="subtle"
        size="small"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <RotateCcw size={16} />
      </Button>
      <Button
        variant="subtle"
        size="small"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <RotateCw size={16} />
      </Button>
      
      <ToolbarDivider />
      
      {/* Document Actions */}
      <Button
        variant="subtle"
        size="small"
        onClick={onSave}
        aria-label="Save"
        title="Save (Ctrl+S)"
      >
        <Save size={16} />
      </Button>
      
      <Button
        variant="subtle"
        size="small"
        onClick={onExport}
        aria-label="Export"
        title="Export document"
      >
        <Download size={16} />
      </Button>
      
      <Button
        variant="subtle"
        size="small"
        onClick={onShare}
        aria-label="Share"
        title="Share document"
      >
        <Share2 size={16} />
      </Button>
      
      <ToolbarDivider />
      
      {/* AI Actions Dropdown */}
      <AIActionsDropdown>
        <Button
          ref={buttonRef}
          variant="primary"
          size="small"
          onClick={handleAIButtonClick}
          aria-expanded={isAIDropdownOpen}
          aria-haspopup="true"
          aria-label="AI actions menu"
        >
          <Sparkles size={16} style={{ marginRight: token('space.100') }} />
          AI Actions
          <ChevronDown 
            size={14} 
            style={{ 
              marginLeft: token('space.100'),
              transform: isAIDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${token('motion.duration.fast')} ${token('motion.easing.standard')}`
            }} 
          />
        </Button>
        
        <DropdownContent ref={dropdownRef} isOpen={isAIDropdownOpen}>
          <DropdownHeader>
            <h4>
              <Sparkles size={16} />
              AI Writing Assistant
            </h4>
            <p>Enhance your writing with AI-powered tools</p>
          </DropdownHeader>
          
          <DropdownSection>
            <div className="section-label">Quick Actions</div>
            <DropdownButton onClick={() => handleAIActionClick('copy')}>
              <Copy className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Copy Text</div>
                <div className="button-description">Copy selected text to clipboard</div>
              </div>
            </DropdownButton>
            
            <DropdownButton onClick={() => handleAIActionClick('improve')}>
              <Wand2 className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Improve Writing</div>
                <div className="button-description">Enhance clarity and flow</div>
              </div>
            </DropdownButton>
          </DropdownSection>
          
          <DropdownSection>
            <div className="section-label">Style & Tone</div>
            <DropdownButton onClick={() => handleAIActionClick('humanize')}>
              <UserCheck className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Humanize</div>
                <div className="button-description">Make text more conversational</div>
              </div>
            </DropdownButton>
            
            <DropdownButton onClick={() => handleAIActionClick('shorten')}>
              <Scissors className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Shorten</div>
                <div className="button-description">Make text more concise</div>
              </div>
            </DropdownButton>
            
            <DropdownButton onClick={() => handleAIActionClick('tone-professional')}>
              <Volume2 className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Professional Tone</div>
                <div className="button-description">Adjust for business writing</div>
              </div>
            </DropdownButton>
            
            <DropdownButton onClick={() => handleAIActionClick('tone-casual')}>
              <Volume2 className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Casual Tone</div>
                <div className="button-description">Make it more relaxed</div>
              </div>
            </DropdownButton>
          </DropdownSection>
          
          <DropdownSection>
            <div className="section-label">Creative</div>
            <DropdownButton onClick={() => handleAIActionClick('remix')}>
              <Shuffle className="button-icon" size={16} />
              <div className="button-content">
                <div className="button-title">Remix</div>
                <div className="button-description">Rewrite with fresh perspective</div>
              </div>
            </DropdownButton>
          </DropdownSection>
        </DropdownContent>
      </AIActionsDropdown>
    </ToolbarContainer>
  );
};