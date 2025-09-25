import { getInstagramService } from '@/services/video/instagram-service.js';
import { getTikTokFeedService } from '@/services/video/tiktok-feed-service.js';
import type { NormalizedViralVideo, TrackedCreator, ViralPlatform } from './types';

const RAPID_API_HOSTS = {
  youtube: 'youtube-media-downloader.p.rapidapi.com',
  instagram: 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com',
  tiktok: 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
} satisfies Record<ViralPlatform, string>;

function assertRapidApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error('[viral-content] RAPIDAPI_KEY is not configured');
  }
  return key;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[+,]/g, '').trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * (value < 10_000_000_000 ? 1000 : 1)).toISOString();
  }
  return undefined;
}

async function fetchYoutubeVideos(creator: TrackedCreator): Promise<NormalizedViralVideo[]> {
  const rapidApiKey = assertRapidApiKey();
  const params = new URLSearchParams({
    channelId: creator.platformId,
    type: 'videos',
    sortBy: 'newest',
  });

  const url = `https://${RAPID_API_HOSTS.youtube}/v2/channel/videos?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': RAPID_API_HOSTS.youtube,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch YouTube videos for ${creator.slug}: ${response.status} ${text}`);
  }

  const json = await response.json();
  const videos = (json?.videos ?? json?.data?.videos ?? json?.data ?? json?.items ?? []) as any[];

  return videos.slice(0, creator.limit ?? 50).map((item, index) => {
    const videoId = item.videoId ?? item.video_id ?? item.id ?? `youtube_${creator.platformId}_${index}`;
    const thumbnailCandidates = item.thumbnails ?? item.thumbnail ?? item.thumbnailUrls ?? [];
    const firstThumbnail = Array.isArray(thumbnailCandidates)
      ? thumbnailCandidates[0]?.url ?? thumbnailCandidates[0]
      : thumbnailCandidates?.url ?? thumbnailCandidates;
    const publishedAt =
      parseIsoDate(item.publishedTimeText?.timestamp ?? item.publishedAt ?? item.uploadedAt ?? item.date) ??
      parseIsoDate(item.publishedTimestamp ?? item.timestamp);

    return {
      platform: 'youtube' as const,
      creatorSlug: creator.slug,
      creatorName: creator.displayName,
      platformVideoId: String(videoId),
      url: item.url ?? `https://www.youtube.com/watch?v=${videoId}`,
      title: item.title ?? item.videoTitle ?? item.name ?? 'YouTube Video',
      description: item.description ?? item.bio ?? '',
      thumbnailUrl: firstThumbnail ?? '',
      metrics: {
        views: toNumber(item.viewCount ?? item.views ?? item.statistics?.viewCount),
        likes: toNumber(item.likeCount ?? item.likes ?? item.statistics?.likeCount),
        comments: toNumber(item.commentCount ?? item.comments ?? item.statistics?.commentCount),
      },
      publishedAt: publishedAt ?? undefined,
      fetchedAt: new Date().toISOString(),
      raw: item,
    } satisfies NormalizedViralVideo;
  });
}

async function fetchInstagramVideos(creator: TrackedCreator): Promise<NormalizedViralVideo[]> {
  const service = getInstagramService();
  const limit = creator.limit ?? 50;

  const response = (await service.getUserReels({
    userId: creator.platformId,
    username: creator.secondaryId ?? creator.displayName,
    includeFeedVideo: true,
    count: limit,
  })) as { processed?: { videos?: unknown } };

  const processedVideos: any[] = Array.isArray(response?.processed?.videos)
    ? response.processed.videos
    : [];

  return processedVideos.slice(0, limit).map((video: any, index: number) => {
    const videoId = video.id ?? video.code ?? `instagram_${creator.slug}_${index}`;
    return {
      platform: 'instagram' as const,
      creatorSlug: creator.slug,
      creatorName: creator.displayName,
      platformVideoId: String(videoId),
      url: video.permalink ?? video.shareUrl ?? video.videoUrl ?? '',
      title: video.title ?? video.description?.split('\n')[0] ?? 'Instagram Reel',
      description: video.description ?? '',
      thumbnailUrl: video.thumbnailUrl ?? video.thumbnail ?? '',
      metrics: {
        views: toNumber(video.viewCount ?? video.stats?.playCount),
        likes: toNumber(video.likeCount ?? video.stats?.diggCount),
        comments: toNumber(video.stats?.commentCount ?? video.commentCount),
        shares: toNumber(video.stats?.shareCount ?? video.shareCount),
      },
      publishedAt: parseIsoDate(video.timestamp ?? video.createTime ?? video.publishedAt),
      fetchedAt: new Date().toISOString(),
      raw: video,
    } satisfies NormalizedViralVideo;
  });
}

async function fetchTikTokVideos(creator: TrackedCreator): Promise<NormalizedViralVideo[]> {
  const service = getTikTokFeedService();
  const limit = creator.limit ?? 50;
  const result = await service.fetchUserFeed({ username: creator.platformId, count: limit });
  const videos: any[] = Array.isArray(result?.videos) ? result.videos : [];

  return videos.slice(0, limit).map((video: any, index: number) => ({
    platform: 'tiktok' as const,
    creatorSlug: creator.slug,
    creatorName: creator.displayName,
    platformVideoId: String(video.id ?? `tiktok_${creator.slug}_${index}`),
    url: video.shareUrl ?? video.playUrl ?? (video.id ? `https://www.tiktok.com/@${result?.userInfo?.username ?? creator.platformId}/video/${video.id}` : ''),
    title: video.description?.split('\n')[0] ?? 'TikTok Video',
    description: video.description ?? '',
    thumbnailUrl: video.cover ?? video.thumbnailUrl ?? '',
    metrics: {
      views: toNumber(video.stats?.playCount ?? video.playCount),
      likes: toNumber(video.stats?.diggCount ?? video.likeCount),
      comments: toNumber(video.stats?.commentCount ?? video.commentCount),
      shares: toNumber(video.stats?.shareCount ?? video.shareCount),
    },
    publishedAt: parseIsoDate(video.createTime),
    fetchedAt: new Date().toISOString(),
    raw: video,
  } satisfies NormalizedViralVideo));
}

export async function fetchVideosForCreator(creator: TrackedCreator): Promise<NormalizedViralVideo[]> {
  switch (creator.platform) {
    case 'youtube':
      return fetchYoutubeVideos(creator);
    case 'instagram':
      return fetchInstagramVideos(creator);
    case 'tiktok':
      return fetchTikTokVideos(creator);
    default:
      throw new Error(`Unsupported platform ${creator.platform}`);
  }
}
