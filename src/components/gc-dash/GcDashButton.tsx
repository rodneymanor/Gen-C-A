import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashFocus, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';
import { GcDashLoadingSpinner } from './GcDashLoadingSpinner';

export type GcDashButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'link';

export type GcDashButtonSize = 'small' | 'medium' | 'large';

export interface GcDashButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GcDashButtonVariant;
  size?: GcDashButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const baseStyle = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${gcDashSpacing.sm};
  font-family: inherit;
  font-weight: 600;
  border-radius: ${gcDashShape.radiusMd};
  border: 1px solid transparent;
  cursor: pointer;
  transition: ${gcDashMotion.transition};
  user-select: none;
  text-decoration: none;
  white-space: nowrap;
  line-height: 1.2;
  box-shadow: none;

  &:focus-visible {
    outline: none;
    box-shadow: ${gcDashFocus.ring};
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const sizeStyles: Record<GcDashButtonSize, ReturnType<typeof css>> = {
  small: css`
    min-height: 36px;
    padding: 0 ${gcDashSpacing.sm};
    font-size: 14px;
  `,
  medium: css`
    min-height: 44px;
    padding: 0 ${gcDashSpacing.md};
    font-size: 15px;
  `,
  large: css`
    min-height: 52px;
    padding: 0 ${gcDashSpacing.lg};
    font-size: 16px;
  `,
};

const variantStyles: Record<GcDashButtonVariant, ReturnType<typeof css>> = {
  primary: css`
    background: ${gcDashColor.primary};
    color: var(--color-neutral-0);
    border-color: ${gcDashColor.primary};

    &:hover:not(:disabled) {
      background: ${gcDashColor.primaryHover};
      border-color: ${gcDashColor.primaryHover};
    }

    &:active:not(:disabled) {
      background: ${gcDashColor.primaryActive};
      border-color: ${gcDashColor.primaryActive};
      transform: translateY(1px);
    }
  `,
  secondary: css`
    background: ${gcDashColor.surfaceAlt};
    color: ${gcDashColor.textPrimary};
    border-color: ${gcDashColor.border};

    &:hover:not(:disabled) {
      border-color: ${gcDashColor.borderStrong};
      background: var(--color-surface-hover, rgba(9, 30, 66, 0.04));
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      background: var(--color-surface-active, rgba(9, 30, 66, 0.08));
    }
  `,
  ghost: css`
    background: transparent;
    color: ${gcDashColor.textSecondary};
    border-color: transparent;

    &:hover:not(:disabled) {
      background: rgba(9, 30, 66, 0.05);
      color: ${gcDashColor.textPrimary};
    }

    &:active:not(:disabled) {
      background: rgba(9, 30, 66, 0.1);
      transform: translateY(1px);
    }
  `,
  danger: css`
    background: ${gcDashColor.danger};
    color: var(--color-neutral-0);
    border-color: ${gcDashColor.danger};

    &:hover:not(:disabled) {
      background: var(--color-error-400);
      border-color: var(--color-error-400);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      background: var(--color-error-500);
    }
  `,
  link: css`
    background: transparent;
    color: ${gcDashColor.primary};
    border-color: transparent;
    padding-left: 0;
    padding-right: 0;

    &:hover:not(:disabled) {
      text-decoration: underline;
      color: ${gcDashColor.primaryHover};
    }

    &:active:not(:disabled) {
      color: ${gcDashColor.primaryActive};
    }
  `,
};

export const GcDashButton = forwardRef<HTMLButtonElement, GcDashButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      isLoading = false,
      disabled,
      fullWidth,
      leadingIcon,
      trailingIcon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={clsx('gc-dash-button', className)}
        css={css`
          ${baseStyle};
          ${sizeStyles[size]};
          ${variantStyles[variant]};
          width: ${fullWidth ? '100%' : 'auto'};
          pointer-events: ${isLoading ? 'none' : 'auto'};
        `}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {isLoading && (
          <span
            css={css`
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
            aria-hidden="true"
          >
            <GcDashLoadingSpinner size={18} lightOnDark={variant !== 'secondary' && variant !== 'ghost'} />
          </span>
        )}
        <span
          css={css`
            opacity: ${isLoading ? 0 : 1};
            display: inline-flex;
            align-items: center;
            gap: ${gcDashSpacing.xs};
          `}
        >
          {leadingIcon && <span className="gc-dash-button__icon gc-dash-button__icon--leading">{leadingIcon}</span>}
          <span className="gc-dash-button__label">{children}</span>
          {trailingIcon && <span className="gc-dash-button__icon gc-dash-button__icon--trailing">{trailingIcon}</span>}
        </span>
      </button>
    );
  }
);

GcDashButton.displayName = 'GcDashButton';
