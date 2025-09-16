import React, { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { formatRelativeTime, getContentTypeIcon, getPlatformIconComponent, truncate } from '../utils/format';
import type { ContentItem } from '../types';
import { getLibraryContent } from './library-data';
import { useDebugger, DEBUG_LEVELS } from '../utils/debugger';
import { usePageLoad } from '../contexts/PageLoadContext';

// Atlassian Design System Icons
import DownloadIcon from '@atlaskit/icon/glyph/download';
import AddIcon from '@atlaskit/icon/glyph/add';
import SearchIcon from '@atlaskit/icon/glyph/search';
import DocumentIcon from '@atlaskit/icon/glyph/document';
import EditIcon from '@atlaskit/icon/glyph/edit';
import LightbulbIcon from '@atlaskit/icon/glyph/lightbulb';
import VideoIcon from '@atlaskit/icon/glyph/vid-play';
import CalendarIcon from '@atlaskit/icon/glyph/calendar';
import ViewIcon from '@atlaskit/icon/glyph/watch';
import UploadIcon from '@atlaskit/icon/glyph/upload';
import FolderIcon from '@atlaskit/icon/glyph/folder';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import MoreIcon from '@atlaskit/icon/glyph/more';

// Brand color: Bloom Blue (tokens)
const AGENT_PRIMARY = 'var(--color-primary-500)';
const AGENT_PRIMARY_HOVER = 'var(--color-primary-600)';
const AGENT_PRIMARY_ACTIVE = 'var(--color-primary-700)';
const AGENT_TINT_20 = 'var(--color-primary-50)';

const libraryStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
`;

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

const filtersStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .search-container {
    flex: 1;
    max-width: 400px;
    display: flex;
    align-items: center;
    /* Perplexity search: soft background, no hard border, 16px radius */
    .gen-input {
      background: var(--color-neutral-100);
      border-color: transparent;
      border-radius: 16px;
      --input-border-focus: ${AGENT_PRIMARY};
    }
    
    @media (max-width: 768px) {
      max-width: none;
    }
  }
  
  .quick-filters {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
  }
`;

const contentListStyles = css`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
`;

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

const contentItemStyles = (isSelected: boolean) => css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-medium);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
  transition: var(--transition-all);
  
  ${isSelected && css`
    border-color: ${AGENT_PRIMARY};
    background: transparent;
  `}
  
  &:hover {
    border-color: ${AGENT_PRIMARY};
    background: transparent;
  }
  
  .content-checkbox {
    margin-top: var(--space-1);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  
  .content-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: var(--space-1);
  }
  
  .content-info {
    flex: 1;
    min-width: 0;
    
    .content-title {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
    }
    
    .content-preview {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      line-height: var(--line-height-normal);
      margin: 0 0 var(--space-2) 0;
    }
    
    .content-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-500);
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }
      
      .content-type {
        background: transparent;
        color: ${AGENT_PRIMARY};
        padding: var(--space-1) var(--space-2);
        border: 1px solid ${AGENT_PRIMARY};
        border-radius: var(--radius-small);
        font-size: var(--font-size-caption);
        font-weight: var(--font-weight-medium);
        text-transform: capitalize;
      }
    }
  }
  
  .content-actions {
    flex-shrink: 0;
    opacity: 0;
    transition: var(--transition-all);
  }
  
  &:hover .content-actions {
    opacity: 1;
  }
`;

const previewPanelStyles = css`
  position: sticky;
  top: var(--space-4);
  height: fit-content;
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);
    
    .preview-title {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
  
  .preview-content {
    margin-bottom: var(--space-6);
    
    .preview-description {
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
      line-height: var(--line-height-relaxed);
      margin: 0 0 var(--space-5) 0;
      padding: var(--space-4);
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-medium);
    }

    .script-preview {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);

      .script-section {
        border: 1px solid var(--color-neutral-200);
        border-radius: var(--radius-medium);
        padding: var(--space-3);
        background: var(--color-neutral-0);

        .section-title {
          font-size: var(--font-size-body-small);
          font-weight: var(--font-weight-semibold);
          color: var(--color-neutral-700);
          margin: 0 0 var(--space-2) 0;
        }

        .section-content {
          font-size: var(--font-size-body);
          color: var(--color-neutral-800);
          line-height: var(--line-height-relaxed);
          white-space: pre-wrap;
          margin: 0;
        }
      }

      .script-raw {
        border: 1px dashed var(--color-neutral-300);
        border-radius: var(--radius-medium);
        padding: var(--space-3);
        white-space: pre-wrap;
        font-size: var(--font-size-body);
        color: var(--color-neutral-700);
        margin: 0;
      }
    }

    .preview-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      
      .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-body-small);
        
        .meta-label {
          color: var(--color-neutral-600);
          font-weight: var(--font-weight-medium);
        }
        
        .meta-value {
          color: var(--color-neutral-800);
        }
      }
    }
  }
  
  .preview-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

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

type ContentType = 'all' | 'videos' | 'scripts' | 'notes' | 'ideas';

const ContentItem: React.FC<{
  item: ContentItem;
  isSelected: boolean;
  onSelect: (item: ContentItem) => void;
  onCheckboxChange: (item: ContentItem, checked: boolean) => void;
  isChecked: boolean;
}> = ({ item, isSelected, onSelect, onCheckboxChange, isChecked }) => {
  return (
    <div
      css={contentItemStyles(isSelected)}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
    >
      <input
        type="checkbox"
        className="content-checkbox"
        checked={isChecked}
        onChange={(e) => {
          e.stopPropagation();
          onCheckboxChange(item, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="content-icon" aria-hidden="true">
        {getContentTypeIcon(item.type)}
      </div>
      
      <div className="content-info">
        <h3 className="content-title">{item.title}</h3>
        {item.description && (
          <p className="content-preview">
            {truncate(item.description, 120)}
          </p>
        )}
        <div className="content-meta">
          <div className="meta-item">
            <span className="content-type">{item.type}</span>
          </div>
          {item.platform && (
            <div className="meta-item">
              <span>{getPlatformIconComponent(item.platform)}</span>
              <span>{item.platform}</span>
            </div>
          )}
          <div className="meta-item">
            <CalendarIcon label="" />
            <span>{formatRelativeTime(item.created)}</span>
          </div>
        </div>
      </div>
      
      <div className="content-actions">
        <Button 
          variant="subtle" 
          size="small"
          iconBefore={<MoreIcon label="More options" />}
          css={css`
            min-height: 32px;
            height: 32px;
            width: 32px;
            border-radius: 8px;
            background: var(--color-neutral-100);
            &:hover { background: var(--color-neutral-200); }
          `}
        />
      </div>
    </div>
  );
};

export const Library: React.FC = () => {
  const debug = useDebugger('LibraryPage', { level: DEBUG_LEVELS.DEBUG });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const { beginPageLoad, endPageLoad } = usePageLoad();

  useEffect(() => {
    let isMounted = true;
    debug.info('Fetching library content (mount)');
    (async () => {
      beginPageLoad();
      const items = await getLibraryContent();
      if (isMounted) {
        setContent(items);
        setSelectedItem(items[0] ?? null);
        debug.info('Library content loaded', { count: items.length });
      }
      endPageLoad();
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filters: { key: ContentType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <DocumentIcon label="" /> },
    { key: 'videos', label: 'Videos', icon: <VideoIcon label="" /> },
    { key: 'scripts', label: 'Scripts', icon: <EditIcon label="" /> },
    { key: 'notes', label: 'Notes', icon: <DocumentIcon label="" /> },
    { key: 'ideas', label: 'Ideas', icon: <LightbulbIcon label="" /> }
  ];

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'videos' && item.type === 'video') ||
      (activeFilter === 'scripts' && item.type === 'script') ||
      (activeFilter === 'notes' && item.type === 'note') ||
      (activeFilter === 'ideas' && item.type === 'idea');
    
    return matchesSearch && matchesFilter;
  });

  const handleItemSelect = (item: ContentItem) => {
    setSelectedItem(item);
  };

  const handleCheckboxChange = (item: ContentItem, checked: boolean) => {
    setCheckedItems(prev => 
      checked 
        ? [...prev, item.id]
        : prev.filter(id => id !== item.id)
    );
  };

  const selectedScriptElements = selectedItem?.type === 'script'
    ? (selectedItem.metadata?.elements as Record<string, string> | undefined)
    : undefined;
  const selectedScriptContent = selectedItem?.type === 'script'
    ? (selectedItem.metadata?.content as string | undefined)
    : undefined;

  return (
    <div css={libraryStyles}>
      <div css={headerStyles}>
        <div className="header-content">
          <h1>Content Library</h1>
          <p className="subtitle">Your creative asset repository</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="subtle"
            iconBefore={<DownloadIcon label="" />}
          >
            Import
          </Button>
        <Button 
          variant="primary"
          iconBefore={<AddIcon label="" />}
        >
          Add Content
        </Button>
        </div>
      </div>

      <div css={filtersStyles}>
        <div className="search-container">
          <Input
            placeholder="Search all content..."
            iconBefore={<SearchIcon label="" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="quick-filters">
          {filters.map(filter => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'secondary' : 'subtle'}
              size="small"
              onClick={() => setActiveFilter(filter.key)}
              css={activeFilter === filter.key ? css`
                background: transparent;
                color: ${AGENT_PRIMARY};
                border: var(--border-width-thin) solid ${AGENT_PRIMARY};
                border-radius: var(--radius-medium);
                font-weight: var(--font-weight-medium);
                
                &:hover {
                  background: ${AGENT_TINT_20};
                  border-color: ${AGENT_PRIMARY_HOVER};
                }
              ` : undefined}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div css={contentListStyles}>
        <div css={contentTableStyles}>
          <div className="table-header">
            <h2>Content List</h2>
            <span className="content-count">
              {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {filteredContent.length > 0 ? (
            <div className="content-list">
              {filteredContent.map(item => (
                <ContentItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={handleItemSelect}
                  onCheckboxChange={handleCheckboxChange}
                  isChecked={checkedItems.includes(item.id)}
                />
              ))}
            </div>
          ) : (
            <Card appearance="subtle" spacing="comfortable">
              <div css={emptyStateStyles}>
                <div className="empty-icon">
                  <SearchIcon label="Search" size="xlarge" />
                </div>
                <h3 className="empty-title">No content found</h3>
                <p className="empty-description">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <Button variant="secondary">
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </div>

        {selectedItem && (
          <Card appearance="elevated" spacing="comfortable" css={previewPanelStyles}>
            <div className="preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: AGENT_PRIMARY, fontSize: '20px' }}>
                  {getContentTypeIcon(selectedItem.type)}
                </span>
                <h3 className="preview-title">{selectedItem.title}</h3>
              </div>
              <Button
                variant="subtle"
                size="small"
                onClick={() => setSelectedItem(null)}
                iconBefore={<CrossIcon label="" />}
                css={css`
                  /* Icon button: 32px square per Perplexity */
                  min-height: 32px;
                  height: 32px;
                  width: 32px;
                  border-radius: 8px;
                  background: var(--color-neutral-100);
                  &:hover { background: var(--color-neutral-200); }
                `}
              />
            </div>
            
            <div className="preview-content">
              {selectedItem.description && (
                <p className="preview-description">
                  {selectedItem.description}
                </p>
              )}

              {selectedItem.type === 'script' && (
                <div className="script-preview">
                  {selectedScriptElements ? (
                    <>
                      {selectedScriptElements.hook && (
                        <div className="script-section">
                          <h4 className="section-title">Hook</h4>
                          <p className="section-content">{selectedScriptElements.hook}</p>
                        </div>
                      )}
                      {selectedScriptElements.bridge && (
                        <div className="script-section">
                          <h4 className="section-title">Bridge</h4>
                          <p className="section-content">{selectedScriptElements.bridge}</p>
                        </div>
                      )}
                      {selectedScriptElements.goldenNugget && (
                        <div className="script-section">
                          <h4 className="section-title">Golden Nugget</h4>
                          <p className="section-content">{selectedScriptElements.goldenNugget}</p>
                        </div>
                      )}
                      {selectedScriptElements.wta && (
                        <div className="script-section">
                          <h4 className="section-title">Call to Action</h4>
                          <p className="section-content">{selectedScriptElements.wta}</p>
                        </div>
                      )}
                    </>
                  ) : selectedScriptContent ? (
                    <pre className="script-raw">{selectedScriptContent}</pre>
                  ) : null}
                </div>
              )}
              
              <div className="preview-meta">
                <div className="meta-row">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">{selectedItem.type}</span>
                </div>
                {selectedItem.platform && (
                  <div className="meta-row">
                    <span className="meta-label">Platform</span>
                    <span className="meta-value">{selectedItem.platform}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{formatRelativeTime(selectedItem.created)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Status</span>
                  <span className="meta-value">{selectedItem.status}</span>
                </div>
              </div>
            </div>
            
            <div className="preview-actions">
              <Button 
                variant="secondary" 
                fullWidth
                iconBefore={<ViewIcon label="" />}
                css={css`
                  background: transparent;
                  color: ${AGENT_PRIMARY};
                  border: var(--border-width-thin) solid ${AGENT_PRIMARY};
                  border-radius: var(--radius-medium);
                  font-weight: var(--font-weight-medium);
                  &:hover { background: ${AGENT_TINT_20}; border-color: ${AGENT_PRIMARY_HOVER}; }
                `}
              >
                View
              </Button>
              <Button 
                variant="secondary" 
                fullWidth
                iconBefore={<EditIcon label="" />}
                css={css`
                  background: transparent;
                  color: ${AGENT_PRIMARY};
                  border: var(--border-width-thin) solid ${AGENT_PRIMARY};
                  border-radius: var(--radius-medium);
                  font-weight: var(--font-weight-medium);
                  &:hover { background: ${AGENT_TINT_20}; border-color: ${AGENT_PRIMARY_HOVER}; }
                `}
              >
                Edit
              </Button>
              <Button 
                variant="subtle" 
                fullWidth
                iconBefore={<UploadIcon label="" />}
                css={css`
                  background: transparent;
                  color: var(--color-text-secondary);
                  border: none;
                  font-weight: var(--font-weight-medium);
                  text-decoration: none;
                  
                  &:hover {
                    color: var(--color-text-primary);
                    text-decoration: underline;
                  }
                `}
              >
                Download
              </Button>
              <Button 
                variant="subtle" 
                fullWidth
                iconBefore={<FolderIcon label="" />}
                css={css`
                  background: transparent;
                  color: var(--color-text-secondary);
                  border: none;
                  font-weight: var(--font-weight-medium);
                  text-decoration: none;
                  
                  &:hover {
                    color: var(--color-text-primary);
                    text-decoration: underline;
                  }
                `}
              >
                Add to Collection
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
