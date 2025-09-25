import { NextRequest, NextResponse } from 'next/server';
import { ViralContentRepository } from '@/services/viral-content/repository';
import type { ViralPlatform } from '@/services/viral-content/types';
import { getAdminDb } from '@/lib/firebase-admin';

function formatMetric(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(value));
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function matchesSearch(value: string, query: string): boolean {
  if (!query) return true;
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const platform = (searchParams.get('platform') ?? 'all') as ViralPlatform | 'all';
  const page = Math.max(0, Number.parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(60, Math.max(10, Number.parseInt(searchParams.get('pageSize') ?? '24', 10) || 24));
  const searchQuery = searchParams.get('search')?.trim() ?? '';

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ success: false, error: 'Firestore not configured' }, { status: 500 });
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
        normalizeString(item.title),
        normalizeString(item.description),
        normalizeString(item.creatorName),
      ].join(' ').toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    const total = filtered.length;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    const items = pageItems.map((video) => {
      const thumbnail = video.thumbnail?.bunny ?? video.thumbnail?.original ?? video.thumbnailUrl ?? '';
      const isNewToday = video.firstSeenDate >= today;

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

    return NextResponse.json({
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
    console.error('[viral-content][feed] unexpected error', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
