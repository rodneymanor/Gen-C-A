import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ai-powered' | 'creative' | 'subtle' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isDisabled?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  fullWidth?: boolean;
  testId?: string;
}

const getButtonStyles = (variant: ButtonProps['variant'], size: ButtonProps['size']) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-medium);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-all);
  position: relative;
  text-decoration: none;
  white-space: nowrap;
  
  /* Size variants */
  ${size === 'small' && css`
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-body-small);
    min-height: 32px;
    gap: var(--space-2);
  `}
  
  ${size === 'medium' && css`
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-body);
    min-height: 40px;
    gap: var(--space-2);
  `}
  
  ${size === 'large' && css`
    padding: var(--space-4) var(--space-6);
    font-size: var(--font-size-body-large);
    min-height: 48px;
    gap: var(--space-3);
  `}
  
  /* Perplexity Button Hierarchy - Bloom Blue Primary */
  ${variant === 'primary' && css`
    background: #0B5CFF;  /* Perplexity Bloom Blue */
    color: #ffffff;
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: var(--font-weight-semibold);
    min-height: var(--touch-target-comfortable, 44px);
    
    &:hover:not(:disabled) {
      background: #0A52E6;  /* Darker Bloom Blue */
      box-shadow: 0 2px 8px rgba(11, 92, 255, 0.2);
      transform: translateY(-1px);
    }
    
    &:active {
      background: #0947CC;  /* Even darker */
      transform: translateY(0);
    }
    
    &:focus-visible {
      outline: 2px solid #0B5CFF;
      outline-offset: 2px;
    }
  `}
  
  ${variant === 'secondary' && css`
    background: transparent;
    color: #0B5CFF;  /* Bloom Blue text */
    border: 1px solid #0B5CFF;
    font-weight: var(--font-weight-medium);
    min-height: var(--touch-target-comfortable, 44px);
    
    &:hover:not(:disabled) {
      background: rgba(11, 92, 255, 0.08);  /* Very light Bloom Blue */
      border-color: #0A52E6;
    }
    
    &:active {
      background: rgba(11, 92, 255, 0.12);
    }
    
    &:focus-visible {
      outline: 2px solid #0B5CFF;
      outline-offset: 2px;
    }
  `}
  
  ${variant === 'tertiary' && css`
    background: transparent;
    color: var(--color-text-secondary, #6B7280);
    border: none;
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    padding: var(--space-2) var(--space-4);
    
    &:hover:not(:disabled) {
      color: var(--color-text-primary, #1F2937);
      text-decoration: underline;
    }
    
    &:focus-visible {
      outline: 2px solid #0B5CFF;
      outline-offset: 2px;
      border-radius: var(--radius-small);
    }
  `}
  
  ${variant === 'destructive' && css`
    background: #DC2626;  /* Red for destructive actions */
    color: #ffffff;
    border: none;
    font-weight: var(--font-weight-medium);
    min-height: var(--touch-target-comfortable, 44px);
    margin-left: var(--space-8);  /* Separate from primary actions */
    
    &:hover:not(:disabled) {
      background: #B91C1C;
    }
    
    &:active {
      background: #991B1B;
    }
    
    &:focus-visible {
      outline: 2px solid #DC2626;
      outline-offset: 2px;
    }
  `}
  
  ${variant === 'ai-powered' && css`
    /* Perplexity Flat Design - No Gradients, Use Claude Orange */
    background: var(--color-creative-purple);  /* Solid purple instead of gradient */
    color: white;
    /* REMOVED: All shadows and animations for flat design */
    
    &:hover:not(:disabled) {
      background: #7c3aed;  /* Simple color change only */
      /* REMOVED: All shadows and transforms */
    }
    
    &:active {
      background: #6d28d9;  /* Darker on press */
    }
  `}
  
  ${variant === 'creative' && css`
    background: var(--color-creative-purple);
    color: white;
    
    &:hover:not(:disabled) {
      background: #7c3aed;
      /* REMOVED: Transform and shadow for flat design */
    }
    
    &:active {
      background: #6d28d9;
    }
  `}
  
  ${variant === 'subtle' && css`
    background: transparent;
    color: var(--color-neutral-700);
    
    &:hover:not(:disabled) {
      background: var(--color-neutral-100);
      color: var(--color-neutral-800);
    }
  `}
  
  ${variant === 'warning' && css`
    background: var(--color-warning-400);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--color-warning-500);
    }
  `}
  
  ${variant === 'danger' && css`
    background: var(--color-error-400);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--color-error-500);
    }
  `}
  
  /* Focus styles */
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  
  /* Disabled state - Perplexity Flat Design */
  &:disabled {
    opacity: 0.5;  /* Slightly more faded */
    cursor: not-allowed;
    /* No transforms needed in flat design */
  }
  
  /* Loading state */
  &[data-loading='true'] {
    cursor: wait;
    
    .button-content {
      opacity: 0.7;
    }
  }
`;

const loadingSpinnerStyles = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const buttonContentStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isDisabled = false,
  iconBefore,
  iconAfter,
  fullWidth = false,
  testId,
  className,
  ...props
}, ref) => {
  const motionProps = {
    whileTap: !isDisabled && !isLoading ? { scale: 0.98 } : undefined,
    transition: { duration: 0.1 }
  };

  // Separate motion-specific props from HTML button props
  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDrag,
    onDragEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      ref={ref}
      css={[
        getButtonStyles(variant, size),
        fullWidth && css`width: 100%;`,
      ]}
      className={clsx('gen-button', className)}
      disabled={isDisabled || isLoading}
      data-loading={isLoading}
      data-testid={testId}
      aria-disabled={isDisabled || isLoading}
      {...motionProps}
      {...buttonProps}
    >
      {isLoading && (
        <div css={loadingSpinnerStyles} aria-hidden="true">
          <div className="spinner" />
        </div>
      )}
      
      <div css={buttonContentStyles} className="button-content">
        {iconBefore && <span className="button-icon-before" aria-hidden="true">{iconBefore}</span>}
        <span className="button-text">{children}</span>
        {iconAfter && <span className="button-icon-after" aria-hidden="true">{iconAfter}</span>}
      </div>
    </motion.button>
  );
});

Button.displayName = 'Button';