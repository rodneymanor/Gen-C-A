import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import { loadSharedModule } from '../services/shared-service-proxy.js';

const { TRACKED_CREATORS } = loadSharedModule<any>(
  '../../../../src/services/viral-content/config.ts',
);
const { ViralContentRepository } = loadSharedModule<any>(
  '../../../../src/services/viral-content/repository.ts',
);
const { ViralContentSyncService } = loadSharedModule<any>(
  '../../../../src/services/viral-content/sync-service.ts',
);

type ViralPlatform = 'youtube' | 'instagram' | 'tiktok' | 'all';

const router = Router();

function formatMetric(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(value));
}

function normalizePlatform(value: unknown): ViralPlatform | 'all' {
  if (typeof value !== 'string') return 'all';
  const normalized = value.toLowerCase() as ViralPlatform | 'all';
  if (normalized === 'youtube' || normalized === 'instagram' || normalized === 'tiktok' || normalized === 'all') {
    return normalized;
  }
  return 'all';
}

function parseInstagramCodeFromInput(input: string): string | null {
  if (!input) return null;
  const match = input.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match) return match[1];
  const sanitized = input.trim().replace(/\s+/g, '').replace(/\//g, '');
  if (!sanitized) return null;
  if (/^[A-Za-z0-9_-]+$/.test(sanitized)) {
    return sanitized;
  }
  return null;
}

function parseYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const matchQuery = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (matchQuery) return matchQuery[1];
  const matchShort = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/i);
  if (matchShort) return matchShort[1];
  const matchEmbed = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i);
  if (matchEmbed) return matchEmbed[1];
  const matchShorts = trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i);
  if (matchShorts) return matchShorts[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function inferVideoLength(platform: ViralPlatform): 'short' | 'long' {
  return platform === 'youtube' ? 'long' : 'short';
}

router.get('/feed', async (req, res) => {
  const platform = normalizePlatform(req.query.platform ?? 'all');
  const page = Math.max(0, Number.parseInt(String(req.query.page ?? '0'), 10) || 0);
  const pageSize = Math.min(60, Math.max(10, Number.parseInt(String(req.query.pageSize ?? '24'), 10) || 24));
  const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const db = getDb();
  if (!db) {
    return res.status(500).json({ success: false, error: 'Firestore not configured' });
  }

  const repository = new ViralContentRepository({ db });
  const today = new Date().toISOString().slice(0, 10);

  try {
    const newVideos = await repository.listVideos({ platform, includeNewSince: today, limit: 120 });
    const baseLimit = (page + 1) * pageSize + newVideos.length + 40;
    const recentVideos = await repository.listVideos({ platform, limit: baseLimit });

    const newVideoIds = new Set(newVideos.map((video) => video.id));
    const merged = [
      ...newVideos.sort((a, b) => (b.firstSeenAt ?? '').localeCompare(a.firstSeenAt ?? '')),
      ...recentVideos.filter((video) => !newVideoIds.has(video.id)),
    ];

    const filtered = merged.filter((item) => {
      if (!searchQuery) return true;
      const haystack = [
        item.title ?? '',
        item.description ?? '',
        item.creatorName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    const total = filtered.length;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    const items = pageItems.map((video) => {
      const thumbnail = video.thumbnail?.bunny ?? video.thumbnail?.original ?? video.thumbnailUrl ?? '';
      const isNewToday = (video.firstSeenDate ?? '') >= today;

      return {
        id: video.id,
        platform: video.platform,
        creator: video.creatorName,
        title: video.title,
        description: video.description,
        thumbnail,
        url: video.url,
        publishedAt: video.publishedAt ?? null,
        firstSeenAt: video.firstSeenAt,
        metrics: {
          views: formatMetric(video.metrics?.views ?? 0),
          likes: formatMetric(video.metrics?.likes ?? 0),
          comments: formatMetric(video.metrics?.comments ?? 0),
          shares: formatMetric(video.metrics?.shares ?? 0),
        },
        isNewToday,
      };
    });

    return res.json({
      success: true,
      items,
      page,
      pageSize,
      total,
      hasMore: end < total,
      newCount: newVideos.length,
      lastSyncDate: today,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load viral content feed';
    console.error('[backend][viral-content][feed] unexpected error', error);
    return res.status(500).json({ success: false, error: message });
  }
});

router.get('/admin/creators', (_req, res) => {
  const creators = TRACKED_CREATORS.map((creator) => ({
    platform: creator.platform,
    slug: creator.slug,
    displayName: creator.displayName,
    platformId: creator.platformId,
    secondaryId: creator.secondaryId,
  }));

  return res.json({ success: true, creators });
});

function authorize(request: import('express').Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const isDevelopment = (process.env.NODE_ENV ?? 'development') !== 'production';

  if (!secret || isDevelopment) {
    return true;
  }

  const provided = request.headers['x-internal-secret'] ?? request.headers.authorization;
  if (!provided) return false;

  const normalized = Array.isArray(provided)
    ? provided[0]
    : provided.replace(/^Bearer\s+/i, '');
  return normalized === secret;
}

function isTikTokUrl(value: string): boolean {
  return /tiktok\.com\//i.test(value);
}

router.post('/admin/video', async (req, res) => {
  if (!authorize(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const platformValue = req.body?.platform ?? 'instagram';
  const shortcode = typeof req.body?.shortcode === 'string' ? req.body.shortcode.trim() : '';
  const videoUrlBody = typeof req.body?.videoUrl === 'string' ? req.body.videoUrl.trim() : '';

  const platform = normalizePlatform(platformValue);
  if (!platform) {
    return res.status(400).json({ success: false, error: 'Unsupported platform' });
  }

  let videoUrl: string;
  if (platform === 'instagram') {
    const effectiveShortcode = shortcode || parseInstagramCodeFromInput(videoUrlBody);
    if (!effectiveShortcode) {
      return res.status(400).json({ success: false, error: 'shortcode is required' });
    }
    videoUrl = `https://www.instagram.com/p/${effectiveShortcode.replace(/\//g, '')}/`;
  } else if (platform === 'tiktok') {
    if (!videoUrlBody || !isTikTokUrl(videoUrlBody)) {
      return res.status(400).json({ success: false, error: 'Valid TikTok video URL is required' });
    }
    videoUrl = videoUrlBody;
  } else if (platform === 'youtube') {
    const videoId = parseYouTubeVideoId(videoUrlBody);
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'Valid YouTube video URL is required' });
    }
    videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    return res.status(400).json({ success: false, error: 'Only Instagram, TikTok, and YouTube are supported right now' });
  }

  try {
    const syncService = new ViralContentSyncService();
    const { record, isNew } = await syncService.addVideoFromUrl({ platform, videoUrl });

    const thumbnail = record.thumbnail?.bunny ?? record.thumbnail?.original ?? record.thumbnailUrl ?? '';
    const viewsValue = typeof record.metrics?.views === 'number' ? record.metrics.views : undefined;

    const metrics: Array<{ id: string; label: string; value: string; tone?: 'primary' }> = [
      { id: 'views', label: 'Views', value: formatMetric(viewsValue), tone: 'primary' },
    ];

    if (record.metrics?.likes !== undefined) {
      metrics.push({ id: 'likes', label: 'Likes', value: formatMetric(record.metrics.likes) });
    }

    if (record.metrics?.comments !== undefined) {
      metrics.push({ id: 'comments', label: 'Comments', value: formatMetric(record.metrics.comments) });
    }

    if (record.metrics?.shares !== undefined) {
      metrics.push({ id: 'shares', label: 'Shares', value: formatMetric(record.metrics.shares) });
    }

    const video = {
      id: record.id,
      platform: record.platform,
      creator: record.creatorName,
      title: record.title,
      description: record.description,
      thumbnail,
      url: record.url,
      publishedAt: record.publishedAt ?? '',
      firstSeenAt: record.firstSeenAt,
      views: formatMetric(viewsValue),
      type: inferVideoLength(record.platform),
      metrics,
      isNew,
    };

    return res.json({ success: true, video, record, isNew });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add video from URL';
    console.error('[backend][viral-content][admin-video] unexpected error', error);
    return res.status(500).json({ success: false, error: message });
  }
});

export { router as viralContentRouter };
