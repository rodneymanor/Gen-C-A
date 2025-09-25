import React, { useState, useMemo } from 'react';
import { css } from '@emotion/react';
import DynamicTable from '@atlaskit/dynamic-table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatRelativeTime, getContentTypeIcon, getPlatformIconComponent, truncate } from '../../utils/format';
import type { ContentItem } from '../../types';

const enhancedLibraryStyles = css`
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
  
  .filter-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  
  .view-toggle {
    display: flex;
    background: var(--color-surface-elevated);
    border-radius: var(--radius-medium);
    padding: var(--space-1);
    
    .toggle-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--space-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-small);
      cursor: pointer;
      transition: var(--transition-all);
      min-height: 40px;

      &.active {
        background: var(--color-primary-500);
        color: white;
      }

      &:hover:not(.active) {
        background: var(--color-surface-hover);
      }
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

const tableContainerStyles = css`
  .enhanced-dynamic-table {
    /* Custom styling for Atlassian DynamicTable */
    
    /* Table header styling */
    .DynamicTableStateless__Table__head th {
      background-color: var(--atlassian-color-background-subtle);
      border-bottom: 2px solid var(--atlassian-color-border-bold);
      color: var(--atlassian-color-text);
      font-weight: var(--atlassian-font-weight-semibold);
      font-size: var(--atlassian-font-size-075);
      padding: var(--atlassian-space-200) var(--atlassian-space-150);
    }
    
    /* Table row styling */
    .DynamicTableStateless__Table__body tr {
      transition: var(--transition-colors);
      
      &:hover {
        background-color: var(--atlassian-color-background-selected);
      }
    }
    
    .DynamicTableStateless__Table__body td {
      padding: var(--atlassian-space-200) var(--atlassian-space-150);
      border-bottom: 1px solid var(--atlassian-color-border-default);
      vertical-align: middle;
    }
  }
`;

const contentCellStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  .content-icon {
    font-size: 18px;
    flex-shrink: 0;
  }
  
  .content-details {
    min-width: 0;
    flex: 1;
    
    .content-title {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
    }
    
    .content-description {
      font-size: var(--font-size-body-small);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: var(--line-height-normal);
    }
  }
`;

const metaCellStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  .meta-badge {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--font-size-body-small);
  }
`;

const actionCellStyles = css`
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
`;

// Mock content data (same as original Library)
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
type ViewMode = 'table' | 'grid';

interface EnhancedLibraryProps {
  fallbackToOriginal?: boolean;
}

const ContentCell: React.FC<{ item: ContentItem }> = ({ item }) => (
  <div css={contentCellStyles}>
    <div className="content-icon" aria-hidden="true">
      {getContentTypeIcon(item.type)}
    </div>
    <div className="content-details">
      <h3 className="content-title">{item.title}</h3>
      {item.description && (
        <p className="content-description">
          {truncate(item.description, 80)}
        </p>
      )}
    </div>
  </div>
);

const MetaCell: React.FC<{ item: ContentItem }> = ({ item }) => (
  <div css={metaCellStyles}>
    <Badge variant="neutral" size="small">
      {item.type}
    </Badge>
    {item.platform && (
      <div className="meta-badge">
        <span>{getPlatformIconComponent(item.platform)}</span>
        <span>{item.platform}</span>
      </div>
    )}
  </div>
);

const ActionCell: React.FC<{ item: ContentItem }> = ({ item }) => (
  <div css={actionCellStyles}>
    <Button variant="subtle" size="small">
      👁️ View
    </Button>
    <Button variant="subtle" size="small">
      ✏️ Edit
    </Button>
    <Button variant="subtle" size="small">
      ⋯
    </Button>
  </div>
);

export const EnhancedLibrary: React.FC<EnhancedLibraryProps> = ({
  fallbackToOriginal = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortKey, setSortKey] = useState<string>('updated');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const filters: { key: ContentType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📄' },
    { key: 'scripts', label: 'Scripts', icon: '✍️' },
    { key: 'videos', label: 'Videos', icon: '🎥' },
    { key: 'images', label: 'Images', icon: '📸' },
    { key: 'notes', label: 'Notes', icon: '📝' },
    { key: 'ideas', label: 'Ideas', icon: '💡' }
  ];

  const filteredAndSortedContent = useMemo(() => {
    let filtered = mockContent.filter(item => {
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

    // Sort the filtered results
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortKey) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
        case 'created':
          compareValue = a.created.getTime() - b.created.getTime();
          break;
        case 'updated':
          compareValue = a.updated.getTime() - b.updated.getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'ASC' ? compareValue : -compareValue;
    });

    return filtered;
  }, [searchQuery, activeFilter, sortKey, sortOrder]);

  // Transform data for DynamicTable
  const tableRows = useMemo(() => {
    return filteredAndSortedContent.map(item => ({
      key: item.id,
      cells: [
        {
          key: 'content',
          content: <ContentCell item={item} />
        },
        {
          key: 'meta',
          content: <MetaCell item={item} />
        },
        {
          key: 'created',
          content: formatRelativeTime(item.created)
        },
        {
          key: 'updated', 
          content: formatRelativeTime(item.updated)
        },
        {
          key: 'status',
          content: (
            <Badge 
              variant={item.status === 'published' ? 'success' : 'neutral'} 
              size="small"
            >
              {item.status}
            </Badge>
          )
        },
        {
          key: 'actions',
          content: <ActionCell item={item} />
        }
      ]
    }));
  }, [filteredAndSortedContent]);

  const tableHead = {
    cells: [
      {
        key: 'content',
        content: 'Content',
        width: 40,
        isSortable: true
      },
      {
        key: 'meta',
        content: 'Type & Platform',
        width: 15,
        isSortable: true
      },
      {
        key: 'created',
        content: 'Created',
        width: 12,
        isSortable: true
      },
      {
        key: 'updated',
        content: 'Updated',
        width: 12,
        isSortable: true
      },
      {
        key: 'status',
        content: 'Status',
        width: 10,
        isSortable: true
      },
      {
        key: 'actions',
        content: 'Actions',
        width: 11,
        isSortable: false
      }
    ]
  };

  const handleSort = (sortInfo: { key?: string; sortOrder?: 'ASC' | 'DESC' }) => {
    const nextKey = sortInfo.key ?? sortKey;
    const nextOrder = sortInfo.sortOrder ?? (sortOrder === 'ASC' ? 'DESC' : 'ASC');
    setSortKey(nextKey);
    setSortOrder(nextOrder);
  };

  // If fallback is requested, render minimal component
  if (fallbackToOriginal) {
    return (
      <div css={enhancedLibraryStyles}>
        <Card appearance="subtle" spacing="comfortable">
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>Enhanced Library with Atlassian components is loading...</p>
            <p>Falling back to original implementation if needed.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div css={enhancedLibraryStyles}>
      <div css={headerStyles}>
        <div className="header-content">
          <h1>Enhanced Content Library</h1>
          <p className="subtitle">Powered by Atlassian Design System • {filteredAndSortedContent.length} items</p>
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
        
        <div className="filter-actions">
          <div className="view-toggle">
            <button
              className={`toggle-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              📊 Table
            </button>
            <button
              className={`toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              ⚏ Grid
            </button>
          </div>
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

      {viewMode === 'table' ? (
        <div css={tableContainerStyles}>
          <Card appearance="elevated" spacing="compact">
            <DynamicTable
              head={tableHead}
              rows={tableRows}
              rowsPerPage={10}
              isLoading={false}
              isFixedSize={false}
              onSort={handleSort}
              sortKey={sortKey}
              sortOrder={sortOrder}
              emptyView={
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>
                    🔍
                  </div>
                  <h3 style={{ 
                    fontSize: 'var(--font-size-h4)', 
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 var(--space-2) 0'
                  }}>
                    No content found
                  </h3>
                  <p style={{ 
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    Try adjusting your search or filters
                  </p>
                  <Button variant="primary" onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>
              }
            />
          </Card>
        </div>
      ) : (
        <Card appearance="subtle" spacing="comfortable">
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p>Grid view coming soon! Currently showing enhanced table view.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
