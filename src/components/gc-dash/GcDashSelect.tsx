import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';

export interface GcDashSelectOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface GcDashSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: GcDashSelectOption[];
  supportingText?: string;
}

export const GcDashSelect = forwardRef<HTMLSelectElement, GcDashSelectProps>(
  ({ options, supportingText, className, disabled, style, ...props }, ref) => (
    <span
      className={clsx('gc-dash-select', className)}
      css={css`
        position: relative;
        display: inline-flex;
        width: 100%;
        align-items: center;
        background: ${disabled ? 'rgba(9, 30, 66, 0.04)' : gcDashColor.surface};
        border-radius: ${gcDashShape.radiusMd};
        border: 1px solid ${gcDashColor.border};
        transition: ${gcDashMotion.transition};
        --focus-ring-primary: none;
        --focus-visible-offset: 0;

        &:focus-within {
          border-color: ${gcDashColor.primary};
          background: ${gcDashColor.cardHoverBackground};
        }
      `}
      style={style}
    >
      <select
        ref={ref}
        disabled={disabled}
        {...props}
        css={css`
          appearance: none;
          border: none;
          outline: none;
          width: 100%;
          background: transparent;
          padding: ${gcDashSpacing.sm} ${gcDashSpacing.lg} ${gcDashSpacing.sm} ${gcDashSpacing.md};
          border-radius: inherit;
          font-size: 15px;
          color: ${gcDashColor.textPrimary};
          outline: none;
          --focus-ring-primary: none;
          --focus-visible-offset: 0;

          &:disabled {
            cursor: not-allowed;
          }
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label as React.ReactNode}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        css={css`
          position: absolute;
          right: ${gcDashSpacing.sm};
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: ${gcDashColor.textMuted};
          display: inline-flex;
        `}
      >
        ▾
      </span>
      {supportingText && (
        <span
          css={css`
            position: absolute;
            width: max-content;
            bottom: calc(-1 * ${gcDashSpacing.md});
            left: 0;
            font-size: 12px;
            color: ${gcDashColor.textMuted};
          `}
        >
          {supportingText}
        </span>
      )}
    </span>
  )
);

GcDashSelect.displayName = 'GcDashSelect';
