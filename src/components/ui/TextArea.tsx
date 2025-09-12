import React, { forwardRef, useState, useId } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { Button } from './Button';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'warm' | 'creative';
  showCharacterCount?: boolean;
  fullWidth?: boolean;
  autoResize?: boolean;
  aiSuggestions?: boolean;
  onAISuggest?: (prompt: string) => Promise<string[]>;
  testId?: string;
}

const getTextAreaStyles = (
  size: TextAreaProps['size'],
  variant: TextAreaProps['variant'],
  hasError: boolean,
  autoResize: boolean
) => css`
  width: 100%;
  border: 1px solid var(--input-border);
  border-radius: var(--input-radius);
  background: var(--input-bg);
  color: var(--input-text);
  font-family: var(--font-family-primary);
  transition: var(--transition-all);
  resize: ${autoResize ? 'none' : 'vertical'};
  
  /* Size variants */
  ${size === 'small' && css`
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-body-small);
    min-height: 80px;
  `}
  
  ${size === 'medium' && css`
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-body);
    min-height: 120px;
  `}
  
  ${size === 'large' && css`
    padding: var(--space-4) var(--space-5);
    font-size: var(--font-size-body-large);
    min-height: 160px;
  `}
  
  /* Variant styles */
  ${variant === 'warm' && css`
    --input-border-focus: var(--color-primary-500);
    --input-bg: var(--color-primary-50);
  `}
  
  ${variant === 'creative' && css`
    --input-border-focus: var(--color-creative-purple);
    --input-bg: var(--color-neutral-50);
  `}
  
  /* Perplexity Flat Design States */
  &::placeholder {
    color: var(--input-placeholder);
  }
  
  &:focus {
    outline: none;
    border-color: var(--input-border-focus); /* Claude orange focus */
    /* REMOVED: box-shadow for flat design - only border change */
  }
  
  &:hover:not(:focus):not(:disabled) {
    border-color: var(--color-neutral-400); /* Subtle hover without shadows */
  }
  
  &:disabled {
    background: var(--color-neutral-100);
    color: var(--color-neutral-400);
    cursor: not-allowed;
  }
  
  /* Error state - Perplexity Flat Design */
  ${hasError && css`
    border-color: var(--color-error-400);
    background: var(--color-error-50);
    
    &:focus {
      border-color: var(--color-error-400);
      /* REMOVED: box-shadow for flat design - only border change */
    }
  `}
`;

const containerStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

const labelStyles = css`
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  
  .required-indicator {
    color: var(--color-error-400);
    margin-left: var(--space-1);
  }
`;

const textAreaWrapperStyles = css`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
`;

const footerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 20px;
`;

const helperTextStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-neutral-600);
  flex: 1;
`;

const errorTextStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-error-500);
  flex: 1;
`;

const characterCountStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-neutral-500);
  white-space: nowrap;
`;

const aiSuggestionsStyles = css`
  margin-top: var(--space-2);
  padding: var(--space-3);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-medium);
  
  .suggestions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
    
    h4 {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin: 0;
    }
  }
  
  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    
    .suggestion-item {
      padding: var(--space-3);
      background: var(--color-neutral-0);
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-small);
      cursor: pointer;
      transition: var(--transition-all);
      text-align: left;
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-normal);
      
      &:hover {
        border-color: var(--color-primary-500); /* Claude orange hover */
        background: var(--color-primary-50);
        /* No shadows - flat design */
      }
    }
  }
`;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  helperText,
  errorMessage,
  isRequired = false,
  size = 'medium',
  variant = 'default',
  showCharacterCount = false,
  fullWidth = true,
  autoResize = false,
  aiSuggestions = false,
  onAISuggest,
  testId,
  className,
  maxLength,
  value,
  onChange,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const id = useId();
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  
  const currentValue = value !== undefined ? value : internalValue;
  const characterCount = typeof currentValue === 'string' ? currentValue.length : 0;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
    
    // Auto-resize functionality
    if (autoResize) {
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleAISuggest = async () => {
    if (!onAISuggest || !currentValue) return;
    
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await onAISuggest(currentValue.toString());
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const syntheticEvent = {
      target: { value: suggestion }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    if (value === undefined) {
      setInternalValue(suggestion);
    }
    onChange?.(syntheticEvent);
    setShowSuggestions(false);
  };

  return (
    <div 
      css={[containerStyles, !fullWidth && css`width: auto;`]} 
      className={clsx('gen-textarea-container', className)}
    >
      {label && (
        <label htmlFor={id} css={labelStyles}>
          {label}
          {isRequired && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      )}
      
      <div css={textAreaWrapperStyles}>
        {aiSuggestions && (
          <div css={headerStyles}>
            <div></div>
            <Button
              variant="subtle"
              size="small"
              onClick={handleAISuggest}
              isLoading={isLoadingSuggestions}
              isDisabled={!currentValue}
              iconBefore="✨"
            >
              AI Suggestions
            </Button>
          </div>
        )}
        
        <textarea
          ref={ref}
          id={id}
          css={getTextAreaStyles(size, variant, !!errorMessage, autoResize)}
          className="gen-textarea"
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          aria-describedby={[helperId, errorId].filter(Boolean).join(' ')}
          aria-invalid={!!errorMessage}
          aria-required={isRequired}
          data-testid={testId}
          {...props}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div css={aiSuggestionsStyles} role="region" aria-label="AI Suggestions">
            <div className="suggestions-header">
              <h4>AI Suggestions</h4>
              <Button
                variant="subtle"
                size="small"
                onClick={() => setShowSuggestions(false)}
                iconBefore="×"
                aria-label="Close suggestions"
              />
            </div>
            
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => applySuggestion(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div css={footerStyles}>
        <div>
          {errorMessage ? (
            <div id={errorId} css={errorTextStyles} role="alert">
              {errorMessage}
            </div>
          ) : helperText ? (
            <div id={helperId} css={helperTextStyles}>
              {helperText}
            </div>
          ) : null}
        </div>
        
        {showCharacterCount && maxLength && (
          <div css={characterCountStyles} aria-live="polite">
            {characterCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';