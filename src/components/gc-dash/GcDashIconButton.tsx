import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor } from './styleUtils';

export interface GcDashIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  tone?: 'neutral' | 'danger';
}

export const GcDashIconButton: React.FC<GcDashIconButtonProps> = ({
  size = 'md',
  tone = 'neutral',
  className,
  children,
  ...props
}) => {
  const dimension = size === 'sm' ? 32 : 36;

  return (
    <button
      type="button"
      className={clsx('gc-dash-icon-button', className)}
      css={css`
        width: ${dimension}px;
        height: ${dimension}px;
        border-radius: 12px;
        border: 1px solid rgba(9, 30, 66, 0.18);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: ${tone === 'danger' ? gcDashColor.danger : gcDashColor.textPrimary};
        cursor: pointer;
        transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;

        &:hover:not(:disabled) {
          background: rgba(9, 30, 66, 0.06);
          border-color: rgba(9, 30, 66, 0.26);
        }

        &:focus-visible {
          outline: none;
          border-color: ${gcDashColor.primary};
          background: rgba(11, 92, 255, 0.08);
        }

        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}
      {...props}
    >
      {children}
    </button>
  );
};

GcDashIconButton.displayName = 'GcDashIconButton';
