import { getDb, verifyBearer } from './utils/firebase-admin.js';

function tsToIso(v, fallbackIso) {
  try {
    if (v?.toDate) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
  } catch {}
  return fallbackIso || new Date().toISOString();
}

function formatNoteDoc(d) {
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

async function fetchUserNotes(db, uid) {
  try {
    const subSnap = await db
      .collection('users')
      .doc(uid)
      .collection('notes')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    if (!subSnap.empty) return subSnap.docs.map((d) => formatNoteDoc(d));
  } catch (e) {}

  for (const userField of ['userId', 'uid', 'owner']) {
    try {
      const qSnap = await db
        .collection('notes')
        .where(userField, '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
      if (!qSnap.empty) return qSnap.docs.map((d) => formatNoteDoc(d));
    } catch (e) {}
  }

  return [];
}

export async function handleGetNotes(req, res) {
  try {
    console.log('[notes] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  const authResult = await verifyBearer(req);

  if (!authResult) {
    console.warn('[notes] Missing or invalid auth token for library fetch');
    return res.status(401).json({
      success: false,
      error: 'Authentication required to load notes.'
    });
  }

  const db = getDb();
  if (!db) {
    console.error('[notes] Firestore unavailable while fetching notes');
    return res.status(503).json({
      success: false,
      error: 'Content service is unavailable. Please try again later.'
    });
  }

  try {
    console.log('[notes] Using Firestore with auth uid:', authResult.uid);
    const notes = await fetchUserNotes(db, authResult.uid);
    return res.json({ success: true, notes });
  } catch (e) {
    console.error('[notes] Failed to fetch notes from Firestore:', e?.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to load notes from Firestore.'
    });
  }
}

export async function handleCreateNote(req, res) {
  try {
    try {
      console.log('[notes] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}

    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to save notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while creating note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    const body = req.body || {};
    const now = new Date();
    const note = {
      title: (body.title || 'Untitled').toString(),
      content: (body.content || '').toString(),
      type: (body.type || 'text').toString(),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      starred: Boolean(body.starred),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      userId: auth.uid,
    };

    try {
      const saved = await persistNote(db, auth.uid, note);
      return res.json({ success: true, note: saved });
    } catch (error) {
      console.error('[notes] Failed to save note to Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to save note to Firestore.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetNoteById(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to load notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while fetching note by id');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    const note = await findNoteById(db, auth.uid, id);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (note.userId && note.userId !== auth.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, note });
  } catch (e) {
    console.error('[notes] Failed to fetch note by id:', e?.message);
    return res.status(500).json({ success: false, error: 'Failed to load note.' });
  }
}

export async function handleUpdateNote(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to update notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while updating note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const docRef = await resolveNoteDocRef(db, auth.uid, id);
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

      const merged = {
        ...data,
        ...body,
        tags: Array.isArray(body.tags) ? body.tags.map(String) : data.tags,
        starred: typeof body.starred === 'boolean' ? body.starred : data.starred,
        updatedAt: new Date(),
      };

      await docRef.set(merged, { merge: true });
      const updated = {
        id,
        ...merged,
        updatedAt: merged.updatedAt instanceof Date ? merged.updatedAt.toISOString() : new Date().toISOString(),
      };

      return res.json({ success: true, note: updated });
    } catch (error) {
      console.error('[notes] Failed to update note in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to update note.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteNote(req, res) {
  const { id } = req.params;
  try {
    const auth = await verifyBearer(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete notes.' });
    }

    const db = getDb();
    if (!db) {
      console.error('[notes] Firestore unavailable while deleting note');
      return res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    }

    try {
      const docRef = await resolveNoteDocRef(db, auth.uid, id);
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
      console.error('[notes] Failed to delete note in Firestore:', error?.message);
      return res.status(500).json({ success: false, error: 'Failed to delete note.' });
    }
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

async function persistNote(db, uid, note) {
  const timestamps = { createdAt: new Date(), updatedAt: new Date() };
  const payload = { ...note, userId: uid, ...timestamps };
  delete payload.id;

  try {
    const subRef = await db.collection('users').doc(uid).collection('notes').add(payload);
    return { ...note, id: subRef.id, userId: uid, createdAt: timestamps.createdAt.toISOString(), updatedAt: timestamps.updatedAt.toISOString() };
  } catch {
    const ref = await db.collection('notes').add(payload);
    return { ...note, id: ref.id, userId: uid, createdAt: timestamps.createdAt.toISOString(), updatedAt: timestamps.updatedAt.toISOString() };
  }
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
