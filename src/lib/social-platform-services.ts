/**
 * Social Platform Services
 * Unified client classes for TikTok, Instagram, and YouTube integration
 */

export interface PlatformMetrics {
  likes: number;
  views: number;
  comments: number;
  shares: number;
  saves?: number;
}

export interface PlatformContent {
  id: string;
  shortCode?: string;
  title: string;
  description: string;
  author: string;
  authorDisplayName?: string;
  authorVerified?: boolean;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  hashtags: string[];
  mentions: string[];
  metrics: PlatformMetrics;
  timestamp?: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  isVideo: boolean;
  language?: string;
  location?: {
    name: string;
    id?: string;
  };
  rawData?: any;
}

export interface VideoDownloadResult {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
  quality?: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface PlatformClientConfig {
  rapidApiKey?: string;
  apifyToken?: string;
  youtubeApiKey?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerMinute?: number;
  };
}

export interface AuthenticationResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export interface RateLimitStatus {
  requestsRemaining: number;
  resetTime: Date;
  isLimited: boolean;
}

/**
 * Base class for social platform clients
 */
export abstract class BasePlatformClient {
  protected config: PlatformClientConfig;
  protected platform: string;

  constructor(platform: string, config: PlatformClientConfig) {
    this.platform = platform;
    this.config = config;
  }

  abstract extractContentId(url: string): string | null;
  abstract validateUrl(url: string): boolean;
  abstract fetchContent(contentId: string): Promise<PlatformContent>;
  abstract downloadVideo?(contentId: string): Promise<VideoDownloadResult | null>;
  abstract getTranscript?(contentId: string): Promise<TranscriptSegment[] | null>;
  abstract searchContent?(query: string, limit?: number): Promise<PlatformContent[]>;

  /**
   * Get platform name
   */
  getPlatform(): string {
    return this.platform;
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!(this.config.rapidApiKey || this.config.apifyToken || this.config.youtubeApiKey);
  }

  /**
   * Extract hashtags from text
   */
  protected extractHashtags(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Extract mentions from text
   */
  protected extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  /**
   * Clean text content
   */
  protected cleanText(text: string): string {
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
}

/**
 * TikTok Platform Client
 */
export class TikTokClient extends BasePlatformClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(config: PlatformClientConfig) {
    super('tiktok', config);
  }

  extractContentId(url: string): string | null {
    // Decode URL-encoded URLs
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch {
      decodedUrl = url;
    }

    const patterns = [
      /tiktok\.com\/@[^/]+\/video\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
      /tiktok\.com\/t\/([A-Za-z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = decodedUrl.match(pattern);
      if (match) {
        const extractedId = match[1];
        
        // If it's already a full numeric ID, use it directly
        if (/^\d+$/.test(extractedId)) {
          return extractedId;
        }

        // For short codes, would need to resolve - return as is for now
        return extractedId;
      }
    }

    return null;
  }

  validateUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com');
  }

  async fetchContent(contentId: string): Promise<PlatformContent> {
    if (!this.config.rapidApiKey) {
      throw new Error('TikTok client requires RapidAPI key');
    }

    // Check cache first
    const cacheKey = `tiktok_${contentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return this.mapToUnifiedFormat(cached.data, contentId);
    }

    try {
      const response = await fetch(
        `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/${contentId}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.config.rapidApiKey,
            'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return this.mapToUnifiedFormat(data, contentId);
    } catch (error) {
      console.error('TikTok fetch error:', error);
      throw new Error(`Failed to fetch TikTok content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadVideo(contentId: string): Promise<VideoDownloadResult | null> {
    try {
      // Get video metadata first
      const content = await this.fetchContent(contentId);
      
      if (!content.videoUrl) {
        throw new Error('No video URL found in TikTok content');
      }

      // Download video content
      const response = await fetch(content.videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.tiktok.com/',
        },
      });

      if (!response.ok) {
        throw new Error(`Video download failed: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;
      const mimeType = response.headers.get('content-type') || 'video/mp4';

      if (size <= 1000) {
        throw new Error('Downloaded file too small, likely not a valid video');
      }

      return {
        buffer,
        size,
        mimeType,
        filename: `tiktok-${contentId}.mp4`,
        quality: 'default'
      };
    } catch (error) {
      console.error('TikTok video download error:', error);
      return null;
    }
  }

  private mapToUnifiedFormat(data: any, contentId: string): PlatformContent {
    const awemeDetail = data.data?.aweme_detail || data;
    const statistics = awemeDetail.statistics || {};
    const author = awemeDetail.author || {};
    const video = awemeDetail.video || {};
    const music = awemeDetail.music || {};

    // Extract video URLs
    const videoUrls = video.play_addr?.url_list || [];
    const videoUrl = videoUrls.length > 0 ? videoUrls[0] : undefined;

    // Extract audio URL
    const audioUrl = music.play_url?.uri || undefined;

    // Extract thumbnail
    const thumbnailUrls = video.cover?.url_list || video.dynamic_cover?.url_list || [];
    const thumbnailUrl = thumbnailUrls.length > 0 ? thumbnailUrls[0] : undefined;

    const description = awemeDetail.desc || '';

    return {
      id: contentId,
      title: description || `Video by @${author.nickname || author.unique_id}`,
      description,
      author: author.unique_id || 'unknown',
      authorDisplayName: author.nickname,
      authorVerified: author.custom_verify === '1' || author.enterprise_verify_reason?.length > 0,
      videoUrl,
      audioUrl,
      thumbnailUrl,
      duration: video.duration ? Math.floor(video.duration / 1000) : undefined,
      hashtags: this.extractHashtags(description),
      mentions: this.extractMentions(description),
      metrics: {
        likes: statistics.digg_count || 0,
        views: statistics.play_count || 0,
        comments: statistics.comment_count || 0,
        shares: statistics.share_count || 0,
        saves: statistics.collect_count || 0,
      },
      timestamp: awemeDetail.create_time ? new Date(awemeDetail.create_time * 1000).toISOString() : undefined,
      platform: 'tiktok',
      isVideo: true,
      language: awemeDetail.region || 'en',
      rawData: data
    };
  }
}

/**
 * Instagram Platform Client
 */
export class InstagramClient extends BasePlatformClient {
  constructor(config: PlatformClientConfig) {
    super('instagram', config);
  }

  extractContentId(url: string): string | null {
    // Support canonical post/reel/tv as well as share links
    const match = url.match(/\/(p|reel|reels|tv|share)\/([A-Za-z0-9_-]+)/);
    return match ? match[2] : null;
  }

  validateUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('instagram.com') && 
           (lowerUrl.includes('/reel') || lowerUrl.includes('/reels/') || 
            lowerUrl.includes('/p/') || lowerUrl.includes('/tv/') || 
            lowerUrl.includes('/share/'));
  }

  async fetchContent(shortcode: string): Promise<PlatformContent> {
    if (!this.config.rapidApiKey) {
      throw new Error('Instagram client requires RapidAPI key');
    }

    try {
      const response = await fetch(
        `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${encodeURIComponent(shortcode)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com',
            'x-rapidapi-key': this.config.rapidApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapToUnifiedFormat(data, shortcode);
    } catch (error) {
      console.error('Instagram fetch error:', error);
      throw new Error(`Failed to fetch Instagram content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadVideo(shortcode: string): Promise<VideoDownloadResult | null> {
    try {
      const content = await this.fetchContent(shortcode);
      
      if (!content.videoUrl) {
        throw new Error('No video URL found in Instagram content');
      }

      const response = await fetch(content.videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Video download failed: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;
      const mimeType = response.headers.get('content-type') || 'video/mp4';

      return {
        buffer,
        size,
        mimeType,
        filename: `instagram-${shortcode}.mp4`,
        quality: 'default'
      };
    } catch (error) {
      console.error('Instagram video download error:', error);
      return null;
    }
  }

  private mapToUnifiedFormat(data: any, shortcode: string): PlatformContent {
    // Handle both standard and dash video versions
    const standardVersions = data.video_versions || [];
    const dashVersions = data.video_dash_manifest?.video_versions || [];
    const allVersions = [...dashVersions, ...standardVersions];

    // Select lowest bandwidth version (usually most compatible)
    const selectedVersion = allVersions.length > 0 
      ? allVersions.sort((a, b) => (a.bandwidth || 0) - (b.bandwidth || 0))[0]
      : null;

    const videoUrl = selectedVersion?.url || '';
    const thumbnailUrl = data.image_versions2?.candidates?.[0]?.url || '';
    const caption = data.caption?.text || '';
    const user = data.user || {};

    return {
      id: shortcode,
      shortCode: shortcode,
      title: caption || `Video by @${user.username}`,
      description: caption,
      author: user.username || 'unknown',
      authorDisplayName: user.full_name,
      authorVerified: user.is_verified || false,
      videoUrl,
      thumbnailUrl,
      duration: data.video_duration || 0,
      hashtags: this.extractHashtags(caption),
      mentions: this.extractMentions(caption),
      metrics: {
        likes: data.like_count || 0,
        views: data.play_count || 0,
        comments: data.comment_count || 0,
        shares: data.reshare_count || 0,
      },
      timestamp: data.taken_at ? new Date(data.taken_at * 1000).toISOString() : undefined,
      platform: 'instagram',
      isVideo: !!videoUrl,
      rawData: data
    };
  }
}

/**
 * YouTube Platform Client
 */
export class YouTubeClient extends BasePlatformClient {
  constructor(config: PlatformClientConfig) {
    super('youtube', config);
  }

  extractContentId(url: string): string | null {
    try {
      const urlObj = new URL(url);

      // Standard YouTube URLs
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        return urlObj.searchParams.get('v');
      }

      // YouTube short URLs
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }

      // YouTube embed URLs
      if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1];
      }

      return null;
    } catch {
      return null;
    }
  }

  validateUrl(url: string): boolean {
    const videoId = this.extractContentId(url);
    return videoId !== null;
  }

  async fetchContent(videoId: string): Promise<PlatformContent> {
    try {
      // Use YouTube oEmbed API for basic metadata
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);

      if (!response.ok) {
        throw new Error(`YouTube oEmbed API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToUnifiedFormat(data, videoId);
    } catch (error) {
      console.error('YouTube fetch error:', error);
      throw new Error(`Failed to fetch YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
    if (!this.config.rapidApiKey) {
      throw new Error('YouTube transcript requires RapidAPI key');
    }

    try {
      const response = await fetch(
        `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
            'x-rapidapi-key': this.config.rapidApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube transcript API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      const segments = data.transcript;

      if (!Array.isArray(segments)) {
        throw new Error('Invalid transcript format');
      }

      // Convert RapidAPI format to our format
      return segments.map((segment: any) => ({
        text: segment.text || '',
        start: parseFloat(segment.offset || 0),
        duration: parseFloat(segment.duration || 0),
      }));
    } catch (error) {
      console.error('YouTube transcript error:', error);
      return null;
    }
  }

  private mapToUnifiedFormat(data: any, videoId: string): PlatformContent {
    const title = data.title || '';
    const description = title; // oEmbed doesn't provide full description

    return {
      id: videoId,
      title,
      description,
      author: data.author_name || 'unknown',
      authorDisplayName: data.author_name,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration || 0,
      hashtags: this.extractHashtags(description),
      mentions: this.extractMentions(description),
      metrics: {
        likes: 0, // Not available via oEmbed
        views: 0, // Not available via oEmbed
        comments: 0, // Not available via oEmbed
        shares: 0, // Not available via oEmbed
      },
      platform: 'youtube',
      isVideo: true,
      rawData: data
    };
  }
}

/**
 * Social Platform Service Manager
 */
export class SocialPlatformServiceManager {
  private clients: Map<string, BasePlatformClient> = new Map();

  constructor(config: PlatformClientConfig) {
    this.clients.set('tiktok', new TikTokClient(config));
    this.clients.set('instagram', new InstagramClient(config));
    this.clients.set('youtube', new YouTubeClient(config));
  }

  /**
   * Get client for specific platform
   */
  getClient(platform: string): BasePlatformClient | null {
    return this.clients.get(platform.toLowerCase()) || null;
  }

  /**
   * Detect platform from URL and get appropriate client
   */
  detectPlatformAndGetClient(url: string): { platform: string; client: BasePlatformClient } | null {
    const lowerUrl = url.toLowerCase();

    // TikTok
    if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) {
      const client = this.clients.get('tiktok');
      return client ? { platform: 'tiktok', client } : null;
    }

    // Instagram
    if (lowerUrl.includes('instagram.com') && 
        (lowerUrl.includes('/reel') || lowerUrl.includes('/reels/') || 
         lowerUrl.includes('/p/') || lowerUrl.includes('/tv/'))) {
      const client = this.clients.get('instagram');
      return client ? { platform: 'instagram', client } : null;
    }

    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      const client = this.clients.get('youtube');
      return client ? { platform: 'youtube', client } : null;
    }

    return null;
  }

  /**
   * Universal content fetcher - detects platform automatically
   */
  async fetchContent(url: string): Promise<PlatformContent> {
    const detection = this.detectPlatformAndGetClient(url);
    
    if (!detection) {
      throw new Error('Unsupported platform or invalid URL format');
    }

    const { platform, client } = detection;
    const contentId = client.extractContentId(url);

    if (!contentId) {
      throw new Error(`Could not extract content ID from ${platform} URL`);
    }

    console.log(`🔍 [SocialPlatform] Fetching ${platform} content: ${contentId}`);
    
    try {
      const content = await client.fetchContent(contentId);
      console.log(`✅ [SocialPlatform] Successfully fetched ${platform} content`);
      return content;
    } catch (error) {
      console.error(`❌ [SocialPlatform] Failed to fetch ${platform} content:`, error);
      throw error;
    }
  }

  /**
   * Universal video downloader
   */
  async downloadVideo(url: string): Promise<VideoDownloadResult | null> {
    const detection = this.detectPlatformAndGetClient(url);
    
    if (!detection) {
      throw new Error('Unsupported platform for video download');
    }

    const { platform, client } = detection;
    const contentId = client.extractContentId(url);

    if (!contentId) {
      throw new Error(`Could not extract content ID from ${platform} URL`);
    }

    if (!client.downloadVideo) {
      throw new Error(`Video download not supported for ${platform}`);
    }

    console.log(`📥 [SocialPlatform] Downloading ${platform} video: ${contentId}`);
    
    try {
      const result = await client.downloadVideo(contentId);
      
      if (result) {
        console.log(`✅ [SocialPlatform] Successfully downloaded ${platform} video (${Math.round(result.size / 1024 / 1024 * 100) / 100}MB)`);
      } else {
        console.warn(`⚠️ [SocialPlatform] ${platform} video download returned null`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ [SocialPlatform] Failed to download ${platform} video:`, error);
      throw error;
    }
  }

  /**
   * Get transcript for video (YouTube only for now)
   */
  async getTranscript(url: string): Promise<TranscriptSegment[] | null> {
    const detection = this.detectPlatformAndGetClient(url);
    
    if (!detection) {
      throw new Error('Unsupported platform for transcript');
    }

    const { platform, client } = detection;
    const contentId = client.extractContentId(url);

    if (!contentId) {
      throw new Error(`Could not extract content ID from ${platform} URL`);
    }

    if (!client.getTranscript) {
      throw new Error(`Transcript not supported for ${platform}`);
    }

    console.log(`📝 [SocialPlatform] Getting ${platform} transcript: ${contentId}`);
    
    try {
      const transcript = await client.getTranscript(contentId);
      
      if (transcript) {
        console.log(`✅ [SocialPlatform] Successfully got ${platform} transcript (${transcript.length} segments)`);
      } else {
        console.warn(`⚠️ [SocialPlatform] ${platform} transcript returned null`);
      }
      
      return transcript;
    } catch (error) {
      console.error(`❌ [SocialPlatform] Failed to get ${platform} transcript:`, error);
      throw error;
    }
  }

  /**
   * Get all configured clients status
   */
  getClientsStatus(): Array<{
    platform: string;
    configured: boolean;
    hasRapidApi: boolean;
    hasApify: boolean;
    hasYouTubeApi: boolean;
  }> {
    return Array.from(this.clients.entries()).map(([platform, client]) => ({
      platform,
      configured: client.isConfigured(),
      hasRapidApi: !!(client as any).config.rapidApiKey,
      hasApify: !!(client as any).config.apifyToken,
      hasYouTubeApi: !!(client as any).config.youtubeApiKey,
    }));
  }

  /**
   * Validate URL for any supported platform
   */
  validateUrl(url: string): { valid: boolean; platform?: string; error?: string } {
    try {
      new URL(url); // Basic URL validation
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    const detection = this.detectPlatformAndGetClient(url);
    
    if (!detection) {
      return { 
        valid: false, 
        error: 'Unsupported platform. Only TikTok, Instagram, and YouTube are supported.' 
      };
    }

    const { platform, client } = detection;
    const isValid = client.validateUrl(url);
    
    return {
      valid: isValid,
      platform: isValid ? platform : undefined,
      error: isValid ? undefined : `Invalid ${platform} URL format`
    };
  }
}

/**
 * Factory function to create service manager
 */
export function createSocialPlatformServiceManager(config?: Partial<PlatformClientConfig>): SocialPlatformServiceManager {
  const fullConfig: PlatformClientConfig = {
    rapidApiKey: process.env.RAPIDAPI_KEY,
    apifyToken: process.env.APIFY_TOKEN,
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    timeout: 30000,
    retries: 2,
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerMinute: 50
    },
    ...config
  };

  return new SocialPlatformServiceManager(fullConfig);
}

// Export singleton instance
export const socialPlatformService = createSocialPlatformServiceManager();