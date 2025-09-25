import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor } from './styleUtils';

export interface GcDashAddContentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const GcDashAddContentButton: React.FC<GcDashAddContentButtonProps> = ({
  label = 'Add content',
  className,
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      className={clsx('gc-dash-add-content', className)}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 12px;
        border: 1px solid rgba(9, 30, 66, 0.18);
        background: rgba(9, 30, 66, 0.05);
        color: ${gcDashColor.textPrimary};
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.16s ease, border-color 0.16s ease;

        &:hover:not(:disabled) {
          background: rgba(9, 30, 66, 0.09);
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
      <span
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 12px;
          background: ${gcDashColor.primary};
          color: white;
          font-size: 14px;
          font-weight: 600;
        `}
        aria-hidden="true"
      >
        +
      </span>
      <span>{label}</span>
      {children && <span>{children}</span>}
    </button>
  );
};

GcDashAddContentButton.displayName = 'GcDashAddContentButton';
