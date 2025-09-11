import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { formatRelativeTime, getContentTypeIcon, getPlatformIcon, truncate } from '../utils/format';
import type { ContentItem } from '../types';

const libraryStyles = css`
  max-width: 1200px;
  margin: 0 auto;
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
    
    @media (max-width: 768px) {
      max-width: none;
    }
  }
  
  .quick-filters {
    display: flex;
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
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
  `}
  
  &:hover {
    border-color: var(--color-primary-300);
    background: var(--color-primary-50);
    transform: translateY(-1px);
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
        background: var(--color-neutral-100);
        color: var(--color-neutral-700);
        padding: var(--space-1) var(--space-2);
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
    
    .preview-thumbnail {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: var(--color-neutral-200);
      border-radius: var(--radius-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: var(--color-neutral-400);
      margin-bottom: var(--space-4);
    }
    
    .preview-description {
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
      line-height: var(--line-height-relaxed);
      margin: 0 0 var(--space-4) 0;
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

// Mock content data
const mockContent: ContentItem[] = [
  {
    id: '1',
    title: 'Summer Skincare Script',
    description: '"Wait, you\'re using WHAT on your face this summer? 😱" - A fun TikTok script about summer skincare routines for teens.',
    type: 'script',
    platform: 'tiktok',
    wordCount: 87,
    tags: ['skincare', 'summer', 'teens'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'published',
    metadata: { estimatedDuration: 15 }
  },
  {
    id: '2',
    title: 'Beach Day Transformation',
    description: 'Quick makeup transformation video perfect for summer beach days',
    type: 'video',
    platform: 'tiktok',
    thumbnail: '',
    duration: 15,
    tags: ['makeup', 'transformation', 'beach'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'published',
    metadata: { views: 247000 }
  },
  {
    id: '3',
    title: 'Content Ideas - July Batch',
    description: '10 summer content ideas for lifestyle creators including trending topics and seasonal themes',
    type: 'idea',
    tags: ['content-ideas', 'summer', 'lifestyle'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'draft',
    metadata: {}
  },
  {
    id: '4',
    title: 'Product Photos - Sunscreen Collection',
    description: '12 high-resolution product photos with beach-themed backgrounds for summer campaign',
    type: 'image',
    tags: ['product-photos', 'sunscreen', 'beach'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'published',
    metadata: { imageCount: 12 }
  },
  {
    id: '5',
    title: 'Viral Hook Analysis',
    description: 'Analysis of top 10 viral hooks in fitness content including engagement metrics and timing strategies',
    type: 'note',
    tags: ['analysis', 'hooks', 'fitness', 'viral'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'published',
    metadata: {}
  }
];

type ContentType = 'all' | 'scripts' | 'videos' | 'images' | 'notes' | 'ideas';

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
              <span>{getPlatformIcon(item.platform)}</span>
              <span>{item.platform}</span>
            </div>
          )}
          <div className="meta-item">
            <span>📅</span>
            <span>{formatRelativeTime(item.created)}</span>
          </div>
        </div>
      </div>
      
      <div className="content-actions">
        <Button variant="subtle" size="small">
          ⋯
        </Button>
      </div>
    </div>
  );
};

export const Library: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(mockContent[0]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const filters: { key: ContentType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📄' },
    { key: 'scripts', label: 'Scripts', icon: '✍️' },
    { key: 'videos', label: 'Videos', icon: '🎥' },
    { key: 'images', label: 'Images', icon: '📸' },
    { key: 'notes', label: 'Notes', icon: '📝' },
    { key: 'ideas', label: 'Ideas', icon: '💡' }
  ];

  const filteredContent = mockContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'scripts' && item.type === 'script') ||
      (activeFilter === 'videos' && item.type === 'video') ||
      (activeFilter === 'images' && item.type === 'image') ||
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

  return (
    <div css={libraryStyles}>
      <div css={headerStyles}>
        <div className="header-content">
          <h1>Content Library</h1>
          <p className="subtitle">Your creative asset repository</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary">
            📥 Import
          </Button>
          <Button variant="primary">
            + Add Content
          </Button>
        </div>
      </div>

      <div css={filtersStyles}>
        <div className="search-container">
          <Input
            placeholder="Search all content..."
            iconBefore="🔍"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="quick-filters">
          {filters.map(filter => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.icon} {filter.label}
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
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No content found</h3>
                <p className="empty-description">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <Button variant="primary">
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </div>

        {selectedItem && (
          <Card appearance="elevated" spacing="comfortable" css={previewPanelStyles}>
            <div className="preview-header">
              <h3 className="preview-title">{selectedItem.title}</h3>
              <Button
                variant="subtle"
                size="small"
                onClick={() => setSelectedItem(null)}
                iconBefore="×"
              />
            </div>
            
            <div className="preview-content">
              <div className="preview-thumbnail">
                {selectedItem.thumbnail ? (
                  <img src={selectedItem.thumbnail} alt={selectedItem.title} />
                ) : (
                  getContentTypeIcon(selectedItem.type)
                )}
              </div>
              
              {selectedItem.description && (
                <p className="preview-description">
                  {selectedItem.description}
                </p>
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
              <Button variant="primary" fullWidth>
                📖 View
              </Button>
              <Button variant="secondary" fullWidth>
                ✏️ Edit
              </Button>
              <Button variant="subtle" fullWidth>
                📤 Download
              </Button>
              <Button variant="subtle" fullWidth>
                🗂️ Add to Collection
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};