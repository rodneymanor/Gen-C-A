import { getCollectionRefByPath } from '../../api-routes/utils/firebase-admin.js';

class NotesServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'NotesServiceError';
    this.statusCode = statusCode;
  }
}

function tsToIso(value, fallbackIso) {
  try {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  } catch (error) {
    console.warn('[NotesService] Failed to convert timestamp:', error?.message || error);
  }
  if (fallbackIso && fallbackIso.trim()) {
    return fallbackIso;
  }
  return new Date().toISOString();
}

function formatNoteDoc(doc) {
  const data = doc.data() || {};
  const createdFields = (process.env.CONTENT_CREATED_AT_FIELDS || 'createdAt,created,timestamp')
    .split(',')
    .map((field) => field.trim());
  const updatedFields = (process.env.CONTENT_UPDATED_AT_FIELDS || 'updatedAt,updated,modifiedAt')
    .split(',')
    .map((field) => field.trim());

  const createdRaw = createdFields.map((key) => data[key]).find((value) => value != null);
  const fallbackCreated = typeof data.createdAt === 'string' ? data.createdAt : undefined;
  const createdAt = tsToIso(createdRaw, fallbackCreated);

  const updatedRaw = updatedFields.map((key) => data[key]).find((value) => value != null);
  const fallbackUpdated = typeof data.updatedAt === 'string' ? data.updatedAt : createdAt;
  const updatedAt = tsToIso(updatedRaw, fallbackUpdated);

  return {
    ...data,
    id: doc.id,
    createdAt,
    updatedAt,
  };
}

async function fetchUserNotes(db, uid) {
  const configuredPath = process.env.CONTENT_NOTES_PATH;
  if (configuredPath) {
    try {
      const ref = getCollectionRefByPath(db, configuredPath, uid);
      if (ref) {
        let query = ref;
        if (!configuredPath.includes('{uid}')) {
          const userField = process.env.CONTENT_USER_FIELD || 'userId';
          query = query.where(userField, '==', uid);
        }
        try {
          query = query.orderBy('createdAt', 'desc');
        } catch (error) {
          console.warn('[NotesService] Failed to apply createdAt ordering for configured path:', error?.message || error);
        }
        const snapshot = await query.limit(200).get();
        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => formatNoteDoc(doc));
        }
      }
    } catch (error) {
      console.warn('[NotesService] Configured path lookup failed:', error?.message || error);
    }
  }

  try {
    const subSnap = await db
      .collection('users')
      .doc(uid)
      .collection('notes')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((doc) => formatNoteDoc(doc));
    }
  } catch (error) {
    console.warn('[NotesService] Subcollection lookup failed:', error?.message || error);
  }

  for (const userField of ['userId', 'uid', 'owner']) {
    try {
      const rootSnap = await db
        .collection('notes')
        .where(userField, '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      if (!rootSnap.empty) {
        return rootSnap.docs.map((doc) => formatNoteDoc(doc));
      }
    } catch (error) {
      console.warn('[NotesService] Root collection lookup failed:', error?.message || error);
    }
  }

  return [];
}

async function persistNote(db, uid, note) {
  const timestamps = { createdAt: new Date(), updatedAt: new Date() };
  const payload = {
    ...note,
    userId: uid,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };

  const configuredPath = process.env.CONTENT_NOTES_PATH;
  if (configuredPath) {
    try {
      const ref = getCollectionRefByPath(db, configuredPath, uid);
      if (ref) {
        const docRef = await ref.add(payload);
        return {
          ...note,
          id: docRef.id,
          userId: uid,
          createdAt: timestamps.createdAt.toISOString(),
          updatedAt: timestamps.updatedAt.toISOString(),
        };
      }
    } catch (error) {
      console.warn('[NotesService] Persist via configured path failed:', error?.message || error);
    }
  }

  try {
    const subRef = await db
      .collection('users')
      .doc(uid)
      .collection('notes')
      .add(payload);
    return {
      ...note,
      id: subRef.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    };
  } catch (error) {
    console.warn('[NotesService] Persist via subcollection failed:', error?.message || error);
  }

  const rootRef = await db.collection('notes').add(payload);
  return {
    ...note,
    id: rootRef.id,
    userId: uid,
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  };
}

async function resolveNoteDocRef(db, uid, id) {
  let docRef = db.collection('users').doc(uid).collection('notes').doc(id);
  let snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  docRef = db.collection('notes').doc(id);
  snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  const configuredPath = process.env.CONTENT_NOTES_PATH;
  if (configuredPath) {
    try {
      const collection = getCollectionRefByPath(db, configuredPath, uid);
      if (collection) {
        const configuredDoc = collection.doc(id);
        const configuredSnapshot = await configuredDoc.get();
        if (configuredSnapshot.exists) {
          return configuredDoc;
        }
      }
    } catch (error) {
      console.warn('[NotesService] resolveNoteDocRef configured path failed:', error?.message || error);
    }
  }

  return null;
}

async function findNoteById(db, uid, id) {
  const docRef = await resolveNoteDocRef(db, uid, id);
  if (!docRef) {
    return null;
  }
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }
  return formatNoteDoc(snapshot);
}

class NotesService {
  constructor(firestore) {
    if (!firestore) {
      throw new Error('Firestore instance is required to initialize NotesService');
    }
    this.db = firestore;
  }

  sanitizeCreatePayload(payload) {
    const base = payload || {};
    return {
      title: (base.title ?? 'Untitled').toString(),
      content: (base.content ?? '').toString(),
      type: (base.type ?? 'text').toString(),
      tags: Array.isArray(base.tags) ? base.tags.map(String) : [],
      starred: Boolean(base.starred),
    };
  }

  sanitizeUpdatePayload(payload) {
    const updates = payload || {};
    const normalized = { ...updates };

    if (updates.title !== undefined) {
      normalized.title = updates.title == null ? '' : updates.title.toString();
    }
    if (updates.content !== undefined) {
      normalized.content = updates.content == null ? '' : updates.content.toString();
    }
    if (updates.type !== undefined) {
      normalized.type = updates.type == null ? 'text' : updates.type.toString();
    }
    if (Array.isArray(updates.tags)) {
      normalized.tags = updates.tags.map(String);
    }
    if (typeof updates.starred === 'boolean') {
      normalized.starred = updates.starred;
    }

    return normalized;
  }

  async listNotes(userId) {
    return fetchUserNotes(this.db, userId);
  }

  async createNote(userId, payload) {
    const note = this.sanitizeCreatePayload(payload);
    return persistNote(this.db, userId, note);
  }

  async getNoteById(userId, noteId) {
    const note = await findNoteById(this.db, userId, noteId);
    if (!note) {
      throw new NotesServiceError('Not found', 404);
    }
    if (note.userId && note.userId !== userId) {
      throw new NotesServiceError('Forbidden', 403);
    }
    return note;
  }

  async updateNote(userId, noteId, payload) {
    const docRef = await resolveNoteDocRef(this.db, userId, noteId);
    if (!docRef) {
      throw new NotesServiceError('Not found', 404);
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw new NotesServiceError('Not found', 404);
    }

    const data = snapshot.data() || {};
    if (data.userId && data.userId !== userId) {
      throw new NotesServiceError('Forbidden', 403);
    }

    const merged = { ...data, ...this.sanitizeUpdatePayload(payload) };
    if (!Array.isArray(merged.tags)) {
      merged.tags = Array.isArray(data.tags) ? data.tags : [];
    }
    if (typeof payload?.starred !== 'boolean' && typeof merged.starred !== 'boolean') {
      merged.starred = Boolean(merged.starred);
    }

    merged.updatedAt = new Date();

    await docRef.set(merged, { merge: true });
    const updatedSnapshot = await docRef.get();
    return formatNoteDoc(updatedSnapshot);
  }

  async deleteNote(userId, noteId) {
    const docRef = await resolveNoteDocRef(this.db, userId, noteId);
    if (!docRef) {
      throw new NotesServiceError('Not found', 404);
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw new NotesServiceError('Not found', 404);
    }

    const data = snapshot.data() || {};
    if (data.userId && data.userId !== userId) {
      throw new NotesServiceError('Forbidden', 403);
    }

    await docRef.delete();
  }
}

const SERVICE_INSTANCE_KEY = '__notesService__';

function getNotesService(firestore) {
  if (!firestore) {
    throw new Error('Firestore instance is required to get NotesService');
  }
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new NotesService(firestore);
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export {
  NotesService,
  NotesServiceError,
  formatNoteDoc,
  fetchUserNotes,
  persistNote,
  resolveNoteDocRef,
  findNoteById,
  getNotesService,
};
