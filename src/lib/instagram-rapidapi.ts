import { UnifiedVideoResult, ScraperOptions } from "@/lib/types-video-scraper";

const INSTAGRAM_HOST = "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com";

export function extractInstagramShortcode(url: string): string | null {
  try {
    const normalized = url.trim();
    const match = normalized.match(/instagram\.com\/(?:reel|reels|tv|p)\/([A-Za-z0-9_-]+)/i);
    return match ? match[1] : null;
  } catch (error) {
    console.warn("⚠️ [IG RapidAPI] Failed to extract shortcode", error);
    return null;
  }
}

export async function fetchInstagramRapidApiByShortcode(shortcode: string): Promise<any> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const endpoint = `https://${INSTAGRAM_HOST}/reel_by_shortcode?shortcode=${encodeURIComponent(shortcode)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": INSTAGRAM_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Instagram RapidAPI failed (${response.status}): ${body}`);
  }

  return response.json();
}

export function mapInstagramToUnified(data: any, shortcode: string, preferAudioOnly: boolean): UnifiedVideoResult {
  const media = data?.data?.items?.[0]?.media ?? data?.data ?? data?.media ?? data;
  if (!media) {
    throw new Error("Instagram RapidAPI response did not include media");
  }

  const videoVersions = media.video_versions ?? media.video?.video_versions ?? [];
  const audioUrl = preferAudioOnly
    ? media.audio?.url ?? media.clip?.audio?.url ?? media.music?.play_url
    : undefined;

  const bestVideo = Array.isArray(videoVersions) && videoVersions.length > 0 ? videoVersions[0] : undefined;
  const downloadUrl = preferAudioOnly && audioUrl ? audioUrl : bestVideo?.url;
  if (!downloadUrl) {
    throw new Error("Instagram RapidAPI did not include a usable download URL");
  }

  const thumbnailCandidates =
    media.image_versions2?.candidates ||
    media.image_versions2?.additional_candidates?.first_frame ||
    media.thumbnails ||
    [];

  const thumbnailUrl = Array.isArray(thumbnailCandidates)
    ? thumbnailCandidates[0]?.url
    : thumbnailCandidates?.url ?? undefined;

  const captionText = media.caption?.text ?? media.caption ?? "";

  return {
    success: true,
    platform: "instagram",
    downloadUrl,
    audioUrl: audioUrl ?? undefined,
    thumbnailUrl: thumbnailUrl ?? undefined,
    title: captionText ? captionText.split("\n")[0]?.slice(0, 120) : undefined,
    description: captionText ?? undefined,
    author:
      media.user?.username ??
      media.owner?.username ??
      media.author?.username ??
      media.user?.full_name ??
      media.owner?.full_name ??
      undefined,
    duration: media.video_duration ?? media.duration ?? undefined,
    likeCount: media.like_count ?? media.likes ?? undefined,
    viewCount: media.play_count ?? media.views ?? undefined,
    shareCount: media.reshare_count ?? undefined,
    commentCount: media.comment_count ?? undefined,
    raw: { shortcode, data },
  };
}
