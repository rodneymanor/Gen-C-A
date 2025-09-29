import { UnifiedVideoResult, ScraperOptions } from "@/lib/types-video-scraper";

const INSTAGRAM_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com";

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

  const endpoint = `https://${INSTAGRAM_HOST}/post?shortcode=${encodeURIComponent(shortcode)}`;
  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": INSTAGRAM_HOST,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Instagram RapidAPI failed (${response.status}): ${body}`);
      }

      return await response.json();
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const message = normalizedError.message.length > 320
        ? `${normalizedError.message.slice(0, 320)}…`
        : normalizedError.message;
      lastError = normalizedError;
      const backoffMs = 500 * attempt;
      console.warn(
        `⚠️ [IG RapidAPI] Attempt ${attempt} failed for shortcode ${shortcode}: ${message}. Retrying in ${backoffMs}ms`,
      );
      if (attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError ?? new Error("Instagram RapidAPI request failed");
}

export function mapInstagramToUnified(data: any, shortcode: string, preferAudioOnly: boolean): UnifiedVideoResult {
  const media = data;
  if (!media) {
    throw new Error("Instagram RapidAPI response did not include media");
  }

  const videoVersions = media.video_versions ?? media.video?.video_versions ?? [];
  const audioUrl = preferAudioOnly ? extractAudioUrlFromManifest(media.video_dash_manifest) : undefined;

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
    likeCount: media.like_count ?? media.fb_like_count ?? media.likes ?? undefined,
    viewCount: media.play_count ?? media.fb_play_count ?? media.views ?? undefined,
    shareCount: media.reshare_count ?? undefined,
    commentCount: media.comment_count ?? undefined,
    raw: { shortcode, data },
  };
}

function extractAudioUrlFromManifest(manifest?: string | null): string | undefined {
  if (!manifest || typeof manifest !== "string") return undefined;

  const audioMatch = manifest.match(
    /<Representation[^>]*mimeType="audio\/mp4"[^>]*>[\s\S]*?<BaseURL>([^<]+)<\/BaseURL>/i,
  );
  if (!audioMatch || audioMatch.length < 2) {
    return undefined;
  }

  return audioMatch[1]
    .replace(/&amp;/g, "&")
    .replace(/\\u0026/g, "&")
    .trim();
}
