import { getDb, getCollectionRefByPath, verifyBearer } from './utils/firebase-admin.js';

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
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

function tsToIso(v, fallbackIso) {
  try {
    if (v?.toDate) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
  } catch {}
  return fallbackIso || new Date().toISOString();
}

function formatScriptDoc(d) {
  const data = d.data();
  const createdFields = ['createdAt', 'created', 'timestamp'];
  const updatedFields = ['updatedAt', 'updated', 'modifiedAt'];
  const createdRaw = createdFields.map((k) => data[k]).find((v) => v != null);
  const updatedRaw = updatedFields.map((k) => data[k]).find((v) => v != null);
  return {
    id: d.id,
    ...data,
    createdAt: tsToIso(createdRaw),
    updatedAt: tsToIso(updatedRaw, tsToIso(createdRaw)),
  };
}

async function fetchUserScripts(db, uid) {
  // Try subcollection: users/{uid}/scripts
  try {
    const subSnap = await db
      .collection('users')
      .doc(uid)
      .collection('scripts')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    if (!subSnap.empty) {
      return subSnap.docs.map((d) => formatScriptDoc(d));
    }
  } catch (e) {}

  // Try root collection with different user field keys
  for (const userField of ['userId', 'uid', 'owner']) {
    try {
      const qSnap = await db
        .collection('scripts')
        .where(userField, '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      if (!qSnap.empty) {
        return qSnap.docs.map((d) => formatScriptDoc(d));
      }
    } catch (e) {}
  }

  return [];
}

export async function handleGetScripts(req, res) {
  try {
    console.log('[scripts] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  const authResult = await verifyBearer(req);

  if (!authResult) {
    console.warn('[scripts] Missing or invalid auth token for library fetch');
    return res.status(401).json({
      success: false,
      error: 'Authentication required to load scripts.'
    });
  }

  const db = getDb();
  if (!db) {
    console.error('[scripts] Firestore unavailable while fetching scripts');
    return res.status(503).json({
      success: false,
      error: 'Content service is unavailable. Please try again later.'
    });
  }

  try {
    console.log('[scripts] Using Firestore with auth uid:', authResult.uid);
    const scripts = await fetchUserScripts(db, authResult.uid);
    return res.json({ success: true, scripts });
  } catch (e) {
    console.error('[scripts] Failed to fetch scripts from Firestore:', e?.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to load scripts from Firestore.'
    });
  }
}

export async function handleCreateScript(req, res) {
  try {
    try {
      console.log('[scripts] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}

    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to save scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while creating script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    const body = req.body || {};
    const now = new Date();
    const content = (body.content || '').toString();
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    const normalizedVoice =
      body.voice && typeof body.voice === 'object'
        ? stripUndefined(body.voice)
        : body.voice;

    const baseScript = {
      title: body.title || 'Untitled Script',
      content,
      authors: 'You',
      status: body.status || 'draft',
      performance: { views: 0, engagement: 0 },
      category: body.category || 'General',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      viewedAt: now.toISOString(),
      duration: '0:30',
      tags: Array.isArray(body.tags) ? body.tags : [],
      fileType: 'Script',
      summary: body.summary || content.slice(0, 160),
      userId: auth.uid,
      approach: body.approach || 'educational',
      ...(normalizedVoice !== undefined ? { voice: normalizedVoice } : {}),
      originalIdea: body.originalIdea,
      targetLength: body.targetLength,
      source: body.source,
      scheduledDate: body.scheduledDate,
      platform: body.platform,
      isThread: body.isThread,
      threadParts: body.threadParts,
      wordCount,
      characterCount: content.length,
    };

    try {
      const saved = await persistScript(db, auth.uid, baseScript);
      return res.json({ success: true, script: saved });
    } catch (error) {
      console.error('[scripts] Failed to save script to Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to save script to Firestore.' });
    }
  } catch (e) {
    return res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetScriptById(req, res) {
  const { id } = req.params;
  // Try Firestore first
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to load scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while fetching by id');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    const script = await findScriptById(db, auth.uid, id);
    if (!script) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (script.userId && script.userId !== auth.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, script });
  } catch (e) {
    console.error('[scripts] Failed to fetch script by id:', e?.message);
    return res.status(500).json({ success: false, error: 'Failed to load script.' });
  }
}

export async function handleUpdateScript(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to update scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while updating script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const docRef = await resolveScriptDocRef(db, auth.uid, id);
      if (!docRef) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      const data = snapshot.data() || {};
      if (data.userId && data.userId !== auth.uid) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const nextUpdatedAt = new Date();
      const normalizedUpdates = { ...updates };
      if (Array.isArray(updates.tags)) {
        normalizedUpdates.tags = updates.tags.map(String);
      }
      if (typeof updates.starred === 'boolean' || updates.starred === null) {
        normalizedUpdates.starred = updates.starred;
      }
      const sanitized = stripUndefined({ ...normalizedUpdates, updatedAt: nextUpdatedAt });
      await docRef.set(sanitized, { merge: true });
      const updated = {
        id,
        ...stripUndefined({ ...data, ...sanitized }),
        updatedAt: nextUpdatedAt.toISOString(),
      };
      return res.json({ success: true, script: updated });
    } catch (error) {
      console.error('[scripts] Failed to update script in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to update script.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteScript(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete scripts.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[scripts] Firestore unavailable while deleting script');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const docRef = await resolveScriptDocRef(db, auth.uid, id);
      if (!docRef) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      const data = snapshot.data() || {};
      if (data.userId && data.userId !== auth.uid) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      await docRef.delete();
      return res.json({ success: true });
    } catch (error) {
      console.error('[scripts] Failed to delete script in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to delete script.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
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
      console.warn('[scripts] CONTENT_SCRIPTS_PATH resolved to no collection ref:', configuredPath);
    } catch (error) {
      console.warn('[scripts] Failed to persist script to configured path:', configuredPath, error?.message);
    }
  }

  try {
    const subRef = await db.collection('users').doc(uid).collection('scripts').add(payload);
    return normalizeResponse(subRef.id);
  } catch (error) {
    console.warn('[scripts] Fallback to root scripts collection:', error?.message);
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
