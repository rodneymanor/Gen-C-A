import React, { useState } from 'react';
import { css } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Edit3, 
  Trash2, 
  Star,
  Eye,
  Filter
} from 'lucide-react';
import { Watchlist, Creator } from '../../types';
import { Button } from './Button';
import { Card, CardHeader, CardContent } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { PlatformIcon } from './PlatformIcon';

export interface WatchlistSidebarProps {
  watchlists: Watchlist[];
  creators: Creator[];
  onCreateWatchlist?: () => void;
  onEditWatchlist?: (watchlistId: string) => void;
  onDeleteWatchlist?: (watchlistId: string) => void;
  onSelectWatchlist?: (watchlistId: string | null) => void;
  selectedWatchlistId?: string | null;
  className?: string;
  testId?: string;
}

const sidebarStyles = css`
  width: 300px;
  height: 100%;
  background: var(--card-bg);
  border-left: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  
  /* Dark theme styles */
  .theme-dark & {
    background: var(--color-neutral-800);
    border-color: var(--color-neutral-700);
  }
`;

const headerStyles = css`
  padding: var(--space-4);
  border-bottom: 1px solid var(--card-border);
  
  .theme-dark & {
    border-color: var(--color-neutral-700);
  }
`;

const titleStyles = css`
  font-size: var(--font-size-h5);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-1) 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  .theme-dark & {
    color: var(--color-neutral-100);
  }
`;

const descriptionStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-neutral-600);
  line-height: 1.4;
  margin-bottom: var(--space-3);
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
`;

const contentStyles = css`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
`;

const emptyStateStyles = css`
  text-align: center;
  padding: var(--space-6) var(--space-4);
  
  .empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--space-3) auto;
    color: var(--color-neutral-400);
  }
  
  .empty-title {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
    
    .theme-dark & {
      color: var(--color-neutral-300);
    }
  }
  
  .empty-description {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-600);
    line-height: 1.4;
    margin-bottom: var(--space-4);
    
    .theme-dark & {
      color: var(--color-neutral-400);
    }
  }
`;

const watchlistItemStyles = css`
  margin-bottom: var(--space-3);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const watchlistHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  cursor: pointer;
  border-radius: var(--radius-medium);
  transition: var(--transition-all);
  
  &:hover {
    background: var(--color-neutral-50);
    
    .theme-dark & {
      background: var(--color-neutral-700);
    }
  }
  
  &[data-selected="true"] {
    background: var(--color-primary-50);
    border: 1px solid var(--color-primary-200);
    
    .theme-dark & {
      background: var(--color-primary-900);
      border-color: var(--color-primary-600);
    }
  }
`;

const watchlistInfoStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
`;

const watchlistTitleStyles = css`
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-800);
  margin: 0;
  
  .theme-dark & {
    color: var(--color-neutral-200);
  }
`;

const creatorPreviewStyles = css`
  padding: 0 var(--space-3) var(--space-3) var(--space-3);
  
  .creator-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .creator-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-small);
    background: var(--color-neutral-50);
    
    .theme-dark & {
      background: var(--color-neutral-700);
    }
  }
  
  .creator-info {
    flex: 1;
    min-width: 0;
  }
  
  .creator-name {
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-800);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    .theme-dark & {
      color: var(--color-neutral-200);
    }
  }
  
  .creator-platform {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-600);
    
    .theme-dark & {
      color: var(--color-neutral-400);
    }
  }
`;

const actionButtonsStyles = css`
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .watchlist-item:hover & {
    opacity: 1;
  }
`;

interface WatchlistItemProps {
  watchlist: Watchlist;
  creators: Creator[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WatchlistItem: React.FC<WatchlistItemProps> = ({
  watchlist,
  creators,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onEdit,
  onDelete
}) => {
  const watchlistCreators = creators.filter(c => 
    watchlist.creatorIds.includes(c.id)
  ).slice(0, 3); // Show only first 3 creators

  return (
    <div css={watchlistItemStyles} className="watchlist-item">
      <div
        css={watchlistHeaderStyles}
        data-selected={isSelected}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-label={`Select ${watchlist.name} watchlist`}
      >
        <div css={watchlistInfoStyles}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isExpanded ? 'Collapse watchlist' : 'Expand watchlist'}
            css={css`
              background: none;
              border: none;
              padding: 0;
              cursor: pointer;
              display: flex;
              align-items: center;
              color: var(--color-neutral-600);
              
              .theme-dark & {
                color: var(--color-neutral-400);
              }
            `}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div>
            <h3 css={watchlistTitleStyles}>{watchlist.name}</h3>
          </div>
        </div>
        
        <div css={css`display: flex; align-items: center; gap: var(--space-2);`}>
          <Badge variant="neutral" size="small">
            {watchlist.creatorIds.length}
          </Badge>
          
          <div css={actionButtonsStyles}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Edit ${watchlist.name}`}
              css={css`
                background: none;
                border: none;
                padding: var(--space-1);
                cursor: pointer;
                color: var(--color-neutral-500);
                border-radius: var(--radius-small);
                
                &:hover {
                  background: var(--color-neutral-100);
                  color: var(--color-neutral-700);
                  
                  .theme-dark & {
                    background: var(--color-neutral-600);
                    color: var(--color-neutral-300);
                  }
                }
              `}
            >
              <Edit3 size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Delete ${watchlist.name}`}
              css={css`
                background: none;
                border: none;
                padding: var(--space-1);
                cursor: pointer;
                color: var(--color-neutral-500);
                border-radius: var(--radius-small);
                
                &:hover {
                  background: var(--color-error-100);
                  color: var(--color-error-600);
                  
                  .theme-dark & {
                    background: var(--color-error-900);
                    color: var(--color-error-400);
                  }
                }
              `}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            css={creatorPreviewStyles}
          >
            <div className="creator-list">
              {watchlistCreators.map((creator) => (
                <div key={creator.id} className="creator-item">
                  <Avatar
                    src={creator.avatar}
                    name={creator.name}
                    size="small"
                  />
                  <div className="creator-info">
                    <p className="creator-name">{creator.name}</p>
                  </div>
                  <PlatformIcon
                    platform={creator.platform}
                    size="small"
                    variant="colored"
                  />
                </div>
              ))}
              
              {watchlist.creatorIds.length > 3 && (
                <div className="creator-item" css={css`opacity: 0.7;`}>
                  <div css={css`
                    width: 24px;
                    height: 24px;
                    border-radius: var(--radius-full);
                    background: var(--color-neutral-200);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--font-size-caption);
                    
                    .theme-dark & {
                      background: var(--color-neutral-600);
                    }
                  `}>
                    +{watchlist.creatorIds.length - 3}
                  </div>
                  <div className="creator-info">
                    <p className="creator-name">
                      {watchlist.creatorIds.length - 3} more creators...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  watchlists,
  creators,
  onCreateWatchlist,
  onEditWatchlist,
  onDeleteWatchlist,
  onSelectWatchlist,
  selectedWatchlistId,
  className,
  testId,
  ...props
}) => {
  const [expandedWatchlists, setExpandedWatchlists] = useState<Set<string>>(new Set());

  const toggleExpanded = (watchlistId: string) => {
    setExpandedWatchlists(prev => {
      const next = new Set(prev);
      if (next.has(watchlistId)) {
        next.delete(watchlistId);
      } else {
        next.add(watchlistId);
      }
      return next;
    });
  };

  return (
    <div
      css={sidebarStyles}
      className={clsx('watchlist-sidebar', className)}
      data-testid={testId}
      {...props}
    >
      <div css={headerStyles}>
        <h2 css={titleStyles}>
          <Star size={20} />
          Your Watchlists
        </h2>
        <p css={descriptionStyles}>
          Organize the channels you care about by creating watchlists. 
          Then filter your search using your watchlists.
        </p>
        <Button
          variant="primary"
          size="small"
          iconBefore={<Plus size={16} />}
          onClick={onCreateWatchlist}
          fullWidth
          testId={`${testId}-create-button`}
        >
          Create Watchlist
        </Button>
      </div>
      
      <div css={contentStyles}>
        {watchlists.length === 0 ? (
          <div css={emptyStateStyles}>
            <Users className="empty-icon" />
            <h3 className="empty-title">No watchlists yet</h3>
            <p className="empty-description">
              Create your first watchlist to start organizing your favorite creators!
            </p>
            <Button
              variant="primary"
              size="medium"
              iconBefore={<Plus size={16} />}
              onClick={onCreateWatchlist}
              testId={`${testId}-empty-create-button`}
            >
              Get started
            </Button>
          </div>
        ) : (
          <>
            {/* All Creators filter option */}
            <div css={watchlistItemStyles}>
              <div
                css={[
                  watchlistHeaderStyles,
                  css`border: 1px solid var(--card-border);`
                ]}
                data-selected={selectedWatchlistId === null}
                onClick={() => onSelectWatchlist?.(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectWatchlist?.(null);
                  }
                }}
                aria-label="Show all creators"
              >
                <div css={watchlistInfoStyles}>
                  <Filter size={16} />
                  <div>
                    <h3 css={watchlistTitleStyles}>All Creators</h3>
                  </div>
                </div>
                <Badge variant="neutral" size="small">
                  {creators.length}
                </Badge>
              </div>
            </div>
            
            {watchlists.map((watchlist) => (
              <WatchlistItem
                key={watchlist.id}
                watchlist={watchlist}
                creators={creators}
                isSelected={selectedWatchlistId === watchlist.id}
                isExpanded={expandedWatchlists.has(watchlist.id)}
                onToggle={() => toggleExpanded(watchlist.id)}
                onSelect={() => onSelectWatchlist?.(watchlist.id)}
                onEdit={() => onEditWatchlist?.(watchlist.id)}
                onDelete={() => onDeleteWatchlist?.(watchlist.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

WatchlistSidebar.displayName = 'WatchlistSidebar';