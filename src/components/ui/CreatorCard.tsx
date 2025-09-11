import React, { useState } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Plus, Check, Heart, Eye } from 'lucide-react';
import { Creator } from '../../types';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { PlatformIcon } from './PlatformIcon';
import { Button } from './Button';

export interface CreatorCardProps {
  creator: Creator;
  isSelected?: boolean;
  isInWatchlist?: boolean;
  onAddToWatchlist?: (creatorId: string) => void;
  onRemoveFromWatchlist?: (creatorId: string) => void;
  onSelect?: (creatorId: string) => void;
  className?: string;
  testId?: string;
}

const cardContentStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 200px;
`;

const headerStyles = css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  position: relative;
`;

const avatarContainerStyles = css`
  position: relative;
  flex-shrink: 0;
`;

const platformBadgeStyles = css`
  position: absolute;
  bottom: -2px;
  right: -2px;
  z-index: 1;
  background: var(--card-bg);
  border-radius: var(--radius-full);
  padding: 2px;
`;

const creatorInfoStyles = css`
  flex: 1;
  min-width: 0; /* Allow text truncation */
`;

const nameStyles = css`
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-1) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
`;

const usernameStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-neutral-600);
  margin: 0;
`;

const metricsStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: auto;
`;

const followerCountStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
`;

const metricsRowStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-caption);
  color: var(--color-neutral-600);
`;

const actionButtonStyles = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  z-index: 2;
`;

const verifiedBadgeStyles = css`
  display: inline-flex;
  align-items: center;
  margin-left: var(--space-1);
  color: var(--color-primary-500);
`;

// Format follower count (e.g., 1500000 -> "1.5M")
const formatFollowerCount = (count: number): string => {
  if (count >= 1000000000) {
    return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

// Format engagement rate as percentage
const formatEngagementRate = (rate?: number): string => {
  if (rate === undefined) return 'N/A';
  return (rate * 100).toFixed(1) + '%';
};

// Format average views
const formatViews = (views?: number): string => {
  if (views === undefined) return 'N/A';
  return formatFollowerCount(views);
};

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  isSelected = false,
  isInWatchlist = false,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onSelect,
  className,
  testId,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWatchlist) {
      onRemoveFromWatchlist?.(creator.id);
    } else {
      onAddToWatchlist?.(creator.id);
    }
  };

  const handleCardClick = () => {
    onSelect?.(creator.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={clsx('creator-card-wrapper', className)}
    >
      <Card
        appearance={isSelected ? 'selected' : 'raised'}
        isHoverable
        isClickable
        onClick={handleCardClick}
        data-testid={testId}
        css={css`
          background: var(--card-bg);
          border: 1px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--card-border)'};
          
          /* Dark theme styles */
          .theme-dark & {
            background: var(--color-neutral-800);
            border-color: ${isSelected ? 'var(--color-primary-400)' : 'var(--color-neutral-700)'};
            
            ${nameStyles} {
              color: var(--color-neutral-100);
            }
            
            ${usernameStyles} {
              color: var(--color-neutral-400);
            }
            
            ${followerCountStyles} {
              color: var(--color-neutral-300);
            }
            
            ${metricsRowStyles} {
              color: var(--color-neutral-400);
            }
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-elevated);
          }
        `}
        {...props}
      >
        <div css={cardContentStyles}>
          <div css={headerStyles}>
            <div css={avatarContainerStyles}>
              <Avatar
                src={creator.avatar}
                name={creator.name}
                alt={creator.name}
                size="large"
              />
              <div css={platformBadgeStyles}>
                <PlatformIcon
                  platform={creator.platform}
                  size="small"
                  variant="badge"
                />
              </div>
            </div>

            <div css={creatorInfoStyles}>
              <h3 css={nameStyles}>
                {creator.name}
                {creator.isVerified && (
                  <span css={verifiedBadgeStyles} aria-label="Verified">
                    <Check size={14} />
                  </span>
                )}
              </h3>
              <p css={usernameStyles}>
                @{creator.username}
              </p>
            </div>

            {/* Watchlist toggle button */}
            <motion.div
              css={actionButtonStyles}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="small"
                variant={isInWatchlist ? 'primary' : 'secondary'}
                iconBefore={isInWatchlist ? <Check size={14} /> : <Plus size={14} />}
                onClick={handleWatchlistToggle}
                aria-label={
                  isInWatchlist 
                    ? `Remove ${creator.name} from watchlist` 
                    : `Add ${creator.name} to watchlist`
                }
                testId={`${testId}-watchlist-toggle`}
              >
                {isInWatchlist ? 'Added' : 'Add'}
              </Button>
            </motion.div>
          </div>

          <div css={metricsStyles}>
            <div css={followerCountStyles}>
              <Eye size={16} aria-hidden="true" />
              <span>
                {formatFollowerCount(creator.followerCount)} 
                {creator.platform === 'youtube' ? ' subscribers' : ' followers'}
              </span>
            </div>

            {(creator.metrics.engagementRate || creator.metrics.averageViews) && (
              <div css={metricsRowStyles}>
                {creator.metrics.engagementRate && (
                  <span>
                    <Heart size={12} aria-hidden="true" />
                    {' '}{formatEngagementRate(creator.metrics.engagementRate)} engagement
                  </span>
                )}
                {creator.metrics.averageViews && (
                  <span>
                    {formatViews(creator.metrics.averageViews)} avg views
                  </span>
                )}
              </div>
            )}

            {creator.tags.length > 0 && (
              <div css={css`display: flex; flex-wrap: wrap; gap: var(--space-1);`}>
                {creator.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="neutral"
                    size="small"
                  >
                    {tag}
                  </Badge>
                ))}
                {creator.tags.length > 2 && (
                  <Badge
                    variant="neutral"
                    size="small"
                  >
                    +{creator.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

CreatorCard.displayName = 'CreatorCard';