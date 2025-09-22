import { getCollectionRefByPath } from '../../api-routes/utils/firebase-admin.js';

class ScriptsServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ScriptsServiceError';
    this.statusCode = statusCode;
  }
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry));
  }

  if (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    return Object.entries(value).reduce((acc, [key, entryValue]) => {
      if (entryValue !== undefined) {
        acc[key] = stripUndefined(entryValue);
      }
      return acc;
    }, {});
  }

  return value;
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
    console.warn('[ScriptsService] Failed to convert timestamp:', error?.message || error);
  }
  if (fallbackIso && fallbackIso.trim()) {
    return fallbackIso;
  }
  return new Date().toISOString();
}

function formatScriptDoc(doc) {
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

async function fetchUserScripts(db, uid) {
  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
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
          console.warn('[ScriptsService] Failed to order configured path scripts:', error?.message || error);
        }
        const snapshot = await query.limit(200).get();
        if (!snapshot.empty) {
          return snapshot.docs.map((doc) => formatScriptDoc(doc));
        }
      }
    } catch (error) {
      console.warn('[ScriptsService] Configured path lookup failed:', error?.message || error);
    }
  }

  try {
    const subSnap = await db
      .collection('users')
      .doc(uid)
      .collection('scripts')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((doc) => formatScriptDoc(doc));
    }
  } catch (error) {
    console.warn('[ScriptsService] Subcollection lookup failed:', error?.message || error);
  }

  for (const userField of ['userId', 'uid', 'owner']) {
    try {
      const rootSnap = await db
        .collection('scripts')
        .where(userField, '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      if (!rootSnap.empty) {
        return rootSnap.docs.map((doc) => formatScriptDoc(doc));
      }
    } catch (error) {
      console.warn('[ScriptsService] Root collection lookup failed:', error?.message || error);
    }
  }

  return [];
}

async function persistScript(db, uid, script) {
  const timestamps = { createdAt: new Date(), updatedAt: new Date() };
  const payload = stripUndefined({ ...script, userId: uid, ...timestamps });
  delete payload.id;

  const normalizeResponse = (id) => ({
    ...stripUndefined(script),
    id,
    userId: uid,
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  });

  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
  if (configuredPath) {
    try {
      const configuredRef = getCollectionRefByPath(db, configuredPath, uid);
      if (configuredRef) {
        const ref = await configuredRef.add(payload);
        return normalizeResponse(ref.id);
      }
      console.warn('[ScriptsService] CONTENT_SCRIPTS_PATH resolved to null collection ref:', configuredPath);
    } catch (error) {
      console.warn('[ScriptsService] Failed to persist script to configured path:', error?.message || error);
    }
  }

  try {
    const subRef = await db.collection('users').doc(uid).collection('scripts').add(payload);
    return normalizeResponse(subRef.id);
  } catch (error) {
    console.warn('[ScriptsService] Persist via subcollection failed, falling back to root:', error?.message || error);
    const ref = await db.collection('scripts').add(payload);
    return normalizeResponse(ref.id);
  }
}

async function resolveScriptDocRef(db, uid, id) {
  let docRef = db.collection('users').doc(uid).collection('scripts').doc(id);
  let snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  docRef = db.collection('scripts').doc(id);
  snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
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
      console.warn('[ScriptsService] resolveScriptDocRef configured path failed:', error?.message || error);
    }
  }

  return null;
}

async function findScriptById(db, uid, id) {
  const docRef = await resolveScriptDocRef(db, uid, id);
  if (!docRef) {
    return null;
  }
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return null;
  }
  return formatScriptDoc(snapshot);
}

class ScriptsService {
  constructor(firestore) {
    if (!firestore) {
      throw new Error('Firestore instance is required to initialize ScriptsService');
    }
    this.db = firestore;
  }

  sanitizeCreatePayload(payload) {
    const base = payload || {};
    const content = (base.content ?? '').toString();
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const normalizedVoice =
      base.voice && typeof base.voice === 'object' ? stripUndefined(base.voice) : base.voice;

    return {
      title: base.title || 'Untitled Script',
      content,
      authors: 'You',
      status: base.status || 'draft',
      performance: { views: 0, engagement: 0 },
      category: base.category || 'General',
      viewedAt: new Date().toISOString(),
      duration: '0:30',
      tags: Array.isArray(base.tags) ? base.tags.map(String) : [],
      fileType: base.fileType || 'Script',
      summary: base.summary || content.slice(0, 160),
      approach: base.approach || 'educational',
      voice: normalizedVoice,
      originalIdea: base.originalIdea,
      targetLength: base.targetLength,
      source: base.source,
      scheduledDate: base.scheduledDate,
      platform: base.platform,
      isThread: base.isThread,
      threadParts: Array.isArray(base.threadParts) ? base.threadParts.map(String) : base.threadParts,
      wordCount,
      characterCount: content.length,
      elements: base.elements,
      publishedUrl: base.publishedUrl,
    };
  }

  sanitizeUpdatePayload(payload) {
    const updates = stripUndefined(payload || {});
    if (updates.content !== undefined) {
      updates.content = updates.content == null ? '' : updates.content.toString();
      const trimmed = updates.content.trim();
      updates.wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
      updates.characterCount = updates.content.length;
    }
    if (updates.title !== undefined) {
      updates.title = updates.title == null ? '' : updates.title.toString();
    }
    if (Array.isArray(updates.tags)) {
      updates.tags = updates.tags.map(String);
    }
    if (updates.threadParts !== undefined && Array.isArray(updates.threadParts)) {
      updates.threadParts = updates.threadParts.map(String);
    }
    if (updates.summary !== undefined && typeof updates.summary !== 'string') {
      updates.summary = String(updates.summary ?? '');
    }
    if (updates.voice && typeof updates.voice === 'object') {
      updates.voice = stripUndefined(updates.voice);
    }
    return updates;
  }

  async listScripts(userId) {
    return fetchUserScripts(this.db, userId);
  }

  async createScript(userId, payload) {
    const script = this.sanitizeCreatePayload(payload);
    return persistScript(this.db, userId, script);
  }

  async getScriptById(userId, scriptId) {
    const script = await findScriptById(this.db, userId, scriptId);
    if (!script) {
      throw new ScriptsServiceError('Not found', 404);
    }
    if (script.userId && script.userId !== userId) {
      throw new ScriptsServiceError('Forbidden', 403);
    }
    return script;
  }

  async updateScript(userId, scriptId, payload) {
    const docRef = await resolveScriptDocRef(this.db, userId, scriptId);
    if (!docRef) {
      throw new ScriptsServiceError('Not found', 404);
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw new ScriptsServiceError('Not found', 404);
    }

    const data = snapshot.data() || {};
    if (data.userId && data.userId !== userId) {
      throw new ScriptsServiceError('Forbidden', 403);
    }

    const sanitized = this.sanitizeUpdatePayload(payload);
    const nextUpdatedAt = new Date();

    await docRef.set({ ...sanitized, updatedAt: nextUpdatedAt }, { merge: true });
    const updatedSnapshot = await docRef.get();
    return formatScriptDoc(updatedSnapshot);
  }

  async deleteScript(userId, scriptId) {
    const docRef = await resolveScriptDocRef(this.db, userId, scriptId);
    if (!docRef) {
      throw new ScriptsServiceError('Not found', 404);
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw new ScriptsServiceError('Not found', 404);
    }

    const data = snapshot.data() || {};
    if (data.userId && data.userId !== userId) {
      throw new ScriptsServiceError('Forbidden', 403);
    }

    await docRef.delete();
  }
}

const SERVICE_INSTANCE_KEY = '__scriptsService__';

function getScriptsService(firestore) {
  if (!firestore) {
    throw new Error('Firestore instance is required to get ScriptsService');
  }
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new ScriptsService(firestore);
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export {
  ScriptsService,
  ScriptsServiceError,
  stripUndefined,
  formatScriptDoc,
  fetchUserScripts,
  persistScript,
  resolveScriptDocRef,
  findScriptById,
  getScriptsService,
};
