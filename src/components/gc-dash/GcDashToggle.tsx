import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashFocus, gcDashMotion, gcDashSpacing } from './styleUtils';

export interface GcDashToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const GcDashToggle = forwardRef<HTMLInputElement, GcDashToggleProps>(
  ({ label, description, className, disabled, ...props }, ref) => (
    <label
      className={clsx('gc-dash-toggle', className)}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${gcDashSpacing.sm};
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        color: ${disabled ? gcDashColor.textMuted : gcDashColor.textPrimary};
      `}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        aria-label={typeof label === 'string' ? label : undefined}
        disabled={disabled}
        {...props}
        css={css`
          position: absolute;
          opacity: 0;
          pointer-events: ${disabled ? 'none' : 'auto'};
        `}
      />
      <span
        aria-hidden="true"
        css={css`
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 26px;
          background: ${disabled ? 'rgba(9, 30, 66, 0.12)' : 'rgba(9, 30, 66, 0.22)'};
          transition: ${gcDashMotion.transition};

          input:checked + & {
            background: ${disabled ? 'rgba(11, 92, 255, 0.55)' : gcDashColor.primary};
          }

          input:focus-visible + & {
            box-shadow: ${gcDashFocus.ring};
          }

          &::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--color-neutral-0);
            box-shadow: 0 2px 6px rgba(9, 30, 66, 0.24);
            transition: ${gcDashMotion.transitionFast};
          }

          input:checked + &::after {
            transform: translateX(20px);
          }
        `}
      />
      {(label || description) && (
        <span
          css={css`
            display: flex;
            flex-direction: column;
            gap: 2px;
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

GcDashToggle.displayName = 'GcDashToggle';
