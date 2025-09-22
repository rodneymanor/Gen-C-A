/**
 * Video Processing Services - Main export file
 * Extracted from React application for reusable video processing pipeline
 *
 * This package provides a complete video processing pipeline with:
 * - Multi-platform video download (TikTok, Instagram, YouTube)
 * - CDN integration (Bunny.net) with streaming and thumbnail support
 * - Transcription services with multiple provider support
 * - AI-powered content analysis (script components, sentiment, visuals)
 * - Background job orchestration with retry patterns
 * - Pipeline orchestration with error handling and fallbacks
 */

import { VideoProcessingService } from './video-processing-service';
import { VideoDownloadService } from './video-download-service';
import { CDNService } from './cdn-service';
import { TranscriptionService } from './transcription-service';
import { AIAnalysisService } from './ai-analysis-service';
import { BackgroundJobService } from './background-job-service';
import { PipelineOrchestrator } from './pipeline-orchestrator';
import type { VideoProcessingOptions } from './video-processing-service';
import type { PipelineConfig } from './pipeline-orchestrator';

// Main services
export {
  VideoProcessingService,
  VideoDownloadService,
  CDNService,
  TranscriptionService,
  AIAnalysisService,
  BackgroundJobService,
  PipelineOrchestrator
};

// Service interfaces and types
export * from './service-interfaces';

// Re-export common types for convenience
export type {
  VideoProcessingOptions,
  VideoProcessingResult,
  VideoDocument,
  ScrapedVideoData,
  VideoMetrics
} from './video-processing-service';

export type { VideoDownloadResult } from './video-download-service';
export type { CDNUploadResult } from './cdn-service';
export type { TranscriptionResult } from './transcription-service';
export type { ScriptComponents } from './ai-analysis-service';
export type { ContentMetadata, BackgroundJobStatus } from './service-interfaces';
export type { PipelineExecutionResult, PipelineContext, PipelineConfig } from './pipeline-orchestrator';

// Factory functions for easy setup
export function createVideoProcessingPipeline(config: PipelineConfig) {
  const downloadService = new VideoDownloadService();
  const cdnService = new CDNService(config.cdn);
  const transcriptionService = new TranscriptionService();
  const aiAnalysisService = new AIAnalysisService();
  const backgroundJobService = new BackgroundJobService();

  const videoProcessingService = new VideoProcessingService(
    downloadService,
    cdnService,
    transcriptionService,
    aiAnalysisService,
    backgroundJobService
  );

  const pipelineOrchestrator = new PipelineOrchestrator(config, {
    downloadService,
    cdnService,
    transcriptionService,
    aiAnalysisService,
    backgroundJobService
  });

  return {
    videoProcessingService,
    pipelineOrchestrator,
    services: {
      download: downloadService,
      cdn: cdnService,
      transcription: transcriptionService,
      aiAnalysis: aiAnalysisService,
      backgroundJobs: backgroundJobService
    }
  };
}

// Default configuration factory
export function createDefaultPipelineConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    maxRetries: 3,
    operationTimeout: 120000, // 2 minutes
    enableParallelProcessing: true,
    backgroundProcessing: {
      enabled: true,
      queuePriority: 'normal',
      maxConcurrentJobs: 5,
      jobTimeout: 300000 // 5 minutes
    },
    fallbackBehavior: 'partial',
    cdn: {
      libraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '',
      apiKey: process.env.BUNNY_STREAM_API_KEY || '',
      hostname: process.env.BUNNY_CDN_HOSTNAME || ''
    },
    services: {
      download: {
        retries: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2
        },
        timeouts: {
          connection: 30000,
          request: 60000,
          total: 120000
        },
        healthCheck: {
          interval: 60000,
          timeout: 5000,
          retries: 3
        }
      },
      transcription: {
        retries: {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffMultiplier: 2
        },
        timeouts: {
          connection: 30000,
          request: 180000, // 3 minutes for transcription
          total: 300000    // 5 minutes total
        },
        healthCheck: {
          interval: 120000,
          timeout: 10000,
          retries: 2
        }
      },
      analysis: {
        retries: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2
        },
        timeouts: {
          connection: 30000,
          request: 60000,
          total: 120000
        },
        healthCheck: {
          interval: 60000,
          timeout: 5000,
          retries: 3
        }
      },
      background: {
        retries: {
          maxAttempts: 5,
          baseDelay: 5000,
          maxDelay: 300000, // 5 minutes
          backoffMultiplier: 2
        },
        timeouts: {
          connection: 30000,
          request: 600000,  // 10 minutes for background jobs
          total: 900000     // 15 minutes total
        },
        healthCheck: {
          interval: 30000,
          timeout: 5000,
          retries: 2
        }
      }
    },
    ...overrides
  };
}

// Quick setup function for common use cases
export function createQuickVideoProcessor(options: {
  bunnyConfig: {
    libraryId: string;
    apiKey: string;
    hostname: string;
  };
  enableBackground?: boolean;
  maxRetries?: number;
} = {
  bunnyConfig: {
    libraryId: process.env.BUNNY_STREAM_LIBRARY_ID || '',
    apiKey: process.env.BUNNY_STREAM_API_KEY || '',
    hostname: process.env.BUNNY_CDN_HOSTNAME || ''
  }
}) {
  const config = createDefaultPipelineConfig({
    cdn: options.bunnyConfig,
    backgroundProcessing: {
      enabled: options.enableBackground ?? true,
      queuePriority: 'normal',
      maxConcurrentJobs: 3,
      jobTimeout: 300000
    },
    maxRetries: options.maxRetries ?? 3
  });

  return createVideoProcessingPipeline(config);
}

// Utility functions for common operations
export async function processVideoUrl(
  url: string,
  options: VideoProcessingOptions = {}
) {
  const { videoProcessingService } = createQuickVideoProcessor();
  return videoProcessingService.processVideo(url, options);
}

export async function downloadVideoOnly(url: string) {
  const downloadService = new VideoDownloadService();
  return downloadService.downloadVideo(url);
}

export async function transcribeVideoUrl(url: string, platform: string = 'unknown') {
  const transcriptionService = new TranscriptionService();
  return transcriptionService.transcribeFromUrl(url, platform);
}

export async function analyzeVideoScript(transcript: string) {
  const aiAnalysisService = new AIAnalysisService();
  return aiAnalysisService.analyzeScriptComponents(transcript);
}

// Health check utilities
export async function checkServicesHealth() {
  const { pipelineOrchestrator } = createQuickVideoProcessor();
  return pipelineOrchestrator.getHealthStatus();
}

// Constants and defaults
export const DEFAULT_SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'youtube'];
export const DEFAULT_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
export const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const DEFAULT_MAX_DURATION = 300; // 5 minutes

// Version info
export const VERSION = '1.0.0';
export const EXTRACTED_FROM = 'React Video Processing Application';
export const LAST_UPDATED = '2024-01-XX'; // Update with actual date

/**
 * Usage Examples:
 * 
 * // Quick setup and processing
 * const result = await processVideoUrl('https://www.tiktok.com/@user/video/123456789');
 * 
 * // Advanced setup with custom config
 * const config = createDefaultPipelineConfig({
 *   backgroundProcessing: { enabled: false },
 *   maxRetries: 5
 * });
 * const { videoProcessingService } = createVideoProcessingPipeline(config);
 * const result = await videoProcessingService.processVideo(url, { 
 *   title: 'My Video',
 *   skipTranscription: false 
 * });
 * 
 * // Individual service usage
 * const downloadService = new VideoDownloadService();
 * const downloadResult = await downloadService.downloadVideo(url);
 * 
 * // Health monitoring
 * const healthStatus = await checkServicesHealth();
 * console.log('Pipeline health:', healthStatus.overall);
 */
