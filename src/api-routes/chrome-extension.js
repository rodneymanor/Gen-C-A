/**
 * Chrome Extension + Idea Inbox + Content Inbox API Routes (Express)
 * Migrated from Next.js route handlers to Vite-Express style.
 */

import fs from 'fs';
import path from 'path';
import { getDb, verifyBearer, getCollectionRefByPath } from './utils/firebase-admin.js';

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

// -----------------------------
// Chrome Extension: Notes CRUD (chrome_extension_notes)
// -----------------------------

export async function handleCENotesGet(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();

    const noteId = req.query.noteId;
    const limitRaw = req.query.limit;
    const type = req.query.type;
    const search = req.query.search;
    const tagsParam = req.query.tags;
    const limit = Math.min(Number(limitRaw) || 50, 100);

    if (noteId) {
      if (db) {
        const doc = await db.collection('chrome_extension_notes').doc(String(noteId)).get();
        if (!doc.exists) return res.status(404).json({ success: false, error: 'Note not found' });
        const data = doc.data();
        if (data.userId !== user.uid) return res.status(403).json({ success: false, error: 'Unauthorized' });
        return res.json({ success: true, note: { id: doc.id, ...data } });
      }

      const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
      const notes = readArray(file);
      const found = notes.find((n) => String(n.id) === String(noteId) && n.userId === user.uid);
      if (!found) return res.status(404).json({ success: false, error: 'Note not found' });
      return res.json({ success: true, note: found });
    }

    if (db) {
      let q = db
        .collection('chrome_extension_notes')
        .where('userId', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(limit);
      if (type) q = q.where('type', '==', String(type));
      const snap = await q.get();
      let notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (search) {
        const s = String(search).toLowerCase();
        notes = notes.filter((n) => String(n.title || '').toLowerCase().includes(s) || String(n.content || '').toLowerCase().includes(s));
      }
      if (tagsParam) {
        const tags = String(tagsParam)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        if (tags.length) notes = notes.filter((n) => Array.isArray(n.tags) && tags.some((t) => n.tags.includes(t)));
      }
      return res.json({ success: true, notes, count: notes.length });
    }

    // JSON fallback
    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    let notes = readArray(file);
    if (type) notes = notes.filter((n) => n.type === String(type));
    notes = notes.filter((n) => n.userId === user.uid).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, limit);
    if (search) {
      const s = String(search).toLowerCase();
      notes = notes.filter((n) => String(n.title || '').toLowerCase().includes(s) || String(n.content || '').toLowerCase().includes(s));
    }
    if (tagsParam) {
      const tags = String(tagsParam)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) notes = notes.filter((n) => Array.isArray(n.tags) && tags.some((t) => n.tags.includes(t)));
    }
    return res.json({ success: true, notes, count: notes.length });
  } catch (e) {
    console.error('[chrome-ext notes GET] error:', e);
    res.status(500).json({ success: false, error: 'Failed to retrieve notes' });
  }
}

export async function handleCENotesPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();

    const { title, content, url, type = 'text', tags = [], metadata = {} } = req.body || {};
    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }
    const now = new Date().toISOString();
    const sanitizedMetadata = metadata && typeof metadata === 'object' ? { ...metadata } : {};
    if (url) {
      try {
        const domain = new URL(String(url)).hostname;
        if (domain) sanitizedMetadata.domain = domain;
      } catch {}
    }
    const note = {
      title: String(title).trim(),
      content: String(content).trim(),
      url: url ? String(url).trim() : undefined,
      type,
      tags: Array.isArray(tags) ? tags.filter((t) => String(t).trim()) : [],
      metadata: sanitizedMetadata,
      createdAt: now,
      updatedAt: now,
      userId: user.uid,
    };
    if (db) {
      const ref = await db.collection('chrome_extension_notes').add(note);
      // Optional voice-note token tracking
      try {
        const vmeta = note?.metadata?.voiceMetadata || metadata?.voiceMetadata;
        if (type === 'voice' && vmeta && vmeta.totalTokens) {
          await db.collection('voice_note_token_usage').add({
            userId: user.uid,
            noteId: ref.id,
            ...vmeta,
            timestamp: now,
            createdAt: now,
          });
          const ym = now.slice(0, 7);
          const statsRef = db.collection('user_voice_stats').doc(`${user.uid}_${ym}`);
          await db.runTransaction(async (tx) => {
            const doc = await tx.get(statsRef);
            if (doc.exists) {
              const data = doc.data() || {};
              tx.update(statsRef, {
                totalTokens: (data.totalTokens || 0) + (vmeta.totalTokens || 0),
                totalNotes: (data.totalNotes || 0) + 1,
                totalAudioDuration: (data.totalAudioDuration || 0) + (vmeta.originalAudioDuration || 0),
                lastUsedAt: now,
              });
            } else {
              tx.set(statsRef, {
                userId: user.uid,
                month: ym,
                totalTokens: vmeta.totalTokens || 0,
                totalNotes: 1,
                totalAudioDuration: vmeta.originalAudioDuration || 0,
                firstUsedAt: now,
                lastUsedAt: now,
                createdAt: now,
              });
            }
          });
        }
      } catch (trackErr) {
        console.warn('[chrome-ext notes POST] token tracking failed:', trackErr?.message);
      }

      return res.json({ success: true, note: { id: ref.id, ...note } });
    }

    // JSON fallback
    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...note });
    writeArray(file, arr);
    return res.json({ success: true, note: { id, ...note } });
  } catch (e) {
    console.error('[chrome-ext notes POST] error:', e);
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
}

export async function handleCENotesPut(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { noteId, title, content, tags, metadata } = req.body || {};
    if (!noteId) return res.status(400).json({ success: false, error: 'Note ID is required' });

    if (db) {
      const doc = await db.collection('chrome_extension_notes').doc(String(noteId)).get();
      if (!doc.exists) return res.status(404).json({ success: false, error: 'Note not found' });
      const data = doc.data();
      if (data.userId !== user.uid) return res.status(403).json({ success: false, error: 'Unauthorized' });

      const update = { updatedAt: new Date().toISOString() };
      if (title !== undefined) update.title = String(title).trim();
      if (content !== undefined) update.content = String(content).trim();
      if (tags !== undefined) update.tags = Array.isArray(tags) ? tags.filter((t) => String(t).trim()) : [];
      if (metadata !== undefined) update.metadata = { ...(data.metadata || {}), ...metadata };

      await db.collection('chrome_extension_notes').doc(String(noteId)).update(update);
      return res.json({ success: true, note: { id: String(noteId), ...data, ...update } });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    const arr = readArray(file);
    const idx = arr.findIndex((n) => n.id === String(noteId) && n.userId === user.uid);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Note not found' });
    const updated = { ...arr[idx], updatedAt: new Date().toISOString() };
    if (title !== undefined) updated.title = String(title).trim();
    if (content !== undefined) updated.content = String(content).trim();
    if (tags !== undefined) updated.tags = Array.isArray(tags) ? tags.filter((t) => String(t).trim()) : [];
    if (metadata !== undefined) updated.metadata = { ...(arr[idx].metadata || {}), ...metadata };
    arr[idx] = updated;
    writeArray(file, arr);
    res.json({ success: true, note: updated });
  } catch (e) {
    console.error('[chrome-ext notes PUT] error:', e);
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
}

export async function handleCENotesDelete(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const noteId = req.query.noteId;
    if (!noteId) return res.status(400).json({ success: false, error: 'Note ID is required' });
    if (db) {
      const doc = await db.collection('chrome_extension_notes').doc(String(noteId)).get();
      if (!doc.exists) return res.status(404).json({ success: false, error: 'Note not found' });
      const data = doc.data();
      if (data.userId !== user.uid) return res.status(403).json({ success: false, error: 'Unauthorized' });
      await db.collection('chrome_extension_notes').doc(String(noteId)).delete();
      return res.json({ success: true });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    const arr = readArray(file);
    const idx = arr.findIndex((n) => n.id === String(noteId) && n.userId === user.uid);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Note not found' });
    arr.splice(idx, 1);
    writeArray(file, arr);
    res.json({ success: true });
  } catch (e) {
    console.error('[chrome-ext notes DELETE] error:', e);
    res.status(500).json({ success: false, error: 'Failed to delete note' });
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
    if (!videoUrl || !collectionTitle) return res.status(400).json({ success: false, error: 'videoUrl and collectionTitle are required' });

    // Resolve or create collection by title for this user
    const normalizedUrl = String(videoUrl).trim();
    const normalizedCollectionTitle = String(collectionTitle).trim();
    const providedTitle = title ? String(title).trim() : '';
    const now = new Date();
    let collectionId;
    let collectionOwnerId = user.uid;

    if (db) {
      const snap = await db
        .collection('collections')
        .where('userId', '==', user.uid)
        .where('title', '==', normalizedCollectionTitle)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data() || {};
        collectionId = doc.id;
        collectionOwnerId = data.userId || user.uid;
      } else {
        const docRef = await db.collection('collections').add({
          title: normalizedCollectionTitle,
          description: '',
          userId: user.uid,
          videoCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        collectionId = docRef.id;
        collectionOwnerId = user.uid;
      }

      const platform = guessPlatformFromUrl(normalizedUrl);
      const videoDoc = {
        url: normalizedUrl,
        title: providedTitle || generateVideoTitleFromUrl(normalizedUrl),
        platform,
        thumbnailUrl: getDefaultThumbnailForPlatform(platform),
        author: 'Unknown Creator',
        transcript: 'Transcript not available',
        visualContext: 'Imported via Import Video',
        fileSize: 0,
        duration: 0,
        userId: collectionOwnerId,
        collectionId,
        addedAt: now.toISOString(),
        components: { hook: '', bridge: '', nugget: '', wta: '' },
        contentMetadata: { hashtags: [], mentions: [], description: '' },
        insights: { views: 0, likes: 0, comments: 0, saves: 0 },
        metadata: { source: 'import' },
      };
      const ref = await db.collection('videos').add(videoDoc);

      if (collectionId && collectionId !== 'all-videos') {
        const collectionRef = db.collection('collections').doc(String(collectionId));
        try {
          await db.runTransaction(async (tx) => {
            const snapDoc = await tx.get(collectionRef);
            if (!snapDoc.exists) return;
            const current = snapDoc.data()?.videoCount || 0;
            tx.update(collectionRef, { videoCount: current + 1, updatedAt: now });
          });
        } catch (updateErr) {
          console.warn('[chrome-ext collections add-video] failed to update count:', updateErr?.message || updateErr);
        }
      }

      const jobId = createJobId();
      return res.status(201).json({
        success: true,
        message: 'Video added to processing queue',
        jobId,
        collectionTitle: normalizedCollectionTitle,
        collectionId,
        videoUrl: normalizedUrl,
        videoId: ref.id,
      });
    }

    // JSON fallback: add to videos.json and update collection count
    const collectionsFile = path.join(DATA_DIR, 'collections.json');
    const collections = readArray(collectionsFile);
    const existing = collections.find((c) => c.userId === user.uid && c.title === normalizedCollectionTitle);
    if (existing) {
      collectionId = existing.id;
      collectionOwnerId = existing.userId || user.uid;
    } else {
      collectionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const newCollection = {
        id: collectionId,
        title: normalizedCollectionTitle,
        description: '',
        userId: user.uid,
        videoCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      collections.push(newCollection);
      writeArray(collectionsFile, collections);
    }

    const videosFile = path.join(DATA_DIR, 'videos.json');
    const videos = readArray(videosFile);
    const videoId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const platform = guessPlatformFromUrl(normalizedUrl);
    const fallbackVideo = {
      id: videoId,
      url: normalizedUrl,
      title: providedTitle || generateVideoTitleFromUrl(normalizedUrl),
      platform,
      thumbnailUrl: getDefaultThumbnailForPlatform(platform),
      author: 'Unknown Creator',
      transcript: 'Transcript not available',
      visualContext: 'Imported via Import Video',
      fileSize: 0,
      duration: 0,
      userId: collectionOwnerId,
      collectionId,
      addedAt: now.toISOString(),
      components: { hook: '', bridge: '', nugget: '', wta: '' },
      contentMetadata: { hashtags: [], mentions: [], description: '' },
      insights: { views: 0, likes: 0, comments: 0, saves: 0 },
      metadata: { source: 'import' },
    };
    videos.unshift(fallbackVideo);
    writeArray(videosFile, videos);

    const collIndex = collections.findIndex((c) => c.id === collectionId);
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
    return res.status(201).json({
      success: true,
      message: 'Video added to processing queue',
      jobId,
      collectionTitle: normalizedCollectionTitle,
      collectionId,
      videoUrl: normalizedUrl,
      videoId,
    });
  } catch (e) {
    console.error('[chrome-ext collections add-video] error:', e);
    res.status(500).json({ success: false, error: 'Failed to add video to collection' });
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
    const { url, saveAsNote = false, includeTimestamps = false } = req.body || {};
    if (!url || !String(url).trim()) return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    const videoId = extractYouTubeId(String(url).trim());
    if (!videoId) return res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });

    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments || !segments.length) {
      return res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
    }

    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = { videoId, ...(await fetchYouTubeMetadata(videoId)) };

    const response = { success: true, transcript, segments, metadata };
    if (saveAsNote) {
      const db = ensureDb();
      const cleanTranscript = cleanTranscriptText(transcript);
      const now = new Date();
      const noteData = {
        title: generateYouTubeTranscriptTitle(cleanTranscript, metadata.title),
        content: cleanTranscript,
        type: 'text',
        tags: ['youtube', 'transcript', 'video'],
        source: 'import',
        starred: false,
        metadata: {
          ...metadata,
          videoUrl: String(url).trim(),
          domain: 'youtube.com',
          transcriptLength: cleanTranscript.length,
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
        const saved = { id, ...noteData, createdAt: now.toISOString(), updatedAt: now.toISOString() };
        arr.unshift(saved);
        writeArray(file, arr);
        response.note = saved;
      }

      if (response.note && process.env.NEXT_PUBLIC_APP_URL) {
        response.editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/capture/notes/new?noteId=${response.note.id}`;
      }
    }

    res.json(response);
  } catch (e) {
    console.error('[chrome-ext youtube-transcript POST] error:', e);
    const message = e instanceof Error ? e.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
}

export async function handleYouTubeTranscriptGet(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const url = req.query.url;
    const includeTimestamps = String(req.query.includeTimestamps) === 'true';
    if (!url) return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    const videoId = extractYouTubeId(String(url));
    if (!videoId) return res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });
    const segments = await fetchRapidApiTranscript(videoId);
    if (!segments || !segments.length) {
      return res.status(404).json({
        success: false,
        error:
          'Transcript not available. This could be due to the video lacking captions or being private/restricted. Please try a different video.',
      });
    }
    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    const metadata = { videoId, ...(await fetchYouTubeMetadata(videoId)) };
    res.json({ success: true, transcript, segments, metadata });
  } catch (e) {
    console.error('[chrome-ext youtube-transcript GET] error:', e);
    const message = e instanceof Error ? e.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
}
