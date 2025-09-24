export type Platform = 'all' | 'instagram' | 'tiktok' | 'youtube';

export type VideoLength = 'short' | 'long';

export type ViralMetricTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface ViralMetric {
  id: string;
  label: string;
  value: string;
  tone?: ViralMetricTone;
}

export interface ViralVideo {
  id: string;
  platform: Exclude<Platform, 'all'>;
  creator: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  views: string;
  publishedAt: string;
  type: VideoLength;
  metrics: ViralMetric[];
  isNew?: boolean;
  firstSeenAt?: string;
}
