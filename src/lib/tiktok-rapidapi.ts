import { UnifiedVideoResult } from "@/lib/types-video-scraper";

const TIKTOK_HOST = "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com";

export function extractTikTokVideoId(url: string): string | null {
  try {
    const normalized = url.trim();
    const match = normalized.match(/tiktok\.com\/.*?video\/(\d+)/i);
    if (match) return match[1];

    const alt = normalized.match(/video_id=([^&]+)/i);
    if (alt) return alt[1];

    return null;
  } catch (error) {
    console.warn("⚠️ [TikTok RapidAPI] Failed to extract video id", error);
    return null;
  }
}

export async function resolveTikTokShortLink(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    if (response.url && response.url !== url) {
      return response.url;
    }
    return url;
  } catch (error) {
    console.warn("⚠️ [TikTok RapidAPI] Failed to resolve short link", error);
    return null;
  }
}

export async function fetchTikTokRapidApiById(videoId: string): Promise<any> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const endpoint = `https://${TIKTOK_HOST}/video/${encodeURIComponent(videoId)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": TIKTOK_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TikTok RapidAPI failed (${response.status}): ${body}`);
  }

  return response.json();
}

export function mapTikTokToUnified(data: any): UnifiedVideoResult {
  const aweme = data?.data?.aweme_detail ?? data?.aweme_detail ?? data;
  if (!aweme) {
    throw new Error("TikTok RapidAPI response missing aweme_detail");
  }

  const video = aweme.video ?? {};
  const playList = video.play_addr?.url_list ?? aweme.video_url ? [aweme.video_url] : [];
  const downloadList = video.download_addr?.url_list ?? [];
  const downloadUrl = downloadList[0] ?? playList[0];

  if (!downloadUrl) {
    throw new Error("TikTok RapidAPI did not include a usable download URL");
  }

  const thumbnailUrl =
    video.cover?.url_list?.[0] ??
    video.dynamic_cover?.url_list?.[0] ??
    video.origin_cover?.url_list?.[0] ??
    undefined;

  return {
    success: true,
    platform: "tiktok",
    downloadUrl,
    audioUrl: aweme.music?.play_url?.url_list?.[0] ?? undefined,
    thumbnailUrl,
    title: aweme.desc ?? undefined,
    description: aweme.desc ?? undefined,
    author: aweme.author?.unique_id ?? aweme.author?.nickname ?? undefined,
    duration: video.duration ?? aweme.duration ?? undefined,
    likeCount: aweme.statistics?.digg_count ?? undefined,
    viewCount: aweme.statistics?.play_count ?? undefined,
    shareCount: aweme.statistics?.share_count ?? undefined,
    commentCount: aweme.statistics?.comment_count ?? undefined,
    raw: aweme,
  };
}
