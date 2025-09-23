declare module '@/services/video/tiktok-feed-service.js' {
  export interface TikTokFeedRequest {
    username: string;
    count?: number;
  }

  export interface TikTokFeedResponse {
    success: boolean;
    userInfo: Record<string, unknown>;
    videos: Record<string, unknown>[];
  }

  export class TikTokFeedServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class TikTokFeedService {
    fetchUserFeed(params: TikTokFeedRequest): Promise<TikTokFeedResponse>;
  }

  export function getTikTokFeedService(): TikTokFeedService;
}

declare module '@/services/video/video-orchestrator-service.js' {
  export class VideoOrchestratorServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class VideoOrchestratorService {
    orchestrateWorkflow(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  }

  export function getVideoOrchestratorService(): VideoOrchestratorService;
}

declare module '@/services/video/video-scraper-service.js' {
  export class VideoScraperServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class VideoScraperService {
    scrapeUrl(url: string): Promise<Record<string, unknown>>;
  }

  export function getVideoScraperService(): VideoScraperService;
}

declare module '@/services/video/video-transcription-service.js' {
  export class VideoTranscriptionServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class VideoTranscriptionService {
    transcribeFromUrl(url: string): Promise<Record<string, unknown>>;
  }

  export function getVideoTranscriptionService(): VideoTranscriptionService;
}

declare module '@/services/voice/voice-service.js' {
  export class VoiceServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class VoiceService {
    analyzePatterns(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  }

  export function getVoiceService(): VoiceService;
}
