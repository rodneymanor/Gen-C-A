import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import AddIcon from '@atlaskit/icon/glyph/add';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import BasicModal from '../../../components/ui/BasicModal';
import { VideoModal } from '../../../components/collections/VideoModal';
import type { Collection, ContentItem } from '../../../types';
import RbacClient from '../../../core/auth/rbac-client';
import { auth } from '../../../config/firebase';
import {
  GcDashBlankSlate,
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashCardSubtitle,
  GcDashCardTitle,
  GcDashInput,
  GcDashLabel,
  GcDashNavButtons,
  GcDashPlanChip,
  GcDashSearchBar,
  GcDashTextArea,
} from '../../../components/gc-dash';
import { useDebugger, DEBUG_LEVELS } from '../../../utils/debugger';
import { usePageLoad } from '../../../contexts/PageLoadContext';

const pageContainerStyles = css`
  min-height: 100vh;
  background: rgba(9, 30, 66, 0.02);
  padding: 48px 64px;

  @media (max-width: 1024px) {
    padding: 32px 32px 64px;
  }

  @media (max-width: 640px) {
    padding: 24px 20px 48px;
  }
`;

const shellStyles = css`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const headerRowStyles = css`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const headerLeftStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;


const collectionsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
`;

const pinnedCollectionsRowStyles = css`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const detailLayoutStyles = css`
  display: grid;
  gap: 24px;
`;

const videoGridStyles = css`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(216px, 1fr));
`;

const detailHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-start;
`;

const detailHeaderMetaStyles = css`
  display: grid;
  gap: 8px;
  max-width: 640px;
`;

const detailHeaderMetricsStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: rgba(9, 30, 66, 0.6);
`;

const detailHeaderActionsStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const videoCardThumbnailStyles = css`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(9, 30, 66, 0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const videoCardOverlayStyles = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, rgba(9, 30, 66, 0.15), rgba(9, 30, 66, 0.55));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;

  .play-indicator {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: rgba(9, 30, 66, 0.8);
    box-shadow: 0 8px 16px rgba(9, 30, 66, 0.18);
  }
`;

const videoCardShellStyles = css`
  box-shadow: none;
  background: transparent;
  border: none;
`;

const videoCardBodyStyles = css`
  padding: 0;
  display: grid;
  gap: 8px;
`;

const videoCardInteractiveStyles = css`
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(9, 30, 66, 0.18);
  }

  &:hover .video-overlay,
  &:focus-visible .video-overlay {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 3px;
  }
`;

const videoCardMetaStyles = css`
  display: grid;
  gap: 6px;
`;

const videoCardFooterStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const videoDurationBadgeStyles = css`
  position: absolute;
  right: 8px;
  bottom: 8px;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(9, 30, 66, 0.72);
`;

const videoThumbnailPlaceholderStyles = css`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(9, 30, 66, 0.4);
  font-size: 13px;
  font-weight: 500;
`;

const videoTitleStyles = css`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: rgba(9, 30, 66, 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const videoMetaRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: rgba(9, 30, 66, 0.6);
`;

const videoTagRowStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const videoPlatformBadgeStyles = css`
  position: absolute;
  top: 8px;
  left: 8px;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.88);
  color: rgba(9, 30, 66, 0.72);
`;

const videoCardInfoStyles = css`
  display: grid;
  gap: 6px;
`;

const videoMetricRowStyles = css`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: rgba(9, 30, 66, 0.65);
`;

const sectionTitleStyles = css`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(9, 30, 66, 0.85);
`;

const modalBodyStyles = css`
  display: grid;
  gap: 16px;

  .form-row {
    display: grid;
    gap: 8px;
  }

  .error {
    color: var(--color-error-500);
    font-size: 13px;
  }

  .helper {
    font-size: 12px;
    color: rgba(9, 30, 66, 0.6);
  }
`;

const DEFAULT_COLLECTION_DESCRIPTION =
  'Curated short‑form video set for planning and performance review. Add clips from TikTok or Instagram, compare hooks and visuals, track results, and repurpose the best ideas into new posts.';

const intlCompactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type CollectionCardVariant = 'default' | 'pinnedBorder' | 'pinnedBorderless';

const PINNED_CARD_VARIANT: CollectionCardVariant = 'pinnedBorderless';

const pinnedCardBaseStyles = css`
  background: rgba(11, 92, 255, 0.08);
  color: var(--color-primary-600);
  box-shadow: none;
`;

const pinnedCardBorderStyles = css`
  border: 1px solid rgba(11, 92, 255, 0.3);
`;

const pinnedCardBorderlessStyles = css`
  border: none;
`;

const pinnedTitleStyles = css`
  color: var(--color-primary-600);
  font-size: 13px;
  line-height: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const pinnedDescriptionStyles = css`
  color: rgba(11, 92, 255, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 12px;
  line-height: 16px;
  width: 100%;
`;

const pinnedCardBodyCompactStyles = css`
  position: relative;
  padding: 8px;
  gap: 4px;
  min-height: 68px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const pinnedHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 16px;
`;

const defaultMetaColorStyles = css`
  color: rgba(9, 30, 66, 0.65);
`;

const pinnedCardDimensionsStyles = css`
  width: 178px;
  min-height: 68px;
  flex: 0 0 178px;
`;

const formatRelativeTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

const mapServerCollectionToUi = (c: any): Collection => {
  const hasDesc = typeof c.description === 'string' && c.description.trim().length > 0;
  return {
    id: String(c.id),
    name: c.title || 'Untitled',
    description: hasDesc ? c.description : DEFAULT_COLLECTION_DESCRIPTION,
    thumbnail: '',
    tags: Array.isArray(c.tags) ? c.tags : [],
    platforms: Array.isArray(c.platforms) ? c.platforms : [],
    videoCount: typeof c.videoCount === 'number' ? c.videoCount : 0,
    created: c.createdAt ? new Date(c.createdAt) : new Date(),
    updated: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    isPrivate: Boolean(c.isPrivate),
    previewVideos: Array.isArray(c.previewVideos) ? c.previewVideos : [],
  };
};

const coerceDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const normalizePlatform = (platform?: string) => {
  if (!platform) return '';
  const value = platform.toLowerCase();
  if (value.includes('tiktok')) return 'tiktok';
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('youtube')) return 'youtube';
  return value;
};

const pickFirstString = (...values: any[]) => {
  for (const raw of values) {
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return undefined;
};

const resolveThumbnail = (video: any, metadata: Record<string, any>) => {
  const candidates = [
    video.thumbnail,
    video.thumbnailUrl,
    video.imageUrl,
    video.previewImage,
    video.previewImageUrl,
    video.coverImage,
    video.media?.thumbnail,
    video.media?.thumbnailUrl,
    metadata.thumbnail,
    metadata.thumbnailUrl,
    metadata.previewImage,
    metadata.previewImageUrl,
    metadata.coverImage,
    metadata.images?.cover,
    metadata.images?.default,
    metadata.media?.thumbnailUrl,
    metadata.media?.previewImage,
    metadata.contentMetadata?.thumbnailUrl,
    metadata.contentMetadata?.previewImageUrl,
  ];
  const value = pickFirstString(...candidates);
  return value ?? '';
};

const resolveCreator = (video: any, metadata: Record<string, any>) => {
  const candidates = [
    video.creator,
    video.author,
    video.username,
    video.owner,
    video.channel,
    metadata.creator,
    metadata.creatorName,
    metadata.author,
    metadata.authorName,
    metadata.authorHandle,
    metadata.owner,
    metadata.channelName,
    metadata.contentMetadata?.creator,
    metadata.contentMetadata?.creatorName,
    metadata.account?.handle,
    metadata.account?.username,
  ];
  return pickFirstString(...candidates);
};

const resolveDuration = (video: any, metadata: Record<string, any>) => {
  const candidates = [
    video.duration,
    metadata.duration,
    metadata.length,
    metadata.videoLength,
    metadata.contentMetadata?.duration,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && candidate > 0) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return undefined;
};

const resolveVideoUrl = (video: any, metadata: Record<string, any>) => {
  const candidates = [
    video.embeddableUrl,
    video.embedUrl,
    video.iframeUrl,
    video.playerUrl,
    video.videoUrl,
    video.url,
    video.permalink,
    video.shareUrl,
    metadata.embedUrl,
    metadata.iframeUrl,
    metadata.playerUrl,
    metadata.videoUrl,
    metadata.directUrl,
    metadata.url,
    metadata.shareUrl,
    metadata.permalink,
    metadata.originalUrl,
    metadata.watchUrl,
    metadata.contentMetadata?.url,
    metadata.contentMetadata?.permalink,
    metadata.contentMetadata?.embedUrl,
    metadata.contentMetadata?.iframeUrl,
  ];
  return pickFirstString(...candidates) ?? '';
};

const ensureMetadata = (video: any) => {
  const metadata = { ...(video.metadata ?? {}) };

  if (!metadata.metrics && video.metrics) metadata.metrics = video.metrics;
  if (!metadata.contentMetadata && video.contentMetadata) metadata.contentMetadata = video.contentMetadata;
  if (!metadata.analytics && video.analytics) metadata.analytics = video.analytics;
  if (!metadata.stats && video.stats) metadata.stats = video.stats;
  if (!metadata.insights && video.insights) metadata.insights = video.insights;
  if (!metadata.viewCount && video.viewCount) metadata.viewCount = video.viewCount;
  if (!metadata.views && video.views) metadata.views = video.views;
  if (!metadata.playCount && video.playCount) metadata.playCount = video.playCount;

  const propagate = (field: string, targetKey?: string) => {
    const key = targetKey ?? field;
    if (metadata[key] === undefined && video[field] !== undefined) {
      metadata[key] = video[field];
    }
  };

  [
    'transcript',
    'transcriptUrl',
    'transcriptText',
    'transcriptSegments',
    'captions',
    'caption',
    'scriptComponents',
    'components',
    'analysis',
    'performance',
    'performanceMetrics',
    'summary',
    'embedUrl',
    'iframeUrl',
    'playerUrl',
    'iframeEmbedUrl',
    'videoUrl',
    'directUrl',
    'previewUrl',
    'likes',
    'comments',
    'shares',
    'saves',
  ].forEach((field) => propagate(field));

  if (video.embed && metadata.embed === undefined) metadata.embed = video.embed;
  if (video.iframe && metadata.iframe === undefined) metadata.iframe = video.iframe;

  const contentMeta = { ...(metadata.contentMetadata ?? {}) };
  ['transcript', 'transcriptUrl', 'creator', 'creatorName', 'thumbnailUrl', 'url'].forEach((field) => {
    if (contentMeta[field] === undefined && video[field] !== undefined) {
      contentMeta[field] = video[field];
    }
  });
  metadata.contentMetadata = contentMeta;

  if (!metadata.rawSource) metadata.rawSource = video;

  return metadata;
};

const mapServerVideoToContentItem = (v: any): ContentItem => {
  const metadata = ensureMetadata(v);
  const contentMetadata = metadata.contentMetadata ?? {};
  const duration = resolveDuration(v, metadata);
  const createdAt = coerceDate(v.createdAt ?? metadata.createdAt ?? metadata.recordedAt ?? metadata.addedAt ?? v.addedAt);
  const updatedAt = coerceDate(v.updatedAt ?? metadata.updatedAt ?? metadata.lastUpdated ?? createdAt);
  const thumbnail = resolveThumbnail(v, metadata);
  const bestUrl = resolveVideoUrl(v, metadata);
  const resolvedId =
    v.id ||
    v.videoId ||
    v.assetId ||
    v.documentId ||
    v.externalId ||
    bestUrl ||
    thumbnail ||
    `temp-${Math.random().toString(36).slice(2)}`;
  const tagSet = new Set<string>();
  [v.tags, metadata.tags, metadata.hashtags, metadata.labels, contentMetadata.tags]
    .flat()
    .filter(Boolean)
    .forEach((tag: any) => {
      if (typeof tag === 'string') tagSet.add(tag);
    });

  return {
    id: String(resolvedId),
    title: v.title || v.name || contentMetadata.title || 'Untitled clip',
    description: v.description || v.caption || metadata.caption || contentMetadata.description || '',
    type: 'video',
    platform: normalizePlatform(v.platform || contentMetadata.platform || v.sourcePlatform),
    thumbnail: thumbnail || '',
    url: bestUrl,
    duration,
    tags: Array.from(tagSet),
    creator: resolveCreator(v, metadata),
    created: createdAt,
    updated: updatedAt,
    status: (v.status as ContentItem['status']) || 'published',
    metadata,
  };
};

const extractViewCount = (video: ContentItem) => {
  const metadata = video.metadata ?? {};
  const candidates = [
    (video as any).metadata?.viewCount,
    video.metadata?.viewCount,
    video.metadata?.views,
    video.metadata?.playCount,
    video.metadata?.metrics?.views,
    video.metadata?.metrics?.viewCount,
    video.metadata?.stats?.views,
    video.metadata?.stats?.playCount,
    video.metadata?.insights?.viewCount,
    video.metadata?.insights?.views,
    metadata?.contentMetadata?.viewCount,
    metadata?.analytics?.views,
    metadata?.analytics?.viewCount,
    metadata?.statistics?.views,
    metadata?.statistics?.playCount,
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const numeric = typeof candidate === 'string' ? Number(candidate.replace(/[^\d.]/g, '')) : candidate;
    if (Number.isFinite(numeric) && numeric > 0) return numeric as number;
  }
  return undefined;
};

const formatCompactViews = (video: ContentItem) => {
  const views = extractViewCount(video);
  if (!views) return null;
  return intlCompactFormatter.format(views);
};

const extractMetricNumber = (source: Record<string, any>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = source?.[key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^\d.]/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return undefined;
};

const deriveVideoMetrics = (video: ContentItem) => {
  const metadata = video.metadata ?? {};
  const metricsSources = [metadata.metrics, metadata.statistics, metadata.analytics, metadata.insights, metadata];
  const pickMetric = (...keys: string[]) => {
    for (const source of metricsSources) {
      if (!source) continue;
      const result = extractMetricNumber(source, keys);
      if (result !== undefined) return result;
    }
    return undefined;
  };

  const views = extractViewCount(video);
  const likes = pickMetric('likes', 'likeCount', 'hearts', 'heartCount');
  const comments = pickMetric('comments', 'commentCount', 'commentsCount');
  const shares = pickMetric('shares', 'shareCount', 'reposts', 'repostCount');

  const metrics: Array<{ label: string; value: string }> = [];
  if (views) metrics.push({ label: 'Views', value: intlCompactFormatter.format(views) });
  if (likes) metrics.push({ label: 'Likes', value: intlCompactFormatter.format(likes) });
  if (comments) metrics.push({ label: 'Comments', value: intlCompactFormatter.format(comments) });
  if (shares) metrics.push({ label: 'Shares', value: intlCompactFormatter.format(shares) });

  return metrics;
};

export const CollectionsRoot: React.FC = () => {
  const navigate = useNavigate();
  const debug = useDebugger('Collections', { level: DEBUG_LEVELS.DEBUG });
  const { beginPageLoad, endPageLoad } = usePageLoad();

  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [isDedupeBusy, setIsDedupeBusy] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [selectedVideo, setSelectedVideo] = useState<ContentItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>(() => (import.meta as any).env?.VITE_DEBUG_USER_ID || localStorage.getItem('userId') || '');

  const [activeModal, setActiveModal] = useState<null | 'add' | 'create'>(null);
  const [addCollectionId, setAddCollectionId] = useState<string>('');
  const [addVideoUrl, setAddVideoUrl] = useState<string>('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');

  const createTitleRef = useRef<HTMLInputElement | null>(null);
  const addUrlRef = useRef<HTMLInputElement | null>(null);

  const adjustCollectionVideoCount = useCallback((collectionId: string | undefined, delta: number) => {
    if (!collectionId || collectionId === 'all-videos' || delta === 0) return;
    setCollections(prev => prev.map(collection =>
      collection.id === collectionId
        ? {
            ...collection,
            videoCount: Math.max(0, (collection.videoCount ?? 0) + delta),
          }
        : collection
    ));

    setSelectedCollection(prev => {
      if (!prev || prev.id !== collectionId) return prev;
      return {
        ...prev,
        videoCount: Math.max(0, (prev.videoCount ?? 0) + delta),
      };
    });
  }, []);

  const safeCloseModal = (busy: boolean) => {
    if (busy) return;
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      try { document.activeElement.blur(); } catch {}
    }
    debug.info('Closing modal', { activeModalBefore: activeModal });
    setActiveModal(null);
  };

  useEffect(() => {
    debug.debug('activeModal changed', { activeModal });
    if (activeModal === 'create') {
      const id = window.setTimeout(() => {
        try { createTitleRef.current?.focus(); } catch {}
      }, 0);
      return () => window.clearTimeout(id);
    }
    if (activeModal === 'add') {
      const id = window.setTimeout(() => {
        try { addUrlRef.current?.focus(); } catch {}
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activeModal, debug]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) {
        setUserId(u.uid);
        localStorage.setItem('userId', u.uid);
      }
    });
    return () => unsub();
  }, []);

  const favoriteNames = ['Summer Content', 'Brand Guidelines', 'Viral Hooks'];

  const favoriteCollections = useMemo(() => {
    if (!collections || collections.length === 0) return [] as Collection[];
    const byName = new Map(collections.map(c => [c.name, c] as const));
    const list = favoriteNames
      .map(name => byName.get(name))
      .filter((c): c is Collection => Boolean(c));
    return list.length > 0 ? list : collections.slice(0, Math.min(3, collections.length));
  }, [collections]);

  const handleCreateCollection = () => {
    if (!userId) {
      alert('Please sign in to create a collection.');
      return;
    }
    if (activeModal === 'create') return;
    debug.logFunctionCall('handleCreateCollection');
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      try { document.activeElement.blur(); } catch {}
    }
    setCreateTitle('');
    setCreateDescription('');
    setCreateError('');
    setActiveModal('create');
  };

  const handleImportVideos = () => {
    if (!userId) {
      alert('Please sign in to import videos.');
      return;
    }
    if (activeModal === 'add') return;
    debug.logFunctionCall('handleImportVideos', [], { view, selectedCollectionId: selectedCollection?.id });
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      try { document.activeElement.blur(); } catch {}
    }
    const preselect = selectedCollection?.id || collections[0]?.id || '';
    setAddCollectionId(preselect);
    setAddVideoUrl('');
    setAddError('');
    setActiveModal('add');
  };

  const handleConfirmAddVideo = async () => {
    try {
      setAddError('');
      if (!userId) {
        setAddError('You must be signed in.');
        return;
      }
      if (!addCollectionId) {
        setAddError('Please select a collection.');
        return;
      }
      if (!addVideoUrl || !/^https?:\/\//i.test(addVideoUrl)) {
        setAddError('Please provide a valid video URL.');
        return;
      }
      setAddBusy(true);
      const platform = addVideoUrl.includes('tiktok') ? 'tiktok' : addVideoUrl.includes('instagram') ? 'instagram' : 'unknown';
      const addedAt = new Date().toISOString();
      const resp = await RbacClient.addVideoToCollection(String(userId), addCollectionId, { originalUrl: addVideoUrl, platform, addedAt });
      if (!resp?.success) {
        setAddError(resp?.error || 'Failed to import video');
        setAddBusy(false);
        return;
      }

      if (view === 'detail' && selectedCollection && selectedCollection.id === addCollectionId) {
        try {
          const v = await RbacClient.getCollectionVideos(String(userId), addCollectionId, 50);
          if (v?.success) setVideos((v.videos || []).map(mapServerVideoToContentItem));
        } catch {}
      }
      try {
        const c = await RbacClient.getCollections(String(userId));
        if (c?.success) setCollections((c.collections || []).map(mapServerCollectionToUi));
      } catch {}

      setActiveModal(null);
      debug.info('Video added to collection', { addCollectionId, addVideoUrl, platform });
      setAddBusy(false);
    } catch (e: any) {
      console.error('Add video error', e);
      setAddError(e?.message || 'Import failed');
      setAddBusy(false);
    }
  };

  const handleViewCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setView('detail');
  };

  const handleEditCollection = (collection: Collection) => {
    console.log('Edit collection:', collection.id);
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedCollection(null);
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video: ContentItem) => {
    setSelectedVideos(prev =>
      prev.includes(video.id)
        ? prev.filter(id => id !== video.id)
        : [...prev, video.id]
    );
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleVideoPlay = (video: ContentItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDeleteVideo = async (video: ContentItem) => {
    if (!userId) {
      alert('Please sign in to manage videos.');
      return;
    }
    if (!window.confirm('Remove this video from the collection?')) return;

    try {
      setDeletingVideoId(video.id);
      await RbacClient.deleteVideo(String(userId), video.id);
      setVideos(prev => prev.filter(v => v.id !== video.id));
      setSelectedVideos(prev => prev.filter(id => id !== video.id));
      adjustCollectionVideoCount(selectedCollection?.id, -1);
      if (selectedVideo?.id === video.id) {
        setSelectedVideo(null);
        setIsVideoModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete video', error);
      alert('Failed to delete video.');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!userId) {
      alert('Please sign in to manage videos.');
      return;
    }
    if (videos.length === 0) {
      alert('No videos available to deduplicate.');
      return;
    }

    const buckets = new Map<string, ContentItem[]>();
    videos.forEach((video) => {
      const key = (
        video.metadata?.originalUrl ||
        video.metadata?.contentMetadata?.sourceUrl ||
        video.url ||
        ''
      ).trim().toLowerCase();
      if (!key) return;
      const group = buckets.get(key) || [];
      group.push(video);
      buckets.set(key, group);
    });

    const duplicates: ContentItem[] = [];
    buckets.forEach((group) => {
      if (group.length <= 1) return;
      const sorted = [...group].sort((a, b) => b.created.getTime() - a.created.getTime());
      duplicates.push(...sorted.slice(1));
    });

    if (duplicates.length === 0) {
      alert('No duplicate videos found.');
      return;
    }

    if (!window.confirm(`Remove ${duplicates.length} duplicate video${duplicates.length === 1 ? '' : 's'}?`)) return;

    setIsDedupeBusy(true);
    const failed: string[] = [];
    const deletedIds = new Set<string>();

    for (const duplicate of duplicates) {
      try {
        await RbacClient.deleteVideo(String(userId), duplicate.id);
        deletedIds.add(duplicate.id);
      } catch (error) {
        console.error('Failed to delete duplicate video', error);
        failed.push(duplicate.title || duplicate.id);
      }
    }

    if (deletedIds.size > 0) {
      setVideos(prev => prev.filter(video => !deletedIds.has(video.id)));
      setSelectedVideos(prev => prev.filter(id => !deletedIds.has(id)));
      adjustCollectionVideoCount(selectedCollection?.id, -deletedIds.size);

      if (selectedVideo && deletedIds.has(selectedVideo.id)) {
        setSelectedVideo(null);
        setIsVideoModalOpen(false);
      }
    }

    setIsDedupeBusy(false);

    if (failed.length > 0) {
      alert(`Couldn't remove ${failed.length} duplicate${failed.length === 1 ? '' : 's'}: ${failed.join(', ')}`);
    } else {
      alert(`Removed ${deletedIds.size} duplicate video${deletedIds.size === 1 ? '' : 's'}.`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadCollections() {
      if (!userId) return;
      try {
        beginPageLoad();
        const resp = await RbacClient.getCollections(String(userId));
        if (!cancelled && resp?.success) {
          setCollections((resp.collections || []).map(mapServerCollectionToUi));
        }
      } catch (e) {
        console.warn('Failed to fetch collections', e);
      } finally {
        endPageLoad();
      }
    }
    loadCollections();
    return () => { cancelled = true; };
  }, [userId, beginPageLoad, endPageLoad]);

  useEffect(() => {
    let cancelled = false;
    async function loadVideos() {
      if (!userId || !selectedCollection) return;
      try {
        beginPageLoad();
        const resp = await RbacClient.getCollectionVideos(String(userId), selectedCollection.id, 50);
        if (!cancelled && resp?.success) {
          setVideos((resp.videos || []).map(mapServerVideoToContentItem));
        }
      } catch (e) {
        console.warn('Failed to fetch videos', e);
      } finally {
        endPageLoad();
      }
    }
    if (view === 'detail' && selectedCollection) {
      loadVideos();
    }
    return () => { cancelled = true; };
  }, [userId, view, selectedCollection, beginPageLoad, endPageLoad]);
  useEffect(() => {
    setPlatformFilter('all');
  }, [view, selectedCollection?.id]);

  const filteredCollections = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const matches = collections.filter(collection => {
      if (!query) return true;
      const name = collection.name.toLowerCase();
      const description = collection.description?.toLowerCase() ?? '';
      return name.includes(query) || description.includes(query);
    });

    return [...matches].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (b.videoCount ?? 0) - (a.videoCount ?? 0);
        case 'recent':
        default:
          return b.updated.getTime() - a.updated.getTime();
      }
    });
  }, [collections, searchQuery, sortBy]);

  const filteredVideos = useMemo(() => {
    let result = videos;
    if (platformFilter !== 'all') {
      result = result.filter(video => (video.platform || '').toLowerCase() === platformFilter);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(video => {
        const title = video.title.toLowerCase();
        const description = (video.description || '').toLowerCase();
        const creator = (video.creator || '').toLowerCase();
        const tags = video.tags.join(' ').toLowerCase();
        return [title, description, creator, tags].some(text => text.includes(query));
      });
    }
    return result;
  }, [videos, platformFilter, searchQuery]);

  useEffect(() => {
    if (!selectedVideo) return;
    if (!filteredVideos.some(video => video.id === selectedVideo.id)) {
      setIsVideoModalOpen(false);
      setSelectedVideo(null);
    }
  }, [filteredVideos, selectedVideo]);

  const handleNavigateVideo = (direction: 'prev' | 'next') => {
    if (!selectedVideo) return;
    if (filteredVideos.length === 0) return;
    const currentIndex = filteredVideos.findIndex(v => v.id === selectedVideo.id);
    if (currentIndex === -1) return;
    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredVideos.length - 1;
    } else {
      newIndex = currentIndex < filteredVideos.length - 1 ? currentIndex + 1 : 0;
    }
    setSelectedVideo(filteredVideos[newIndex]);
  };

  const modals = (
    <>
      <BasicModal
        open={activeModal === 'create'}
        title="Create Collection"
        onClose={() => safeCloseModal(createBusy)}
        footer={
          <>
            <GcDashButton variant="ghost" onClick={() => safeCloseModal(createBusy)} disabled={createBusy}>
              Cancel
            </GcDashButton>
            <GcDashButton
              onClick={async () => {
                try {
                  setCreateError('');
                  if (!createTitle.trim()) { setCreateError('Title is required'); return; }
                  if (createTitle.trim().length > 80) { setCreateError('Title must be 80 characters or less'); return; }
                  if (createDescription.trim().length > 500) { setCreateError('Description must be 500 characters or less'); return; }
                  setCreateBusy(true);
                  const resp = await RbacClient.createCollection(String(userId), createTitle.trim(), createDescription.trim());
                  if (!resp?.success) {
                    setCreateError(resp?.error || 'Failed to create collection');
                    setCreateBusy(false);
                    return;
                  }
                  try {
                    const c = await RbacClient.getCollections(String(userId));
                    if (c?.success) setCollections((c.collections || []).map(mapServerCollectionToUi));
                  } catch {}
                  safeCloseModal(false);
                  setCreateBusy(false);
                } catch (e: any) {
                  console.error('Create collection error', e);
                  setCreateError(e?.message || 'Failed to create collection');
                  setCreateBusy(false);
                }
              }}
              isLoading={createBusy}
            >
              Create
            </GcDashButton>
          </>
        }
      >
        <div css={modalBodyStyles}>
          <div className="form-row">
            <label htmlFor="create-collection-title">Title</label>
            <GcDashInput
              id="create-collection-title"
              placeholder="Collection title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              disabled={createBusy}
              maxLength={80}
              ref={createTitleRef as any}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-row">
            <label htmlFor="create-collection-description">Description</label>
            <GcDashTextArea
              id="create-collection-description"
              placeholder="Optional description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              disabled={createBusy}
              maxLength={500}
              resize="vertical"
            />
            {createError && <div className="error">{createError}</div>}
          </div>
        </div>
      </BasicModal>

      <BasicModal
        open={activeModal === 'add'}
        title="Add Video to Collection"
        onClose={() => safeCloseModal(addBusy)}
        footer={
          <>
            <GcDashButton variant="ghost" onClick={() => safeCloseModal(addBusy)} disabled={addBusy}>
              Cancel
            </GcDashButton>
            <GcDashButton onClick={handleConfirmAddVideo} isLoading={addBusy}>
              Add
            </GcDashButton>
          </>
        }
      >
        <div css={modalBodyStyles}>
          <div className="form-row">
            <label htmlFor="add-collection-select">Collection</label>
            <select
              id="add-collection-select"
              value={addCollectionId}
              onChange={(e) => setAddCollectionId(e.target.value)}
              disabled={addBusy}
              css={css`
                width: 100%;
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(9, 30, 66, 0.18);
                font-size: 15px;
              `}
            >
              <option value="">Select a collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="add-video-url">Video URL</label>
            <GcDashInput
              id="add-video-url"
              placeholder="https://..."
              value={addVideoUrl}
              onChange={(e) => setAddVideoUrl(e.target.value)}
              disabled={addBusy}
              ref={addUrlRef as any}
              style={{ width: '100%' }}
            />
            {addError && <div className="error">{addError}</div>}
            <div className="helper">Paste a TikTok or Instagram link.</div>
          </div>
        </div>
      </BasicModal>
    </>
  );

  const totalVideoCount = useMemo(
    () => collections.reduce((sum, collection) => sum + (collection.videoCount ?? 0), 0),
    [collections]
  );

  const headerInfo = view === 'detail' && selectedCollection
    ? `${selectedCollection.videoCount ?? 0} videos · Updated ${formatRelativeTime(selectedCollection.updated)}`
    : `${filteredCollections.length} collections · ${totalVideoCount} videos`;

  const renderCollectionCard = (
    collection: Collection,
    variant: CollectionCardVariant = 'default',
  ) => {
    const isPinned = variant === 'pinnedBorder' || variant === 'pinnedBorderless';
    const metaColorStyles = defaultMetaColorStyles;
    const cardStyles: Array<ReturnType<typeof css>> = [];
    if (isPinned) {
      cardStyles.push(pinnedCardBaseStyles, pinnedCardDimensionsStyles);
      if (variant === 'pinnedBorder') {
        cardStyles.push(pinnedCardBorderStyles);
      } else if (variant === 'pinnedBorderless') {
        cardStyles.push(pinnedCardBorderlessStyles);
      }
    }

    return (
      <GcDashCard
        key={collection.id}
        interactive
        onClick={() => handleViewCollection(collection)}
        css={cardStyles.length > 0 ? cardStyles : undefined}
      >
        <GcDashCardBody css={isPinned ? pinnedCardBodyCompactStyles : css`gap: 14px;`}>
          {isPinned ? (
            <>
              <div css={pinnedHeaderStyles}>
                <StarFilledIcon label="Pinned collection" size="small" />
                <GcDashCardTitle css={pinnedTitleStyles}>{collection.name}</GcDashCardTitle>
              </div>
              <GcDashCardSubtitle css={pinnedDescriptionStyles}>
                {collection.description || 'Curated set of clips ready to repurpose.'}
              </GcDashCardSubtitle>
            </>
          ) : (
            <>
              <div css={css`
                display: grid;
                gap: 8px;
              `}>
                <GcDashCardTitle>{collection.name}</GcDashCardTitle>
                <GcDashCardSubtitle
                  css={css`
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  `}
                >
                  {collection.description || 'Curated set of clips ready to repurpose.'}
                </GcDashCardSubtitle>
              </div>
              <div css={[css`
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                font-size: 13px;
              `, metaColorStyles]}
              >
                <span>{collection.videoCount ?? 0} video{(collection.videoCount ?? 0) === 1 ? '' : 's'}</span>
              </div>
              <div css={css`
                display: inline-flex;
                gap: 8px;
                flex-wrap: wrap;
              `}>
                {(collection.tags ?? []).slice(0, 2).map((tag) => (
                  <GcDashLabel
                    key={tag}
                    variant="soft"
                    tone="neutral"
                    uppercase={false}
                  >
                    {tag}
                  </GcDashLabel>
                ))}
                {(collection.tags?.length ?? 0) > 2 && (
                  <GcDashLabel variant="soft" tone="primary" uppercase={false}>
                    +{(collection.tags?.length ?? 0) - 2} more
                  </GcDashLabel>
                )}
              </div>
            </>
          )}
        </GcDashCardBody>
      </GcDashCard>
    );
  };

  const gridContent = (
    <div css={css`display: flex; flex-direction: column; gap: 32px;`}>
      <GcDashCard>
        <GcDashCardBody css={css`gap: 16px;`}>
          <GcDashCardTitle>Quick actions</GcDashCardTitle>
          <div css={css`display: flex; flex-wrap: wrap; gap: 12px;`}>
            <GcDashButton
              leadingIcon={<AddIcon label="" />}
              onClick={handleCreateCollection}
              aria-haspopup="dialog"
              aria-expanded={activeModal === 'create'}
            >
              Create collection
            </GcDashButton>
            <GcDashButton
              variant="secondary"
              leadingIcon={<AddIcon label="" />}
              onClick={handleImportVideos}
              aria-haspopup="dialog"
              aria-expanded={activeModal === 'add'}
            >
              Add video from URL
            </GcDashButton>
            <GcDashButton
              variant="ghost"
              leadingIcon={<RefreshIcon label="" />}
              onClick={handleRemoveDuplicates}
              disabled={isDedupeBusy}
              isLoading={isDedupeBusy}
            >
              Remove duplicates
            </GcDashButton>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      {favoriteCollections.length > 0 && (
        <section css={css`display: grid; gap: 16px;`}>
          <h2 css={sectionTitleStyles}>Pinned collections</h2>
          <div css={pinnedCollectionsRowStyles}>
            {favoriteCollections.map((collection) =>
              renderCollectionCard(collection, PINNED_CARD_VARIANT)
            )}
          </div>
        </section>
      )}

      <section css={css`display: grid; gap: 16px;`}>
        <div css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        `}>
          <h2 css={sectionTitleStyles}>All collections</h2>
          <div css={css`
            display: inline-flex;
            gap: 8px;
            align-items: center;
            font-size: 13px;
            color: rgba(9, 30, 66, 0.65);
          `}>
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              css={css`
                padding: 8px 12px;
                border-radius: 12px;
                border: 1px solid rgba(9, 30, 66, 0.18);
                font-size: 14px;
                background: #fff;
              `}
            >
              <option value="recent">Recently updated</option>
              <option value="name">Alphabetical</option>
              <option value="size">Largest first</option>
            </select>
          </div>
        </div>
        {filteredCollections.length === 0 ? (
          <GcDashBlankSlate
            description={collections.length === 0 ? 'You have not created any collections yet.' : 'No collections match your search right now.'}
            primaryAction={
              <GcDashButton leadingIcon={<AddIcon label="" />} onClick={handleCreateCollection}>
                Create your first collection
              </GcDashButton>
            }
          />
        ) : (
          <div css={collectionsGridStyles}>
            {filteredCollections.map((collection) =>
              renderCollectionCard(collection)
            )}
            <GcDashCard interactive onClick={handleCreateCollection}>
              <GcDashCardBody css={css`gap: 12px; text-align: center; align-items: center;`}>
                <GcDashCardTitle>Create new collection</GcDashCardTitle>
                <GcDashCardSubtitle>
                  Group related clips, keep launch assets in sync, or curate inspiration for the team.
                </GcDashCardSubtitle>
                <GcDashButton leadingIcon={<AddIcon label="" />} variant="secondary">
                  Start a collection
                </GcDashButton>
              </GcDashCardBody>
            </GcDashCard>
          </div>
        )}
      </section>
    </div>
  );

  const detailContent = selectedCollection && (
    <div css={detailLayoutStyles}>
      <div css={css`display: flex; justify-content: flex-start;`}>
        <GcDashButton variant="ghost" onClick={handleBackToGrid}>
          ← Back to collections
        </GcDashButton>
      </div>

      <GcDashCard>
        <GcDashCardBody css={css`gap: 16px;`}>
          <div css={detailHeaderStyles}>
            <div css={detailHeaderMetaStyles}>
              <GcDashCardTitle>{selectedCollection.name}</GcDashCardTitle>
              <GcDashCardSubtitle>
                {selectedCollection.description || 'Curated content ready to remix into your next campaign.'}
              </GcDashCardSubtitle>
              <div css={detailHeaderMetricsStyles}>
                <span>{selectedCollection.videoCount ?? 0} video{(selectedCollection.videoCount ?? 0) === 1 ? '' : 's'}</span>
                <span>•</span>
                <span>Created {selectedCollection.created.toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated {formatRelativeTime(selectedCollection.updated)}</span>
              </div>
            </div>
            <div css={detailHeaderActionsStyles}>
              <GcDashButton
                leadingIcon={<AddIcon label="" />}
                onClick={handleImportVideos}
                aria-haspopup="dialog"
                aria-expanded={activeModal === 'add'}
              >
                Add video
              </GcDashButton>
              <GcDashButton
                variant="secondary"
                leadingIcon={<SettingsIcon label="" />}
                onClick={() => handleEditCollection(selectedCollection)}
              >
                Edit settings
              </GcDashButton>
              <GcDashButton
                variant="ghost"
                leadingIcon={<RefreshIcon label="" />}
                onClick={handleRemoveDuplicates}
                disabled={isDedupeBusy}
                isLoading={isDedupeBusy}
              >
                Remove duplicates
              </GcDashButton>
            </div>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashCard>
        <GcDashCardBody css={css`gap: 20px;`}>
          <div css={css`
            display: flex;
            flex-direction: column;
            gap: 12px;
          `}>
            <div css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
            `}>
              <GcDashCardTitle>Videos</GcDashCardTitle>
              <GcDashLabel tone="primary" variant="soft" uppercase={false}>
                {filteredVideos.length} in view
              </GcDashLabel>
            </div>
            <div css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
            `}>
              <GcDashInput
                placeholder="Search inside this collection"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                leadingIcon={<span aria-hidden>🔍</span>}
                style={{ width: '260px' }}
              />
              <div css={css`display: inline-flex; gap: 8px; flex-wrap: wrap;`}>
                {(['all', 'tiktok', 'instagram'] as const).map((platform) => (
                  <GcDashButton
                    key={platform}
                    variant={platformFilter === platform ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setPlatformFilter(platform)}
                  >
                    {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </GcDashButton>
                ))}
              </div>
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <GcDashBlankSlate
              description={videos.length === 0 ? 'No videos here yet. Add one to start building this collection.' : 'No clips match your filters right now.'}
              primaryAction={
                <GcDashButton leadingIcon={<AddIcon label="" />} onClick={handleImportVideos}>
                  Add a video
                </GcDashButton>
              }
            />
          ) : (
            <div css={videoGridStyles}>
              {filteredVideos.map((video) => {
                const compactViews = formatCompactViews(video);
                const platformLabel = (() => {
                  const platform = (video.platform || '').toLowerCase();
                  if (platform === 'tiktok') return 'TikTok';
                  if (platform === 'instagram') return 'Instagram';
                  if (!platform) return 'Unknown';
                  return platform.charAt(0).toUpperCase() + platform.slice(1);
                })();
                return (
                  <GcDashCard key={video.id} interactive={false} css={videoCardShellStyles}>
                    <GcDashCardBody css={videoCardBodyStyles}>
                      <div
                        css={videoCardInteractiveStyles}
                        role="button"
                        tabIndex={0}
                        aria-label={`Play ${video.title}`}
                        onClick={() => handleVideoPlay(video)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleVideoPlay(video);
                          }
                        }}
                      >
                        <div css={videoCardThumbnailStyles}>
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt="" loading="lazy" />
                          ) : (
                            <div css={videoThumbnailPlaceholderStyles}>Preview unavailable</div>
                          )}
                          <div className="video-overlay" css={videoCardOverlayStyles}>
                            <span className="play-indicator">▶</span>
                          </div>
                          <span css={videoDurationBadgeStyles}>
                            {video.duration ? `${video.duration}s` : 'Short'}
                          </span>
                          <span css={videoPlatformBadgeStyles}>{platformLabel}</span>
                          {compactViews && (
                            <div css={css`
                              position: absolute;
                              left: 8px;
                              bottom: 8px;
                              display: inline-flex;
                              align-items: center;
                              gap: 6px;
                              padding: 4px 10px;
                              border-radius: 999px;
                              background: rgba(9, 30, 66, 0.7);
                              color: #fff;
                              font-size: 12px;
                              font-weight: 600;
                            `}>
                              <span aria-hidden>▶</span>
                              <span>{compactViews}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div css={videoCardInfoStyles}>
                        <GcDashCardTitle css={videoTitleStyles}>{video.title}</GcDashCardTitle>
                        <div css={videoMetaRowStyles}>
                          {video.creator && <span>{video.creator}</span>}
                          {video.creator && <span>•</span>}
                          <span>{formatRelativeTime(video.created)}</span>
                        </div>
                        {(() => {
                          const metrics = deriveVideoMetrics(video);
                          if (metrics.length === 0) return null;
                          return (
                            <div css={videoMetricRowStyles}>
                              {metrics.map((metric) => (
                                <span key={metric.label}>
                                  {metric.label}: <strong>{metric.value}</strong>
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                        {video.tags.length > 0 && (
                          <div css={videoTagRowStyles}>
                            {video.tags.slice(0, 3).map((tag) => (
                              <GcDashLabel key={tag} variant="soft" tone="neutral" uppercase={false}>
                                #{tag}
                              </GcDashLabel>
                            ))}
                            {video.tags.length > 3 && (
                              <GcDashLabel variant="soft" tone="neutral" uppercase={false}>
                                +{video.tags.length - 3}
                              </GcDashLabel>
                            )}
                          </div>
                        )}
                        <div css={videoCardFooterStyles}>
                          <GcDashButton
                            variant="ghost"
                            size="sm"
                            leadingIcon={<SettingsIcon label="" />}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedVideo(video);
                              setIsVideoModalOpen(true);
                            }}
                          >
                            Inspect
                          </GcDashButton>
                          <GcDashButton
                            variant="ghost"
                            size="sm"
                            leadingIcon={<TrashIcon label="" />}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteVideo(video);
                            }}
                            disabled={deletingVideoId === video.id}
                          >
                            Remove
                          </GcDashButton>
                        </div>
                      </div>
                    </GcDashCardBody>
                  </GcDashCard>
                );
              })}
            </div>
          )}
        </GcDashCardBody>
      </GcDashCard>
    </div>
  );

  const handleNextNav = () => navigate('/library');
  const handlePreviousNav = () => navigate('/write-redesign');

  return (
    <div css={pageContainerStyles}>
      {modals}
      <div css={shellStyles}>
        <header css={headerRowStyles}>
          <div css={headerLeftStyles}>
            <GcDashPlanChip planName="Collections" info={headerInfo} highlighted />
            <GcDashNavButtons
              onPrevious={handlePreviousNav}
              onNext={handleNextNav}
            />
          </div>
          <GcDashSearchBar
            placeholder="Search collections and videos"
            submitLabel="Search"
            defaultValue={searchQuery}
            onSubmitSearch={(value) => setSearchQuery(value)}
            css={css`
              flex: 1;
              max-width: 640px;
              margin-left: auto;
            `}
          />
        </header>

        {view === 'detail' && selectedCollection ? detailContent : gridContent}
      </div>

      <VideoModal
        isOpen={isVideoModalOpen}
        video={selectedVideo}
        videos={filteredVideos}
        onClose={() => setIsVideoModalOpen(false)}
        onNavigateVideo={handleNavigateVideo}
      />
    </div>
  );
};

export default CollectionsRoot;
