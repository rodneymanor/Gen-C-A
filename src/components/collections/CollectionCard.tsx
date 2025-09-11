import React from 'react';
import { css } from '@emotion/react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatDate, getPlatformIcon } from '../../utils/format';
import type { Collection } from '../../types';

export interface CollectionCardProps {
  collection: Collection;
  onView?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  isSelected?: boolean;
}

const collectionCardStyles = css`
  height: 100%;
  cursor: pointer;
  transition: var(--transition-all);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-elevated);
  }
  
  &.selected {
    border-color: var(--color-primary-500);
    box-shadow: var(--shadow-primary);
    background: var(--color-primary-50);
  }
`;

const cardHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  
  .collection-info {
    flex: 1;
    min-width: 0;
    
    .collection-title {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-tight);
    }
    
    .collection-meta {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }
  
  .collection-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-left: var(--space-2);
  }
`;

const platformBadgesStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  
  .platform-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border: 1px solid var(--color-primary-200);
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    
    .platform-icon {
      font-size: 12px;
    }
  }
`;

const descriptionStyles = css`
  font-size: var(--font-size-body-small);
  color: var(--color-neutral-700);
  line-height: var(--line-height-normal);
  margin-bottom: var(--space-4);
  
  /* Limit description to 3 lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const previewThumbnailsStyles = css`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  
  .preview-thumb {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-small);
    object-fit: cover;
    background: var(--color-neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }
  
  .more-videos {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-small);
    background: var(--color-neutral-100);
    border: 2px dashed var(--color-neutral-300);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-600);
  }
`;

const actionsStyles = css`
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
`;

const favoriteButtonStyles = css`
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-full);
  padding: var(--space-2);
  font-size: 16px;
  cursor: pointer;
  transition: var(--transition-all);
  
  &:hover {
    background: var(--color-primary-50);
    border-color: var(--color-primary-300);
  }
  
  &.favorited {
    background: var(--color-warning-100);
    border-color: var(--color-warning-300);
    color: var(--color-warning-600);
  }
`;

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onView,
  onEdit,
  onDelete,
  isSelected = false
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as Element).closest('button')) {
      return;
    }
    onView?.(collection);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView?.(collection);
    }
  };

  return (
    <Card
      appearance={isSelected ? 'selected' : 'raised'}
      spacing="comfortable"
      isHoverable
      isClickable
      css={collectionCardStyles}
      className={isSelected ? 'selected' : ''}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-labelledby={`collection-title-${collection.id}`}
      aria-describedby={`collection-desc-${collection.id}`}
    >
      <div style={{ position: 'relative' }}>
        <button
          css={favoriteButtonStyles}
          className="favorite-button"
          onClick={(e) => {
            e.stopPropagation();
            // Toggle favorite logic would go here
          }}
          aria-label={`Add ${collection.name} to favorites`}
          title="Add to favorites"
        >
          ⭐
        </button>
        
        <CardHeader>
          <div css={cardHeaderStyles}>
            <div className="collection-info">
              <h3 
                id={`collection-title-${collection.id}`} 
                className="collection-title"
              >
                {collection.name}
              </h3>
              <p className="collection-meta">
                {collection.videoCount} videos · Created {formatDate(collection.created)}
              </p>
            </div>
            <div className="collection-icon" aria-hidden="true">
              📁
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {collection.platforms.length > 0 && (
            <div css={platformBadgesStyles}>
              {collection.platforms.map(platform => (
                <span key={platform} className="platform-badge">
                  <span className="platform-icon">{getPlatformIcon(platform)}</span>
                  {platform}
                </span>
              ))}
            </div>
          )}
          
          {collection.description && (
            <p 
              css={descriptionStyles}
              id={`collection-desc-${collection.id}`}
            >
              {collection.description}
            </p>
          )}
          
          <div css={previewThumbnailsStyles}>
            {collection.previewVideos.slice(0, 4).map(video => (
              <div key={video.id} className="preview-thumb">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={`Preview of ${video.title}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  '🎥'
                )}
              </div>
            ))}
            
            {/* Fill empty slots or show "more" indicator */}
            {Array.from({ length: 4 - Math.min(collection.previewVideos.length, 4) }, (_, index) => (
              <div key={`empty-${index}`} className="preview-thumb">
                {collection.videoCount > 4 && index === 3 - Math.min(collection.previewVideos.length, 3) ? (
                  <div className="more-videos">
                    +{collection.videoCount - 3}
                  </div>
                ) : (
                  '📹'
                )}
              </div>
            ))}
          </div>
        </CardContent>
        
        <CardFooter>
          <div css={actionsStyles}>
            <Button
              variant="subtle"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(collection);
              }}
              aria-label={`View ${collection.name} collection`}
            >
              👁️ Preview
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(collection);
              }}
              aria-label={`Edit ${collection.name} collection`}
            >
              ✏️ Edit
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};