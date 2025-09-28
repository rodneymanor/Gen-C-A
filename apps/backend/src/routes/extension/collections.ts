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
} from './utils.js';
import {
  ChromeExtensionCollectionsServiceError,
  getChromeExtensionCollectionsService,
} from '../../../../../src/services/chrome-extension/chrome-extension-collections-service.js';

function guessPlatformFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch {}
  return 'unknown';
}

function sendCollectionsError(res: Response, error: unknown, fallback: string) {
  if (error instanceof CollectionsServiceError || error instanceof ChromeExtensionCollectionsServiceError) {
    const statusCode = (error as CollectionsServiceError | ChromeExtensionCollectionsServiceError).statusCode;
    res.status(statusCode).json({ success: false, error: error.message });
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

    console.log('[chrome-extension][backend] add-video request', {
      userId: user.uid,
      collectionTitle,
      hasCustomTitle: Boolean(title),
      urlPreview: String(videoUrl).slice(0, 80),
      hasDb: Boolean(db),
    });

    const service = getChromeExtensionCollectionsService({ firestore: db, dataDir: DATA_DIR });
    const normalizedUrl = String(videoUrl).trim();
    const normalizedTitle = String(collectionTitle).trim();

    if (!normalizedUrl) {
      res.status(400).json({ success: false, error: 'videoUrl is required' });
      return;
    }

    if (!normalizedTitle) {
      res.status(400).json({ success: false, error: 'collectionTitle is required' });
      return;
    }

    if (!db) {
      const fallback = service.addVideoToFallbackStore({
        userId: String(user.uid),
        videoUrl: normalizedUrl,
        collectionTitle: normalizedTitle,
        title: title ? String(title) : undefined,
      });

      console.log('[chrome-extension][backend] add-video fallback store', fallback);

      res.status(201).json({
        success: true,
        message: 'Video added to processing queue',
        ...fallback,
      });
      return;
    }

    const collectionId = await service.ensureCollection(db, String(user.uid), normalizedTitle);

    const nextAppUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      process.env.INTERNAL_APP_URL ||
      'http://localhost:3000';

    const targetUrl = new URL('/api/videos/add-to-collection', nextAppUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': String(user.uid),
    };

    if (user.apiKey) {
      headers['x-api-key'] = user.apiKey;
    }

    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      headers['authorization'] = authHeader;
    }

    const payload = {
      userId: String(user.uid),
      collectionId,
      videoData: {
        originalUrl: normalizedUrl,
        platform: guessPlatformFromUrl(normalizedUrl),
        addedAt: new Date().toISOString(),
        processing: {
          components: {
            hook: title ? String(title) : 'Auto-generated hook',
            bridge: '',
            nugget: '',
            wta: '',
          },
        },
      },
    };

    console.log('[chrome-extension][backend] forwarding add-video to Next route', {
      userId: user.uid,
      collectionId,
      target: targetUrl.toString(),
    });

    try {
      const response = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const jobId = `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

        console.log('[chrome-extension][backend] add-video forward success', {
          userId: user.uid,
          collectionId,
          videoId: data?.videoId,
        });

        res.status(response.status).json({
          success: true,
          message: data?.message || 'Video added successfully to collection',
          jobId,
          collectionTitle: normalizedTitle,
          collectionId,
          videoUrl: normalizedUrl,
          videoId: data?.videoId,
          video: data?.video,
          timestamp: data?.timestamp,
        });
        return;
      }

      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch (parseError) {
        errorBody = { error: 'Failed to add video to collection' };
      }

      console.warn('[chrome-extension][backend] add-video forward failed, falling back to admin service', {
        status: response.status,
        error: errorBody,
      });
    } catch (networkError) {
      console.warn('[chrome-extension][backend] add-video forward network error, falling back', {
        error: networkError instanceof Error ? networkError.message : networkError,
      });
    }

    try {
      const fallbackResult = await service.addVideo({
        userId: String(user.uid),
        videoUrl: normalizedUrl,
        collectionTitle: normalizedTitle,
        title: title ? String(title) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Video added successfully to collection',
        jobId: fallbackResult.jobId,
        collectionTitle: fallbackResult.collectionTitle,
        collectionId: fallbackResult.collectionId,
        videoUrl: fallbackResult.videoUrl,
        videoId: fallbackResult.videoId,
      });
    } catch (fallbackError) {
      console.error('[chrome-extension][backend] add-video fallback error', fallbackError);
      sendCollectionsError(res, fallbackError, 'Failed to add video to collection');
    }
  } catch (error) {
    console.error('[chrome-extension][backend] add-video error', error);
    sendCollectionsError(res, error, 'Failed to add video to collection');
  }
});
