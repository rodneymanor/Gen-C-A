import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
import {
  Sparkles,
  Wand2,
  Fish,
  Target,
  RefreshCw,
  Check,
  X,
  Loader2,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface AISuggestion {
  id: string;
  text: string;
  action: string;
  confidence?: number;
}

interface AISuggestionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: "hook" | "bridge" | "nugget" | "cta" | "micro-hook";
  originalText: string;
  onApply: (newText: string) => void;
  position: { x: number; y: number };
}

interface ActionConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  hasOptions?: boolean;
  options?: OptionConfig[];
}

interface OptionConfig {
  id: string;
  label: string;
  description: string;
}

type Step = 'actions' | 'options' | 'suggestions';

// Styled Components
const PopupOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.12);
  z-index: 2147483000; /* Extremely high to escape any stacking */
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
  transition: opacity 200ms ease;
`;

const PopupContainer = styled.div<{ position: { x: number; y: number }; isOpen: boolean }>`
  position: fixed;
  left: ${props => props.position.x}px;
  top: ${props => props.position.y}px;
  width: 320px;
  max-height: 400px;
  /* Solid white popup surface */
  background: #ffffff;
  border: 1px solid ${token('color.border')};
  /* Use app card radius (12px) */
  border-radius: var(--radius-large);
  /* Softer shadow to reduce visual weight */
  box-shadow: 0 8px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  z-index: 2147483001; /* Above overlay and other UI elements */
  transform: ${props => props.isOpen ? 'scale(1) translate(0, 0)' : 'scale(0.9) translate(-10px, -10px)'};
  /* Ensure full opacity when visible */
  opacity: 1;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible; /* Prevent inner elements from being clipped */
  pointer-events: auto;

  @media (max-width: 768px) {
    position: fixed;
    left: 10px;
    right: 10px;
    width: auto;
    max-width: calc(100vw - 20px);
  }
`;

const PopupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token('space.200')} ${token('space.300')};
  border-bottom: 1px solid ${token('color.border')};
  /* Solid white header */
  background: #ffffff;
  /* Match app card radius (12px) on header top corners */
  border-top-left-radius: var(--radius-large);
  border-top-right-radius: var(--radius-large);

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${token('color.text')};
    display: flex;
    align-items: center;
    gap: ${token('space.100')};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${token('color.text.subtle')};
  cursor: pointer;
  padding: ${token('space.050')};
  border-radius: var(--radius-large);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;

  &:hover {
    background: ${token('color.background.neutral.hovered')};
    color: ${token('color.text')};
  }
`;

const PopupContent = styled.div`
  padding: ${token('space.200')};
  max-height: 300px;
  overflow-y: auto;
`;

const StepContainer = styled.div<{ isVisible: boolean }>`
  display: ${props => props.isVisible ? 'block' : 'none'};
`;

const ActionGrid = styled.div`
  display: grid;
  gap: ${token('space.100')};
`;

const ActionButton = styled.button<{ isSelected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${token('space.200')};
  padding: ${token('space.200')};
  background: ${props => props.isSelected ? token('color.background.selected') : 'none'};
  border: 1px solid ${props => props.isSelected ? token('color.border.selected') : 'transparent'};
  border-radius: var(--radius-large);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 150ms ease;

  &:hover {
    background: ${token('color.background.neutral.hovered')};
    border-color: ${token('color.border.focused')};
  }

  .icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${token('color.text.accent.blue')};
  }

  .content {
    flex: 1;
    min-width: 0;

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${token('color.text')};
      margin: 0 0 ${token('space.050')} 0;
    }

    .description {
      font-size: 0.75rem;
      color: ${token('color.text.subtle')};
      margin: 0;
      line-height: 1.4;
    }
  }

  .arrow {
    flex-shrink: 0;
    color: ${token('color.text.subtlest')};
    margin-top: 2px;
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  gap: ${token('space.100')};
  margin-top: ${token('space.200')};
`;

const OptionButton = styled.button<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token('space.150')};
  background: ${props => props.isSelected ? token('color.background.selected') : 'none'};
  border: 1px solid ${props => props.isSelected ? token('color.border.selected') : token('color.border')};
  border-radius: var(--radius-large);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 150ms ease;

  &:hover {
    background: ${token('color.background.neutral.hovered')};
    border-color: ${token('color.border.focused')};
  }

  .content {
    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${token('color.text')};
      margin: 0 0 ${token('space.025')} 0;
    }

    .description {
      font-size: 0.75rem;
      color: ${token('color.text.subtle')};
      margin: 0;
    }
  }

  .check {
    color: ${token('color.text.accent.green')};
  }
`;

const SuggestionsContainer = styled.div`
  display: grid;
  gap: ${token('space.200')};
`;

const SuggestionCard = styled.div`
  border: 1px solid ${token('color.border')};
  /* Ensure suggestion cards match app card radius */
  border-radius: var(--radius-large);
  padding: ${token('space.200')};
  /* Solid white card */
  background: #ffffff;
`;

const SuggestionText = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${token('color.text')};
  margin-bottom: ${token('space.200')};
  white-space: pre-wrap;
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: ${token('space.100')};
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'subtle' }>`
  display: flex;
  align-items: center;
  gap: ${token('space.100')};
  padding: ${token('space.100')} ${token('space.200')};
  font-size: 0.75rem;
  border-radius: var(--radius-large);
  cursor: pointer;
  transition: all 150ms ease;
  border: 1px solid;

  ${props => props.variant === 'primary' ? css`
    background: ${token('color.background.accent.blue.subtler')};
    color: ${token('color.text.accent.blue')};
    border-color: ${token('color.border.accent.blue')};

    &:hover {
      background: ${token('color.background.accent.blue.subtle')};
    }
  ` : css`
    background: none;
    color: ${token('color.text.subtle')};
    border-color: ${token('color.border')};

    &:hover {
      background: ${token('color.background.neutral.hovered')};
      color: ${token('color.text')};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${token('space.400')};
  gap: ${token('space.200')};

  .spinner {
    color: ${token('color.text.accent.blue')};
    animation: spin 1s linear infinite;
  }

  .text {
    font-size: 0.875rem;
    color: ${token('color.text.subtle')};
    text-align: center;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${token('space.200')} ${token('space.300')};
  border-top: 1px solid ${token('color.border')};
  background: #ffffff;
`;

// Configuration for different section types
const SECTION_ACTIONS: Record<string, ActionConfig[]> = {
  hook: [
    {
      id: "simplify",
      label: "Simplify",
      description: "Make it easier to understand",
      icon: <Lightbulb size={16} />
    },
    {
      id: "generate_variations",
      label: "10 Hook Variations",
      description: "Generate multiple hook options",
      icon: <RefreshCw size={16} />
    },
    {
      id: "convert_hook_type",
      label: "Convert Hook Type",
      description: "Change to problem/benefit/curiosity hook",
      icon: <Target size={16} />,
      hasOptions: true,
      options: [
        { id: "problem", label: "Problem Hook", description: "Focus on a pain point" },
        { id: "benefit", label: "Benefit Hook", description: "Highlight the value" },
        { id: "curiosity", label: "Curiosity Hook", description: "Create intrigue" },
        { id: "question", label: "Question Hook", description: "Ask an engaging question" }
      ]
    },
    {
      id: "change_hook_style",
      label: "Change Hook Style",
      description: "Question, story, statistic, etc.",
      icon: <Wand2 size={16} />,
      hasOptions: true,
      options: [
        { id: "question", label: "Question Style", description: "Start with an engaging question" },
        { id: "story", label: "Story Style", description: "Begin with a personal story" },
        { id: "statistic", label: "Statistic Style", description: "Lead with compelling data" },
        { id: "metaphor", label: "Metaphor Style", description: "Use a powerful comparison" }
      ]
    }
  ],
  bridge: [
    {
      id: "strengthen_transition",
      label: "Strengthen Transition",
      description: "Improve the connection flow",
      icon: <ArrowRight size={16} />
    },
    {
      id: "add_curiosity",
      label: "Add Curiosity",
      description: "Make the transition more intriguing",
      icon: <HelpCircle size={16} />
    },
    {
      id: "simplify_bridge",
      label: "Simplify",
      description: "Make the transition clearer",
      icon: <Lightbulb size={16} />
    }
  ],
  nugget: [
    {
      id: "add_proof",
      label: "Add Proof",
      description: "Include supporting evidence",
      icon: <BarChart3 size={16} />
    },
    {
      id: "make_actionable",
      label: "Make Actionable",
      description: "Add specific steps or tips",
      icon: <Target size={16} />
    },
    {
      id: "enhance_value",
      label: "Enhance Value",
      description: "Strengthen the core insight",
      icon: <Sparkles size={16} />
    }
  ],
  cta: [
    {
      id: "add_urgency",
      label: "Add Urgency",
      description: "Create time-sensitive motivation",
      icon: <Target size={16} />
    },
    {
      id: "make_specific",
      label: "Make Specific",
      description: "Add clear, actionable steps",
      icon: <MessageSquare size={16} />
    },
    {
      id: "strengthen_benefit",
      label: "Strengthen Benefit",
      description: "Emphasize what they'll gain",
      icon: <Sparkles size={16} />
    }
  ]
};

export const AISuggestionPopup: React.FC<AISuggestionPopupProps> = ({
  isOpen,
  onClose,
  sectionType,
  originalText,
  onApply,
  position
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('actions');
  const [selectedAction, setSelectedAction] = useState<ActionConfig | null>(null);
  const [selectedOption, setSelectedOption] = useState<OptionConfig | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get actions for current section type
  const availableActions = SECTION_ACTIONS[sectionType] || SECTION_ACTIONS.hook;

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('actions');
      setSelectedAction(null);
      setSelectedOption(null);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle action selection
  const handleActionSelect = useCallback((action: ActionConfig) => {
    setSelectedAction(action);

    if (action.hasOptions) {
      setCurrentStep('options');
    } else {
      generateSuggestions(action.id);
    }
  }, []);

  // Handle option selection
  const handleOptionSelect = useCallback((option: OptionConfig) => {
    setSelectedOption(option);
    if (selectedAction) {
      generateSuggestions(selectedAction.id, option.id);
    }
  }, [selectedAction]);

  // Generate AI suggestions
  const generateSuggestions = useCallback(async (actionId: string, option?: string) => {
    setIsLoading(true);
    setCurrentStep('suggestions');

    try {
      const response = await fetch('/api/ai-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionType: actionId,
          text: originalText,
          option,
          sectionType
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API ${response.status}: ${errText || 'Request failed'}`);
      }

      const data = await response.json();

      if (data.success) {
        // Handle different response formats
        if (actionId === 'generate_variations') {
          // Parse numbered list into separate suggestions
          const variations = data.modifiedText
            .split(/\d+\./)
            .filter((text: string) => text.trim())
            .map((text: string, index: number) => ({
              id: `variation-${index}`,
              text: text.trim(),
              action: actionId,
              confidence: 0.8
            }));

          setSuggestions(variations);
        } else {
          // Single suggestion
          setSuggestions([{
            id: 'suggestion-1',
            text: data.modifiedText,
            action: actionId,
            confidence: 0.9
          }]);
        }
      } else {
        throw new Error(data.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([{
        id: 'error',
        text: `Error generating suggestions. Please try again.\n\nOriginal text:\n${originalText}`,
        action: actionId,
        confidence: 0
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [originalText, sectionType]);

  // Handle suggestion application
  const handleApplySuggestion = useCallback((suggestionText: string) => {
    onApply(suggestionText);
  }, [onApply]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentStep === 'suggestions') {
      if (selectedAction?.hasOptions) {
        setCurrentStep('options');
      } else {
        setCurrentStep('actions');
      }
    } else if (currentStep === 'options') {
      setCurrentStep('actions');
    }
  }, [currentStep, selectedAction]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSectionIcon = () => {
    switch (sectionType) {
      case 'hook':
      case 'micro-hook':
        return '🪝';
      case 'bridge':
        return '🌉';
      case 'nugget':
        return '💎';
      case 'cta':
        return '🎯';
      default:
        return '✨';
    }
  };

  const portalContent = (
    <PopupOverlay isOpen={isOpen} onClick={onClose}>
      <PopupContainer
        position={position}
        isOpen={isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <PopupHeader>
          <h3>
            <span>{getSectionIcon()}</span>
            AI Actions - {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}
          </h3>
          <CloseButton onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </PopupHeader>

        {/* Content */}
        <PopupContent>
          {/* Actions Step */}
          <StepContainer isVisible={currentStep === 'actions'}>
            <ActionGrid>
              {availableActions.map((action) => (
                <ActionButton
                  key={action.id}
                  onClick={() => handleActionSelect(action)}
                >
                  <div className="icon">
                    {action.icon}
                  </div>
                  <div className="content">
                    <div className="label">{action.label}</div>
                    <div className="description">{action.description}</div>
                  </div>
                  <div className="arrow">
                    {action.hasOptions ? <ChevronDown size={16} /> : <ArrowRight size={16} />}
                  </div>
                </ActionButton>
              ))}
            </ActionGrid>
          </StepContainer>

          {/* Options Step */}
          <StepContainer isVisible={currentStep === 'options'}>
            {selectedAction && (
              <OptionsGrid>
                {selectedAction.options?.map((option) => (
                  <OptionButton
                    key={option.id}
                    isSelected={selectedOption?.id === option.id}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="content">
                      <div className="label">{option.label}</div>
                      <div className="description">{option.description}</div>
                    </div>
                    {selectedOption?.id === option.id && (
                      <div className="check">
                        <Check size={16} />
                      </div>
                    )}
                  </OptionButton>
                ))}
              </OptionsGrid>
            )}
          </StepContainer>

          {/* Suggestions Step */}
          <StepContainer isVisible={currentStep === 'suggestions'}>
            {isLoading ? (
              <LoadingContainer>
                <Loader2 size={24} className="spinner" />
                <div className="text">Generating AI suggestions...</div>
              </LoadingContainer>
            ) : (
              <SuggestionsContainer>
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id}>
                    <SuggestionText>{suggestion.text}</SuggestionText>
                    <SuggestionActions>
                      <Button variant="primary" onClick={() => handleApplySuggestion(suggestion.text)}>
                        <Check size={14} />
                        Apply
                      </Button>
                    </SuggestionActions>
                  </SuggestionCard>
                ))}
              </SuggestionsContainer>
            )}
          </StepContainer>
        </PopupContent>

        {/* Navigation */}
        {(currentStep !== 'actions') && (
          <Navigation>
            <Button onClick={handleBack}>
              Back
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </Navigation>
        )}
      </PopupContainer>
    </PopupOverlay>
  );

  // Render into portal to escape any stacking contexts/overflow
  return typeof document !== 'undefined' ? createPortal(portalContent, document.body) : portalContent;
};
