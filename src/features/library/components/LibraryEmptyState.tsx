import { css } from '@emotion/react';
import SearchIcon from '@atlaskit/icon/glyph/search';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type LibraryEmptyStateProps = {
  onClearFilters: () => void;
};

const emptyStateStyles = css`
  text-align: center;
  padding: var(--space-8);

  .empty-icon {
    font-size: 64px;
    margin-bottom: var(--space-4);
    opacity: 0.5;
  }

  .empty-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
  }

  .empty-description {
    font-size: var(--font-size-body);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-4);
  }
`;

export function LibraryEmptyState({ onClearFilters }: LibraryEmptyStateProps) {
  return (
    <Card appearance="subtle" spacing="comfortable">
      <div css={emptyStateStyles}>
        <div className="empty-icon">
          <SearchIcon label="Search" size="xlarge" />
        </div>
        <h3 className="empty-title">No content found</h3>
        <p className="empty-description">
          Try adjusting your search or filters to find what you're looking for
        </p>
        <Button variant="secondary" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    </Card>
  );
}
