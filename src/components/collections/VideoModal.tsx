import React, { useState, useEffect, useMemo } from 'react';
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
    readability: number | null;
    engagement: number | null;
    hookStrength: number | null;
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

  const collectCandidateObjects = (item: ContentItem | null) => {
    if (!item) return [] as Record<string, any>[];
    const metadata = item.metadata ?? {};
    const rawSource = metadata.rawSource ?? {};
    const roots = [
      metadata,
      metadata.contentMetadata,
      metadata.analysis,
      metadata.metrics,
      metadata.statistics,
      metadata.insights,
      rawSource,
      rawSource.metadata,
      rawSource.contentMetadata,
      rawSource.analysis,
      rawSource.metrics,
      rawSource.statistics,
    ];
    return roots.filter((root): root is Record<string, any> => !!root && typeof root === 'object');
  };

  const extractTranscript = (item: ContentItem | null) => {
    const roots = collectCandidateObjects(item);
    const flattenTranscriptValue = (value: any): string | null => {
      if (!value) return null;
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (Array.isArray(value)) {
        const joined = value
          .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (entry && typeof entry === 'object') return entry.text ?? entry.content ?? entry.caption ?? '';
            return '';
          })
          .filter(Boolean)
          .join('\n');
        return joined.trim() ? joined.trim() : null;
      }
      if (typeof value === 'object') {
        const text = value.text ?? value.content ?? value.fullText ?? value.transcript ?? value.raw;
        if (typeof text === 'string' && text.trim()) return text.trim();
        const segments = value.segments ?? value.sentences ?? value.lines;
        if (Array.isArray(segments)) return flattenTranscriptValue(segments);
      }
      return null;
    };

    const quickCandidates = [
      item?.metadata?.transcript,
      item?.metadata?.transcriptText,
      item?.metadata?.transcriptSegments,
      item?.metadata?.transcription,
      item?.metadata?.transcription?.text,
      item?.metadata?.transcription?.segments,
      item?.metadata?.caption,
      item?.metadata?.captions,
      item?.metadata?.rawSource?.transcript,
      item?.metadata?.rawSource?.transcriptSegments,
      item?.metadata?.rawSource?.transcription,
      item?.metadata?.rawSource?.transcription?.segments,
    ];

    for (const candidate of quickCandidates) {
      const flattened = flattenTranscriptValue(candidate);
      if (flattened) return flattened;
    }

    const visited = new Set<any>();
    const stack = roots.flatMap((root) => Object.entries(root).map(([key, value]) => ({ key, value })));
    while (stack.length > 0) {
      const { key, value } = stack.pop()!;
      if (value && typeof value === 'object') {
        if (visited.has(value)) continue;
        visited.add(value);
      }

      if (typeof key === 'string' && /transcript|caption|transcription/i.test(key)) {
        const flattened = flattenTranscriptValue(value);
        if (flattened) return flattened;
      }

      if (Array.isArray(value)) {
        const flattened = flattenTranscriptValue(value);
        if (flattened) return flattened;
        value.forEach((entry, index) => {
          if (entry && typeof entry === 'object') {
            stack.push({ key: `${key}[${index}]`, value: entry });
          }
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => {
          stack.push({ key: childKey, value: childValue });
        });
      } else {
        const flattened = flattenTranscriptValue(value);
        if (flattened) return flattened;
      }
    }

    return '';
  };

  const extractScriptComponents = (item: ContentItem | null): ScriptComponent[] => {
    if (!item) return [];
    const roots = collectCandidateObjects(item);

    const normalizeType = (value: string): ScriptComponent['type'] => {
      const normalized = value.toLowerCase();
      if (normalized === 'wta') return 'call_to_action';
      if (normalized.includes('call_to_action') || normalized === 'cta') return 'call_to_action';
      if (normalized.includes('golden') || normalized.includes('nugget')) return 'golden_nugget';
      if (normalized.includes('bridge')) return 'bridge';
      return 'hook';
    };

    const quickCandidates = [
      item.metadata?.scriptComponents,
      item.metadata?.components,
      item.metadata?.script?.components,
      item.metadata?.analysis?.components,
      item.metadata?.contentMetadata?.scriptComponents,
      item.metadata?.rawSource?.scriptComponents,
      item.metadata?.rawSource?.components,
    ];

    const results: ScriptComponent[] = [];
    const visited = new Set<any>();
    const stack = roots.flatMap((root) => Object.entries(root).map(([key, value]) => ({ key, value })));

    quickCandidates.forEach((candidate) => {
      if (!candidate) return;
      if (Array.isArray(candidate)) {
        candidate.forEach((entry: any, index: number) => {
          if (!entry) return;
          const content = typeof entry === 'string' ? entry : entry.content ?? entry.text ?? '';
          if (!content) return;
          const type = normalizeType(entry.type ?? 'hook');
          const label = entry.label ?? entry.title ?? `Component ${index + 1}`;
          results.push({ id: entry.id ?? `component-${index}`, type, label, content: String(content) });
        });
      } else if (candidate && typeof candidate === 'object') {
        Object.entries(candidate).forEach(([childKey, childValue], index) => {
          const content = typeof childValue === 'string' ? childValue : childValue?.content ?? childValue?.text ?? '';
          if (!content) return;
          results.push({
            id: `${childKey}-${index}`,
            type: normalizeType(childKey),
            label: childKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            content: String(content),
          });
        });
      }
    });

    while (stack.length > 0) {
      const { key, value } = stack.pop()!;
      if (value && typeof value === 'object') {
        if (visited.has(value)) continue;
        visited.add(value);
      }

      if (typeof key === 'string' && /component|script|hook|cta|bridge|nugget/i.test(key)) {
        if (Array.isArray(value)) {
          value.forEach((entry, index) => {
            if (!entry) return;
            const content = typeof entry === 'string' ? entry : entry.content ?? entry.text ?? '';
            if (!content) return;
            const type = normalizeType(entry.type ?? key);
            const label = entry.label ?? entry.title ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            results.push({ id: entry.id ?? `${key}-${index}`, type, label, content: String(content) });
          });
        } else if (value && typeof value === 'object') {
          const content = value.content ?? value.text ?? value.script ?? '';
          if (content) {
            results.push({
              id: value.id ?? key,
              type: normalizeType(value.type ?? key),
              label: value.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              content: String(content),
            });
          } else {
            Object.entries(value).forEach(([childKey, childValue]) => {
              const text = typeof childValue === 'string' ? childValue : childValue?.content ?? childValue?.text ?? '';
              if (!text) return;
              results.push({
                id: `${key}-${childKey}`,
                type: normalizeType(childKey),
                label: childKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                content: String(text),
              });
            });
          }
        } else if (typeof value === 'string' && value.trim()) {
          results.push({
            id: key,
            type: normalizeType(key),
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            content: value.trim(),
          });
        }
      }

      if (Array.isArray(value)) {
        value.forEach((entry, index) => {
          if (entry && typeof entry === 'object') {
            stack.push({ key: `${key}[${index}]`, value: entry });
          }
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => {
          stack.push({ key: childKey, value: childValue });
        });
      }
    }

    if (results.length > 0) {
      const seen = new Set<string>();
      return results.filter((component) => {
        const key = `${component.type}-${component.label}-${component.content}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return [];
  };

  const computeEmbedSrc = (rawUrl?: string, platform?: string): string => {
    if (!rawUrl) return '';
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.toLowerCase();
      // Bunny CDN or any direct iframe URL
      if (host.includes('iframe.mediadelivery.net')) return rawUrl;
      // YouTube standard/watch URLs
      if (host.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        const parts = u.pathname.split('/');
        const embedIdx = parts.indexOf('embed');
        if (embedIdx >= 0 && parts[embedIdx + 1]) return rawUrl; // already embed
      }
      // YouTube short URLs
      if (host === 'youtu.be') {
        const id = u.pathname.replace('/', '');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      // Block known non-embeddable platforms (TikTok/Instagram) to avoid X-Frame errors.
      if (host.includes('tiktok.com') || host.includes('instagram.com')) return '';
      // Otherwise attempt raw URL as a best effort (for test/demo or custom CDN)
      return rawUrl;
    } catch {
      return '';
    }
  };
  
  // Mock video insights data - in real app this would come from props or API
  const transcript = useMemo(() => extractTranscript(video), [video]);

  const scriptComponents = useMemo(() => extractScriptComponents(video), [video]);

  const performanceMetrics: VideoInsights['performanceMetrics'] = useMemo(() => {
    const analysis = video?.metadata?.analysis || video?.metadata?.metrics || {};
    const metricsSource = analysis?.performance || analysis?.scores || analysis;
    const pickValue = (keys: string[]): number | null => {
      for (const key of keys) {
        const value = metricsSource?.[key];
        if (typeof value === 'number' && !Number.isNaN(value)) {
          return value;
        }
      }
      return null;
    };

    return {
      readability: pickValue(['readability', 'readabilityScore', 'readability_score']),
      engagement: pickValue(['engagement', 'engagementScore', 'engagement_rate']),
      hookStrength: pickValue(['hookStrength', 'hook_strength', 'hookScore']),
    };
  }, [video]);

  const formattedTranscript = transcript || 'Transcript not available yet.';

  const videoInsights: VideoInsights = useMemo(() => ({
    transcript,
    scriptComponents,
    performanceMetrics,
  }), [performanceMetrics, scriptComponents, transcript]);

  const views = video?.metadata?.views ?? video?.metadata?.metrics?.views;
  const likes = video?.metadata?.likes ?? video?.metadata?.metrics?.likes;
  const comments = video?.metadata?.comments ?? video?.metadata?.metrics?.comments;
  const saves = video?.metadata?.saves ?? video?.metadata?.metrics?.saves;
  const shares = video?.metadata?.shares ?? video?.metadata?.metrics?.shares;

  const hasPerformanceMetrics = useMemo(() => {
    return [
      performanceMetrics.readability,
      performanceMetrics.engagement,
      performanceMetrics.hookStrength,
    ].some((value) => typeof value === 'number' && !Number.isNaN(value));
  }, [performanceMetrics]);

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
                  {typeof views === 'number' ? formatViewCount(views) : 'Unknown'} views
                </span>
                {typeof likes === 'number' && (
                  <span>❤️ {formatViewCount(likes)} likes</span>
                )}
                {typeof comments === 'number' && (
                  <span>💬 {formatViewCount(comments)} comments</span>
                )}
                {typeof saves === 'number' && (
                  <span>🔖 {formatViewCount(saves)} saves</span>
                )}
                {typeof shares === 'number' && (
                  <span>🚀 {formatViewCount(shares)} shares</span>
                )}
                <span>⏱️ {video.duration ? formatDuration(video.duration) : 'Unknown'} duration</span>
                <span>{formatRelativeTime(video.created)}</span>
              </div>
            </div>

            <div className="section">
              <h2 className="section-title">
                📝 Full Transcript
              </h2>
              <div className="transcript-content">
                {formattedTranscript}
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
            {videoInsights.scriptComponents.length === 0 ? (
              <p>No script components available yet.</p>
            ) : (
              videoInsights.scriptComponents.map((component) => (
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
              ))
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="section">
            <h2 className="section-title">
              📊 Performance Metrics
            </h2>
            {hasPerformanceMetrics ? (
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">Readability Score</span>
                  <span className="metric-value">
                    {typeof videoInsights.performanceMetrics.readability === 'number'
                      ? `${videoInsights.performanceMetrics.readability}/10`
                      : '—'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement Score</span>
                  <span className="metric-value">
                    {typeof videoInsights.performanceMetrics.engagement === 'number'
                      ? `${videoInsights.performanceMetrics.engagement}/10`
                      : '—'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Hook Strength</span>
                  <span className="metric-value">
                    {typeof videoInsights.performanceMetrics.hookStrength === 'number'
                      ? `${videoInsights.performanceMetrics.hookStrength}/10`
                      : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p>Performance metrics will appear here once available.</p>
            )}
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
            {(() => {
              const metadata = video.metadata ?? {};
              const rawSource = metadata.rawSource ?? {};
              const rawEmbedUrl =
                video.url ||
                metadata.iframeUrl ||
                metadata.embedUrl ||
                metadata.playerUrl ||
                metadata.videoUrl ||
                metadata.embed?.src ||
                metadata.iframe?.src ||
                metadata.contentMetadata?.embedUrl ||
                metadata.contentMetadata?.iframeUrl ||
                rawSource.embedUrl ||
                rawSource.iframeUrl ||
                rawSource.playerUrl ||
                rawSource.videoUrl ||
                rawSource.url;

              const embedSrc = computeEmbedSrc(rawEmbedUrl, video.platform);
              if (embedSrc) {
                return (
                  <iframe
                    className="video-embed"
                    src={embedSrc}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              }
              // Fallback UI when embed is not available
              return (
                <div className="video-placeholder">
                  <div className="placeholder-icon">
                    <VidPlayIcon label="" size="xlarge" primaryColor={token('color.icon.inverse')} />
                  </div>
                  <div className="placeholder-text">Preview Unavailable</div>
                  <div className="placeholder-subtitle">
                    {video.platform && (video.platform === 'tiktok' || video.platform === 'instagram')
                      ? 'This platform does not allow iframe embeds. Use the button below to open the original video.'
                      : 'Embed URL not available for this video.'}
                  </div>
                  {video.url && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <Button
                        variant="primary"
                        onClick={() => window.open(video.url, '_blank', 'noopener,noreferrer')}
                      >
                        Open Original
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
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
