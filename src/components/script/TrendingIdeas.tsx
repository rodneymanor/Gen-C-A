import React from 'react';
import { css } from '@emotion/react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCount } from '../../utils/format';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import StarIcon from '@atlaskit/icon/glyph/star';
import WorldIcon from '@atlaskit/icon/glyph/world';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import LightbulbIcon from '@atlaskit/icon/glyph/lightbulb-filled';
import FrequentIcon from '@atlaskit/icon/glyph/emoji/frequent';

interface TrendingIdea {
  id: string;
  title: string;
  views: number;
  platform: string;
  emoji: string;
}

export interface TrendingIdeasProps {
  ideas?: TrendingIdea[];
  onUseIdea?: (idea: TrendingIdea) => void;
  onExploreMore?: () => void;
}

const trendingStyles = css`
  .trending-header {
    display: flex;
    align-items: center;
    justify-content: between;
    margin-bottom: var(--space-4);
    
    .header-content {
      flex: 1;
      
      h2 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-size-h4);
        font-weight: var(--font-weight-semibold);
        color: var(--color-neutral-800);
        margin: 0;
        
        .trending-icon {
          font-size: 20px;
        }
      }
      
      .trending-subtitle {
        font-size: var(--font-size-body-small);
        color: var(--color-neutral-600);
        margin: var(--space-1) 0 0 0;
      }
    }
  }
  
  .trending-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
`;

const trendingItemStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-medium);
  transition: var(--transition-all);
  cursor: pointer;
  
  &:hover {
    background: var(--color-primary-50);
    border-color: var(--color-primary-300);
    transform: translateY(-1px);
  }
  
  .trending-emoji {
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .trending-content {
    flex: 1;
    min-width: 0;
    
    .trending-title {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
    }
    
    .trending-meta {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      margin: 0;
      
      .views {
        font-weight: var(--font-weight-medium);
        color: var(--color-primary-600);
      }
      
      .platform {
        margin-left: var(--space-2);
        padding: var(--space-1) var(--space-2);
        background: var(--color-neutral-200);
        border-radius: var(--radius-small);
        font-size: var(--font-size-caption);
        font-weight: var(--font-weight-medium);
      }
    }
  }
  
  .trending-action {
    opacity: 0;
    transition: var(--transition-all);
    flex-shrink: 0;
  }
  
  &:hover .trending-action {
    opacity: 1;
  }
`;

const exploreMoreStyles = css`
  text-align: center;
  padding: var(--space-6) var(--space-4);
  background: linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end));
  border-radius: var(--radius-medium);
  color: white;
  
  .explore-icon {
    font-size: 32px;
    margin-bottom: var(--space-3);
    opacity: 0.9;
  }
  
  .explore-title {
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-2) 0;
  }
  
  .explore-description {
    font-size: var(--font-size-body-small);
    opacity: 0.9;
    margin: 0 0 var(--space-4) 0;
    line-height: var(--line-height-relaxed);
  }
`;

// Helper function to map emoji strings to professional icons with theme-aware colors
const getEmojiIcon = (emoji: string) => {
  const iconColor = token('color.icon');
  
  switch (emoji) {
    case '🔥':
      return <FrequentIcon label="Trending" size="medium" primaryColor={iconColor} />;
    case '🌟':
      return <StarFilledIcon label="Featured" size="medium" primaryColor={token('color.icon.warning')} />;
    case '💡':
      return <LightbulbIcon label="Idea" size="medium" primaryColor={token('color.icon.discovery')} />;
    default:
      return <StarIcon label="Trending" size="medium" primaryColor={iconColor} />;
  }
};

const defaultIdeas: TrendingIdea[] = [
  {
    id: '1',
    title: 'Beach day transformation',
    views: 847000,
    platform: 'TikTok',
    emoji: '🔥'
  },
  {
    id: '2',
    title: 'Simple summer makeup look',
    views: 623000,
    platform: 'Instagram',
    emoji: '🌟'
  },
  {
    id: '3',
    title: '5-minute productivity hack',
    views: 1200000,
    platform: 'YouTube',
    emoji: '💡'
  }
];

export const TrendingIdeas: React.FC<TrendingIdeasProps> = ({
  ideas = defaultIdeas,
  onUseIdea,
  onExploreMore
}) => {
  return (
    <Card appearance="subtle" spacing="comfortable" css={trendingStyles}>
      <div className="trending-header">
        <div className="header-content">
          <h2>
            <span className="trending-icon" aria-hidden="true">
              <StarIcon label="" size="medium" primaryColor={token('color.icon')} />
            </span>
            Daily Inspiration
          </h2>
          <p className="trending-subtitle">Trending Today</p>
        </div>
      </div>
      
      <div className="trending-list" role="list">
        {ideas.map(idea => (
          <div
            key={idea.id}
            css={trendingItemStyles}
            onClick={() => onUseIdea?.(idea)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onUseIdea?.(idea);
              }
            }}
            tabIndex={0}
            role="listitem button"
            aria-label={`Use trending idea: ${idea.title}`}
          >
            <span className="trending-emoji" aria-hidden="true">
              {getEmojiIcon(idea.emoji)}
            </span>
            
            <div className="trending-content">
              <p className="trending-title">"{idea.title}"</p>
              <p className="trending-meta">
                <span className="views">{formatCount(idea.views)} views</span>
                <span className="platform">{idea.platform}</span>
              </p>
            </div>
            
            <div className="trending-action">
              <Button variant="subtle" size="small">
                Use Idea
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div css={exploreMoreStyles}>
        <div className="explore-icon" aria-hidden="true">
          <WorldIcon label="" size="large" primaryColor="white" />
        </div>
        <h3 className="explore-title">Explore More Ideas</h3>
        <p className="explore-description">
          Get personalized content suggestions based on your brand
        </p>
        <Button
          variant="secondary"
          onClick={onExploreMore}
          style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'white'
          }}
        >
          Discover Trends
        </Button>
      </div>
    </Card>
  );
};