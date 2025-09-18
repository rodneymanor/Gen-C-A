import { css } from '@emotion/react';
import WarningIcon from '@atlaskit/icon/glyph/warning';

const errorBannerStyles = css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-medium);
  border: 1px solid var(--color-danger-200, #f97066);
  background: var(--color-danger-50, #fee4e2);
  color: var(--color-danger-700, #b42318);
  margin-bottom: var(--space-5);

  svg {
    flex-shrink: 0;
    color: inherit;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    .error-title {
      font-weight: var(--font-weight-semibold);
    }

    .error-message {
      font-size: var(--font-size-body);
      line-height: var(--line-height-relaxed);
    }
  }
`;

type LibraryErrorBannerProps = {
  message: string;
};

export function LibraryErrorBanner({ message }: LibraryErrorBannerProps) {
  return (
    <div css={errorBannerStyles} role="alert">
      <WarningIcon label="" />
      <div className="error-content">
        <span className="error-title">Unable to load your library</span>
        <span className="error-message">{message}</span>
      </div>
    </div>
  );
}
