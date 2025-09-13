export interface ScriptComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface ContentMetadata {
  platform: "TikTok" | "Instagram" | "YouTube" | "Unknown";
  author: string;
  description: string;
  source: "educational" | "entertainment" | "tutorial" | "lifestyle" | "business" | "other";
  hashtags: string[];
}

export interface TranscriptionMetadata {
  method: "direct" | "url";
  fileSize?: number;
  fileName?: string;
  processedAt: string;
  originalUrl?: string;
  platform: string;
  downloadedAt: string;
  readyForTranscription: boolean;
  transcriptionStatus?: "pending" | "completed" | "failed" | "processing";
}

export interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  platform: string;
  components: ScriptComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
  transcriptionMetadata: TranscriptionMetadata;
}

export interface TranscriptionError {
  error: string;
  details?: string;
}

export interface VideoTranscriptionRequest {
  video: File;
}

export interface UrlTranscriptionRequest {
  url: string;
  platform?: string;
}
