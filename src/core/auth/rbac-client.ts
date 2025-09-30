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

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

let pendingUserPromise: Promise<User | null> | null = null;

async function waitForFirebaseUser(timeoutMs = 4000): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  if (!pendingUserPromise) {
    pendingUserPromise = new Promise<User | null>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(null);
      }, timeoutMs);

      let unsubscribe: () => void = () => {};
      const cleanup = () => {
        clearTimeout(timer);
        const fn = unsubscribe;
        unsubscribe = () => {};
        try {
          fn();
        } catch {}
      };

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(user);
      });
    }).finally(() => {
      pendingUserPromise = null;
    });
  }

  return pendingUserPromise;
}

async function resolveIdToken(expectedUid?: string): Promise<string | null> {
  const user = auth.currentUser ?? (await waitForFirebaseUser());
  if (!user) {
    return null;
  }

  if (expectedUid && user.uid !== expectedUid) {
    console.warn('[rbac-client] Firebase user mismatch', { expectedUid, actualUid: user.uid });
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    console.warn('[rbac-client] getIdToken failed, forcing refresh', error);
    try {
      return await user.getIdToken(true);
    } catch (retryError) {
      console.error('[rbac-client] Failed to obtain Firebase ID token', retryError);
      return null;
    }
  }
}

async function authHeaders(userId?: string, apiKey?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = userId;
  if (apiKey) h['x-api-key'] = apiKey;
  try {
    // Prefer Firebase ID token when available
    const token = await resolveIdToken(userId);
    if (token) {
      h['Authorization'] = `Bearer ${token}`;
    } else if (userId) {
      console.warn('[rbac-client] Missing Firebase ID token for authenticated request');
    }
  } catch {
    // ignore
  }
  return h;
}

export const RbacClient = {
  async getCollections(userId: string): Promise<CollectionsResponse> {
    const res = await fetch(`/api/collections`, { headers: await authHeaders(userId) });
    if (!res.ok) throw new Error(`Failed to fetch collections (${res.status})`);
    return res.json();
  },

  async createCollection(userId: string, title: string, description = ''): Promise<any> {
    const res = await fetch(`/api/collections`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error(`Failed to create collection (${res.status})`);
    return res.json();
  },

  async getCollectionVideos(userId: string, collectionId?: string, videoLimit?: number): Promise<VideosResponse> {
    const res = await fetch(`/api/videos/collection`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ collectionId, videoLimit }),
    });
    if (!res.ok) throw new Error(`Failed to fetch videos (${res.status})`);
    return res.json();
  },

  async moveVideo(userId: string, videoId: string, targetCollectionId: string): Promise<any> {
    const res = await fetch(`/api/collections/move-video`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ videoId, targetCollectionId }),
    });
    if (!res.ok) throw new Error(`Failed to move video (${res.status})`);
    return res.json();
  },

  async copyVideo(userId: string, videoId: string, targetCollectionId: string): Promise<any> {
    const res = await fetch(`/api/collections/copy-video`, {
      method: 'POST',
      headers: await authHeaders(userId),
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
      headers: await authHeaders(userId, apiKey),
    });
    if (!res.ok) throw new Error(`Failed to delete collection (${res.status})`);
    return res.json();
  },

  async updateCollection(userId: string, collectionId: string, updates: { title?: string; description?: string }, apiKey?: string): Promise<any> {
    const res = await fetch(`/api/collections/update`, {
      method: 'PATCH',
      headers: await authHeaders(userId, apiKey),
      body: JSON.stringify({ collectionId, ...updates }),
    });
    if (!res.ok) throw new Error(`Failed to update collection (${res.status})`);
    return res.json();
  },

  async addVideoToCollection(userId: string, collectionId: string, videoData: { originalUrl: string; platform?: string; addedAt?: string }): Promise<any> {
    const res = await fetch(`/api/videos/add-to-collection`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ collectionId, videoData }),
    });
    if (!res.ok) throw new Error(`Failed to add video (${res.status})`);
    return res.json();
  },

  async deleteVideo(userId: string, videoId: string): Promise<any> {
    const res = await fetch(`/api/videos/delete`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ videoId }),
    });
    if (!res.ok) throw new Error(`Failed to delete video (${res.status})`);
    return res.json();
  },

  async toggleVideoFavorite(userId: string, videoId: string, favorite: boolean): Promise<any> {
    const res = await fetch(`/api/videos/favorite`, {
      method: 'POST',
      headers: await authHeaders(userId),
      body: JSON.stringify({ videoId, favorite }),
    });
    if (!res.ok) throw new Error(`Failed to update video favorite (${res.status})`);
    return res.json();
  },
};

export default RbacClient;
