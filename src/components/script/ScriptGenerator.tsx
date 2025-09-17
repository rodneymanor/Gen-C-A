import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import type { AIGenerationRequest, BrandPersona } from '../../types';
import { DEFAULT_BRAND_VOICE_ID } from '../../constants/brand-voices';

export interface ScriptGeneratorProps {
  onGenerate?: (request: AIGenerationRequest) => void;
  isLoading?: boolean;
  personas?: BrandPersona[];
  defaultPersonaId?: string;
}

const generatorStyles = css`
  .generator-header {
    margin-bottom: var(--space-6);
    
    h2 {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }
    
    .generator-subtitle {
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
`;

const promptSectionStyles = css`
  .prompt-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .prompt-suggestions {
    margin-top: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);

    .suggestion-chip {
      padding: var(--space-1) var(--space-3);
      background: var(--color-neutral-100);
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--radius-full);
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-700);
      cursor: pointer;
      transition: var(--transition-all);

      &:hover {
        background: var(--color-primary-50);
        border-color: var(--color-primary-300);
        color: var(--color-primary-700);
      }
    }
  }

  .generate-actions {
    margin-top: var(--space-4);
    display: flex;
    gap: var(--space-3);

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
`;

const settingsSectionStyles = css`
  .settings-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    
    h3 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin: 0;
    }
    
    .settings-icon {
      font-size: 18px;
    }
  }
  
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
`;

const brandVoiceSectionStyles = css`
  .brand-voice-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    
    h3 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin: 0;
    }
    
    .brand-icon {
      font-size: 18px;
    }
  }
  
  .persona-preview {
    margin-top: var(--space-3);
    padding: var(--space-3);
    background: var(--color-primary-50);
    border: 1px solid var(--color-primary-200);
    border-radius: var(--radius-medium);
    
    .preview-text {
      font-size: var(--font-size-body-small);
      color: var(--color-primary-700);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .preview-icon {
        font-size: 16px;
      }
    }
  }
`;

const actionsStyles = css`
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-button {
    min-width: 200px;
    
    @media (max-width: 768px) {
      min-width: auto;
    }
  }
`;

const lengthOptions = [
  { value: 'short', label: 'Short (15s)' },
  { value: 'medium', label: 'Medium (30s)' },
  { value: 'long', label: 'Long (60s+)' },
];

// Removed style and platform options as dropdowns are no longer displayed

const promptSuggestions = [
  'A fun TikTok about summer skincare routine for teens',
  'Educational YouTube video on productivity tips',
  'Instagram Reel showcasing morning routine',
  'Trending dance challenge with product placement',
  'Behind-the-scenes content for brand storytelling'
];

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  onGenerate,
  isLoading = false,
  personas = [],
  defaultPersonaId = DEFAULT_BRAND_VOICE_ID
}) => {
  const [formData, setFormData] = useState({
    prompt: '',
    length: 'medium',
    // Keep defaults for request payload, but no UI controls
    style: 'engaging',
    platform: 'tiktok' as const,
    persona: ''
  });

  React.useEffect(() => {
    if (formData.persona) return;
    if (!defaultPersonaId) return;
    const found = personas.find(p => p.id === defaultPersonaId);
    if (!found) return;
    setFormData(prev => ({ ...prev, persona: defaultPersonaId }));
  }, [defaultPersonaId, personas, formData.persona]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, prompt: suggestion }));
  };

  const handleGenerate = () => {
    console.log("🎬 [ScriptGenerator] Generate button clicked");
    console.log("📝 [ScriptGenerator] Current form data:", formData);
    
    if (!formData.prompt.trim()) {
      console.log("❌ [ScriptGenerator] No prompt provided, aborting");
      return;
    }
    
    const request: AIGenerationRequest = {
      prompt: formData.prompt,
      aiModel: 'creative',
      length: formData.length as 'short' | 'medium' | 'long',
      style: formData.style,
      platform: formData.platform,
      persona: formData.persona || undefined,
      additionalSettings: {}
    };
    
    console.log("📤 [ScriptGenerator] Calling onGenerate with request:", request);
    onGenerate?.(request);
    console.log("✅ [ScriptGenerator] onGenerate call completed");
  };

  const selectedPersona = personas.find(p => p.id === formData.persona);

  return (
    <Card appearance="elevated" spacing="comfortable" css={generatorStyles}>
      <div className="generator-header">
        <h2>What would you like to create today?</h2>
        <p className="generator-subtitle">
          Describe your video idea and let AI help you craft the perfect script
        </p>
      </div>

      <div className="form-grid">
        {/* Prompt Section */}
        <div css={promptSectionStyles}>
          <TextArea
            label="Video Idea"
            placeholder="Tell me about your video idea...

e.g., 'A fun TikTok about summer skincare routine for teens'"
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            size="large"
            showCharacterCount
            maxLength={1000}
            isRequired
            className="prompt-textarea"
            helperText="Describe your video concept, target audience, and any specific elements you want to include"
          />
          
          <div className="prompt-suggestions">
            {promptSuggestions.map(suggestion => (
              <button
                key={suggestion}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Generate Actions - positioned under input */}
          <div className="generate-actions">
            <Button
              variant="primary"
              size="large"
              onClick={handleGenerate}
              isLoading={isLoading}
              isDisabled={!formData.prompt.trim()}
              iconBefore="✨"
            >
              Generate Script
            </Button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="settings-grid">
          {/* AI Settings */}
          <Card appearance="subtle" spacing="comfortable" css={settingsSectionStyles}>
            <div className="settings-header">
              <span className="settings-icon" aria-hidden="true">🤖</span>
              <h3>Settings</h3>
            </div>
            
            <div className="form-fields">
              <div>
                <label htmlFor="length" style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-2)', 
                  fontSize: 'var(--font-size-body-small)', 
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-neutral-700)'
                }}>
                  Length
                </label>
                <select
                  id="length"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    border: '1px solid var(--color-neutral-300)',
                    borderRadius: 'var(--radius-medium)',
                    fontSize: 'var(--font-size-body)',
                    background: 'var(--color-neutral-0)',
                    minHeight: '40px'
                  }}
                >
                  {lengthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style and Platform dropdowns removed */}
            </div>
          </Card>

          {/* Brand Voice */}
          <Card appearance="subtle" spacing="comfortable" css={brandVoiceSectionStyles}>
            <div className="brand-voice-header">
              <span className="brand-icon" aria-hidden="true">👥</span>
              <h3>Brand Voice</h3>
            </div>
            
            <div>
              <label htmlFor="persona" style={{ 
                display: 'block', 
                marginBottom: 'var(--space-2)', 
                fontSize: 'var(--font-size-body-small)', 
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-neutral-700)'
              }}>
                Persona
              </label>
              <select
                id="persona"
                value={formData.persona}
                onChange={(e) => handleInputChange('persona', e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-medium)',
                  fontSize: 'var(--font-size-body)',
                  background: 'var(--color-neutral-0)',
                  minHeight: '40px'
                }}
              >
                <option value="">Select persona (optional)</option>
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPersona && (
              <div className="persona-preview">
                <p className="preview-text">
                  <span className="preview-icon" aria-hidden="true">✨</span>
                  This will create content that matches your "{selectedPersona.name}" brand personality
                </p>
              </div>
            )}

            {!selectedPersona && (
              <div className="persona-preview">
                <p className="preview-text">
                  <span className="preview-icon" aria-hidden="true">🎯</span>
                  Select a persona to match your brand voice, or we'll use a generic style
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

    </Card>
  );
};
