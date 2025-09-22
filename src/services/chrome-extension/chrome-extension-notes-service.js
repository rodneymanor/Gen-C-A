import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

class ChromeExtensionNotesServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'ChromeExtensionNotesServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function ensureFile(filePath, initial = { items: [] }) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
}

function readArray(filePath) {
  ensureFile(filePath, { items: [] });
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    const altKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    return altKey ? parsed[altKey] : [];
  } catch {
    return [];
  }
}

function writeArray(filePath, arr, key = 'items') {
  ensureFile(filePath, { [key]: [] });
  try {
    const data = { [key]: arr };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {}
}

function createVoiceTokenTracker(db) {
  if (!db) return null;

  return async function trackVoiceTokens(userId, usage = {}) {
    if (!userId || !usage || !usage.totalTokens) return;

    const timestamp = usage.timestamp || new Date().toISOString();
    const safeUsage = {
      noteId: usage.noteId,
      service: usage.service || 'gemini',
      inputTokens: Number(usage.inputTokens) || 0,
      outputTokens: Number(usage.outputTokens) || 0,
      totalTokens: Number(usage.totalTokens) || 0,
      audioDuration: usage.audioDuration ?? usage.originalAudioDuration,
      language: usage.language,
      timestamp,
    };

    await db.collection('voice_note_token_usage').add({
      userId,
      ...safeUsage,
      createdAt: timestamp,
    });

    const monthKey = timestamp.slice(0, 7);
    const statsRef = db.collection('user_voice_stats').doc(`${userId}_${monthKey}`);

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(statsRef);
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        tx.update(statsRef, {
          totalTokens: (data.totalTokens || 0) + safeUsage.totalTokens,
          totalNotes: (data.totalNotes || 0) + 1,
          totalAudioDuration: (data.totalAudioDuration || 0) + (safeUsage.audioDuration || 0),
          lastUsedAt: timestamp,
        });
        return;
      }

      tx.set(statsRef, {
        userId,
        month: monthKey,
        totalTokens: safeUsage.totalTokens,
        totalNotes: 1,
        totalAudioDuration: safeUsage.audioDuration || 0,
        firstUsedAt: timestamp,
        lastUsedAt: timestamp,
        createdAt: timestamp,
      });
    });
  };
}

class ChromeExtensionNotesService {
  constructor({ firestore, tokenTracker, fallbackDir = DATA_DIR }) {
    this.db = firestore || null;
    const providedTracker = typeof tokenTracker === 'function' ? tokenTracker : null;
    this.tokenTracker = providedTracker || createVoiceTokenTracker(this.db);
    this.fallbackDir = fallbackDir;
  }

  get notesFile() {
    return path.join(this.fallbackDir, 'chrome_extension_notes.json');
  }

  async listNotes(userId, { noteId, limit = 50, type, search, tags } = {}) {
    if (!userId) throw new ChromeExtensionNotesServiceError('User ID is required', 401);
    const db = this.db;

    if (noteId) {
      const note = await this.getNoteById(userId, noteId);
      if (!note) throw new ChromeExtensionNotesServiceError('Note not found', 404);
      return { success: true, note };
    }

    const notes = await this.queryNotes(userId, { limit, type, search, tags });
    return { success: true, notes, count: notes.length };
  }

  async getNoteById(userId, noteId) {
    if (!userId || !noteId) return null;
    if (this.db) {
      const doc = await this.db.collection('chrome_extension_notes').doc(String(noteId)).get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (data.userId !== userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 403);
      return { id: doc.id, ...data };
    }

    const notes = readArray(this.notesFile);
    return notes.find((note) => String(note.id) === String(noteId) && note.userId === userId) || null;
  }

  async queryNotes(userId, { limit = 50, type, search, tags } = {}) {
    let notes = [];

    if (this.db) {
      let query = this.db
        .collection('chrome_extension_notes')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(Math.min(limit, 100));
      if (type) query = query.where('type', '==', String(type));
      const snap = await query.get();
      notes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      notes = readArray(this.notesFile)
        .filter((note) => note.userId === userId)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, Math.min(limit, 100));
      if (type) notes = notes.filter((note) => note.type === String(type));
    }

    if (search) {
      const searchLower = String(search).toLowerCase();
      notes = notes.filter(
        (note) =>
          String(note.title || '').toLowerCase().includes(searchLower) ||
          String(note.content || '').toLowerCase().includes(searchLower),
      );
    }

    if (tags) {
      const tagList = String(tags)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tagList.length) {
        notes = notes.filter((note) => Array.isArray(note.tags) && tagList.some((tag) => note.tags.includes(tag)));
      }
    }

    return notes;
  }

  normalizeMetadata(metadata, url) {
    const normalized = metadata && typeof metadata === 'object' ? { ...metadata } : {};
    if (url) {
      try {
        const domain = new URL(String(url)).hostname;
        if (domain) normalized.domain = domain;
      } catch {}
    }
    return normalized;
  }

  async createNote(userId, payload = {}) {
    if (!userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 401);
    const { title, content, url, type = 'text', tags = [], metadata = {} } = payload;

    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      throw new ChromeExtensionNotesServiceError('Title and content are required', 400);
    }

    const now = new Date().toISOString();
    const note = {
      title: String(title).trim(),
      content: String(content).trim(),
      url: url ? String(url).trim() : undefined,
      type,
      tags: Array.isArray(tags) ? tags.filter((tag) => String(tag).trim()) : [],
      metadata: this.normalizeMetadata(metadata, url),
      createdAt: now,
      updatedAt: now,
      userId,
    };

    let savedNote;

    if (this.db) {
      const docRef = await this.db.collection('chrome_extension_notes').add(note);
      savedNote = { id: docRef.id, ...note };
    } else {
      const notes = readArray(this.notesFile);
      const id = `local-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      savedNote = { id, ...note };
      writeArray(this.notesFile, [savedNote, ...notes]);
    }

    await this.trackVoiceTokensIfNeeded(userId, savedNote);
    return { success: true, note: savedNote };
  }

  async updateNote(userId, payload = {}) {
    if (!userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 401);
    const { noteId, title, content, tags, metadata } = payload;
    if (!noteId) throw new ChromeExtensionNotesServiceError('Note ID is required', 400);

    const now = new Date().toISOString();

    if (this.db) {
      const docRef = this.db.collection('chrome_extension_notes').doc(String(noteId));
      const snapshot = await docRef.get();
      if (!snapshot.exists) throw new ChromeExtensionNotesServiceError('Note not found', 404);
      const existing = snapshot.data();
      if (existing.userId !== userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 403);

      const update = { updatedAt: now };
      if (title !== undefined) update.title = String(title).trim();
      if (content !== undefined) update.content = String(content).trim();
      if (tags !== undefined) update.tags = Array.isArray(tags) ? tags.filter((tag) => String(tag).trim()) : [];
      if (metadata !== undefined)
        update.metadata = this.normalizeMetadata({ ...(existing.metadata || {}), ...metadata }, existing.url);

      await docRef.set(update, { merge: true });
      return { success: true, note: { id: docRef.id, ...existing, ...update } };
    }

    const notes = readArray(this.notesFile);
    const idx = notes.findIndex((note) => String(note.id) === String(noteId) && note.userId === userId);
    if (idx === -1) throw new ChromeExtensionNotesServiceError('Note not found', 404);

    const updated = { ...notes[idx], updatedAt: now };
    if (title !== undefined) updated.title = String(title).trim();
    if (content !== undefined) updated.content = String(content).trim();
    if (tags !== undefined)
      updated.tags = Array.isArray(tags) ? tags.filter((tag) => String(tag).trim()) : [];
    if (metadata !== undefined)
      updated.metadata = this.normalizeMetadata({ ...(notes[idx].metadata || {}), ...metadata }, notes[idx].url);

    notes[idx] = updated;
    writeArray(this.notesFile, notes);
    return { success: true, note: updated };
  }

  async deleteNote(userId, noteId) {
    if (!userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 401);
    if (!noteId) throw new ChromeExtensionNotesServiceError('Note ID is required', 400);

    if (this.db) {
      const docRef = this.db.collection('chrome_extension_notes').doc(String(noteId));
      const snapshot = await docRef.get();
      if (!snapshot.exists) throw new ChromeExtensionNotesServiceError('Note not found', 404);
      const data = snapshot.data();
      if (data.userId !== userId) throw new ChromeExtensionNotesServiceError('Unauthorized', 403);
      await docRef.delete();
      return { success: true };
    }

    const notes = readArray(this.notesFile);
    const filtered = notes.filter((note) => !(String(note.id) === String(noteId) && note.userId === userId));
    if (filtered.length === notes.length) throw new ChromeExtensionNotesServiceError('Note not found', 404);
    writeArray(this.notesFile, filtered);
    return { success: true };
  }

  async trackVoiceTokensIfNeeded(userId, note) {
    const voiceMetadata = note?.metadata?.voiceMetadata;
    if (!voiceMetadata || !voiceMetadata.totalTokens || !this.tokenTracker) return;

    try {
      await this.tokenTracker(userId, {
        noteId: note.id,
        service: voiceMetadata.transcriptionService ?? 'gemini',
        inputTokens: voiceMetadata.inputTokens ?? 0,
        outputTokens: voiceMetadata.outputTokens ?? 0,
        totalTokens: voiceMetadata.totalTokens,
        audioDuration: voiceMetadata.originalAudioDuration,
        language: voiceMetadata.language,
        timestamp: note.updatedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.warn('[ChromeExtensionNotesService] Failed to track voice tokens:', error?.message || error);
    }
  }
}

const SERVICE_INSTANCE_KEY = '__chromeExtensionNotesService__';

function getChromeExtensionNotesService(options = {}) {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new ChromeExtensionNotesService(options);
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export {
  ChromeExtensionNotesService,
  ChromeExtensionNotesServiceError,
  createVoiceTokenTracker,
  getChromeExtensionNotesService,
};
