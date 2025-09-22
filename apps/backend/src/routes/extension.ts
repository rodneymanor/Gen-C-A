import type { Request, Response } from 'express';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

import { getDb, verifyBearer, getCollectionRefByPath } from '../lib/firebase-admin.js';
import {
  getChromeExtensionNotesService,
  ChromeExtensionNotesServiceError,
} from '../../../../src/services/chrome-extension/chrome-extension-notes-service.js';
import {
  getCollectionsAdminService,
  CollectionsServiceError,
} from '../../../../src/services/collections/collections-admin-service.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEST_MODE_API_KEY = 'test-internal-secret-123';

function normalizeHeaderValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getApiKeyFromRequest(req: Request) {
  const headers = req.headers || {};
  const headerKey = normalizeHeaderValue(headers['x-api-key'] ?? headers['X-API-KEY']);
  const query = req.query || {};
  const body = (req.body ?? {}) as Record<string, unknown>;
  return (
    headerKey ||
    (query.apiKey as string) ||
    (query.apikey as string) ||
    (query.key as string) ||
    (body.apiKey as string) ||
    (body.apikey as string) ||
    null
  );
}

function getUserIdFromRequest(req: Request) {
  const headers = req.headers || {};
  const candidates = [
    headers['x-user-id'],
    headers['x-user'],
    headers['x-userid'],
    req.query.userId,
    req.query.uid,
    (req.body as Record<string, unknown> | undefined)?.userId,
    (req.body as Record<string, unknown> | undefined)?.uid,
  ];

  return candidates
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .map((value) => (value !== undefined && value !== null ? String(value).trim() : ''))
    .find((value) => value.length > 0);
}

async function resolveUser(req: Request) {
  const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
  if (auth?.uid) {
    return { uid: auth.uid, method: 'bearer', testMode: false } as const;
  }

  const apiKey = getApiKeyFromRequest(req);
  if (!apiKey) return null;

  const expectedKeys = [
    process.env.API_KEY,
    process.env.NEXT_PUBLIC_API_KEY,
    process.env.INTERNAL_API_SECRET,
    process.env.ADMIN_API_KEY,
  ].filter(Boolean);

  const isTestKey = apiKey === TEST_MODE_API_KEY;
  const isValid = isTestKey || expectedKeys.some((key) => key === apiKey);
  if (!isValid) return null;

  const explicitUid = getUserIdFromRequest(req);
  const fallbackUid = isTestKey
    ? 'test-user'
    : process.env.ADMIN_DEFAULT_USER_ID || process.env.DEFAULT_EXTENSION_USER_ID;
  const uid = explicitUid || fallbackUid;
  if (!uid) return null;

  return { uid: String(uid), method: 'api-key', testMode: isTestKey, apiKey } as const;
}

function ensureDb() {
  if (process.env.FORCE_JSON_FALLBACK === '1') return null;
  return getDb();
}

function ensureFile(filePath: string, initial: unknown = { items: [] }) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
}

function readArray(file: string, key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed[key])) return parsed[key];
    const altKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    return altKey ? parsed[altKey] : [];
  } catch {
    return [];
  }
}

function writeArray(file: string, arr: unknown[], key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const data = { [key]: arr };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

function createNotesService(db: ReturnType<typeof getDb>) {
  return getChromeExtensionNotesService({ firestore: db });
}

function sendNotesError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ChromeExtensionNotesServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][notes] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

function sendCollectionsError(res: Response, error: unknown, fallback: string) {
  if (error instanceof CollectionsServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][extension][collections] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

function guessPlatformFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch {
    // ignore
  }
  return 'unknown';
}

function generateVideoTitleFromUrl(url: string) {
  const date = new Date().toLocaleDateString();
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return `TikTok Video - ${date}`;
    if (host.includes('instagram')) return `Instagram Video - ${date}`;
  } catch {
    // ignore
  }
  return `Video - ${date}`;
}

function getDefaultThumbnailForPlatform(platform: string) {
  const lower = platform.toLowerCase();
  if (lower.includes('tiktok')) return '/images/placeholder.svg';
  if (lower.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

function createJobId() {
  return `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function generateIdeaTitle(incomingTitle: string, content: string) {
  const trimmedTitle = incomingTitle.trim();
  if (trimmedTitle) return trimmedTitle;

  const trimmedContent = content.trim();
  if (!trimmedContent) return 'Saved from Extension';

  const firstLine = trimmedContent
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || trimmedContent;

  const words = firstLine.split(/\s+/).filter(Boolean).slice(0, 16);
  if (!words.length) return 'Saved from Extension';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

function decodeIdeaUrl(url: string) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function validateIdeaVideoUrl(url: string) {
  if (!url) return { valid: false, message: 'url is required' };
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, message: 'url is required' };

  try {
    new URL(trimmed);
  } catch {
    return { valid: false, message: 'Please enter a valid URL' };
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    if (lower.includes('/reel') || lower.includes('/reels/') || lower.includes('/share/')) {
      return { valid: true, platform: 'instagram' };
    }
    if (lower.includes('/p/')) {
      return {
        valid: false,
        message: 'Instagram post URLs are not supported yet. Please use Instagram reel URLs instead.',
      };
    }
    return { valid: true, platform: 'instagram' };
  }

  if (lower.includes('vm.tiktok.com') || lower.includes('tiktok.com') || lower.includes('tiktokv.com')) {
    return { valid: true, platform: 'tiktok' };
  }

  if (lower.includes('cdninstagram.com') || lower.includes('scontent-')) {
    return { valid: true, platform: 'instagram_cdn' };
  }
  if (lower.includes('tiktokcdn') || lower.includes('muscdn.com')) {
    return { valid: true, platform: 'tiktok_cdn' };
  }

  return { valid: false, message: 'Only TikTok and Instagram video URLs are supported' };
}

function deriveNoteTypeFromPlatform(platform: string | undefined, provided?: string) {
  if (provided) return provided;
  if (!platform) return 'note';
  if (platform.includes('tiktok')) return 'tiktok';
  if (platform.includes('instagram')) return 'instagram';
  return 'note';
}

function extractYouTubeId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1];
    }
  } catch {
    // ignore
  }
  return null;
}

function formatSegmentsToTranscript(
  segments: Array<{ text: string; start: number }>,
  includeTimestamps: boolean,
) {
  if (!Array.isArray(segments) || !segments.length) return '';
  return segments
    .map((segment) => {
      const text = String(segment.text || '').trim();
      if (!includeTimestamps) return text;
      const start = Number(segment.start || 0);
      const minutes = Math.floor(start / 60);
      const seconds = String(Math.floor(start % 60)).padStart(2, '0');
      return `[${minutes}:${seconds}] ${text}`;
    })
    .join(' ');
}

async function fetchRapidApiTranscript(videoId: string) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) throw new Error('RapidAPI key not configured');

  const response = await fetch(
    `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
    {
      headers: {
        'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Transcript fetch failed');
  }

  return (data.transcript || []).map((segment: any) => ({
    text: segment.text || '',
    start: parseFloat(segment.offset || 0),
    duration: parseFloat(segment.duration || 0),
  }));
}

async function fetchYouTubeMetadata(videoId: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.warn('[backend][extension] Failed to fetch YouTube metadata:', (error as Error).message);
    return {};
  }
}

function cleanTranscriptText(transcript: string) {
  return transcript
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function generateYouTubeTranscriptTitle(transcript: string, fallback?: string) {
  if (fallback && fallback.trim()) return fallback.trim();
  const clean = cleanTranscriptText(transcript);
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 12);
  if (!words.length) return 'YouTube Transcript';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

export const extensionRouter = Router();

extensionRouter.get('/notes', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await service.listNotes(user.uid, {
      noteId: req.query.noteId ? String(req.query.noteId) : undefined,
      limit,
      type: req.query.type ? String(req.query.type) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      tags: req.query.tags ? String(req.query.tags) : undefined,
    });

    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to load notes');
  }
});

extensionRouter.post('/notes', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const result = await service.createNote(user.uid, req.body ?? {});
    res.status(201).json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to create note');
  }
});

extensionRouter.put('/notes', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const result = await service.updateNote(user.uid, req.body ?? {});
    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to update note');
  }
});

extensionRouter.delete('/notes', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const service = createNotesService(db);
    const noteId = (req.query.noteId as string) || (req.body as Record<string, unknown> | undefined)?.noteId;
    const result = await service.deleteNote(user.uid, noteId ? String(noteId) : undefined);
    res.json(result);
  } catch (error) {
    sendNotesError(res, error, 'Failed to delete note');
  }
});

extensionRouter.get('/collections', async (req: Request, res: Response) => {
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

extensionRouter.post('/collections', async (req: Request, res: Response) => {
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

extensionRouter.post('/collections/add-video', async (req: Request, res: Response) => {
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

    // Ensure collection exists (create if needed)
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

extensionRouter.post('/content-inbox', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const body = req.body || {};
    const {
      url,
      platform = 'manual',
      category = 'inspiration',
      tags = [],
      title,
      content,
      description,
      notes,
    } = body;

    if (!url && !(notes && notes.content)) {
      res.status(400).json({ success: false, error: 'Either url or notes.content is required' });
      return;
    }

    const item = {
      url: url || null,
      title: title || null,
      content: content || null,
      description: description || null,
      platform,
      category,
      tags: Array.isArray(tags) ? tags : [],
      savedAt: new Date(),
      transcription: url ? { status: 'pending' } : undefined,
      notes: notes
        ? {
            content: notes.content,
            format: notes.format || 'text',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
      userId: user.uid,
    };

    if (db) {
      const ref = await db.collection('users').doc(user.uid).collection('contentInbox').add(item);
      res.status(201).json({ id: ref.id, ...item });
      return;
    }

    const file = path.join(DATA_DIR, 'content_inbox.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...item });
    writeArray(file, arr);
    res.status(201).json({ id, ...item });
  } catch (error) {
    console.error('[backend][extension] content-inbox error:', error);
    res.status(500).json({ error: 'Failed to add content item' });
  }
});

extensionRouter.post('/idea-inbox/text', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const { title = '', content = '', url = '', noteType = 'note' } = req.body || {};
    const incomingTitle = String(title || '').trim();
    const resolvedContent = String(content || url || '').trim();

    if (!incomingTitle && !resolvedContent) {
      res.status(400).json({ success: false, error: 'At least one of title or content/url is required' });
      return;
    }

    const now = new Date();
    const data = {
      title: generateIdeaTitle(incomingTitle, resolvedContent),
      content: resolvedContent,
      type: 'idea_inbox',
      noteType,
      source: 'inbox',
      starred: false,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      const configuredPath = process.env.CONTENT_NOTES_PATH;
      const collectionRef = getCollectionRefByPath(db, configuredPath ?? '', user.uid);
      let ref;
      if (collectionRef) {
        ref = await collectionRef.add(data);
      } else {
        try {
          ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
        } catch {
          ref = await db.collection('notes').add(data);
        }
      }
      res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
      return;
    }

    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    res.status(201).json({ success: true, note: saved });
  } catch (error) {
    console.error('[backend][extension] idea text error:', error);
    res.status(500).json({ success: false, error: 'Failed to create idea note' });
  }
});

extensionRouter.post('/idea-inbox/video', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const db = ensureDb();
    const { url, title, noteType } = req.body || {};
    if (!url) {
      res.status(400).json({ success: false, error: 'url is required' });
      return;
    }

    const decodedUrl = decodeIdeaUrl(String(url));
    const validation = validateIdeaVideoUrl(decodedUrl);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.message || 'Invalid video URL' });
      return;
    }

    const platform = validation.platform as string | undefined;
    const derivedType = deriveNoteTypeFromPlatform(platform, noteType);
    const platformLabel = platform?.includes('tiktok')
      ? 'TikTok'
      : platform?.includes('instagram')
        ? 'Instagram'
        : 'Video';
    const resolvedTitle = String(title || '').trim() || `Idea from ${platformLabel}`;

    const now = new Date();
    const metadata: Record<string, unknown> = {
      videoUrl: decodedUrl,
      platform,
    };
    if (platform?.includes('tiktok')) metadata.thumbnailUrl = '/images/placeholder.svg';
    if (platform?.includes('instagram')) metadata.thumbnailUrl = '/images/instagram-placeholder.jpg';

    const data = {
      title: resolvedTitle,
      content: decodedUrl,
      type: 'idea_inbox',
      noteType: derivedType,
      source: 'inbox',
      starred: false,
      userId: user.uid,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      let ref;
      try {
        ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
      } catch {
        ref = await db.collection('notes').add(data);
      }
      res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
      return;
    }

    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    res.status(201).json({ success: true, note: saved });
  } catch (error) {
    console.error('[backend][extension] idea video error:', error);
    res.status(500).json({ success: false, error: 'Failed to save video idea' });
  }
});

extensionRouter.post('/youtube-transcript', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { url, saveAsNote = false, includeTimestamps = false } = req.body || {};
    if (!url || !String(url).trim()) {
      res.status(400).json({ success: false, error: 'YouTube URL is required' });
      return;
    }

    const videoId = extractYouTubeId(String(url).trim());
    if (!videoId) {
      res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });
      return;
    }

    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments.length) {
      res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
      return;
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = await fetchYouTubeMetadata(videoId);

    const response: Record<string, unknown> = {
      success: true,
      transcript,
      segments,
      metadata: {
        videoId,
        title: metadata.title,
        channelName: metadata.author_name,
        thumbnailUrl: metadata.thumbnail_url,
      },
    };

    if (saveAsNote) {
      const db = ensureDb();
      const clean = cleanTranscriptText(transcript);
      const now = new Date();
      const noteData = {
        title: generateYouTubeTranscriptTitle(clean, metadata.title),
        content: clean,
        type: 'text',
        tags: ['youtube', 'transcript', 'video'],
        source: 'import',
        starred: false,
        metadata: {
          videoId,
          title: metadata.title,
          channelName: metadata.author_name,
          thumbnailUrl: metadata.thumbnail_url,
          videoUrl: String(url).trim(),
          domain: 'youtube.com',
          transcriptLength: clean.length,
          segmentCount: segments.length,
        },
        createdAt: now,
        updatedAt: now,
        userId: user.uid,
      };

      if (db) {
        const ref = await db.collection('notes').add(noteData);
        response.note = {
          id: ref.id,
          ...noteData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      } else {
        const file = path.join(DATA_DIR, 'notes.json');
        const arr = readArray(file);
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const saved = {
          id,
          ...noteData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        arr.unshift(saved);
        writeArray(file, arr);
        response.note = saved;
      }

      if (response.note && process.env.NEXT_PUBLIC_APP_URL) {
        response.editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/capture/notes/new?noteId=${
          (response.note as { id: string }).id
        }`;
      }
    }

    res.json(response);
  } catch (error) {
    console.error('[backend][extension] youtube transcript error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
});

extensionRouter.get('/youtube-transcript', async (req: Request, res: Response) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const url = req.query.url as string | undefined;
    const includeTimestamps = String(req.query.includeTimestamps) === 'true';
    if (!url) {
      res.status(400).json({ success: false, error: 'YouTube URL is required' });
      return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });
      return;
    }

    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments.length) {
      res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
      return;
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = await fetchYouTubeMetadata(videoId);

    res.json({
      success: true,
      transcript,
      segments,
      metadata: {
        videoId,
        title: metadata.title,
        channelName: metadata.author_name,
        thumbnailUrl: metadata.thumbnail_url,
      },
    });
  } catch (error) {
    console.error('[backend][extension] youtube transcript GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
});
