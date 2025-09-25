import { FieldValue } from 'firebase-admin/firestore';

class CollectionsServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CollectionsServiceError';
    this.statusCode = statusCode;
  }
}

function toIsoString(value) {
  if (!value) return value;
  try {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date ? date.toISOString() : date;
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    return value;
  } catch (error) {
    console.warn('[CollectionsAdminService] Failed to convert timestamp to ISO string:', error?.message || error);
    return value;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function generateTitleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('tiktok')) return `TikTok Video - ${new Date().toLocaleDateString()}`;
    if (host.includes('instagram')) return `Instagram Video - ${new Date().toLocaleDateString()}`;
  } catch (error) {
    console.warn('[CollectionsAdminService] Unable to generate title from URL:', error?.message || error);
  }
  return `Video - ${new Date().toLocaleDateString()}`;
}

function getDefaultThumbnail(platform) {
  const normalized = String(platform || '').toLowerCase();
  if (normalized.includes('tiktok')) return '/images/placeholder.svg';
  if (normalized.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

function guessPlatformFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch (error) {
    console.warn('[CollectionsAdminService] Unable to detect platform from URL:', error?.message || error);
  }
  return 'unknown';
}

const SERVICE_INSTANCE_KEY = '__collectionsAdminService__';

export class CollectionsAdminService {
  constructor(firestore) {
    if (!firestore) {
      throw new Error('Firestore instance is required to initialize CollectionsAdminService');
    }
    this.db = firestore;
  }

  async getUserProfile(userId) {
    const snapshot = await this.db.collection('users').doc(userId).get();
    if (!snapshot.exists) {
      return null;
    }
    const data = snapshot.data() || {};
    return {
      uid: userId,
      email: data.email || '',
      displayName: data.name || data.displayName || 'User',
      role: data.role || 'creator',
      coachId: data.coachId,
      ...data,
    };
  }

  async getAccessibleCoaches(profile) {
    if (!profile) return [];

    if (profile.role === 'super_admin') {
      const coachesSnapshot = await this.db.collection('users').where('role', '==', 'coach').get();
      return coachesSnapshot.docs.map((doc) => doc.id);
    }

    if (profile.role === 'coach') {
      return [profile.uid];
    }

    if (profile.coachId) {
      return [profile.coachId];
    }

    const accessSnapshot = await this.db.collection('user_coach_access').doc(profile.uid).get();
    if (accessSnapshot.exists) {
      const data = accessSnapshot.data();
      return Array.isArray(data?.coaches) ? data.coaches : [];
    }

    return [];
  }

  async ensureUserProfile(userId) {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new CollectionsServiceError('User not found', 404);
    }
    return profile;
  }

  mapCollectionDoc(doc) {
    const data = doc.data() || {};
    return { id: doc.id, ...data };
  }

  mapVideoDoc(doc) {
    const data = doc.data() || {};
    return {
      id: doc.id,
      ...data,
      addedAt: toIsoString(data.addedAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  }

  async listCollections(userId) {
    const profile = await this.ensureUserProfile(userId);
    let collections = [];
    let accessibleCoaches = [];

    if (profile.role === 'super_admin') {
      const snapshot = await this.db.collection('collections').orderBy('updatedAt', 'desc').get();
      collections = snapshot.docs.map((doc) => this.mapCollectionDoc(doc));
    } else {
      accessibleCoaches = await this.getAccessibleCoaches(profile);
      if (accessibleCoaches.length === 0) {
        return { collections: [], total: 0, accessibleCoaches: [] };
      }

      const snapshot = await this.db
        .collection('collections')
        .where('userId', 'in', accessibleCoaches.slice(0, 10))
        .orderBy('updatedAt', 'desc')
        .get();
      collections = snapshot.docs.map((doc) => this.mapCollectionDoc(doc));
    }

    return {
      collections,
      total: collections.length,
      accessibleCoaches,
    };
  }

  async createCollection(userId, payload) {
    const title = String(payload?.title || '').trim();
    const description = String(payload?.description || '').trim();

    if (!title) {
      throw new CollectionsServiceError('Title is required', 400);
    }
    if (title.length > 80) {
      throw new CollectionsServiceError('Title too long (max 80)', 400);
    }
    if (description.length > 500) {
      throw new CollectionsServiceError('Description too long (max 500)', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    if (profile.role === 'creator') {
      throw new CollectionsServiceError('Insufficient permissions to create collections', 403);
    }

    const docRef = await this.db.collection('collections').add({
      title,
      description,
      userId,
      videoCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      id: docRef.id,
      title,
      description,
      userId,
      videoCount: 0,
    };
  }

  async getCollectionContext(collectionId) {
    const snapshot = await this.db.collection('collections').doc(String(collectionId)).get();
    if (!snapshot.exists) {
      throw new CollectionsServiceError('Collection not found', 404);
    }
    return { id: snapshot.id, data: snapshot.data() || {} };
  }

  async listCollectionVideos(userId, { collectionId, limit }) {
    const profile = await this.ensureUserProfile(userId);
    const safeLimit = Math.min(Number(limit) || 24, 100);
    let videos = [];

    const queryVideosByCollection = async (targetCollectionId) => {
      try {
        const snapshot = await this.db
          .collection('videos')
          .where('collectionId', '==', targetCollectionId)
          .orderBy('addedAt', 'desc')
          .limit(safeLimit)
          .get();
        return snapshot.docs.map((doc) => this.mapVideoDoc(doc));
      } catch (error) {
        const backupLimit = Math.max(safeLimit * 5, 100);
        const snapshot = await this.db
          .collection('videos')
          .where('collectionId', '==', targetCollectionId)
          .limit(backupLimit)
          .get();
        const items = snapshot.docs.map((doc) => this.mapVideoDoc(doc));
        items.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
        return items.slice(0, safeLimit);
      }
    };

    if (collectionId && collectionId !== 'all-videos') {
      const { data: collectionData } = await this.getCollectionContext(collectionId);

      if (profile.role !== 'super_admin') {
        const accessibleCoaches = await this.getAccessibleCoaches(profile);
        const ownerId = collectionData.userId;
        if (!ownerId || !accessibleCoaches.includes(ownerId)) {
          throw new CollectionsServiceError('Access denied', 403);
        }
      }

      videos = await queryVideosByCollection(collectionId);
      return { videos, totalCount: videos.length };
    }

    if (profile.role === 'super_admin') {
      const snapshot = await this.db
        .collection('videos')
        .orderBy('addedAt', 'desc')
        .limit(safeLimit)
        .get();
      videos = snapshot.docs.map((doc) => this.mapVideoDoc(doc));
    } else {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      if (accessibleCoaches.length === 0) {
        return { videos: [], totalCount: 0 };
      }
      try {
        const snapshot = await this.db
          .collection('videos')
          .where('userId', 'in', accessibleCoaches.slice(0, 10))
          .orderBy('addedAt', 'desc')
          .limit(safeLimit)
          .get();
        videos = snapshot.docs.map((doc) => this.mapVideoDoc(doc));
      } catch (error) {
        const backupLimit = Math.max(safeLimit * 10, 200);
        const snapshot = await this.db
          .collection('videos')
          .orderBy('addedAt', 'desc')
          .limit(backupLimit)
          .get();
        const allowed = new Set(accessibleCoaches.slice(0, 10));
        videos = snapshot.docs
          .map((doc) => this.mapVideoDoc(doc))
          .filter((video) => allowed.has(video.userId))
          .slice(0, safeLimit);
      }
    }

    return { videos, totalCount: videos.length };
  }

  async addVideoToCollection(userId, { collectionId, videoData }) {
    if (!collectionId) {
      throw new CollectionsServiceError('collectionId is required', 400);
    }
    if (!videoData?.originalUrl) {
      throw new CollectionsServiceError('videoData.originalUrl is required', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const platform = videoData.platform || guessPlatformFromUrl(videoData.originalUrl);

    const collectionContext = await this.getCollectionContext(collectionId);
    const collectionOwnerId = collectionContext.data?.userId || userId;

    if (profile.role === 'creator') {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      if (!accessibleCoaches.includes(collectionOwnerId)) {
        throw new CollectionsServiceError('Insufficient permissions to add videos to this collection', 403);
      }
    }

    const now = nowIso();

    const video = {
      url: videoData.originalUrl,
      originalUrl: videoData.originalUrl,
      title: generateTitleFromUrl(videoData.originalUrl),
      platform,
      thumbnailUrl: getDefaultThumbnail(platform),
      author: 'Unknown Creator',
      transcript: '',
      visualContext: 'Imported via Import Video',
      fileSize: 0,
      duration: 0,
      userId: collectionOwnerId,
      collectionId,
      addedAt: videoData.addedAt || now,
      components: videoData.processing?.components || { hook: '', bridge: '', nugget: '', wta: '' },
      contentMetadata: { hashtags: [], mentions: [], description: '' },
      insights: { views: 0, likes: 0, comments: 0, saves: 0 },
      transcriptionStatus: 'processing',
      metadata: {
        source: 'import',
        originalUrl: videoData.originalUrl,
        transcriptionStatus: 'processing',
        transcriptionQueuedAt: now,
      },
    };

    const docRef = await this.db.collection('videos').add(video);

    if (collectionId && collectionId !== 'all-videos') {
      const collectionRef = this.db.collection('collections').doc(String(collectionId));
      const snapshot = await collectionRef.get();
      if (snapshot.exists) {
        const current = snapshot.data()?.videoCount || 0;
        await collectionRef.update({ videoCount: current + 1, updatedAt: nowIso() });
      }
    }

    return { videoId: docRef.id, video: { id: docRef.id, ...video } };
  }

  async moveVideo(userId, { videoId, targetCollectionId }) {
    if (!videoId) {
      throw new CollectionsServiceError('videoId is required', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const videoRef = this.db.collection('videos').doc(String(videoId));
    const videoSnapshot = await videoRef.get();
    if (!videoSnapshot.exists) {
      throw new CollectionsServiceError('Video not found', 404);
    }
    const video = videoSnapshot.data();

    if (profile.role !== 'super_admin') {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      if (!accessibleCoaches.includes(video.userId)) {
        throw new CollectionsServiceError('Insufficient permissions to move this video', 403);
      }
    }

    const previousCollectionId = video.collectionId;
    let targetOwnerId = video.userId;
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const { data: targetData } = await this.getCollectionContext(targetCollectionId);
      targetOwnerId = targetData.userId || targetOwnerId;
    }

    await videoRef.update({
      collectionId: targetCollectionId,
      userId: targetOwnerId,
      updatedAt: nowIso(),
    });

    await this.updateCollectionCounts({ previousCollectionId, targetCollectionId });
  }

  async deleteVideo(userId, { videoId }) {
    if (!videoId) {
      throw new CollectionsServiceError('videoId is required', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const videoRef = this.db.collection('videos').doc(String(videoId));
    const videoSnapshot = await videoRef.get();
    if (!videoSnapshot.exists) {
      throw new CollectionsServiceError('Video not found', 404);
    }
    const video = videoSnapshot.data() || {};

    if (profile.role !== 'super_admin') {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      const ownerId = video.userId;
      const isOwner = ownerId === userId;
      const hasCoachAccess = ownerId ? accessibleCoaches.includes(ownerId) : false;
      if (!isOwner && !hasCoachAccess) {
        throw new CollectionsServiceError('Insufficient permissions to delete this video', 403);
      }
    }

    await videoRef.delete();
    await this.updateCollectionCounts({ previousCollectionId: video.collectionId, targetCollectionId: null });
  }

  async toggleVideoFavorite(userId, { videoId, favorite }) {
    if (!videoId) {
      throw new CollectionsServiceError('videoId is required', 400);
    }

    if (typeof favorite !== 'boolean') {
      throw new CollectionsServiceError('favorite must be a boolean', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const videoRef = this.db.collection('videos').doc(String(videoId));
    const videoSnapshot = await videoRef.get();

    if (!videoSnapshot.exists) {
      throw new CollectionsServiceError('Video not found', 404);
    }

    const video = videoSnapshot.data() || {};

    if (profile.role !== 'super_admin') {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      const ownerId = video.userId;
      const isOwner = ownerId === userId;
      const hasCoachAccess = ownerId ? accessibleCoaches.includes(ownerId) : false;
      if (!isOwner && !hasCoachAccess) {
        throw new CollectionsServiceError('Insufficient permissions to update this video', 403);
      }
    }

    const updatePayload = {
      favorite,
      updatedAt: nowIso(),
    };

    if (favorite) {
      updatePayload.tags = FieldValue.arrayUnion('favorites');
      updatePayload['metadata.tags'] = FieldValue.arrayUnion('favorites');
    } else {
      updatePayload.tags = FieldValue.arrayRemove('favorites');
      updatePayload['metadata.tags'] = FieldValue.arrayRemove('favorites');
    }

    await videoRef.update(updatePayload);

    const refreshedSnapshot = await videoRef.get();
    return this.mapVideoDoc(refreshedSnapshot);
  }

  async copyVideo(userId, { videoId, targetCollectionId }) {
    if (!videoId) {
      throw new CollectionsServiceError('videoId is required', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const videoRef = this.db.collection('videos').doc(String(videoId));
    const videoSnapshot = await videoRef.get();
    if (!videoSnapshot.exists) {
      throw new CollectionsServiceError('Video not found', 404);
    }
    const video = videoSnapshot.data();

    if (profile.role !== 'super_admin') {
      const accessibleCoaches = await this.getAccessibleCoaches(profile);
      if (!accessibleCoaches.includes(video.userId)) {
        throw new CollectionsServiceError('Insufficient permissions to copy this video', 403);
      }
    }

    let targetOwnerId = video.userId;
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const { data: targetData } = await this.getCollectionContext(targetCollectionId);
      targetOwnerId = targetData.userId || targetOwnerId;
    }

    const cloned = {
      ...video,
      userId: targetOwnerId,
      collectionId: targetCollectionId,
      addedAt: nowIso(),
    };
    delete cloned.id;

    const newRef = await this.db.collection('videos').add(cloned);

    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const targetRef = this.db.collection('collections').doc(String(targetCollectionId));
      const snapshot = await targetRef.get();
      if (snapshot.exists) {
        const current = snapshot.data()?.videoCount || 0;
        await targetRef.update({ videoCount: current + 1, updatedAt: nowIso() });
      }
    }

    return { newVideoId: newRef.id };
  }

  async deleteCollection(userId, collectionId) {
    if (!collectionId) {
      throw new CollectionsServiceError('collectionId is required', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const collectionRef = this.db.collection('collections').doc(String(collectionId));
    const collectionSnapshot = await collectionRef.get();
    if (!collectionSnapshot.exists) {
      throw new CollectionsServiceError('Collection not found', 404);
    }
    const collectionData = collectionSnapshot.data();

    const isOwner = collectionData.userId === userId;
    const isSuperAdmin = profile.role === 'super_admin';
    const isCoach = profile.role === 'coach';

    if (!isSuperAdmin && !(isCoach && isOwner)) {
      throw new CollectionsServiceError('Insufficient permissions', 403);
    }

    await collectionRef.delete();
  }

  async updateCollection(userId, { collectionId, title, description }) {
    if (!collectionId) {
      throw new CollectionsServiceError('collectionId is required', 400);
    }

    const updates = {};
    if (typeof title === 'string') {
      const trimmed = title.trim();
      if (!trimmed) {
        throw new CollectionsServiceError('Title cannot be empty', 400);
      }
      if (trimmed.length > 80) {
        throw new CollectionsServiceError('Title too long (max 80)', 400);
      }
      updates.title = trimmed;
    }
    if (typeof description === 'string') {
      const trimmed = description.trim();
      if (trimmed.length > 500) {
        throw new CollectionsServiceError('Description too long (max 500)', 400);
      }
      updates.description = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      throw new CollectionsServiceError('No valid fields provided to update', 400);
    }

    const profile = await this.ensureUserProfile(userId);
    const collectionRef = this.db.collection('collections').doc(String(collectionId));
    const collectionSnapshot = await collectionRef.get();
    if (!collectionSnapshot.exists) {
      throw new CollectionsServiceError('Collection not found', 404);
    }
    const collectionData = collectionSnapshot.data();

    const isOwner = collectionData.userId === userId;
    const isSuperAdmin = profile.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      throw new CollectionsServiceError('Access denied', 403);
    }

    updates.updatedAt = nowIso();
    await collectionRef.update(updates);
  }

  async updateCollectionCounts({ previousCollectionId, targetCollectionId }) {
    const updateCount = async (collectionId, delta) => {
      if (!collectionId || collectionId === 'all-videos') {
        return;
      }
      const collectionRef = this.db.collection('collections').doc(String(collectionId));
      const snapshot = await collectionRef.get();
      if (snapshot.exists) {
        const current = snapshot.data()?.videoCount || 0;
        const next = Math.max(0, current + delta);
        await collectionRef.update({ videoCount: next, updatedAt: nowIso() });
      }
    };

    await Promise.all([
      updateCount(previousCollectionId, -1),
      updateCount(targetCollectionId, 1),
    ]);
  }
}

export { CollectionsServiceError };

export function getCollectionsAdminService(firestore) {
  if (!firestore) {
    throw new Error('Firestore instance is required to get CollectionsAdminService');
  }

  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new CollectionsAdminService(firestore);
  }

  return globalThis[SERVICE_INSTANCE_KEY];
}
