import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'neutral' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  shape?: 'rounded' | 'pill';
  className?: string;
  testId?: string;
}

const getBadgeStyles = (
  variant: BadgeProps['variant'],
  size: BadgeProps['size'],
  shape: BadgeProps['shape']
) => css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  border: 1px solid;
  transition: var(--transition-all);
  
  /* Size variants */
  ${size === 'small' && css`
    padding: 2px 6px;
    font-size: var(--font-size-caption);
    min-height: 20px;
  `}
  
  ${size === 'medium' && css`
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-caption);
    min-height: 24px;
  `}
  
  ${size === 'large' && css`
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-body-small);
    min-height: 32px;
  `}
  
  /* Shape variants */
  ${shape === 'rounded' && css`
    border-radius: var(--radius-small);
  `}
  
  ${shape === 'pill' && css`
    border-radius: var(--radius-full);
  `}
  
  /* Color variants */
  ${variant === 'default' && css`
    background: var(--color-neutral-100);
    color: var(--color-neutral-700);
    border-color: var(--color-neutral-200);
  `}
  
  ${variant === 'primary' && css`
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border-color: var(--color-primary-200);
  `}
  
  ${variant === 'neutral' && css`
    background: var(--color-neutral-200);
    color: var(--color-neutral-700);
    border-color: var(--color-neutral-300);
  `}
  
  ${variant === 'success' && css`
    background: var(--color-success-100);
    color: var(--color-success-700);
    border-color: var(--color-success-200);
  `}
  
  ${variant === 'warning' && css`
    background: var(--color-warning-100);
    color: var(--color-warning-700);
    border-color: var(--color-warning-200);
  `}
  
  ${variant === 'error' && css`
    background: var(--color-error-100);
    color: var(--color-error-700);
    border-color: var(--color-error-200);
  `}
`;

const iconStyles = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 0.75em;
`;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  icon,
  shape = 'pill',
  className,
  testId,
  ...props
}) => {
  return (
    <span
      css={getBadgeStyles(variant, size, shape)}
      className={clsx('gen-badge', className)}
      data-testid={testId}
      {...props}
    >
      {icon && <span css={iconStyles} className="badge-icon" aria-hidden="true">{icon}</span>}
      <span className="badge-content">{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';