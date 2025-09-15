import React from 'react';
import { css } from '@emotion/react';
import { token } from '@atlaskit/tokens';

const overlayStyles = css`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(120%) blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Above app chrome */
  pointer-events: all;
`;

const spinnerStyles = css`
  width: 32px;
  height: 32px;
  border: 2px solid ${token('color.border', '#e4e6ea')};
  border-top-color: ${token('color.background.brand.bold', '#0B5CFF')};
  border-radius: 50%;
  animation: page-loader-spin 0.8s linear infinite;

  @keyframes page-loader-spin {
    to { transform: rotate(360deg); }
  }
`;

export interface PageLoaderProps {
  show: boolean;
  ariaLabel?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ show, ariaLabel = 'Loading page' }) => {
  if (!show) return null;
  return (
    <div css={overlayStyles} role="status" aria-live="polite" aria-label={ariaLabel}>
      <div css={spinnerStyles} aria-hidden="true" />
    </div>
  );
};

