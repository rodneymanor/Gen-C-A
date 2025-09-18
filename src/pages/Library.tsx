import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { LibraryHeader } from '@/features/library/components/LibraryHeader';
import { LibraryFilters } from '@/features/library/components/LibraryFilters';
import { LibraryContentList } from '@/features/library/components/LibraryContentList';
import { LibraryPreviewPanel } from '@/features/library/components/LibraryPreviewPanel';
import { LibraryErrorBanner } from '@/features/library/components/LibraryErrorBanner';
import { useLibrary } from '@/features/library/hooks/useLibrary';
import { getEditorPath } from '@/features/library/utils/editorNavigation';

const libraryStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
`;

const contentLayoutStyles = css`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
`;

export function Library() {
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filters,
    filteredContent,
    selectItem,
    selectedItem,
    checkedItemIds,
    toggleItemChecked,
    errorMessage,
    clearFilters,
    handleDeleteItem,
    deletingItemId,
  } = useLibrary();

  const handleWriteScript = () => {
    navigate('/write');
  };

  const handleEditItem = (item: Parameters<typeof getEditorPath>[0]) => {
    navigate(getEditorPath(item));
  };

  return (
    <div css={libraryStyles}>
      <LibraryHeader onWriteScript={handleWriteScript} />

      {errorMessage && <LibraryErrorBanner message={errorMessage} />}

      <LibraryFilters
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={(filter) => setActiveFilter(filter)}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
      />

      <div css={contentLayoutStyles}>
        <LibraryContentList
          items={filteredContent}
          selectedItemId={selectedItem?.id ?? null}
          checkedItemIds={checkedItemIds}
          deletingItemId={deletingItemId}
          onSelectItem={(item) => selectItem(item)}
          onToggleChecked={(item, checked) => toggleItemChecked(item, checked)}
          onEditItem={handleEditItem}
          onDeleteItem={(item) => {
            void handleDeleteItem(item);
          }}
          onClearFilters={clearFilters}
        />

        {selectedItem && (
          <LibraryPreviewPanel
            item={selectedItem}
            onClose={() => selectItem(null)}
          />
        )}
      </div>
    </div>
  );
}
