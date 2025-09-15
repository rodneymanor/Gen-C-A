import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ai-powered' | 'creative' | 'subtle' | 'warning' | 'danger' | 'ppx-primary' | 'soft';
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
  font-weight: var(--font-weight-semimedium, var(--font-weight-medium));
  cursor: pointer;
  transition: var(--transition-all);
  position: relative;
  text-decoration: none;
  white-space: nowrap;
  
  /* Size variants */
  ${size === 'small' && css`
    padding: 0 var(--spacing-2-5, 10px);
    font-size: var(--font-size-sm, var(--font-size-body-small));
    min-height: 40px; /* Unified 40px height */
    gap: var(--spacing-two, var(--space-2));
    line-height: var(--line-height-loose, 1.75);
  `}
  
  ${size === 'medium' && css`
    padding: 0 var(--spacing-2-5, 10px);
    font-size: var(--font-size-sm, var(--font-size-body));
    min-height: 40px; /* Unified 40px height */
    gap: var(--spacing-two, var(--space-2));
    line-height: var(--line-height-loose, 1.75);
  `}
  
  ${size === 'large' && css`
    padding: 0 var(--space-4);
    font-size: var(--font-size-body-large);
    min-height: 40px; /* Unified 40px height */
    gap: var(--space-3);
  `}
  
  /* Primary — soft gray over white background */
  ${variant === 'primary' && css`
    background: var(--button-primary-bg, var(--color-neutral-100));
    color: var(--button-primary-text, var(--color-neutral-800));
    border: 1px solid var(--color-neutral-200);
    box-shadow: none;
    border-radius: 8px; /* rounded-lg */
    font-weight: var(--font-weight-semimedium, 550);
    line-height: var(--line-height-loose, 1.75);

    &:hover:not(:disabled) {
      background: var(--button-primary-bg-hover, var(--color-neutral-200));
      border-color: var(--color-neutral-300);
    }
    &:active { transform: scale(0.97); }
    &:focus-visible { outline: none; box-shadow: none; }
  `}
  
  /* Perplexity Primary (Black) - Editor scoped usage */
  ${variant === 'ppx-primary' && css`
    background: var(--color-super);
    color: var(--color-inverse);
    border: none;
    border-radius: 8px; /* rounded-lg */
    font-family: var(--font-family-sans, var(--font-family-primary));
    font-weight: var(--font-weight-semimedium, 550);
    font-size: var(--font-size-sm, 14px);
    line-height: var(--line-height-loose, 1.75);
    padding-left: var(--spacing-2-5, 10px);
    padding-right: var(--spacing-2-5, 10px);

    &:hover:not(:disabled) {
      opacity: 0.8;
      transform: none; /* no lift */
      box-shadow: none;
    }

    &:active {
      transform: scale(0.97);
      transition-duration: 150ms;
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }

    &:focus-visible {
      outline: none;
      box-shadow: none;
    }
  `}
  
  ${variant === 'secondary' && css`
    background: transparent;
    color: var(--color-text-primary, #172b4d);
    border: 1px solid var(--color-border, #e4e6ea);
    font-weight: var(--font-weight-semimedium, 550);
    
    &:hover:not(:disabled) {
      background: var(--color-surface-hover, #f4f5f7);
      border-color: var(--color-border-strong, #c1c7d0);
    }
    &:active { transform: scale(0.97); }
    &:focus-visible { outline: none; box-shadow: none; }
  `}
  
  ${variant === 'tertiary' && css`
    background: transparent;
    color: var(--color-text-secondary, #6B7280);
    border: none;
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    padding: 0 var(--space-2);
    
    &:hover:not(:disabled) {
      color: var(--color-text-primary, #1F2937);
      background: var(--color-surface-hover);
    }
    
    &:focus-visible { outline: none; box-shadow: none; }
  `}
  
  ${variant === 'destructive' && css`
    background: #DC2626;  /* Red for destructive actions */
    color: #ffffff;
    border: none;
    font-weight: var(--font-weight-medium);
    min-height: 40px; /* Unified 40px height */
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

  /* Soft button - gentle gray fill with darker gray text */
  ${variant === 'soft' && css`
    background: var(--color-neutral-100);
    color: var(--color-neutral-800);
    border: 1px solid var(--color-neutral-200);
    
    &:hover:not(:disabled) {
      background: var(--color-neutral-200);
      border-color: var(--color-neutral-300);
      color: var(--color-neutral-900);
    }
    
    &:active {
      background: var(--color-neutral-300);
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
    box-shadow: none;
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
