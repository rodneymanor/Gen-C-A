import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashFocus, gcDashSpacing } from './styleUtils';

export interface GcDashRadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const GcDashRadio = forwardRef<HTMLInputElement, GcDashRadioProps>(
  ({ label, description, className, disabled, ...props }, ref) => (
    <label
      className={clsx('gc-dash-radio', className)}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: flex-start;
        gap: ${gcDashSpacing.sm};
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        color: ${disabled ? gcDashColor.textMuted : gcDashColor.textPrimary};
      `}
    >
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        {...props}
        css={css`
          position: absolute;
          opacity: 0;
          inset: 0;
          pointer-events: ${disabled ? 'none' : 'auto'};
        `}
      />
      <span
        aria-hidden="true"
        css={css`
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 1px solid ${gcDashColor.borderStrong};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface, #fff);
          transition: 0.2s ease;

          label:hover input:not(:disabled) + & {
            border-color: ${gcDashColor.primary};
          }

          label:focus-within & {
            box-shadow: ${gcDashFocus.ring};
          }

          label input:checked + & {
            border-color: ${gcDashColor.primary};
          }

          label input:checked + &::after {
            content: '';
            width: 10px;
            height: 10px;
            background: ${gcDashColor.primary};
            border-radius: 50%;
          }
        `}
      />
      {(label || description) && (
        <span
          css={css`
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding-top: 1px;
          `}
        >
          {label && (
            <span
              css={css`
                font-weight: 600;
                font-size: 14px;
              `}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              css={css`
                font-size: 13px;
                color: ${gcDashColor.textMuted};
              `}
            >
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  )
);

GcDashRadio.displayName = 'GcDashRadio';
