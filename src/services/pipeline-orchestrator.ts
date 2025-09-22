/**
 * PipelineOrchestrator - Central orchestration for video processing pipeline
 * Coordinates all video processing services with error handling and retry patterns
 */

import { VideoDownloadService, type VideoDownloadResult } from './video-download-service';
import { CDNService, type CDNUploadResult } from './cdn-service';
import { TranscriptionService, type TranscriptionResult } from './transcription-service';
import { AIAnalysisService, type ScriptComponents } from './ai-analysis-service';
import { BackgroundJobService } from './background-job-service';

export interface PipelineConfig {
  /**
   * Maximum number of retry attempts for failed operations
   */
  maxRetries: number;
  
  /**
   * Timeout for individual operations (ms)
   */
  operationTimeout: number;
  
  /**
   * Enable parallel processing where possible
   */
  enableParallelProcessing: boolean;
  
  /**
   * Background processing options
   */
  backgroundProcessing: {
    enabled: boolean;
    queuePriority: 'low' | 'normal' | 'high';
    maxConcurrentJobs?: number;
    jobTimeout?: number;
  };
  
  /**
   * Fallback behavior on failures
   */
  fallbackBehavior: 'fail' | 'partial' | 'continue';
  
  /**
   * CDN configuration
   */
  cdn: {
    libraryId: string;
    apiKey: string;
    hostname: string;
  };
}

export interface PipelineStepResult {
  success: boolean;
  step: string;
  duration: number;
  error?: string;
  data?: any;
  retries?: number;
}

export interface PipelineExecutionResult {
  success: boolean;
  videoId?: string;
  totalDuration: number;
  steps: PipelineStepResult[];
  finalResult?: {
    platform: string;
    iframeUrl: string;
    directUrl: string;
    thumbnailUrl?: string;
    transcriptionStatus: string;
  };
  errors: string[];
  warnings: string[];
}

export interface PipelineContext {
  videoUrl: string;
  options: {
    title?: string;
    collectionId?: string;
    skipTranscription?: boolean;
    skipAnalysis?: boolean;
    customThumbnail?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  metadata: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    startTime: number;
  };
}

/**
 * Central pipeline orchestrator for video processing
 */
export class PipelineOrchestrator {
  private downloadService: VideoDownloadService;
  private cdnService: CDNService;
  private transcriptionService: TranscriptionService;
  private aiAnalysisService: AIAnalysisService;
  private backgroundJobService: BackgroundJobService;
  private config: PipelineConfig;

  constructor(
    config: PipelineConfig,
    services?: {
      downloadService?: VideoDownloadService;
      cdnService?: CDNService;
      transcriptionService?: TranscriptionService;
      aiAnalysisService?: AIAnalysisService;
      backgroundJobService?: BackgroundJobService;
    }
  ) {
    this.config = config;
    
    // Initialize services with provided instances or create new ones
    this.downloadService = services?.downloadService || new VideoDownloadService();
    this.cdnService = services?.cdnService || new CDNService(config.cdn);
    this.transcriptionService = services?.transcriptionService || new TranscriptionService();
    this.aiAnalysisService = services?.aiAnalysisService || new AIAnalysisService();
    this.backgroundJobService = services?.backgroundJobService || new BackgroundJobService();

    // Start background job service if enabled
    if (this.config.backgroundProcessing.enabled) {
      this.backgroundJobService.start();
    }
  }

  /**
   * Execute complete video processing pipeline
   */
  async execute(context: PipelineContext): Promise<PipelineExecutionResult> {
    console.log('🚀 [PIPELINE] Starting video processing pipeline...');
    console.log('📝 [PIPELINE] Context:', {
      url: context.videoUrl.substring(0, 100) + '...',
      options: context.options,
      userId: context.metadata.userId
    });

    const startTime = Date.now();
    const steps: PipelineStepResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let videoId: string | undefined;

    try {
      // Step 1: Download video
      const downloadResult = await this.executeStep(
        'download',
        () => this.downloadService.downloadVideo(context.videoUrl),
        context
      );
      
      steps.push(downloadResult);

      if (!downloadResult.success) {
        errors.push(`Download failed: ${downloadResult.error}`);
        if (this.config.fallbackBehavior === 'fail') {
          return this.createFailureResult(startTime, steps, errors, warnings);
        }
      }

      // Step 2: CDN Upload
      const cdnResult = await this.executeStep(
        'cdn_upload',
        () => this.uploadToCDN(downloadResult.data),
        context
      );

      steps.push(cdnResult);

      if (!cdnResult.success) {
        errors.push(`CDN upload failed: ${cdnResult.error}`);
        if (this.config.fallbackBehavior === 'fail') {
          return this.createFailureResult(startTime, steps, errors, warnings);
        }
      }

      // Step 3: Create video document
      videoId = this.generateVideoId();
      console.log('💾 [PIPELINE] Created video document:', videoId);

      // Step 4: Handle transcription and analysis
      const processingResult = await this.handleTranscriptionAndAnalysis(
        context,
        downloadResult.data,
        cdnResult.data,
        videoId
      );

      steps.push(...processingResult.steps);
      errors.push(...processingResult.errors);
      warnings.push(...processingResult.warnings);

      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [PIPELINE] Pipeline completed in ${totalDuration}ms`);

      return {
        success: errors.length === 0 || this.config.fallbackBehavior !== 'fail',
        videoId,
        totalDuration,
        steps,
        finalResult: cdnResult.success ? {
          platform: downloadResult.data?.platform || 'unknown',
          iframeUrl: cdnResult.data?.iframeUrl || '',
          directUrl: cdnResult.data?.directUrl || '',
          thumbnailUrl: cdnResult.data?.thumbnailUrl,
          transcriptionStatus: processingResult.transcriptionStatus || 'pending'
        } : undefined,
        errors,
        warnings
      };
    } catch (error) {
      console.error('❌ [PIPELINE] Pipeline execution failed:', error);
      errors.push(`Pipeline execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return this.createFailureResult(startTime, steps, errors, warnings, videoId);
    }
  }

  /**
   * Execute pipeline in background mode
   */
  async executeBackground(context: PipelineContext): Promise<{ jobId: string; estimatedDuration: number }> {
    console.log('🔄 [PIPELINE] Starting background pipeline execution...');

    // Quick validation first
    const validationResult = await this.validateInput(context);
    if (!validationResult.valid) {
      throw new Error(`Pipeline validation failed: ${validationResult.error}`);
    }

    // Start background job
    const jobId = await this.backgroundJobService.startBackgroundTranscription(
      {
        id: this.generateVideoId(),
        originalUrl: context.videoUrl,
        title: context.options.title || 'Background Video Processing',
        platform: 'unknown',
        iframeUrl: '',
        directUrl: '',
        guid: '',
        metrics: {},
        metadata: {},
        transcriptionStatus: 'pending',
        userId: context.metadata.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        platform: 'unknown',
        videoData: {
          buffer: new ArrayBuffer(0),
          size: 0,
          mimeType: 'video/mp4',
          filename: 'background.mp4'
        },
        metrics: {},
        additionalMetadata: {
          author: 'unknown',
          description: '',
          hashtags: [],
          duration: 0
        }
      },
      {
        iframeUrl: '',
        directUrl: ''
      },
      {
        skipTranscription: context.options.skipTranscription,
        skipAIAnalysis: context.options.skipAnalysis,
        priority: context.options.priority || this.config.backgroundProcessing.queuePriority
      }
    );

    return {
      jobId,
      estimatedDuration: this.estimateProcessingTime(context)
    };
  }

  /**
   * Get pipeline execution status
   */
  async getExecutionStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    estimatedTimeRemaining?: number;
    currentStep?: string;
    error?: string;
  }> {
    const job = await this.backgroundJobService.getJobStatus(jobId);
    
    if (!job) {
      return {
        status: 'not_found',
        progress: 0
      };
    }

    return {
      status: job.status,
      progress: job.progress,
      currentStep: `${job.type}_${job.status}`,
      error: job.error
    };
  }

  /**
   * Cancel pipeline execution
   */
  async cancelExecution(jobId: string): Promise<boolean> {
    console.log(`🛑 [PIPELINE] Cancelling execution: ${jobId}`);
    return this.backgroundJobService.cancelJob(jobId);
  }

  /**
   * Get pipeline health status
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      details?: string;
    }>;
    metrics: {
      activeJobs: number;
      completedJobs: number;
      failedJobs: number;
      avgProcessingTime: number;
    };
  }> {
    const jobStats = await this.backgroundJobService.getStats();
    const transcriptionProviders = this.transcriptionService.getProviderStatus();
    const aiProviders = this.aiAnalysisService.getProviderStatus();

    const services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      details?: string;
    }> = [
      {
        name: 'Video Download',
        status: 'healthy' as const,
        details: 'Multi-platform download service operational'
      },
      {
        name: 'CDN Service',
        status: this.cdnService ? 'healthy' : 'unhealthy' as const,
        details: this.cdnService ? 'Bunny CDN integration active' : 'CDN service not configured'
      },
      {
        name: 'Transcription',
        status: transcriptionProviders.some(p => p.available) ? 'healthy' : 'degraded' as const,
        details: `${transcriptionProviders.filter(p => p.available).length}/${transcriptionProviders.length} providers available`
      },
      {
        name: 'AI Analysis',
        status: aiProviders.some(p => p.available) ? 'healthy' : 'degraded' as const,
        details: `${aiProviders.filter(p => p.available).length}/${aiProviders.length} providers available`
      },
      {
        name: 'Background Jobs',
        status: jobStats.failed > jobStats.completed * 0.1 ? 'degraded' : 'healthy' as const,
        details: `${jobStats.running} active, ${jobStats.pending} pending`
      }
    ];

    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 1) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      services,
      metrics: {
        activeJobs: jobStats.running,
        completedJobs: jobStats.completed,
        failedJobs: jobStats.failed,
        avgProcessingTime: 45000 // Mock average - would calculate from historical data
      }
    };
  }

  /**
   * Shutdown pipeline orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('⏹️ [PIPELINE] Shutting down pipeline orchestrator...');
    
    if (this.config.backgroundProcessing.enabled) {
      this.backgroundJobService.stop();
    }

    // Wait for active jobs to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < shutdownTimeout) {
      const stats = await this.backgroundJobService.getStats();
      if (stats.running === 0) {
        break;
      }
      
      console.log(`⏳ [PIPELINE] Waiting for ${stats.running} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ [PIPELINE] Pipeline orchestrator shutdown complete');
  }

  /**
   * Private helper methods
   */

  private async executeStep<T>(
    stepName: string,
    operation: () => Promise<T>,
    context: PipelineContext
  ): Promise<PipelineStepResult> {
    console.log(`🔄 [PIPELINE] Executing step: ${stepName}`);
    const startTime = Date.now();
    let retries = 0;

    while (retries <= this.config.maxRetries) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), this.config.operationTimeout)
          )
        ]);

        const duration = Date.now() - startTime;
        console.log(`✅ [PIPELINE] Step ${stepName} completed in ${duration}ms`);

        return {
          success: true,
          step: stepName,
          duration,
          data: result,
          retries
        };
      } catch (error) {
        console.error(`❌ [PIPELINE] Step ${stepName} failed (attempt ${retries + 1}):`, error);
        
        retries++;
        if (retries <= this.config.maxRetries) {
          const retryDelay = Math.min(30000, 1000 * Math.pow(2, retries - 1));
          console.log(`⏳ [PIPELINE] Retrying ${stepName} in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        const duration = Date.now() - startTime;
        return {
          success: false,
          step: stepName,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          retries
        };
      }
    }

    // This should never be reached, but included for type safety
    return {
      success: false,
      step: stepName,
      duration: Date.now() - startTime,
      error: 'Maximum retries exceeded',
      retries
    };
  }

  private async uploadToCDN(downloadResult: VideoDownloadResult | null): Promise<any> {
    if (!downloadResult?.success) {
      throw new Error('No download result available for CDN upload');
    }

    if (downloadResult.videoUrl) {
      // Stream from URL
      return this.cdnService.streamFromUrl(
        downloadResult.videoUrl,
        downloadResult.videoData.filename
      );
    } else {
      // Upload buffer
      return this.cdnService.uploadBuffer(downloadResult.videoData);
    }
  }

  private async handleTranscriptionAndAnalysis(
    context: PipelineContext,
    downloadData: any,
    cdnData: any,
    videoId: string
  ): Promise<{
    steps: PipelineStepResult[];
    errors: string[];
    warnings: string[];
    transcriptionStatus: string;
  }> {
    const steps: PipelineStepResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (context.options.skipTranscription && context.options.skipAnalysis) {
      return {
        steps,
        errors,
        warnings,
        transcriptionStatus: 'skipped'
      };
    }

    // Execute transcription and analysis based on background processing config
    if (this.config.backgroundProcessing.enabled) {
      console.log('🔄 [PIPELINE] Starting background transcription and analysis...');
      
      try {
        await this.backgroundJobService.startBackgroundTranscription(
          { id: videoId } as any,
          downloadData,
          cdnData,
          {
            skipTranscription: context.options.skipTranscription,
            skipAIAnalysis: context.options.skipAnalysis,
            priority: context.options.priority || this.config.backgroundProcessing.queuePriority
          }
        );

        steps.push({
          success: true,
          step: 'background_processing',
          duration: 100,
          data: { status: 'queued' }
        });

        return {
          steps,
          errors,
          warnings,
          transcriptionStatus: 'processing'
        };
      } catch (error) {
        errors.push(`Failed to start background processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        warnings.push('Falling back to synchronous processing');
      }
    }

    // Synchronous processing fallback
    if (!context.options.skipTranscription) {
      const transcriptionResult = await this.executeStep(
        'transcription',
        () => this.transcriptionService.transcribeFromUrl(
          cdnData?.directUrl || cdnData?.iframeUrl || context.videoUrl,
          downloadData?.platform || 'unknown'
        ),
        context
      );

      steps.push(transcriptionResult);

      if (!transcriptionResult.success) {
        errors.push(`Transcription failed: ${transcriptionResult.error}`);
      } else if (!context.options.skipAnalysis && transcriptionResult.data?.transcript) {
        const analysisResult = await this.executeStep(
          'ai_analysis',
          () => this.aiAnalysisService.analyzeScriptComponents(transcriptionResult.data.transcript),
          context
        );

        steps.push(analysisResult);

        if (!analysisResult.success) {
          warnings.push(`AI analysis failed: ${analysisResult.error}`);
        }
      }
    }

    return {
      steps,
      errors,
      warnings,
      transcriptionStatus: errors.length > 0 ? 'failed' : 'completed'
    };
  }

  private async validateInput(context: PipelineContext): Promise<{ valid: boolean; error?: string }> {
    if (!context.videoUrl || context.videoUrl.trim() === '') {
      return { valid: false, error: 'Video URL is required' };
    }

    try {
      new URL(context.videoUrl);
    } catch {
      return { valid: false, error: 'Invalid video URL format' };
    }

    // Additional platform-specific validation could be added here

    return { valid: true };
  }

  private createFailureResult(
    startTime: number,
    steps: PipelineStepResult[],
    errors: string[],
    warnings: string[],
    videoId?: string
  ): PipelineExecutionResult {
    return {
      success: false,
      videoId,
      totalDuration: Date.now() - startTime,
      steps,
      errors,
      warnings
    };
  }

  private generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateProcessingTime(context: PipelineContext): number {
    // Base processing time estimates (in milliseconds)
    let estimatedTime = 10000; // Base 10 seconds

    if (!context.options.skipTranscription) {
      estimatedTime += 30000; // Add 30 seconds for transcription
    }

    if (!context.options.skipAnalysis) {
      estimatedTime += 15000; // Add 15 seconds for AI analysis
    }

    // Add buffer for CDN operations
    estimatedTime += 20000;

    return estimatedTime;
  }
}
