/**
 * CDNService - Bunny.net CDN integration abstraction
 * Extracted from bunny-stream.ts for reusable CDN operations
 */

export interface CDNConfig {
  libraryId: string;
  apiKey: string;
  hostname: string;
}

export interface CDNUploadResult {
  success: boolean;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  error?: string;
}

export interface StreamFromUrlResult {
  success: boolean;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  error?: string;
}

/**
 * CDN service abstraction for video upload and management
 */
export class CDNService {
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Upload video buffer to CDN
   */
  async uploadBuffer(videoData: {
    buffer: ArrayBuffer;
    filename: string;
    mimeType: string;
  }): Promise<CDNUploadResult | null> {
    try {
      console.log('🐰 [CDN_SERVICE] Uploading buffer to CDN...');
      console.log('📊 [CDN_SERVICE] Buffer info:', {
        bufferSize: videoData.buffer.byteLength,
        filename: videoData.filename,
        mimeType: videoData.mimeType
      });

      const result = await this.performRetryLoop(
        Buffer.from(videoData.buffer),
        videoData.filename
      );

      if (!result) {
        return {
          success: false,
          error: 'Failed to upload to CDN'
        };
      }

      console.log('✅ [CDN_SERVICE] Buffer upload successful');

      return {
        success: true,
        iframeUrl: result.iframeUrl,
        directUrl: result.directUrl,
        guid: result.guid,
        thumbnailUrl: this.generateThumbnailUrl(result.guid),
        previewUrl: this.generatePreviewUrl(result.guid)
      };
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Buffer upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Stream video directly from URL to CDN
   */
  async streamFromUrl(videoUrl: string, filename: string): Promise<StreamFromUrlResult | null> {
    try {
      console.log('🌊 [CDN_SERVICE] Starting direct stream from URL to CDN...');
      console.log('🔗 [CDN_SERVICE] Source URL:', videoUrl.substring(0, 100) + '...');

      // Create video object in CDN first
      const videoGuid = await this.createVideoObject(filename);
      if (!videoGuid) {
        console.error('❌ [CDN_SERVICE] Failed to create video object');
        return null;
      }

      console.log('📝 [CDN_SERVICE] Created video object with GUID:', videoGuid);

      // Stream video directly from source to CDN
      const success = await this.streamVideoToCDN(videoUrl, videoGuid);
      if (!success) {
        console.error('❌ [CDN_SERVICE] Failed to stream video');
        return null;
      }

      const iframeUrl = this.buildIframeUrl(videoGuid);
      const directUrl = this.buildDirectUrl(videoGuid);

      console.log('✅ [CDN_SERVICE] Direct stream completed successfully');
      console.log('🎯 [CDN_SERVICE] Iframe URL:', iframeUrl);
      console.log('🎯 [CDN_SERVICE] Direct URL:', directUrl);

      return {
        success: true,
        iframeUrl,
        directUrl,
        guid: videoGuid
      };
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Stream error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stream failed'
      };
    }
  }

  /**
   * Upload custom thumbnail for video
   */
  async uploadThumbnail(videoGuid: string, thumbnailUrl: string, maxRetries: number = 3): Promise<boolean> {
    console.log(`🖼️ [CDN_SERVICE] Starting thumbnail upload for video: ${videoGuid}`);
    console.log(`🔗 [CDN_SERVICE] Source thumbnail URL: ${thumbnailUrl}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [CDN_SERVICE] Thumbnail upload attempt ${attempt}/${maxRetries}`);

        // Download thumbnail from source
        console.log('📥 [CDN_SERVICE] Downloading thumbnail from source...');
        const thumbnailResponse = await fetch(thumbnailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!thumbnailResponse.ok) {
          console.error(`❌ [CDN_SERVICE] Failed to download thumbnail: ${thumbnailResponse.status}`);
          if (attempt === maxRetries) return false;
          continue;
        }

        const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
        console.log(`📦 [CDN_SERVICE] Downloaded thumbnail: ${thumbnailBuffer.byteLength} bytes`);

        // Upload thumbnail to CDN
        console.log('📤 [CDN_SERVICE] Uploading to CDN...');
        const uploadUrl = `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${videoGuid}/thumbnail`;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'AccessKey': this.config.apiKey,
            'Content-Type': 'image/jpeg'
          },
          body: thumbnailBuffer
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`❌ [CDN_SERVICE] Upload failed (${uploadResponse.status}): ${errorText}`);
          
          if (attempt === maxRetries) return false;

          // Wait before retrying (exponential backoff)
          const waitTime = 1000 * Math.pow(2, attempt - 1);
          console.log(`⏳ [CDN_SERVICE] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.log('✅ [CDN_SERVICE] Thumbnail uploaded successfully!');
        return true;
      } catch (error) {
        console.error(`❌ [CDN_SERVICE] Thumbnail upload attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          console.error('❌ [CDN_SERVICE] All thumbnail upload attempts exhausted');
          return false;
        }

        // Wait before retrying
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ [CDN_SERVICE] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return false;
  }

  /**
   * Generate thumbnail URL for video
   */
  generateThumbnailUrl(videoId: string): string | null {
    if (!videoId) return null;
    
    const cleanedHost = this.config.hostname.startsWith('vz-') ? 
                       this.config.hostname : 
                       `vz-${this.config.hostname}`;
    
    return `https://${cleanedHost}/${videoId}/thumbnail.jpg`;
  }

  /**
   * Generate preview URL for video
   */
  generatePreviewUrl(videoId: string): string | null {
    if (!videoId) return null;
    
    const cleanedHost = this.config.hostname.startsWith('vz-') ? 
                       this.config.hostname : 
                       `vz-${this.config.hostname}`;
    
    return `https://${cleanedHost}/${videoId}/preview.webp`;
  }

  /**
   * Extract video ID from iframe URL
   */
  extractVideoIdFromIframeUrl(iframeUrl: string): string | null {
    try {
      const url = new URL(iframeUrl);
      const pathParts = url.pathname.split('/');
      const videoId = pathParts[pathParts.length - 1];

      if (videoId && videoId.length > 0) {
        console.log('🆔 [CDN_SERVICE] Extracted video ID from iframe:', videoId);
        return videoId;
      }

      console.error('❌ [CDN_SERVICE] Could not extract video ID from iframe URL');
      return null;
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Error parsing iframe URL:', error);
      return null;
    }
  }

  /**
   * Delete video from CDN
   */
  async deleteVideo(videoGuid: string): Promise<boolean> {
    try {
      console.log(`🗑️ [CDN_SERVICE] Deleting video: ${videoGuid}`);

      const deleteUrl = `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${videoGuid}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.apiKey
        }
      });

      if (!response.ok) {
        console.error(`❌ [CDN_SERVICE] Delete failed: ${response.status}`);
        return false;
      }

      console.log('✅ [CDN_SERVICE] Video deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Delete error:', error);
      return false;
    }
  }

  /**
   * Get video information from CDN
   */
  async getVideoInfo(videoGuid: string): Promise<any> {
    try {
      const infoUrl = `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${videoGuid}`;
      
      const response = await fetch(infoUrl, {
        headers: {
          'AccessKey': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get video info: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Get video info error:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  
  private validateConfig(): void {
    if (!this.config.libraryId || !this.config.apiKey || !this.config.hostname) {
      throw new Error('CDN configuration incomplete: libraryId, apiKey, and hostname are required');
    }
  }

  private async createVideoObject(filename: string): Promise<string | null> {
    try {
      console.log('📝 [CDN_SERVICE] Creating video object for:', filename);

      const response = await fetch(`https://video.bunnycdn.com/library/${this.config.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AccessKey': this.config.apiKey
        },
        body: JSON.stringify({
          title: filename.replace(/\.[^/.]+$/, '') // Remove extension
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CDN_SERVICE] Failed to create video object:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('✅ [CDN_SERVICE] Video object created:', data.guid);
      
      return data.guid;
    } catch (error) {
      console.error('❌ [CDN_SERVICE] Create video object error:', error);
      return null;
    }
  }

  private async streamVideoToCDN(sourceUrl: string, videoGuid: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 [CDN_SERVICE] Stream attempt ${attempt}/${maxRetries}`);

        // Download video from source
        const sourceResponse = await this.fetchSourceVideo(sourceUrl);
        if (!sourceResponse) {
          continue;
        }

        // Get video buffer
        const videoBuffer = await sourceResponse.arrayBuffer();
        console.log(`✅ [CDN_SERVICE] Downloaded ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

        // Upload to CDN
        const uploadSuccess = await this.uploadBufferToCDN(videoGuid, videoBuffer);
        if (uploadSuccess) {
          console.log('✅ [CDN_SERVICE] Stream upload successful');
          return true;
        }

        if (attempt < maxRetries) {
          const retryDelay = Math.min(10000, 2000 * Math.pow(2, attempt - 1));
          console.log(`🔄 [CDN_SERVICE] Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`❌ [CDN_SERVICE] Stream attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const retryDelay = Math.min(15000, 3000 * Math.pow(2, attempt - 1));
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    console.error('❌ [CDN_SERVICE] All stream attempts failed');
    return false;
  }

  private async fetchSourceVideo(sourceUrl: string): Promise<Response | null> {
    console.log('🔍 [CDN_SERVICE] Fetching source video...');

    const sourceResponse = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': this.getRefererForUrl(sourceUrl),
        'Accept': 'video/mp4,video/*,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!sourceResponse.ok) {
      console.error('❌ [CDN_SERVICE] Failed to fetch source:', sourceResponse.status);
      return null;
    }

    // Validate content type
    const contentType = sourceResponse.headers.get('content-type');
    if (contentType && !contentType.startsWith('video/')) {
      console.error('❌ [CDN_SERVICE] Invalid content type:', contentType);
      return null;
    }

    return sourceResponse;
  }

  private async uploadBufferToCDN(videoGuid: string, videoBuffer: ArrayBuffer): Promise<boolean> {
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${videoGuid}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.apiKey,
          'Content-Type': 'video/mp4'
        },
        body: videoBuffer,
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ [CDN_SERVICE] Buffer upload failed: ${uploadResponse.status} ${errorText}`);
      return false;
    }

    return true;
  }

  private async performRetryLoop(buffer: Buffer, filename: string): Promise<{
    iframeUrl: string;
    directUrl: string; 
    guid: string;
  } | null> {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.attemptUpload(buffer, filename, attempt, MAX_RETRIES);
        if (result) {
          return result;
        }

        if (attempt < MAX_RETRIES) {
          const backoffDelay = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
          console.log(`⏳ [CDN_SERVICE] Waiting ${backoffDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } catch (error) {
        console.error(`❌ [CDN_SERVICE] Attempt ${attempt} failed:`, error);

        if (attempt === MAX_RETRIES) {
          console.error('❌ [CDN_SERVICE] All retry attempts exhausted');
          return null;
        }

        const backoffDelay = Math.min(60000, 3000 * Math.pow(2, attempt - 1));
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    return null;
  }

  private async attemptUpload(buffer: Buffer, filename: string, attempt: number, maxRetries: number) {
    console.log(`🔄 [CDN_SERVICE] Upload attempt ${attempt}/${maxRetries}`);

    const timeout = 120000 + 60000 * (attempt - 1); // 120s, 180s, 240s

    // Create video object
    const videoGuid = await this.createVideoObjectWithTimeout(filename, timeout);
    if (!videoGuid) return null;

    // Upload buffer
    const uploadSuccess = await this.uploadBufferWithTimeout(videoGuid, buffer, timeout);
    if (!uploadSuccess) return null;

    // Return URLs
    return {
      iframeUrl: this.buildIframeUrl(videoGuid),
      directUrl: this.buildDirectUrl(videoGuid),
      guid: videoGuid
    };
  }

  private async createVideoObjectWithTimeout(filename: string, timeout: number): Promise<string | null> {
    const createResponse = await Promise.race([
      fetch(`https://video.bunnycdn.com/library/${this.config.libraryId}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: filename.replace(/\.[^/.]+$/, '')
        })
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Create timeout after ${timeout}ms`)), timeout)
      )
    ]);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [CDN_SERVICE] Create failed:', createResponse.status, errorText);
      return null;
    }

    const videoObject = await createResponse.json();
    return videoObject.guid;
  }

  private async uploadBufferWithTimeout(videoGuid: string, buffer: Buffer, timeout: number): Promise<boolean> {
    const uploadResponse = await Promise.race([
      fetch(`https://video.bunnycdn.com/library/${this.config.libraryId}/videos/${videoGuid}`, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Upload timeout after ${timeout}ms`)), timeout)
      )
    ]);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [CDN_SERVICE] Upload failed:', uploadResponse.status, errorText);
      return false;
    }

    return true;
  }

  private buildIframeUrl(videoGuid: string): string {
    return `https://iframe.mediadelivery.net/embed/${this.config.libraryId}/${videoGuid}`;
  }

  private buildDirectUrl(videoGuid: string): string {
    const cleanHostname = this.config.hostname.startsWith('vz-') ? 
                         this.config.hostname : 
                         `vz-${this.config.hostname}`;
    return `https://${cleanHostname}/${videoGuid}/play_720p.mp4`;
  }

  private getRefererForUrl(url: string): string {
    if (url.includes('instagram')) return 'https://www.instagram.com/';
    if (url.includes('tiktok')) return 'https://www.tiktok.com/';
    return '';
  }
}