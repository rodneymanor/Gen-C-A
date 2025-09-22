import fs from 'fs';
import path from 'path';

import {
  getCollectionsAdminService,
  CollectionsServiceError,
} from '../collections/collections-admin-service.js';

function guessPlatformFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch {}
  return 'unknown';
}

function generateVideoTitleFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return `TikTok Video - ${new Date().toLocaleDateString()}`;
    if (host.includes('instagram')) return `Instagram Video - ${new Date().toLocaleDateString()}`;
  } catch {}
  return `Video - ${new Date().toLocaleDateString()}`;
}

function getDefaultThumbnailForPlatform(platform) {
  const normalized = String(platform || '').toLowerCase();
  if (normalized.includes('tiktok')) return '/images/placeholder.svg';
  if (normalized.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

function createJobId() {
  return `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function readArray(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ items: [] }, null, 2));
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    const key = Object.keys(parsed || {}).find((k) => Array.isArray(parsed[k]));
    return key ? parsed[key] : [];
  } catch {
    return [];
  }
}

function writeArray(filePath, arr) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const payload = { items: arr };
  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  } catch {}
}

class ChromeExtensionCollectionsServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ChromeExtensionCollectionsServiceError';
    this.statusCode = statusCode;
  }
}

export class ChromeExtensionCollectionsService {
  constructor({ firestore, dataDir = path.join(process.cwd(), 'data') }) {
    this.firestore = firestore || null;
    this.dataDir = dataDir;
  }

  async ensureCollection(firestore, userId, title) {
    const normalizedTitle = String(title).trim();
    const snapshot = await firestore
      .collection('collections')
      .where('userId', '==', userId)
      .where('title', '==', normalizedTitle)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    const collectionsService = getCollectionsAdminService(firestore);
    const collection = await collectionsService.createCollection(userId, {
      title: normalizedTitle,
      description: '',
    });

    return collection.id;
  }

  addVideoToFallbackStore({ userId, videoUrl, collectionTitle, title }) {
    const collectionsFile = path.join(this.dataDir, 'collections.json');
    const videosFile = path.join(this.dataDir, 'videos.json');
    const collections = readArray(collectionsFile);
    const now = new Date();

    let collection = collections.find(
      (c) => c.userId === userId && c.title === collectionTitle,
    );

    if (!collection) {
      collection = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        title: collectionTitle,
        description: '',
        userId,
        videoCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      collections.push(collection);
      writeArray(collectionsFile, collections);
    }

    const videos = readArray(videosFile);
    const videoId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const platform = guessPlatformFromUrl(videoUrl);
    const fallbackVideo = {
      id: videoId,
      url: videoUrl,
      title: title || generateVideoTitleFromUrl(videoUrl),
      platform,
      thumbnailUrl: getDefaultThumbnailForPlatform(platform),
      author: 'Unknown Creator',
      transcript: 'Transcript not available',
      visualContext: 'Imported via Import Video',
      fileSize: 0,
      duration: 0,
      userId,
      collectionId: collection.id,
      addedAt: now.toISOString(),
      components: { hook: '', bridge: '', nugget: '', wta: '' },
      contentMetadata: { hashtags: [], mentions: [], description: '' },
      insights: { views: 0, likes: 0, comments: 0, saves: 0 },
      metadata: { source: 'import' },
    };

    videos.unshift(fallbackVideo);
    writeArray(videosFile, videos);

    collection.videoCount = (collection.videoCount || 0) + 1;
    collection.updatedAt = now.toISOString();
    writeArray(collectionsFile, collections);

    return {
      collectionId: collection.id,
      videoId,
      jobId: createJobId(),
      collectionTitle,
      videoUrl,
    };
  }

  async addVideo({ userId, videoUrl, collectionTitle, title }) {
    if (!userId) {
      throw new ChromeExtensionCollectionsServiceError('userId is required', 400);
    }
    if (!videoUrl) {
      throw new ChromeExtensionCollectionsServiceError('videoUrl is required', 400);
    }
    if (!collectionTitle) {
      throw new ChromeExtensionCollectionsServiceError('collectionTitle is required', 400);
    }

    const normalizedUrl = String(videoUrl).trim();
    const normalizedTitle = String(collectionTitle).trim();
    const optionalTitle = title && String(title).trim() ? String(title).trim() : undefined;

    if (!normalizedUrl) {
      throw new ChromeExtensionCollectionsServiceError('videoUrl is required', 400);
    }
    if (!normalizedTitle) {
      throw new ChromeExtensionCollectionsServiceError('collectionTitle is required', 400);
    }

    if (!this.firestore) {
      return this.addVideoToFallbackStore({
        userId,
        videoUrl: normalizedUrl,
        collectionTitle: normalizedTitle,
        title: optionalTitle,
      });
    }

    try {
      const collectionId = await this.ensureCollection(this.firestore, userId, normalizedTitle);
      const collectionsService = getCollectionsAdminService(this.firestore);
      const result = await collectionsService.addVideoToCollection(userId, {
        collectionId,
        videoData: {
          originalUrl: normalizedUrl,
          platform: guessPlatformFromUrl(normalizedUrl),
          title: optionalTitle,
        },
      });

      return {
        collectionId,
        videoId: result.videoId,
        jobId: createJobId(),
        collectionTitle: normalizedTitle,
        videoUrl: normalizedUrl,
      };
    } catch (error) {
      if (error instanceof CollectionsServiceError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ChromeExtensionCollectionsServiceError(message, 500);
    }
  }
}

export function getChromeExtensionCollectionsService(options) {
  return new ChromeExtensionCollectionsService(options || {});
}

export { ChromeExtensionCollectionsServiceError };
