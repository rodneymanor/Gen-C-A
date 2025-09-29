/**
 * TranscriptionService - wraps the backend video transcription workflow.
 * Uses the in-process service when available (Node/SSR) and falls back to the
 * HTTP API when running in the browser.
 */

export interface TranscriptionResult {
  success: boolean;
  transcript: string;
  platform: string;
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
  transcriptionMetadata: {
    method: string;
    processedAt: string;
    fileSize?: number;
    fileName?: string;
    duration?: number;
    fallbackUsed?: boolean;
  };
  error?: string;
}

const DEFAULT_BACKEND_BASE = 'http://localhost:5001';

type VideoTranscriptionModule = typeof import('@/services/video/video-transcription-service.js');

type VideoTranscriptionServiceInstance = ReturnType<VideoTranscriptionModule['getVideoTranscriptionService']> | null;

function pickBackendBase(): string | null {
  if (typeof process === 'undefined') return null;
  const env = process.env || {};
  return (
    env.BACKEND_INTERNAL_URL ||
    env.BACKEND_URL ||
    env.BACKEND_DEV_URL ||
    null
  );
}

function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

function toHashtagArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export class TranscriptionService {
  private backendBase: string | null;
  private directServicePromise: Promise<VideoTranscriptionServiceInstance> | null = null;

  constructor() {
    this.backendBase = pickBackendBase();
    if (!this.backendBase && isServerEnvironment()) {
      this.backendBase = DEFAULT_BACKEND_BASE;
    }
  }

  private async resolveDirectService(): Promise<any | null> {
    if (!isServerEnvironment()) {
      return null;
    }

    if (!this.directServicePromise) {
      this.directServicePromise = import('@/services/video/video-transcription-service.js')
        .then((mod: VideoTranscriptionModule) => {
          try {
            return mod.getVideoTranscriptionService();
          } catch (error) {
            console.warn('[TranscriptionService] Failed to initialise direct transcription service:', error);
            return null;
          }
        })
        .catch((error) => {
          console.warn('[TranscriptionService] Unable to load video transcription service module:', error);
          return null;
        });
    }

    return this.directServicePromise;
  }

  private buildEndpoint(): string {
    if (this.backendBase) {
      const base = this.backendBase.replace(/\/$/, '');
      return `${base}/api/video/transcribe-from-url`;
    }
    return '/api/video/transcribe-from-url';
  }

  private mapResult(
    raw: any,
    platform: string,
    options: { method?: string; processedAt?: string } = {},
  ): TranscriptionResult {
    const transcript = typeof raw?.transcript === 'string' ? raw.transcript.trim() : '';
    if (!transcript) {
      const message = typeof raw?.error === 'string' ? raw.error : 'Transcription service returned no transcript';
      throw new Error(message);
    }

    const components = raw?.components && typeof raw.components === 'object'
      ? {
          hook: String(raw.components.hook ?? ''),
          bridge: String(raw.components.bridge ?? ''),
          nugget: String(raw.components.nugget ?? ''),
          wta: String(raw.components.wta ?? ''),
        }
      : undefined;

    const contentMetadata = raw?.contentMetadata && typeof raw.contentMetadata === 'object'
      ? {
          platform: String(raw.contentMetadata.platform ?? platform ?? 'other'),
          author: typeof raw.contentMetadata.author === 'string' ? raw.contentMetadata.author : '',
          description: typeof raw.contentMetadata.description === 'string' ? raw.contentMetadata.description : '',
          source: typeof raw.contentMetadata.source === 'string' ? raw.contentMetadata.source : 'video-transcription-service',
          hashtags: toHashtagArray(raw.contentMetadata.hashtags),
        }
      : {
          platform: platform ?? 'other',
          author: '',
          description: '',
          source: 'video-transcription-service',
          hashtags: [],
        };

    const rawMetadata = raw?.transcriptionMetadata && typeof raw.transcriptionMetadata === 'object'
      ? raw.transcriptionMetadata
      : {};

    const processedAt = options.processedAt || rawMetadata.processedAt || new Date().toISOString();
    const method = options.method || rawMetadata.method || 'video-transcription-service';

    const transcriptionMetadata: TranscriptionResult['transcriptionMetadata'] = {
      method,
      processedAt,
      fallbackUsed: Boolean(rawMetadata.fallbackUsed),
    };

    if (typeof rawMetadata.fileSize === 'number') {
      transcriptionMetadata.fileSize = rawMetadata.fileSize;
    }
    if (typeof rawMetadata.fileName === 'string' && rawMetadata.fileName.trim()) {
      transcriptionMetadata.fileName = rawMetadata.fileName;
    }
    if (typeof rawMetadata.duration === 'number') {
      transcriptionMetadata.duration = rawMetadata.duration;
    }

    return {
      success: true,
      transcript,
      platform,
      components,
      contentMetadata,
      visualContext: typeof raw?.visualContext === 'string' ? raw.visualContext : undefined,
      transcriptionMetadata,
      error: typeof raw?.error === 'string' ? raw.error : undefined,
    };
  }

  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    if (!url) {
      throw new Error('Video URL is required for transcription');
    }

    const directService = await this.resolveDirectService();
    if (directService) {
      try {
        const result = await directService.transcribeFromUrl({ videoUrl: url });
        return this.mapResult(result, platform, { method: 'video-transcription-service' });
      } catch (error) {
        console.warn('[TranscriptionService] Direct transcription failed, falling back to HTTP API:', error);
      }
    }

    const response = await fetch(this.buildEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: url }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.success) {
      const message = typeof payload?.error === 'string'
        ? payload.error
        : `Failed to transcribe video (${response.status})`;
      throw new Error(message);
    }

    return this.mapResult(payload, platform, { method: 'video-transcription-service:http' });
  }

  async transcribeFromBuffer(buffer: ArrayBuffer, filename: string, platform: string): Promise<TranscriptionResult | null> {
    const directService = await this.resolveDirectService();
    if (!directService) {
      throw new Error('Buffer transcription is only supported in server environments');
    }

    const mimeType = filename?.toLowerCase().endsWith('.webm')
      ? 'video/webm'
      : filename?.toLowerCase().endsWith('.mov')
      ? 'video/quicktime'
      : 'video/mp4';

    const requestId = Math.random().toString(36).slice(2, 10);
    const nodeBuffer = Buffer.from(buffer);

    const result = await directService.transcribeVideo(nodeBuffer, mimeType, requestId, undefined);
    return this.mapResult(
      {
        ...result,
        transcriptionMetadata: {
          method: 'video-transcription-service:buffer',
          processedAt: new Date().toISOString(),
          fileName: filename,
          fileSize: nodeBuffer.byteLength,
        },
      },
      platform,
    );
  }

  getProviderStatus(): Array<{
    name: string;
    available: boolean;
    configured: boolean;
    status?: string;
  }> {
    const configured = typeof process !== 'undefined' ? Boolean(process.env?.GEMINI_API_KEY) : false;
    const status = configured ? 'Gemini configured' : 'Set GEMINI_API_KEY to enable direct transcription';
    return [
      {
        name: 'Gemini',
        available: configured,
        configured,
        status,
      },
    ];
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only MP4, WebM, MOV, AVI and QuickTime video files are supported',
      };
    }

    const maxSize = 80 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Video file must be smaller than 80MB',
      };
    }

    return { valid: true };
  }
}
