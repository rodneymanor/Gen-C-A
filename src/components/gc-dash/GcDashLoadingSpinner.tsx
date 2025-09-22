import React from 'react';
import { css, keyframes } from '@emotion/react';
import { gcDashColor } from './styleUtils';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export interface GcDashLoadingSpinnerProps {
  size?: number;
  strokeWidth?: number;
  lightOnDark?: boolean;
  label?: string;
}

export const GcDashLoadingSpinner: React.FC<GcDashLoadingSpinnerProps> = ({
  size = 20,
  strokeWidth = 3,
  lightOnDark = false,
  label = 'Loading…',
}) => {
  const dimension = `${size}px`;
  const border = `${strokeWidth}px solid`;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      css={css`
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${dimension};
        height: ${dimension};

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: ${border} rgba(9, 30, 66, 0.12);
          opacity: 0.4;
        }

        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: ${border} transparent;
          border-top-color: ${lightOnDark ? 'rgba(255,255,255,0.9)' : gcDashColor.primary};
          animation: ${spin} 0.9s linear infinite;
        }
      `}
    />
  );
};
