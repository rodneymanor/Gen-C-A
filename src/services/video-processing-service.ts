/**
 * VideoProcessingService - Core video processing orchestrator
 * Extracted from React application for reusable video processing pipeline
 */

import { VideoDownloadService } from './video-download-service';
import { CDNService } from './cdn-service';
import { TranscriptionService } from './transcription-service';
import { AIAnalysisService } from './ai-analysis-service';
import { BackgroundJobService } from './background-job-service';

export interface VideoProcessingOptions {
  /**
   * Collection ID to add video to (optional)
   */
  collectionId?: string;
  
  /**
   * Custom title for the video
   */
  title?: string;
  
  /**
   * Custom thumbnail URL
   */
  thumbnailUrl?: string;
  
  /**
   * Pre-scraped video data to avoid re-downloading
   */
  scrapedData?: ScrapedVideoData;
  
  /**
   * Skip transcription step
   */
  skipTranscription?: boolean;
  
  /**
   * Skip AI analysis step
   */
  skipAIAnalysis?: boolean;
  
  /**
   * Process in background (fire-and-forget)
   */
  background?: boolean;
}

export interface ScrapedVideoData {
  platform: string;
  author: string;
  description: string;
  hashtags: string[];
  metrics: VideoMetrics;
  videoUrl: string;
  thumbnailUrl?: string;
  metadata: {
    duration?: number;
    timestamp?: string;
    shortCode?: string;
  };
}

export interface VideoMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  saves?: number;
}

export interface VideoProcessingResult {
  success: boolean;
  videoId?: string;
  platform?: string;
  iframeUrl?: string;
  directUrl?: string;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

export interface VideoDocument {
  id: string;
  originalUrl: string;
  title: string;
  platform: string;
  iframeUrl: string;
  directUrl: string;
  guid: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  metrics: VideoMetrics;
  metadata: Record<string, any>;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  components?: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata?: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Main video processing service that orchestrates the complete pipeline
 */
export class VideoProcessingService {
  private downloadService: VideoDownloadService;
  private cdnService: CDNService;
  private transcriptionService: TranscriptionService;
  private aiAnalysisService: AIAnalysisService;
  private backgroundJobService: BackgroundJobService;

  constructor(
    downloadService: VideoDownloadService,
    cdnService: CDNService,
    transcriptionService: TranscriptionService,
    aiAnalysisService: AIAnalysisService,
    backgroundJobService: BackgroundJobService
  ) {
    this.downloadService = downloadService;
    this.cdnService = cdnService;
    this.transcriptionService = transcriptionService;
    this.aiAnalysisService = aiAnalysisService;
    this.backgroundJobService = backgroundJobService;
  }

  /**
   * Process a video through the complete pipeline
   */
  async processVideo(
    videoUrl: string, 
    options: VideoProcessingOptions = {}
  ): Promise<VideoProcessingResult> {
    try {
      console.log('🚀 [VIDEO_PROCESSING] Starting complete video processing workflow...');
      
      const decodedUrl = decodeURIComponent(videoUrl);
      console.log('🔍 [VIDEO_PROCESSING] Processing URL:', decodedUrl);

      // Step 1: Download or use pre-scraped data
      console.log('📥 [VIDEO_PROCESSING] Step 1: Processing video...');
      const downloadResult = await this.handleVideoDownload(decodedUrl, options.scrapedData);

      if (!downloadResult.success) {
        return {
          success: false,
          transcriptionStatus: 'failed',
          error: downloadResult.error || 'Failed to download video'
        };
      }

      // Step 2: Stream to CDN
      console.log('🎬 [VIDEO_PROCESSING] Step 2: Streaming to CDN...');
      const streamResult = await this.handleCDNUpload(downloadResult.data, options.scrapedData);

      if (!streamResult.success) {
        return {
          success: false,
          transcriptionStatus: 'failed',
          error: streamResult.error || 'Failed to stream video to CDN'
        };
      }

      // Step 2.5: Upload custom thumbnail if available
      await this.handleThumbnailUpload(downloadResult.data.thumbnailUrl, streamResult.guid, options.thumbnailUrl);

      // Step 3: Create video document
      console.log('💾 [VIDEO_PROCESSING] Step 3: Creating video document...');
      const videoDocument = this.createVideoDocument(
        decodedUrl,
        downloadResult.data,
        streamResult,
        options
      );

      // Step 4: Handle transcription and analysis
      if (!options.skipTranscription || !options.skipAIAnalysis) {
        if (options.background) {
          // Start background processing
          this.backgroundJobService.startBackgroundTranscription(
            videoDocument,
            downloadResult.data,
            streamResult,
            {
              skipTranscription: options.skipTranscription,
              skipAIAnalysis: options.skipAIAnalysis
            }
          );
        } else {
          // Process synchronously
          await this.handleTranscriptionAndAnalysis(
            videoDocument,
            downloadResult.data,
            streamResult,
            options
          );
        }
      }

      console.log('✅ [VIDEO_PROCESSING] Complete workflow successful!');

      return {
        success: true,
        videoId: videoDocument.id,
        platform: downloadResult.data.platform,
        iframeUrl: streamResult.iframeUrl,
        directUrl: streamResult.directUrl,
        transcriptionStatus: options.skipTranscription ? 'completed' : 
                          (options.background ? 'processing' : 'completed'),
        message: options.background ? 
                'Video processed successfully. Transcription in progress.' :
                'Video processed and analyzed successfully.'
      };
    } catch (error) {
      console.error('❌ [VIDEO_PROCESSING] Workflow error:', error);
      return {
        success: false,
        transcriptionStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle video download step
   */
  private async handleVideoDownload(url: string, scrapedData?: ScrapedVideoData) {
    if (scrapedData) {
      console.log('🔄 [VIDEO_PROCESSING] Using pre-scraped data to avoid re-download');
      return {
        success: true,
        data: {
          platform: scrapedData.platform,
          videoData: {
            buffer: new ArrayBuffer(0), // Will be downloaded during streaming
            size: 0,
            mimeType: 'video/mp4',
            filename: `${scrapedData.platform}-${Date.now()}.mp4`
          },
          metrics: scrapedData.metrics,
          additionalMetadata: {
            author: scrapedData.author,
            description: scrapedData.description,
            hashtags: scrapedData.hashtags,
            duration: scrapedData.metadata?.duration || 0,
            timestamp: scrapedData.metadata?.timestamp
          },
          thumbnailUrl: scrapedData.thumbnailUrl,
          videoUrl: scrapedData.videoUrl,
          metadata: {
            originalUrl: url,
            platform: scrapedData.platform,
            downloadedAt: new Date().toISOString(),
            shortCode: scrapedData.metadata?.shortCode,
            thumbnailUrl: scrapedData.thumbnailUrl
          }
        }
      };
    } else {
      // Use download service
      const result = await this.downloadService.downloadVideo(url);
      return result ? { success: true, data: result } : { success: false, error: 'Download failed' };
    }
  }

  /**
   * Handle CDN upload step
   */
  private async handleCDNUpload(downloadData: any, scrapedData?: ScrapedVideoData) {
    if (scrapedData?.videoUrl) {
      // Stream directly from scraped video URL
      console.log('🌊 [VIDEO_PROCESSING] Streaming directly from scraped video URL');
      const result = await this.cdnService.streamFromUrl(
        scrapedData.videoUrl,
        `${scrapedData.platform}-${Date.now()}.mp4`
      );
      return result || { success: false, error: 'Failed to stream from video URL' };
    } else {
      // Traditional buffer upload
      const result = await this.cdnService.uploadBuffer(downloadData.videoData);
      return result || { success: false, error: 'Failed to upload to CDN' };
    }
  }

  /**
   * Handle thumbnail upload
   */
  private async handleThumbnailUpload(
    downloadThumbnailUrl?: string,
    videoGuid?: string,
    customThumbnailUrl?: string
  ) {
    const thumbnailUrl = customThumbnailUrl || downloadThumbnailUrl;
    
    if (thumbnailUrl && videoGuid) {
      console.log('🖼️ [VIDEO_PROCESSING] Uploading custom thumbnail...');
      try {
        const success = await this.cdnService.uploadThumbnail(videoGuid, thumbnailUrl);
        if (success) {
          console.log('✅ [VIDEO_PROCESSING] Custom thumbnail uploaded successfully');
        } else {
          console.log('⚠️ [VIDEO_PROCESSING] Custom thumbnail upload failed, using default');
        }
      } catch (error) {
        console.error('❌ [VIDEO_PROCESSING] Thumbnail upload error:', error);
      }
    }
  }

  /**
   * Create video document structure
   */
  private createVideoDocument(
    originalUrl: string,
    downloadData: any,
    streamResult: any,
    options: VideoProcessingOptions
  ): VideoDocument {
    return {
      id: this.generateId(),
      originalUrl,
      title: options.title || `Video from ${downloadData.platform}`,
      platform: downloadData.platform,
      iframeUrl: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      guid: streamResult.guid,
      thumbnailUrl: streamResult.thumbnailUrl || 
                   this.cdnService.generateThumbnailUrl(streamResult.guid) ||
                   downloadData.thumbnailUrl,
      previewUrl: streamResult.previewUrl || 
                 this.cdnService.generatePreviewUrl(streamResult.guid),
      metrics: downloadData.metrics || {},
      metadata: {
        ...downloadData.metadata,
        ...downloadData.additionalMetadata
      },
      transcriptionStatus: 'pending',
      userId: options.collectionId, // This would typically be user ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Handle transcription and AI analysis
   */
  private async handleTranscriptionAndAnalysis(
    videoDocument: VideoDocument,
    downloadData: any,
    streamResult: any,
    options: VideoProcessingOptions
  ) {
    if (!options.skipTranscription) {
      console.log('🎙️ [VIDEO_PROCESSING] Starting transcription...');
      
      // Use CDN URL for transcription if available
      const transcriptionUrl = streamResult.directUrl || streamResult.iframeUrl;
      const transcriptionResult = await this.transcriptionService.transcribeFromUrl(
        transcriptionUrl,
        downloadData.platform
      );

      if (transcriptionResult?.transcript && !options.skipAIAnalysis) {
        console.log('🔍 [VIDEO_PROCESSING] Starting AI analysis...');
        
        // Analyze script components
        const components = await this.aiAnalysisService.analyzeScriptComponents(
          transcriptionResult.transcript
        );

        // Analyze visuals if URL is available
        let visualContext = '';
        if (transcriptionUrl) {
          visualContext = await this.aiAnalysisService.analyzeVisuals(transcriptionUrl) || '';
        }

        // Update video document
        videoDocument.transcript = transcriptionResult.transcript;
        videoDocument.components = components || {
          hook: 'Analysis pending',
          bridge: 'Analysis pending', 
          nugget: 'Analysis pending',
          wta: 'Analysis pending'
        };
        videoDocument.contentMetadata = {
          platform: downloadData.platform,
          author: downloadData.additionalMetadata?.author || 'Unknown',
          description: downloadData.additionalMetadata?.description || '',
          source: 'other',
          hashtags: downloadData.additionalMetadata?.hashtags || []
        };
        videoDocument.visualContext = visualContext;
        videoDocument.transcriptionStatus = 'completed';
        videoDocument.updatedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Generate unique ID for video document
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get processing status for a video
   */
  async getProcessingStatus(videoId: string): Promise<{
    status: string;
    progress?: number;
    error?: string;
  }> {
    // This would typically query a database or cache
    return { status: 'completed' };
  }

  /**
   * Cancel processing for a video
   */
  async cancelProcessing(videoId: string): Promise<boolean> {
    return this.backgroundJobService.cancelJob(videoId);
  }
}