/**
 * Chrome Extension + Idea Inbox + Content Inbox API Routes (Express)
 * Migrated from Next.js route handlers to Vite-Express style.
 */

import fs from 'fs';
import path from 'path';
import { getDb, verifyBearer, getCollectionRefByPath } from './utils/firebase-admin.js';

// -----------------------------
// Auth helpers
// -----------------------------
async function resolveUser(req) {
  // Prefer Firebase bearer token when present
  try {
    const bearer = await verifyBearer(req);
    if (bearer && bearer.uid) return { uid: bearer.uid, method: 'bearer' };
  } catch {}

  // Support x-api-key for dev/proxy usage
  const apiKey = req.headers['x-api-key'];
  const validApiKey = apiKey && (apiKey === process.env.API_KEY || apiKey === process.env.NEXT_PUBLIC_API_KEY);
  if (validApiKey) {
    // Require explicit user id when using api-key
    const userId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId);
    if (userId) return { uid: String(userId), method: 'api-key' };
  }

  return null;
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
      const doc = await db.collection('chrome_extension_notes').doc(String(noteId)).get();
      if (!doc.exists) return res.status(404).json({ success: false, error: 'Note not found' });
      const data = doc.data();
      if (data.userId !== user.uid) return res.status(403).json({ success: false, error: 'Unauthorized' });
      return res.json({ success: true, note: { id: doc.id, ...data } });
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
    const note = {
      title: String(title).trim(),
      content: String(content).trim(),
      url: url ? String(url).trim() : undefined,
      type,
      tags: Array.isArray(tags) ? tags.filter((t) => String(t).trim()) : [],
      metadata: { ...metadata, domain: url ? new URL(String(url)).hostname : undefined },
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
        await db.collection('voice_note_token_usage').add({ userId: user.uid, noteId: ref.id, ...vmeta, timestamp: now, createdAt: now });
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

import { handleGetCollections, handleCreateCollection, handleAddVideoToCollection } from './collections.js';

export async function handleCECollectionsGet(req, res) {
  // Allow x-api-key path; underlying handlers require userId
  if (!req.headers['x-user-id'] && req.query.userId) req.headers['x-user-id'] = String(req.query.userId);
  const db = ensureDb();
  if (db) return handleGetCollections(req, res);
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  const file = path.join(DATA_DIR, 'collections.json');
  const arr = readArray(file);
  const collections = arr.filter((c) => c.userId === String(userId));
  res.json({ success: true, collections, total: collections.length });
}

export async function handleCECollectionsPost(req, res) {
  if (!req.headers['x-user-id'] && req.body && req.body.userId) req.headers['x-user-id'] = String(req.body.userId);
  const db = ensureDb();
  if (db) return handleCreateCollection(req, res);
  const userId = req.headers['x-user-id'] || (req.body && req.body.userId);
  const { title, description = '' } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  if (!title || !String(title).trim()) return res.status(400).json({ success: false, error: 'Title is required' });
  const file = path.join(DATA_DIR, 'collections.json');
  const arr = readArray(file);
  const exists = arr.find((c) => c.userId === String(userId) && c.title === String(title).trim());
  if (exists) return res.status(200).json({ success: true, collection: exists, message: 'Already exists' });
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const coll = { id, title: String(title).trim(), description: String(description).trim(), userId: String(userId), videoCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  arr.push(coll);
  writeArray(file, arr);
  res.status(201).json({ success: true, message: 'Collection created successfully', collection: coll });
}

export async function handleCECollectionsAddVideo(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { videoUrl, collectionTitle, title } = req.body || {};
    if (!videoUrl || !collectionTitle) return res.status(400).json({ success: false, error: 'videoUrl and collectionTitle are required' });

    // Resolve or create collection by title for this user
    let collectionId;
    if (db) {
      const snap = await db
        .collection('collections')
        .where('userId', '==', user.uid)
        .where('title', '==', String(collectionTitle).trim())
        .limit(1)
        .get();
      if (!snap.empty) {
        collectionId = snap.docs[0].id;
      } else {
        const now = new Date();
        const docRef = await db.collection('collections').add({
          title: String(collectionTitle).trim(),
          description: '',
          userId: user.uid,
          videoCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        collectionId = docRef.id;
      }
    } else {
      // JSON fallback
      const file = path.join(DATA_DIR, 'collections.json');
      const arr = readArray(file);
      const existing = arr.find((c) => c.userId === user.uid && c.title === String(collectionTitle).trim());
      if (existing) {
        collectionId = existing.id;
      } else {
        collectionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        arr.push({ id: collectionId, title: String(collectionTitle).trim(), description: '', userId: user.uid, videoCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        writeArray(file, arr);
      }
    }

    if (db) {
      // Firestore path via core handler
      req.body = {
        userId: user.uid,
        collectionId,
        videoData: { originalUrl: String(videoUrl), title: title || undefined },
      };
      return await handleAddVideoToCollection(req, res);
    }
    // JSON fallback: add to videos.json and update collection count
    const videosFile = path.join(DATA_DIR, 'videos.json');
    const vArr = readArray(videosFile);
    const vid = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      url: String(videoUrl),
      title: title || 'Video from Extension',
      platform: /tiktok/.test(String(videoUrl)) ? 'tiktok' : /instagram/.test(String(videoUrl)) ? 'instagram' : 'unknown',
      thumbnailUrl: '/images/video-placeholder.jpg',
      author: 'Unknown Creator',
      transcript: 'Transcript not available',
      visualContext: 'Imported via Import Video',
      fileSize: 0,
      duration: 0,
      userId: user.uid,
      collectionId,
      addedAt: new Date().toISOString(),
      components: { hook: '', bridge: '', nugget: '', wta: '' },
      contentMetadata: { hashtags: [], mentions: [], description: '' },
      insights: { views: 0, likes: 0, comments: 0, saves: 0 },
      metadata: { source: 'import' },
    };
    vArr.unshift(vid);
    writeArray(videosFile, vArr);
    const collFile = path.join(DATA_DIR, 'collections.json');
    const cArr = readArray(collFile);
    const cIdx = cArr.findIndex((c) => c.id === collectionId);
    if (cIdx !== -1) {
      const current = cArr[cIdx].videoCount || 0;
      cArr[cIdx] = { ...cArr[cIdx], videoCount: current + 1, updatedAt: new Date().toISOString() };
      writeArray(collFile, cArr);
    }
    res.status(201).json({ success: true, videoId: vid.id, video: vid });
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

export async function handleIdeaInboxTextPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = ensureDb();
    const { title = '', content = '', url = '', noteType = 'note' } = req.body || {};
    if (!String(title).trim() && !String(content || url).trim()) {
      return res.status(400).json({ success: false, error: 'At least one of title or content/url is required' });
    }

    const configuredPath = process.env.CONTENT_NOTES_PATH; // e.g., users/{uid}/notes
    const cref = configuredPath ? getCollectionRefByPath(db, configuredPath, user.uid) : null;
    const now = new Date();
    const data = {
      title: String(title || 'Saved from Extension').trim(),
      content: String(content || url || '').trim(),
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
      return res.status(201).json({ success: true, note: { id: ref.id, ...data, createdAt: now.toISOString(), updatedAt: now.toISOString() } });
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

    const data = {
      title: String(title || 'Idea from Video').trim(),
      content: String(url).trim(),
      type: 'idea_inbox',
      noteType: noteType || 'note',
      source: 'inbox',
      starred: false,
      userId: user.uid,
      metadata: { videoUrl: String(url) },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Save to notes
    if (db) {
      let ref;
      try {
        ref = await db.collection('users').doc(user.uid).collection('notes').add(data);
      } catch {
        ref = await db.collection('notes').add(data);
      }
      return res.status(201).json({ success: true, note: { id: ref.id, ...data } });
    }
    // JSON fallback
    const file = path.join(DATA_DIR, 'notes.json');
    const arr = readArray(file);
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    arr.unshift({ id, ...data });
    writeArray(file, arr);
    res.status(201).json({ success: true, note: { id, ...data } });
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

export async function handleYouTubeTranscriptPost(req, res) {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { url, saveAsNote = false, includeTimestamps = false } = req.body || {};
    if (!url || !String(url).trim()) return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    const videoId = extractYouTubeId(String(url).trim());
    if (!videoId) return res.status(400).json({ success: false, error: 'Invalid YouTube URL format' });

    const segments = await fetchRapidApiTranscript(videoId);
    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);

    const response = { success: true, transcript, segments, metadata: { videoId } };
    // Optional: save as a note
    if (saveAsNote) {
      const db = ensureDb(res);
      if (!db) return;
      const now = new Date();
      const note = {
        title: `YouTube Transcript ${videoId}`,
        content: transcript,
        type: 'text',
        tags: ['youtube', 'transcript', 'video'],
        source: 'import',
        starred: false,
        metadata: { videoId, videoUrl: String(url).trim() },
        createdAt: now,
        updatedAt: now,
        userId: user.uid,
      };
      const ref = await db.collection('notes').add(note);
      response.note = { id: ref.id, ...note };
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
    const transcript = formatSegmentsToTranscript(segments, includeTimestamps);
    res.json({ success: true, transcript, segments, metadata: { videoId } });
  } catch (e) {
    console.error('[chrome-ext youtube-transcript GET] error:', e);
    const message = e instanceof Error ? e.message : 'Failed to extract transcript';
    res.status(500).json({ success: false, error: message });
  }
}
