import React, { useState } from 'react';
import { css } from '@emotion/react';
import Form, { Field, HelperMessage, ErrorMessage } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import type { AIGenerationRequest, BrandVoice, Platform } from '../../types';

// Atlassian Design System Icons
import RobotIcon from '@atlaskit/icon/glyph/emoji/objects';
import PeopleIcon from '@atlaskit/icon/glyph/people';
import TargetIcon from '@atlaskit/icon/glyph/discover';
import StarIcon from '@atlaskit/icon/glyph/star';
import AudioIcon from '@atlaskit/icon/glyph/audio';

export interface EnhancedScriptGeneratorProps {
  onGenerate?: (request: AIGenerationRequest) => void;
  onVoiceInput?: () => void;
  isLoading?: boolean;
  brandVoices?: BrandVoice[];
  fallbackToOriginal?: boolean;
}

const generatorStyles = css`
  .enhanced-generator {
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

    /* Atlassian Form Overrides */
    .atlassian-form-field {
      margin-bottom: var(--atlassian-space-300);

      /* Style form labels to match our design system */
      label {
        font-size: var(--atlassian-font-size-075);
        font-weight: var(--atlassian-font-weight-semibold);
        color: var(--atlassian-color-text);
        margin-bottom: var(--atlassian-space-100);
        display: block;
      }

      /* Style Atlassian components to use our tokens */
      [data-ds--text-field--container] {
        border-color: var(--atlassian-color-border-input);
        border-radius: var(--atlassian-border-radius-200);
        
        &:focus-within {
          border-color: var(--atlassian-color-border-focused);
          box-shadow: 0 0 0 2px var(--atlassian-color-background-selected);
        }
      }

      [data-ds--text-field--input] {
        font-family: var(--font-family-primary);
        font-size: var(--atlassian-font-size-100);
        color: var(--atlassian-color-text);
        
        &::placeholder {
          color: var(--atlassian-color-text-subtlest);
        }
      }

      /* Select component styling */
      .react-select__control {
        border-color: var(--atlassian-color-border-input);
        border-radius: var(--atlassian-border-radius-200);
        min-height: var(--interactive-height-md);

        &:hover {
          border-color: var(--atlassian-color-border-default);
        }
        
        &--is-focused {
          border-color: var(--atlassian-color-border-focused);
          box-shadow: 0 0 0 2px var(--atlassian-color-background-selected);
        }
      }

      .react-select__placeholder {
        color: var(--atlassian-color-text-subtlest);
        font-size: var(--atlassian-font-size-100);
      }

      .react-select__single-value {
        color: var(--atlassian-color-text);
        font-size: var(--atlassian-font-size-100);
      }

      .react-select__menu {
        border-radius: var(--atlassian-border-radius-200);
        box-shadow: var(--atlassian-elevation-shadow-overlay);
      }

      .react-select__option {
        font-size: var(--atlassian-font-size-100);
        color: var(--atlassian-color-text);
        
        &--is-selected {
          background-color: var(--atlassian-color-background-selected);
          color: var(--atlassian-color-text);
        }
        
        &--is-focused {
          background-color: var(--atlassian-color-background-selected-hovered);
        }
      }
    }
  }
`;

const promptSectionStyles = css`
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
  
  .brand-voice-preview {
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

const aiModelOptions = [
  { label: 'Creative (Recommended)', value: 'creative' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Precise', value: 'precise' },
];

const lengthOptions = [
  { label: 'Short (15s)', value: 'short' },
  { label: 'Medium (30s)', value: 'medium' },
  { label: 'Long (60s+)', value: 'long' },
];

const styleOptions = [
  { label: 'Engaging', value: 'engaging' },
  { label: 'Educational', value: 'educational' },
  { label: 'Promotional', value: 'promotional' },
  { label: 'Storytelling', value: 'storytelling' },
];

const platformOptions = [
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Twitter', value: 'twitter' },
];

const promptSuggestions = [
  'A fun TikTok about summer skincare routine for teens',
  'Educational YouTube video on productivity tips',
  'Instagram Reel showcasing morning routine',
  'Trending dance challenge with product placement',
  'Behind-the-scenes content for brand storytelling'
];

export const EnhancedScriptGenerator: React.FC<EnhancedScriptGeneratorProps> = ({
  onGenerate,
  onVoiceInput,
  isLoading = false,
  brandVoices = [],
  fallbackToOriginal = false
}) => {
  const [promptValue, setPromptValue] = useState('');

  const handleSuggestionClick = (suggestion: string) => {
    setPromptValue(suggestion);
  };

  const handleSubmit = (data: any) => {
    if (!data.prompt?.trim()) return;
    
    const request: AIGenerationRequest = {
      prompt: data.prompt,
      aiModel: data.aiModel?.value || 'creative',
      length: (data.length?.value || 'short') as 'short' | 'medium' | 'long',
      style: data.style?.value || 'engaging',
      platform: (data.platform?.value || 'tiktok') as Platform,
      brandVoiceId: data.brandVoice?.value || undefined,
      additionalSettings: {}
    };
    
    onGenerate?.(request);
  };

  // Validation
  const validatePrompt = (value?: string) => {
    if (!value || value.trim().length === 0) {
      return 'Please enter a video idea';
    }
    if (value.trim().length < 10) {
      return 'Please provide more details about your video idea';
    }
    return undefined;
  };

  const brandVoiceOptions = brandVoices.map(voice => ({
    label: voice.name,
    value: voice.id
  }));

  if (fallbackToOriginal) {
    return (
      <Card appearance="elevated" spacing="comfortable">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p>Enhanced Script Generator is loading...</p>
          <p>Falling back to original implementation if needed.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card appearance="elevated" spacing="comfortable" css={generatorStyles}>
      <div className="enhanced-generator">
        <div className="generator-header">
          <h2>What would you like to create today?</h2>
          <p className="generator-subtitle">
            Describe your video idea and let AI help you craft the perfect script
          </p>
        </div>

        <Form onSubmit={handleSubmit}>
          {({ formProps }) => (
            <form {...formProps}>
              <div className="form-grid">
                {/* Enhanced Prompt Section */}
                <div css={promptSectionStyles}>
                  <Field
                    name="prompt"
                    label="Video Idea"
                    isRequired
                    validate={validatePrompt}
                  >
                    {({ fieldProps, error }) => (
                      <div className="atlassian-form-field">
                        <TextArea
                          {...fieldProps}
                          placeholder={"Tell me about your video idea...\n\n" + "e.g., 'A fun TikTok about summer skincare routine for teens'"}
                          value={promptValue}
                          onChange={(e) => {
                            setPromptValue(e.target.value);
                            fieldProps.onChange(e.target.value);
                          }}
                          minimumRows={3}
                          maxLength={1000}
                        />
                        {error && <ErrorMessage>{error}</ErrorMessage>}
                        <HelperMessage>
                          Describe your video concept, target audience, and any specific elements you want to include
                        </HelperMessage>
                      </div>
                    )}
                  </Field>
                  
                  <div className="prompt-suggestions">
                    {promptSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        className="suggestion-chip"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="settings-grid">
                  {/* AI Settings */}
                  <Card appearance="subtle" spacing="comfortable" css={settingsSectionStyles}>
                    <div className="settings-header">
                      <span className="settings-icon"><RobotIcon label="Settings" /></span>
                      <h3>Settings</h3>
                    </div>
                    
                    <Field name="aiModel" label="AI Model" defaultValue={aiModelOptions[0]}>
                      {({ fieldProps }) => {
                        const selectProps = fieldProps as any;
                        return (
                          <div className="atlassian-form-field">
                            <Select
                              {...selectProps}
                              options={aiModelOptions}
                              placeholder="Select AI model"
                              isSearchable={false}
                              onChange={(option: any) => selectProps.onChange(option)}
                            />
                          </div>
                        );
                      }}
                    </Field>

                    <Field name="length" label="Length" defaultValue={lengthOptions[0]}>
                      {({ fieldProps }) => {
                        const selectProps = fieldProps as any;
                        return (
                          <div className="atlassian-form-field">
                            <Select
                              {...selectProps}
                              options={lengthOptions}
                              placeholder="Select video length"
                              isSearchable={false}
                              onChange={(option: any) => selectProps.onChange(option)}
                            />
                          </div>
                        );
                      }}
                    </Field>

                    <Field name="style" label="Style" defaultValue={styleOptions[0]}>
                      {({ fieldProps }) => {
                        const selectProps = fieldProps as any;
                        return (
                          <div className="atlassian-form-field">
                            <Select
                              {...selectProps}
                              options={styleOptions}
                              placeholder="Select content style"
                              isSearchable={false}
                              onChange={(option: any) => selectProps.onChange(option)}
                            />
                          </div>
                        );
                      }}
                    </Field>

                    <Field name="platform" label="Platform" defaultValue={platformOptions[0]}>
                      {({ fieldProps }) => {
                        const selectProps = fieldProps as any;
                        return (
                          <div className="atlassian-form-field">
                            <Select
                              {...selectProps}
                              options={platformOptions}
                              placeholder="Select target platform"
                              isSearchable={false}
                              onChange={(option: any) => selectProps.onChange(option)}
                            />
                          </div>
                        );
                      }}
                    </Field>
                  </Card>

                  {/* Brand Voice */}
                  <Card appearance="subtle" spacing="comfortable" css={brandVoiceSectionStyles}>
                    <div className="brand-voice-header">
                      <span className="brand-icon"><PeopleIcon label="Brand Voice" /></span>
                      <h3>Brand Voice</h3>
                    </div>
                    
                    <Field name="brandVoice" label="Brand Voice">
                      {({ fieldProps }) => {
                        const selectProps = fieldProps as any;
                        return (
                          <div className="atlassian-form-field">
                            <Select
                              {...selectProps}
                              options={brandVoiceOptions}
                              placeholder="Select brand voice (optional)"
                              isClearable
                              isSearchable={false}
                              onChange={(option: any) => selectProps.onChange(option)}
                            />
                          </div>
                        );
                      }}
                    </Field>

                    <div className="brand-voice-preview">
                      <p className="preview-text">
                        <span className="preview-icon"><TargetIcon label="Target" /></span>
                        Select a brand voice to guide your script, or we'll use the default style
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              <CardFooter css={actionsStyles}>
                <Button
                  type="submit"
                  variant="ai-powered"
                  size="large"
                  isLoading={isLoading}
                  className="action-button"
                  iconBefore={<StarIcon label="" />}
                >
                  Generate Script
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={onVoiceInput}
                  isDisabled={isLoading}
                  className="action-button"
                  iconBefore={<AudioIcon label="" />}
                >
                  Use Voice Input
                </Button>
              </CardFooter>
            </form>
          )}
        </Form>
      </div>
    </Card>
  );
};
