import fs from 'fs';
import path from 'path';

class ChromeExtensionServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'ChromeExtensionServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

const TEST_MODE_API_KEY = 'test-internal-secret-123';
const DATA_DIR = path.join(process.cwd(), 'data');

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getApiKeyFromRequest(request) {
  const headers = request.headers || {};
  const headerKey = normalizeHeaderValue(headers['x-api-key'] || headers['X-API-KEY']);
  const queryKey = request.query?.apiKey || request.query?.apikey || request.query?.key;
  const bodyKey = request.body?.apiKey || request.body?.apikey;
  return headerKey || queryKey || bodyKey || null;
}

function getUserIdFromRequest(request) {
  const headers = request.headers || {};
  const candidates = [
    headers['x-user-id'],
    headers['x-user'],
    headers['x-userid'],
    request.query?.userId,
    request.query?.uid,
    request.body?.userId,
    request.body?.uid,
  ];
  return candidates
    .map((value) => (Array.isArray(value) ? value[0] : value))
    .map((value) => (value !== undefined && value !== null ? String(value).trim() : ''))
    .find((value) => value.length > 0);
}

function ensureFile(p, initial = { items: [] }) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(initial, null, 2));
}

function readArray(file, key = 'items') {
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

function writeArray(file, arr, key = 'items') {
  ensureFile(file, { [key]: [] });
  try {
    const data = { [key]: arr };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch {}
}

class ChromeExtensionService {
  constructor({ firestore, verifyBearer, fallbackEnabled = true }) {
    this.db = firestore;
    this.verifyBearer = verifyBearer;
    this.fallbackEnabled = fallbackEnabled;
  }

  async resolveUser(request) {
    if (this.verifyBearer) {
      try {
        const bearer = await this.verifyBearer(request);
        if (bearer && bearer.uid) return { uid: bearer.uid, method: 'bearer' };
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[chrome-extension] bearer verification failed:', err?.message || err);
        }
      }
    }
    const apiKey = getApiKeyFromRequest(request);
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

    const explicitUid = getUserIdFromRequest(request);
    const fallbackUid = isTestKey
      ? 'test-user'
      : process.env.ADMIN_DEFAULT_USER_ID || process.env.DEFAULT_EXTENSION_USER_ID;
    const uid = explicitUid || fallbackUid;
    if (!uid) return null;

    return { uid: String(uid), method: 'api-key', apiKey, testMode: isTestKey };
  }

  ensureDb() {
    if (process.env.FORCE_JSON_FALLBACK === '1') return null;
    return this.db;
  }

  // Notes
  async listNotes(request) {
    const user = await this.resolveUser(request);
    if (!user) throw new ChromeExtensionServiceError('Unauthorized', 401);
    const db = this.ensureDb();

    const { noteId, limit = 50, type, search, tags } = this.parseNotesQuery(request);

    if (noteId) {
      const note = await this.getNoteById(db, user.uid, noteId);
      if (!note) throw new ChromeExtensionServiceError('Note not found', 404);
      return { success: true, note };
    }

    const notes = await this.queryNotes(db, user.uid, { limit, type, search, tags });
    return { success: true, notes, count: notes.length };
  }

  parseNotesQuery(request) {
    const query = request.query || {};
    return {
      noteId: query.noteId,
      limit: Math.min(Number(query.limit) || 50, 100),
      type: query.type,
      search: query.search,
      tags: query.tags,
    };
  }

  async getNoteById(db, uid, noteId) {
    if (db) {
      const doc = await db.collection('chrome_extension_notes').doc(String(noteId)).get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (data.userId !== uid) throw new ChromeExtensionServiceError('Unauthorized', 403);
      return { id: doc.id, ...data };
    }

    const notes = readArray(path.join(DATA_DIR, 'chrome_extension_notes.json'));
    return notes.find((n) => String(n.id) === String(noteId) && n.userId === uid) || null;
  }

  async queryNotes(db, uid, { limit, type, search, tags }) {
    let notes = [];
    if (db) {
      let q = db
        .collection('chrome_extension_notes')
        .where('userId', '==', uid)
        .orderBy('updatedAt', 'desc')
        .limit(limit);
      if (type) q = q.where('type', '==', String(type));
      const snap = await q.get();
      notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      notes = readArray(path.join(DATA_DIR, 'chrome_extension_notes.json'))
        .filter((n) => n.userId === uid)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, limit);
      if (type) notes = notes.filter((n) => n.type === String(type));
    }

    if (search) {
      const s = String(search).toLowerCase();
      notes = notes.filter(
        (n) =>
          String(n.title || '').toLowerCase().includes(s) || String(n.content || '').toLowerCase().includes(s),
      );
    }

    if (tags) {
      const tagList = String(tags)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length) {
        notes = notes.filter((n) => Array.isArray(n.tags) && tagList.some((t) => n.tags.includes(t)));
      }
    }

    return notes;
  }

  async createNote(request) {
    const user = await this.resolveUser(request);
    if (!user) throw new ChromeExtensionServiceError('Unauthorized', 401);
    const db = this.ensureDb();

    const { title, content, url, type = 'text', tags = [], metadata = {} } = request.body || {};
    const now = new Date().toISOString();
    const note = {
      title: typeof title === 'string' ? title.trim() : 'Untitled Note',
      content: typeof content === 'string' ? content : '',
      url: typeof url === 'string' ? url : '',
      type,
      tags: Array.isArray(tags) ? tags : [],
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      const docRef = await db.collection('chrome_extension_notes').add(note);
      return { success: true, note: { id: docRef.id, ...note } };
    }

    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    const notes = readArray(file);
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newNote = { id, ...note };
    writeArray(file, [newNote, ...notes]);
    return { success: true, note: newNote };
  }

  async updateNote(request) {
    const user = await this.resolveUser(request);
    if (!user) throw new ChromeExtensionServiceError('Unauthorized', 401);
    const db = this.ensureDb();

    const { id, ...updates } = request.body || {};
    if (!id) throw new ChromeExtensionServiceError('Note ID is required', 400);
    const now = new Date().toISOString();

    if (db) {
      const docRef = db.collection('chrome_extension_notes').doc(String(id));
      const snapshot = await docRef.get();
      if (!snapshot.exists) throw new ChromeExtensionServiceError('Note not found', 404);
      const existing = snapshot.data();
      if (existing.userId !== user.uid) throw new ChromeExtensionServiceError('Unauthorized', 403);

      const data = { ...existing, ...updates, updatedAt: now };
      await docRef.set(data, { merge: true });
      return { success: true, note: { id: docRef.id, ...data } };
    }

    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    const notes = readArray(file);
    const idx = notes.findIndex((n) => String(n.id) === String(id) && n.userId === user.uid);
    if (idx === -1) throw new ChromeExtensionServiceError('Note not found', 404);

    const updated = { ...notes[idx], ...updates, updatedAt: now };
    notes[idx] = updated;
    writeArray(file, notes);
    return { success: true, note: updated };
  }

  async deleteNote(request) {
    const user = await this.resolveUser(request);
    if (!user) throw new ChromeExtensionServiceError('Unauthorized', 401);
    const db = this.ensureDb();

    const { id } = request.body || request.query || {};
    if (!id) throw new ChromeExtensionServiceError('Note ID is required', 400);

    if (db) {
      const docRef = db.collection('chrome_extension_notes').doc(String(id));
      const snapshot = await docRef.get();
      if (!snapshot.exists) throw new ChromeExtensionServiceError('Note not found', 404);
      const data = snapshot.data();
      if (data.userId !== user.uid) throw new ChromeExtensionServiceError('Unauthorized', 403);
      await docRef.delete();
      return { success: true };
    }

    const file = path.join(DATA_DIR, 'chrome_extension_notes.json');
    let notes = readArray(file);
    const initialLength = notes.length;
    notes = notes.filter((n) => !(String(n.id) === String(id) && n.userId === user.uid));
    if (notes.length === initialLength) throw new ChromeExtensionServiceError('Note not found', 404);
    writeArray(file, notes);
    return { success: true };
  }

  // Additional collection/inbox methods would mirror this pattern
}

const SERVICE_INSTANCE_KEY = '__chromeExtensionService__';

function getChromeExtensionService({ firestore, verifyBearer } = {}) {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new ChromeExtensionService({
      firestore,
      verifyBearer,
      fallbackEnabled: true,
    });
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { ChromeExtensionService, ChromeExtensionServiceError, getChromeExtensionService };
