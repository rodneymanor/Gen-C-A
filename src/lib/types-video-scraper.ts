export type SupportedPlatform = 'instagram' | 'tiktok';

export interface UnifiedVideoResult {
  success: boolean;
  platform: SupportedPlatform;
  downloadUrl: string;
  audioUrl?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  description?: string | null;
  author?: string | null;
  duration?: number | null;
  likeCount?: number;
  viewCount?: number;
  shareCount?: number;
  commentCount?: number;
  raw?: any;
}

export interface ScraperOptions {
  preferAudioOnly?: boolean;
}
