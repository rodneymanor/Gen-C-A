/**
 * Service Interfaces - Type definitions for all video processing services
 * Provides contract definitions for implementing video processing in new applications
 */

// Core video processing types
export interface VideoData {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename: string;
}

export interface VideoMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  saves?: number;
  duration?: number;
  downloadSpeed?: string;
  fileSize?: number;
}

export interface VideoMetadata {
  author: string;
  description: string;
  hashtags: string[];
  duration: number;
  timestamp?: string;
  platform?: string;
  shortCode?: string;
  originalUrl?: string;
  [key: string]: any;
}

// Platform detection and validation
export interface PlatformInfo {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'unknown';
  confidence: number;
  details?: {
    shortCode?: string;
    videoId?: string;
    userId?: string;
  };
}

export interface UrlValidation {
  valid: boolean;
  platform?: string;
  message?: string;
  suggestions?: string[];
}

// Download service interfaces
export interface IVideoDownloadService {
  /**
   * Download video from supported platform URL
   */
  downloadVideo(url: string): Promise<VideoDownloadResult | null>;
  
  /**
   * Detect platform from URL
   */
  detectPlatform(url: string): PlatformInfo;
  
  /**
   * Validate URL format and platform support
   */
  validateUrl(url: string): UrlValidation;
  
  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): string[];
  
  /**
   * Check service health
   */
  getHealthStatus(): Promise<ServiceHealthStatus>;
}

export interface VideoDownloadResult {
  success: boolean;
  platform: string;
  videoData: VideoData;
  videoUrl?: string;
  metrics: VideoMetrics;
  additionalMetadata: VideoMetadata;
  thumbnailUrl?: string;
  metadata: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    method: string;
    [key: string]: any;
  };
  error?: string;
}

// CDN service interfaces
export interface ICDNService {
  /**
   * Upload video buffer to CDN
   */
  uploadBuffer(videoData: VideoData): Promise<CDNUploadResult | null>;
  
  /**
   * Stream video directly from URL to CDN
   */
  streamFromUrl(videoUrl: string, filename: string): Promise<CDNUploadResult | null>;
  
  /**
   * Upload custom thumbnail
   */
  uploadThumbnail(videoGuid: string, thumbnailUrl: string): Promise<boolean>;
  
  /**
   * Generate thumbnail URL
   */
  generateThumbnailUrl(videoId: string): string | null;
  
  /**
   * Generate preview URL
   */
  generatePreviewUrl(videoId: string): string | null;
  
  /**
   * Delete video from CDN
   */
  deleteVideo(videoGuid: string): Promise<boolean>;
  
  /**
   * Get video information
   */
  getVideoInfo(videoGuid: string): Promise<CDNVideoInfo | null>;
  
  /**
   * Check CDN service status
   */
  getHealthStatus(): Promise<ServiceHealthStatus>;
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

export interface CDNVideoInfo {
  guid: string;
  title: string;
  length: number;
  status: string;
  thumbnailUrl?: string;
  createdAt: string;
  views: number;
  size: number;
}

// Transcription service interfaces
export interface ITranscriptionService {
  /**
   * Transcribe video from URL
   */
  transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null>;
  
  /**
   * Transcribe video from buffer
   */
  transcribeFromBuffer(buffer: ArrayBuffer, filename: string, platform: string): Promise<TranscriptionResult | null>;
  
  /**
   * Validate file for transcription
   */
  validateFile(file: File): ValidationResult;
  
  /**
   * Get available transcription providers
   */
  getAvailableProviders(): TranscriptionProviderInfo[];
  
  /**
   * Check transcription service status
   */
  getHealthStatus(): Promise<ServiceHealthStatus>;
}

export interface TranscriptionResult {
  success: boolean;
  transcript: string;
  platform: string;
  components?: ScriptComponents;
  contentMetadata?: ContentMetadata;
  visualContext?: string;
  transcriptionMetadata: {
    method: string;
    processedAt: string;
    fileSize?: number;
    fileName?: string;
    duration?: number;
    confidence?: number;
    language?: string;
    provider?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface ScriptComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface ContentMetadata {
  platform: string;
  author: string;
  description: string;
  source: string;
  hashtags: string[];
  topics?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  contentType?: 'educational' | 'entertainment' | 'promotional' | 'informational';
}

export interface TranscriptionProviderInfo {
  name: string;
  available: boolean;
  configured: boolean;
  features: {
    urlTranscription: boolean;
    bufferTranscription: boolean;
    languageDetection: boolean;
    multiLanguage: boolean;
  };
  limits: {
    maxFileSize: number;
    maxDuration: number;
    rateLimit: string;
  };
}

// AI analysis service interfaces
export interface IAIAnalysisService {
  /**
   * Analyze script components
   */
  analyzeScriptComponents(transcript: string): Promise<ScriptComponents | null>;
  
  /**
   * Analyze visual content
   */
  analyzeVisuals(videoUrl: string): Promise<string | null>;
  
  /**
   * Analyze content for topics, sentiment, etc.
   */
  analyzeContent(transcript: string): Promise<ContentAnalysis | null>;
  
  /**
   * Perform complete analysis
   */
  performCompleteAnalysis(transcript: string, videoUrl?: string): Promise<CompleteAnalysisResult>;
  
  /**
   * Get available AI providers
   */
  getAvailableProviders(): AIProviderInfo[];
  
  /**
   * Check AI analysis service status
   */
  getHealthStatus(): Promise<ServiceHealthStatus>;
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  keywords: string[];
  contentType: 'educational' | 'entertainment' | 'promotional' | 'informational';
  engagement: 'high' | 'medium' | 'low';
  language?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  tone?: string;
  targetAudience?: string;
}

export interface CompleteAnalysisResult {
  success: boolean;
  components?: ScriptComponents;
  contentAnalysis?: ContentAnalysis;
  visualAnalysis?: VisualAnalysis;
  visualContext?: string;
  metadata: {
    method: string;
    processedAt: string;
    inputLength?: number;
    models?: string[];
    confidence?: number;
  };
  error?: string;
}

export interface VisualAnalysis {
  sceneDescription: string;
  textOverlays: string[];
  visualTransitions: string[];
  keyElements: string[];
  colorScheme: string;
  technicalAspects: string;
  visualStyle: string;
  objects?: string[];
  faces?: number;
  motion?: 'low' | 'medium' | 'high';
}

export interface AIProviderInfo {
  name: string;
  model: string;
  available: boolean;
  configured: boolean;
  capabilities: {
    scriptAnalysis: boolean;
    visualAnalysis: boolean;
    contentAnalysis: boolean;
    multimodal: boolean;
  };
  limits: {
    maxInputLength: number;
    rateLimit: string;
    costPerRequest?: string;
  };
}

// Background job service interfaces
export interface IBackgroundJobService {
  /**
   * Start background transcription
   */
  startBackgroundTranscription(
    videoDocument: any,
    downloadData: any,
    streamResult: any,
    options: BackgroundProcessingOptions
  ): Promise<string>;
  
  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<BackgroundJobStatus | null>;
  
  /**
   * Cancel job
   */
  cancelJob(jobId: string): Promise<boolean>;
  
  /**
   * Get processing statistics
   */
  getProcessingStats(): Promise<ProcessingStats>;
  
  /**
   * Start/stop service
   */
  start(): void;
  stop(): void;
  
  /**
   * Check background service status
   */
  getHealthStatus(): Promise<ServiceHealthStatus>;
}

export interface BackgroundJobStatus {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  videoId: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  error?: string;
  metadata?: {
    platform?: string;
    retryCount?: number;
    currentStep?: string;
  };
}

export interface BackgroundProcessingOptions {
  skipTranscription?: boolean;
  skipAIAnalysis?: boolean;
  maxRetries?: number;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
  averageProcessingTime: number;
  successRate: number;
  queueHealth: 'healthy' | 'degraded' | 'unhealthy';
}

// Pipeline orchestrator interfaces
export interface IPipelineOrchestrator {
  /**
   * Execute complete video processing pipeline
   */
  execute(context: PipelineContext): Promise<PipelineExecutionResult>;
  
  /**
   * Execute pipeline in background
   */
  executeBackground(context: PipelineContext): Promise<BackgroundExecutionResult>;
  
  /**
   * Get execution status
   */
  getExecutionStatus(jobId: string): Promise<ExecutionStatus>;
  
  /**
   * Cancel execution
   */
  cancelExecution(jobId: string): Promise<boolean>;
  
  /**
   * Get pipeline health status
   */
  getHealthStatus(): Promise<PipelineHealthStatus>;
  
  /**
   * Shutdown orchestrator
   */
  shutdown(): Promise<void>;
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
    webhookUrl?: string;
    metadata?: Record<string, any>;
  };
  metadata: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    startTime: number;
  };
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

export interface PipelineStepResult {
  success: boolean;
  step: string;
  duration: number;
  error?: string;
  data?: any;
  retries?: number;
}

export interface BackgroundExecutionResult {
  jobId: string;
  estimatedDuration: number;
  queuePosition?: number;
  startTime: string;
}

export interface ExecutionStatus {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeRemaining?: number;
  currentStep?: string;
  error?: string;
}

export interface PipelineHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: string;
    lastChecked?: string;
  }>;
  metrics: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgProcessingTime: number;
    successRate: number;
    queueDepth: number;
  };
}

// Common interfaces
export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: string;
  lastChecked: string;
  metrics?: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  dependencies?: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details?: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  suggestions?: string[];
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  queueSize?: number;
}

// Configuration interfaces
export interface ServiceConfig {
  retries: RetryConfig;
  timeouts: {
    connection: number;
    request: number;
    total: number;
  };
  rateLimit?: RateLimitConfig;
  healthCheck: {
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface PipelineConfig {
  maxRetries: number;
  operationTimeout: number;
  enableParallelProcessing: boolean;
  backgroundProcessing: {
    enabled: boolean;
    queuePriority: 'low' | 'normal' | 'high';
    maxConcurrentJobs: number;
    jobTimeout: number;
  };
  fallbackBehavior: 'fail' | 'partial' | 'continue';
  cdn: {
    libraryId: string;
    apiKey: string;
    hostname: string;
  };
  services: {
    download: ServiceConfig;
    transcription: ServiceConfig;
    analysis: ServiceConfig;
    background: ServiceConfig;
  };
}

// Error types
export class VideoProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public step?: string,
    public retryable: boolean = true,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

export class PlatformNotSupportedError extends VideoProcessingError {
  constructor(platform: string, supportedPlatforms: string[]) {
    super(
      `Platform '${platform}' not supported. Supported platforms: ${supportedPlatforms.join(', ')}`,
      'PLATFORM_NOT_SUPPORTED',
      'validation',
      false,
      { platform, supportedPlatforms }
    );
  }
}

export class TranscriptionTimeoutError extends VideoProcessingError {
  constructor(timeout: number) {
    super(
      `Transcription timed out after ${timeout}ms`,
      'TRANSCRIPTION_TIMEOUT',
      'transcription',
      true,
      { timeout }
    );
  }
}

export class CDNUploadError extends VideoProcessingError {
  constructor(message: string, uploadAttempts: number) {
    super(
      message,
      'CDN_UPLOAD_ERROR',
      'cdn_upload',
      uploadAttempts < 3,
      { uploadAttempts }
    );
  }
}

// Event types for monitoring and webhooks
export interface VideoProcessingEvent {
  type: 'pipeline_started' | 'step_completed' | 'pipeline_completed' | 'pipeline_failed' | 'job_status_changed';
  timestamp: string;
  videoId?: string;
  jobId?: string;
  data: Record<string, any>;
}

export interface WebhookPayload {
  event: VideoProcessingEvent;
  pipeline: {
    id: string;
    status: string;
    progress: number;
  };
  video?: {
    id: string;
    url: string;
    platform: string;
    status: string;
  };
  metadata?: Record<string, any>;
}