import { NextRequest, NextResponse } from 'next/server';

import { ViralContentSyncService } from '@/services/viral-content/sync-service';
import type { ViralPlatform } from '@/services/viral-content/types';

function authorize(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || (process.env.NODE_ENV ?? 'development') !== 'production') return true;

  const provided = request.headers.get('x-internal-secret') ?? request.headers.get('authorization');
  if (!provided) return false;

  const normalized = provided.replace(/^Bearer\s+/i, '');
  return normalized === secret;
}

function normalizePlatform(value: unknown): ViralPlatform | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase().trim();
  if (normalized === 'youtube' || normalized === 'instagram' || normalized === 'tiktok') {
    return normalized;
  }
  return null;
}

function parseInstagramCode(input: string): string | null {
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

function formatMetric(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(value));
}

function inferVideoLength(platform: ViralPlatform): 'short' | 'long' {
  return platform === 'youtube' ? 'long' : 'short';
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { platform?: unknown; shortcode?: unknown; videoUrl?: unknown };

    const platform = normalizePlatform(payload.platform ?? 'instagram');
    const shortcode = typeof payload.shortcode === 'string' ? payload.shortcode.trim() : '';
    const videoUrlInput = typeof payload.videoUrl === 'string' ? payload.videoUrl.trim() : '';

    if (platform !== 'instagram') {
      return NextResponse.json({ success: false, error: 'Only Instagram shortcodes are supported right now' }, { status: 400 });
    }

    const effectiveShortcode = shortcode || parseInstagramCode(videoUrlInput);
    if (!effectiveShortcode) {
      return NextResponse.json(
        {
          success: false,
          error: 'shortcode is required',
        },
        { status: 400 },
      );
    }

    const syncService = new ViralContentSyncService();
    const videoUrl = `https://www.instagram.com/p/${effectiveShortcode.replace(/\//g, '')}/`;
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

    return NextResponse.json({ success: true, video, record, isNew });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add video from URL';
    console.error('[viral-content][admin-video] unexpected error', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
