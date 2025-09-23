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
  justify-content: space-between;
`;

export const headerLeftStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 16px;
`;

export const headerRightStyles = css`
  margin-left: auto;
  flex: 1 1 320px;
  display: flex;
  justify-content: flex-end;
  min-width: 280px;
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

export const controlsCardBodyStyles = css`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
`;

export const controlsLeftStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  flex: 1 1 auto;
`;

export const platformChipsStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const controlsRightStyles = css`
  display: inline-flex;
  align-items: center;
  margin-left: auto;

  @media (max-width: 720px) {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
`;

export const gridStyles = css`
  column-count: 4;
  column-gap: 24px;
  width: 100%;

  & > * {
    break-inside: avoid;
    margin-bottom: 24px;
    width: 100%;
  }

  @media (max-width: 1400px) {
    column-count: 3;
  }

  @media (max-width: 1024px) {
    column-count: 2;
  }

  @media (max-width: 640px) {
    column-count: 1;
  }
`;

export const masonrySentinelStyles = css`
  height: 1px;
  width: 100%;
  display: block;
`;
