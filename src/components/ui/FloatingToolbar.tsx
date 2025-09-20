import React, { useState, useRef, useEffect } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
import UndoIcon from '@atlaskit/icon/glyph/undo';
import RedoIcon from '@atlaskit/icon/glyph/redo';
import SparklesIcon from '@atlaskit/icon/glyph/star';
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import CopyIcon from '@atlaskit/icon/glyph/copy';
import WandIcon from '@atlaskit/icon/glyph/edit';
import UserIcon from '@atlaskit/icon/glyph/person';
import ScissorsIcon from '@atlaskit/icon/glyph/shortcut';
import VolumeIcon from '@atlaskit/icon/glyph/audio';
import ShuffleIcon from '@atlaskit/icon/glyph/app-switcher';
import TimerIcon from '@atlaskit/icon/glyph/stopwatch';
import { Button } from './Button';
import { ShinyButton } from '@/components/ui/ShinyButton';
import type { BrandVoice } from '@/types';
import { DEFAULT_BRAND_VOICE_NAME } from '@/constants/brand-voices';

export interface FloatingToolbarProps {
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
  /** Trigger full script regenerate (for script mode) */
  onRegenerate?: () => void;
  /** Callback for save action (removed from toolbar) */
  onSave?: () => void;
  /** Callback for export action (removed from toolbar) */
  onExport?: () => void;
  /** Callback for share action (removed from toolbar) */
  onShare?: () => void;
  /** Available brand voices to choose from */
  brandVoices?: BrandVoice[];
  /** Currently selected brand voice id */
  selectedBrandVoiceId?: string;
  /** Change handler for brand voice selection */
  onBrandVoiceChange?: (id: string) => void;
  /** Whether a generation/regeneration is in progress */
  isGenerating?: boolean;
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
  background: var(--color-surface);
  border: none;
  border-radius: ${token('border.radius.300')};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: ${token('space.100')};
  padding: ${token('space.100')} ${token('space.200')};
  z-index: 30;
  transition: all ${token('motion.duration.medium')} ${token('motion.easing.standard')};
  max-width: 90vw;
  /* Allow dropdowns to extend outside without clipping */
  overflow: visible;
  
  /* No scrollbars here; avoid creating clipping contexts */
  
  @media (max-width: 768px) {
    bottom: ${props => props.hidden ? '-100px' : token('space.200')};
    padding: ${token('space.100')};
    gap: ${token('space.075')};
  }
`;

const BrandVoiceBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${token('space.075')};
  padding: ${token('space.075')} ${token('space.150')};
  background: rgba(11, 92, 255, 0.12);
  border-radius: ${token('border.radius.200')};
  font-size: ${token('font.size.075')};
  color: var(--color-primary-700);
  font-weight: ${token('font.weight.medium')};

  .badge-label {
    text-transform: uppercase;
    font-size: ${token('font.size.050')};
    letter-spacing: 0.6px;
    color: ${token('color.text.subtle')};
  }

  .badge-value {
    font-weight: ${token('font.weight.semibold')};
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
  /* Solid white popup surface */
  background: #ffffff;
  border: 1px solid ${token('color.border')};
  border-radius: ${token('border.radius.200')};
  /* Subtle, reduced shadow */
  box-shadow: 0 8px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  padding: ${token('space.100')};
  min-width: 200px;
  z-index: 2147483000; /* Ensure dropdown appears over app UI */
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
    margin-bottom: 0;
  }
  
  .button-description {
    font-size: ${token('font.size.050')};
    color: ${token('color.text.subtlest')};
  }
`;

/* Removed LastSavedIndicator from toolbar; saved status moved to header */

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onAIAction,
  onRegenerate,
  onSave,
  onExport,
  onShare,
  brandVoices = [],
  selectedBrandVoiceId,
  onBrandVoiceChange,
  isGenerating = false,
  hidden = false,
  className,
}) => {
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [activeSection, setActiveSection] = useState<
    null | 'script' | 'quick' | 'style' | 'brand' | 'creative'
  >(null);

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
        setActiveSection(null);
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
    if (!isAIDropdownOpen) setActiveSection(null);
    setIsAIDropdownOpen(!isAIDropdownOpen);
  };

  const handleAIActionClick = (action: string) => {
    onAIAction?.(action);
    setIsAIDropdownOpen(false);
  };

  // Formatting now handled in header; toolbar doesn’t render saved indicator

  const currentBrandVoice = brandVoices?.find(v => v.id === selectedBrandVoiceId) || null;
  const brandVoiceName = currentBrandVoice?.name?.trim()
    || (selectedBrandVoiceId ? 'Custom voice' : (brandVoices && brandVoices.length > 0 ? DEFAULT_BRAND_VOICE_NAME : 'No brand voice'));

  return (
    <ToolbarContainer hidden={hidden} className={className}>
      <BrandVoiceBadge title={`Brand voice: ${brandVoiceName}`}>
        <UserIcon label="" size="small" />
        <span className="badge-label">Brand voice</span>
        <span className="badge-value">{brandVoiceName}</span>
      </BrandVoiceBadge>

      <ToolbarDivider />
      
      {/* Undo/Redo Actions */}
      <Button
        variant="subtle"
        size="small"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <UndoIcon label="" size="small" />
      </Button>
      <Button
        variant="subtle"
        size="small"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        <RedoIcon label="" size="small" />
      </Button>
      
      <ToolbarDivider />

      {/* AI Actions Dropdown */}
      <AIActionsDropdown>
        <ShinyButton
          ref={buttonRef as any}
          variant="white"
          onClick={handleAIButtonClick}
          aria-expanded={isAIDropdownOpen}
          aria-haspopup="true"
          aria-label="AI actions menu"
          style={{ height: 32, padding: '0 10px' }}
        >
          <SparklesIcon label="" size="small" />
          AI Actions
          <ChevronDownIcon 
            size={14} 
            style={{ 
              marginLeft: token('space.100'),
              transform: isAIDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${token('motion.duration.fast')} ${token('motion.easing.standard')}`
            }} 
          />
        </ShinyButton>
        
        <DropdownContent ref={dropdownRef} isOpen={isAIDropdownOpen}>
          {activeSection === null ? (
            <>
              <DropdownButton onClick={() => setActiveSection('script')}>
                <TimerIcon label="" size="small" />
                <div className="button-content">
                  <div className="button-title">Script</div>
                </div>
              </DropdownButton>
              <DropdownButton onClick={() => setActiveSection('quick')}>
                <CopyIcon label="" size="small" />
                <div className="button-content">
                  <div className="button-title">Quick Actions</div>
                </div>
              </DropdownButton>
              <DropdownButton onClick={() => setActiveSection('style')}>
                <VolumeIcon label="" size="small" />
                <div className="button-content">
                  <div className="button-title">Style & Tone</div>
                </div>
              </DropdownButton>
              {brandVoices && brandVoices.length > 0 && (
                <DropdownButton onClick={() => setActiveSection('brand')}>
                  <UserIcon label="" size="small" />
                  <div className="button-content">
                    <div className="button-title">Brand Voice</div>
                  </div>
                </DropdownButton>
              )}
              <DropdownButton onClick={() => setActiveSection('creative')}>
                <ShuffleIcon label="" size="small" />
                <div className="button-content">
                  <div className="button-title">Creative</div>
                </div>
              </DropdownButton>
            </>
          ) : (
            <>
              <DropdownButton onClick={() => setActiveSection(null)}>
                <UndoIcon label="" size="small" />
                <div className="button-content">
                  <div className="button-title">Back</div>
                </div>
              </DropdownButton>

              {activeSection === 'script' && (
                <DropdownButton
                  onClick={() => {
                    if (onRegenerate) {
                      onRegenerate();
                    } else {
                      handleAIActionClick('regenerate');
                    }
                  }}
                  disabled={isGenerating}
                >
                  <TimerIcon label="" size="small" />
                  <div className="button-content">
                    <div className="button-title">Regenerate Script</div>
                  </div>
                </DropdownButton>
              )}

              {activeSection === 'quick' && (
                <>
                  <DropdownButton onClick={() => handleAIActionClick('copy')}>
                    <CopyIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Copy Text</div>
                    </div>
                  </DropdownButton>
                  <DropdownButton onClick={() => handleAIActionClick('improve')}>
                    <WandIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Improve Writing</div>
                    </div>
                  </DropdownButton>
                </>
              )}

              {activeSection === 'style' && (
                <>
                  <DropdownButton onClick={() => handleAIActionClick('humanize')}>
                    <UserIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Humanize</div>
                    </div>
                  </DropdownButton>
                  <DropdownButton onClick={() => handleAIActionClick('shorten')}>
                    <ScissorsIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Shorten</div>
                    </div>
                  </DropdownButton>
                  <DropdownButton onClick={() => handleAIActionClick('tone-professional')}>
                    <VolumeIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Professional Tone</div>
                    </div>
                  </DropdownButton>
                  <DropdownButton onClick={() => handleAIActionClick('tone-casual')}>
                    <VolumeIcon label="" size="small" />
                    <div className="button-content">
                      <div className="button-title">Casual Tone</div>
                    </div>
                  </DropdownButton>
                </>
              )}

              {activeSection === 'brand' && (
                <>
                  {brandVoices && brandVoices.length > 0 ? (
                    <div style={{ padding: `${token('space.050')} ${token('space.100')}` }}>
                      <label htmlFor="brand-voice-select" style={{
                        display: 'block',
                        fontSize: token('font.size.050'),
                        color: token('color.text.subtle'),
                        marginBottom: token('space.050')
                      }}>
                        Select brand voice
                      </label>
                      <select
                        id="brand-voice-select"
                        value={selectedBrandVoiceId || ''}
                        onChange={(e) => onBrandVoiceChange?.(e.target.value)}
                        style={{
                          width: '100%',
                          padding: `${token('space.100')} ${token('space.150')}`,
                          border: `1px solid ${token('color.border')}`,
                          borderRadius: token('border.radius'),
                          background: token('color.background.input'),
                          color: token('color.text'),
                          minHeight: '40px'
                        }}
                      >
                        <option value="">No brand voice</option>
                        {brandVoices.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ padding: `${token('space.100')}` }}>
                      <div className="button-description">No brand voices found. Create one to use here.</div>
                    </div>
                  )}
                </>
              )}

              {activeSection === 'creative' && (
                <DropdownButton onClick={() => handleAIActionClick('remix')}>
                  <ShuffleIcon label="" size="small" />
                  <div className="button-content">
                    <div className="button-title">Remix</div>
                  </div>
                </DropdownButton>
              )}
            </>
          )}
        </DropdownContent>
      </AIActionsDropdown>
    </ToolbarContainer>
  );
};
