import React, { useId } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';

export interface FormFieldProps {
  children: React.ReactElement;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  showCharacterCount?: boolean;
  characterCount?: number;
  maxLength?: number;
  fullWidth?: boolean;
  className?: string;
}

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

export const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  helperText,
  errorMessage,
  isRequired = false,
  showCharacterCount = false,
  characterCount = 0,
  maxLength,
  fullWidth = true,
  className,
}) => {
  const id = useId();
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  
  // Clone the child element to pass necessary props
  const childElement = React.cloneElement(children, {
    id,
    'aria-describedby': [
      children.props['aria-describedby'],
      helperId,
      errorId
    ].filter(Boolean).join(' '),
    'aria-invalid': !!errorMessage,
    'aria-required': isRequired,
  });

  return (
    <div 
      css={[containerStyles, !fullWidth && css`width: auto;`]} 
      className={clsx('gen-form-field', className)}
    >
      {label && (
        <label htmlFor={id} css={labelStyles}>
          {label}
          {isRequired && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      )}
      
      {childElement}
      
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
};

FormField.displayName = 'FormField';