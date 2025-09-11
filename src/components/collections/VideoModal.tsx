import React, { useState, useEffect } from 'react';
import { css } from '@emotion/react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDuration, formatViewCount, formatRelativeTime, getPlatformIcon } from '../../utils/format';
import type { ContentItem } from '../../types';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import CrossIcon from '@atlaskit/icon/glyph/cross';
import ChevronUpIcon from '@atlaskit/icon/glyph/chevron-up';
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play';
import PersonIcon from '@atlaskit/icon/glyph/person';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import CopyIcon from '@atlaskit/icon/glyph/copy';
import DownloadIcon from '@atlaskit/icon/glyph/download';

export interface VideoModalProps {
  isOpen: boolean;
  video: ContentItem | null;
  videos: ContentItem[];
  onClose: () => void;
  onNavigateVideo: (direction: 'prev' | 'next') => void;
}

interface ScriptComponent {
  id: string;
  type: 'hook' | 'bridge' | 'golden_nugget' | 'call_to_action';
  label: string;
  content: string;
}

interface VideoInsights {
  transcript: string;
  scriptComponents: ScriptComponent[];
  performanceMetrics: {
    readability: number;
    engagement: number;
    hookStrength: number;
  };
}

const modalOverlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${token('color.blanket', 'rgba(0, 0, 0, 0.8)')};
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  
  /* Prevent body scroll when modal is open */
  overflow: hidden;
`;

const modalContentStyles = css`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 900px;
  background: ${token('color.background.default', 'white')};
  border-radius: var(--radius-large);
  overflow: hidden;
  display: flex;
  box-shadow: var(--shadow-overlay);
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    flex-direction: column;
    max-height: 100vh;
    border-radius: 0;
  }
`;

const closeButtonStyles = css`
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 10;
  background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.9)')};
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-full);
  padding: var(--space-2);
  cursor: pointer;
  transition: var(--transition-all);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--color-neutral-50);
    transform: scale(1.05);
  }
`;

const videoPlayerSectionStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${token('color.background.neutral.bold', 'black')};
  position: relative;
  min-height: 400px;
  
  @media (max-width: 768px) {
    flex: none;
    height: 50vh;
    min-height: 300px;
  }
`;

const videoPlayerStyles = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  .video-embed {
    width: 100%;
    height: 100%;
    border: none;
    background: ${token('color.background.neutral.bold', 'black')};
  }
  
  .video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${token('color.text.inverse', 'white')};
    text-align: center;
    padding: var(--space-6);
    
    .placeholder-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
      opacity: 0.7;
    }
    
    .placeholder-text {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-2);
    }
    
    .placeholder-subtitle {
      font-size: var(--font-size-body);
      opacity: 0.8;
    }
  }
`;

const navigationStripStyles = css`
  width: 64px;
  background: linear-gradient(
    to bottom,
    ${token('color.background.neutral.bold', 'rgba(0, 0, 0, 0.8)')} 0%,
    ${token('color.background.neutral.bold', 'rgba(0, 0, 0, 0.6)')} 100%
  );
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  border-left: 1px solid var(--color-neutral-700);
  border-right: 1px solid var(--color-neutral-700);
  
  @media (max-width: 768px) {
    display: none;
  }
  
  .nav-button {
    background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.1)')};
    border: 1px solid ${token('color.border.inverse', 'rgba(255, 255, 255, 0.2)')};
    border-radius: var(--radius-full);
    padding: var(--space-3);
    cursor: pointer;
    transition: var(--transition-all);
    color: ${token('color.text.inverse', 'white')};
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: ${token('color.background.neutral', 'rgba(255, 255, 255, 0.2)')};
      transform: translateY(-2px);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      
      &:hover {
        transform: none;
      }
    }
  }
`;

const insightsPanelStyles = css`
  width: 600px;
  display: flex;
  flex-direction: column;
  background: ${token('color.background.default', 'white')};
  border-left: 1px solid var(--color-neutral-200);
  
  @media (max-width: 768px) {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--color-neutral-200);
    flex: 1;
  }
`;

const tabsStyles = css`
  display: flex;
  border-bottom: 1px solid var(--color-neutral-200);
  padding: 0 var(--space-4);
  background: ${token('color.background.subtle', 'var(--color-neutral-50)')};
  
  .tab {
    padding: var(--space-3) var(--space-4);
    border: none;
    background: none;
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-600);
    cursor: pointer;
    transition: var(--transition-all);
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    
    &:hover {
      color: var(--color-neutral-800);
      background: var(--color-neutral-100);
    }
    
    &.active {
      color: var(--color-primary-600);
      border-bottom-color: var(--color-primary-500);
      background: ${token('color.background.default', 'white')};
    }
  }
`;

const panelContentStyles = css`
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
  
  .video-meta {
    margin-bottom: var(--space-4);
    
    .video-title {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
      line-height: var(--line-height-tight);
    }
    
    .creator-info {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
    }
    
    .video-stats {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
    }
  }
  
  .section {
    margin-bottom: var(--space-6);
    
    .section-title {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-3) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
  }
  
  .transcript-content {
    background: var(--color-neutral-50);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    padding: var(--space-4);
    font-size: var(--font-size-body);
    line-height: var(--line-height-relaxed);
    color: var(--color-neutral-700);
    max-height: 200px;
    overflow-y: auto;
  }
  
  .script-component {
    background: var(--color-neutral-50);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    margin-bottom: var(--space-3);
    overflow: hidden;
    
    .component-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      background: var(--color-neutral-100);
      border-bottom: 1px solid var(--color-neutral-200);
      
      .component-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: var(--font-weight-medium);
        color: var(--color-neutral-800);
        
        .component-type {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: var(--radius-small);
          background: var(--color-primary-100);
          color: var(--color-primary-600);
          font-size: var(--font-size-caption);
          font-weight: var(--font-weight-bold);
        }
      }
      
      .copy-button {
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-caption);
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }
    }
    
    .component-content {
      padding: var(--space-4);
      font-size: var(--font-size-body);
      line-height: var(--line-height-normal);
      color: var(--color-neutral-700);
    }
  }
  
  .performance-metrics {
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      
      .metric-label {
        font-size: var(--font-size-body);
        color: var(--color-neutral-700);
      }
      
      .metric-value {
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-semibold);
        color: var(--color-neutral-800);
      }
    }
  }
  
  .actions {
    margin-top: var(--space-6);
    display: flex;
    gap: var(--space-3);
    
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
`;

const mobileNavigationStyles = css`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    padding: var(--space-4);
    background: var(--color-neutral-50);
    border-top: 1px solid var(--color-neutral-200);
    
    .mobile-nav-button {
      flex: 1;
      margin: 0 var(--space-2);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      
      &:first-of-type {
        margin-left: 0;
      }
      
      &:last-of-type {
        margin-right: 0;
      }
    }
  }
`;

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  video,
  videos,
  onClose,
  onNavigateVideo
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'script' | 'hooks' | 'analytics' | 'more'>('video');
  
  // Mock video insights data - in real app this would come from props or API
  const videoInsights: VideoInsights = {
    transcript: video ? `"Hey everyone! Today I'm going to show you the most incredible hack that will change your life forever. You won't believe how simple this is..."

[Continue transcript with full video content...]

This technique has helped thousands of people achieve amazing results, and now I'm sharing it with you for free. Don't forget to like and follow for more content like this!` : '',
    scriptComponents: [
      {
        id: '1',
        type: 'hook',
        label: 'Hook',
        content: "Hey everyone! Today I'm going to show you the most incredible hack..."
      },
      {
        id: '2',
        type: 'bridge',
        label: 'Bridge',
        content: "going to show you the most incredible technique that will..."
      },
      {
        id: '3',
        type: 'golden_nugget',
        label: 'Golden Nugget',
        content: "incredible hack that will change your life forever..."
      },
      {
        id: '4',
        type: 'call_to_action',
        label: 'Call to Action',
        content: "You won't believe how simple this is, so make sure to follow for more..."
      }
    ],
    performanceMetrics: {
      readability: 8.2,
      engagement: 7.8,
      hookStrength: 9.1
    }
  };

  const currentVideoIndex = videos.findIndex(v => v.id === video?.id);
  const canNavigatePrev = currentVideoIndex > 0;
  const canNavigateNext = currentVideoIndex < videos.length - 1;

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // In a real app, you'd show a toast notification here
      console.log('Copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyAll = async () => {
    const allComponents = videoInsights.scriptComponents
      .map(comp => `${comp.label}: ${comp.content}`)
      .join('\n\n');
    await handleCopyToClipboard(allComponents);
  };

  const getComponentTypeIcon = (type: string) => {
    const iconMap = {
      hook: 'H',
      bridge: 'B',
      golden_nugget: 'G',
      call_to_action: 'C'
    };
    return iconMap[type as keyof typeof iconMap] || 'C';
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleKeyNavigation = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canNavigatePrev) {
        onNavigateVideo('prev');
      } else if (e.key === 'ArrowRight' && canNavigateNext) {
        onNavigateVideo('next');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyNavigation);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyNavigation);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onNavigateVideo, canNavigatePrev, canNavigateNext]);

  if (!isOpen || !video) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return (
          <>
            <div className="video-meta">
              <h1 className="video-title">{video.title}</h1>
              <div className="creator-info">
                <PersonIcon label="" size="small" primaryColor={token('color.icon')} />
                <span>@{video.creator || 'unknown'}</span>
                <Badge variant="neutral" size="small" icon={getPlatformIcon(video.platform || 'other')}>
                  {video.platform}
                </Badge>
              </div>
              <div className="video-stats">
                <span>
                  <EyeIcon label="" size="small" primaryColor={token('color.icon')} />
                  {video.metadata?.views ? formatViewCount(video.metadata.views) : 'Unknown'} views
                </span>
                <span>⏱️ {video.duration ? formatDuration(video.duration) : 'Unknown'} duration</span>
                <span>{formatRelativeTime(video.created)}</span>
              </div>
            </div>

            <div className="section">
              <h2 className="section-title">
                📝 Full Transcript
              </h2>
              <div className="transcript-content">
                {videoInsights.transcript}
              </div>
            </div>
          </>
        );

      case 'script':
        return (
          <div className="section">
            <h2 className="section-title">
              📋 Script Components
            </h2>
            {videoInsights.scriptComponents.map((component) => (
              <div key={component.id} className="script-component">
                <div className="component-header">
                  <div className="component-label">
                    <span className="component-type">
                      {getComponentTypeIcon(component.type)}
                    </span>
                    {component.label}
                  </div>
                  <Button
                    variant="subtle"
                    size="small"
                    className="copy-button"
                    onClick={() => handleCopyToClipboard(component.content)}
                  >
                    <CopyIcon label="" size="small" primaryColor={token('color.icon')} />
                    Copy
                  </Button>
                </div>
                <div className="component-content">
                  {component.content}
                </div>
              </div>
            ))}
          </div>
        );

      case 'analytics':
        return (
          <div className="section">
            <h2 className="section-title">
              📊 Performance Metrics
            </h2>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">Readability Score</span>
                <span className="metric-value">{videoInsights.performanceMetrics.readability}/10</span>
              </div>
              <div className="metric">
                <span className="metric-label">Engagement Score</span>
                <span className="metric-value">{videoInsights.performanceMetrics.engagement}/10</span>
              </div>
              <div className="metric">
                <span className="metric-label">Hook Strength</span>
                <span className="metric-value">{videoInsights.performanceMetrics.hookStrength}/10</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="section">
            <h2 className="section-title">Coming Soon</h2>
            <p>More features and insights will be available here.</p>
          </div>
        );
    }
  };

  return (
    <div css={modalOverlayStyles} onClick={onClose}>
      <div css={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <button css={closeButtonStyles} onClick={onClose} aria-label="Close modal">
          <CrossIcon label="" size="medium" primaryColor={token('color.icon')} />
        </button>

        {/* Video Player Section */}
        <div css={videoPlayerSectionStyles}>
          <div css={videoPlayerStyles}>
            {video.url ? (
              <iframe
                className="video-embed"
                src={video.url}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="video-placeholder">
                <div className="placeholder-icon">
                  <VidPlayIcon label="" size="xlarge" primaryColor={token('color.icon.inverse')} />
                </div>
                <div className="placeholder-text">Video Preview</div>
                <div className="placeholder-subtitle">
                  Original video content would be embedded here
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Strip */}
        <div css={navigationStripStyles}>
          <button
            className="nav-button"
            onClick={() => onNavigateVideo('prev')}
            disabled={!canNavigatePrev}
            aria-label="Previous video"
          >
            <ChevronUpIcon label="" size="medium" primaryColor="currentColor" />
          </button>
          <button
            className="nav-button"
            onClick={() => onNavigateVideo('next')}
            disabled={!canNavigateNext}
            aria-label="Next video"
          >
            <ChevronDownIcon label="" size="medium" primaryColor="currentColor" />
          </button>
        </div>

        {/* Insights Panel */}
        <div css={insightsPanelStyles}>
          <div css={tabsStyles}>
            {[
              { id: 'video', label: 'Video' },
              { id: 'script', label: 'Script' },
              { id: 'hooks', label: 'Hooks' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'more', label: 'More' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div css={panelContentStyles}>
            {renderTabContent()}

            {activeTab === 'script' && (
              <div className="actions">
                <Button variant="primary" onClick={handleCopyAll}>
                  <CopyIcon label="" size="small" primaryColor={token('color.icon.inverse')} />
                  Copy All
                </Button>
                <Button variant="secondary">
                  <DownloadIcon label="" size="small" primaryColor={token('color.icon')} />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div css={mobileNavigationStyles}>
          <Button
            variant="secondary"
            className="mobile-nav-button"
            onClick={() => onNavigateVideo('prev')}
            disabled={!canNavigatePrev}
          >
            ← Previous
          </Button>
          <Button
            variant="secondary"
            className="mobile-nav-button"
            onClick={() => onNavigateVideo('next')}
            disabled={!canNavigateNext}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
};