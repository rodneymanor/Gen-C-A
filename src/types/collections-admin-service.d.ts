declare module '@/services/collections/collections-admin-service.js' {
  export class CollectionsServiceError extends Error {
    constructor(message: string, statusCode?: number);
    statusCode: number;
  }

  export interface CollectionSummary {
    id: string;
    title?: string;
    description?: string;
    userId?: string;
    videoCount?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  }

  export interface CollectionsListResult {
    collections: CollectionSummary[];
    total: number;
    accessibleCoaches: string[];
  }

  export interface CollectionVideosResult {
    videos: Record<string, unknown>[];
    totalCount: number;
  }

  export interface CollectionsAdminService {
    listCollections(userId: string): Promise<CollectionsListResult>;
    createCollection(userId: string, payload: unknown): Promise<CollectionSummary>;
    listCollectionVideos(userId: string, params: { collectionId?: string; limit?: number }): Promise<CollectionVideosResult>;
    addVideoToCollection(userId: string, params: { collectionId: string; videoData: Record<string, unknown> }): Promise<{ videoId: string; video: Record<string, unknown> }>;
    moveVideo(userId: string, params: { videoId: string; targetCollectionId: string | null }): Promise<void>;
    deleteVideo(userId: string, params: { videoId: string }): Promise<void>;
    updateCollection(userId: string, params: { collectionId: string; updates: Record<string, unknown> }): Promise<void>;
  }

  export function getCollectionsAdminService(firestore: FirebaseFirestore.Firestore): CollectionsAdminService;
}
