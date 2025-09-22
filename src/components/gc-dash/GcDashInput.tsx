import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';

export type GcDashInputTone = 'default' | 'success' | 'warning' | 'error';

export interface GcDashInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: GcDashInputTone;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  supportingText?: string;
}

const toneBorder: Record<GcDashInputTone, string> = {
  default: `1px solid ${gcDashColor.border}`,
  success: `1px solid ${gcDashColor.success}`,
  warning: `1px solid ${gcDashColor.warning}`,
  error: `1px solid ${gcDashColor.danger}`,
};

export const GcDashInput = forwardRef<HTMLInputElement, GcDashInputProps>(
  ({ tone = 'default', leadingIcon, trailingIcon, className, disabled, style, ...props }, ref) => {
    return (
      <span
        className={clsx('gc-dash-input', className)}
        css={css`
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 100%;
          background: ${disabled ? 'rgba(9, 30, 66, 0.04)' : gcDashColor.surface};
          border-radius: ${gcDashShape.radiusMd};
          border: ${toneBorder[tone]};
          transition: ${gcDashMotion.transition};
          color: ${gcDashColor.textPrimary};
          --focus-ring-primary: none;
          --focus-visible-offset: 0;

          &:focus-within {
            border-color: ${gcDashColor.primary};
            background: ${gcDashColor.cardHoverBackground};
          }

          &:has(input:disabled) {
            cursor: not-allowed;
            opacity: 0.7;
          }
        `}
        style={style}
      >
        {leadingIcon && (
          <span
            css={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding-left: ${gcDashSpacing.sm};
              color: ${gcDashColor.textMuted};
            `}
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          {...props}
          css={css`
            border: none;
            outline: none;
            background: transparent;
            padding: ${gcDashSpacing.sm};
            padding-left: ${leadingIcon ? gcDashSpacing.xs : gcDashSpacing.md};
            padding-right: ${trailingIcon ? gcDashSpacing.xs : gcDashSpacing.md};
            width: 100%;
            font-size: 15px;
            color: inherit;

            &::placeholder {
              color: ${gcDashColor.textMuted};
            }

            &:disabled {
              cursor: not-allowed;
            }
          `}
        />
        {trailingIcon && (
          <span
            css={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding-right: ${gcDashSpacing.sm};
              color: ${gcDashColor.textMuted};
            `}
          >
            {trailingIcon}
          </span>
        )}
      </span>
    );
  }
);

GcDashInput.displayName = 'GcDashInput';
