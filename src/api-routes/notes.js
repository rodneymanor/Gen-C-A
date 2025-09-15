import fs from 'fs';
import path from 'path';
import { getDb, verifyBearer, getCollectionRefByPath } from './utils/firebase-admin.js';

function tsToIso(v, fallbackIso) {
  try {
    if (v?.toDate) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
  } catch {}
  return fallbackIso || new Date().toISOString();
}

function formatNoteDoc(d) {
  const data = d.data();
  const createdFields = (process.env.CONTENT_CREATED_AT_FIELDS || 'createdAt,created,timestamp').split(',').map((s) => s.trim());
  const updatedFields = (process.env.CONTENT_UPDATED_AT_FIELDS || 'updatedAt,updated,modifiedAt').split(',').map((s) => s.trim());
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
  // Prefer env-configured path if present
  const configuredPath = process.env.CONTENT_NOTES_PATH; // e.g., "users/{uid}/notes" or "notes"
  if (configuredPath) {
    try {
      const cref = getCollectionRefByPath(db, configuredPath, uid);
      if (cref) {
        console.log('[notes] Query via configured path:', configuredPath);
        let q = cref;
        if (!configuredPath.includes('{uid}')) {
          const userField = process.env.CONTENT_USER_FIELD || 'userId';
          console.log('[notes] Filtering on field:', userField);
          q = q.where(userField, '==', uid);
        }
        try { q = q.orderBy('createdAt', 'desc'); } catch {}
        const snap = await q.limit(200).get();
        if (!snap.empty) return snap.docs.map((d) => formatNoteDoc(d));
      }
    } catch (e) {
      console.warn('[notes] configured path query failed:', e?.message);
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

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

function ensureStore() {
  const dir = path.dirname(NOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes: [] }, null, 2));
}

function readNotes() {
  ensureStore();
  try {
    const raw = fs.readFileSync(NOTES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.notes) ? parsed.notes : [];
  } catch {
    return [];
  }
}

function writeNotes(notes) {
  ensureStore();
  fs.writeFileSync(NOTES_FILE, JSON.stringify({ notes }, null, 2));
}

function genId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function handleGetNotes(req, res) {
  try {
    console.log('[notes] GET headers', {
      hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
      xClient: req.headers['x-client'] || req.headers['X-Client'],
    });
  } catch {}
  // If authenticated and Firestore available, read user notes from Firestore
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      console.log('[notes] Using Firestore with auth uid:', auth.uid);
      const notes = await fetchUserNotes(db, auth.uid);
      return res.json({ success: true, notes });
    }
  } catch (e) {
    console.warn('[notes] Firestore GET failed, falling back to JSON:', e?.message);
  }

  console.log('[notes] Using JSON store fallback');
  const notes = readNotes();
  res.json({ success: true, notes });
}

export async function handleCreateNote(req, res) {
  try {
    try {
      console.log('[notes] POST headers', {
        hasAuthHeader: !!(req.headers['authorization'] || req.headers['Authorization']),
        xClient: req.headers['x-client'] || req.headers['X-Client'],
      });
    } catch {}
    const body = req.body || {};
    const now = new Date().toISOString();
    const note = {
      id: genId(),
      title: (body.title || 'Untitled').toString(),
      content: (body.content || '').toString(),
      type: (body.type || 'text').toString(),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      starred: Boolean(body.starred),
      createdAt: now,
      updatedAt: now,
      userId: 'local',
    };
    // Try Firestore first
    try {
      const auth = await verifyBearer(req);
      const db = getDb();
      if (auth && db) {
        const toSave = { ...note, id: undefined, userId: auth.uid };
        const configuredPath = process.env.CONTENT_NOTES_PATH;
        const cref = configuredPath ? getCollectionRefByPath(db, configuredPath, auth.uid) : null;
        if (cref) {
          console.log('[notes] Write via configured path:', process.env.CONTENT_NOTES_PATH);
          const ref = await cref.add({ ...toSave, createdAt: new Date(), updatedAt: new Date() });
          const saved = { ...note, id: ref.id, userId: auth.uid };
          return res.json({ success: true, note: saved });
        } else {
          try {
            const subRef = await db
              .collection('users')
              .doc(auth.uid)
              .collection('notes')
              .add({ ...toSave, createdAt: new Date(), updatedAt: new Date() });
            const saved = { ...note, id: subRef.id, userId: auth.uid };
            return res.json({ success: true, note: saved });
          } catch (subErr) {
            const ref = await db.collection('notes').add({ ...toSave, createdAt: new Date(), updatedAt: new Date() });
            const saved = { ...note, id: ref.id, userId: auth.uid };
            return res.json({ success: true, note: saved });
          }
        }
      }
    } catch (e) {
      console.warn('[notes] Firestore POST failed, using JSON store:', e?.message);
    }

    const notes = readNotes();
    notes.unshift(note);
    writeNotes(notes);
    res.json({ success: true, note });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleGetNoteById(req, res) {
  const { id } = req.params;
  // Firestore first
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      let doc = await db.collection('users').doc(auth.uid).collection('notes').doc(id).get();
      if (!doc.exists) {
        doc = await db.collection('notes').doc(id).get();
      }
      if (doc.exists) {
        const note = formatNoteDoc(doc);
        if (note.userId && note.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
        return res.json({ success: true, note });
      }
    }
  } catch (e) {
    console.warn('[notes] Firestore GET by id failed, fallback:', e?.message);
  }

  const notes = readNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, note });
}

export async function handleUpdateNote(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    // Firestore first
    try {
      const auth = await verifyBearer(req);
      const db = getDb();
      if (auth && db) {
        let doc = db.collection('users').doc(auth.uid).collection('notes').doc(id);
        let current = await doc.get();
        if (!current.exists) {
          doc = db.collection('notes').doc(id);
          current = await doc.get();
        }
        if (!current.exists) return res.status(404).json({ success: false, error: 'Not found' });
        const data = current.data();
        if (data.userId && data.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
        const merged = {
          ...data,
          ...body,
          tags: Array.isArray(body.tags) ? body.tags.map(String) : data.tags,
          starred: typeof body.starred === 'boolean' ? body.starred : data.starred,
          updatedAt: new Date(),
        };
        await doc.set(merged, { merge: true });
        const updated = { id, ...merged, updatedAt: merged.updatedAt.toISOString ? merged.updatedAt.toISOString() : new Date().toISOString() };
        return res.json({ success: true, note: updated });
      }
    } catch (e) {
      console.warn('[notes] Firestore PUT failed, fallback JSON:', e?.message);
    }

    const notes = readNotes();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    const updated = {
      ...notes[idx],
      ...body,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : notes[idx].tags,
      starred: typeof body.starred === 'boolean' ? body.starred : notes[idx].starred,
      updatedAt: new Date().toISOString(),
    };
    notes[idx] = updated;
    writeNotes(notes);
    res.json({ success: true, note: updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'Invalid request' });
  }
}

export async function handleDeleteNote(req, res) {
  const { id } = req.params;
  // Firestore first
  try {
    const auth = await verifyBearer(req);
    const db = getDb();
    if (auth && db) {
      let doc = db.collection('users').doc(auth.uid).collection('notes').doc(id);
      let current = await doc.get();
      if (!current.exists) {
        doc = db.collection('notes').doc(id);
        current = await doc.get();
      }
      if (!current.exists) return res.status(404).json({ success: false, error: 'Not found' });
      const data = current.data();
      if (data.userId && data.userId !== auth.uid) return res.status(403).json({ success: false, error: 'Forbidden' });
      await doc.delete();
      return res.json({ success: true });
    }
  } catch (e) {
    console.warn('[notes] Firestore DELETE failed, fallback JSON:', e?.message);
  }

  const notes = readNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  notes.splice(idx, 1);
  writeNotes(notes);
  res.json({ success: true });
}
