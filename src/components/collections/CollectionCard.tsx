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
import MoreIcon from '@atlaskit/icon/glyph/more';

export interface CollectionCardProps {
  collection: Collection;
  onView?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
  isSelected?: boolean;
}

const collectionCardStyles = css`
  height: 100%;
  cursor: pointer;
  transition: var(--transition-colors);
  
  /* Perplexity Flat Design - Minimal hover effect */
  &:hover {
    border-color: var(--color-primary-500);  /* Bloom Blue accent */
    /* Removed: transform and dramatic shadow for flat design */
  }
  
  &.selected {
    border-color: var(--color-primary-500);
    background: var(--color-primary-50);
    /* Simplified: using subtle background highlight */
  }
`;

const cardHeaderStyles = css`
  margin-bottom: var(--space-2); /* Reduced for Perplexity flat design */
  
  .collection-info {
    .collection-title {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1) 0; /* Perplexity XS spacing */
      line-height: var(--line-height-tight);
    }
    
    .collection-meta {
      font-size: var(--font-size-body-small);
      color: var(--color-text-secondary);
      margin: 0;
    }
  }
`;

const platformBadgesStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2); /* Perplexity SM spacing */
  margin-bottom: var(--space-2); /* Tighter for flat design */
`;

const descriptionStyles = css`
  font-size: var(--font-size-body-small);
  color: var(--color-text-secondary); /* Use semantic token for dark mode */
  line-height: var(--line-height-normal);
  margin-bottom: 0; /* Remove bottom margin for tight spacing */
  
  /* Limit description to 3 lines */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;


const cardFooterStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2); /* Reduced from space-4 for Perplexity flat design */
  padding-top: var(--space-2); /* Add subtle separation */
  border-top: 1px solid var(--color-border-subtle); /* Perplexity-style separator */
  
  .item-count {
    font-size: var(--font-size-body-small);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
  }
  
  .card-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1); /* Tighter gap for flat design */
  }
`;

const actionButtonStyles = css`
  background: transparent;
  border: none;
  padding: var(--space-1); /* Reduced padding for compact flat design */
  border-radius: var(--radius-small); /* Smaller radius for Perplexity style */
  cursor: pointer;
  transition: var(--transition-colors);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px; /* Smaller touch target for desktop-first Perplexity style */
  min-height: 32px;
  
  /* Perplexity flat design - subtle hover */
  &:hover {
    background: var(--color-surface-hover);
  }
  
  &.favorited {
    color: var(--color-primary-500); /* Bloom Blue for favorited */
  }
  
  &:focus-visible {
    outline: var(--focus-ring);
    outline-offset: var(--focus-ring-offset);
  }
`;

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onView,
  onEdit,
  isSelected = false
}) => {
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  
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
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <Card
      appearance={isSelected ? 'selected' : 'subtle'}
      spacing="compact" /* Changed from comfortable to compact for Perplexity flat design */
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
              Created {formatDate(collection.created)}
            </p>
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
      
      <div css={cardFooterStyles}>
        <div className="item-count">
          {collection.videoCount} items
        </div>
        
        <div className="card-actions">
          <button
            css={actionButtonStyles}
            className={isFavorited ? 'favorited' : ''}
            onClick={handleFavoriteToggle}
            aria-label={`${isFavorited ? 'Remove from' : 'Add to'} favorites`}
            title={`${isFavorited ? 'Remove from' : 'Add to'} favorites`}
          >
            <StarIcon label="" size="small" />
          </button>
          
          <button
            css={actionButtonStyles}
            onClick={handleMenuClick}
            aria-label={`Manage ${collection.name} collection`}
            title="Manage collection"
          >
            <MoreIcon label="" size="small" />
          </button>
        </div>
      </div>
    </Card>
  );
};