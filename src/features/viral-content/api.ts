import type { Platform, ViralMetric, ViralVideo } from './types';

interface FeedResponse {
  success: boolean;
  items: Array<{
    id: string;
    platform: Exclude<Platform, 'all'>;
    creator: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    publishedAt?: string | null;
    firstSeenAt?: string;
    isNewToday?: boolean;
    metrics: {
      views?: string;
      likes?: string;
      comments?: string;
      shares?: string;
    };
  }>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  error?: string;
}

function buildMetrics(items: FeedResponse['items'][number]): ViralMetric[] {
  const metrics: ViralMetric[] = [];
  if (items.metrics.views) metrics.push({ id: 'views', label: 'Views', value: items.metrics.views, tone: 'primary' });
  if (items.metrics.likes) metrics.push({ id: 'likes', label: 'Likes', value: items.metrics.likes });
  if (items.metrics.comments) metrics.push({ id: 'comments', label: 'Comments', value: items.metrics.comments });
  return metrics;
}

function inferVideoLength(platform: Exclude<Platform, 'all'>): 'short' | 'long' {
  if (platform === 'youtube') return 'long';
  return 'short';
}

export async function fetchViralFeed(
  page: number,
  platform: Platform,
  searchQuery: string,
): Promise<{ items: ViralVideo[]; hasMore: boolean }> {
  const params = new URLSearchParams({ page: String(page) });
  if (platform && platform !== 'all') params.set('platform', platform);
  if (searchQuery) params.set('search', searchQuery);

  const response = await fetch(`/api/viral-content/feed?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to load viral feed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as FeedResponse;
  if (!data.success) {
    throw new Error(data.error ?? 'Unknown error loading viral feed');
  }

  const items: ViralVideo[] = data.items.map((item) => ({
    id: item.id,
    platform: item.platform,
    creator: item.creator,
    title: item.title,
    description: item.description ?? '',
    thumbnail: item.thumbnail,
    url: item.url,
    views: item.metrics.views ?? '0',
    publishedAt: item.publishedAt ?? '',
    type: inferVideoLength(item.platform),
    metrics: buildMetrics(item),
    isNew: Boolean(item.isNewToday),
    firstSeenAt: item.firstSeenAt,
  }));

  return { items, hasMore: data.hasMore };
}
