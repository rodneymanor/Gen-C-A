/**
 * RBAC Client - Collections/Videos API calls for the Collections page.
 * Adapts to Vite-Express backend routes under /api.
 */

export interface ClientCollection {
  id: string;
  title: string;
  description?: string;
  userId: string;
  videoCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ClientVideo {
  id: string;
  userId: string;
  collectionId?: string;
  title?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  addedAt?: string | Date;
  [key: string]: any;
}

export interface CollectionsResponse {
  success: boolean;
  collections: ClientCollection[];
  total?: number;
}

export interface VideosResponse {
  success: boolean;
  videos: ClientVideo[];
  totalCount?: number;
}

const jsonHeaders = (userId?: string, apiKey?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = userId;
  if (apiKey) h['x-api-key'] = apiKey;
  return h;
};

export const RbacClient = {
  async getCollections(userId: string): Promise<CollectionsResponse> {
    const res = await fetch(`/api/collections`, { headers: jsonHeaders(userId) });
    if (!res.ok) throw new Error(`Failed to fetch collections (${res.status})`);
    return res.json();
  },

  async createCollection(userId: string, title: string, description = ''): Promise<any> {
    const res = await fetch(`/api/collections`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error(`Failed to create collection (${res.status})`);
    return res.json();
  },

  async getCollectionVideos(userId: string, collectionId?: string, videoLimit?: number): Promise<VideosResponse> {
    const res = await fetch(`/api/videos/collection`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ collectionId, videoLimit }),
    });
    if (!res.ok) throw new Error(`Failed to fetch videos (${res.status})`);
    return res.json();
  },

  async moveVideo(userId: string, videoId: string, targetCollectionId: string): Promise<any> {
    const res = await fetch(`/api/collections/move-video`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ videoId, targetCollectionId }),
    });
    if (!res.ok) throw new Error(`Failed to move video (${res.status})`);
    return res.json();
  },

  async copyVideo(userId: string, videoId: string, targetCollectionId: string): Promise<any> {
    const res = await fetch(`/api/collections/copy-video`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ videoId, targetCollectionId }),
    });
    if (!res.ok) throw new Error(`Failed to copy video (${res.status})`);
    return res.json();
  },

  async deleteCollection(userId: string, collectionId: string, apiKey?: string): Promise<any> {
    const url = new URL(`/api/collections/delete`, window.location.origin);
    url.searchParams.set('collectionId', collectionId);
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: jsonHeaders(userId, apiKey),
    });
    if (!res.ok) throw new Error(`Failed to delete collection (${res.status})`);
    return res.json();
  },

  async updateCollection(userId: string, collectionId: string, updates: { title?: string; description?: string }, apiKey?: string): Promise<any> {
    const res = await fetch(`/api/collections/update`, {
      method: 'PATCH',
      headers: jsonHeaders(userId, apiKey),
      body: JSON.stringify({ collectionId, ...updates }),
    });
    if (!res.ok) throw new Error(`Failed to update collection (${res.status})`);
    return res.json();
  },

  async addVideoToCollection(userId: string, collectionId: string, videoData: { originalUrl: string; platform?: string; addedAt?: string }): Promise<any> {
    const res = await fetch(`/api/videos/add-to-collection`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ collectionId, videoData }),
    });
    if (!res.ok) throw new Error(`Failed to add video (${res.status})`);
    return res.json();
  },

  async deleteVideo(userId: string, videoId: string): Promise<any> {
    const res = await fetch(`/api/videos/delete`, {
      method: 'POST',
      headers: jsonHeaders(userId),
      body: JSON.stringify({ videoId }),
    });
    if (!res.ok) throw new Error(`Failed to delete video (${res.status})`);
    return res.json();
  },
};

export default RbacClient;
