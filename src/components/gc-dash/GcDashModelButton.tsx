import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor } from './styleUtils';

export interface GcDashModelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  model: string;
  description?: string;
  selected?: boolean;
  icon?: React.ReactNode;
}

export const GcDashModelButton: React.FC<GcDashModelButtonProps> = ({
  model,
  description,
  selected = false,
  icon,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={clsx('gc-dash-model-button', className)}
      css={css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid ${selected ? gcDashColor.primary : 'rgba(9, 30, 66, 0.18)'};
        background: ${selected ? 'rgba(11, 92, 255, 0.08)' : 'transparent'};
        color: ${gcDashColor.textPrimary};
        cursor: pointer;
        transition: background 0.16s ease, border-color 0.16s ease;
        text-align: left;

        &:hover:not(:disabled) {
          border-color: ${gcDashColor.primary};
          background: rgba(11, 92, 255, 0.06);
        }

        &:focus-visible {
          outline: none;
          border-color: ${gcDashColor.primary};
          background: rgba(11, 92, 255, 0.1);
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
          gap: 12px;
          min-width: 0;
        `}
      >
        {icon && (
          <span
            aria-hidden="true"
            css={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: 8px;
              background: rgba(9, 30, 66, 0.08);
              color: ${gcDashColor.textPrimary};
            `}
          >
            {icon}
          </span>
        )}
        <span
          css={css`
            display: flex;
            flex-direction: column;
            min-width: 0;
            gap: 4px;
          `}
        >
          <span
            css={css`
              font-size: 15px;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {model}
          </span>
          {description && (
            <span
              css={css`
                font-size: 12px;
                color: rgba(9, 30, 66, 0.6);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {description}
            </span>
          )}
        </span>
      </span>
      {selected && (
        <span
          css={css`
            display: inline-flex;
            align-items: center;
            color: ${gcDashColor.primary};
          `}
          aria-hidden="true"
        >
          ✓
        </span>
      )}
    </button>
  );
};

GcDashModelButton.displayName = 'GcDashModelButton';
