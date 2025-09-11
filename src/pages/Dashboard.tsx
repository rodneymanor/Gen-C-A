import React from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { DashboardGrid } from '../components/layout/Grid';
import { formatRelativeTime } from '../utils/format';
import type { Activity, User } from '../types';

// Atlassian Design System Icons
import WaveIcon from '@atlaskit/icon/glyph/emoji/frequent';
import ChartIcon from '@atlaskit/icon/glyph/graph-line';
import FolderIcon from '@atlaskit/icon/glyph/folder';
import EditIcon from '@atlaskit/icon/glyph/edit';
import BookIcon from '@atlaskit/icon/glyph/book';
import PersonIcon from '@atlaskit/icon/glyph/person';
import VideoIcon from '@atlaskit/icon/glyph/vid-play';
import DocumentIcon from '@atlaskit/icon/glyph/document';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import AddIcon from '@atlaskit/icon/glyph/add';
import EmptyIcon from '@atlaskit/icon/glyph/editor/remove';

const dashboardStyles = css`
  max-width: 1200px;
  margin: 0 auto;
`;

const welcomeStyles = css`
  margin-bottom: var(--space-8);
`;

const heroStyles = css`
  margin-bottom: var(--space-8);
  
  @media (max-width: 768px) {
    margin-bottom: var(--space-6);
  }
`;

const welcomeSectionStyles = css`
  .welcome-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    
    .welcome-emoji {
      font-size: 24px;
      color: var(--color-neutral-600);
    }
    
    h1 {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
  
  .welcome-message {
    font-size: var(--font-size-body-large);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-4);
  }
  
  .stats-summary {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-4);
    
    @media (max-width: 640px) {
      flex-direction: column;
      gap: var(--space-2);
    }
    
    /* Perplexity Flat Design - Minimal stat items */
    .stat-item {
      background: transparent;  /* Remove background for flat design */
      border: 1px solid var(--color-neutral-200);  /* Simple border only */
      border-radius: var(--radius-medium);
      padding: var(--space-3) var(--space-4);
      
      .stat-icon {
        margin-right: var(--space-2);
        color: var(--color-primary-500);  /* Claude orange for icon accent */
      }
      
      .stat-text {
        font-size: var(--font-size-body-small);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);  /* Standard text, not colored */
      }
    }
  }
`;

const quickActionsStyles = css`
  .actions-header {
    margin-bottom: var(--space-4);
    
    h2 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-700);
      margin: 0;
    }
  }
  
  .actions-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    
    .action-button {
      justify-content: flex-start;
      text-align: left;
      height: auto;
      padding: var(--space-4);
      
      .action-icon {
        font-size: 20px;
        margin-right: var(--space-3);
      }
      
      .action-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-1);
        
        .action-title {
          font-weight: var(--font-weight-semibold);
          color: inherit;
        }
        
        .action-description {
          font-size: var(--font-size-body-small);
          opacity: 0.8;
        }
      }
    }
  }
`;

const activityStyles = css`
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    
    h2 {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
`;

const activityItemStyles = css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  transition: var(--transition-all);
  
  /* Perplexity Flat Design - Minimal hover state */
  &:hover {
    border-left: 3px solid var(--color-primary-500);  /* Claude orange accent */
    padding-left: calc(var(--space-4) - 2px);  /* Adjust padding for border */
  }
  
  .activity-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: var(--space-1);
  }
  
  .activity-content {
    flex: 1;
    min-width: 0;
    
    .activity-description {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
    }
    
    .activity-time {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-500);
      margin: 0;
    }
  }
  
  .activity-action {
    flex-shrink: 0;
  }
`;

const emptyStateStyles = css`
  text-align: center;
  padding: var(--space-8);
  color: var(--color-neutral-600);
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: var(--space-4);
    opacity: 0.5;
  }
  
  .empty-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
  }
  
  .empty-description {
    font-size: var(--font-size-body);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-4);
  }
`;

// Mock data for development
const mockStats = {
  todayVideos: 12,
  todayScripts: 3,
  weekVideos: 47,
  weekScripts: 8
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'created',
    description: 'Added "Summer Vibes Collection"',
    entityType: 'collection',
    entityId: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user: {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'creator',
      plan: 'premium',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, inApp: true, frequency: 'immediate' },
        accessibility: { reducedMotion: false, highContrast: false, fontSize: 'medium', screenReaderOptimized: false }
      }
    }
  },
  {
    id: '2',
    type: 'generated',
    description: 'Generated script for TikTok hook',
    entityType: 'script',
    entityId: '2',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    user: {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'creator',
      plan: 'premium',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, inApp: true, frequency: 'immediate' },
        accessibility: { reducedMotion: false, highContrast: false, fontSize: 'medium', screenReaderOptimized: false }
      }
    }
  },
  {
    id: '3',
    type: 'created',
    description: 'Saved article "Content Trends 2024"',
    entityType: 'note',
    entityId: '3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    user: {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'creator',
      plan: 'premium',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, inApp: true, frequency: 'immediate' },
        accessibility: { reducedMotion: false, highContrast: false, fontSize: 'medium', screenReaderOptimized: false }
      }
    }
  },
  {
    id: '4',
    type: 'created',
    description: 'Created persona "Fitness Influencer"',
    entityType: 'video',
    entityId: '4',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    user: {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'creator',
      plan: 'premium',
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: { email: true, push: true, inApp: true, frequency: 'immediate' },
        accessibility: { reducedMotion: false, highContrast: false, fontSize: 'medium', screenReaderOptimized: false }
      }
    }
  }
];

const getActivityIcon = (type: Activity['type'], entityType: Activity['entityType']): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    created: <VideoIcon label={`Created ${entityType}`} />,
    generated: <AddIcon label={`Generated ${entityType}`} />,
    updated: <DocumentIcon label={`Updated ${entityType}`} />,
    deleted: <TrashIcon label={`Deleted ${entityType}`} />,
    imported: <DownloadIcon label={`Imported ${entityType}`} />
  };
  
  return iconMap[type] || <DocumentIcon label={entityType} />;
};

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => (
  <Card
    appearance="subtle"
    isHoverable
    css={activityItemStyles}
    key={activity.id}
  >
    <div className="activity-icon">
      {getActivityIcon(activity.type, activity.entityType)}
    </div>
    
    <div className="activity-content">
      <p className="activity-description">{activity.description}</p>
      <p className="activity-time">{formatRelativeTime(activity.timestamp)}</p>
    </div>
    
    <div className="activity-action">
      <Button variant="subtle" size="small">
        View
      </Button>
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const user = mockStats; // This would come from context/store in a real app
  
  const handleCreateCollection = () => {
    console.log('Create collection');
  };
  
  const handleGenerateScript = () => {
    console.log('Generate script');
  };
  
  const handleBrowseLibrary = () => {
    console.log('Browse library');
  };
  
  const handleAIAssistant = () => {
    console.log('AI assistant');
  };

  return (
    <div css={dashboardStyles}>
      {/* Welcome Hero Section */}
      <section css={welcomeStyles} aria-labelledby="welcome-heading">
        <div css={heroStyles}>
          <DashboardGrid columns={{ sm: 1, lg: '2fr 1fr' }}>
            <Card appearance="subtle" spacing="comfortable" css={welcomeSectionStyles}>
              <div className="welcome-header">
                <span className="welcome-emoji">
                  <WaveIcon label="Welcome" />
                </span>
                <h1 id="welcome-heading">Welcome back, Sarah!</h1>
              </div>
              
              <p className="welcome-message">
                Today you've saved {user.todayVideos} videos and generated{' '}
                {user.todayScripts} scripts. Ready to create something amazing?
              </p>
              
              <div className="stats-summary">
                <div className="stat-item">
                  <span className="stat-icon">
                    <ChartIcon label="Statistics" />
                  </span>
                  <span className="stat-text">
                    This week: {user.weekVideos} videos, {user.weekScripts} scripts
                  </span>
                </div>
              </div>
            </Card>
            
            <Card appearance="subtle" spacing="comfortable" css={quickActionsStyles}>
              <div className="actions-header">
                <h2>Quick Actions</h2>
              </div>
              
              <div className="actions-grid">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleCreateCollection}
                  className="action-button"
                  iconBefore={<FolderIcon label="" />}
                >
                  <div className="action-content">
                    <div className="action-title">New Collection</div>
                    <div className="action-description">Organize your videos</div>
                  </div>
                </Button>
                
                <Button
                  variant="ai-powered"
                  size="large"
                  onClick={handleGenerateScript}
                  className="action-button"
                  iconBefore={<EditIcon label="" />}
                >
                  <div className="action-content">
                    <div className="action-title">Generate Script</div>
                    <div className="action-description">AI-powered writing</div>
                  </div>
                </Button>
                
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleBrowseLibrary}
                  className="action-button"
                  iconBefore={<BookIcon label="" />}
                >
                  <div className="action-content">
                    <div className="action-title">Browse Library</div>
                    <div className="action-description">View all content</div>
                  </div>
                </Button>
                
                <Button
                  variant="creative"
                  size="large"
                  onClick={handleAIAssistant}
                  className="action-button"
                  iconBefore={<PersonIcon label="" />}
                >
                  <div className="action-content">
                    <div className="action-title">AI Assistant</div>
                    <div className="action-description">Get help and ideas</div>
                  </div>
                </Button>
              </div>
            </Card>
          </DashboardGrid>
        </div>
      </section>
      
      {/* Recent Activity */}
      <section aria-labelledby="activity-heading">
        <div css={activityStyles}>
          <div className="activity-header">
            <h2 id="activity-heading">Recent Activity</h2>
            <Button variant="subtle" size="small">
              View All
            </Button>
          </div>
          
          {mockActivities.length > 0 ? (
            <div className="activity-list" role="list">
              {mockActivities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <Card appearance="subtle" spacing="comfortable">
              <div css={emptyStateStyles}>
                <div className="empty-icon">
                  <EmptyIcon label="Empty inbox" size="xlarge" />
                </div>
                <h3 className="empty-title">No recent activity</h3>
                <p className="empty-description">
                  Start creating content to see your activity here
                </p>
                <Button variant="primary" onClick={handleCreateCollection}>
                  Create Your First Collection
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};