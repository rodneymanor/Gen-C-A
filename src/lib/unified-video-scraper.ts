/**
 * Unified Video Scraper Service
 * Single interface for both TikTok and Instagram video scraping via RapidAPI
 */
import {
  extractInstagramShortcode,
  fetchInstagramRapidApiByShortcode,
  mapInstagramToUnified,
} from "@/lib/instagram-rapidapi";
import {
  extractTikTokVideoId,
  resolveTikTokShortLink,
  fetchTikTokRapidApiById,
  mapTikTokToUnified,
} from "@/lib/tiktok-rapidapi";
import { UnifiedVideoResult, ScraperOptions } from "@/lib/types/video-scraper";

export class UnifiedVideoScraper {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    // Auto-detect base URL for API calls
    this.baseUrl = baseUrl || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  }

  /**
   * Main scraping method - detects platform and routes to appropriate scraper
   */
  async scrapeUrl(url: string, options: ScraperOptions = {}): Promise<UnifiedVideoResult> {
    console.log("🔍 [UNIFIED_SCRAPER] Starting scrape for URL:", url);

    const platform = this.detectPlatform(url);

    if (platform === "unsupported") {
      throw new Error(`Unsupported URL format: ${url}. Only TikTok and Instagram videos are supported.`);
    }

    console.log("🎯 [UNIFIED_SCRAPER] Platform detected:", platform);

    try {
      let result: UnifiedVideoResult;

      if (platform === "instagram") {
        result = await this.scrapeInstagram(url, options);
      } else {
        result = await this.scrapeTikTok(url, options);
      }

      console.log("✅ [UNIFIED_SCRAPER] Scraping successful for:", platform);
      return result;
    } catch (error) {
      console.error(`❌ [UNIFIED_SCRAPER] ${platform} scraping failed:`, error);
      throw new Error(
        `Failed to scrape ${platform} video: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Scrape Instagram video using the new RapidAPI shortcode endpoint
   */
  private async scrapeInstagram(url: string, options: ScraperOptions = {}): Promise<UnifiedVideoResult> {
    console.log("📸 [UNIFIED_SCRAPER] Scraping Instagram URL with RapidAPI shortcode endpoint...");
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      throw new Error("Could not extract shortcode from Instagram URL");
    }
    const instagramData = await fetchInstagramRapidApiByShortcode(shortcode);
    return mapInstagramToUnified(instagramData, shortcode, options?.preferAudioOnly === true);
  }

  // Removed legacy Instagram post scraper path

  /**
   * Scrape TikTok video using Apify scraper endpoint with postURLs
   */
  private async scrapeTikTok(url: string, _options: ScraperOptions = {}): Promise<UnifiedVideoResult> {
    console.log("🎵 [UNIFIED_SCRAPER] Scraping TikTok URL via RapidAPI...");
    const videoId = await this.getTikTokVideoId(url);
    const json = await fetchTikTokRapidApiById(videoId);
    const aweme = json?.data?.aweme_detail ?? json?.aweme_detail ?? json;
    if (!aweme) {
      throw new Error("TikTok RapidAPI returned an unexpected response shape");
    }
    return mapTikTokToUnified(aweme);
  }

  private async getTikTokVideoId(inputUrl: string): Promise<string> {
    const direct = extractTikTokVideoId(inputUrl);
    if (direct) return direct;
    const resolved = await resolveTikTokShortLink(inputUrl);
    if (!resolved) {
      throw new Error("Unable to resolve TikTok short link to a full video URL");
    }
    const fromResolved = extractTikTokVideoId(resolved);
    if (!fromResolved) {
      throw new Error("Could not extract TikTok video ID from resolved URL");
    }
    return fromResolved;
  }

  /**
   * Detect platform from URL
   */
  static detectPlatform(url: string): "tiktok" | "instagram" | "unsupported" {
    const lowerUrl = url.toLowerCase();

    // Instagram patterns
    if (
      lowerUrl.includes("instagram.com") &&
      (lowerUrl.includes("/reel") ||
        lowerUrl.includes("/reels/") ||
        lowerUrl.includes("/p/") ||
        lowerUrl.includes("/tv/") ||
        lowerUrl.includes("/share/"))
    ) {
      return "instagram";
    }

    // TikTok patterns
    if (lowerUrl.includes("tiktok.com") || lowerUrl.includes("vm.tiktok.com")) {
      return "tiktok";
    }

    return "unsupported";
  }

  // Instance method for convenience
  detectPlatform(url: string): "tiktok" | "instagram" | "unsupported" {
    return UnifiedVideoScraper.detectPlatform(url);
  }

  /**
   * Validate if URL is supported
   */
  static validateUrl(url: string): boolean {
    return this.detectPlatform(url) !== "unsupported";
  }

  /**
   * Extract Instagram shortcode from URL
   */
  private extractShortcode(url: string): string | null {
    return extractInstagramShortcode(url);
  }

  // Removed legacy media ID conversion helpers

  /**
   * Extract hashtags from text content
   */
  private extractHashtagsFromText(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  }

  /**
   * Get detailed URL validation patterns for frontend
   */
  static getUrlPatterns() {
    return {
      instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv|share)\/[A-Za-z0-9_-]+/,
      tiktok:
        /^https?:\/\/(www\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/[A-Za-z0-9]+|tiktok\.com\/t\/[A-Za-z0-9]+)/,
    };
  }

  /**
   * Enhanced URL validation with specific error messages
   */
  static validateUrlWithMessage(url: string): { valid: boolean; message?: string; platform?: string } {
    const basicError = this.getBasicValidationError(url);
    if (basicError) return basicError;

    const cdnPlatform = this.detectCdnPlatform(url);
    if (cdnPlatform) return { valid: true, platform: cdnPlatform };

    if (this.isInstagramPostUrl(url)) {
      return {
        valid: false,
        message:
          "Instagram post URLs are not supported yet. Please use Instagram reel URLs instead (look for /reel/ in the URL).",
      };
    }

    const platform = this.detectPlatform(url);
    return platform === "unsupported"
      ? { valid: false, message: "Only TikTok and Instagram video URLs are supported" }
      : { valid: true, platform };
  }

  private static getBasicValidationError(url: string): { valid: boolean; message: string } | null {
    if (!url || url.trim() === "") {
      return { valid: false, message: "URL is required" };
    }
    try {
      new URL(url);
      return null;
    } catch {
      return { valid: false, message: "Please enter a valid URL" };
    }
  }

  private static detectCdnPlatform(url: string): "instagram_cdn" | "tiktok_cdn" | null {
    if (this.isInstagramCdnUrl(url)) return "instagram_cdn";
    if (this.isTikTokCdnUrl(url)) return "tiktok_cdn";
    return null;
  }

  private static isInstagramCdnUrl(url: string): boolean {
    return url.includes("scontent-") && url.includes(".cdninstagram.com") && url.includes(".mp4");
  }

  private static isTikTokCdnUrl(url: string): boolean {
    return (
      (url.includes("tiktokcdn.com") || url.includes("tiktokv.com") || url.includes("muscdn.com")) &&
      url.includes(".mp4")
    );
  }

  private static isInstagramPostUrl(url: string): boolean {
    return url.includes("instagram.com") && /\/p\/[A-Za-z0-9_-]+/.test(url);
  }
}

/**
 * Factory function for easy usage
 */
export function createUnifiedVideoScraper(baseUrl?: string): UnifiedVideoScraper {
  return new UnifiedVideoScraper(baseUrl);
}

/**
 * Utility function for quick single URL scraping
 */
export async function scrapeVideoUrl(url: string, options: ScraperOptions = {}): Promise<UnifiedVideoResult> {
  const scraper = createUnifiedVideoScraper();
  return await scraper.scrapeUrl(url, options);
}
