import React, { useCallback, useEffect, useMemo } from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import type { ContentItem } from '@/types';
import {
  formatRelativeTime,
  formatDateTime,
  formatReadingTime,
  formatDuration,
  getContentTypeIcon,
  getPlatformIconComponent,
  truncate,
} from '@/utils/format';
import {
  GcDashPlanChip,
  GcDashNavButtons,
  GcDashSearchBar,
  GcDashButton,
  GcDashCard,
  GcDashCardHeader,
  GcDashCardTitle,
  GcDashCardSubtitle,
  GcDashCardBody,
  GcDashCardFooter,
  GcDashBlankSlate,
  GcDashAvatar,
  GcDashLabel,
} from '@/components/gc-dash';
import AddIcon from '@atlaskit/icon/glyph/add';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import EditIcon from '@atlaskit/icon/glyph/edit';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import type { ContentType } from '../types';
import { useLibrary } from '../hooks/useLibrary';
import { getEditorPath } from '../utils/editorNavigation';

const pageContainerStyles = css`
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

const shellStyles = css`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const headerRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
`;

const headerLeftStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 16px;
`;

const searchBarStyles = css`
  flex: 1;
  min-width: 280px;
  margin-left: auto;
`;

const filtersRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const filterChipGroupStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const actionsGroupStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const heroRowStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 20px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const momentumListStyles = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
`;

const timelineItemStyles = css`
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 12px;
  align-items: flex-start;
`;

const timelineMarkerStyles = css`
  position: relative;
  width: 12px;
  margin-top: 6px;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: rgba(11, 92, 255, 0.8);
    display: block;
    box-shadow: 0 0 0 4px rgba(11, 92, 255, 0.14);
  }
`;

const timelineContentStyles = css`
  display: grid;
  gap: 6px;

  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: rgba(9, 30, 66, 0.85);
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 13px;
    color: rgba(9, 30, 66, 0.6);
  }

  .description {
    font-size: 13px;
    color: rgba(9, 30, 66, 0.7);
  }
`;

const quickActionCardStyles = css`
  display: grid;
  gap: 16px;
`;

const quickActionListStyles = css`
  display: grid;
  gap: 12px;
`;

const quickActionButtonStyles = css`
  border: 1px solid rgba(9, 30, 66, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  background: rgba(255, 255, 255, 0.95);
  color: rgba(9, 30, 66, 0.85);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  .action-title {
    font-size: 15px;
    font-weight: 600;
  }

  .action-caption {
    font-size: 13px;
    color: rgba(9, 30, 66, 0.6);
  }

  &:hover {
    border-color: rgba(11, 92, 255, 0.5);
    box-shadow: 0 14px 28px rgba(11, 92, 255, 0.14);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(11, 92, 255, 0.45);
    outline-offset: 2px;
  }

  &[data-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const tagSurfaceStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 16px 20px;
  border-radius: 18px;
  border: 1px solid rgba(9, 30, 66, 0.1);
  background: rgba(11, 92, 255, 0.04);
  color: rgba(9, 30, 66, 0.75);
`;

const contentLayoutStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const itemGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const previewColumnStyles = css`
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1200px) {
    position: static;
  }
`;

const itemCardStyles = css`
  border-radius: 18px;
  border-color: rgba(9, 30, 66, 0.1);
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &[data-selected='true'] {
    border-color: rgba(11, 92, 255, 0.55);
    background: rgba(11, 92, 255, 0.05);
    box-shadow: 0 18px 36px rgba(11, 92, 255, 0.14);
  }
`;

const itemCardBodyStyles = css`
  display: grid;
  gap: 12px;
`;

const itemMetaStyles = css`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  color: rgba(9, 30, 66, 0.6);
  font-size: 13px;
`;

const itemFooterStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: rgba(9, 30, 66, 0.65);
  font-size: 12px;
`;

const tagRowStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const previewMetaGridStyles = css`
  display: grid;
  gap: 8px;
`;

const previewMetaRowStyles = css`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: rgba(9, 30, 66, 0.65);
`;

const previewSectionStyles = css`
  display: grid;
  gap: 16px;
`;

type FilterToken = {
  key: ContentType;
  label: string;
};

interface LibraryItemCardProps {
  item: ContentItem;
  selected: boolean;
  onSelect: () => void;
}

const LibraryItemCard: React.FC<LibraryItemCardProps> = ({ item, selected, onSelect }) => {
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  const platformIcon = item.platform ? getPlatformIconComponent(item.platform) : null;
  const hasTags = item.tags?.length;
  const truncatedDescription = item.description ? truncate(item.description, 150) : '';

  return (
    <GcDashCard
      interactive
      onClick={onSelect}
      data-selected={selected ? 'true' : undefined}
      css={itemCardStyles}
    >
      <GcDashCardBody css={itemCardBodyStyles}>
        <div css={itemMetaStyles}>
          <GcDashLabel
            tone="primary"
            variant="soft"
            uppercase={false}
            leadingIcon={getContentTypeIcon(item.type)}
          >
            {typeLabel}
          </GcDashLabel>
          <span>Updated {formatRelativeTime(item.updated)}</span>
          {item.status && <span>Status: {item.status}</span>}
        </div>

        <div>
          <GcDashCardTitle>{item.title}</GcDashCardTitle>
          {truncatedDescription && (
            <GcDashCardSubtitle>{truncatedDescription}</GcDashCardSubtitle>
          )}
        </div>

        <div css={itemFooterStyles}>
          {platformIcon && (
            <span aria-label={item.platform ?? 'Platform'}>{platformIcon}</span>
          )}
          {item.creator && <span>By {item.creator}</span>}
          {typeof item.wordCount === 'number' && (
            <span>{formatReadingTime(item.wordCount)}</span>
          )}
          {typeof item.duration === 'number' && (
            <span>{formatDuration(item.duration)}</span>
          )}
        </div>

        {hasTags && (
          <div css={tagRowStyles}>
            {item.tags.slice(0, 4).map((tag) => (
              <GcDashLabel key={tag} tone="neutral" variant="outline" uppercase={false}>
                #{tag}
              </GcDashLabel>
            ))}
            {item.tags.length > 4 && (
              <GcDashLabel tone="neutral" variant="soft" uppercase={false}>
                +{item.tags.length - 4} more
              </GcDashLabel>
            )}
          </div>
        )}
      </GcDashCardBody>
    </GcDashCard>
  );
};

interface LibraryPreviewCardProps {
  item: ContentItem;
  onOpen: () => void;
  onWriteScript: () => void;
  onDelete: () => void;
  deleting: boolean;
}

const LibraryPreviewCard: React.FC<LibraryPreviewCardProps> = ({
  item,
  onOpen,
  onWriteScript,
  onDelete,
  deleting,
}) => {
  const platformIcon = item.platform ? getPlatformIconComponent(item.platform) : null;
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  return (
    <GcDashCard>
      <GcDashCardBody css={previewSectionStyles}>
        <div>
          <GcDashCardHeader>
            <div css={previewMetaGridStyles}>
              <GcDashLabel
                tone="primary"
                variant="soft"
                uppercase={false}
                leadingIcon={getContentTypeIcon(item.type)}
              >
                {typeLabel}
              </GcDashLabel>
              <GcDashCardTitle>{item.title}</GcDashCardTitle>
              {item.description && (
                <GcDashCardSubtitle>{truncate(item.description, 240)}</GcDashCardSubtitle>
              )}
            </div>
          </GcDashCardHeader>
        </div>

        <div css={previewMetaGridStyles}>
          <div css={previewMetaRowStyles}>
            <strong>Created</strong>
            <span>{formatDateTime(item.created)}</span>
          </div>
          <div css={previewMetaRowStyles}>
            <strong>Last updated</strong>
            <span>{formatRelativeTime(item.updated)}</span>
          </div>
          {item.platform && (
            <div css={previewMetaRowStyles}>
              <strong>Platform</strong>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden>{platformIcon}</span>
                {item.platform}
              </span>
            </div>
          )}
          {typeof item.wordCount === 'number' && (
            <div css={previewMetaRowStyles}>
              <strong>Length</strong>
              <span>{formatReadingTime(item.wordCount)}</span>
            </div>
          )}
          {typeof item.duration === 'number' && (
            <div css={previewMetaRowStyles}>
              <strong>Duration</strong>
              <span>{formatDuration(item.duration)}</span>
            </div>
          )}
          {item.status && (
            <div css={previewMetaRowStyles}>
              <strong>Status</strong>
              <span>{item.status}</span>
            </div>
          )}
          {item.tags?.length ? (
            <div css={previewMetaRowStyles}>
              <strong>Tags</strong>
              <span>
                <div css={tagRowStyles}>
                  {item.tags.map((tag) => (
                    <GcDashLabel key={tag} tone="neutral" variant="outline" uppercase={false}>
                      #{tag}
                    </GcDashLabel>
                  ))}
                </div>
              </span>
            </div>
          ) : null}
        </div>

        {item.creator && (
          <div css={previewMetaRowStyles}>
            <strong>Owner</strong>
            <GcDashAvatar name={item.creator} size="sm" />
          </div>
        )}
      </GcDashCardBody>
      <GcDashCardFooter>
        <GcDashButton
          variant="secondary"
          size="sm"
          leadingIcon={<EditIcon label="" />}
          onClick={onOpen}
        >
          Open in editor
        </GcDashButton>
        <GcDashButton
          variant="ghost"
          size="sm"
          leadingIcon={<AddIcon label="" />}
          onClick={onWriteScript}
        >
          Derive script
        </GcDashButton>
        <GcDashButton
          variant="ghost"
          size="sm"
          leadingIcon={<TrashIcon label="" />}
          onClick={onDelete}
          disabled={deleting}
          isLoading={deleting}
        >
          Delete
        </GcDashButton>
      </GcDashCardFooter>
    </GcDashCard>
  );
};

export const LibraryRoot: React.FC = () => {
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filters,
    content,
    filteredContent,
    selectItem,
    selectedItem,
    errorMessage,
    clearFilters,
    handleDeleteItem,
    deletingItemId,
    refreshContent,
  } = useLibrary();

  useEffect(() => {
    if (!filteredContent.length) {
      selectItem(null);
      return;
    }

    if (!selectedItem || !filteredContent.some((item) => item.id === selectedItem.id)) {
      selectItem(filteredContent[0]!);
    }
  }, [filteredContent, selectedItem, selectItem]);

  const currentItem = useMemo(() => {
    if (!selectedItem) {
      return filteredContent[0] ?? null;
    }
    if (filteredContent.some((item) => item.id === selectedItem.id)) {
      return selectedItem;
    }
    return filteredContent[0] ?? selectedItem;
  }, [filteredContent, selectedItem]);

  const typeCounts = useMemo(() => {
    return {
      all: content.length,
      scripts: content.filter((item) => item.type === 'script').length,
      notes: content.filter((item) => item.type === 'note').length,
    } as Record<ContentType | 'all', number>;
  }, [content]);

  const headerInfo = useMemo(() => {
    const filterLabel = activeFilter === 'all' ? 'All content' : `${activeFilter} only`;
    const total = filteredContent.length;
    return `${total} in view · ${filterLabel}`;
  }, [activeFilter, filteredContent.length]);

  const filterTokens: FilterToken[] = useMemo(
    () =>
      filters.map((filter) => ({
        key: filter.key,
        label: filter.label,
      })),
    [filters]
  );

  const recentItems = useMemo(() => {
    return content
      .slice()
      .sort((a, b) => b.updated.getTime() - a.updated.getTime())
      .slice(0, 4);
  }, [content]);

  const topTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    content.forEach((item) => {
      item.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [content]);

  const handleOpenEditor = useCallback(
    (item: ContentItem) => {
      navigate(getEditorPath(item));
    },
    [navigate]
  );

  const handleWriteScript = useCallback(() => {
    navigate('/write');
  }, [navigate]);

  const quickActions = useMemo(
    () => [
      {
        id: 'new-script',
        label: 'Draft a new script',
        caption: 'Open the Claude-style composer with a blank canvas.',
        onClick: handleWriteScript,
        disabled: false,
      },
      {
        id: 'open-latest',
        label: recentItems[0]
          ? `Jump back into “${recentItems[0]!.title}”`
          : 'Jump back into your latest piece',
        caption: recentItems[0]
          ? `Updated ${formatRelativeTime(recentItems[0]!.updated)} · ${recentItems[0]!.type}`
          : 'We’ll surface your last touched item once the library syncs.',
        onClick: recentItems[0]
          ? () => {
              handleOpenEditor(recentItems[0]!);
            }
          : undefined,
        disabled: !recentItems[0],
      },
      {
        id: 'refresh',
        label: 'Sync from source',
        caption: 'Pull the freshest scripts and notes from Firestore.',
        onClick: () => {
          void refreshContent();
        },
        disabled: false,
      },
    ],
    [handleWriteScript, recentItems, refreshContent, handleOpenEditor]
  );

  const handlePreviousNav = () => navigate('/collections');
  const handleNextNav = () => navigate('/write-redesign');

  return (
    <div css={pageContainerStyles}>
      <div css={shellStyles}>
        <header css={headerRowStyles}>
          <div css={headerLeftStyles}>
            <GcDashPlanChip planName="Content library" info={headerInfo} highlighted />
            <GcDashNavButtons onPrevious={handlePreviousNav} onNext={handleNextNav} />
          </div>
          <GcDashSearchBar
            css={searchBarStyles}
            placeholder="Search titles, descriptions, tags"
            defaultValue={searchQuery}
            submitLabel="Filter"
            onSubmitSearch={(value) => setSearchQuery(value)}
            filters={
              searchQuery && (
                <GcDashButton variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                  Clear
                </GcDashButton>
              )
            }
          />
        </header>

        <section css={heroRowStyles}>
          <GcDashCard>
            <GcDashCardBody>
              <GcDashCardHeader>
                <div>
                  <GcDashCardSubtitle>Momentum</GcDashCardSubtitle>
                  <GcDashCardTitle>Latest activity</GcDashCardTitle>
                </div>
                <GcDashButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void refreshContent();
                  }}
                >
                  Refresh
                </GcDashButton>
              </GcDashCardHeader>
              {recentItems.length === 0 ? (
                <GcDashBlankSlate
                  centerContent={false}
                  title="No recent updates yet"
                  description="Once you edit a script or add notes you’ll see them summarized here."
                  primaryAction={
                    <GcDashButton variant="primary" onClick={handleWriteScript}>
                      Start a new script
                    </GcDashButton>
                  }
                />
              ) : (
                <ul css={momentumListStyles}>
                  {recentItems.map((item) => (
                    <li key={item.id} css={timelineItemStyles}>
                      <span css={timelineMarkerStyles} aria-hidden />
                      <div css={timelineContentStyles}>
                        <div className="title-row">
                          {item.title}
                          <GcDashLabel
                            tone="primary"
                            variant="soft"
                            uppercase={false}
                            leadingIcon={getContentTypeIcon(item.type)}
                          >
                            {item.type}
                          </GcDashLabel>
                        </div>
                        <div className="meta-row">
                          <span>Updated {formatRelativeTime(item.updated)}</span>
                          {item.creator && <span>By {item.creator}</span>}
                          {item.platform && <span>{item.platform}</span>}
                        </div>
                        {item.description && (
                          <p className="description">{truncate(item.description, 120)}</p>
                        )}
                        <GcDashButton
                          variant="link"
                          size="sm"
                          onClick={() => handleOpenEditor(item)}
                        >
                          Open details
                        </GcDashButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GcDashCardBody>
          </GcDashCard>

          <GcDashCard>
            <GcDashCardBody css={quickActionCardStyles}>
              <div>
                <GcDashCardSubtitle>Next best actions</GcDashCardSubtitle>
                <GcDashCardTitle>Keep the library moving</GcDashCardTitle>
              </div>
              <div css={quickActionListStyles}>
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    css={quickActionButtonStyles}
                    onClick={action.onClick}
                    data-disabled={action.disabled ? 'true' : undefined}
                  >
                    <span className="action-title">{action.label}</span>
                    <span className="action-caption">{action.caption}</span>
                  </button>
                ))}
              </div>
            </GcDashCardBody>
          </GcDashCard>
        </section>

        {topTags.length > 0 && (
          <section css={tagSurfaceStyles}>
            <strong>Topics with traction</strong>
            <div css={tagRowStyles}>
              {topTags.map((tag) => (
                <GcDashLabel key={tag} tone="primary" variant="outline" uppercase={false}>
                  #{tag}
                </GcDashLabel>
              ))}
            </div>
          </section>
        )}

        <div css={filtersRowStyles}>
          <div css={filterChipGroupStyles}>
            {filterTokens.map((token) => {
              const isActive = activeFilter === token.key;
              const count = typeCounts[token.key] ?? 0;
              return (
                <GcDashButton
                  key={token.key}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveFilter(token.key)}
                >
                  {token.label}
                  <span aria-hidden style={{ opacity: 0.6, marginLeft: 8 }}>{count}</span>
                </GcDashButton>
              );
            })}
          </div>

          <div css={actionsGroupStyles}>
            <GcDashButton
              variant="ghost"
              size="sm"
              leadingIcon={<RefreshIcon label="" />}
              onClick={() => {
                void refreshContent();
              }}
            >
              Refresh
            </GcDashButton>
            <GcDashButton
              variant="primary"
              size="sm"
              leadingIcon={<AddIcon label="" />}
              onClick={handleWriteScript}
            >
              New script
            </GcDashButton>
          </div>
        </div>

        {errorMessage ? (
          <GcDashBlankSlate
            title="We couldn’t load your library"
            description={errorMessage}
            primaryAction={
              <GcDashButton variant="primary" onClick={() => { void refreshContent(); }}>
                Try again
              </GcDashButton>
            }
            secondaryAction={
              <GcDashButton variant="ghost" onClick={clearFilters}>
                Reset filters
              </GcDashButton>
            }
          />
        ) : (
          <section css={contentLayoutStyles}>
            <div>
              {filteredContent.length === 0 ? (
                <GcDashBlankSlate
                  title="No items match these filters"
                  description="Adjust your search or switch filters to see more of the content library."
                  centerContent={false}
                  primaryAction={
                    <GcDashButton variant="primary" onClick={clearFilters}>
                      Clear filters
                    </GcDashButton>
                  }
                />
              ) : (
                <div css={itemGridStyles}>
                  {filteredContent.map((item) => (
                    <LibraryItemCard
                      key={item.id}
                      item={item}
                      selected={currentItem?.id === item.id}
                      onSelect={() => selectItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside css={previewColumnStyles}>
              {currentItem ? (
                <LibraryPreviewCard
                  item={currentItem}
                  onOpen={() => handleOpenEditor(currentItem)}
                  onWriteScript={handleWriteScript}
                  onDelete={() => {
                    void handleDeleteItem(currentItem);
                  }}
                  deleting={deletingItemId === currentItem.id}
                />
              ) : (
                <GcDashBlankSlate
                  title="Select an item"
                  description="Choose any card on the left to review its details, metadata, and next best actions."
                  primaryAction={
                    <GcDashButton variant="primary" onClick={handleWriteScript}>
                      Start a new script
                    </GcDashButton>
                  }
                  secondaryAction={
                    <GcDashButton variant="ghost" onClick={() => { void refreshContent(); }}>
                      Refresh library
                    </GcDashButton>
                  }
                />
              )}
            </aside>
          </section>
        )}
      </div>
    </div>
  );
};

LibraryRoot.displayName = 'LibraryRoot';

export default LibraryRoot;
