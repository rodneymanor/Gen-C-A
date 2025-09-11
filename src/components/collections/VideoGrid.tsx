import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatDuration, getPlatformIcon, formatRelativeTime } from '../../utils/format';
import type { ContentItem } from '../../types';

export interface VideoGridProps {
  videos: ContentItem[];
  onVideoSelect?: (video: ContentItem) => void;
  onVideoPlay?: (video: ContentItem) => void;
  selectedVideos?: string[];
  showBulkActions?: boolean;
}

const gridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-3);
  }
`;

const videoCardStyles = (isSelected: boolean) => css`
  position: relative;
  cursor: pointer;
  transition: var(--transition-all);
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-elevated);
  }
  
  ${isSelected && css`
    border-color: var(--color-primary-500);
    box-shadow: var(--shadow-primary);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-primary-100);
      opacity: 0.1;
      z-index: 1;
    }
  `}
`;

const thumbnailContainerStyles = css`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--color-neutral-200);
  border-radius: var(--radius-medium) var(--radius-medium) 0 0;
  overflow: hidden;
  
  .video-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition-transform);
  }
  
  .thumbnail-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: var(--color-neutral-400);
    background: var(--color-neutral-100);
  }
`;

const overlayStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.6) 100%
  );
  opacity: 0;
  transition: var(--transition-all);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .play-button {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border: 2px solid white;
    border-radius: var(--radius-full);
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    transition: var(--transition-all);
    transform: scale(0.8);
    
    &:hover {
      background: var(--color-primary-500);
      color: white;
      transform: scale(0.9);
    }
  }
`;

const durationBadgeStyles = css`
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-small);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
`;

const platformBadgeStyles = css`
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-small);
  padding: var(--space-1) var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  
  .platform-icon {
    font-size: 12px;
  }
`;

const checkboxStyles = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-small);
  cursor: pointer;
  transition: var(--transition-all);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
  }
  
  &.checked {
    background: var(--color-primary-500);
    border-color: var(--color-primary-500);
    color: white;
  }
`;

const videoInfoStyles = css`
  padding: var(--space-4);
  
  .video-title {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-800);
    margin: 0 0 var(--space-2) 0;
    line-height: var(--line-height-normal);
    
    /* Limit to 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .video-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font-size: var(--font-size-body-small);
    color: var(--color-neutral-600);
    
    .creator-info {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      min-width: 0;
      flex: 1;
      
      .creator-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .video-date {
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
  
  .video-tags {
    margin-top: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    
    .tag {
      background: var(--color-neutral-100);
      color: var(--color-neutral-700);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-caption);
      font-weight: var(--font-weight-medium);
    }
  }
`;

const VideoCard: React.FC<{
  video: ContentItem;
  isSelected: boolean;
  onSelect?: (video: ContentItem) => void;
  onPlay?: (video: ContentItem) => void;
  showCheckbox?: boolean;
}> = ({ video, isSelected, onSelect, onPlay, showCheckbox = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      css={videoCardStyles(isSelected)}
      appearance="raised"
      spacing="compact"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(video)}
      role="article"
      tabIndex={0}
      aria-labelledby={`video-title-${video.id}`}
      aria-describedby={`video-meta-${video.id}`}
    >
      <div css={thumbnailContainerStyles}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="thumbnail-placeholder" aria-hidden="true">
            🎥
          </div>
        )}
        
        {/* Hover overlay with play button */}
        <div
          css={overlayStyles}
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <div
            className="play-button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(video);
            }}
            role="button"
            tabIndex={0}
            aria-label={`Play ${video.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPlay?.(video);
              }
            }}
          >
            ▶️
          </div>
        </div>
        
        {/* Platform badge */}
        {video.platform && (
          <div css={platformBadgeStyles}>
            <span className="platform-icon">{getPlatformIcon(video.platform)}</span>
            <span>{video.platform}</span>
          </div>
        )}
        
        {/* Duration badge */}
        {video.duration && (
          <div css={durationBadgeStyles}>
            ▶ {formatDuration(video.duration)}
          </div>
        )}
        
        {/* Selection checkbox */}
        {showCheckbox && (
          <div
            css={checkboxStyles}
            className={isSelected ? 'checked' : ''}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(video);
            }}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Select ${video.title}`}
          >
            {isSelected && '✓'}
          </div>
        )}
      </div>
      
      <CardContent css={videoInfoStyles}>
        <h3 id={`video-title-${video.id}`} className="video-title">
          {video.title}
        </h3>
        
        <div id={`video-meta-${video.id}`} className="video-meta">
          <div className="creator-info">
            <span className="creator-avatar" aria-hidden="true">👤</span>
            <span className="creator-name">
              {video.creator || 'Unknown creator'}
            </span>
          </div>
          <span className="video-date">
            {formatRelativeTime(video.created)}
          </span>
        </div>
        
        {video.tags && video.tags.length > 0 && (
          <div className="video-tags">
            {video.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="tag">
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoSelect,
  onVideoPlay,
  selectedVideos = [],
  showBulkActions = false
}) => {
  if (videos.length === 0) {
    return (
      <Card appearance="subtle" spacing="comfortable">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>
            📹
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
    <div css={gridStyles} role="grid" aria-label="Video collection">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          isSelected={selectedVideos.includes(video.id)}
          onSelect={onVideoSelect}
          onPlay={onVideoPlay}
          showCheckbox={showBulkActions}
        />
      ))}
    </div>
  );
};