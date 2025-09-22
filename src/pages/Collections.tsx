import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { CollectionCard } from '../components/collections/CollectionCard';
import { VideoGrid } from '../components/collections/VideoGrid';
import { VideoModal } from '../components/collections/VideoModal';
import type { Collection, ContentItem } from '../types';
import RbacClient from '../core/auth/rbac-client';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import BasicModal from '../components/ui/BasicModal';

// Atlassian Design System Icons
import SearchIcon from '@atlaskit/icon/glyph/search';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import AddIcon from '@atlaskit/icon/glyph/add';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import ChartIcon from '@atlaskit/icon/glyph/graph-line';
import MobileIcon from '@atlaskit/icon/glyph/mobile';
import ImageIcon from '@atlaskit/icon/glyph/image';
import VideoIcon from '@atlaskit/icon/glyph/vid-play';
import CalendarIcon from '@atlaskit/icon/glyph/calendar';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import NatureIcon from '@atlaskit/icon/glyph/emoji/nature';
import TrashIcon from '@atlaskit/icon/glyph/trash';
import { useDebugger, DEBUG_LEVELS } from '../utils/debugger';
import { usePageLoad } from '../contexts/PageLoadContext';

const collectionsStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
`;

// Modal content styles (Perplexity spacing + labels)
const modalBodyStyles = css`
  display: grid;
  gap: var(--space-4); /* 16px between rows */
  padding-top: var(--space-2);

  .form-row {
    display: flex;
    flex-direction: column;
  }

  .form-label {
    display: block;
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
    margin-bottom: var(--space-2);
  }

  .helper {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-600);
    margin-top: var(--space-1);
  }

  .error {
    color: var(--color-error-500);
    margin-top: var(--space-1);
    font-size: var(--font-size-caption);
  }
`;

const headerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }
  
  .header-content {
    flex: 1;

    .header-title-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .create-icon-button {
      padding: 0;
      width: 40px;
      min-width: 40px;
      height: 40px;

      .button-content {
        gap: 0;
      }

      .button-text {
        display: none;
      }
    }
    
    h1 {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }
    
    .subtitle {
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }
`;

const filtersStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .search-container {
    flex: 1;
    max-width: 400px;
    
    @media (max-width: 768px) {
      max-width: none;
    }
  }

  .action-buttons {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    justify-content: flex-end;

    @media (max-width: 768px) {
      justify-content: flex-start;
    }
  }
  
  .sort-container {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    
    label {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-700);
      white-space: nowrap;
    }
  }
`;

const favoritesStyles = css`
  margin-bottom: var(--space-8);
  
  .favorites-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    
    h2 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
    
    .favorites-icon {
      font-size: 20px;
    }
  }
  
  .favorites-grid {
    display: flex;
    gap: var(--space-4);
    overflow-x: auto;
    padding-bottom: var(--space-2);
    
    .favorite-item {
      position: relative;
      min-width: 200px;
      padding: var(--space-3) var(--space-4);
      /* Perplexity Flat Design - Minimal favorites */
      background: transparent;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-medium);
      cursor: pointer;
      transition: var(--transition-all);
      display: flex;
      flex-direction: column;
      align-items: flex-start; /* Ensure title aligns to top-left */
      z-index: 0;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: transparent;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease, background-color 0.2s ease;
      }

      &:hover {
        border-color: var(--card-hover-border);
      }

      &:hover::after {
        background: var(--card-hover-overlay);
        opacity: 1;
      }

      &:focus-visible {
        outline: none;
        border-color: var(--card-focus-border);
        box-shadow: var(--card-focus-shadow);
      }

      &:focus-visible::after {
        background: var(--card-focus-overlay);
        opacity: 1;
      }

      .favorite-name {
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0; /* Shift title up with tighter spacing */
      }

      .favorite-count {
        font-size: var(--font-size-caption);
        color: var(--color-text-secondary);
        margin: 0;
      }
    }
  }

  .favorites-empty {
    border: 1px dashed var(--color-neutral-200);
    border-radius: var(--radius-medium);
    padding: var(--space-4);
    color: var(--color-neutral-600);
    font-size: var(--font-size-body);
  }

  .remove-favorite {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-neutral-500);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-neutral-700);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
  }
`;

const collectionsGridStyles = css`
  .collections-header {
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
    
    .collections-count {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
    }
  }
  
  .collections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
`;

const newCollectionCardStyles = css`
  border: 2px dashed var(--color-neutral-300);
  background: transparent;  /* Perplexity flat design */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  cursor: pointer;
  transition: var(--transition-all);

  /* Perplexity Flat Design - Minimal hover */
  &:hover {
    border-color: var(--card-hover-border);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--card-focus-border);
    box-shadow: var(--card-focus-shadow);
  }
  
  .new-icon {
    font-size: 48px;
    margin-bottom: var(--space-4);
    opacity: 0.6;
  }
  
  .new-title {
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
  }
  
  .new-description {
    font-size: var(--font-size-body-small);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
`;

const detailViewStyles = css`
  .detail-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    
    .back-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .collection-title {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
  
  .collection-info-bar {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
  
  .video-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-3);
    }
    
    .video-search {
      flex: 1;
      max-width: 400px;
    }
    
    .video-filters {
      display: flex;
      gap: var(--space-2);
    }
  }
`;

// Mock data
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Summer Vibes Collection',
    description: 'Bright, energetic content perfect for summer campaigns and seasonal posts',
    thumbnail: '',
    tags: ['summer', 'lifestyle', 'bright'],
    platforms: ['tiktok', 'instagram'],
    videoCount: 23,
    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  },
  {
    id: '2',
    name: 'Product Launch',
    description: 'Professional videos showcasing our latest product features and benefits',
    thumbnail: '',
    tags: ['product', 'professional', 'launch'],
    platforms: ['youtube'],
    videoCount: 15,
    created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  },
  {
    id: '3',
    name: 'Tutorial Series',
    description: 'Step-by-step educational content for our community',
    thumbnail: '',
    tags: ['education', 'tutorial', 'community'],
    platforms: ['youtube', 'tiktok'],
    videoCount: 8,
    created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  }
];

const mockVideos: ContentItem[] = [
  {
    id: '1',
    title: 'Beach Day Transformation',
    description: 'Quick summer makeup look perfect for beach days',
    type: 'video',
    platform: 'tiktok',
    thumbnail: '',
    duration: 15,
    tags: ['makeup', 'summer', 'beach'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'published',
    metadata: {}
  },
  {
    id: '2',
    title: 'Summer Skincare Routine',
    description: 'Essential skincare steps for hot weather',
    type: 'video',
    platform: 'instagram',
    thumbnail: '',
    duration: 23,
    tags: ['skincare', 'routine', 'summer'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'published',
    metadata: {}
  }
];

const DEFAULT_COLLECTION_DESCRIPTION =
  'Curated short‑form video set for planning and performance review. Add clips from TikTok or Instagram, compare hooks and visuals, track results, and repurpose the best ideas into new posts.';

const mapServerCollectionToUi = (c: any): Collection => {
  const hasDesc = typeof c.description === 'string' && c.description.trim().length > 0;
  return {
    id: String(c.id),
    name: c.title || 'Untitled',
    description: hasDesc ? c.description : DEFAULT_COLLECTION_DESCRIPTION,
    thumbnail: '',
    tags: [],
    platforms: [],
    videoCount: typeof c.videoCount === 'number' ? c.videoCount : 0,
    created: c.createdAt ? new Date(c.createdAt) : new Date(),
    updated: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    isPrivate: false,
    previewVideos: [],
  };
};

const coerceDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try { return value.toDate(); } catch {}
    }
    if (typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1_000_000);
    }
  }
  return new Date();
};

const normalizePlatform = (platform?: string): ContentItem['platform'] => {
  const normalized = (platform || '').toLowerCase();
  switch (normalized) {
    case 'tiktok':
    case 'tik_tok':
      return 'tiktok';
    case 'instagram':
    case 'ig':
      return 'instagram';
    case 'youtube':
    case 'yt':
      return 'youtube';
    case 'twitter':
    case 'x':
      return 'twitter';
    case 'linkedin':
      return 'linkedin';
    case 'facebook':
      return 'facebook';
    default:
      return 'other';
  }
};

const toStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeScriptComponents = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, content]) => ({
        id: key,
        type: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        content: String(content ?? ''),
      }))
      .filter((component) => component.content);
  }
  return [];
};

const mapServerVideoToContentItem = (v: any): ContentItem => {
  const metrics = v.metrics || v.insights || v.metadata?.metrics || {};
  const contentMetadata = v.contentMetadata || v.metadata?.contentMetadata || {};
  const transcript = v.transcript || v.metadata?.transcript || contentMetadata?.transcript;
  const scriptComponents = normalizeScriptComponents(
    v.components || v.metadata?.scriptComponents || v.metadata?.components,
  );

  const tagSet = new Set<string>();
  const pushTags = (items: string[]) => {
    items.forEach((tag) => {
      const cleaned = tag.replace(/^#/, '').trim();
      if (cleaned) tagSet.add(cleaned);
    });
  };
  pushTags(toStringArray(v.hashtags));
  pushTags(toStringArray(contentMetadata?.hashtags));
  pushTags(toStringArray(v.tags));

  const thumbnail =
    v.thumbnailUrl ||
    v.thumbnail ||
    v.previewUrl ||
    v.cover ||
    v.image ||
    contentMetadata?.thumbnailUrl ||
    contentMetadata?.thumbnail;

  const bestUrl =
    v.iframeUrl ||
    v.embedUrl ||
    v.streamUrl ||
    v.cdnUrl ||
    v.url ||
    v.originalUrl ||
    contentMetadata?.sourceUrl;

  const createdAt = coerceDate(v.addedAt || v.createdAt || v.created || v.metadata?.createdAt);
  const updatedAt = coerceDate(v.updatedAt || v.metadata?.updatedAt || v.addedAt);

  const duration = typeof v.duration === 'number' ? v.duration : Number(v.duration) || undefined;

  const metadata: Record<string, any> = {};
  const assignIfNumber = (key: string, value: any) => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      metadata[key] = value;
    }
  };

  assignIfNumber('views', metrics.views ?? metrics.viewCount ?? metrics.playCount);
  assignIfNumber('likes', metrics.likes ?? metrics.favoriteCount);
  assignIfNumber('comments', metrics.comments ?? metrics.commentCount);
  assignIfNumber('saves', metrics.saves ?? metrics.saveCount);
  assignIfNumber('shares', metrics.shares ?? metrics.shareCount);

  if (transcript) metadata.transcript = transcript;
  if (scriptComponents.length > 0) metadata.scriptComponents = scriptComponents;
  if (Object.keys(metrics).length > 0) metadata.metrics = metrics;
  if (contentMetadata && Object.keys(contentMetadata).length > 0) {
    metadata.contentMetadata = contentMetadata;
  }
  if (v.analysis) metadata.analysis = v.analysis;
  if (v.transcriptionStatus) metadata.transcriptionStatus = v.transcriptionStatus;
  if (bestUrl) metadata.originalUrl = v.originalUrl || v.url || bestUrl;
  if (thumbnail) metadata.thumbnailUrl = thumbnail;
  if (v.platformId || v.videoId) metadata.platformId = v.platformId || v.videoId;

  const resolvedId =
    v.id ||
    v.videoId ||
    v.assetId ||
    v.documentId ||
    v.originalUrl ||
    v.url ||
    v.iframeUrl ||
    v.embedUrl ||
    thumbnail;

  return {
    id: String(resolvedId ?? `video-${Date.now()}`),
    title: v.title || contentMetadata?.title || 'Video',
    description: v.description || v.caption || contentMetadata?.description || '',
    type: 'video',
    platform: normalizePlatform(v.platform || contentMetadata?.platform || v.sourcePlatform),
    thumbnail: thumbnail || '',
    // Prefer an embeddable iframe URL if provided by backend/CDN; else fall back to original
    url: bestUrl || '',
    duration,
    tags: Array.from(tagSet),
    creator: v.author || v.creator || contentMetadata?.creator || v.metadata?.author || undefined,
    created: createdAt,
    updated: updatedAt,
    status: (v.status as ContentItem['status']) || 'published',
    metadata,
  };
};

export const Collections: React.FC = () => {
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
  const [userId, setUserId] = useState<string>(() => {
    return (import.meta as any).env?.VITE_DEBUG_USER_ID || localStorage.getItem('userId') || '';
  });
  const [hiddenFavoriteIds, setHiddenFavoriteIds] = useState<string[]>([]);

  // Unified modal state to prevent overlap
  const [activeModal, setActiveModal] = useState<null | 'add' | 'create'>(null);
  // Add Video Modal state
  const [addCollectionId, setAddCollectionId] = useState<string>('');
  const [addVideoUrl, setAddVideoUrl] = useState<string>('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState('');

  // Create Collection Modal state
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

  // Move initial focus into the appropriate input when a modal opens
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
  }, [activeModal]);

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
  useEffect(() => {
    if (!collections || collections.length === 0) {
      setHiddenFavoriteIds(prev => (prev.length === 0 ? prev : []));
      return;
    }
    setHiddenFavoriteIds(prev => {
      const cleaned = prev.filter(id => collections.some(collection => collection.id === id));
      return cleaned.length === prev.length ? prev : cleaned;
    });
  }, [collections]);
  const favoriteCollections = useMemo(() => {
    if (!collections || collections.length === 0) return [] as Collection[];
    const byName = new Map(collections.map(c => [c.name, c] as const));
    const list = favoriteNames
      .map(name => byName.get(name))
      .filter((c): c is Collection => Boolean(c));
    const base = list.length > 0 ? list : collections.slice(0, Math.min(3, collections.length));
    return base.filter(collection => !hiddenFavoriteIds.includes(collection.id));
  }, [collections, hiddenFavoriteIds]);

  const handleCreateCollection = () => {
    if (!userId) {
      alert('Please sign in to create a collection.');
      return;
    }
    if (activeModal === 'create') return;
    debug.logFunctionCall('handleCreateCollection');
    // Reset any focused element to avoid aria-hidden warnings during transition
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
    // Reset any focused element to avoid aria-hidden warnings during transition
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      try { document.activeElement.blur(); } catch {}
    }
    // Preselect current collection if in detail view
    const preselect = selectedCollection?.id || collections[0]?.id || '';
    setAddCollectionId(preselect);
    setAddVideoUrl('');
    setAddError('');
    setActiveModal('add');
  };

  const handleRemoveFavorite = (collectionId: string) => {
    setHiddenFavoriteIds(prev => prev.includes(collectionId) ? prev : [...prev, collectionId]);
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

      // Refresh state
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

  const handlePlatformFilterToggle = (platform: 'tiktok' | 'instagram') => {
    setPlatformFilter(prev => (prev === platform ? 'all' : platform));
  };

  const handleDeleteVideo = async (video: ContentItem) => {
    if (!userId) {
      alert('Please sign in to manage videos.');
      return;
    }
    if (!video?.id) return;
    if (deletingVideoId) return;

    const confirmed = window.confirm(`Delete "${video.title}" from this collection? This action cannot be undone.`);
    if (!confirmed) return;

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
      alert('Failed to delete the video. Please try again.');
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

    const confirmed = window.confirm(`Remove ${duplicates.length} duplicate video${duplicates.length === 1 ? '' : 's'}?`);
    if (!confirmed) return;

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

  // Load collections on mount if userId available
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
  }, [userId]);

  // Load videos when entering detail view
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
  }, [view, selectedCollection, userId]);

  useEffect(() => {
    setPlatformFilter('all');
  }, [view, selectedCollection?.id]);

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Render modals once and reuse in both views to avoid unmount flicker
  const modals = (
    <>
      <BasicModal
        open={activeModal === 'create'}
        title="Create Collection"
        onClose={() => safeCloseModal(createBusy)}
        footer={
          <>
            <Button variant="secondary" onClick={() => safeCloseModal(createBusy)} isDisabled={createBusy}>Cancel</Button>
            <Button
              variant="primary"
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
              isDisabled={createBusy}
            >{createBusy ? 'Creating…' : 'Create'}</Button>
          </>
        }
      >
        <div css={modalBodyStyles}>
          <div className="form-row">
            <label className="form-label" htmlFor="create-collection-title">Title</label>
            <Input
              id="create-collection-title"
              placeholder="Collection title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              disabled={createBusy}
              maxLength={80}
              ref={createTitleRef as any}
            />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="create-collection-description">Description</label>
            <Input
              id="create-collection-description"
              placeholder="Optional description"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              disabled={createBusy}
              maxLength={500}
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
            <Button variant="secondary" onClick={() => safeCloseModal(addBusy)} isDisabled={addBusy}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmAddVideo} isDisabled={addBusy}>{addBusy ? 'Adding…' : 'Add'}</Button>
          </>
        }
      >
        <div css={modalBodyStyles}>
          <div className="form-row">
            <label className="form-label" htmlFor="add-collection-select">Collection</label>
            <select
              id="add-collection-select"
              value={addCollectionId}
              onChange={(e) => setAddCollectionId(e.target.value)}
              disabled={addBusy}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-medium)'
              }}
            >
              <option value="">Select a collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="add-video-url">Video URL</label>
            <Input
              id="add-video-url"
              placeholder="https://..."
              value={addVideoUrl}
              onChange={(e) => setAddVideoUrl(e.target.value)}
              disabled={addBusy}
              ref={addUrlRef as any}
            />
            {addError && <div className="error">{addError}</div>}
            <div className="helper">Paste a TikTok or Instagram link.</div>
          </div>
        </div>
      </BasicModal>
    </>
  );

  if (view === 'detail' && selectedCollection) {
    return (
      <div css={collectionsStyles}>
        {modals}
        <div css={detailViewStyles}>
          <div className="detail-header">
            <Button
              variant="subtle"
              onClick={handleBackToGrid}
              className="back-button"
            >
              ← Back to Collections
            </Button>
            <h1 className="collection-title">{selectedCollection.name}</h1>
          </div>

          <div className="collection-info-bar">
            <Card appearance="subtle" spacing="comfortable">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <NatureIcon label="Collection theme" />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {selectedCollection.name}
                    </h2>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
                      {selectedCollection.videoCount} videos · Created {selectedCollection.created.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {selectedCollection.description && (
                  <p style={{ margin: 0, color: 'var(--color-neutral-700)', lineHeight: 'var(--line-height-relaxed)' }}>
                    "{selectedCollection.description}"
                  </p>
                )}
              </div>
            </Card>

            <Card appearance="subtle" spacing="comfortable">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 var(--space-4) 0' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-h5)' }}>Actions</h3>
                <Button
                  variant="subtle"
                  size="small"
                  aria-label="Actions settings"
                  iconBefore={<SettingsIcon label="" />}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Button 
                  variant="soft" 
                  fullWidth
                  onClick={handleImportVideos}
                  aria-haspopup="dialog"
                  aria-expanded={activeModal === 'add'}
                  data-testid="btn-detail-add-videos"
                >
                  + Add Videos
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth
                  iconBefore={<RefreshIcon label="" />}
                >
                  Bulk Actions
                </Button>
              </div>
            </Card>
          </div>

          <div className="video-controls">
            <div className="video-search">
              <Input
                placeholder="Search videos..."
                iconBefore={<SearchIcon label="" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="video-filters">
              <Button
                variant={platformFilter === 'tiktok' ? 'secondary' : 'subtle'}
                size="small"
                onClick={() => handlePlatformFilterToggle('tiktok')}
                aria-pressed={platformFilter === 'tiktok'}
              >
                TikTok
              </Button>
              <Button
                variant={platformFilter === 'instagram' ? 'secondary' : 'subtle'}
                size="small"
                onClick={() => handlePlatformFilterToggle('instagram')}
                aria-pressed={platformFilter === 'instagram'}
              >
                Instagram
              </Button>
              <Button
                variant="subtle"
                size="small"
              >
                Newest
              </Button>
              <Button
                variant="danger"
                size="small"
                iconBefore={<TrashIcon label="" />}
                onClick={handleRemoveDuplicates}
                isDisabled={isDedupeBusy || deletingVideoId !== null || videos.length === 0}
              >
                {isDedupeBusy ? 'Removing…' : 'Remove Duplicates'}
              </Button>
            </div>
          </div>

          <VideoGrid
            videos={filteredVideos}
            onVideoSelect={handleVideoSelect}
            onVideoPlay={handleVideoPlay}
            onVideoDelete={handleDeleteVideo}
            selectedVideos={selectedVideos}
            deletingVideoId={deletingVideoId}
            columns={{ sm: 1, md: 2, lg: 4 }}
          />

          {/* Video Insights Modal */}
          <VideoModal
            isOpen={isVideoModalOpen}
            video={selectedVideo}
            videos={filteredVideos}
            onClose={() => setIsVideoModalOpen(false)}
            onNavigateVideo={handleNavigateVideo}
          />
        </div>
      </div>
    );
  }

  return (
    <div css={collectionsStyles}>
      {modals}
      <div css={headerStyles}>
        <div className="header-content">
          <div className="header-title-row">
            <h1>Collections</h1>
            <Button 
              variant="subtle"
              size="small"
              onClick={handleCreateCollection}
              aria-label="Create Collection"
              aria-haspopup="dialog"
              aria-expanded={activeModal === 'create'}
              data-testid="btn-create-collection"
              className="create-icon-button"
              iconBefore={<AddIcon label="" />}
            />
          </div>
          <p className="subtitle">Organize your video content</p>
        </div>
      </div>

      <div css={filtersStyles}>
        <div className="search-container">
          <Input
            placeholder="Search collections..."
            iconBefore={<SearchIcon label="" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="action-buttons">
          <Button
            variant="primary"
            onClick={handleImportVideos}
            aria-haspopup="dialog"
            aria-expanded={activeModal === 'add'}
            data-testid="btn-add-to-collections"
            iconBefore={<AddIcon label="" />}
          >
            Add to Collections
          </Button>
        </div>
        {/* Removed collections slider per feedback */}
        <div className="sort-container">
          <label htmlFor="sort-select">Sort:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-medium)',
              fontSize: 'var(--font-size-body-small)',
            }}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      <div css={favoritesStyles}>
        <div className="favorites-header">
          <StarFilledIcon label="Favorites" />
          <h2>Favorites</h2>
        </div>
        {favoriteCollections.length === 0 ? (
          <div className="favorites-empty">
            Favorites keep your go-to collections handy. When you mark a collection as a favorite, it will appear here for quick access.
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteCollections.map((fav) => (
              <div
                key={fav.id}
                className="favorite-item"
                role="button"
                tabIndex={0}
                onClick={() => handleViewCollection(fav)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewCollection(fav);
                  }
                }}
                aria-label={`${fav.name} collection with ${fav.videoCount} videos`}
              >
                <button
                  type="button"
                  className="remove-favorite"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRemoveFavorite(fav.id);
                  }}
                  aria-label={`Remove ${fav.name} from favorites`}
                >
                  <CrossIcon label="" size="small" />
                </button>
                <p className="favorite-name">{fav.name}</p>
                <p className="favorite-count">{fav.videoCount} video{fav.videoCount !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div css={collectionsGridStyles}>
        <div className="collections-header">
          <h2>All Collections</h2>
          <span className="collections-count">
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="collections-grid">
          {filteredCollections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onView={handleViewCollection}
              onEdit={handleEditCollection}
            />
          ))}
          <Card
            css={newCollectionCardStyles}
            onClick={handleCreateCollection}
            role="button"
            tabIndex={0}
            aria-label="Create new collection"
            aria-haspopup="dialog"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCreateCollection();
              }
            }}
          >
            <div className="new-icon"><AddIcon label="Create new collection" size="xlarge" /></div>
            <h3 className="new-title">Create New Collection</h3>
            <p className="new-description">
              Create a new collection to organize your video content
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
