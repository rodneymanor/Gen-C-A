import type { Firestore } from 'firebase-admin/firestore';

export type ViralPlatform = 'youtube' | 'instagram' | 'tiktok';

export interface TrackedCreator {
  /** Platform we are tracking */
  platform: ViralPlatform;
  /** Stable slug/identifier used within our system */
  slug: string;
  /** Human readable name for the creator */
  displayName: string;
  /** Platform specific identifier: channelId, numeric user id, username, etc */
  platformId: string;
  /** Optional alternative identifier (e.g. username vs numeric id) */
  secondaryId?: string;
  /** Default profile URL */
  profileUrl?: string;
  /** Maximum number of videos to ingest each run */
  limit?: number;
}

export interface NormalizedViralVideo {
  platform: ViralPlatform;
  creatorSlug: string;
  creatorName: string;
  platformVideoId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
  };
  publishedAt?: string | null;
  fetchedAt: string;
  raw?: Record<string, unknown>;
}

export interface StoredViralVideo extends NormalizedViralVideo {
  id: string;
  /** When we first detected the video */
  firstSeenAt: string;
  /** Cached YYYY-MM-DD string for fast daily queries */
  firstSeenDate: string;
  /** Last sync timestamp */
  lastSeenAt: string;
  /** Normalized thumbnail URLs */
  thumbnail: {
    original: string;
    bunny?: string;
  };
  /** Firestore reference metadata */
  firestore?: {
    path: string;
  };
}

export interface SyncSummary {
  totalFetched: number;
  totalNew: number;
  totalUpdated: number;
  creators: SyncPerCreatorSummary[];
  ranAt: string;
}

export interface SyncPerCreatorSummary {
  creator: TrackedCreator;
  fetched: number;
  inserted: number;
  updated: number;
  errors: Array<{ message: string; details?: unknown }>; 
}

export interface ViralContentRepositoryOptions {
  db: Firestore;
  collectionName?: string;
}

export interface ViralContentRepositoryRecord extends StoredViralVideo {
  lastSeenDate: string;
  lastSyncDate: string;
}

