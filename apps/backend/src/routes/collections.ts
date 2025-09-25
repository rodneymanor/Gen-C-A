import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import {
  CollectionsServiceError,
  getCollectionsAdminService,
} from '../../../../src/services/collections/collections-admin-service.js';
import { getVideoScraperService } from '../../../../src/services/video/video-scraper-service.js';
import { queueTranscriptionTask } from '../../../../src/services/transcription-runner.ts';

function extractUserId(req: Request, res: Response): string | null {
  const candidate =
    req.headers['x-user-id'] ??
    req.headers['x-user'] ??
    req.query.userId ??
    req.body?.userId;

  if (!candidate) {
    res.status(400).json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
    return null;
  }

  return String(candidate);
}

function validateApiKey(req: Request, res: Response): boolean {
  const headerKey = req.headers['x-api-key'];
  const validKeys = [process.env.NEXT_PUBLIC_API_KEY, process.env.API_KEY].filter(Boolean);
  if (!headerKey || !validKeys.includes(String(headerKey))) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }

  return true;
}

function getCollectionsService(res: Response) {
  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return null;
  }

  try {
    return getCollectionsAdminService(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[backend][collections] failed to initialise service:', message);
    res.status(500).json({ success: false, error: 'Failed to initialise collections service.' });
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function handleCollectionsError(res: Response, error: unknown, fallback: string) {
  if (error instanceof CollectionsServiceError) {
    console.warn('[backend][collections] service error:', error.message);
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][collections] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

async function listCollections(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    const result = await service.listCollections(userId);
    const response: Record<string, unknown> = {
      success: true,
      collections: result.collections,
      total: result.total,
    };

    if (Array.isArray(result.accessibleCoaches)) {
      response.accessibleCoaches = result.accessibleCoaches;
    }

    res.json(response);
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to fetch collections.');
  }
}

async function createCollection(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const service = getCollectionsService(res);
  if (!service) return;

  const { title, description = '' } = (req.body ?? {}) as Record<string, unknown>;
  try {
    const collection = await service.createCollection(userId, {
      title: typeof title === 'string' ? title : '',
      description: typeof description === 'string' ? description : '',
    });

    res.status(201).json({ success: true, message: 'Collection created successfully', collection });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to create collection.');
  }
}

async function updateCollection(req: Request, res: Response) {
  if (!validateApiKey(req, res)) return;

  const userId = extractUserId(req, res);
  if (!userId) return;

  const service = getCollectionsService(res);
  if (!service) return;

  const { collectionId, title, description } = (req.body ?? {}) as Record<string, unknown>;

  try {
    await service.updateCollection(userId, {
      collectionId,
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
    });

    res.json({ success: true, message: 'Collection updated successfully', collectionId: String(collectionId ?? '') });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to update collection.');
  }
}

async function deleteCollection(req: Request, res: Response) {
  if (!validateApiKey(req, res)) return;

  const userId = extractUserId(req, res);
  if (!userId) return;

  const collectionId = req.query.collectionId ?? req.body?.collectionId;
  if (!collectionId) {
    res.status(400).json({ success: false, error: 'collectionId required' });
    return;
  }

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    await service.deleteCollection(userId, collectionId);
    res.json({ success: true, message: 'Collection deleted successfully', collectionId: String(collectionId) });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to delete collection.');
  }
}

async function moveVideo(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { videoId, targetCollectionId } = (req.body ?? {}) as Record<string, unknown>;
  if (!videoId || typeof targetCollectionId === 'undefined') {
    res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    return;
  }

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    await service.moveVideo(userId, { videoId, targetCollectionId });
    res.json({ success: true, message: 'Video moved successfully' });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to move video.');
  }
}

async function copyVideo(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { videoId, targetCollectionId } = (req.body ?? {}) as Record<string, unknown>;
  if (!videoId || typeof targetCollectionId === 'undefined') {
    res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    return;
  }

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    const result = await service.copyVideo(userId, { videoId, targetCollectionId });
    res.json({ success: true, message: 'Video copied successfully', newVideoId: result.newVideoId });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to copy video.');
  }
}

async function deleteVideo(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { videoId } = (req.body ?? {}) as Record<string, unknown>;
  if (!videoId) {
    res.status(400).json({ success: false, error: 'videoId required' });
    return;
  }

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    await service.deleteVideo(userId, { videoId });
    res.json({ success: true, message: 'Video deleted successfully', videoId: String(videoId) });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to delete video.');
  }
}

async function toggleVideoFavorite(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { videoId, favorite } = (req.body ?? {}) as Record<string, unknown>;
  if (!videoId) {
    res.status(400).json({ success: false, error: 'videoId required' });
    return;
  }

  if (favorite === undefined) {
    res.status(400).json({ success: false, error: 'favorite flag required' });
    return;
  }

  const normalizedFavorite =
    typeof favorite === 'boolean'
      ? favorite
      : typeof favorite === 'string'
      ? ['true', '1', 'yes', 'on'].includes(favorite.toLowerCase())
      : Boolean(favorite);

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    const video = await service.toggleVideoFavorite(userId, { videoId, favorite: normalizedFavorite });
    res.json({ success: true, video });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to update video favorite.');
  }
}

async function addVideoToCollection(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { collectionId, videoData } = (req.body ?? {}) as Record<string, unknown>;
  if (!collectionId || typeof videoData !== 'object' || videoData === null || !(videoData as any).originalUrl) {
    res.status(400).json({ success: false, error: 'collectionId and videoData.originalUrl are required' });
    return;
  }

  const service = getCollectionsService(res);
  if (!service) return;

  try {
    const result = await service.addVideoToCollection(userId, { collectionId, videoData });
    let enrichedVideo = result.video ?? { id: result.videoId };

    let transcriptionQueued = false;

    try {
      const scraper = getVideoScraperService();
      const scrapeResult = await scraper.scrapeUrl((videoData as any).originalUrl);

      if (scrapeResult?.success) {
        const db = getDb();
        const transcriptionQueuedAt = nowIso();
        const metricsEntries = Object.entries({
          views: scrapeResult.viewCount,
          likes: scrapeResult.likeCount,
          comments: scrapeResult.commentCount,
          shares: scrapeResult.shareCount,
        }).filter(([, value]) => typeof value === 'number' && Number.isFinite(value as number));

        const updatedInsights = {
          ...(enrichedVideo.insights ?? {}),
          views: scrapeResult.viewCount ?? enrichedVideo.insights?.views ?? 0,
          likes: scrapeResult.likeCount ?? enrichedVideo.insights?.likes ?? 0,
          comments: scrapeResult.commentCount ?? enrichedVideo.insights?.comments ?? 0,
          saves: enrichedVideo.insights?.saves ?? 0,
        };

        const updatedMetadata: Record<string, unknown> = {
          ...(enrichedVideo.metadata ?? {}),
          originalUrl: (videoData as any).originalUrl,
          source: 'import',
          scrape: scrapeResult.raw ?? scrapeResult,
          scrapedAt: transcriptionQueuedAt,
          transcriptionStatus: 'processing',
          transcriptionQueuedAt,
        };

        if (metricsEntries.length > 0) {
          updatedMetadata.metrics = Object.fromEntries(metricsEntries);
        }

        const updatedContentMetadata = {
          ...(enrichedVideo.contentMetadata ?? {}),
          description:
            scrapeResult.description ?? enrichedVideo.contentMetadata?.description ?? enrichedVideo.title ?? '',
        };

        const thumbnailUrl = scrapeResult.thumbnailUrl ?? enrichedVideo.thumbnailUrl;

        const updates: Record<string, unknown> = {
          title: scrapeResult.title ?? enrichedVideo.title,
          thumbnailUrl,
          author: scrapeResult.author ?? enrichedVideo.author,
          duration: scrapeResult.duration ?? enrichedVideo.duration,
          url: scrapeResult.downloadUrl ?? enrichedVideo.url,
          insights: updatedInsights,
          metadata: updatedMetadata,
          contentMetadata: updatedContentMetadata,
          transcriptionStatus: 'processing',
          updatedAt: transcriptionQueuedAt,
        };

        if (db) {
          await db.collection('videos').doc(String(result.videoId)).update(updates);
        }

        queueTranscriptionTask({
          videoId: String(result.videoId),
          sourceUrl:
            scrapeResult.downloadUrl ??
            scrapeResult.videoUrl ??
            enrichedVideo.url ??
            (videoData as any).originalUrl,
          platform: scrapeResult.platform ?? (videoData as any).platform ?? enrichedVideo.platform ?? 'other',
        });
        transcriptionQueued = true;

        enrichedVideo = {
          ...enrichedVideo,
          ...updates,
          insights: updatedInsights,
          metadata: updatedMetadata,
          contentMetadata: updatedContentMetadata,
        } as typeof enrichedVideo;
      }
    } catch (enrichmentError) {
      const message =
        enrichmentError instanceof Error ? enrichmentError.message : 'Unknown enrichment failure';
      console.warn('[backend][collections] Video enrichment skipped:', message);
    }

    if (!transcriptionQueued) {
      queueTranscriptionTask({
        videoId: String(result.videoId),
        sourceUrl: enrichedVideo.url ?? (videoData as any).originalUrl,
        platform: (videoData as any).platform ?? enrichedVideo.platform ?? 'other',
      });
    }

    res.status(201).json({ success: true, videoId: result.videoId, video: enrichedVideo });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to add video to collection.');
  }
}

async function listCollectionVideos(req: Request, res: Response) {
  const userId = extractUserId(req, res);
  if (!userId) return;

  const { collectionId, videoLimit } = (req.body ?? {}) as Record<string, unknown>;
  const service = getCollectionsService(res);
  if (!service) return;

  try {
    const result = await service.listCollectionVideos(userId, {
      collectionId,
      limit: typeof videoLimit === 'number' ? videoLimit : undefined,
    });

    res.json({ success: true, videos: result.videos, totalCount: result.totalCount });
  } catch (error) {
    handleCollectionsError(res, error, 'Failed to fetch collection videos.');
  }
}

export const collectionsRouter = Router();
export const collectionVideosRouter = Router();

collectionsRouter.get('/', listCollections);
collectionsRouter.get('/user-collections', listCollections);
collectionsRouter.post('/', createCollection);
collectionsRouter.post('/update', updateCollection);
collectionsRouter.patch('/update', updateCollection);
collectionsRouter.delete('/delete', deleteCollection);
collectionsRouter.post('/move-video', moveVideo);
collectionsRouter.post('/copy-video', copyVideo);

collectionVideosRouter.post('/add-to-collection', addVideoToCollection);
collectionVideosRouter.post('/collection', listCollectionVideos);
collectionVideosRouter.post('/delete', deleteVideo);
collectionVideosRouter.post('/favorite', toggleVideoFavorite);
