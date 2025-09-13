/**
 * VideoDownloadService - Multi-platform video download abstraction
 * Extracted from unified video scraper and downloader implementations
 */

export interface VideoDownloadResult {
  success: boolean;
  platform: string;
  videoData: {
    buffer: ArrayBuffer;
    size: number;
    mimeType: string;
    filename: string;
  };
  videoUrl?: string; // Direct video URL for streaming
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    saves?: number;
    downloadSpeed?: string;
    fileSize?: number;
    duration?: number;
  };
  additionalMetadata: {
    author: string;
    description: string;
    hashtags: string[];
    duration: number;
    timestamp?: string;
  };
  thumbnailUrl?: string;
  metadata: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    shortCode?: string;
    method?: string;
  };
  error?: string;
}

export interface PlatformScraper {
  /**
   * Scrape video data from platform URL
   */
  scrapeUrl(url: string): Promise<ScrapedVideoData | null>;
  
  /**
   * Download video buffer from direct URL
   */
  downloadBuffer(videoUrl: string): Promise<ArrayBuffer>;
  
  /**
   * Validate URL format for this platform
   */
  validateUrl(url: string): { valid: boolean; message?: string };
  
  /**
   * Extract platform-specific identifier from URL
   */
  extractId(url: string): string | null;
}

export interface ScrapedVideoData {
  platform: string;
  shortCode: string;
  title: string;
  author: string;
  description: string;
  hashtags: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    saves?: number;
  };
  metadata: {
    duration?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Multi-platform video download service
 */
export class VideoDownloadService {
  private scrapers: Map<string, PlatformScraper> = new Map();

  constructor() {
    // Initialize platform scrapers
    this.scrapers.set('tiktok', new TikTokScraper());
    this.scrapers.set('instagram', new InstagramScraper());
  }

  /**
   * Download video from supported platform
   */
  async downloadVideo(url: string): Promise<VideoDownloadResult | null> {
    try {
      console.log('📥 [VIDEO_DOWNLOAD] Starting download for URL:', url);

      const decodedUrl = decodeURIComponent(url);
      const platform = this.detectPlatform(decodedUrl);

      if (!platform) {
        throw new Error(`Unsupported platform for URL: ${decodedUrl}`);
      }

      console.log('🎯 [VIDEO_DOWNLOAD] Platform detected:', platform);

      // Check for direct CDN URLs first
      const directResult = await this.handleDirectDownload(decodedUrl, platform);
      if (directResult) {
        return directResult;
      }

      // Use platform scraper
      const scraper = this.scrapers.get(platform);
      if (!scraper) {
        throw new Error(`No scraper available for platform: ${platform}`);
      }

      // Validate URL
      const validation = scraper.validateUrl(decodedUrl);
      if (!validation.valid) {
        throw new Error(validation.message || 'Invalid URL format');
      }

      // Scrape video data
      const scrapedData = await scraper.scrapeUrl(decodedUrl);
      if (!scrapedData) {
        throw new Error('Failed to scrape video data');
      }

      // Download video buffer
      const videoBuffer = await scraper.downloadBuffer(scrapedData.videoUrl);

      console.log('✅ [VIDEO_DOWNLOAD] Download successful');

      return {
        success: true,
        platform: scrapedData.platform,
        videoData: {
          buffer: videoBuffer,
          size: videoBuffer.byteLength,
          mimeType: 'video/mp4',
          filename: `${scrapedData.platform}-${scrapedData.shortCode}.mp4`
        },
        videoUrl: scrapedData.videoUrl,
        metrics: {
          ...scrapedData.metrics,
          fileSize: videoBuffer.byteLength,
          downloadSpeed: 'scraped'
        },
        additionalMetadata: {
          author: scrapedData.author,
          description: scrapedData.description,
          hashtags: scrapedData.hashtags,
          duration: scrapedData.metadata.duration || 0,
          timestamp: scrapedData.metadata.timestamp
        },
        thumbnailUrl: scrapedData.thumbnailUrl,
        metadata: {
          originalUrl: decodedUrl,
          platform: scrapedData.platform,
          downloadedAt: new Date().toISOString(),
          shortCode: scrapedData.shortCode,
          method: 'scraper'
        }
      };
    } catch (error) {
      console.error('❌ [VIDEO_DOWNLOAD] Download error:', error);
      return {
        success: false,
        platform: 'unknown',
        videoData: {
          buffer: new ArrayBuffer(0),
          size: 0,
          mimeType: 'video/mp4',
          filename: 'error.mp4'
        },
        metrics: {},
        additionalMetadata: {
          author: 'unknown',
          description: '',
          hashtags: [],
          duration: 0
        },
        metadata: {
          originalUrl: url,
          platform: 'unknown',
          downloadedAt: new Date().toISOString(),
          method: 'error'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle direct CDN URL downloads
   */
  private async handleDirectDownload(url: string, platform: string): Promise<VideoDownloadResult | null> {
    if (this.isDirectCDNUrl(url)) {
      console.log('📦 [VIDEO_DOWNLOAD] Processing direct CDN URL');
      
      try {
        const videoBuffer = await this.downloadVideoBuffer(url);
        const filename = this.extractFilenameFromUrl(url) || `${platform}-${Date.now()}.mp4`;

        return {
          success: true,
          platform,
          videoData: {
            buffer: videoBuffer,
            size: videoBuffer.byteLength,
            mimeType: 'video/mp4',
            filename
          },
          videoUrl: url,
          metrics: {
            downloadSpeed: 'direct_cdn',
            fileSize: videoBuffer.byteLength
          },
          additionalMetadata: {
            author: 'unknown',
            description: '',
            hashtags: [],
            duration: 0
          },
          metadata: {
            originalUrl: url,
            platform,
            downloadedAt: new Date().toISOString(),
            method: 'direct_cdn'
          }
        };
      } catch (error) {
        console.error('❌ [VIDEO_DOWNLOAD] Direct download failed:', error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Download video buffer from URL
   */
  private async downloadVideoBuffer(videoUrl: string): Promise<ArrayBuffer> {
    console.log('⬇️ [VIDEO_DOWNLOAD] Downloading video from:', videoUrl.substring(0, 100) + '...');

    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': this.getRefererForUrl(videoUrl)
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`✅ [VIDEO_DOWNLOAD] Video buffer downloaded: ${arrayBuffer.byteLength} bytes`);

    if (arrayBuffer.byteLength < 1000) {
      throw new Error(`Downloaded file too small: ${arrayBuffer.byteLength} bytes`);
    }

    return arrayBuffer;
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string | null {
    const lowerUrl = url.toLowerCase();

    // Instagram patterns
    if (lowerUrl.includes('instagram.com') && 
        (lowerUrl.includes('/reel') || lowerUrl.includes('/reels/') || 
         lowerUrl.includes('/p/') || lowerUrl.includes('/tv/'))) {
      return 'instagram';
    }

    // TikTok patterns  
    if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com')) {
      return 'tiktok';
    }

    // CDN detection
    if (this.isInstagramCDN(url)) return 'instagram';
    if (this.isTikTokCDN(url)) return 'tiktok';

    return null;
  }

  /**
   * Check if URL is a direct CDN URL
   */
  private isDirectCDNUrl(url: string): boolean {
    return this.isInstagramCDN(url) || this.isTikTokCDN(url);
  }

  /**
   * Check if URL is Instagram CDN
   */
  private isInstagramCDN(url: string): boolean {
    return url.includes('cdninstagram.com') && url.includes('.mp4');
  }

  /**
   * Check if URL is TikTok CDN
   */
  private isTikTokCDN(url: string): boolean {
    return (url.includes('tiktokcdn') || url.includes('tiktokv.com') || 
            url.includes('muscdn.com')) && url.includes('.mp4');
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlParts = new URL(url).pathname.split('/');
      return urlParts[urlParts.length - 1]?.split('?')[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get appropriate referer for URL
   */
  private getRefererForUrl(url: string): string {
    if (url.includes('instagram')) {
      return 'https://www.instagram.com/';
    }
    if (url.includes('tiktok')) {
      return 'https://www.tiktok.com/';
    }
    return '';
  }
}

/**
 * TikTok platform scraper implementation
 */
class TikTokScraper implements PlatformScraper {
  async scrapeUrl(url: string): Promise<ScrapedVideoData | null> {
    // Implementation would call TikTok API/scraper
    // This is a placeholder - actual implementation would use RapidAPI or similar
    console.log('🎵 [TIKTOK_SCRAPER] Scraping TikTok URL:', url);
    
    // Mock implementation
    return {
      platform: 'tiktok',
      shortCode: this.extractId(url) || '',
      title: 'TikTok Video',
      author: 'tiktok_user',
      description: 'TikTok video description',
      hashtags: ['tiktok'],
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      metrics: {
        views: 1000,
        likes: 100
      },
      metadata: {
        duration: 30,
        timestamp: new Date().toISOString()
      }
    };
  }

  async downloadBuffer(videoUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TikTok/1.0)',
        'Referer': 'https://www.tiktok.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TikTok download failed: ${response.status}`);
    }
    
    return response.arrayBuffer();
  }

  validateUrl(url: string): { valid: boolean; message?: string } {
    if (url.includes('tiktok.com') && (url.includes('/video/') || url.includes('vm.tiktok.com'))) {
      return { valid: true };
    }
    return { valid: false, message: 'Invalid TikTok URL format' };
  }

  extractId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  }
}

/**
 * Instagram platform scraper implementation
 */
class InstagramScraper implements PlatformScraper {
  async scrapeUrl(url: string): Promise<ScrapedVideoData | null> {
    // Implementation would call Instagram API/scraper
    console.log('📸 [INSTAGRAM_SCRAPER] Scraping Instagram URL:', url);
    
    // Mock implementation
    return {
      platform: 'instagram',
      shortCode: this.extractId(url) || '',
      title: 'Instagram Reel',
      author: 'instagram_user',
      description: 'Instagram reel description',
      hashtags: ['instagram', 'reels'],
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      metrics: {
        views: 5000,
        likes: 500
      },
      metadata: {
        duration: 15,
        timestamp: new Date().toISOString()
      }
    };
  }

  async downloadBuffer(videoUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Instagram/1.0)',
        'Referer': 'https://www.instagram.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Instagram download failed: ${response.status}`);
    }
    
    return response.arrayBuffer();
  }

  validateUrl(url: string): { valid: boolean; message?: string } {
    if (url.includes('instagram.com') && 
        (url.includes('/reel') || url.includes('/reels/') || url.includes('/p/'))) {
      return { valid: true };
    }
    return { valid: false, message: 'Invalid Instagram URL format' };
  }

  extractId(url: string): string | null {
    const match = url.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  }
}