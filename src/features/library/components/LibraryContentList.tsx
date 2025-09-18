import { css } from '@emotion/react';
import type { ContentItem } from '@/types';
import { LibraryContentItem } from './LibraryContentItem';
import { LibraryEmptyState } from './LibraryEmptyState';

const contentTableStyles = css`
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);

    h2 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }

    .content-count {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
    }
  }

  .content-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

type LibraryContentListProps = {
  items: ContentItem[];
  selectedItemId: string | null;
  checkedItemIds: string[];
  deletingItemId: string | null;
  onSelectItem: (item: ContentItem) => void;
  onToggleChecked: (item: ContentItem, checked: boolean) => void;
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (item: ContentItem) => void | Promise<void>;
  onClearFilters: () => void;
};

export function LibraryContentList({
  items,
  selectedItemId,
  checkedItemIds,
  deletingItemId,
  onSelectItem,
  onToggleChecked,
  onEditItem,
  onDeleteItem,
  onClearFilters,
}: LibraryContentListProps) {
  return (
    <div css={contentTableStyles}>
      <div className="table-header">
        <h2>Content List</h2>
        <span className="content-count">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="content-list">
          {items.map((item) => (
            <LibraryContentItem
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              isChecked={checkedItemIds.includes(item.id)}
              isDeleting={deletingItemId === item.id}
              onSelect={onSelectItem}
              onCheckboxChange={onToggleChecked}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      ) : (
        <LibraryEmptyState onClearFilters={onClearFilters} />
      )}
    </div>
  );
}
