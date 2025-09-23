import { css } from '@emotion/react';

export const pageContainerStyles = css`
  min-height: 100vh;
  background: rgba(9, 30, 66, 0.02);
  padding: 48px 64px 64px;

  @media (max-width: 1024px) {
    padding: 32px 32px 48px;
  }

  @media (max-width: 640px) {
    padding: 24px 20px 40px;
  }
`;

export const shellStyles = css`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const headerRowStyles = css`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

export const headerLeftStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 16px;
`;

export const heroStyles = css`
  display: grid;
  gap: 20px;
  padding: 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(11, 92, 255, 0.08), rgba(9, 30, 66, 0.02));
  border: 1px solid rgba(11, 92, 255, 0.12);
`;

export const heroTitleStyles = css`
  display: grid;
  gap: 12px;

  h1 {
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.02em;
    color: rgba(9, 30, 66, 0.95);
  }

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: rgba(9, 30, 66, 0.68);
    max-width: 680px;
  }
`;

export const highlightRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const controlsRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

export const platformChipsStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const gridStyles = css`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
`;

export const masonrySentinelStyles = css`
  height: 1px;
`;
