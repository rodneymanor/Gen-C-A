import React, { useState, useMemo } from 'react';
import { css } from '@emotion/react';
import DynamicTable from '@atlaskit/dynamic-table';
import type { UIAnalyticsEvent } from '@atlaskit/analytics-next';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { VideoGrid as LayoutGrid } from '../layout/Grid';
import { VideoGrid as LegacyVideoGrid } from '../collections/VideoGrid';
import { formatDuration, getPlatformIconComponent, formatRelativeTime } from '../../utils/format';
import type { ContentItem } from '../../types';

// Atlassian Design System Icons
import VideoIcon from '@atlaskit/icon/glyph/vid-play';
import PlayIcon from '@atlaskit/icon/glyph/vid-play';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import MoreIcon from '@atlaskit/icon/glyph/more';
import GridIcon from '@atlaskit/icon/glyph/app-switcher';
import TableIcon from '@atlaskit/icon/glyph/table';
import CameraIcon from '@atlaskit/icon/glyph/camera';

export interface EnhancedVideoGridProps {
  videos: ContentItem[];
  onVideoSelect?: (video: ContentItem) => void;
  onVideoPlay?: (video: ContentItem) => void;
  selectedVideos?: string[];
  showBulkActions?: boolean;
  fallbackToOriginal?: boolean;
}

const enhancedGridStyles = css`
  .view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    
    .view-title {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
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
        font-size: var(--font-size-body-small);
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
  }

  .table-container {
    /* Atlassian DynamicTable custom styling */
    .enhanced-video-table {
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
        cursor: pointer;
        
        &:hover {
          background-color: var(--atlassian-color-background-selected);
        }
        
        &.selected {
          background-color: var(--atlassian-color-background-selected-hovered);
          border-left: 3px solid var(--color-primary-500);
        }
      }
      
      .DynamicTableStateless__Table__body td {
        padding: var(--atlassian-space-200) var(--atlassian-space-150);
        border-bottom: 1px solid var(--atlassian-color-border-default);
        vertical-align: middle;
      }
    }
  }
`;

const videoCellStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  .video-thumbnail {
    width: 64px;
    height: 36px;
    background: var(--color-neutral-200);
    border-radius: var(--radius-small);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .play-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: var(--radius-full);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      opacity: 0;
      transition: var(--transition-opacity);
    }
    
    &:hover .play-overlay {
      opacity: 1;
    }
  }
  
  .video-info {
    min-width: 0;
    flex: 1;
    
    .video-title {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
      
      /* Limit to 2 lines */
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .video-creator {
      font-size: var(--font-size-body-small);
      color: var(--color-text-secondary);
      margin: 0;
    }
  }
`;

const platformCellStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  .platform-badge {
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

const selectionCellStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

type ViewMode = 'grid' | 'table';

const VideoCell: React.FC<{ video: ContentItem; onPlay?: (video: ContentItem) => void }> = ({ 
  video, 
  onPlay 
}) => (
  <div css={videoCellStyles}>
    <div 
      className="video-thumbnail"
      onClick={(e) => {
        e.stopPropagation();
        onPlay?.(video);
      }}
    >
      {video.thumbnail ? (
        <>
          <img src={video.thumbnail} alt={video.title} />
          <div className="play-overlay">▶</div>
        </>
      ) : (
        <>
          <VideoIcon label="Video thumbnail" />
          <div className="play-overlay">▶</div>
        </>
      )}
    </div>
    <div className="video-info">
      <h3 className="video-title">{video.title}</h3>
      <p className="video-creator">{video.creator || 'Unknown creator'}</p>
    </div>
  </div>
);

const PlatformCell: React.FC<{ video: ContentItem }> = ({ video }) => (
  <div css={platformCellStyles}>
    {video.platform && (
      <div className="platform-badge">
        <span>{getPlatformIconComponent(video.platform)}</span>
        <span>{video.platform}</span>
      </div>
    )}
  </div>
);

const ActionCell: React.FC<{ 
  video: ContentItem;
  onSelect?: (video: ContentItem) => void;
  onPlay?: (video: ContentItem) => void;
}> = ({ video, onSelect, onPlay }) => (
  <div css={actionCellStyles}>
    <Button 
      variant="subtle" 
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onPlay?.(video);
      }}
      iconBefore={<PlayIcon label="" />}
    >
      Play
    </Button>
    <Button 
      variant="subtle" 
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(video);
      }}
      iconBefore={<EyeIcon label="" />}
    >
      View
    </Button>
    <Button variant="subtle" size="small" iconBefore={<MoreIcon label="More options" />} />
  </div>
);

const SelectionCell: React.FC<{ 
  video: ContentItem;
  isSelected: boolean;
  onToggle: (video: ContentItem, checked: boolean) => void;
}> = ({ video, isSelected, onToggle }) => (
  <div css={selectionCellStyles}>
    <input
      type="checkbox"
      checked={isSelected}
      onChange={(e) => {
        e.stopPropagation();
        onToggle(video, e.target.checked);
      }}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export const EnhancedVideoGrid: React.FC<EnhancedVideoGridProps> = ({
  videos,
  onVideoSelect,
  onVideoPlay,
  selectedVideos = [],
  showBulkActions = false,
  fallbackToOriginal = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const sortedVideos = useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortKey) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'platform':
          compareValue = (a.platform || '').localeCompare(b.platform || '');
          break;
        case 'duration':
          compareValue = (a.duration || 0) - (b.duration || 0);
          break;
        case 'created':
          compareValue = a.created.getTime() - b.created.getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'ASC' ? compareValue : -compareValue;
    });

    return sorted;
  }, [videos, sortKey, sortOrder]);

  const handleSort = (data: { key: string; sortOrder: 'ASC' | 'DESC' }, _event?: UIAnalyticsEvent) => {
    setSortKey(data.key);
    setSortOrder(data.sortOrder);
  };

  const handleVideoToggle = (video: ContentItem, checked: boolean) => {
    // This would typically call a parent handler to manage selection
    console.log(`Toggle selection for ${video.title}: ${checked}`);
  };

  // Transform data for table view
  const tableRows = useMemo(() => {
    return sortedVideos.map(video => ({
      key: video.id,
      cells: [
        ...(showBulkActions ? [{
          key: 'selection',
          content: (
            <SelectionCell
              video={video}
              isSelected={selectedVideos.includes(video.id)}
              onToggle={handleVideoToggle}
            />
          )
        }] : []),
        {
          key: 'video',
          content: <VideoCell video={video} onPlay={onVideoPlay} />
        },
        {
          key: 'platform',
          content: <PlatformCell video={video} />
        },
        {
          key: 'duration',
          content: video.duration ? formatDuration(video.duration) : '—'
        },
        {
          key: 'created',
          content: formatRelativeTime(video.created)
        },
        {
          key: 'actions',
          content: <ActionCell video={video} onSelect={onVideoSelect} onPlay={onVideoPlay} />
        }
      ],
      onClick: () => onVideoSelect?.(video),
      isSelected: selectedVideos.includes(video.id)
    }));
  }, [sortedVideos, selectedVideos, showBulkActions, onVideoSelect, onVideoPlay]);

  const tableHead = {
    cells: [
      ...(showBulkActions ? [{
        key: 'selection',
        content: (
          <input
            type="checkbox"
            onChange={(e) => {
              // Handle select all
              console.log('Select all:', e.target.checked);
            }}
          />
        ),
        width: 5,
        isSortable: false
      }] : []),
      {
        key: 'video',
        content: 'Video',
        width: showBulkActions ? 40 : 45,
        isSortable: true
      },
      {
        key: 'platform',
        content: 'Platform',
        width: 15,
        isSortable: true
      },
      {
        key: 'duration',
        content: 'Duration',
        width: 10,
        isSortable: true
      },
      {
        key: 'created',
        content: 'Created',
        width: 15,
        isSortable: true
      },
      {
        key: 'actions',
        content: 'Actions',
        width: 15,
        isSortable: false
      }
    ]
  };

  if (fallbackToOriginal) {
    return (
      <LegacyVideoGrid
        videos={videos}
        onVideoSelect={onVideoSelect}
        onVideoPlay={onVideoPlay}
        selectedVideos={selectedVideos}
        showBulkActions={showBulkActions}
      />
    );
  }

  if (videos.length === 0) {
    return (
      <Card appearance="subtle" spacing="comfortable">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>
            <CameraIcon label="No videos" size="xlarge" />
          </div>
          <h3 style={{ 
            fontSize: 'var(--font-size-h4)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-neutral-700)',
            margin: '0 0 var(--space-2) 0'
          }}>
            No videos found
          </h3>
          <p style={{ 
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-neutral-600)',
            marginBottom: 'var(--space-4)'
          }}>
            Add some videos to this collection to get started
          </p>
          <Button variant="primary">
            Add Videos
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div css={enhancedGridStyles}>
      <div className="view-controls">
        <h2 className="view-title">
          Videos ({videos.length})
        </h2>
        <div className="view-toggle">
          <button
            className={`toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <GridIcon label="" size="small" /> Grid
          </button>
          <button
            className={`toggle-button ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            <TableIcon label="" size="small" /> Table
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-container">
          <Card appearance="elevated" spacing="compact">
            <div className="enhanced-video-table">
              <DynamicTable
                head={tableHead}
                rows={tableRows}
                rowsPerPage={20}
                isLoading={false}
                isFixedSize={false}
                onSort={handleSort}
                sortKey={sortKey}
                sortOrder={sortOrder}
              />
            </div>
          </Card>
        </div>
      ) : (
        <LayoutGrid role="grid" aria-label="Video collection">
          {sortedVideos.map(video => (
            <Card
              key={video.id}
              appearance="raised"
              spacing="compact"
              onClick={() => onVideoSelect?.(video)}
              css={css`
                cursor: pointer;
                transition: var(--transition-card);
                
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: var(--shadow-elevated);
                }
              `}
            >
              <div css={videoCellStyles}>
                <div 
                  className="video-thumbnail"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVideoPlay?.(video);
                  }}
                >
                  {video.thumbnail ? (
                    <>
                      <img src={video.thumbnail} alt={video.title} />
                      <div className="play-overlay">▶</div>
                    </>
                  ) : (
                    <>
                      <VideoIcon label="Video thumbnail" />
                      <div className="play-overlay">▶</div>
                    </>
                  )}
                </div>
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-creator">{video.creator || 'Unknown creator'}</p>
                </div>
              </div>
              
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                  <PlatformCell video={video} />
                  <div style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-tertiary)' }}>
                    {video.duration && formatDuration(video.duration)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </LayoutGrid>
      )}
    </div>
  );
};
