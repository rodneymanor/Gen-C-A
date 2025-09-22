/**
 * Chrome Extension + Idea Inbox + Content Inbox API Routes (Express)
 * Migrated from Next.js route handlers to Vite-Express style.
 */

import fs from 'fs';
import path from 'path';
import { getDb, verifyBearer, getCollectionRefByPath } from './utils/firebase-admin.js';
import {
  ChromeExtensionNotesServiceError,
  getChromeExtensionNotesService,
} from '../services/chrome-extension/chrome-extension-notes-service.js';
import {
  ChromeExtensionCollectionsServiceError,
  getChromeExtensionCollectionsService,
} from '../services/chrome-extension/chrome-extension-collections-service.js';

const TEST_MODE_API_KEY = 'test-internal-secret-123';

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getApiKeyFromRequest(req) {
  const headers = req.headers || {};
  const headerKey = normalizeHeaderValue(headers['x-api-key'] || headers['X-API-KEY']);
  const queryKey = req.query?.apiKey || req.query?.apikey || req.query?.key;
  const bodyKey = req.body?.apiKey || req.body?.apikey;
  return headerKey || queryKey || bodyKey || null;
}

function getUserIdFromRequest(req) {
  const headers = req.headers || {};
  const candidates = [
    headers['x-user-id'],
    headers['x-user'],
    headers['x-userid'],
    req.query?.userId,
    req.query?.uid,
    req.body?.userId,
    req.body?.uid,
  ];
  return candidates
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .map((value) => (value !== undefined && value !== null ? String(value).trim() : ''))
    .find((value) => value.length > 0);
}

// -----------------------------
// Auth helpers
// -----------------------------
async function resolveUser(req) {
  // Prefer Firebase bearer token when present
  try {
    const bearer = await verifyBearer(req);
    if (bearer && bearer.uid) return { uid: bearer.uid, method: 'bearer' };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[chrome-extension] bearer verification failed:', err?.message || err);
    }
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
  const isValidApiKey = isTestKey || expectedKeys.some((key) => key === apiKey);
  if (!isValidApiKey) return null;

  const explicitUid = getUserIdFromRequest(req);
  const fallbackUid = isTestKey
    ? 'test-user'
    : process.env.ADMIN_DEFAULT_USER_ID || process.env.DEFAULT_EXTENSION_USER_ID;
  const uid = explicitUid || fallbackUid;
  if (!uid) return null;

  return { uid: String(uid), method: 'api-key', apiKey, testMode: isTestKey };
}

// Local JSON fallback helpers
const DATA_DIR = path.join(process.cwd(), 'data');
function ensureFile(p, initial = { items: [] }) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(initial, null, 2));
}
function readArray(file) {
  ensureFile(file, { items: [] });
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    // backward compatibility for other shapes
    const key = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    return key ? parsed[key] : [];
  } catch {
    return [];
  }
}
function writeArray(file, arr, key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const data = { [key]: arr };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {}
}

function ensureDb() {
  // Allow forcing JSON fallback in tests or dev
  if (process.env.FORCE_JSON_FALLBACK === '1') return null;
  return getDb();
}

function resolveChromeExtensionNotesService(db) {
  return getChromeExtensionNotesService({ firestore: db });
}

function sendChromeExtensionNotesError(res, error, fallbackMessage, logContext) {
  if (error instanceof ChromeExtensionNotesServiceError) {
    console.warn(`${logContext} service error: ${error.message}`);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(`${logContext} unexpected error:`, details);
  return res.status(500).json({ success: false, error: fallbackMessage });
}

function sendChromeExtensionCollectionsError(res, error, fallbackMessage, logContext) {
  if (
    error instanceof ChromeExtensionCollectionsServiceError ||
    error instanceof CollectionsServiceError
  ) {
    const statusCode = error.statusCode || 500;
    console.warn(`${logContext} service error: ${error.message}`);
    return res.status(statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(`${logContext} unexpected error:`, details);
  return res.status(500).json({ success: false, error: fallbackMessage });
}

// -----------------------------
// Chrome Extension: Notes CRUD (chrome_extension_notes)
// -----------------------------

export async function handleCENotesGet(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const db = ensureDb();
    const service = resolveChromeExtensionNotesService(db);

    const noteId = req.query?.noteId;
    const limitRaw = req.query?.limit;
    const limitNumber = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const options = {
      noteId,
      type: req.query?.type,
      search: req.query?.search,
      tags: req.query?.tags,
    };

    if (Number.isFinite(limitNumber)) {
      options.limit = limitNumber;
    }

    const result = await service.listNotes(user.uid, options);
    return res.json(result);
  } catch (error) {
    return sendChromeExtensionNotesError(
      res,
      error,
      'Failed to retrieve notes',
      '[chrome-ext notes GET]'
    );
  }
}

export async function handleCENotesPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const db = ensureDb();
    const service = resolveChromeExtensionNotesService(db);

    const result = await service.createNote(user.uid, req.body || {});
    return res.json(result);
  } catch (error) {
    return sendChromeExtensionNotesError(
      res,
      error,
      'Failed to create note',
      '[chrome-ext notes POST]'
    );
  }
}

export async function handleCENotesPut(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const db = ensureDb();
    const service = resolveChromeExtensionNotesService(db);

    const result = await service.updateNote(user.uid, req.body || {});
    return res.json(result);
  } catch (error) {
    return sendChromeExtensionNotesError(
      res,
      error,
      'Failed to update note',
      '[chrome-ext notes PUT]'
    );
  }
}

export async function handleCENotesDelete(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const db = ensureDb();
    const service = resolveChromeExtensionNotesService(db);

    const noteId = req.query?.noteId;
    const result = await service.deleteNote(user.uid, noteId);
    return res.json(result);
  } catch (error) {
    return sendChromeExtensionNotesError(
      res,
      error,
      'Failed to delete note',
      '[chrome-ext notes DELETE]'
    );
  }
}

// -----------------------------
// Chrome Extension: Collections proxy + add-video
// -----------------------------

import { handleGetCollections, handleCreateCollection } from './collections.js';

export async function handleCECollectionsGet(req, res) {
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
        return res.json({
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
      } catch (err) {
        console.error('[chrome-ext collections] test mode fetch failed:', err);
      }
    }

    return res.json({
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
  }

  const user = await resolveUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const db = ensureDb();
  if (db) {
    req.headers['x-user-id'] = user.uid;
    return handleGetCollections(req, res);
  }

  const file = path.join(DATA_DIR, 'collections.json');
  const arr = readArray(file);
  const collections = arr.filter((c) => c.userId === String(user.uid));
  return res.json({ success: true, collections, total: collections.length });
}

export async function handleCECollectionsPost(req, res) {
  const { title, description = '' } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const apiKey = getApiKeyFromRequest(req);
  const isTestMode = process.env.NODE_ENV === 'development' && apiKey === TEST_MODE_API_KEY;

  if (isTestMode) {
    const db = ensureDb();
    const now = new Date();
    if (db) {
      const docRef = await db.collection('collections').add({
        title: String(title).trim(),
        description: String(description || '').trim(),
        userId: 'test-user',
        videoCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      return res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        collection: {
          id: docRef.id,
          title: String(title).trim(),
          description: String(description || '').trim(),
          userId: 'test-user',
          videoCount: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
    }

    const file = path.join(DATA_DIR, 'collections.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const coll = {
      id,
      title: String(title).trim(),
      description: String(description || '').trim(),
      userId: 'test-user',
      videoCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    arr.push(coll);
    writeArray(file, arr);
    return res.status(201).json({ success: true, message: 'Collection created successfully', collection: coll });
  }

  const user = await resolveUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const db = ensureDb();
  if (db) {
    req.headers['x-user-id'] = user.uid;
    req.body.userId = user.uid;
    return handleCreateCollection(req, res);
  }

  const file = path.join(DATA_DIR, 'collections.json');
  const arr = readArray(file);
  const exists = arr.find((c) => c.userId === String(user.uid) && c.title === String(title).trim());
  if (exists) return res.status(200).json({ success: true, collection: exists, message: 'Already exists' });
  const now = new Date();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const coll = {
    id,
    title: String(title).trim(),
    description: String(description || '').trim(),
    userId: String(user.uid),
    videoCount: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  arr.push(coll);
  writeArray(file, arr);
  return res.status(201).json({ success: true, message: 'Collection created successfully', collection: coll });
}

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
  const p = String(platform || '').toLowerCase();
  if (p.includes('tiktok')) return '/images/placeholder.svg';
  if (p.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

function createJobId() {
  return `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export async function handleCECollectionsAddVideo(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { videoUrl, collectionTitle, title } = req.body || {};
    if (!videoUrl || !collectionTitle) {
      return res
        .status(400)
        .json({ success: false, error: 'videoUrl and collectionTitle are required' });
    }

    const service = getChromeExtensionCollectionsService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.addVideo({
      userId: String(user.uid),
      videoUrl: String(videoUrl),
      collectionTitle: String(collectionTitle),
      title: title ? String(title) : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Video added to processing queue',
      ...result,
    });
  } catch (e) {
    sendChromeExtensionCollectionsError(
      res,
      e,
      'Failed to add video to collection',
      '[chrome-ext collections add-video]'
    );
  }
}

// -----------------------------
// Content Inbox + Idea Inbox
// -----------------------------

export async function handleContentInboxPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const body = req.body || {};
    const { url, platform = 'manual', category = 'inspiration', tags = [], title, content, description, notes } = body;
    if (!url && !(notes && notes.content)) return res.status(400).json({ success: false, error: 'Either url or notes.content is required' });

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
      return res.status(201).json({ id: ref.id, ...item });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'content_inbox.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...item });
    writeArray(file, arr);
    res.status(201).json({ id, ...item });
  } catch (e) {
    console.error('[content-inbox POST] error:', e);
    res.status(500).json({ error: 'Failed to add content item' });
  }
}

function generateIdeaTitle(incomingTitle, resolvedContent) {
  const trimmedTitle = String(incomingTitle || '').trim();
  if (trimmedTitle) return trimmedTitle;

  const content = String(resolvedContent || '').trim();
  if (!content) return 'Saved from Extension';

  const firstMeaningfulLine = content
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || content;

  const words = firstMeaningfulLine.split(/\s+/).filter(Boolean).slice(0, 16);
  if (!words.length) return 'Saved from Extension';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

function decodeIdeaUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

function validateIdeaVideoUrl(url) {
  if (!url) return { valid: false, message: 'url is required' };
  const trimmed = String(url).trim();
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

function deriveNoteTypeFromPlatform(platform, provided) {
  if (provided) return provided;
  if (!platform) return 'note';
  if (platform.includes('tiktok')) return 'tiktok';
  if (platform.includes('instagram')) return 'instagram';
  return 'note';
}

export async function handleIdeaInboxTextPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { title = '', content = '', url = '', noteType = 'note' } = req.body || {};
    const incomingTitle = String(title || '').trim();
    const resolvedContent = String(content || url || '').trim();

    if (!incomingTitle && !resolvedContent) {
      return res.status(400).json({ success: false, error: 'At least one of title or content/url is required' });
    }

    const configuredPath = process.env.CONTENT_NOTES_PATH; // e.g., users/{uid}/notes
    const cref = configuredPath ? getCollectionRefByPath(db, configuredPath, user.uid) : null;
    const now = new Date();
    let finalTitle = incomingTitle;
    if (!finalTitle && resolvedContent) {
      finalTitle = generateIdeaTitle('', resolvedContent);
    }
    if (!finalTitle || finalTitle === 'Untitled Idea') {
      finalTitle = 'Saved from Extension';
    }
    const data = {
      title: finalTitle || 'Saved from Extension',
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
      let ref;
      if (cref) {
        ref = await cref.add(data);
      } else {
        // fallback paths
        try {
          ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
        } catch {
          ref = await db.collection('notes').add(data);
        }
      }
      return res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() };
    arr.unshift(saved);
    writeArray(file, arr);
    res.status(201).json({ success: true, note: saved });
  } catch (e) {
    console.error('[idea-inbox text POST] error:', e);
    res.status(500).json({ success: false, error: 'Failed to create idea note' });
  }
}

export async function handleIdeaInboxVideoPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { url, title, noteType } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });

    const decodedUrl = decodeIdeaUrl(url);
    const validation = validateIdeaVideoUrl(decodedUrl);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message || 'Invalid video URL' });
    }

    const platform = validation.platform;
    const derivedNoteType = deriveNoteTypeFromPlatform(platform || '', noteType);
    const platformLabel = platform?.includes('tiktok')
      ? 'TikTok'
      : platform?.includes('instagram')
        ? 'Instagram'
        : 'Video';
    const resolvedTitle = String(title || '').trim() || `Idea from ${platformLabel}`;

    const now = new Date();
    const metadata = {
      videoUrl: decodedUrl,
      platform,
    };
    if (platform?.includes('tiktok')) metadata.thumbnailUrl = '/images/placeholder.svg';
    if (platform?.includes('instagram')) metadata.thumbnailUrl = '/images/instagram-placeholder.jpg';

    const data = {
      title: resolvedTitle,
      content: decodedUrl,
      type: 'idea_inbox',
      noteType: derivedNoteType,
      source: 'inbox',
      starred: false,
      userId: user.uid,
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    // Save to notes
    if (db) {
      let ref;
      try {
        ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
      } catch {
        ref = await db.collection('notes').add(data);
      }
      return res.status(201).json({
        success: true,
        note: {
          id: ref.id,
          ...data,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() });
    writeArray(file, arr);
    res.status(201).json({
      success: true,
      note: { id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    });
  } catch (e) {
    console.error('[idea-inbox video POST] error:', e);
    res.status(500).json({ success: false, error: 'Failed to save video idea' });
  }
}

// -----------------------------
// YouTube Transcript (RapidAPI)
// -----------------------------

function extractYouTubeId(u) {
  try {
    const url = new URL(u);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1];
    return null;
  } catch {
    return null;
  }
}

function formatSegmentsToTranscript(segments, includeTimestamps) {
  if (!Array.isArray(segments) || !segments.length) return '';
  return segments
    .map((seg) => {
      const text = String(seg.text || '').trim();
      if (!includeTimestamps) return text;
      const start = Number(seg.start || 0);
      const mm = Math.floor(start / 60);
      const ss = String(Math.floor(start % 60)).padStart(2, '0');
      return `[${mm}:${ss}] ${text}`;
    })
    .join(' ');
}

async function fetchRapidApiTranscript(videoId) {
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) throw new Error('RapidAPI key not configured');
  const url = `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`;
  const resp = await fetch(url, { headers: { 'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com', 'x-rapidapi-key': rapidKey } });
  if (!resp.ok) throw new Error(`RapidAPI request failed: ${resp.status}`);
  const data = await resp.json();
  if (!data.success) throw new Error(data.error || 'Transcript fetch failed');
  const segments = data.transcript || [];
  return segments.map((s) => ({ text: s.text || '', start: parseFloat(s.offset || 0), duration: parseFloat(s.duration || 0) }));
}

async function fetchYouTubeMetadata(videoId) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return {};
    const data = await response.json();
    return {
      title: data.title,
      channelName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (err) {
    console.warn('[chrome-ext youtube-transcript] metadata fetch failed:', err?.message || err);
    return {};
  }
}

function cleanTranscriptText(transcript) {
  return String(transcript || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function generateYouTubeTranscriptTitle(transcript, fallbackTitle) {
  if (fallbackTitle && String(fallbackTitle).trim()) return String(fallbackTitle).trim();
  const clean = cleanTranscriptText(transcript);
  const words = clean.split(/\s+/).filter(Boolean).slice(0, 12);
  if (!words.length) return 'YouTube Transcript';
  const candidate = words.join(' ');
  return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
}

export async function handleYouTubeTranscriptPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const service = getChromeExtensionYouTubeService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.getTranscript({
      userId: String(user.uid),
      url: req.body?.url,
      saveAsNote: req.body?.saveAsNote ?? false,
      includeTimestamps: req.body?.includeTimestamps ?? false,
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.json(result);
  } catch (e) {
    sendChromeExtensionYouTubeError(
      res,
      e,
      'Failed to extract transcript',
      '[chrome-ext youtube-transcript POST]'
    );
  }
}

export async function handleYouTubeTranscriptGet(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const service = getChromeExtensionYouTubeService({ firestore: db, dataDir: DATA_DIR });
    const result = await service.getTranscript({
      userId: String(user.uid),
      url: req.query.url,
      includeTimestamps: String(req.query.includeTimestamps) === 'true',
      saveAsNote: false,
      contentNotesPath: process.env.CONTENT_NOTES_PATH,
    });
    res.json(result);
  } catch (e) {
    sendChromeExtensionYouTubeError(
      res,
      e,
      'Failed to extract transcript',
      '[chrome-ext youtube-transcript GET]'
    );
  }
}
