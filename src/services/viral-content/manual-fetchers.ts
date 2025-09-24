import type { ViralPlatform } from './types';

export interface RapidApiVideoDetails {
  platformVideoId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt?: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
  };
  creator: {
    slug: string;
    displayName: string;
    platformId: string;
    secondaryId?: string;
  };
  raw: Record<string, unknown>;
}

export interface FetchVideoDetailsOptions {
  platform: ViralPlatform;
  videoUrl: string;
}

class RapidApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'RapidApiError';
  }
}

const RAPIDAPI_HOSTS: Record<ViralPlatform, string> = {
  instagram: 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com',
  tiktok: 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
  youtube: 'youtube-media-downloader.p.rapidapi.com',
};

const RAPIDAPI_TIMEOUT_MS = 15000;

function getRapidApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new RapidApiError('[viral-content] RAPIDAPI_KEY is not configured');
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

function parseInstagramCode(input: string): string | null {
  if (!input) return null;
  const match = input.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match) return match[1];
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) return null;
  if (/^https?:/i.test(trimmed)) return null;
  return trimmed.replace(/\//g, '') || null;
}

function parseTikTokVideoId(url: string): string | null {
  const match =
    url.match(/tiktok\.com\/(?:@[^/]+\/video\/|v\/|embed\/|t\/)([0-9]{8,})/i) ||
    url.match(/video\/(\d{8,})/);
  return match ? match[1] ?? match[2] ?? null : null;
}

function parseYouTubeVideoId(url: string): string | null {
  const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  const shortsMatch = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

async function rapidApiFetch(url: string, host: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RAPIDAPI_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': getRapidApiKey(),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new RapidApiError(`RapidAPI request failed: ${response.status} ${text}`, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof RapidApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new RapidApiError('RapidAPI request timed out');
    }
    throw new RapidApiError((error as Error).message || 'RapidAPI request failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYoutubeVideoDetails(videoUrl: string): Promise<RapidApiVideoDetails> {
  const videoId = parseYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new RapidApiError('Unable to extract YouTube video id from the URL provided');
  }

  const host = RAPIDAPI_HOSTS.youtube;
  const query = new URLSearchParams({
    videoId,
    urlAccess: 'normal',
    videos: 'auto',
    audios: 'auto',
  });
  const apiUrl = `https://${host}/v2/video/details?${query.toString()}`;
  const json = await rapidApiFetch(apiUrl, host);
  const data = json?.data ?? json ?? {};

  const thumbnails: Array<{ url?: string }> = data.thumbnails ?? json?.thumbnails ?? [];
  const thumbnailUrl = [...thumbnails].reverse().find((thumb) => Boolean(thumb?.url))?.url;
  if (!thumbnailUrl) {
    throw new RapidApiError('YouTube response did not include a thumbnail image');
  }

  const channel = data.channel ?? json?.channel ?? {};
  const channelId: string = channel.id ?? channel.channelId ?? '';
  const channelName: string = channel.name ?? channel.title ?? 'YouTube Creator';
  const channelHandle: string | undefined = channel.handle ?? channel.username ?? undefined;

  return {
    platformVideoId: data.id ?? json?.id ?? videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: data.title ?? json?.title ?? 'YouTube Video',
    description: data.description ?? json?.description ?? '',
    thumbnailUrl,
    publishedAt: parseIsoDate(data.publishedTime ?? json?.publishedTime),
    metrics: {
      views: toNumber(data.viewCount ?? json?.viewCount),
      likes: toNumber(data.likeCount ?? json?.likeCount),
      comments: toNumber(data.commentCount ?? json?.commentCount),
    },
    creator: {
      slug: `youtube-${(channelId || channelHandle || videoId).toLowerCase()}`,
      displayName: channelName,
      platformId: channelId || videoId,
      secondaryId: channelHandle,
    },
    raw: json ?? {},
  } satisfies RapidApiVideoDetails;
}

async function fetchInstagramVideoDetails(videoUrl: string): Promise<RapidApiVideoDetails> {
  const shortcode = parseInstagramCode(videoUrl);
  if (!shortcode) {
    throw new RapidApiError('Unable to extract Instagram media shortcode from the URL provided');
  }

  const host = RAPIDAPI_HOSTS.instagram;
  const apiUrl = `https://${host}/post?shortcode=${encodeURIComponent(shortcode)}`;
  const json = await rapidApiFetch(apiUrl, host);
  const media = json?.media ?? json?.data ?? json?.post ?? json;
  if (!media) {
    throw new RapidApiError('Instagram response did not include post data');
  }

  const user = media.owner ?? media.user ?? media.author ?? {};
  const username: string = user.username ?? user.handle ?? '';
  const primaryId = user.pk ?? user.id;
  const userId: string = String(primaryId ?? username ?? '');
  if (!userId) {
    throw new RapidApiError('Instagram media response missing creator metadata');
  }

  const displayName: string = user.full_name ?? user.name ?? username ?? 'Instagram Creator';
  const images = media.image_versions2?.candidates ?? media.carousel_media ?? media.images ?? [];
  const thumbnailUrl: string =
    (Array.isArray(images)
      ? images[0]?.url ?? images[0]?.image_versions2?.candidates?.[0]?.url
      : images?.standard_resolution?.url) ?? media.thumbnail_url ?? media.display_url ?? '';
  if (!thumbnailUrl) {
    throw new RapidApiError('Instagram media response did not include a thumbnail image');
  }

  return {
    platformVideoId: String(media.id ?? media.pk ?? shortcode),
    url: `https://www.instagram.com/p/${shortcode}/`,
    title: media.title ?? media.caption?.text?.split('\n')[0] ?? media.caption_text?.split('\n')[0] ?? displayName,
    description: media.caption?.text ?? media.caption_text ?? media.caption ?? '',
    thumbnailUrl,
    publishedAt: parseIsoDate(media.taken_at ?? media.created_time ?? media.timestamp ?? media.taken_at_timestamp),
    metrics: {
      views: toNumber(media.play_count ?? media.video_view_count ?? media.view_count),
      likes: toNumber(media.like_count ?? media.likes),
      comments: toNumber(media.comment_count ?? media.comments),
      shares: toNumber(media.share_count),
    },
    creator: {
      slug: `instagram-${(username || userId).toLowerCase()}`,
      displayName,
      platformId: userId,
      secondaryId: username || undefined,
    },
    raw: json ?? {},
  } satisfies RapidApiVideoDetails;
}

async function fetchTikTokVideoDetails(videoUrl: string): Promise<RapidApiVideoDetails> {
  const videoId = parseTikTokVideoId(videoUrl);
  if (!videoId) {
    throw new RapidApiError('Unable to extract TikTok video id from the URL provided');
  }

  const host = RAPIDAPI_HOSTS.tiktok;
  const apiUrl = `https://${host}/video/${encodeURIComponent(videoId)}?region=US`;
  const json = await rapidApiFetch(apiUrl, host);
  const detail = json?.data?.aweme_detail;
  if (!detail) {
    throw new RapidApiError('TikTok response did not contain aweme_detail data');
  }

  const author = detail.author ?? {};
  const username: string = author.unique_id ?? author.uniqueId ?? '';
  const nickname: string = author.nickname ?? username ?? 'TikTok Creator';
  const coverList: string[] = detail.video?.cover?.url_list ?? detail.video?.origin_cover?.url_list ?? [];
  const thumbnailUrl = coverList.find((url) => Boolean(url)) ?? detail.video?.dynamic_cover?.url_list?.[0] ?? '';
  if (!thumbnailUrl) {
    throw new RapidApiError('TikTok response did not include a thumbnail image');
  }

  const stats = detail.statistics ?? detail.stats ?? {};

  return {
    platformVideoId: detail.aweme_id ?? videoId,
    url: username ? `https://www.tiktok.com/@${username}/video/${detail.aweme_id ?? videoId}` : videoUrl,
    title: detail.desc?.split('\n')[0] ?? nickname,
    description: detail.desc ?? '',
    thumbnailUrl,
    publishedAt: parseIsoDate(detail.create_time),
    metrics: {
      views: toNumber(stats.play_count),
      likes: toNumber(stats.digg_count),
      comments: toNumber(stats.comment_count),
      shares: toNumber(stats.share_count),
      followers: toNumber(author.follower_count),
    },
    creator: {
      slug: `tiktok-${(username || author.uid || videoId).toLowerCase()}`,
      displayName: nickname,
      platformId: String((author.uid ?? author.id ?? username) ?? videoId),
      secondaryId: username || undefined,
    },
    raw: json ?? {},
  } satisfies RapidApiVideoDetails;
}

export async function fetchVideoDetailsFromUrl({
  platform,
  videoUrl,
}: FetchVideoDetailsOptions): Promise<RapidApiVideoDetails> {
  switch (platform) {
    case 'youtube':
      return fetchYoutubeVideoDetails(videoUrl);
    case 'instagram':
      return fetchInstagramVideoDetails(videoUrl);
    case 'tiktok':
      return fetchTikTokVideoDetails(videoUrl);
    default:
      throw new RapidApiError(`Unsupported platform ${platform}`);
  }
}

export { RapidApiError };
