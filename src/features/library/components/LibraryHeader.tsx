import { css } from '@emotion/react';
import LightbulbIcon from '@atlaskit/icon/glyph/lightbulb';
import EditIcon from '@atlaskit/icon/glyph/edit';
import { Button } from '@/components/ui/Button';

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }

  .header-content {
    flex: 1;

    h1 {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }

    .subtitle {
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);

    @media (max-width: 768px) {
      flex-wrap: wrap;
    }
  }
`;

type LibraryHeaderProps = {
  onAddIdea?: () => void;
  onWriteScript: () => void;
};

export function LibraryHeader({ onAddIdea, onWriteScript }: LibraryHeaderProps) {
  return (
    <div css={headerStyles}>
      <div className="header-content">
        <h1>Content Library</h1>
        <p className="subtitle">Your creative asset repository</p>
      </div>
      <div className="header-actions">
        <Button variant="subtle" iconBefore={<LightbulbIcon label="" />} onClick={onAddIdea}>
          Add Idea
        </Button>
        <Button variant="primary" iconBefore={<EditIcon label="" />} onClick={onWriteScript}>
          Write Script
        </Button>
      </div>
    </div>
  );
}
