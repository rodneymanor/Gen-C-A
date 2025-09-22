import type { Request, Response } from 'express';
import { Router } from 'express';
import path from 'path';

import {
  getCollectionsAdminService,
  CollectionsServiceError,
} from '../../../../../src/services/collections/collections-admin-service.js';
import {
  DATA_DIR,
  TEST_MODE_API_KEY,
  ensureDb,
  resolveUser,
  readArray,
  writeArray,
  getApiKeyFromRequest,
  guessPlatformFromUrl,
  generateVideoTitleFromUrl,
  getDefaultThumbnailForPlatform,
  createJobId,
} from './utils.js';

function sendCollectionsError(res: Response, error: unknown, fallback: string) {
  if (error instanceof CollectionsServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][collections] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

export const collectionsRouter = Router();

collectionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKeyFromRequest(req);
    const isTestMode = process.env.NODE_ENV === 'development' && apiKey === TEST_MODE_API_KEY;

    if (isTestMode) {
      const db = ensureDb();
      if (db) {
        try {
          const snapshot = await db
            .collection('collections')
            .where('userId', '==', 'test-user')
            .limit(10)
            .get();
          const collections = snapshot.docs.map((doc) => {
            const data = doc.data() || {};
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
            };
          });
          res.json({
            success: true,
            user: {
              id: 'test-user',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'user',
            },
            collections,
            total: collections.length,
            timestamp: new Date().toISOString(),
          });
          return;
        } catch (error) {
          console.error('[backend][extension] test collections fetch failed:', error);
        }
      }

      res.json({
        success: true,
        user: {
          id: 'test-user',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'user',
        },
        collections: [
          {
            id: 'Q3J2kI0t8OmlqCbGh594',
            title: 'Test Collection',
            description: '',
            videoCount: 2,
            userId: 'test-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'mock-collection-2',
            title: 'Chrome Extension Test',
            description: '',
            videoCount: 2,
            userId: 'test-user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    if (!db) {
      const file = path.join(DATA_DIR, 'collections.json');
      const arr = readArray(file);
      const collections = arr.filter((c: any) => c.userId === String(user.uid));
      res.json({ success: true, collections, total: collections.length });
      return;
    }

    const service = getCollectionsAdminService(db);
    const result = await service.listCollections(user.uid);
    res.json({ success: true, ...result });
  } catch (error) {
    sendCollectionsError(res, error, 'Failed to fetch collections');
  }
});

collectionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const apiKey = getApiKeyFromRequest(req);
    const isTestMode = process.env.NODE_ENV === 'development' && apiKey === TEST_MODE_API_KEY;
    const title = String((req.body as Record<string, unknown> | undefined)?.title || '').trim();
    const description = String((req.body as Record<string, unknown> | undefined)?.description || '').trim();
    if (!title) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }

    if (isTestMode) {
      const db = ensureDb();
      const now = new Date();
      if (db) {
        const docRef = await db.collection('collections').add({
          title,
          description,
          userId: 'test-user',
          videoCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        res.status(201).json({
          success: true,
          message: 'Collection created successfully',
          collection: {
            id: docRef.id,
            title,
            description,
            userId: 'test-user',
            videoCount: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        });
        return;
      }

      const file = path.join(DATA_DIR, 'collections.json');
      const arr = readArray(file);
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const coll = {
        id,
        title,
        description,
        userId: 'test-user',
        videoCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      arr.push(coll);
      writeArray(file, arr);
      res.status(201).json({ success: true, message: 'Collection created successfully', collection: coll });
      return;
    }

    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    if (!db) {
      const file = path.join(DATA_DIR, 'collections.json');
      const arr = readArray(file);
      const exists = arr.find(
        (c: any) => c.userId === String(user.uid) && c.title === title,
      );
      if (exists) {
        res.status(200).json({ success: true, collection: exists, message: 'Already exists' });
        return;
      }
      const now = new Date();
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const coll = {
        id,
        title,
        description,
        userId: String(user.uid),
        videoCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      arr.push(coll);
      writeArray(file, arr);
      res.status(201).json({ success: true, message: 'Collection created successfully', collection: coll });
      return;
    }

    const service = getCollectionsAdminService(db);
    const result = await service.createCollection(user.uid, { title, description });
    res.status(201).json({ success: true, message: 'Collection created successfully', collection: result });
  } catch (error) {
    sendCollectionsError(res, error, 'Failed to create collection');
  }
});

collectionsRouter.post('/add-video', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const { videoUrl, collectionTitle, title } = req.body || {};
    if (!videoUrl || !collectionTitle) {
      res.status(400).json({ success: false, error: 'videoUrl and collectionTitle are required' });
      return;
    }

    if (!db) {
      const collectionsFile = path.join(DATA_DIR, 'collections.json');
      const videosFile = path.join(DATA_DIR, 'videos.json');
      const collections = readArray(collectionsFile);
      const now = new Date();
      let collectionId = collections.find(
        (c: any) => c.userId === user.uid && c.title === String(collectionTitle).trim(),
      )?.id;
      if (!collectionId) {
        collectionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        collections.push({
          id: collectionId,
          title: String(collectionTitle).trim(),
          description: '',
          userId: user.uid,
          videoCount: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        writeArray(collectionsFile, collections);
      }

      const videos = readArray(videosFile);
      const videoId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const platform = guessPlatformFromUrl(String(videoUrl));
      const fallbackVideo = {
        id: videoId,
        url: String(videoUrl).trim(),
        title: title ? String(title).trim() : generateVideoTitleFromUrl(videoUrl),
        platform,
        thumbnailUrl: getDefaultThumbnailForPlatform(platform),
        author: 'Unknown Creator',
        transcript: 'Transcript not available',
        visualContext: 'Imported via Import Video',
        fileSize: 0,
        duration: 0,
        userId: user.uid,
        collectionId,
        addedAt: now.toISOString(),
        components: { hook: '', bridge: '', nugget: '', wta: '' },
        contentMetadata: { hashtags: [], mentions: [], description: '' },
        insights: { views: 0, likes: 0, comments: 0, saves: 0 },
        metadata: { source: 'import' },
      };
      videos.unshift(fallbackVideo);
      writeArray(videosFile, videos);

      const collIndex = collections.findIndex((c: any) => c.id === collectionId);
      if (collIndex !== -1) {
        const current = collections[collIndex].videoCount || 0;
        collections[collIndex] = {
          ...collections[collIndex],
          videoCount: current + 1,
          updatedAt: now.toISOString(),
        };
        writeArray(collectionsFile, collections);
      }

      const jobId = createJobId();
      res.status(201).json({
        success: true,
        message: 'Video added to processing queue',
        jobId,
        collectionTitle: String(collectionTitle).trim(),
        collectionId,
        videoUrl,
        videoId,
      });
      return;
    }

    const service = getCollectionsAdminService(db);
    const normalizedTitle = String(collectionTitle).trim();
    let collectionId: string | undefined;
    const existing = await db
      .collection('collections')
      .where('userId', '==', user.uid)
      .where('title', '==', normalizedTitle)
      .limit(1)
      .get();

    if (!existing.empty) {
      collectionId = existing.docs[0].id;
    } else {
      const created = await service.createCollection(user.uid, {
        title: normalizedTitle,
        description: '',
      });
      collectionId = created.id;
    }

    const result = await service.addVideoToCollection(user.uid, {
      collectionId,
      videoData: {
        originalUrl: String(videoUrl).trim(),
        platform: guessPlatformFromUrl(String(videoUrl)),
        title: title ? String(title).trim() : undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Video added to processing queue',
      jobId: createJobId(),
      collectionTitle: normalizedTitle,
      collectionId,
      videoUrl,
      videoId: result.videoId,
    });
  } catch (error) {
    sendCollectionsError(res, error, 'Failed to add video to collection');
  }
});
