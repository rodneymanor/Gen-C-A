import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { css } from '@emotion/react';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play';
import PersonIcon from '@atlaskit/icon/glyph/person';
import CopyIcon from '@atlaskit/icon/glyph/copy';
import DownloadIcon from '@atlaskit/icon/glyph/download';

import {
  GcDashButton,
  GcDashIconButton,
  GcDashTabs,
  GcDashLabel,
  GcDashCard,
  GcDashCardHeader,
  GcDashCardTitle,
  GcDashCardBody,
  GcDashCardFooter,
  GcDashCardSubtitle,
  GcDashNavButtons,
  GcDashBlankSlate,
} from '../gc-dash';
import type { GcDashLabelTone } from '../gc-dash';
import { gcDashColor, gcDashShape, gcDashSpacing, gcDashTypography } from '../gc-dash/styleUtils';
import {
  formatDuration,
  formatViewCount,
  formatRelativeTime,
  getPlatformIcon,
  formatReadingTime,
} from '../../utils/format';
import type { ContentItem } from '../../types';

type VideoModalTab = 'overview' | 'script' | 'transcript' | 'analysis';

type ScriptComponentType = 'hook' | 'bridge' | 'golden_nugget' | 'call_to_action';

interface ScriptComponent {
  id: string;
  type: ScriptComponentType;
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

export interface VideoModalProps {
  isOpen: boolean;
  video: ContentItem | null;
  videos: ContentItem[];
  onClose: () => void;
  onNavigateVideo: (direction: 'prev' | 'next') => void;
}

const statusToneMap: Record<ContentItem['status'], GcDashLabelTone> = {
  draft: 'warning',
  published: 'success',
  archived: 'neutral',
};

const scriptComponentMeta: Record<ScriptComponentType, { label: string; tone: GcDashLabelTone; icon: string }> = {
  hook: { label: 'Hook', tone: 'primary', icon: '⚡️' },
  bridge: { label: 'Bridge', tone: 'info', icon: '🌉' },
  golden_nugget: { label: 'Golden Nugget', tone: 'success', icon: '✨' },
  call_to_action: { label: 'WTA / CTA', tone: 'warning', icon: '🎯' },
};

const overlayStyles = css`
  position: fixed;
  inset: 0;
  background: rgba(5, 12, 30, 0.78);
  backdrop-filter: blur(28px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 3vw, 40px);
  z-index: 1100;
`;

const modalShellStyles = css`
  position: relative;
  width: min(1600px, 100%);
  height: min(94vh, 960px);
  border-radius: ${gcDashShape.radiusXl};
  background: linear-gradient(145deg, rgba(11, 92, 255, 0.08) 0%, rgba(7, 19, 44, 0.04) 32%, #ffffff 100%);
  box-shadow: 0 42px 120px rgba(2, 10, 28, 0.42);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const topBarStyles = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${gcDashSpacing.md};
  padding: ${gcDashSpacing.md} ${gcDashSpacing.lg};
  border-bottom: 1px solid rgba(9, 30, 66, 0.16);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    align-items: flex-start;
  }
`;

const topBarInfoStyles = css`
  display: flex;
  align-items: center;
  gap: ${gcDashSpacing.sm};
  min-width: 0;

  @media (max-width: 1024px) {
    order: 1;
  }
`;

const titleStyles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 650;
    letter-spacing: -0.015em;
    color: ${gcDashColor.textPrimary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: ${gcDashColor.textMuted};
  }
`;

const headerRightStyles = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${gcDashSpacing.xs};

  @media (max-width: 1024px) {
    width: 100%;
    align-items: stretch;
    order: 2;
  }
`;

const headerControlsRowStyles = css`
  display: flex;
  align-items: center;
  gap: ${gcDashSpacing.sm};
  justify-content: flex-end;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

const tabSwitcherStyles = css`
  width: auto;

  > section[role='tabpanel'] {
    display: none;
  }

  > div[role='tablist'] {
    background: rgba(9, 30, 66, 0.08);
    padding: 4px;
    border-radius: ${gcDashShape.radiusLg};
  }

  button[role='tab'] {
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
  }
`;

const layoutStyles = css`
  flex: 1;
  display: grid;
  grid-template-columns: minmax(480px, 3fr) minmax(520px, 4fr);
  gap: 0;
  min-height: 0;

  @media (max-width: 1280px) {
    grid-template-columns: minmax(420px, 2.5fr) minmax(460px, 3.5fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 45vh) minmax(0, 55vh);
  }
`;

const videoPaneStyles = css`
  position: relative;
  background: radial-gradient(circle at 18% 16%, rgba(11, 92, 255, 0.3), rgba(4, 14, 36, 0.92));
  display: flex;
  flex-direction: column;
  padding: ${gcDashSpacing.lg};
  gap: ${gcDashSpacing.md};
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
`;

const videoFrameStyles = css`
  position: relative;
  width: 100%;
  flex: 1;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.82);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const videoPlaceholderStyles = css`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${gcDashSpacing.sm};
  text-align: center;
  color: rgba(255, 255, 255, 0.88);
  padding: ${gcDashSpacing.lg};
`;

const videoMetaStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${gcDashSpacing.sm};
`;

const videoMetaChipsStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${gcDashSpacing.xs};
`;

const rightPaneStyles = css`
  background: ${gcDashColor.surface};
  padding: ${gcDashSpacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${gcDashSpacing.md};
  overflow: hidden;
`;

const actionBarStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${gcDashSpacing.sm};
  align-items: center;
`;

const scrollRegionStyles = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: ${gcDashSpacing.lg};
`;

const metricBadgeStyles = css`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 132px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(11, 92, 255, 0.08);
  color: ${gcDashColor.textPrimary};
  border: 1px solid rgba(11, 92, 255, 0.18);

  span.metric-label {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${gcDashColor.textMuted};
  }

  span.metric-value {
    font-size: 20px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
`;

const metricsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${gcDashSpacing.sm};
`;

const sectionTitleStyles = css`
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: ${gcDashTypography.titleWeight};
  color: ${gcDashColor.textPrimary};
`;

const sectionSubtitleStyles = css`
  margin: 0 0 ${gcDashSpacing.sm} 0;
  font-size: 13px;
  color: ${gcDashColor.textMuted};
`;

const textBlockStyles = css`
  font-size: 15px;
  line-height: 1.6;
  color: ${gcDashColor.textSecondary};
  white-space: pre-wrap;
`;

const clampStyles = (lines: number) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const scriptCardStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${gcDashSpacing.xs};
`;

const scriptContentStyles = css`
  font-size: 15px;
  line-height: 1.6;
  color: ${gcDashColor.textSecondary};
  white-space: pre-wrap;
`;

const scriptHeaderStyles = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${gcDashSpacing.xs};
`;

const analysisGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${gcDashSpacing.md};
`;

const analysisDetailStyles = css`
  display: grid;
  gap: 12px;
`;

const AnalysisMetricRow: React.FC<{ label: string; value: string; emphasis?: boolean }> = ({
  label,
  value,
  emphasis = false,
}) => (
  <div
    css={css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${gcDashSpacing.sm};
      font-size: 14px;
      color: ${emphasis ? gcDashColor.textPrimary : gcDashColor.textSecondary};
      font-weight: ${emphasis ? 600 : 500};
    `}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const MetricBadge: React.FC<{ label: string; value: string; icon?: string }> = ({ label, value, icon }) => (
  <div css={metricBadgeStyles}>
    <span className="metric-label">{label}</span>
    <span className="metric-value">
      {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
      {value}
    </span>
  </div>
);

const collectCandidateObjects = (item: ContentItem | null): Record<string, any>[] => {
  if (!item) return [];

  const metadata = item.metadata ?? {};
  const rawSource = metadata.rawSource ?? {};
  const roots = [metadata, metadata.contentMetadata, rawSource, metadata.analysis, metadata.metrics].filter(Boolean);

  const collected: Record<string, any>[] = [];
  const visited = new Set<any>();

  const stack = [...roots];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    collected.push(current as Record<string, any>);

    Object.values(current).forEach((value) => {
      if (value && typeof value === 'object') {
        stack.push(value);
      }
    });
  }

  return collected;
};

const transcriptKeywords = /transcript|caption|transcription|captions|full_text/i;

const flattenTranscriptValue = (value: unknown): string => {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => flattenTranscriptValue(entry))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => flattenTranscriptValue(entry))
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const extractTranscript = (item: ContentItem | null): string => {
  if (!item) return '';

  const potentialSources: Array<string | undefined> = [];
  const metadata = item.metadata ?? {};
  const rawSource = metadata.rawSource ?? {};

  potentialSources.push(metadata.transcript);
  potentialSources.push(metadata.fullTranscript);
  potentialSources.push(metadata.caption);
  potentialSources.push(metadata.captions);
  potentialSources.push(rawSource.transcript);
  potentialSources.push(rawSource.caption);

  for (const candidate of potentialSources) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const candidates = collectCandidateObjects(item);
  for (const candidate of candidates) {
    for (const [key, value] of Object.entries(candidate)) {
      if (transcriptKeywords.test(key)) {
        const flattened = flattenTranscriptValue(value);
        if (flattened.trim()) {
          return flattened.trim();
        }
      }
    }
  }

  return '';
};

const extractScriptComponents = (item: ContentItem | null): ScriptComponent[] => {
  if (!item) return [];

  const roots = collectCandidateObjects(item);
  const quickCandidates = [
    item.metadata?.scriptComponents,
    item.metadata?.components,
    item.metadata?.script?.components,
    item.metadata?.analysis?.components,
    item.metadata?.contentMetadata?.scriptComponents,
    item.metadata?.rawSource?.scriptComponents,
    item.metadata?.rawSource?.components,
  ];

  const normalizeType = (value: string): ScriptComponentType => {
    const normalized = value.toLowerCase();
    if (normalized === 'wta' || normalized === 'cta' || normalized.includes('call')) return 'call_to_action';
    if (normalized.includes('golden') || normalized.includes('nugget')) return 'golden_nugget';
    if (normalized.includes('bridge')) return 'bridge';
    return 'hook';
  };

  const results: ScriptComponent[] = [];
  const visited = new Set<any>();
  const stack = roots.flatMap((root) => Object.entries(root).map(([key, value]) => ({ key, value })));

  const pushComponent = (id: string, type: ScriptComponentType, label: string, raw: unknown) => {
    const source = typeof raw === 'string'
      ? raw
      : (raw as any)?.content ?? (raw as any)?.text ?? (raw as any)?.script ?? raw;
    const text = typeof source === 'string' ? source.trim() : '';
    if (!text) return;
    results.push({ id, type, label, content: text });
  };

  quickCandidates.forEach((candidate) => {
    if (!candidate) return;
    if (Array.isArray(candidate)) {
      candidate.forEach((entry: any, index: number) => {
        if (!entry) return;
        const type = normalizeType(entry.type ?? 'hook');
        const label = entry.label ?? entry.title ?? `Component ${index + 1}`;
        pushComponent(entry.id ?? `component-${index}`, type, label, entry);
      });
    } else if (typeof candidate === 'object') {
      Object.entries(candidate).forEach(([key, value], index) => {
        const type = normalizeType(key);
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        pushComponent(`${key}-${index}`, type, label, value);
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
          const type = normalizeType(entry.type ?? key);
          const label = entry.label ?? entry.title ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          pushComponent(entry.id ?? `${key}-${index}`, type, label, entry);
        });
      } else if (value && typeof value === 'object') {
        const direct = (value as any).content ?? (value as any).text ?? (value as any).script;
        if (typeof direct === 'string' && direct.trim()) {
          const type = normalizeType((value as any).type ?? key);
          const label = (value as any).label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          pushComponent((value as any).id ?? key, type, label, direct);
        } else {
          Object.entries(value).forEach(([childKey, childValue]) => {
            const label = childKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const type = normalizeType(childKey);
            pushComponent(`${key}-${childKey}`, type, label, childValue);
          });
        }
      } else if (typeof value === 'string') {
        const type = normalizeType(key);
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        pushComponent(key, type, label, value);
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

  if (results.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  return results.filter((component) => {
    const fingerprint = `${component.type}-${component.label}-${component.content}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
};

const computeEmbedSrc = (rawUrl?: string, platform?: string | null): string => {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();

    if (host.includes('iframe.mediadelivery.net')) return rawUrl;

    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = u.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) return rawUrl;
    }

    if (host === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host.includes('tiktok.com') || host.includes('instagram.com')) return '';

    return rawUrl;
  } catch {
    return '';
  }
};

const formatScore = (value: number | null): string => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value.toFixed(1).replace(/\.0$/, '')}/10`;
  }
  return '—';
};

const deriveComplexity = (readability: number | null, wordCount: number): { grade: string; descriptor: string } => {
  if (readability === null) {
    if (wordCount > 600) {
      return { grade: 'B', descriptor: 'Detailed narrative with moderate density' };
    }
    return { grade: 'B+', descriptor: 'Balanced delivery, optimise hooks for more punch' };
  }

  if (readability >= 8.5) {
    return { grade: 'A', descriptor: 'Conversational pacing; easy to digest' };
  }
  if (readability >= 7.5) {
    return { grade: 'B+', descriptor: 'Balanced complexity; consider a sharper hook' };
  }
  if (readability >= 6.5) {
    return { grade: 'B', descriptor: 'Slightly dense; simplify phrasing for reach' };
  }
  return { grade: 'C+', descriptor: 'High complexity; tighten structure to maintain attention' };
};

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  video,
  videos,
  onClose,
  onNavigateVideo,
}) => {
  const [activeTab, setActiveTab] = useState<VideoModalTab>('overview');
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState<Record<string, boolean>>({});

  const transcript = useMemo(() => extractTranscript(video), [video]);
  const scriptComponents = useMemo(() => extractScriptComponents(video), [video]);

  const scriptComponentsByType = useMemo(() => {
    const grouped: Record<ScriptComponentType, ScriptComponent[]> = {
      hook: [],
      bridge: [],
      golden_nugget: [],
      call_to_action: [],
    };

    scriptComponents.forEach((component) => {
      grouped[component.type].push(component);
    });

    return grouped;
  }, [scriptComponents]);

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

  const formattedTranscript = useMemo(() => transcript?.trim() ?? '', [transcript]);

  const views = video?.metadata?.views ?? video?.metadata?.metrics?.views;
  const likes = video?.metadata?.likes ?? video?.metadata?.metrics?.likes;
  const comments = video?.metadata?.comments ?? video?.metadata?.metrics?.comments;
  const saves = video?.metadata?.saves ?? video?.metadata?.metrics?.saves;
  const shares = video?.metadata?.shares ?? video?.metadata?.metrics?.shares;

  const currentVideoIndex = useMemo(() => videos.findIndex((v) => v.id === video?.id), [videos, video?.id]);
  const canNavigatePrev = currentVideoIndex > 0;
  const canNavigateNext = currentVideoIndex < videos.length - 1;

  const embedSrc = useMemo(() => {
    if (!video) return '';
    const metadata = video.metadata ?? {};
    const rawSource = metadata.rawSource ?? {};

    const rawEmbedUrl =
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
      rawSource.url ||
      video.url;

    return computeEmbedSrc(rawEmbedUrl, video.platform);
  }, [video]);

  const relativeCreated = useMemo(() => (video ? formatRelativeTime(video.created) : '—'), [video]);

  const metricItems = useMemo(() => {
    const items: Array<{ id: string; label: string; value: string; icon?: string }> = [];
    if (typeof views === 'number') items.push({ id: 'views', label: 'Views', value: formatViewCount(views), icon: '👀' });
    if (typeof likes === 'number') items.push({ id: 'likes', label: 'Likes', value: formatViewCount(likes), icon: '❤️' });
    if (typeof comments === 'number') items.push({ id: 'comments', label: 'Comments', value: formatViewCount(comments), icon: '💬' });
    if (typeof shares === 'number') items.push({ id: 'shares', label: 'Shares', value: formatViewCount(shares), icon: '🚀' });
    if (typeof saves === 'number') items.push({ id: 'saves', label: 'Saves', value: formatViewCount(saves), icon: '📌' });
    if (video?.duration) items.push({ id: 'duration', label: 'Runtime', value: formatDuration(video.duration), icon: '⏱️' });
    return items;
  }, [views, likes, comments, shares, saves, video?.duration]);

  const metaChips = useMemo(() => {
    if (!video) return [] as Array<{ id: string; label: string; tone: GcDashLabelTone; icon?: string }>;
    const chips: Array<{ id: string; label: string; tone: GcDashLabelTone; icon?: string }> = [];
    if (video.platform) {
      const platformName = video.platform.charAt(0).toUpperCase() + video.platform.slice(1);
      chips.push({ id: 'platform', label: `${platformName}`, tone: 'primary', icon: getPlatformIcon(video.platform) });
    }
    chips.push({ id: 'status', label: video.status, tone: statusToneMap[video.status] });
    chips.push({ id: 'published', label: relativeCreated, tone: 'info' });
    return chips;
  }, [video, relativeCreated]);

  const transcriptWordCount = useMemo(() => {
    if (!formattedTranscript) return 0;
    return formattedTranscript.split(/\s+/).filter(Boolean).length;
  }, [formattedTranscript]);

  const scriptWordCount = useMemo(
    () =>
      scriptComponents.reduce((total, component) => {
        const words = component.content.split(/\s+/).filter(Boolean).length;
        return total + words;
      }, 0),
    [scriptComponents]
  );

  const averageScore = useMemo(() => {
    const values = [
      performanceMetrics.readability,
      performanceMetrics.engagement,
      performanceMetrics.hookStrength,
    ].filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [performanceMetrics]);

  const complexity = useMemo(() => deriveComplexity(performanceMetrics.readability, transcriptWordCount || scriptWordCount), [
    performanceMetrics.readability,
    transcriptWordCount,
    scriptWordCount,
  ]);

  const analysisSummary = useMemo(() => {
    const grade = (() => {
      if (averageScore === null) return 'Pending';
      if (averageScore >= 8.5) return 'A';
      if (averageScore >= 7.5) return 'B+';
      if (averageScore >= 6.5) return 'B';
      return 'C';
    })();

    return {
      grade,
      summary: complexity.descriptor,
      averageScore,
    };
  }, [averageScore, complexity]);

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', badge: undefined, content: null },
      {
        id: 'script',
        label: 'Script',
        badge: scriptComponents.length ? scriptComponents.length.toString() : undefined,
        content: null,
      },
      {
        id: 'transcript',
        label: 'Transcript',
        badge: transcriptWordCount ? transcriptWordCount.toLocaleString() : undefined,
        content: null,
      },
      {
        id: 'analysis',
        label: 'Analysis',
        badge: averageScore ? analysisSummary.grade : undefined,
        content: null,
      },
    ],
    [scriptComponents.length, formattedTranscript, transcriptWordCount, averageScore, analysisSummary.grade]
  );

  const handleCopyToClipboard = useCallback(async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text', error);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (scriptComponents.length === 0) return;
    const allComponents = scriptComponents.map((component) => `${component.label}: ${component.content}`).join('\n\n');
    await handleCopyToClipboard(allComponents);
  }, [handleCopyToClipboard, scriptComponents]);

  const openOriginal = useCallback(() => {
    if (video?.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  }, [video?.url]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowLeft' && canNavigatePrev) {
        event.preventDefault();
        onNavigateVideo('prev');
      }
      if (event.key === 'ArrowRight' && canNavigateNext) {
        event.preventDefault();
        onNavigateVideo('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, onNavigateVideo, canNavigatePrev, canNavigateNext]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setTranscriptExpanded(false);
      setDescriptionExpanded(false);
      setScriptExpanded({});
    }
  }, [isOpen, video?.id]);

  if (!isOpen || !video) {
    return null;
  }

  const overviewContent = (
    <GcDashCard>
      <GcDashCardHeader css={css`flex-direction: column; align-items: flex-start; gap: ${gcDashSpacing.sm};`}>
        <div>
          <h2 css={sectionTitleStyles}>Performance Snapshot</h2>
          <p css={sectionSubtitleStyles}>Key metrics from the latest crawl of this clip.</p>
        </div>
        <div css={metricsGridStyles}>
          {metricItems.length ? (
            metricItems.map((metric) => (
              <MetricBadge key={metric.id} label={metric.label} value={metric.value} icon={metric.icon} />
            ))
          ) : (
            <GcDashBlankSlate description="Metrics will populate once the video sync completes." />
          )}
        </div>
      </GcDashCardHeader>
      {(video.description || video.metadata?.caption) && (
        <GcDashCardBody css={css`display: flex; flex-direction: column; gap: ${gcDashSpacing.xs};`}>
          <h3 css={sectionTitleStyles}>Description & Caption</h3>
          <p
            css={[textBlockStyles, !descriptionExpanded && clampStyles(5)]}
          >
            {video.description || video.metadata?.caption}
          </p>
          {(video.description?.length ?? video.metadata?.caption?.length ?? 0) > 320 && (
            <GcDashButton
              variant="ghost"
              size="sm"
              onClick={() => setDescriptionExpanded((expanded) => !expanded)}
            >
              {descriptionExpanded ? 'Show less' : 'Show more'}
            </GcDashButton>
          )}
        </GcDashCardBody>
      )}
    </GcDashCard>
  );

  const scriptContent = (
    <div css={css`display: grid; gap: ${gcDashSpacing.md};`}>
      <div css={css`display: flex; align-items: center; justify-content: space-between; gap: ${gcDashSpacing.sm}; flex-wrap: wrap;`}>
        <div>
          <h2 css={sectionTitleStyles}>Script Beats</h2>
          <p css={sectionSubtitleStyles}>Hook-to-close structure pulled from scripting data.</p>
        </div>
        <div css={css`display: inline-flex; gap: ${gcDashSpacing.xs}; flex-wrap: wrap;`}>
          <GcDashButton variant="ghost" size="sm" onClick={handleCopyAll} disabled={scriptComponents.length === 0}>
            <CopyIcon label="" size="small" primaryColor="currentColor" />
            Copy all
          </GcDashButton>
          <GcDashButton variant="secondary" size="sm" disabled>
            <DownloadIcon label="" size="small" primaryColor="currentColor" />
            Export outline
          </GcDashButton>
        </div>
      </div>

      {scriptComponents.length === 0 ? (
        <GcDashBlankSlate
          title="No scripted beats yet"
          description="Once this video has structured components, they will appear here for remixing."
        />
      ) : (
        Object.entries(scriptComponentsByType)
          .filter(([, components]) => components.length > 0)
          .map(([type, components]) => {
            const meta = scriptComponentMeta[type as ScriptComponentType];
            return (
              <div key={type} css={css`display: grid; gap: ${gcDashSpacing.sm};`}>
                <div css={scriptHeaderStyles}>
                  <GcDashLabel tone={meta.tone} variant="soft" uppercase={false}>
                    {meta.icon} {meta.label}
                  </GcDashLabel>
                  <span css={css`font-size: 13px; color: ${gcDashColor.textMuted};`}>
                    {components.length} {components.length === 1 ? 'moment' : 'moments'}
                  </span>
                </div>
                <div css={css`display: grid; gap: ${gcDashSpacing.sm};`}>
                  {components.map((component) => {
                    const expanded = scriptExpanded[component.id];
                    const contentLength = component.content.length;
                    const shouldClamp = contentLength > 320;

                    return (
                      <GcDashCard key={component.id}>
                        <GcDashCardBody css={scriptCardStyles}>
                          <h4 css={css`margin: 0; font-size: 15px; font-weight: 600; color: ${gcDashColor.textPrimary};`}>
                            {component.label}
                          </h4>
                          <p css={[scriptContentStyles, !expanded && shouldClamp && clampStyles(6)]}>{component.content}</p>
                        </GcDashCardBody>
                        <GcDashCardFooter>
                          <GcDashButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(component.content)}
                          >
                            <CopyIcon label="" size="small" primaryColor="currentColor" />
                            Copy
                          </GcDashButton>
                          {shouldClamp && (
                            <GcDashButton
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setScriptExpanded((prev) => ({ ...prev, [component.id]: !expanded }))
                              }
                            >
                              {expanded ? 'Show less' : 'Show more'}
                            </GcDashButton>
                          )}
                        </GcDashCardFooter>
                      </GcDashCard>
                    );
                  })}
                </div>
              </div>
            );
          })
      )}
    </div>
  );

  const transcriptContent = (
    <GcDashCard>
      <GcDashCardHeader>
        <GcDashCardTitle>Full Transcript</GcDashCardTitle>
        <GcDashButton
          variant="ghost"
          size="sm"
          onClick={() => formattedTranscript && handleCopyToClipboard(formattedTranscript)}
          disabled={!formattedTranscript}
        >
          <CopyIcon label="" size="small" primaryColor="currentColor" />
          Copy transcript
        </GcDashButton>
      </GcDashCardHeader>
      <GcDashCardBody css={css`display: grid; gap: ${gcDashSpacing.sm};`}>
        <p css={[textBlockStyles, !transcriptExpanded && clampStyles(12)]}>
          {formattedTranscript || 'Transcript not available yet.'}
        </p>
        {formattedTranscript && formattedTranscript.length > 900 && (
          <GcDashButton
            variant="ghost"
            size="sm"
            onClick={() => setTranscriptExpanded((expanded) => !expanded)}
          >
            {transcriptExpanded ? 'Show less' : 'Show more'}
          </GcDashButton>
        )}
      </GcDashCardBody>
    </GcDashCard>
  );

  const analysisContent = (
    <div css={analysisGridStyles}>
      <GcDashCard>
        <GcDashCardHeader>
          <div>
            <GcDashCardTitle>Delivery Grade</GcDashCardTitle>
            <GcDashCardSubtitle>{analysisSummary.summary}</GcDashCardSubtitle>
          </div>
        </GcDashCardHeader>
        <GcDashCardBody css={analysisDetailStyles}>
          <div
            css={css`
              font-size: 42px;
              font-weight: 700;
              letter-spacing: -0.03em;
              color: ${gcDashColor.textPrimary};
            `}
          >
            {analysisSummary.grade}
          </div>
          <AnalysisMetricRow label="Average score" value={averageScore ? formatScore(averageScore) : 'Pending'} emphasis />
          <AnalysisMetricRow label="Readability" value={formatScore(performanceMetrics.readability)} />
          <AnalysisMetricRow label="Engagement" value={formatScore(performanceMetrics.engagement)} />
          <AnalysisMetricRow label="Hook strength" value={formatScore(performanceMetrics.hookStrength)} />
        </GcDashCardBody>
      </GcDashCard>

      <GcDashCard>
        <GcDashCardHeader>
          <GcDashCardTitle>Script Density</GcDashCardTitle>
        </GcDashCardHeader>
        <GcDashCardBody css={analysisDetailStyles}>
          <AnalysisMetricRow label="Transcript words" value={transcriptWordCount ? transcriptWordCount.toLocaleString() : '—'} />
          <AnalysisMetricRow label="Structured beats" value={scriptComponents.length ? scriptComponents.length.toString() : '—'} />
          <AnalysisMetricRow label="Reading time" value={transcriptWordCount ? formatReadingTime(transcriptWordCount) : '—'} />
          <AnalysisMetricRow
            label="Narrative complexity"
            value={`${complexity.grade} • ${complexity.descriptor}`}
            emphasis
          />
        </GcDashCardBody>
      </GcDashCard>

      <GcDashCard>
        <GcDashCardHeader>
          <GcDashCardTitle>Opportunities</GcDashCardTitle>
        </GcDashCardHeader>
        <GcDashCardBody css={analysisDetailStyles}>
          <ul
            css={css`
              margin: 0;
              padding-left: 18px;
              display: grid;
              gap: 8px;
              font-size: 14px;
              color: ${gcDashColor.textSecondary};
            `}
          >
            <li>Tighten your hook to land in the first 3 seconds.</li>
            <li>Repurpose the golden nugget into carousels or reels.</li>
            <li>Use WTA as a modular CTA for collection follow-ups.</li>
          </ul>
        </GcDashCardBody>
      </GcDashCard>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'overview':
        return overviewContent;
      case 'script':
        return scriptContent;
      case 'transcript':
        return transcriptContent;
      case 'analysis':
        return analysisContent;
      default:
        return null;
    }
  };

  const dialogTitleId = `video-modal-title-${video.id}`;

  return (
    <div css={overlayStyles} onClick={onClose} role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        css={modalShellStyles}
        onClick={(event) => event.stopPropagation()}
      >
        <header css={topBarStyles}>
          <div
            css={css`
              display: flex;
              align-items: center;
              gap: ${gcDashSpacing.sm};

              @media (max-width: 1024px) {
                order: 0;
              }
            `}
          >
            <GcDashIconButton aria-label="Close modal" onClick={onClose}>
              <CrossIcon label="" />
            </GcDashIconButton>
          </div>

          <div css={topBarInfoStyles}>
            <GcDashLabel tone="primary" variant="soft" uppercase={false}>
              Video {currentVideoIndex + 1} of {videos.length}
            </GcDashLabel>
            <div css={titleStyles}>
              <h1 id={dialogTitleId}>{video.title}</h1>
              <span>
                {video.creator && (
                  <>
                    <PersonIcon label="" size="small" primaryColor="currentColor" />
                    @{video.creator}
                    <span aria-hidden="true">•</span>
                  </>
                )}
                {relativeCreated}
              </span>
            </div>
          </div>

          <div css={headerRightStyles}>
            <div css={headerControlsRowStyles}>
              <GcDashNavButtons
                onPrevious={() => onNavigateVideo('prev')}
                onNext={() => onNavigateVideo('next')}
                disablePrevious={!canNavigatePrev}
                disableNext={!canNavigateNext}
                size="compact"
              />
            </div>
            <GcDashTabs
              tabs={tabs}
              activeTabId={activeTab}
              onChange={(tabId) => setActiveTab(tabId as VideoModalTab)}
              variant="pill"
              stretch={false}
              css={tabSwitcherStyles}
            />
          </div>
        </header>

        <div css={layoutStyles}>
          <aside css={videoPaneStyles}>
            <div css={videoFrameStyles}>
              {embedSrc ? (
                <iframe
                  src={embedSrc}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div css={videoPlaceholderStyles}>
                  <VidPlayIcon label="" size="xlarge" primaryColor="#ffffff" />
                  <span css={css`font-size: 18px; font-weight: 700;`}>Preview unavailable</span>
                  <span css={css`font-size: 14px; opacity: 0.85; max-width: 360px;`}>
                    {video.platform && (video.platform === 'tiktok' || video.platform === 'instagram')
                      ? 'This platform blocks iframe playback. Open the original post to watch it.'
                      : 'We could not render an embeddable preview for this video.'}
                  </span>
                  {video.url && (
                    <GcDashButton variant="primary" size="sm" onClick={openOriginal}>
                      View on platform
                    </GcDashButton>
                  )}
                </div>
              )}
            </div>

            <div css={videoMetaStyles}>
              <div css={videoMetaChipsStyles}>
                {metaChips.map((chip) => (
                  <GcDashLabel key={chip.id} tone={chip.tone} variant="soft" uppercase={false}>
                    {chip.icon && <span aria-hidden>{chip.icon}</span>}
                    {chip.label}
                  </GcDashLabel>
                ))}
              </div>
              <div css={css`display: flex; flex-direction: column; gap: 6px;`}>
                <span css={css`font-size: 17px; font-weight: 600;`}>{video.title}</span>
                {video.creator && (
                  <span css={css`font-size: 14px; opacity: 0.85;`}>@{video.creator}</span>
                )}
              </div>
            </div>

            <div css={css`display: flex; gap: ${gcDashSpacing.xs}; flex-wrap: wrap;`}>
              {video.url && (
                <GcDashButton variant="secondary" size="sm" onClick={openOriginal}>
                  Open original
                </GcDashButton>
              )}
              <GcDashButton
                variant="ghost"
                size="sm"
                onClick={() => formattedTranscript && handleCopyToClipboard(formattedTranscript)}
                disabled={!formattedTranscript}
              >
                <CopyIcon label="" size="small" primaryColor="currentColor" />
                Copy transcript
              </GcDashButton>
            </div>
          </aside>

          <section css={rightPaneStyles}>
            <div css={actionBarStyles}>
              <GcDashButton variant="primary" size="md">Rewrite as script</GcDashButton>
              <GcDashButton variant="secondary" size="md">Extract content ideas</GcDashButton>
              <GcDashButton variant="secondary" size="md">Generate hooks</GcDashButton>
              <GcDashButton variant="ghost" size="md">Add to my collection</GcDashButton>
            </div>

            <div css={scrollRegionStyles}>{renderActiveContent()}</div>
          </section>
        </div>
      </section>
    </div>
  );
};
