import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { VideoGrid as Grid } from '../layout/Grid';
import type { GridProps } from '../layout/Grid';
import { formatDuration, formatRelativeTime, formatViewCount } from '../../utils/format';
import type { ContentItem } from '../../types';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play';
import PersonIcon from '@atlaskit/icon/glyph/person';
import CameraIcon from '@atlaskit/icon/glyph/camera';
import MoreIcon from '@atlaskit/icon/glyph/more';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import { Instagram } from 'lucide-react';

const TikTokGlyph: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M16.5 3h2.25c.08 1.08.57 2.05 1.34 2.79A5.62 5.62 0 0021 7.1v2.63c-1.9-.03-3.69-.65-5.17-1.74v5.7c0 3.14-2.54 5.68-5.68 5.68a5.68 5.68 0 01-5.68-5.68c0-2.58 1.76-4.8 4.12-5.45v2.63a2.06 2.06 0 00-1.05-.28 2.08 2.08 0 00-2.07 2.07 2.08 2.08 0 002.07 2.07c1.15 0 2.08-.93 2.08-2.07V3.6A17.35 17.35 0 0016.5 3z"
      fill="#25F4EE"
      transform="translate(-0.55,0.45)"
    />
    <path
      d="M16.5 3h2.25c.08 1.08.57 2.05 1.34 2.79A5.62 5.62 0 0021 7.1v2.63c-1.9-.03-3.69-.65-5.17-1.74v5.7c0 3.14-2.54 5.68-5.68 5.68a5.68 5.68 0 01-5.68-5.68c0-2.58 1.76-4.8 4.12-5.45v2.63a2.06 2.06 0 00-1.05-.28 2.08 2.08 0 00-2.07 2.07 2.08 2.08 0 002.07 2.07c1.15 0 2.08-.93 2.08-2.07V3.6A17.35 17.35 0 0016.5 3z"
      fill="#FE2C55"
      transform="translate(0.45,-0.45)"
    />
    <path
      d="M16.5 3h2.25c.08 1.08.57 2.05 1.34 2.79A5.62 5.62 0 0021 7.1v2.63c-1.9-.03-3.69-.65-5.17-1.74v5.7c0 3.14-2.54 5.68-5.68 5.68a5.68 5.68 0 01-5.68-5.68c0-2.58 1.76-4.8 4.12-5.45v2.63a2.06 2.06 0 00-1.05-.28 2.08 2.08 0 00-2.07 2.07 2.08 2.08 0 002.07 2.07c1.15 0 2.08-.93 2.08-2.07V3.6A17.35 17.35 0 0016.5 3z"
      fill="white"
    />
  </svg>
);

export interface VideoGridProps {
  videos: ContentItem[];
  onVideoSelect?: (video: ContentItem) => void;
  onVideoPlay?: (video: ContentItem) => void;
  onVideoFavorite?: (video: ContentItem) => void;
  onVideoContextMenu?: (video: ContentItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onVideoDelete?: (video: ContentItem) => void;
  selectedVideos?: string[];
  favoriteVideos?: string[];
  showBulkActions?: boolean;
  deletingVideoId?: string | null;
  columns?: GridProps['columns'];
}


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
  aspect-ratio: 9 / 16;
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

const timeoutOverlayStyles = css`
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.78);
  backdrop-filter: blur(6px);
  color: ${token('color.text.inverse', 'white')};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  padding: var(--space-4);
  z-index: 3;
  pointer-events: none;

  strong {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-semibold);
    display: block;
  }

  p {
    margin: 0;
    font-size: var(--font-size-body-small);
    color: rgba(255, 255, 255, 0.85);
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
    ${token('color.background.neutral.subtle', 'rgba(0, 0, 0, 0.1)')} 0%,
    transparent 30%,
    transparent 70%,
    ${token('color.background.neutral.bold', 'rgba(0, 0, 0, 0.6)')} 100%
  );
  opacity: 0;
  transition: var(--transition-all);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .play-button {
    background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.9)')};
    backdrop-filter: blur(4px);
    border: 2px solid ${token('color.background.neutral', 'white')};
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
      background: ${token('color.background.brand.bold', 'var(--color-primary-500)')};
      color: ${token('color.text.inverse', 'white')};
      transform: scale(0.9);
    }
  }
`;

const viewCountStyles = css`
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
  background: ${token('color.background.neutral.bold', 'rgba(0, 0, 0, 0.8)')};
  color: ${token('color.text.inverse', 'white')};
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-small);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;


const contextMenuStyles = css`
  position: absolute;
  top: var(--space-2);
  background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.9)')};
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-full);
  padding: var(--space-2);
  cursor: pointer;
  transition: var(--transition-all);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  
  &:hover {
    background: var(--color-neutral-50);
    border-color: var(--color-neutral-300);
  }
`;

const durationBadgeStyles = css`
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  background: ${token('color.background.neutral.bold', 'rgba(0, 0, 0, 0.8)')};
  color: ${token('color.text.inverse', 'white')};
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-small);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
`;

const instagramBadgeStyles = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f58529 0%, #dd2a7b 40%, #8134af 70%, #515bd4 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.72);
  color: white;
  z-index: 2;
`;

const tiktokBadgeStyles = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  border: 2px solid rgba(255, 255, 255, 0.72);
  color: white;
  z-index: 2;
`;

const deleteButtonStyles = css`
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.9)')};
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-full);
  color: var(--color-error-600);
  transition: var(--transition-all);
  z-index: 2;

  &:hover {
    background: var(--color-error-50);
    border-color: var(--color-error-200);
    color: var(--color-error-700);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
`;

const VideoCard: React.FC<{
  video: ContentItem;
  isSelected: boolean;
  onSelect?: (video: ContentItem) => void;
  onPlay?: (video: ContentItem) => void;
  onContextMenu?: (video: ContentItem, event: React.MouseEvent | React.KeyboardEvent) => void;
  onDelete?: (video: ContentItem) => void;
  isDeleteBusy?: boolean;
}> = ({ video, isSelected, onSelect, onPlay, onContextMenu, onDelete, isDeleteBusy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const platform = String(video.platform || '').toLowerCase();
  const isInstagram = platform === 'instagram';
  const isTiktok = platform === 'tiktok';
  const hasRightBadge = isInstagram || isTiktok;

  const transcriptionCandidates: Array<unknown> = [
    (video as any).transcriptionStatus,
    video.metadata?.transcriptionStatus,
    (video.metadata as any)?.transcription_status,
    video.metadata?.processing?.transcriptionStatus,
    video.metadata?.contentMetadata?.transcriptionStatus,
  ];

  const transcriptionStatusRaw = transcriptionCandidates.find(
    (value) => typeof value === 'string' && value.length > 0,
  ) as string | undefined;
  const transcriptionStatus = transcriptionStatusRaw?.toLowerCase();
  const isTimeout = transcriptionStatus === 'timeout';
  const rawTimeoutMessage =
    typeof video.metadata?.transcriptionError === 'string' ? video.metadata?.transcriptionError : undefined;
  const timeoutMessage =
    rawTimeoutMessage && rawTimeoutMessage.length < 160 && !rawTimeoutMessage.includes('<')
      ? rawTimeoutMessage
      : 'Provider did not respond. We’ll retry automatically overnight.';

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
            <VidPlayIcon label="Video thumbnail" size="xlarge" primaryColor={token('color.icon.disabled')} />
          </div>
        )}

        {isTimeout && (
          <div css={timeoutOverlayStyles}>
            <WarningIcon label="Provider timeout" size="medium" primaryColor={token('color.text.inverse', 'white')} />
            <strong>Provider not responding</strong>
            <p>{timeoutMessage}</p>
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
            <VidPlayIcon label="" size="medium" primaryColor={token('color.icon.inverse')} />
          </div>
        </div>

        <button
          css={deleteButtonStyles}
          type="button"
          aria-label={`Delete ${video.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(video);
          }}
          disabled={isDeleteBusy}
        >
          <TrashIcon label="" size="small" primaryColor="currentColor" />
        </button>

        {/* View count */}
        {video.metadata?.views && (
          <div css={viewCountStyles}>
            <EyeIcon label="" size="small" primaryColor={token('color.text.inverse')} />
            {formatViewCount(video.metadata.views)}
          </div>
        )}
        
        {/* Duration badge */}
        {video.duration && (
          <div css={durationBadgeStyles}>
            ▶ {formatDuration(video.duration)}
          </div>
        )}

        {isInstagram && (
          <div css={instagramBadgeStyles} aria-label="Instagram video">
            <Instagram size={18} strokeWidth={1.6} color="white" />
          </div>
        )}

        {isTiktok && (
          <div css={tiktokBadgeStyles} aria-label="TikTok video">
            <TikTokGlyph size={18} />
          </div>
        )}

        {/* Context menu */}
        <div
          css={contextMenuStyles}
          style={{
            opacity: isHovered ? 1 : 0,
            right: hasRightBadge ? 'calc(var(--space-2) + 44px)' : 'var(--space-2)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu?.(video, e);
          }}
          role="button"
          tabIndex={0}
          aria-label={`More options for ${video.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onContextMenu?.(video, e);
            }
          }}
        >
          <MoreIcon label="" size="small" primaryColor={token('color.icon')} />
        </div>
        
      </div>
      
      <CardContent css={videoInfoStyles}>
        <h3 id={`video-title-${video.id}`} className="video-title">
          {video.title}
        </h3>
        
        <div id={`video-meta-${video.id}`} className="video-meta">
          <div className="creator-info">
            <span className="creator-avatar" aria-hidden="true">
              <PersonIcon label="" size="small" primaryColor={token('color.icon')} />
            </span>
            <span className="creator-name">
              {video.creator || 'Unknown creator'}
            </span>
          </div>
          <span className="video-date">
            {formatRelativeTime(video.created)}
          </span>
        </div>
        
      </CardContent>
    </Card>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoSelect,
  onVideoPlay,
  onVideoFavorite: _onVideoFavorite,
  onVideoContextMenu,
  onVideoDelete,
  selectedVideos = [],
  favoriteVideos: _favoriteVideos = [],
  showBulkActions: _showBulkActions = false,
  deletingVideoId,
  columns
}) => {
  if (videos.length === 0) {
    return (
      <Card appearance="subtle" spacing="comfortable">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>
            <CameraIcon label="No videos" size="xlarge" primaryColor={token('color.icon.disabled')} />
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
    <Grid role="grid" aria-label="Video collection" columns={columns}>
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          isSelected={selectedVideos.includes(video.id)}
          onSelect={onVideoSelect}
          onPlay={onVideoPlay}
          onContextMenu={onVideoContextMenu}
          onDelete={onVideoDelete}
          isDeleteBusy={deletingVideoId === video.id}
        />
      ))}
    </Grid>
  );
};
