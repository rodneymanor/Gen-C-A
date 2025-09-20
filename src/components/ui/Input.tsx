import React, { forwardRef, useState, useId } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'warm' | 'creative';
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  showCharacterCount?: boolean;
  fullWidth?: boolean;
  testId?: string;
}

const getInputStyles = (
  size: InputProps['size'],
  variant: InputProps['variant'],
  hasError: boolean,
  hasIconBefore: boolean,
  hasIconAfter: boolean
) => css`
  width: 100%;
  border: 1px solid var(--input-border);
  border-radius: var(--input-radius);
  background: var(--input-bg);
  color: var(--input-text);
  font-family: var(--font-family-primary);
  transition: var(--transition-all);
  
  /* Size variants */
  ${size === 'small' && css`
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-body-small);
    min-height: 36px;
  `}

  ${size === 'medium' && css`
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-body);
    min-height: 40px;
  `}

  ${size === 'large' && css`
    padding: var(--space-4) var(--space-5);
    font-size: var(--font-size-body-large);
    min-height: 46px;
  `}
  
  /* Icon spacing */
  ${hasIconBefore && css`
    padding-left: var(--space-10);
  `}
  
  ${hasIconAfter && css`
    padding-right: var(--space-10);
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
    outline: var(--focus-ring-primary, 2px solid var(--color-primary-500));
    outline-offset: var(--focus-visible-offset, 2px);
    border-color: var(--input-border-focus);
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
      outline: var(--focus-ring-error-enhanced, 2px solid var(--color-error-400));
      outline-offset: var(--focus-visible-offset, 2px);
      border-color: var(--color-error-400);
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

const inputWrapperStyles = css`
  position: relative;
  display: flex;
  align-items: center;
`;

const iconStyles = css`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
  pointer-events: none;
  z-index: 1;
  
  &.icon-before {
    left: var(--space-3);
  }
  
  &.icon-after {
    right: var(--space-3);
  }
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

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  errorMessage,
  isRequired = false,
  size = 'medium',
  variant = 'default',
  iconBefore,
  iconAfter,
  showCharacterCount = false,
  fullWidth = true,
  testId,
  className,
  maxLength,
  value,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const id = useId();
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  
  const currentValue = value !== undefined ? value : internalValue;
  const characterCount = typeof currentValue === 'string' ? currentValue.length : 0;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    props.onChange?.(e);
  };

  return (
    <div 
      css={[containerStyles, !fullWidth && css`width: auto;`]} 
      className={clsx('gen-input-container', className)}
    >
      {label && (
        <label htmlFor={id} css={labelStyles}>
          {label}
          {isRequired && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      )}
      
      <div css={inputWrapperStyles}>
        {iconBefore && (
          <div css={iconStyles} className="icon-before" aria-hidden="true">
            {iconBefore}
          </div>
        )}
        
        <input
          ref={ref}
          id={id}
          css={getInputStyles(size, variant, !!errorMessage, !!iconBefore, !!iconAfter)}
          className="gen-input"
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          aria-describedby={[helperId, errorId].filter(Boolean).join(' ')}
          aria-invalid={!!errorMessage}
          aria-required={isRequired}
          data-testid={testId}
          {...props}
        />
        
        {iconAfter && (
          <div css={iconStyles} className="icon-after" aria-hidden="true">
            {iconAfter}
          </div>
        )}
      </div>
      
      {(errorMessage || helperText || (showCharacterCount && maxLength)) && (
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
      )}
    </div>
  );
});

Input.displayName = 'Input';
