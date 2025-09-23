import { getAdminDb } from './firebase-admin';

export const COLLECTION_LIMITS = {
  MAX_TITLE_LENGTH: 80,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export interface Video {
  id?: string;
  url: string;
  title: string;
  platform: string;
  thumbnailUrl?: string;
  author?: string;
  transcript?: string;
  visualContext?: string;
  fileSize?: number;
  duration?: number;
  userId: string;
  collectionId?: string;
  addedAt: string;
  components?: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata?: {
    hashtags?: string[];
    mentions?: string[];
    description?: string;
  };
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    saves?: number;
    engagementRate?: number;
    contentType?: string;
    keyTopics?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  metadata?: Record<string, any>;
}

export interface CollectionDoc {
  id?: string;
  title: string;
  description?: string;
  userId: string;
  videoCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export class CollectionsService {
  static async moveVideo(userId: string, videoId: string, targetCollectionId: string | null): Promise<void> {
    const db = getAdminDb();
    if (!db) throw new Error('Database not available');
    const ref = db.collection('videos').doc(String(videoId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Video not found');
    const data = snap.data();
    if (data?.userId !== userId) throw new Error('Access denied');
    await ref.update({ collectionId: targetCollectionId, updatedAt: new Date().toISOString() });
  }

  static async copyVideo(userId: string, videoId: string, targetCollectionId: string | null): Promise<string> {
    const db = getAdminDb();
    if (!db) throw new Error('Database not available');
    const ref = db.collection('videos').doc(String(videoId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Video not found');
    const data = snap.data();
    if (data?.userId !== userId) throw new Error('Access denied');
    const newDoc = { ...data, collectionId: targetCollectionId, addedAt: new Date().toISOString() };
    delete (newDoc as any).id;
    const newRef = await db.collection('videos').add(newDoc);
    return newRef.id;
  }
}

export default CollectionsService;
