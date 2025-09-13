/**
 * BackgroundJobService - Background job orchestration for video processing
 * Extracted from background processing implementations
 */

export interface BackgroundJob {
  id: string;
  type: 'transcription' | 'analysis' | 'upload' | 'processing';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  videoId: string;
  videoUrl?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: {
    platform?: string;
    filename?: string;
    fileSize?: number;
    userId?: string;
    retryCount?: number;
    maxRetries?: number;
  };
}

export interface JobQueue {
  /**
   * Add job to queue
   */
  enqueue(job: BackgroundJob): Promise<boolean>;
  
  /**
   * Get next job from queue
   */
  dequeue(): Promise<BackgroundJob | null>;
  
  /**
   * Get job by ID
   */
  getJob(jobId: string): Promise<BackgroundJob | null>;
  
  /**
   * Update job status
   */
  updateJob(jobId: string, updates: Partial<BackgroundJob>): Promise<boolean>;
  
  /**
   * Cancel job
   */
  cancelJob(jobId: string): Promise<boolean>;
  
  /**
   * Get jobs by status
   */
  getJobsByStatus(status: BackgroundJob['status']): Promise<BackgroundJob[]>;
  
  /**
   * Clean up completed/failed jobs
   */
  cleanup(olderThanHours: number): Promise<number>;
}

export interface JobProcessor {
  /**
   * Process a background job
   */
  process(job: BackgroundJob): Promise<void>;
  
  /**
   * Get supported job types
   */
  getSupportedTypes(): string[];
  
  /**
   * Check if processor can handle job
   */
  canProcess(job: BackgroundJob): boolean;
}

export interface BackgroundTranscriptionOptions {
  skipTranscription?: boolean;
  skipAIAnalysis?: boolean;
  maxRetries?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Background job service for handling video processing tasks
 */
export class BackgroundJobService {
  private queue: JobQueue;
  private processors: Map<string, JobProcessor> = new Map();
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private readonly PROCESSING_INTERVAL = 5000; // 5 seconds

  constructor(queue?: JobQueue) {
    this.queue = queue || new MemoryJobQueue();
    this.initializeProcessors();
  }

  /**
   * Start background job processing
   */
  start(): void {
    if (this.isProcessing) {
      console.log('⚠️ [BACKGROUND_JOBS] Service already running');
      return;
    }

    console.log('🚀 [BACKGROUND_JOBS] Starting background job service');
    this.isProcessing = true;
    
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, this.PROCESSING_INTERVAL);
  }

  /**
   * Stop background job processing
   */
  stop(): void {
    if (!this.isProcessing) {
      console.log('⚠️ [BACKGROUND_JOBS] Service not running');
      return;
    }

    console.log('⏹️ [BACKGROUND_JOBS] Stopping background job service');
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Start background transcription for a video
   */
  async startBackgroundTranscription(
    videoDocument: any,
    downloadData: any,
    streamResult: any,
    options: BackgroundTranscriptionOptions = {}
  ): Promise<string> {
    console.log('🎙️ [BACKGROUND_JOBS] Starting background transcription for video:', videoDocument.id);

    const job: BackgroundJob = {
      id: this.generateJobId(),
      type: 'transcription',
      status: 'pending',
      videoId: videoDocument.id,
      videoUrl: streamResult?.directUrl || streamResult?.iframeUrl,
      progress: 0,
      metadata: {
        platform: downloadData.platform,
        filename: downloadData.videoData?.filename,
        fileSize: downloadData.videoData?.size,
        userId: videoDocument.userId,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        skipTranscription: options.skipTranscription,
        skipAIAnalysis: options.skipAIAnalysis,
        videoDocument,
        downloadData,
        streamResult
      }
    };

    const success = await this.queue.enqueue(job);
    if (!success) {
      throw new Error('Failed to enqueue background transcription job');
    }

    console.log(`✅ [BACKGROUND_JOBS] Background transcription job queued: ${job.id}`);
    return job.id;
  }

  /**
   * Start background analysis for a video
   */
  async startBackgroundAnalysis(
    videoId: string,
    transcript: string,
    videoUrl?: string
  ): Promise<string> {
    console.log('🔍 [BACKGROUND_JOBS] Starting background analysis for video:', videoId);

    const job: BackgroundJob = {
      id: this.generateJobId(),
      type: 'analysis',
      status: 'pending',
      videoId,
      videoUrl,
      progress: 0,
      metadata: {
        transcript,
        retryCount: 0,
        maxRetries: 3
      }
    };

    const success = await this.queue.enqueue(job);
    if (!success) {
      throw new Error('Failed to enqueue background analysis job');
    }

    console.log(`✅ [BACKGROUND_JOBS] Background analysis job queued: ${job.id}`);
    return job.id;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<BackgroundJob | null> {
    return this.queue.getJob(jobId);
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    console.log(`🛑 [BACKGROUND_JOBS] Cancelling job: ${jobId}`);
    return this.queue.cancelJob(jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: BackgroundJob['status']): Promise<BackgroundJob[]> {
    return this.queue.getJobsByStatus(status);
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const [pending, running, completed, failed] = await Promise.all([
      this.queue.getJobsByStatus('pending'),
      this.queue.getJobsByStatus('running'),
      this.queue.getJobsByStatus('completed'),
      this.queue.getJobsByStatus('failed')
    ]);

    return {
      pending: pending.length,
      running: running.length,
      completed: completed.length,
      failed: failed.length,
      total: pending.length + running.length + completed.length + failed.length
    };
  }

  /**
   * Clean up old jobs
   */
  async cleanup(olderThanHours: number = 24): Promise<number> {
    console.log(`🧹 [BACKGROUND_JOBS] Cleaning up jobs older than ${olderThanHours} hours`);
    return this.queue.cleanup(olderThanHours);
  }

  /**
   * Private methods
   */

  private initializeProcessors(): void {
    this.processors.set('transcription', new TranscriptionJobProcessor());
    this.processors.set('analysis', new AnalysisJobProcessor());
    this.processors.set('upload', new UploadJobProcessor());
    this.processors.set('processing', new ProcessingJobProcessor());
  }

  private async processNextJob(): Promise<void> {
    try {
      const job = await this.queue.dequeue();
      if (!job) {
        return; // No jobs to process
      }

      console.log(`🔄 [BACKGROUND_JOBS] Processing job: ${job.id} (${job.type})`);

      // Update job status to running
      await this.queue.updateJob(job.id, {
        status: 'running',
        startedAt: new Date().toISOString(),
        progress: 0
      });

      // Find appropriate processor
      const processor = this.processors.get(job.type);
      if (!processor || !processor.canProcess(job)) {
        console.error(`❌ [BACKGROUND_JOBS] No processor available for job type: ${job.type}`);
        await this.queue.updateJob(job.id, {
          status: 'failed',
          error: `No processor available for job type: ${job.type}`,
          completedAt: new Date().toISOString()
        });
        return;
      }

      // Process the job
      await processor.process(job);

      console.log(`✅ [BACKGROUND_JOBS] Job completed: ${job.id}`);
    } catch (error) {
      console.error('❌ [BACKGROUND_JOBS] Job processing error:', error);
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * In-memory job queue implementation
 */
class MemoryJobQueue implements JobQueue {
  private jobs: Map<string, BackgroundJob> = new Map();

  async enqueue(job: BackgroundJob): Promise<boolean> {
    try {
      this.jobs.set(job.id, { ...job });
      return true;
    } catch (error) {
      console.error('❌ [MEMORY_QUEUE] Failed to enqueue job:', error);
      return false;
    }
  }

  async dequeue(): Promise<BackgroundJob | null> {
    // Find next pending job (FIFO)
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'pending') {
        return job;
      }
    }
    return null;
  }

  async getJob(jobId: string): Promise<BackgroundJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJob(jobId: string, updates: Partial<BackgroundJob>): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    this.jobs.set(jobId, { ...job, ...updates });
    return true;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'pending') {
      this.jobs.set(jobId, {
        ...job,
        status: 'cancelled',
        completedAt: new Date().toISOString()
      });
      return true;
    }

    return false; // Cannot cancel running/completed jobs
  }

  async getJobsByStatus(status: BackgroundJob['status']): Promise<BackgroundJob[]> {
    const jobs: BackgroundJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === status) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  async cleanup(olderThanHours: number): Promise<number> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const jobTime = job.completedAt ? new Date(job.completedAt).getTime() : 0;
        if (jobTime < cutoffTime) {
          this.jobs.delete(id);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }
}

/**
 * Transcription job processor
 */
class TranscriptionJobProcessor implements JobProcessor {
  async process(job: BackgroundJob): Promise<void> {
    try {
      console.log(`🎙️ [TRANSCRIPTION_PROCESSOR] Processing transcription job: ${job.id}`);

      const { videoDocument, downloadData, streamResult } = job.metadata as any;
      const queue = job.metadata?.queue || new MemoryJobQueue();

      // Update progress
      await queue.updateJob(job.id, { progress: 10 });

      // Determine transcription URL
      const transcriptionUrl = job.videoUrl || streamResult?.directUrl || streamResult?.iframeUrl;
      
      if (!transcriptionUrl) {
        throw new Error('No video URL available for transcription');
      }

      console.log('🎙️ [TRANSCRIPTION_PROCESSOR] Starting transcription...');
      await queue.updateJob(job.id, { progress: 25 });

      // Mock transcription (in real implementation, would call TranscriptionService)
      const transcriptionResult = await this.mockTranscription(transcriptionUrl, downloadData.platform);
      
      await queue.updateJob(job.id, { progress: 60 });

      if (!transcriptionResult?.transcript) {
        throw new Error('No transcript returned from transcription service');
      }

      console.log('✅ [TRANSCRIPTION_PROCESSOR] Transcription completed');

      // Perform AI analysis if not skipped
      if (!job.metadata?.skipAIAnalysis) {
        console.log('🔍 [TRANSCRIPTION_PROCESSOR] Starting AI analysis...');
        await queue.updateJob(job.id, { progress: 75 });

        const analysisResult = await this.mockAnalysis(transcriptionResult.transcript);
        
        await queue.updateJob(job.id, { progress: 90 });

        // Update video document with results
        console.log('💾 [TRANSCRIPTION_PROCESSOR] Updating video document...');
        await this.updateVideoDocument(job.videoId, {
          transcript: transcriptionResult.transcript,
          components: analysisResult.components,
          contentMetadata: analysisResult.contentMetadata,
          visualContext: analysisResult.visualContext,
          transcriptionStatus: 'completed',
          updatedAt: new Date().toISOString()
        });
      }

      await queue.updateJob(job.id, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString()
      });

      console.log(`✅ [TRANSCRIPTION_PROCESSOR] Job completed: ${job.id}`);
    } catch (error) {
      console.error(`❌ [TRANSCRIPTION_PROCESSOR] Job failed: ${job.id}`, error);
      
      const queue = job.metadata?.queue || new MemoryJobQueue();
      await queue.updateJob(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown transcription error',
        completedAt: new Date().toISOString()
      });
    }
  }

  getSupportedTypes(): string[] {
    return ['transcription'];
  }

  canProcess(job: BackgroundJob): boolean {
    return job.type === 'transcription';
  }

  private async mockTranscription(url: string, platform: string): Promise<any> {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      transcript: `This is a mock transcript for ${platform} video from ${url.substring(0, 50)}...`,
      platform
    };
  }

  private async mockAnalysis(transcript: string): Promise<any> {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      components: {
        hook: 'Mock attention-grabbing hook',
        bridge: 'Mock connecting bridge',
        nugget: 'Mock core value proposition',
        wta: 'Mock call to action'
      },
      contentMetadata: {
        platform: 'mock',
        author: 'Mock Author',
        description: 'Mock video description',
        source: 'background_processing',
        hashtags: ['mock', 'background']
      },
      visualContext: 'Mock visual context from background analysis'
    };
  }

  private async updateVideoDocument(videoId: string, updates: any): Promise<void> {
    // Mock database update
    console.log(`💾 [TRANSCRIPTION_PROCESSOR] Updating video ${videoId} with:`, Object.keys(updates));
    // In real implementation, would update database
  }
}

/**
 * Analysis job processor
 */
class AnalysisJobProcessor implements JobProcessor {
  async process(job: BackgroundJob): Promise<void> {
    console.log(`🔍 [ANALYSIS_PROCESSOR] Processing analysis job: ${job.id}`);
    // Implementation would perform AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  getSupportedTypes(): string[] {
    return ['analysis'];
  }

  canProcess(job: BackgroundJob): boolean {
    return job.type === 'analysis';
  }
}

/**
 * Upload job processor
 */
class UploadJobProcessor implements JobProcessor {
  async process(job: BackgroundJob): Promise<void> {
    console.log(`📤 [UPLOAD_PROCESSOR] Processing upload job: ${job.id}`);
    // Implementation would handle CDN uploads
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  getSupportedTypes(): string[] {
    return ['upload'];
  }

  canProcess(job: BackgroundJob): boolean {
    return job.type === 'upload';
  }
}

/**
 * Processing job processor
 */
class ProcessingJobProcessor implements JobProcessor {
  async process(job: BackgroundJob): Promise<void> {
    console.log(`⚙️ [PROCESSING_PROCESSOR] Processing job: ${job.id}`);
    // Implementation would handle general video processing
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  getSupportedTypes(): string[] {
    return ['processing'];
  }

  canProcess(job: BackgroundJob): boolean {
    return job.type === 'processing';
  }
}