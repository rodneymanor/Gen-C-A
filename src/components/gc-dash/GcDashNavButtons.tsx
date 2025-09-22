import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashSpacing } from './styleUtils';

export interface GcDashNavButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  size?: 'compact' | 'default';
  className?: string;
}

const arrowIcon = (direction: 'left' | 'right') => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {direction === 'left' ? (
      <path
        d="M9.5 4.5L6 8l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M6.5 4.5L10 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const GcDashNavButtons: React.FC<GcDashNavButtonsProps> = ({
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  size = 'default',
  className,
}) => {
  const height = size === 'compact' ? 32 : 36;
  const horizontalPadding = size === 'compact' ? 8 : 12;

  const buttonCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: ${height}px;
    min-width: ${height}px;
    padding: 0 ${horizontalPadding}px;
    border-radius: 8px;
    border: 1px solid rgba(9, 30, 66, 0.2);
    background: transparent;
    color: ${gcDashColor.textPrimary};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;

    &:hover:not(:disabled) {
      background: rgba(9, 30, 66, 0.06);
      border-color: rgba(9, 30, 66, 0.28);
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
  `;

  return (
    <div
      className={clsx('gc-dash-nav-buttons', className)}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${gcDashSpacing.xs};
      `}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={disablePrevious}
        css={buttonCss}
        aria-label="Previous"
      >
        {arrowIcon('left')}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disableNext}
        css={buttonCss}
        aria-label="Next"
      >
        Next
        {arrowIcon('right')}
      </button>
    </div>
  );
};

GcDashNavButtons.displayName = 'GcDashNavButtons';
