import React from 'react';
import { css } from '@emotion/react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, getPlatformIcon } from '../../utils/format';
import type { Collection } from '../../types';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import StarIcon from '@atlaskit/icon/glyph/star';
import EditIcon from '@atlaskit/icon/glyph/edit';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import FolderIcon from '@atlaskit/icon/glyph/folder';

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


const actionsStyles = css`
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
`;

const favoriteButtonStyles = css`
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.9)')};
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
          <StarIcon label="" primaryColor={token('color.icon.warning')} />
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
              <FolderIcon label="Collection" size="medium" primaryColor={token('color.icon')} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {collection.platforms.length > 0 && (
            <div css={platformBadgesStyles}>
              {collection.platforms.map(platform => (
                <Badge
                  key={platform}
                  variant="primary"
                  size="small"
                  icon={getPlatformIcon(platform)}
                >
                  {platform}
                </Badge>
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
              iconBefore={<EyeIcon label="" size="small" primaryColor={token('color.icon')} />}
            >
              Preview
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(collection);
              }}
              aria-label={`Edit ${collection.name} collection`}
              iconBefore={<EditIcon label="" primaryColor={token('color.icon')} />}
            >
              Edit
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};