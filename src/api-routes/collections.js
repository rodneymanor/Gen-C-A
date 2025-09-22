/**
 * Collections + Videos API Routes (Express)
 * Migrated from Next.js route handlers to Vite-Express.
 * Uses Firebase Admin SDK directly to be Node-compatible.
 */

import { getDb as getAdminDb } from './utils/firebase-admin.js';
import { CollectionsServiceError, getCollectionsAdminService } from '../services/collections/collections-admin-service.js';

// -----------------------------
// Firebase Admin Initialization
// -----------------------------
function requireUserId(req, res) {
  const userId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId);
  if (!userId) {
    res.status(400).json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
    return null;
  }
  return String(userId);
}

function validateApiKey(req, res) {
  const apiKey = req.headers['x-api-key'];
  const valid = apiKey && (apiKey === process.env.NEXT_PUBLIC_API_KEY || apiKey === process.env.API_KEY);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// -----------------------------
// Route Handlers
// -----------------------------

function getCollectionsService() {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore not initialized for collections service');
  }

  return getCollectionsAdminService(db);
}

function handleCollectionsError(res, error, fallbackMessage, logPrefix) {
  if (error instanceof CollectionsServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage });
}

export async function handleGetCollections(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const service = getCollectionsService();
    const result = await service.listCollections(userId);
    const response = {
      success: true,
      collections: result.collections,
      total: result.total,
    };
    if (Array.isArray(result.accessibleCoaches)) {
      response.accessibleCoaches = result.accessibleCoaches;
    }

    res.json(response);
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to fetch collections', '[GET /api/collections] error:');
  }
}

export async function handleCreateCollection(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { title, description = '' } = req.body || {};
    const service = getCollectionsService();
    const collection = await service.createCollection(userId, { title, description });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection,
    });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to create collection', '[POST /api/collections] error:');
  }
}

export async function handleGetUserCollections(req, res) {
  // Same as handleGetCollections for this app
  return handleGetCollections(req, res);
}

export async function handleGetCollectionVideos(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { collectionId, videoLimit } = req.body || {};
    const service = getCollectionsService();
    const result = await service.listCollectionVideos(userId, { collectionId, limit: videoLimit });

    return res.json({ success: true, videos: result.videos, totalCount: result.totalCount });
  } catch (e) {
    if (e instanceof CollectionsServiceError) {
      return res.status(e.statusCode).json({ success: false, error: e.message });
    }
    console.error('[POST /api/videos/collection] error:', e);
    res.status(500).json({ success: false, videos: [], totalCount: 0 });
  }
}

export async function handleAddVideoToCollection(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { collectionId, videoData } = req.body || {};
    if (!collectionId || !videoData || !videoData.originalUrl) {
      return res.status(400).json({ success: false, error: 'collectionId and videoData.originalUrl are required' });
    }
    const service = getCollectionsService();
    const result = await service.addVideoToCollection(userId, { collectionId, videoData });

    res.status(201).json({ success: true, videoId: result.videoId, video: result.video });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to add video to collection', '[POST /api/videos/add-to-collection] error:');
  }
}

export async function handleMoveVideo(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { videoId, targetCollectionId } = req.body || {};
    if (!videoId || typeof targetCollectionId === 'undefined') {
      return res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    }
    const service = getCollectionsService();
    await service.moveVideo(userId, { videoId, targetCollectionId });

    res.json({ success: true, message: 'Video moved successfully' });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to move video', '[POST /api/collections/move-video] error:');
  }
}

export async function handleCopyVideo(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { videoId, targetCollectionId } = req.body || {};
    if (!videoId || typeof targetCollectionId === 'undefined') {
      return res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    }
    const service = getCollectionsService();
    const result = await service.copyVideo(userId, { videoId, targetCollectionId });

    res.json({ success: true, message: 'Video copied successfully', newVideoId: result.newVideoId });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to copy video', '[POST /api/collections/copy-video] error:');
  }
}

export async function handleDeleteVideo(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { videoId } = req.body || {};
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'videoId is required' });
    }

    const service = getCollectionsService();
    await service.deleteVideo(userId, { videoId });

    res.json({ success: true, message: 'Video deleted successfully', videoId: String(videoId) });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to delete video', '[POST /api/videos/delete] error:');
  }
}

export async function handleDeleteCollection(req, res) {
  try {
    if (!validateApiKey(req, res)) return;
    const userId = requireUserId(req, res);
    if (!userId) return;
    const collectionId = req.query.collectionId || (req.body && req.body.collectionId);
    if (!collectionId) return res.status(400).json({ success: false, error: 'collectionId required' });
    const service = getCollectionsService();
    await service.deleteCollection(userId, collectionId);
    res.json({ success: true, message: 'Collection deleted successfully', collectionId: String(collectionId) });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to delete collection', '[DELETE /api/collections/delete] error:');
  }
}

export async function handleUpdateCollection(req, res) {
  try {
    if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });
    if (!validateApiKey(req, res)) return;
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { collectionId, title, description } = req.body || {};
    const service = getCollectionsService();
    await service.updateCollection(userId, { collectionId, title, description });
    res.json({ success: true, message: 'Collection updated successfully', collectionId: String(collectionId) });
  } catch (e) {
    handleCollectionsError(res, e, 'Failed to update collection', '[PATCH /api/collections/update] error:');
  }
}
