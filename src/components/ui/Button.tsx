import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ai-powered' | 'creative' | 'subtle' | 'warning' | 'danger';
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
  
  /* Variant styles */
  ${variant === 'primary' && css`
    background: var(--button-primary-bg);
    color: var(--button-primary-text);
    box-shadow: var(--button-primary-shadow);
    
    &:hover:not(:disabled) {
      background: var(--button-primary-bg-hover);
      box-shadow: var(--shadow-elevated);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: var(--button-primary-shadow);
    }
  `}
  
  ${variant === 'secondary' && css`
    background: var(--button-secondary-bg);
    color: var(--button-secondary-text);
    border: 1px solid var(--button-secondary-border);
    
    &:hover:not(:disabled) {
      background: var(--button-secondary-bg-hover);
      border-color: var(--color-neutral-400);
    }
  `}
  
  ${variant === 'ai-powered' && css`
    background: linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end));
    color: white;
    box-shadow: var(--shadow-ai);
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s ease;
    }
    
    &:hover:not(:disabled) {
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
      
      &::before {
        left: 100%;
      }
    }
  `}
  
  ${variant === 'creative' && css`
    background: var(--color-creative-purple);
    color: white;
    
    &:hover:not(:disabled) {
      background: #7c3aed;
      transform: translateY(-1px);
      box-shadow: var(--shadow-elevated);
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
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
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