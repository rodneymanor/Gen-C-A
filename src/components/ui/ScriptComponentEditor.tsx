import React, { useState, useCallback } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
import EditIcon from '@atlaskit/icon/glyph/edit';
import SaveIcon from '@atlaskit/icon/glyph/check';
import CancelIcon from '@atlaskit/icon/glyph/cross';
import { Button } from './Button';

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface ScriptComponentEditorProps {
  scriptElements: ScriptElements;
  onScriptElementsChange: (elements: ScriptElements) => void;
  readOnly?: boolean;
}

// Styled Components
const ComponentGrid = styled.div`
  display: grid;
  gap: ${token('space.300')};
  padding: ${token('space.400')};
  height: 100%;
  overflow-y: auto;
`;

type ComponentComplexity = 'ok' | 'warning' | 'high' | 'critical';

const ComponentCard = styled.div<{ componentType: 'hook' | 'bridge' | 'nugget' | 'wta'; complexity: ComponentComplexity }>`
  border: 2px solid ${token('color.border')};
  border-radius: 12px;
  background: ${token('color.background.neutral')};
  padding: ${token('space.300')};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: ${(props: any) => {
      switch (props.complexity) {
        case 'ok': return token('color.border.accent.blue');
        case 'warning': return token('color.border.accent.yellow');
        case 'high': return token('color.border.accent.orange');
        case 'critical': return token('color.border.accent.red');
        default: return token('color.border.accent.blue');
      }
    }};
    background: ${(props: any) => {
      switch (props.complexity) {
        case 'ok': return token('color.background.accent.blue.subtler');
        case 'warning': return token('color.background.accent.yellow.subtler');
        case 'high': return token('color.background.accent.orange.subtler');
        case 'critical': return token('color.background.accent.red.subtler');
        default: return token('color.background.accent.blue.subtler');
      }
    }};
    box-shadow: ${token('elevation.shadow.raised')};
  }
`;

const ComponentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${token('space.200')};
`;

const ComponentLabel = styled.div<{ componentType: 'hook' | 'bridge' | 'nugget' | 'wta' }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props: any) => {
    switch (props.componentType) {
      case 'hook': return token('color.text.accent.yellow');
      case 'bridge': return token('color.text.accent.blue');
      case 'nugget': return token('color.text.accent.green');
      case 'wta': return token('color.text.accent.red');
      default: return token('color.text');
    }
  }};
  display: flex;
  align-items: center;
  gap: ${token('space.100')};
`;

const ComponentDescription = styled.div`
  font-size: 0.75rem;
  color: ${token('color.text.subtle')};
  margin-bottom: ${token('space.200')};
`;

const ComponentContent = styled.div`
  position: relative;
`;

const ComponentTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${token('space.200')};
  border: 1px solid ${token('color.border')};
  border-radius: ${token('border.radius')};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${token('color.text')};
  background: ${token('color.background.input')};
  resize: vertical;
  transition: border-color 150ms ease;

  &:focus {
    outline: none;
    border-color: ${token('color.border.focused')};
    box-shadow: 0 0 0 2px ${token('color.border.focused')};
  }

  &:read-only {
    background: ${token('color.background.disabled')};
    color: ${token('color.text.disabled')};
    cursor: not-allowed;
  }
`;

const ComponentPreview = styled.div`
  padding: ${token('space.200')};
  border: 1px solid ${token('color.border')};
  border-radius: ${token('border.radius')};
  background: ${token('color.background.neutral.subtle')};
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${token('color.text')};
  white-space: pre-wrap;
  min-height: 100px;
`;

const EditControls = styled.div`
  display: flex;
  gap: ${token('space.100')};
  margin-top: ${token('space.200')};
`;

const ComponentIcon = ({ type }: { type: 'hook' | 'bridge' | 'nugget' | 'wta' }) => {
  const icons = {
    hook: '🪝',
    bridge: '🌉',
    nugget: '💎',
    wta: '🎯'
  };
  return <span>{icons[type]}</span>;
};

export const ScriptComponentEditor: React.FC<ScriptComponentEditorProps> = ({
  scriptElements,
  onScriptElementsChange,
  readOnly = false
}) => {
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ScriptElements>(scriptElements);

  const componentConfigs = [
    {
      key: 'hook' as const,
      label: 'Hook',
      description: 'Attention-grabbing opener (First 3 seconds)',
      placeholder: 'Create an engaging hook that stops people from scrolling...'
    },
    {
      key: 'bridge' as const,
      label: 'Bridge',
      description: 'Transition that connects hook to main content',
      placeholder: 'Add a smooth transition that connects your hook to the main message...'
    },
    {
      key: 'goldenNugget' as const,
      label: 'Golden Nugget',
      description: 'Core value or main insight',
      placeholder: 'Share your main value proposition or key insight...'
    },
    {
      key: 'wta' as const,
      label: 'Call to Action',
      description: 'Compelling engagement prompt',
      placeholder: 'Add a compelling call-to-action that encourages engagement...'
    }
  ];

  const handleEdit = useCallback((componentKey: string) => {
    setEditingComponent(componentKey);
    setEditValues(scriptElements);
  }, [scriptElements]);

  const handleSave = useCallback((componentKey: string) => {
    onScriptElementsChange(editValues);
    setEditingComponent(null);
  }, [editValues, onScriptElementsChange]);

  const handleCancel = useCallback(() => {
    setEditValues(scriptElements);
    setEditingComponent(null);
  }, [scriptElements]);

  const handleTextChange = useCallback((componentKey: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [componentKey]: value
    }));
  }, []);

  const getComponentTypeForStyling = (key: string): 'hook' | 'bridge' | 'nugget' | 'wta' => {
    switch (key) {
      case 'goldenNugget': return 'nugget';
      default: return key as 'hook' | 'bridge' | 'wta';
    }
  };

  return (
    <ComponentGrid>
      {componentConfigs.map((config) => {
        const isEditing = editingComponent === config.key;
        const currentValue = scriptElements[config.key];
        const editValue = editValues[config.key];
        const componentType = getComponentTypeForStyling(config.key);
        // Heuristic complexity per component content
        const words = (currentValue || '').trim().split(/\s+/).filter(Boolean);
        const sentences = (currentValue || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWps = sentences.length ? words.length / sentences.length : words.length;
        const complexity: ComponentComplexity = avgWps >= 28 || words.length >= 180
          ? 'critical'
          : avgWps >= 22 || words.length >= 120
          ? 'high'
          : avgWps >= 16 || words.length >= 80
          ? 'warning'
          : 'ok';

        return (
          <ComponentCard key={config.key} componentType={componentType} complexity={complexity}>
            <ComponentHeader>
              <ComponentLabel componentType={componentType}>
                <ComponentIcon type={componentType} />
                {config.label}
              </ComponentLabel>
              {!readOnly && !isEditing && (
                <Button
                  variant="subtle"
                  size="small"
                  onClick={() => handleEdit(config.key)}
                  aria-label={`Edit ${config.label}`}
                >
                  <EditIcon label="" size="small" />
                </Button>
              )}
            </ComponentHeader>


            <ComponentContent>
              {isEditing ? (
                <>
                  <ComponentTextArea
                    value={editValue}
                    onChange={(e) => handleTextChange(config.key, e.target.value)}
                    placeholder={config.placeholder}
                    autoFocus
                  />
                  <EditControls>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleSave(config.key)}
                    >
                      <SaveIcon label="" size="small" />
                      Save
                    </Button>
                    <Button
                      variant="subtle"
                      size="small"
                      onClick={handleCancel}
                    >
                      <CancelIcon label="" size="small" />
                      Cancel
                    </Button>
                  </EditControls>
                </>
              ) : (
                <ComponentPreview>
                  {currentValue || `No ${config.label.toLowerCase()} content yet. Click edit to add content.`}
                </ComponentPreview>
              )}
            </ComponentContent>
          </ComponentCard>
        );
      })}
    </ComponentGrid>
  );
};
